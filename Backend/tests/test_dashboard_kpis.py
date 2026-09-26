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
