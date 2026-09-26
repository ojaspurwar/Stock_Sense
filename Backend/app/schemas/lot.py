import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.schemas.product import ProductResponse


class ProductLotResponse(BaseModel):
    id: uuid.UUID
    lot_number: str
    product_id: uuid.UUID
    document_id: uuid.UUID | None = None
    initial_quantity: Decimal
    remaining_quantity: Decimal
    unit_cost: Decimal
    lot_value: Decimal
    created_at: datetime
    product: ProductResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class FifoProductValuation(BaseModel):
    product_id: uuid.UUID
    name: str
    sku: str
    category: str
    unit_of_measure: str
    current_stock: Decimal
    average_unit_cost: Decimal
    total_valuation: Decimal


class FifoInventoryValuationResponse(BaseModel):
    total_inventory_value: Decimal
    total_inventory_quantity: Decimal
    products: list[FifoProductValuation]
    active_lots: list[ProductLotResponse]
