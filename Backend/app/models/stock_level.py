import uuid
from decimal import Decimal
from sqlalchemy import ForeignKey, Numeric, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StockLevel(Base):
    __tablename__ = "stock_levels"

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True
    )
    location_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("locations.id", ondelete="CASCADE"), primary_key=True
    )
    current_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), default=Decimal("0.0000"), nullable=False)

    product = relationship("Product", back_populates="stock_levels")
    location = relationship("Location", back_populates="stock_levels")
