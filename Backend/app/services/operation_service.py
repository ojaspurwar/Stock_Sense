"""
The Paperwork Rulebook (operation_service.py)
Enforces the 5-stage document lifecycle (DRAFT -> WAITING -> READY -> DONE / CANCELED)
and coordinates atomic ledger commitment.
"""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentStatus, DocumentType
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentUpdateStatus
from app.services.document_service import DocumentService


class OperationService:
    @staticmethod
    async def create_operation(
        db: AsyncSession, doc_in: DocumentCreate, user: User
    ) -> Document:
        return await DocumentService.create_document(db, doc_in, user)

    @staticmethod
    async def get_operation_by_id(db: AsyncSession, document_id: uuid.UUID) -> Document:
        return await DocumentService.get_document_by_id(db, document_id)

    @staticmethod
    async def list_operations(
        db: AsyncSession,
        doc_type: DocumentType | None = None,
        status: DocumentStatus | None = None,
        location_id: uuid.UUID | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Document]:
        return await DocumentService.list_documents(
            db, doc_type=doc_type, status=status, location_id=location_id, skip=skip, limit=limit
        )

    @staticmethod
    async def transition_status(
        db: AsyncSession, document_id: uuid.UUID, new_status: DocumentStatus
    ) -> Document:
        return await DocumentService.transition_status(db, document_id, new_status)

    @staticmethod
    async def validate_operation(db: AsyncSession, document_id: uuid.UUID) -> Document:
        return await DocumentService.validate_document(db, document_id)
