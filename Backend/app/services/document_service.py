from datetime import datetime, timezone
import random
import string
import uuid
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.document import Document, DocumentItem, DocumentType, DocumentStatus
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentUpdateStatus
from app.services.ledger_engine import LedgerEngine


class DocumentService:
    @staticmethod
    def _generate_doc_number(doc_type: DocumentType) -> str:
        prefix_map = {
            DocumentType.RECEIPT: "REC",
            DocumentType.DELIVERY: "DEL",
            DocumentType.TRANSFER: "TRF",
            DocumentType.ADJUSTMENT: "ADJ",
        }
        prefix = prefix_map.get(doc_type, "DOC")
        random_suffix = "".join(random.choices(string.digits, k=6))
        return f"{prefix}-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{random_suffix}"

    @staticmethod
    async def create_document(
        db: AsyncSession, doc_in: DocumentCreate, user: User
    ) -> Document:
        doc_num = doc_in.document_number or DocumentService._generate_doc_number(doc_in.type)

        # Check document number uniqueness
        res = await db.execute(select(Document).where(Document.document_number == doc_num))
        if res.scalar_one_or_none():
            doc_num = DocumentService._generate_doc_number(doc_in.type)

        document = Document(
            document_number=doc_num,
            type=doc_in.type,
            status=DocumentStatus.DRAFT,
            created_by=user.id,
            source_location_id=doc_in.source_location_id,
            destination_location_id=doc_in.destination_location_id,
            notes=doc_in.notes,
        )
        db.add(document)
        await db.flush()

        # Add line items
        for item_in in doc_in.items:
            item = DocumentItem(
                document_id=document.id,
                product_id=item_in.product_id,
                quantity=item_in.quantity,
            )
            db.add(item)

        await db.commit()
        return await DocumentService.get_document_by_id(db, document.id)

    @staticmethod
    async def get_document_by_id(db: AsyncSession, document_id: uuid.UUID) -> Document:
        stmt = (
            select(Document)
            .where(Document.id == document_id)
            .options(
                selectinload(Document.items).selectinload(DocumentItem.product),
                selectinload(Document.source_location),
                selectinload(Document.destination_location),
            )
        )
        res = await db.execute(stmt)
        document = res.scalar_one_or_none()
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document {document_id} not found",
            )
        return document

    @staticmethod
    async def list_documents(
        db: AsyncSession,
        doc_type: DocumentType | None = None,
        status_filter: DocumentStatus | None = None,
        location_id: uuid.UUID | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Document]:
        stmt = (
            select(Document)
            .options(
                selectinload(Document.items).selectinload(DocumentItem.product),
                selectinload(Document.source_location),
                selectinload(Document.destination_location),
            )
            .order_by(Document.created_at.desc())
        )

        if doc_type:
            stmt = stmt.where(Document.type == doc_type)
        if status_filter:
            stmt = stmt.where(Document.status == status_filter)
        if location_id:
            stmt = stmt.where(
                (Document.source_location_id == location_id)
                | (Document.destination_location_id == location_id)
            )

        stmt = stmt.offset(skip).limit(limit)
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def update_status(
        db: AsyncSession, document_id: uuid.UUID, new_status: DocumentStatus
    ) -> Document:
        document = await DocumentService.get_document_by_id(db, document_id)

        if document.status == DocumentStatus.DONE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Completed (DONE) documents cannot be modified.",
            )
        if document.status == DocumentStatus.CANCELED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Canceled documents cannot be reopened.",
            )

        if new_status == DocumentStatus.DONE:
            # Delegate to validation & ledger processing
            return await DocumentService.validate_document(db, document_id)

        document.status = new_status
        await db.commit()
        await db.refresh(document)
        return document

    @staticmethod
    async def validate_document(db: AsyncSession, document_id: uuid.UUID) -> Document:
        """
        Validates document and commits changes to double-entry ledger atomically.
        """
        document = await DocumentService.get_document_by_id(db, document_id)

        if document.status == DocumentStatus.DONE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document has already been validated and marked DONE.",
            )
        if document.status == DocumentStatus.CANCELED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot validate a canceled document.",
            )

        # Execute ledger transactions
        await LedgerEngine.process_document_ledger(db, document)

        document.status = DocumentStatus.DONE
        await db.commit()
        return await DocumentService.get_document_by_id(db, document_id)
