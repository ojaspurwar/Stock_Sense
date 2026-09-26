from datetime import datetime
import uuid
from pydantic import BaseModel, ConfigDict
from app.models.location import LocationType


class LocationBase(BaseModel):
    name: str
    type: LocationType


class LocationCreate(LocationBase):
    pass


class LocationResponse(LocationBase):
    id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
