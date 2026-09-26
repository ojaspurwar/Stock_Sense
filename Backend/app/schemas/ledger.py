from datetime import datetime
from decimal import Decimal
import uuid
from pydantic import BaseModel, ConfigDict
from app.schemas.product import ProductResponse
from app.schemas.location import LocationResponse


class StockLedgerResponse(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    document_number: str | None = None
    document_type: str | None = None
    operator_name: str | None = None
    product_id: uuid.UUID
    source_location_id: uuid.UUID | None = None
    destination_location_id: uuid.UUID | None = None
    quantity: Decimal
    timestamp: datetime
    product: ProductResponse | None = None
    source_location: LocationResponse | None = None
    destination_location: LocationResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class StockLevelResponse(BaseModel):
    product_id: uuid.UUID
    location_id: uuid.UUID
    current_quantity: Decimal
    product: ProductResponse | None = None
    location: LocationResponse | None = None

    model_config = ConfigDict(from_attributes=True)
