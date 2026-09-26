"""
The Smart Batch Tracker (fifo_service.py)
Implements FIFO (First-In, First-Out) lot tracking, real-time COGS calculation,
and asset valuation in Indian Rupees (INR / ₹).
"""
from decimal import Decimal
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.models.product_lot import ProductLot
from app.services.ledger_engine import LedgerEngine


class FifoService:
    @staticmethod
    async def record_receipt_lots(db: AsyncSession, document: Document) -> list[ProductLot]:
        """
        Creates incoming product lots with purchase cost upon Receipt validation.
        """
        return await LedgerEngine.record_receipt_lots(db, document)

    @staticmethod
    async def consume_delivery_lots_fifo(db: AsyncSession, document: Document) -> Decimal:
        """
        Consumes stock from oldest lots in FIFO order, calculating real-time COGS in INR (₹).
        """
        return await LedgerEngine.consume_delivery_lots_fifo(db, document)

    @staticmethod
    async def get_fifo_inventory_valuation(db: AsyncSession) -> dict:
        """
        Calculates total inventory asset valuation in Indian Rupees (INR / ₹),
        average unit costs, and provides an active lot breakdown.
        """
        return await LedgerEngine.get_fifo_inventory_valuation(db)

    @staticmethod
    async def get_lots(db: AsyncSession, product_id: uuid.UUID | None = None) -> list[ProductLot]:
        """
        Retrieves all active and historical lots, optionally filtered by product_id.
        """
        return await LedgerEngine.get_lots(db, product_id=product_id)
