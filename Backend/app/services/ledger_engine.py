from decimal import Decimal
import uuid
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentItem, DocumentType
from app.models.stock_ledger import StockLedger
from app.models.stock_level import StockLevel


class LedgerEngine:
    @staticmethod
    async def get_or_create_stock_level(
        db: AsyncSession, product_id: uuid.UUID, location_id: uuid.UUID, for_update: bool = False
    ) -> StockLevel:
        stmt = select(StockLevel).where(
            StockLevel.product_id == product_id,
            StockLevel.location_id == location_id,
        )
        if for_update and db.bind and db.bind.dialect.name != "sqlite":
            stmt = stmt.with_for_update()

        result = await db.execute(stmt)
        stock_level = result.scalar_one_or_none()

        if stock_level is None:
            stock_level = StockLevel(
                product_id=product_id,
                location_id=location_id,
                current_quantity=Decimal("0.0000"),
            )
            db.add(stock_level)
            await db.flush()

        return stock_level

    @staticmethod
    async def process_document_ledger(db: AsyncSession, document: Document) -> list[StockLedger]:
        """
        Executes the double-entry stock transactions for a document atomically.
        Creates immutable ledger entries and updates StockLevels cache.
        """
        ledger_entries: list[StockLedger] = []

        if not document.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot validate document with no items.",
            )

        for item in document.items:
            qty = Decimal(str(item.quantity))

            if document.type == DocumentType.RECEIPT:
                if not document.destination_location_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Receipt requires a valid destination location.",
                    )
                # Increment destination
                dest_level = await LedgerEngine.get_or_create_stock_level(
                    db, item.product_id, document.destination_location_id, for_update=True
                )
                dest_level.current_quantity += qty

                entry = StockLedger(
                    document_id=document.id,
                    product_id=item.product_id,
                    source_location_id=None,
                    destination_location_id=document.destination_location_id,
                    quantity=qty,
                )
                db.add(entry)
                ledger_entries.append(entry)

            elif document.type == DocumentType.DELIVERY:
                if not document.source_location_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Delivery requires a valid source location.",
                    )
                src_level = await LedgerEngine.get_or_create_stock_level(
                    db, item.product_id, document.source_location_id, for_update=True
                )
                if src_level.current_quantity < qty:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Insufficient stock for product {item.product_id} at location "
                            f"{document.source_location_id}. Available: {src_level.current_quantity}, Requested: {qty}"
                        ),
                    )
                src_level.current_quantity -= qty

                entry = StockLedger(
                    document_id=document.id,
                    product_id=item.product_id,
                    source_location_id=document.source_location_id,
                    destination_location_id=None,
                    quantity=qty,
                )
                db.add(entry)
                ledger_entries.append(entry)

            elif document.type == DocumentType.TRANSFER:
                if not document.source_location_id or not document.destination_location_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Transfer requires both source and destination locations.",
                    )
                if document.source_location_id == document.destination_location_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Source and destination locations cannot be identical.",
                    )

                src_level = await LedgerEngine.get_or_create_stock_level(
                    db, item.product_id, document.source_location_id, for_update=True
                )
                if src_level.current_quantity < qty:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Insufficient stock for product {item.product_id} at source location. "
                            f"Available: {src_level.current_quantity}, Requested: {qty}"
                        ),
                    )

                dest_level = await LedgerEngine.get_or_create_stock_level(
                    db, item.product_id, document.destination_location_id, for_update=True
                )

                src_level.current_quantity -= qty
                dest_level.current_quantity += qty

                entry = StockLedger(
                    document_id=document.id,
                    product_id=item.product_id,
                    source_location_id=document.source_location_id,
                    destination_location_id=document.destination_location_id,
                    quantity=qty,
                )
                db.add(entry)
                ledger_entries.append(entry)

            elif document.type == DocumentType.ADJUSTMENT:
                target_loc = document.destination_location_id or document.source_location_id
                if not target_loc:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Adjustment requires a specified location.",
                    )

                loc_level = await LedgerEngine.get_or_create_stock_level(
                    db, item.product_id, target_loc, for_update=True
                )
                counted_qty = qty
                current_qty = loc_level.current_quantity
                variance = counted_qty - current_qty

                if variance > Decimal("0"):
                    # Surplus found: treat as incoming receipt
                    entry = StockLedger(
                        document_id=document.id,
                        product_id=item.product_id,
                        source_location_id=None,
                        destination_location_id=target_loc,
                        quantity=variance,
                    )
                    db.add(entry)
                    ledger_entries.append(entry)
                elif variance < Decimal("0"):
                    # Deficit/damaged: treat as outgoing delivery
                    entry = StockLedger(
                        document_id=document.id,
                        product_id=item.product_id,
                        source_location_id=target_loc,
                        destination_location_id=None,
                        quantity=abs(variance),
                    )
                    db.add(entry)
                    ledger_entries.append(entry)

                # Set level directly to counted quantity
                loc_level.current_quantity = counted_qty

        await db.flush()
        return ledger_entries
