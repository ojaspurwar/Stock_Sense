from datetime import datetime
from decimal import Decimal
import uuid
from pydantic import BaseModel, ConfigDict, model_validator
from app.schemas.product import ProductResponse
from app.schemas.location import LocationResponse


class StockLedgerResponse(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    document_number: str | None = None
    document_code: str | None = None
    document_type: str | None = None
    operator_name: str | None = None
    created_by_name: str | None = None
    product_id: uuid.UUID
    product_name: str | None = None
    sku: str | None = None
    unit_of_measure: str | None = None
    source_location_id: uuid.UUID | None = None
    source_location_name: str | None = None
    destination_location_id: uuid.UUID | None = None
    destination_location_name: str | None = None
    quantity: Decimal
    timestamp: datetime
    product: ProductResponse | None = None
    source_location: LocationResponse | None = None
    destination_location: LocationResponse | None = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def populate_ledger_aliases(cls, data):
        if isinstance(data, dict):
            data.setdefault("document_code", data.get("document_number"))
            data.setdefault("created_by_name", data.get("operator_name"))
            return data
        doc = getattr(data, "document", None)
        prod = getattr(data, "product", None)
        src = getattr(data, "source_location", None)
        dest = getattr(data, "destination_location", None)
        creator = getattr(doc, "creator", None) if doc else None
        doc_num = doc.document_number if doc else None
        doc_type = (doc.type.value if hasattr(doc.type, "value") else str(doc.type)) if doc else None
        op_name = creator.name if creator else None
        return {
            "id": getattr(data, "id", None),
            "document_id": getattr(data, "document_id", None),
            "document_number": doc_num,
            "document_code": doc_num,
            "document_type": doc_type,
            "operator_name": op_name,
            "created_by_name": op_name,
            "product_id": getattr(data, "product_id", None),
            "product_name": prod.name if prod else None,
            "sku": prod.sku if prod else None,
            "unit_of_measure": prod.unit_of_measure if prod else None,
            "source_location_id": getattr(data, "source_location_id", None),
            "source_location_name": src.name if src else None,
            "destination_location_id": getattr(data, "destination_location_id", None),
            "destination_location_name": dest.name if dest else None,
            "quantity": getattr(data, "quantity", None),
            "timestamp": getattr(data, "timestamp", None),
            "product": prod,
            "source_location": src,
            "destination_location": dest,
        }


class StockLevelResponse(BaseModel):
    product_id: uuid.UUID
    location_id: uuid.UUID
    current_quantity: Decimal
    reserved_quantity: Decimal = Decimal("0.0000")
    available_quantity: Decimal = Decimal("0.0000")
    product: ProductResponse | None = None
    location: LocationResponse | None = None

    model_config = ConfigDict(from_attributes=True)
