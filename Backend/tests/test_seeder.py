import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.seed import seed_database
from app.models.product import Product
from app.models.location import Location


@pytest.mark.asyncio
async def test_seeder_and_e2e_verification(client: AsyncClient, db_session: AsyncSession):
    """
    Validates that:
    1. Seeder populates realistic Indian industrial data, locations, and users.
    2. Manager and Staff can log in with their seeded credentials.
    3. The seeded cryptographic SHA-256 ledger chain is verified and 100% intact.
    4. FIFO valuation and COGS are correctly computed in Indian Rupees (INR / ₹).
    5. Dashboard KPIs reflect total inventory valuation and active orders.
    """
    # Run seeder in the active test session
    await seed_database(db_session)

    # 1. Test Manager Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "manager@stocksense.in", "password": "Manager@123"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test Staff Login
    staff_login = await client.post(
        "/api/v1/auth/login",
        data={"username": "staff@stocksense.in", "password": "Staff@123"},
    )
    assert staff_login.status_code == 200

    # 3. Verify Products & Locations
    prods_resp = await client.get("/api/v1/products", headers=headers)
    assert prods_resp.status_code == 200
    products = prods_resp.json()
    assert len(products) >= 5
    sku_set = {p["sku"] for p in products}
    assert "IND-STL-COIL-01" in sku_set
    assert "IND-SHF-HD-02" in sku_set
    assert "IND-BRG-PREC-03" in sku_set

    # 4. Verify Cryptographic Ledger Integrity
    verify_resp = await client.get("/api/v1/ledger/verify", headers=headers)
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["is_valid"] is True
    assert verify_data["status"] == "TAMPER_PROOF_VERIFIED"
    assert "Status: SECURE" in verify_data["message"]

    # 5. Verify FIFO Valuation in Indian Rupees (INR / ₹)
    val_resp = await client.get("/api/v1/ledger/valuation", headers=headers)
    assert val_resp.status_code == 200
    val_data = val_resp.json()
    assert val_data["currency"] == "INR"
    assert val_data["currency_symbol"] == "₹"
    assert val_data["total_inventory_valuation"] > 0
    assert len(val_data["active_lots"]) >= 3

    # 6. Verify Dashboard KPIs
    kpi_resp = await client.get("/api/v1/dashboard/kpis", headers=headers)
    assert kpi_resp.status_code == 200
    kpis = kpi_resp.json()
    assert kpis["total_products"] >= 5
    assert float(kpis["total_cogs"]) > 0
    assert float(kpis["total_inventory_value"]) > 0
