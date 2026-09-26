import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_full_inventory_flow_and_ledger(client: AsyncClient, manager_headers: dict):
    # Setup 2 Locations
    loc_a_resp = await client.post(
        "/api/v1/locations", json={"name": "Main Store", "type": "WAREHOUSE"}, headers=manager_headers
    )
    loc_a_id = loc_a_resp.json()["id"]

    loc_b_resp = await client.post(
        "/api/v1/locations", json={"name": "Production Rack", "type": "RACK"}, headers=manager_headers
    )
    loc_b_id = loc_b_resp.json()["id"]

    # Setup Product
    prod_resp = await client.post(
        "/api/v1/products",
        json={
            "name": "Industrial Steel",
            "sku": "IND-STEEL",
            "category": "Metals",
            "unit_of_measure": "kg",
            "low_stock_threshold": "15.00",
            "initial_stock": "0.00",
        },
        headers=manager_headers,
    )
    prod_id = prod_resp.json()["id"]

    # -------------------------------------------------------------
    # Step 1: RECEIPT (Vendor items arrive: 100 kg at Main Store)
    # -------------------------------------------------------------
    receipt_doc_resp = await client.post(
        "/api/v1/documents",
        json={
            "type": "RECEIPT",
            "destination_location_id": loc_a_id,
            "notes": "Incoming vendor shipment #9876",
            "items": [{"product_id": prod_id, "quantity": "100.00"}],
        },
        headers=manager_headers,
    )
    assert receipt_doc_resp.status_code == 201
    receipt_doc_id = receipt_doc_resp.json()["id"]

    # Validate receipt -> increases stock
    val_resp = await client.post(f"/api/v1/documents/{receipt_doc_id}/validate", headers=manager_headers)
    assert val_resp.status_code == 200
    assert val_resp.json()["status"] == "DONE"

    # Verify stock at Main Store is 100.00
    prod_check = await client.get(f"/api/v1/products/{prod_id}", headers=manager_headers)
    assert float(prod_check.json()["total_stock"]) == 100.00

    # -------------------------------------------------------------
    # Step 2: INTERNAL TRANSFER (Move 30 kg from Main Store to Production Rack)
    # -------------------------------------------------------------
    transfer_doc_resp = await client.post(
        "/api/v1/documents",
        json={
            "type": "TRANSFER",
            "source_location_id": loc_a_id,
            "destination_location_id": loc_b_id,
            "notes": "Transfer 30kg steel for production run",
            "items": [{"product_id": prod_id, "quantity": "30.00"}],
        },
        headers=manager_headers,
    )
    assert transfer_doc_resp.status_code == 201
    transfer_doc_id = transfer_doc_resp.json()["id"]

    # Validate transfer
    val_transfer_resp = await client.post(f"/api/v1/documents/{transfer_doc_id}/validate", headers=manager_headers)
    assert val_transfer_resp.status_code == 200

    # Verify total stock is still 100 kg
    prod_check_2 = await client.get(f"/api/v1/products/{prod_id}", headers=manager_headers)
    assert float(prod_check_2.json()["total_stock"]) == 100.00

    # Verify per-location levels: Main Store = 70 kg, Production Rack = 30 kg
    levels_resp = await client.get(f"/api/v1/ledger/stock-levels?product_id={prod_id}", headers=manager_headers)
    levels = {lvl["location_id"]: float(lvl["current_quantity"]) for lvl in levels_resp.json()}
    assert levels[loc_a_id] == 70.00
    assert levels[loc_b_id] == 30.00

    # -------------------------------------------------------------
    # Step 3: DELIVERY ORDER (Dispatch 20 kg from Production Rack)
    # -------------------------------------------------------------
    delivery_doc_resp = await client.post(
        "/api/v1/documents",
        json={
            "type": "DELIVERY",
            "source_location_id": loc_b_id,
            "notes": "Shipment to customer",
            "items": [{"product_id": prod_id, "quantity": "20.00"}],
        },
        headers=manager_headers,
    )
    delivery_doc_id = delivery_doc_resp.json()["id"]
    val_del_resp = await client.post(f"/api/v1/documents/{delivery_doc_id}/validate", headers=manager_headers)
    assert val_del_resp.status_code == 200

    # Verify stock at Production Rack is now 10 kg, total stock is 80 kg
    prod_check_3 = await client.get(f"/api/v1/products/{prod_id}", headers=manager_headers)
    assert float(prod_check_3.json()["total_stock"]) == 80.00

    # -------------------------------------------------------------
    # Step 4: INSUFFICIENT STOCK REJECTION TEST
    # -------------------------------------------------------------
    # Attempt to deliver 50 kg from Production Rack (which only has 10 kg)
    fail_del_doc = await client.post(
        "/api/v1/documents",
        json={
            "type": "DELIVERY",
            "source_location_id": loc_b_id,
            "items": [{"product_id": prod_id, "quantity": "50.00"}],
        },
        headers=manager_headers,
    )
    fail_val_resp = await client.post(
        f"/api/v1/documents/{fail_del_doc.json()['id']}/validate", headers=manager_headers
    )
    assert fail_val_resp.status_code == 400
    assert "Insufficient stock" in fail_val_resp.json()["detail"]

    # -------------------------------------------------------------
    # Step 5: STOCK ADJUSTMENT (Physical count finds 7 kg instead of 10 kg at Production Rack)
    # -------------------------------------------------------------
    adj_doc_resp = await client.post(
        "/api/v1/documents",
        json={
            "type": "ADJUSTMENT",
            "destination_location_id": loc_b_id,
            "notes": "Physical audit: 3 kg damaged",
            "items": [{"product_id": prod_id, "quantity": "7.00"}],
        },
        headers=manager_headers,
    )
    adj_doc_id = adj_doc_resp.json()["id"]
    val_adj_resp = await client.post(f"/api/v1/documents/{adj_doc_id}/validate", headers=manager_headers)
    assert val_adj_resp.status_code == 200

    # Production Rack stock should now be exactly 7 kg
    levels_adj = await client.get(
        f"/api/v1/ledger/stock-levels?product_id={prod_id}&location_id={loc_b_id}", headers=manager_headers
    )
    assert float(levels_adj.json()[0]["current_quantity"]) == 7.00

    # -------------------------------------------------------------
    # Step 6: AUDIT LEDGER TRAIL
    # -------------------------------------------------------------
    ledger_resp = await client.get(f"/api/v1/ledger?product_id={prod_id}", headers=manager_headers)
    assert ledger_resp.status_code == 200
    entries = ledger_resp.json()
    assert len(entries) >= 4  # Receipt (+100), Transfer (-30/+30), Delivery (-20), Adjustment (-3)
    # Verify the bank-grade audit details (document reference & operator stamp)
    first_entry = entries[0]
    assert first_entry["document_number"] is not None
    assert first_entry["operator_name"] == "Test Manager"
    assert first_entry["document_type"] is not None


@pytest.mark.asyncio
async def test_document_five_stage_lifecycle(client: AsyncClient, manager_headers: dict):
    # Setup Location & Product
    loc_resp = await client.post(
        "/api/v1/locations", json={"name": "Receiving Dock", "type": "WAREHOUSE"}, headers=manager_headers
    )
    loc_id = loc_resp.json()["id"]

    prod_resp = await client.post(
        "/api/v1/products",
        json={
            "name": "Office Ergonomic Chair",
            "sku": "CHAIR-ERGO",
            "category": "Furniture",
            "unit_of_measure": "pcs",
            "low_stock_threshold": "5.00",
            "initial_stock": "0.00",
        },
        headers=manager_headers,
    )
    prod_id = prod_resp.json()["id"]

    # 1. DRAFT: Create receipt slip - inventory numbers must remain completely untouched
    draft_resp = await client.post(
        "/api/v1/documents",
        json={
            "type": "RECEIPT",
            "destination_location_id": loc_id,
            "notes": "Expected PO #1004",
            "items": [{"product_id": prod_id, "quantity": "50.00"}],
        },
        headers=manager_headers,
    )
    assert draft_resp.status_code == 201
    doc_id = draft_resp.json()["id"]
    assert draft_resp.json()["status"] == "DRAFT"

    # Verify inventory is still 0
    p1 = await client.get(f"/api/v1/products/{prod_id}", headers=manager_headers)
    assert float(p1.json()["total_stock"]) == 0.00

    # 2. WAITING: Truck on the way - stock still completely untouched
    wait_resp = await client.patch(
        f"/api/v1/documents/{doc_id}/status", json={"status": "WAITING"}, headers=manager_headers
    )
    assert wait_resp.status_code == 200
    assert wait_resp.json()["status"] == "WAITING"

    p2 = await client.get(f"/api/v1/products/{prod_id}", headers=manager_headers)
    assert float(p2.json()["total_stock"]) == 0.00

    # 3. READY: Pallet unloaded, checked at dock, ready to be shelved - stock still untouched
    ready_resp = await client.patch(
        f"/api/v1/documents/{doc_id}/status", json={"status": "READY"}, headers=manager_headers
    )
    assert ready_resp.status_code == 200
    assert ready_resp.json()["status"] == "READY"

    p3 = await client.get(f"/api/v1/products/{prod_id}", headers=manager_headers)
    assert float(p3.json()["total_stock"]) == 0.00

    # 4. DONE: Worker validates - THE MAGIC MOMENT! Stock updates instantly
    done_resp = await client.post(f"/api/v1/documents/{doc_id}/validate", headers=manager_headers)
    assert done_resp.status_code == 200
    assert done_resp.json()["status"] == "DONE"

    # Inventory now jumps to 50
    p4 = await client.get(f"/api/v1/products/{prod_id}", headers=manager_headers)
    assert float(p4.json()["total_stock"]) == 50.00

    # Locked & Immutable: Attempting to modify completed document must fail
    reopen_resp = await client.patch(
        f"/api/v1/documents/{doc_id}/status", json={"status": "DRAFT"}, headers=manager_headers
    )
    assert reopen_resp.status_code == 400

    # 5. CANCELED: Order canceled before delivery - remains for history, no stock impact
    cancel_doc_resp = await client.post(
        "/api/v1/documents",
        json={
            "type": "DELIVERY",
            "source_location_id": loc_id,
            "items": [{"product_id": prod_id, "quantity": "10.00"}],
        },
        headers=manager_headers,
    )
    cancel_id = cancel_doc_resp.json()["id"]

    c_resp = await client.patch(
        f"/api/v1/documents/{cancel_id}/status", json={"status": "CANCELED"}, headers=manager_headers
    )
    assert c_resp.status_code == 200
    assert c_resp.json()["status"] == "CANCELED"

    # Total stock remains 50.00 (not decremented by the 10 units)
    p5 = await client.get(f"/api/v1/products/{prod_id}", headers=manager_headers)
    assert float(p5.json()["total_stock"]) == 50.00

