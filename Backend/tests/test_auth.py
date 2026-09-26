import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "StockSense" in data["service"]


@pytest.mark.asyncio
async def test_signup_and_login(client: AsyncClient):
    # Signup
    signup_payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "Password123!",
        "role": "STAFF",
    }
    signup_resp = await client.post("/api/v1/auth/signup", json=signup_payload)
    assert signup_resp.status_code == 201
    user_data = signup_resp.json()
    assert user_data["email"] == "jane@example.com"
    assert user_data["role"] == "STAFF"

    # Duplicate signup check
    dup_resp = await client.post("/api/v1/auth/signup", json=signup_payload)
    assert dup_resp.status_code == 400

    # OAuth2 Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "jane@example.com", "password": "Password123!"},
    )
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # Verify /me endpoint
    me_resp = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "jane@example.com"


@pytest.mark.asyncio
async def test_forgot_and_reset_password(client: AsyncClient):
    # Create user
    await client.post(
        "/api/v1/auth/signup",
        json={
            "name": "Bob Reset",
            "email": "bob@example.com",
            "password": "OldPassword1!",
            "role": "STAFF",
        },
    )

    # Forgot password request
    forgot_resp = await client.post(
        "/api/v1/auth/forgot-password", json={"email": "bob@example.com"}
    )
    assert forgot_resp.status_code == 200
    otp = forgot_resp.json()["otp_code"]
    assert len(otp) == 6

    # Reset password with valid OTP
    reset_resp = await client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": "bob@example.com",
            "otp_code": otp,
            "new_password": "BrandNewPassword1!",
        },
    )
    assert reset_resp.status_code == 200

    # Try login with new password
    login_resp = await client.post(
        "/api/v1/auth/login",
        data={"username": "bob@example.com", "password": "BrandNewPassword1!"},
    )
    assert login_resp.status_code == 200
