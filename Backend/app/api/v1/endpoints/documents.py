import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.document import DocumentStatus, DocumentType
from app.models.user import User
from app.schemas.document import (
    DocumentCreate,
    DocumentResponse,
    DocumentUpdateStatus,
)
from app.services.document_service import DocumentService

router = APIRouter()


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    doc_type: DocumentType | None = Query(None, alias="type"),
    doc_status: DocumentStatus | None = Query(None, alias="status"),
    location_id: uuid.UUID | None = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DocumentService.list_documents(
        db,
        doc_type=doc_type,
        status_filter=doc_status,
        location_id=location_id,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    doc_in: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DocumentService.create_document(db, doc_in, user=current_user)


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DocumentService.get_document_by_id(db, document_id)


@router.patch("/{document_id}/status", response_model=DocumentResponse)
async def update_document_status(
    document_id: uuid.UUID,
    status_update: DocumentUpdateStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DocumentService.update_status(db, document_id, status_update.status)


@router.post("/{document_id}/validate", response_model=DocumentResponse)
async def validate_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DocumentService.validate_document(db, document_id)
