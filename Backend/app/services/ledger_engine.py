from datetime import datetime, timezone
from decimal import Decimal
import hashlib
import uuid
from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentItem, DocumentType
from app.models.stock_ledger import StockLedger
from app.models.stock_level import StockLevel
from app.models.product import Product
from app.models.product_lot import ProductLot


class LedgerEngine:
    @staticmethod
    def calculate_hash(
        prev_hash: str | None,
        document_id: uuid.UUID | str,
        product_id: uuid.UUID | str,
        source_loc: uuid.UUID | str | None,
        dest_loc: uuid.UUID | str | None,
        qty: Decimal | float | int,
        timestamp: datetime,
    ) -> str:
        """
        Cryptographic SHA-256 block hash for tamper-proof audit verification.
        Chains previous hash + movement attributes deterministically.
        """
        if timestamp.tzinfo is None:
            ts_norm = timestamp.replace(tzinfo=timezone.utc)
        else:
            ts_norm = timestamp
        ts_sec = int(ts_norm.timestamp())
        norm_qty = f"{Decimal(str(qty)):.4f}"

        data = (
            f"{prev_hash or 'GENESIS'}|"
            f"{str(document_id)}|"
            f"{str(product_id)}|"
            f"{str(source_loc) if source_loc else 'NONE'}|"
            f"{str(dest_loc) if dest_loc else 'NONE'}|"
            f"{norm_qty}|"
            f"{ts_sec}"
        )
        return hashlib.sha256(data.encode("utf-8")).hexdigest()

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
        Creates immutable, cryptographically chained ledger entries and updates StockLevels cache.
        """
        ledger_entries: list[StockLedger] = []

        if not document.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot validate document with no items.",
            )

        # Get latest block hash for cryptographic chaining
        stmt_hash = (
            select(StockLedger.entry_hash)
            .order_by(StockLedger.timestamp.desc(), StockLedger.id.desc())
            .limit(1)
        )
        res_hash = await db.execute(stmt_hash)
        current_chain_hash = res_hash.scalar_one_or_none()

        for item in document.items:
            qty = Decimal(str(item.quantity))
            now_ts = datetime.now(timezone.utc)
            src_loc = None
            dest_loc = None

            if document.type == DocumentType.RECEIPT:
                if not document.destination_location_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Receipt requires a valid destination location.",
                    )
                src_loc = document.source_location_id  # May be a VENDOR virtual location or None
                dest_loc = document.destination_location_id

                # Increment destination
                dest_level = await LedgerEngine.get_or_create_stock_level(
                    db, item.product_id, dest_loc, for_update=True
                )
                dest_level.current_quantity += qty

            elif document.type == DocumentType.DELIVERY:
                if not document.source_location_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Delivery requires a valid source location.",
                    )
                src_loc = document.source_location_id
                dest_loc = document.destination_location_id  # May be a CUSTOMER virtual location or None

                src_level = await LedgerEngine.get_or_create_stock_level(
                    db, item.product_id, src_loc, for_update=True
                )
                if src_level.current_quantity < qty:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Insufficient stock for product {item.product_id} at location "
                            f"{src_loc}. Available: {src_level.current_quantity}, Requested: {qty}"
                        ),
                    )
                src_level.current_quantity -= qty

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

                src_loc = document.source_location_id
                dest_loc = document.destination_location_id

                src_level = await LedgerEngine.get_or_create_stock_level(
                    db, item.product_id, src_loc, for_update=True
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
                    db, item.product_id, dest_loc, for_update=True
                )

                src_level.current_quantity -= qty
                dest_level.current_quantity += qty

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
                    src_loc = None
                    dest_loc = target_loc
                    qty = variance
                elif variance < Decimal("0"):
                    src_loc = target_loc
                    dest_loc = None
                    qty = abs(variance)
                else:
                    # No variance
                    qty = Decimal("0.0000")

                loc_level.current_quantity = counted_qty

            # Compute tamper-proof cryptographic hash
            entry_hash = LedgerEngine.calculate_hash(
                prev_hash=current_chain_hash,
                document_id=document.id,
                product_id=item.product_id,
                source_loc=src_loc,
                dest_loc=dest_loc,
                qty=qty,
                timestamp=now_ts,
            )

            entry = StockLedger(
                document_id=document.id,
                product_id=item.product_id,
                source_location_id=src_loc,
                destination_location_id=dest_loc,
                quantity=qty,
                timestamp=now_ts,
                prev_hash=current_chain_hash,
                entry_hash=entry_hash,
            )
            current_chain_hash = entry_hash
            db.add(entry)
            ledger_entries.append(entry)

        await db.flush()
        return ledger_entries

    @staticmethod
    async def verify_chain(db: AsyncSession) -> dict:
        """
        Scans all ledger records from genesis to tip to cryptographically prove that
        no records were tampered with, deleted, or injected directly into the database.
        """
        stmt = (
            select(StockLedger)
            .options(selectinload(StockLedger.document))
            .order_by(StockLedger.timestamp.asc(), StockLedger.id.asc())
        )
        res = await db.execute(stmt)
        entries = res.scalars().all()

        expected_prev_hash = None
        for idx, entry in enumerate(entries):
            doc_num = (
                entry.document.document_number
                if (entry.document and entry.document.document_number)
                else f"TX-{str(entry.id)[:8]}"
            )

            # Check link to previous hash
            if idx == 0:
                expected_prev_hash = entry.prev_hash
            elif entry.prev_hash != expected_prev_hash:
                return {
                    "is_valid": False,
                    "status": "TAMPERED_BROKEN_CHAIN",
                    "tampered_at_index": idx,
                    "transaction_number": doc_num,
                    "entry_id": str(entry.id),
                    "message": f"ALERT: Chain broken at transaction {doc_num}! Chain link mismatch detected.",
                    "reason": f"Chain link broken at block {idx}. Expected prev_hash {expected_prev_hash}, found {entry.prev_hash}.",
                }

            # Recompute and verify content hash
            recomputed = LedgerEngine.calculate_hash(
                prev_hash=entry.prev_hash,
                document_id=entry.document_id,
                product_id=entry.product_id,
                source_loc=entry.source_location_id,
                dest_loc=entry.destination_location_id,
                qty=entry.quantity,
                timestamp=entry.timestamp,
            )
            if recomputed != entry.entry_hash:
                return {
                    "is_valid": False,
                    "status": "TAMPERED_DATA_MUTATED",
                    "tampered_at_index": idx,
                    "transaction_number": doc_num,
                    "entry_id": str(entry.id),
                    "message": f"ALERT: Chain broken at transaction {doc_num}! Data mismatch detected.",
                    "reason": f"Content mismatch at block {idx}! Record was modified directly in the database.",
                }

            expected_prev_hash = entry.entry_hash

        return {
            "is_valid": True,
            "status": "TAMPER_PROOF_VERIFIED",
            "total_records_verified": len(entries),
            "chain_tip_hash": expected_prev_hash,
            "message": f"Status: SECURE ({len(entries):,} verified transactions)",
        }

    @staticmethod
    async def record_receipt_lots(db: AsyncSession, document: Document) -> list[ProductLot]:
        """
        Creates incoming product lots with purchase cost upon Receipt validation.
        """
        lots = []
        for idx, item in enumerate(document.items):
            unit_cost = (
                item.unit_price
                if (item.unit_price is not None and item.unit_price > Decimal("0"))
                else Decimal("10.0000")
            )
            lot = ProductLot(
                lot_number=f"LOT-{document.document_number}-{idx + 1}",
                product_id=item.product_id,
                document_id=document.id,
                initial_quantity=item.quantity,
                remaining_quantity=item.quantity,
                unit_cost=unit_cost,
                created_at=datetime.now(timezone.utc),
            )
            db.add(lot)
            lots.append(lot)
        await db.flush()
        return lots

    @staticmethod
    async def consume_delivery_lots_fifo(db: AsyncSession, document: Document) -> Decimal:
        """
        Consumes stock from oldest available lots in FIFO order upon Delivery validation.
        Calculates and persists real-time COGS (Cost of Goods Sold).
        """
        total_delivery_cogs = Decimal("0.0000")
        for item in document.items:
            needed = item.quantity
            item_cogs = Decimal("0.0000")

            # Retrieve available lots in FIFO order (oldest first)
            stmt = (
                select(ProductLot)
                .where(
                    ProductLot.product_id == item.product_id,
                    ProductLot.remaining_quantity > Decimal("0"),
                )
                .order_by(ProductLot.created_at.asc(), ProductLot.id.asc())
            )
            res = await db.execute(stmt)
            lots = res.scalars().all()

            for lot in lots:
                if needed <= Decimal("0"):
                    break
                take = min(needed, lot.remaining_quantity)
                lot.remaining_quantity -= take
                cost_layer = take * lot.unit_cost
                item_cogs += cost_layer
                total_delivery_cogs += cost_layer
                needed -= take

            # Fallback if order quantity exceeds tracked lots
            if needed > Decimal("0"):
                fallback_cost = item.unit_price or Decimal("10.0000")
                cost_layer = needed * fallback_cost
                item_cogs += cost_layer
                total_delivery_cogs += cost_layer

        document.cogs = total_delivery_cogs
        await db.flush()
        return total_delivery_cogs

    @staticmethod
    async def get_fifo_inventory_valuation(db: AsyncSession) -> dict:
        """
        Calculates FIFO inventory valuation across all products and active lots.
        """
        # Sum total current stock across all physical locations
        stmt = (
            select(
                Product.id,
                Product.name,
                Product.sku,
                Product.category,
                func.coalesce(func.sum(StockLevel.current_quantity), Decimal("0.00")).label("on_hand"),
            )
            .outerjoin(StockLevel, Product.id == StockLevel.product_id)
            .group_by(Product.id)
        )
        res = await db.execute(stmt)
        products = res.all()

        # Query all active lots with remaining quantity
        lots_stmt = (
            select(ProductLot)
            .options(selectinload(ProductLot.product))
            .where(ProductLot.remaining_quantity > Decimal("0"))
            .order_by(ProductLot.created_at.asc(), ProductLot.id.asc())
        )
        lots_res = await db.execute(lots_stmt)
        active_lots = lots_res.scalars().all()

        lots_by_product: dict[uuid.UUID, list[ProductLot]] = {}
        for lot in active_lots:
            lots_by_product.setdefault(lot.product_id, []).append(lot)

        items_valuation = []
        total_valuation = Decimal("0.00")
        total_quantity = Decimal("0.00")

        for prod_id, name, sku, category, on_hand in products:
            qty = Decimal(str(on_hand))
            total_quantity += qty
            prod_lots = lots_by_product.get(prod_id, [])

            if prod_lots:
                prod_lot_val = sum(lot.remaining_quantity * lot.unit_cost for lot in prod_lots)
                prod_lot_qty = sum(lot.remaining_quantity for lot in prod_lots)
                avg_cost = (prod_lot_val / prod_lot_qty) if prod_lot_qty > Decimal("0") else Decimal("0.00")
                item_val = prod_lot_val
            else:
                avg_cost = Decimal("15.00")
                item_val = qty * avg_cost

            total_valuation += item_val

            items_valuation.append(
                {
                    "product_id": str(prod_id),
                    "product_name": name,
                    "sku": sku,
                    "category": category,
                    "on_hand_quantity": float(qty),
                    "unit_cost_basis": float(avg_cost),
                    "total_valuation": float(item_val),
                }
            )

        active_lots_data = [
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
            for lot in active_lots
        ]

        return {
            "total_inventory_valuation": float(total_valuation),
            "total_inventory_value": float(total_valuation),
            "total_inventory_quantity": float(total_quantity),
            "currency": "INR",
            "currency_symbol": "₹",
            "valuation_method": "FIFO (First-In, First-Out)",
            "items": items_valuation,
            "active_lots": active_lots_data,
        }

    @staticmethod
    async def get_lots(db: AsyncSession, product_id: uuid.UUID | None = None) -> list[ProductLot]:
        """
        Retrieves product lots, optionally filtered by product_id.
        """
        stmt = (
            select(ProductLot)
            .options(selectinload(ProductLot.product))
            .order_by(ProductLot.created_at.desc(), ProductLot.id.desc())
        )
        if product_id:
            stmt = stmt.where(ProductLot.product_id == product_id)
        res = await db.execute(stmt)
        return list(res.scalars().all())
