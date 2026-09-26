import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard_kpis_endpoint(client: AsyncClient, manager_headers: dict):
    # Setup Location
    loc_resp = await client.post(
        "/api/v1/locations", json={"name": "Depot 1", "type": "WAREHOUSE"}, headers=manager_headers
    )
    loc_id = loc_resp.json()["id"]

    # Product 1: Out of stock (0 initial)
    await client.post(
        "/api/v1/products",
        json={
            "name": "Out-of-Stock Widget",
            "sku": "WIDGET-0",
            "category": "Widgets",
            "unit_of_measure": "pcs",
            "low_stock_threshold": "10.00",
            "initial_stock": "0.00",
        },
        headers=manager_headers,
    )

    # Product 2: Low stock (5 items, threshold is 20)
    await client.post(
        "/api/v1/products",
        json={
            "name": "Low-Stock Gadget",
            "sku": "GADGET-5",
            "category": "Gadgets",
            "unit_of_measure": "pcs",
            "low_stock_threshold": "20.00",
            "initial_stock": "5.00",
            "initial_location_id": loc_id,
        },
        headers=manager_headers,
    )

    # Product 3: Well-stocked (100 items, threshold is 10)
    await client.post(
        "/api/v1/products",
        json={
            "name": "Abundant Part",
            "sku": "PART-100",
            "category": "Parts",
            "unit_of_measure": "pcs",
            "low_stock_threshold": "10.00",
            "initial_stock": "100.00",
            "initial_location_id": loc_id,
        },
        headers=manager_headers,
    )

    # Query KPIs
    kpi_resp = await client.get("/api/v1/dashboard/kpis", headers=manager_headers)
    assert kpi_resp.status_code == 200
    data = kpi_resp.json()

    assert data["total_products"] == 3
    assert data["out_of_stock_count"] == 1
    assert data["low_stock_count"] == 1
    assert len(data["low_stock_items"]) == 2  # 1 out of stock + 1 low stock

    # Test Live Move History Feed
    moves_resp = await client.get("/api/v1/dashboard/moves", headers=manager_headers)
    assert moves_resp.status_code == 200
    moves = moves_resp.json()
    assert isinstance(moves, list)
    # Both Product 2 and Product 3 created initial stock receipts!
    assert len(moves) >= 2
    assert moves[0]["operator_name"] == "Test Manager"


@pytest.mark.asyncio
async def test_product_availability_endpoint(client: AsyncClient, manager_headers: dict):
    # Setup Location
    loc_resp = await client.post(
        "/api/v1/locations", json={"name": "Aisle 3", "type": "RACK"}, headers=manager_headers
    )
    loc_id = loc_resp.json()["id"]

    # Create Product with initial stock
    prod_resp = await client.post(
        "/api/v1/products",
        json={
            "name": "Precision Bearings",
            "sku": "BEARING-55",
            "category": "Components",
            "unit_of_measure": "pcs",
            "low_stock_threshold": "10.00",
            "initial_stock": "45.00",
            "initial_location_id": loc_id,
        },
        headers=manager_headers,
    )
    prod_id = prod_resp.json()["id"]

    # Query availability
    avail_resp = await client.get(f"/api/v1/products/{prod_id}/availability", headers=manager_headers)
    assert avail_resp.status_code == 200
    avail_data = avail_resp.json()
    assert avail_data["sku"] == "BEARING-55"
    assert float(avail_data["total_stock"]) == 45.00
    assert len(avail_data["locations"]) == 1
    assert avail_data["locations"][0]["location_name"] == "Aisle 3"
    assert float(avail_data["locations"][0]["quantity"]) == 45.00
