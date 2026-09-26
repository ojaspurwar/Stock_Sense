from decimal import Decimal
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentStatus, DocumentType
from app.models.product import Product
from app.models.stock_level import StockLevel
from app.schemas.dashboard import DashboardKPIs, LowStockAlert


class DashboardService:
    @staticmethod
    async def get_kpis(db: AsyncSession) -> DashboardKPIs:
        # Total products count
        total_products_res = await db.execute(select(func.count(Product.id)))
        total_products = total_products_res.scalar() or 0

        # Pending Receipts (DRAFT, WAITING, READY)
        pending_receipts_res = await db.execute(
            select(func.count(Document.id)).where(
                Document.type == DocumentType.RECEIPT,
                Document.status.in_([DocumentStatus.DRAFT, DocumentStatus.WAITING, DocumentStatus.READY]),
            )
        )
        pending_receipts = pending_receipts_res.scalar() or 0

        # Pending Deliveries
        pending_deliveries_res = await db.execute(
            select(func.count(Document.id)).where(
                Document.type == DocumentType.DELIVERY,
                Document.status.in_([DocumentStatus.DRAFT, DocumentStatus.WAITING, DocumentStatus.READY]),
            )
        )
        pending_deliveries = pending_deliveries_res.scalar() or 0

        # Scheduled Transfers
        scheduled_transfers_res = await db.execute(
            select(func.count(Document.id)).where(
                Document.type == DocumentType.TRANSFER,
                Document.status.in_([DocumentStatus.DRAFT, DocumentStatus.WAITING, DocumentStatus.READY]),
            )
        )
        scheduled_transfers = scheduled_transfers_res.scalar() or 0

        # Stock aggregation per product
        stock_agg = (
            select(
                Product.id,
                Product.sku,
                Product.name,
                Product.category,
                Product.unit_of_measure,
                Product.low_stock_threshold,
                func.coalesce(func.sum(StockLevel.current_quantity), 0).label("total_stock"),
            )
            .outerjoin(StockLevel, Product.id == StockLevel.product_id)
            .group_by(Product.id)
        )
        res = await db.execute(stock_agg)
        product_stocks = res.all()

        low_stock_count = 0
        out_of_stock_count = 0
        low_stock_alerts: list[LowStockAlert] = []

        for p in product_stocks:
            current_stock = Decimal(str(p.total_stock))
            threshold = Decimal(str(p.low_stock_threshold))

            if current_stock <= Decimal("0"):
                out_of_stock_count += 1
                low_stock_alerts.append(
                    LowStockAlert(
                        product_id=p.id,
                        sku=p.sku,
                        name=p.name,
                        category=p.category,
                        unit_of_measure=p.unit_of_measure,
                        current_stock=current_stock,
                        low_stock_threshold=threshold,
                        is_out_of_stock=True,
                    )
                )
            elif current_stock < threshold:
                low_stock_count += 1
                low_stock_alerts.append(
                    LowStockAlert(
                        product_id=p.id,
                        sku=p.sku,
                        name=p.name,
                        category=p.category,
                        unit_of_measure=p.unit_of_measure,
                        current_stock=current_stock,
                        low_stock_threshold=threshold,
                        is_out_of_stock=False,
                    )
                )

        return DashboardKPIs(
            total_products=total_products,
            low_stock_count=low_stock_count,
            out_of_stock_count=out_of_stock_count,
            pending_receipts_count=pending_receipts,
            pending_deliveries_count=pending_deliveries,
            scheduled_transfers_count=scheduled_transfers,
            low_stock_items=low_stock_alerts,
        )
