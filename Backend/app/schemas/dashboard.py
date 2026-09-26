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
    pending_receipts: int = 0
    pending_deliveries: int = 0
    scheduled_transfers: int = 0
    recent_adjustments: int = 0
    total_inventory_quantity: Decimal = Decimal("0.00")
    total_inventory_value: Decimal = Decimal("0.00")
    total_cogs: Decimal = Decimal("0.00")
    low_stock_items: list[LowStockAlert] = []
