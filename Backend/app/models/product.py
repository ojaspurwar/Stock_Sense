import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import String, DateTime, Numeric, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    unit_of_measure: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., kg, pcs, liters
    low_stock_threshold: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("10.00"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    stock_levels = relationship("StockLevel", back_populates="product", cascade="all, delete-orphan")
    ledger_entries = relationship("StockLedger", back_populates="product")
