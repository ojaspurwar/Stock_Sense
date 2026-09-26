from decimal import Decimal
import uuid
from pydantic import BaseModel
from app.schemas.product import ProductResponse


class LowStockAlert(BaseModel):
    product_id: uuid.UUID
    sku: str
    name: str
    category: str
    unit_of_measure: str
    current_stock: Decimal
    low_stock_threshold: Decimal
    is_out_of_stock: bool


class DashboardKPIs(BaseModel):
    total_products: int
    low_stock_count: int
    out_of_stock_count: int
    pending_receipts_count: int
    pending_deliveries_count: int
    scheduled_transfers_count: int
    low_stock_items: list[LowStockAlert] = []
