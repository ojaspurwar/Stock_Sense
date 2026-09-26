from datetime import datetime
from decimal import Decimal
import uuid
from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str
    sku: str
    category: str
    unit_of_measure: str
    low_stock_threshold: Decimal = Decimal("10.00")


class ProductCreate(ProductBase):
    initial_stock: Decimal = Field(default=Decimal("0.00"), ge=0)
    initial_location_id: uuid.UUID | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    unit_of_measure: str | None = None
    low_stock_threshold: Decimal | None = None


class ProductResponse(ProductBase):
    id: uuid.UUID
    created_at: datetime
    total_stock: Decimal = Decimal("0.00")

    model_config = ConfigDict(from_attributes=True)
