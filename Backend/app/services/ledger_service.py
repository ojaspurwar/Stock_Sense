"""
The Tamper-Proof Ledger Service (ledger_service.py)
Handles append-only double-entry stock ledger movements and SHA-256 cryptographic chain verification.
"""
from datetime import datetime
from decimal import Decimal
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.models.stock_ledger import StockLedger
from app.services.ledger_engine import LedgerEngine


class LedgerService:
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
        Calculates SHA-256 digital fingerprint for a stock ledger entry.
        """
        return LedgerEngine.calculate_hash(
            prev_hash=prev_hash,
            document_id=document_id,
            product_id=product_id,
            source_loc=source_loc,
            dest_loc=dest_loc,
            qty=qty,
            timestamp=timestamp,
        )

    @staticmethod
    async def process_document_ledger(db: AsyncSession, document: Document) -> list[StockLedger]:
        """
        Executes double-entry balance movements and creates cryptographically chained ledger rows.
        """
        return await LedgerEngine.process_document_ledger(db, document)

    @staticmethod
    async def verify_chain(db: AsyncSession) -> dict:
        """
        Verifies the cryptographic SHA-256 chain from genesis to tip.
        Detects any covert employee theft, shrinkage, or database mutations.
        """
        return await LedgerEngine.verify_chain(db)
