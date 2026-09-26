from typing import Annotated
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
from app.services.ledger_engine import LedgerEngine

router = APIRouter()


@router.get("", response_model=list[StockLedgerResponse])
async def list_ledger_entries(
    product_id: Annotated[uuid.UUID | None, Query()] = None,
    document_id: Annotated[uuid.UUID | None, Query()] = None,
    location_id: Annotated[uuid.UUID | None, Query()] = None,
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


@router.get("/verify")
async def verify_ledger_cryptographic_integrity(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Scans the entire cryptographic SHA-256 chain of the Stock Ledger to prove
    that no database administrator, staff, or attacker tampered with stock numbers.
    """
    return await LedgerEngine.verify_chain(db)


@router.get("/valuation")
async def get_inventory_valuation(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns real-time inventory asset valuation and FIFO cost layer breakdown.
    """
    return await LedgerEngine.get_fifo_inventory_valuation(db)


@router.get("/lots")
async def list_product_lots(
    product_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns incoming batches/lots with purchase cost, remaining quantity, and batch values.
    """
    lots = await LedgerEngine.get_lots(db, product_id=product_id)
    return [
        {
            "id": str(lot.id),
            "lot_number": lot.lot_number,
            "product_id": str(lot.product_id),
            "product_name": lot.product.name if lot.product else None,
            "initial_quantity": float(lot.initial_quantity),
            "remaining_quantity": float(lot.remaining_quantity),
            "unit_cost": float(lot.unit_cost),
            "lot_value": float(lot.remaining_quantity * lot.unit_cost),
            "created_at": lot.created_at.isoformat(),
        }
        for lot in lots
    ]

