import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import String, DateTime, Enum, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LocationType(str, enum.Enum):
    WAREHOUSE = "WAREHOUSE"
    RACK = "RACK"
    PRODUCTION = "PRODUCTION"


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    type: Mapped[LocationType] = mapped_column(
        Enum(LocationType, name="location_type_enum"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    stock_levels = relationship("StockLevel", back_populates="location", cascade="all, delete-orphan")
