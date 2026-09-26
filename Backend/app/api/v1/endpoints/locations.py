import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_manager
from app.models.location import Location
from app.models.user import User
from app.schemas.location import LocationCreate, LocationResponse

router = APIRouter()


@router.get("", response_model=list[LocationResponse])
async def list_locations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Location).order_by(Location.name.asc()))
    return list(result.scalars().all())


@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    location_in: LocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    # Check if location name already exists
    res = await db.execute(select(Location).where(Location.name == location_in.name))
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Location with name '{location_in.name}' already exists.",
        )

    location = Location(name=location_in.name, type=location_in.type)
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return location


@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Location).where(Location.id == location_id))
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location {location_id} not found",
        )
    return location
