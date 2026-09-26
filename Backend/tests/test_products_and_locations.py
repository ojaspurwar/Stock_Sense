import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_locations_crud(client: AsyncClient, manager_headers: dict, staff_headers: dict):
    # Manager creates location
    loc_payload = {"name": "Central Warehouse", "type": "WAREHOUSE"}
    resp = await client.post("/api/v1/locations", json=loc_payload, headers=manager_headers)
    assert resp.status_code == 201
    loc_id = resp.json()["id"]

    # Staff forbidden from creating location
    staff_create_resp = await client.post(
        "/api/v1/locations", json={"name": "Rack 1", "type": "RACK"}, headers=staff_headers
    )
    assert staff_create_resp.status_code == 403

    # List locations (staff can read)
    list_resp = await client.get("/api/v1/locations", headers=staff_headers)
    assert list_resp.status_code == 200
    locations = list_resp.json()
    assert len(locations) >= 1
    assert locations[0]["id"] == loc_id


@pytest.mark.asyncio
async def test_products_creation_and_search(client: AsyncClient, manager_headers: dict, staff_headers: dict):
    # 1. Create a warehouse
    loc_resp = await client.post(
        "/api/v1/locations",
        json={"name": "Storage Bin B", "type": "RACK"},
        headers=manager_headers,
    )
    assert loc_resp.status_code == 201
    location_id = loc_resp.json()["id"]

    # 2. Create product with initial stock
    prod_payload = {
        "name": "Steel Rods 10mm",
        "sku": "STL-10MM",
        "category": "Raw Materials",
        "unit_of_measure": "kg",
        "low_stock_threshold": "20.00",
        "initial_stock": "100.00",
        "initial_location_id": location_id,
    }
    resp = await client.post("/api/v1/products", json=prod_payload, headers=manager_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["sku"] == "STL-10MM"
    assert float(data["total_stock"]) == 100.00

    # 3. Create product without initial stock
    prod_payload_2 = {
        "name": "Copper Wire",
        "sku": "CPR-WIRE",
        "category": "Raw Materials",
        "unit_of_measure": "m",
        "low_stock_threshold": "50.00",
        "initial_stock": "0.00",
    }
    resp2 = await client.post("/api/v1/products", json=prod_payload_2, headers=manager_headers)
    assert resp2.status_code == 201
    assert float(resp2.json()["total_stock"]) == 0.00

    # 4. Search products by SKU or Name
    search_resp = await client.get("/api/v1/products?search=STL", headers=staff_headers)
    assert search_resp.status_code == 200
    assert len(search_resp.json()) == 1
    assert search_resp.json()[0]["sku"] == "STL-10MM"
