from decimal import Decimal
import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models.stock_ledger import StockLedger


@pytest.mark.asyncio
async def test_idempotency_laggy_wifi_protection(client: AsyncClient, manager_headers: dict):
    """
    Test that rapid double-tapping on a frozen phone screen or network replay
    with the same Idempotency-Key executes ONLY once.
    """
    # 1. Setup Location & Product
    loc_resp = await client.post(
        "/api/v1/locations", json={"name": "Wi-Fi Test Dock", "type": "WAREHOUSE"}, headers=manager_headers
    )
    loc_id = loc_resp.json()["id"]

    prod_resp = await client.post(
        "/api/v1/products",
        json={
            "name": "Network Switch 24-Port",
            "sku": "NET-SW-24",
            "category": "Electronics",
            "unit_of_measure": "pcs",
            "low_stock_threshold": "5.00",
            "initial_stock": "0.00",
        },
        headers=manager_headers,
    )
    prod_id = prod_resp.json()["id"]

    # 2. Create document with Idempotency-Key
    idemp_key_create = "create-slip-key-uuid-1111"
    headers_with_idemp = {**manager_headers, "Idempotency-Key": idemp_key_create}

    doc_payload = {
        "type": "RECEIPT",
        "destination_location_id": loc_id,
        "notes": "PO 9001",
        "items": [{"product_id": prod_id, "quantity": "25.00"}],
    }

    # First tap (creation)
    resp1 = await client.post("/api/v1/documents", json=doc_payload, headers=headers_with_idemp)
    assert resp1.status_code == 201
    doc_id = resp1.json()["id"]

    # Second tap (user double-tapped because Wi-Fi lagged)
    resp2 = await client.post("/api/v1/documents", json=doc_payload, headers=headers_with_idemp)
    assert resp2.status_code == 201
    # Must return the SAME document, NOT create a second duplicate slip!
    assert resp2.json()["id"] == doc_id

    # 3. Test Validate Idempotency (prevent double stock crediting)
    idemp_key_val = "validate-key-uuid-2222"
    val_headers = {**manager_headers, "Idempotency-Key": idemp_key_val}

    # First validation tap
    val_resp1 = await client.post(f"/api/v1/documents/{doc_id}/validate", headers=val_headers)
    assert val_resp1.status_code == 200
    assert val_resp1.json()["status"] == "DONE"

    # Second validation tap during connection hiccup
    val_resp2 = await client.post(f"/api/v1/documents/{doc_id}/validate", headers=val_headers)
    assert val_resp2.status_code == 200

    # Crucial Verification: Stock must be exactly 25.00, NEVER 50.00!
    p_check = await client.get(f"/api/v1/products/{prod_id}", headers=manager_headers)
    assert float(p_check.json()["total_stock"]) == 25.00


@pytest.mark.asyncio
async def test_cryptographic_tamper_proof_ledger(client: AsyncClient, manager_headers: dict, db_session):
    """
    Test that every StockLedger row is cryptographically chained using SHA-256.
    If any database administrator or rogue user secretly alters a quantity in PostgreSQL,
    the ledger integrity scan detects the tampering immediately.
    """
    # 1. Setup Location & Product
    loc_resp = await client.post(
        "/api/v1/locations", json={"name": "Vault A", "type": "WAREHOUSE"}, headers=manager_headers
    )
    loc_id = loc_resp.json()["id"]

    prod_resp = await client.post(
        "/api/v1/products",
        json={
            "name": "Gold Solder Wire",
            "sku": "GLD-WIRE-01",
            "category": "Precious Metals",
            "unit_of_measure": "kg",
            "low_stock_threshold": "1.00",
            "initial_stock": "0.00",
        },
        headers=manager_headers,
    )
    prod_id = prod_resp.json()["id"]

    # 2. Process two separate receipts
    doc1 = await client.post(
        "/api/v1/documents",
        json={
            "type": "RECEIPT",
            "destination_location_id": loc_id,
            "items": [{"product_id": prod_id, "quantity": "10.00"}],
        },
        headers=manager_headers,
    )
    await client.post(f"/api/v1/documents/{doc1.json()['id']}/validate", headers=manager_headers)

    doc2 = await client.post(
        "/api/v1/documents",
        json={
            "type": "RECEIPT",
            "destination_location_id": loc_id,
            "items": [{"product_id": prod_id, "quantity": "5.00"}],
        },
        headers=manager_headers,
    )
    await client.post(f"/api/v1/documents/{doc2.json()['id']}/validate", headers=manager_headers)

    # 3. Verify clean cryptographic chain
    verify_resp = await client.get("/api/v1/ledger/verify", headers=manager_headers)
    assert verify_resp.status_code == 200
    chain_status = verify_resp.json()
    assert chain_status["is_valid"] is True
    assert chain_status["status"] == "TAMPER_PROOF_VERIFIED"
    assert chain_status["total_records_verified"] >= 2
    assert "Status: SECURE" in chain_status["message"]

    # 4. Simulate a database insider attack: directly mutating a quantity in the table!
    entries = (await db_session.execute(select(StockLedger))).scalars().all()
    target_entry = entries[-1]
    # Maliciously change quantity from 5 to 500 to hide stolen items
    target_entry.quantity = Decimal("500.0000")
    await db_session.commit()

    # 5. Run cryptographic scan again: MUST detect fraud!
    tamper_check = await client.get("/api/v1/ledger/verify", headers=manager_headers)
    assert tamper_check.status_code == 200
    tamper_result = tamper_check.json()
    assert tamper_result["is_valid"] is False
    assert tamper_result["status"] == "TAMPERED_DATA_MUTATED"
    assert "ALERT: Chain broken at transaction" in tamper_result["message"]
    assert "Data mismatch detected" in tamper_result["message"]
    assert "mismatch" in tamper_result["reason"]


@pytest.mark.asyncio
async def test_fifo_inventory_valuation(client: AsyncClient, manager_headers: dict):
    """
    Test real-time FIFO valuation and lot consumption:
    - January: 50 rods @ $10 ($500)
    - February: 50 rods @ $15 ($750)
    - March: Customer order for 60 rods
    - Expected COGS: (50 * $10) + (10 * $15) = $650
    - Remaining shelf inventory: 40 rods @ $15 = $600
    """
    # 1. Setup Location & Product
    loc_resp = await client.post(
        "/api/v1/locations", json={"name": "Steel Yard", "type": "WAREHOUSE"}, headers=manager_headers
    )
    loc_id = loc_resp.json()["id"]

    prod_resp = await client.post(
        "/api/v1/products",
        json={
            "name": "Raw Steel Rods",
            "sku": "ROD-STEEL-01",
            "category": "Raw Materials",
            "unit_of_measure": "pcs",
            "low_stock_threshold": "20.00",
            "initial_stock": "0.00",
        },
        headers=manager_headers,
    )
    prod_id = prod_resp.json()["id"]

    # 2. Receipt 1 (January): 50 rods @ $10.00
    r1 = await client.post(
        "/api/v1/documents",
        json={
            "type": "RECEIPT",
            "destination_location_id": loc_id,
            "items": [{"product_id": prod_id, "quantity": "50.00", "unit_price": "10.00"}],
        },
        headers=manager_headers,
    )
    await client.post(f"/api/v1/documents/{r1.json()['id']}/validate", headers=manager_headers)

    # 3. Receipt 2 (February): 50 rods @ $15.00
    r2 = await client.post(
        "/api/v1/documents",
        json={
            "type": "RECEIPT",
            "destination_location_id": loc_id,
            "items": [{"product_id": prod_id, "quantity": "50.00", "unit_price": "15.00"}],
        },
        headers=manager_headers,
    )
    await client.post(f"/api/v1/documents/{r2.json()['id']}/validate", headers=manager_headers)

    # Verify initial valuation before shipment: 50*10 + 50*15 = $1,250
    lots_resp = await client.get(f"/api/v1/ledger/lots?product_id={prod_id}", headers=manager_headers)
    assert lots_resp.status_code == 200
    lots = lots_resp.json()
    assert len(lots) == 2

    # 4. Outgoing Delivery (March): 60 rods
    del_doc = await client.post(
        "/api/v1/documents",
        json={
            "type": "DELIVERY",
            "source_location_id": loc_id,
            "items": [{"product_id": prod_id, "quantity": "60.00"}],
        },
        headers=manager_headers,
    )
    del_val = await client.post(f"/api/v1/documents/{del_doc.json()['id']}/validate", headers=manager_headers)
    assert del_val.status_code == 200
    del_data = del_val.json()

    # Exact COGS math verification: 50 * 10 + 10 * 15 = $650.00
    assert float(del_data["cogs"]) == 650.00

    # 5. Remaining inventory valuation verification: exactly 40 rods @ $15 = $600.00
    val_resp = await client.get("/api/v1/ledger/valuation", headers=manager_headers)
    assert val_resp.status_code == 200
    val_data = val_resp.json()
    assert val_data["valuation_method"] == "FIFO (First-In, First-Out)"

    rod_val = next(item for item in val_data["items"] if item["product_id"] == prod_id)
    assert float(rod_val["on_hand_quantity"]) == 40.00
    assert float(rod_val["total_valuation"]) == 600.00
    assert float(rod_val["unit_cost_basis"]) == 15.00


@pytest.mark.asyncio
async def test_two_phase_stock_reservation_race_condition(client: AsyncClient, manager_headers: dict):
    """
    Simulates Worker 1 and Worker 2 both trying to deliver the last 5 chairs.
    Proves that moving to WAITING reserves the 5 units, dropping Available Stock to 0,
    and Worker 2's order is blocked cleanly with 400 Bad Request.
    """
    # 1. Setup Rack A with 5 Office Chairs
    loc_resp = await client.post(
        "/api/v1/locations", json={"name": "Rack A", "type": "RACK"}, headers=manager_headers
    )
    rack_a_id = loc_resp.json()["id"]

    prod_resp = await client.post(
        "/api/v1/products",
        json={
            "name": "Executive Mesh Chair",
            "sku": "CHAIR-MESH-05",
            "category": "Furniture",
            "unit_of_measure": "pcs",
            "low_stock_threshold": "2.00",
            "initial_stock": "5.00",
            "initial_location_id": rack_a_id,
        },
        headers=manager_headers,
    )
    prod_id = prod_resp.json()["id"]

    # Check initial availability: Physical = 5, Reserved = 0, Available = 5
    avail1 = await client.get(f"/api/v1/products/{prod_id}/availability", headers=manager_headers)
    assert avail1.status_code == 200
    loc1 = avail1.json()["locations"][0]
    assert float(loc1["physical_stock"]) == 5.00
    assert float(loc1["reserved_stock"]) == 0.00
    assert float(loc1["available_stock"]) == 5.00

    # 2. Worker 1 creates Delivery Order 1 for 5 chairs
    w1_order = await client.post(
        "/api/v1/documents",
        json={
            "type": "DELIVERY",
            "source_location_id": rack_a_id,
            "items": [{"product_id": prod_id, "quantity": "5.00"}],
        },
        headers=manager_headers,
    )
    w1_order_id = w1_order.json()["id"]

    # Worker 1 transitions order to WAITING (reserves the chairs!)
    await client.patch(
        f"/api/v1/documents/{w1_order_id}/status", json={"status": "WAITING"}, headers=manager_headers
    )

    # Check availability: Physical is still 5 on shelf, but Reserved = 5, Available = 0!
    avail2 = await client.get(f"/api/v1/products/{prod_id}/availability", headers=manager_headers)
    loc2 = avail2.json()["locations"][0]
    assert float(loc2["physical_stock"]) == 5.00
    assert float(loc2["reserved_stock"]) == 5.00
    assert float(loc2["available_stock"]) == 0.00

    # 3. Worker 2 on second floor tries to create and confirm Order 2 for 5 chairs
    w2_order = await client.post(
        "/api/v1/documents",
        json={
            "type": "DELIVERY",
            "source_location_id": rack_a_id,
            "items": [{"product_id": prod_id, "quantity": "5.00"}],
        },
        headers=manager_headers,
    )
    w2_order_id = w2_order.json()["id"]

    # Worker 2 tries to move to WAITING or validate: BLOCKED!
    w2_fail = await client.patch(
        f"/api/v1/documents/{w2_order_id}/status", json={"status": "WAITING"}, headers=manager_headers
    )
    assert w2_fail.status_code == 400
    assert "Cannot reserve stock" in w2_fail.json()["detail"]
    assert "Available: 0" in w2_fail.json()["detail"] or "Available: 0.00" in w2_fail.json()["detail"]

    # 4. Worker 1 officially dispatches & validates order 1 (DONE)
    w1_done = await client.post(f"/api/v1/documents/{w1_order_id}/validate", headers=manager_headers)
    assert w1_done.status_code == 200

    # Now Physical drops to 0, Reserved drops to 0, Available is 0
    avail3 = await client.get(f"/api/v1/products/{prod_id}/availability", headers=manager_headers)
    loc3 = avail3.json()["locations"][0]
    assert float(loc3["physical_stock"]) == 0.00
    assert float(loc3["reserved_stock"]) == 0.00
    assert float(loc3["available_stock"]) == 0.00

