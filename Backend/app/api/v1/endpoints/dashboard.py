from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.ledger import list_ledger_entries
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.dashboard import DashboardKPIs
from app.schemas.ledger import StockLedgerResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/kpis", response_model=DashboardKPIs)
async def get_dashboard_kpis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DashboardService.get_kpis(db)


@router.get("/moves", response_model=list[StockLedgerResponse])
async def get_recent_moves(
    limit: int = Query(15, ge=1, le=100, description="Max recent movements to retrieve"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Live Move History feed showing the latest ledger movements."""
    return await list_ledger_entries(
        product_id=None,
        document_id=None,
        location_id=None,
        skip=0,
        limit=limit,
        db=db,
        current_user=current_user,
    )

