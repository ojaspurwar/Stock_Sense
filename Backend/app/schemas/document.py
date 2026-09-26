from datetime import datetime
from decimal import Decimal
import uuid
from pydantic import BaseModel, ConfigDict, Field
from app.models.document import DocumentType, DocumentStatus
from app.schemas.location import LocationResponse
from app.schemas.product import ProductResponse


class DocumentItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: Decimal = Field(gt=0, description="Quantity must be greater than zero")


class DocumentItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: Decimal
    product: ProductResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class DocumentCreate(BaseModel):
    document_number: str | None = None  # Auto-generated if not supplied
    type: DocumentType
    source_location_id: uuid.UUID | None = None
    destination_location_id: uuid.UUID | None = None
    notes: str | None = None
    items: list[DocumentItemCreate]


class DocumentUpdateStatus(BaseModel):
    status: DocumentStatus


class DocumentResponse(BaseModel):
    id: uuid.UUID
    document_number: str
    type: DocumentType
    status: DocumentStatus
    created_by: uuid.UUID
    source_location_id: uuid.UUID | None = None
    destination_location_id: uuid.UUID | None = None
    notes: str | None = None
    created_at: datetime
    source_location: LocationResponse | None = None
    destination_location: LocationResponse | None = None
    items: list[DocumentItemResponse] = []

    model_config = ConfigDict(from_attributes=True)
