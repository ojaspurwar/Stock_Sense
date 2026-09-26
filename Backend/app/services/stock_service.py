"""
The Shelf-Lock & Reservation System (stock_service.py)
Splits stock into Physical, Reserved, and Available stock with pessimistic row-level locking (SELECT ... FOR UPDATE).
"""
from decimal import Decimal
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.location import Location, LocationType
from app.models.product import Product
from app.models.stock_level import StockLevel
from app.schemas.product import LocationStock, ProductAvailabilityResponse
from app.services.ledger_engine import LedgerEngine


class StockService:
    @staticmethod
    async def get_or_create_stock_level(
        db: AsyncSession, product_id: uuid.UUID, location_id: uuid.UUID, for_update: bool = False
    ) -> StockLevel:
        """
        Retrieves or initializes a StockLevel row, optionally acquiring a row-level lock.
        """
        return await LedgerEngine.get_or_create_stock_level(
            db, product_id=product_id, location_id=location_id, for_update=for_update
        )

    @staticmethod
    async def get_product_availability(
        db: AsyncSession, product_id: uuid.UUID
    ) -> ProductAvailabilityResponse | None:
        """
        Calculates Physical, Reserved, and Available stock across physical warehouse locations.
        Available = Physical - Reserved.
        """
        prod_res = await db.execute(select(Product).where(Product.id == product_id))
        product = prod_res.scalar_one_or_none()
        if not product:
            return None

        stmt = (
            select(StockLevel)
            .join(Location, StockLevel.location_id == Location.id)
            .where(
                StockLevel.product_id == product_id,
                Location.type.in_([LocationType.WAREHOUSE, LocationType.RACK, LocationType.PRODUCTION]),
            )
            .options(selectinload(StockLevel.location))
        )
        levels_res = await db.execute(stmt)
        levels = levels_res.scalars().all()

        loc_stocks: list[LocationStock] = []
        total_phys = Decimal("0.0000")
        total_res = Decimal("0.0000")

        for lvl in levels:
            phys = lvl.current_quantity
            resv = lvl.reserved_quantity
            avail = max(Decimal("0.0000"), phys - resv)
            total_phys += phys
            total_res += resv
            loc_stocks.append(
                LocationStock(
                    location_id=lvl.location_id,
                    location_name=lvl.location.name,
                    location_type=lvl.location.type.value if hasattr(lvl.location.type, "value") else str(lvl.location.type),
                    physical_stock=phys,
                    reserved_stock=resv,
                    available_stock=avail,
                )
            )

        total_avail = max(Decimal("0.0000"), total_phys - total_res)

        return ProductAvailabilityResponse(
            product_id=product.id,
            sku=product.sku,
            name=product.name,
            total_physical_stock=total_phys,
            total_reserved_stock=total_res,
            total_available_stock=total_avail,
            locations=loc_stocks,
        )
