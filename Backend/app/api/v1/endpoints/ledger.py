import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.document import Document
from app.models.stock_ledger import StockLedger
from app.models.stock_level import StockLevel
from app.models.user import User
from app.schemas.ledger import StockLedgerResponse, StockLevelResponse

router = APIRouter()


@router.get("", response_model=list[StockLedgerResponse])
async def list_ledger_entries(
    product_id: uuid.UUID | None = Query(None),
    document_id: uuid.UUID | None = Query(None),
    location_id: uuid.UUID | None = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(StockLedger)
        .options(
            selectinload(StockLedger.product),
            selectinload(StockLedger.source_location),
            selectinload(StockLedger.destination_location),
            selectinload(StockLedger.document).selectinload(Document.creator),
        )
        .order_by(StockLedger.timestamp.desc())
    )

    if product_id:
        stmt = stmt.where(StockLedger.product_id == product_id)
    if document_id:
        stmt = stmt.where(StockLedger.document_id == document_id)
    if location_id:
        stmt = stmt.where(
            (StockLedger.source_location_id == location_id)
            | (StockLedger.destination_location_id == location_id)
        )

    stmt = stmt.offset(skip).limit(limit)
    res = await db.execute(stmt)
    entries = res.scalars().all()
    results: list[StockLedgerResponse] = []
    for entry in entries:
        r = StockLedgerResponse.model_validate(entry)
        if entry.document:
            r.document_number = entry.document.document_number
            r.document_type = (
                entry.document.type.value
                if hasattr(entry.document.type, "value")
                else str(entry.document.type)
            )
            if entry.document.creator:
                r.operator_name = entry.document.creator.name
        results.append(r)
    return results


@router.get("/stock-levels", response_model=list[StockLevelResponse])
async def list_stock_levels(
    product_id: uuid.UUID | None = Query(None),
    location_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(StockLevel)
        .options(
            selectinload(StockLevel.product),
            selectinload(StockLevel.location),
        )
        .order_by(StockLevel.current_quantity.desc())
    )

    if product_id:
        stmt = stmt.where(StockLevel.product_id == product_id)
    if location_id:
        stmt = stmt.where(StockLevel.location_id == location_id)

    res = await db.execute(stmt)
    return list(res.scalars().all())
