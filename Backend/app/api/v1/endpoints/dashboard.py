from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.dashboard import DashboardKPIs
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/kpis", response_model=DashboardKPIs)
async def get_dashboard_kpis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DashboardService.get_kpis(db)
