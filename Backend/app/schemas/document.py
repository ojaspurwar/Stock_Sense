from datetime import datetime
from decimal import Decimal
import uuid
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.models.document import DocumentType, DocumentStatus
from app.schemas.location import LocationResponse
from app.schemas.product import ProductResponse


class DocumentItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: Decimal = Field(gt=0, description="Quantity must be greater than zero")
    unit_price: Decimal | None = Field(default=None, description="Purchase unit price / cost for receipts or lot creation")


class DocumentItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: Decimal
    unit_price: Decimal | None = None
    product_name: str | None = None
    sku: str | None = None
    unit_of_measure: str | None = None
    requested_quantity: Decimal | None = None
    processed_quantity: Decimal | None = None
    product: ProductResponse | None = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def populate_line_aliases(cls, data):
        if isinstance(data, dict):
            prod = data.get("product") or {}
            data.setdefault("product_name", prod.get("name") if isinstance(prod, dict) else getattr(prod, "name", None))
            data.setdefault("sku", prod.get("sku") if isinstance(prod, dict) else getattr(prod, "sku", None))
            data.setdefault("unit_of_measure", prod.get("unit_of_measure") if isinstance(prod, dict) else getattr(prod, "unit_of_measure", None))
            data.setdefault("requested_quantity", data.get("quantity"))
            data.setdefault("processed_quantity", data.get("quantity"))
            return data
        prod = getattr(data, "product", None)
        qty = getattr(data, "quantity", None)
        return {
            "id": getattr(data, "id", None),
            "product_id": getattr(data, "product_id", None),
            "quantity": qty,
            "unit_price": getattr(data, "unit_price", None),
            "requested_quantity": qty,
            "processed_quantity": qty,
            "product_name": prod.name if prod else None,
            "sku": prod.sku if prod else None,
            "unit_of_measure": prod.unit_of_measure if prod else None,
            "product": prod,
        }


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
    code: str | None = None
    type: DocumentType
    status: DocumentStatus
    created_by: uuid.UUID
    creator_name: str | None = None
    source_location_id: uuid.UUID | None = None
    source_location_name: str | None = None
    destination_location_id: uuid.UUID | None = None
    destination_location_name: str | None = None
    notes: str | None = None
    cogs: Decimal | None = None
    created_at: datetime
    source_location: LocationResponse | None = None
    destination_location: LocationResponse | None = None
    items: list[DocumentItemResponse] = []
    lines: list[DocumentItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def populate_doc_aliases(cls, data):
        if isinstance(data, dict):
            data.setdefault("code", data.get("document_number"))
            data.setdefault("lines", data.get("items", []))
            return data
        doc_num = getattr(data, "document_number", None)
        src = getattr(data, "source_location", None)
        dest = getattr(data, "destination_location", None)
        creator = getattr(data, "creator", None)
        items = getattr(data, "items", [])
        return {
            "id": getattr(data, "id", None),
            "document_number": doc_num,
            "code": doc_num,
            "type": getattr(data, "type", None),
            "status": getattr(data, "status", None),
            "created_by": getattr(data, "created_by", None),
            "creator_name": creator.name if creator else None,
            "source_location_id": getattr(data, "source_location_id", None),
            "source_location_name": src.name if src else None,
            "destination_location_id": getattr(data, "destination_location_id", None),
            "destination_location_name": dest.name if dest else None,
            "notes": getattr(data, "notes", None),
            "cogs": getattr(data, "cogs", None),
            "created_at": getattr(data, "created_at", None),
            "source_location": src,
            "destination_location": dest,
            "items": items,
            "lines": items,
        }
