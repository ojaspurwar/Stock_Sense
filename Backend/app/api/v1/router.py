from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    dashboard,
    documents,
    ledger,
    locations,
    products,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(locations.router, prefix="/locations", tags=["Locations"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents (Operations)"])
api_router.include_router(ledger.router, prefix="/ledger", tags=["Stock Ledger & Levels"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard & KPIs"])
