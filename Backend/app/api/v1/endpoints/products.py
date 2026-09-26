from decimal import Decimal
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_manager
from app.models.document import DocumentType
from app.models.location import Location
from app.models.product import Product
from app.models.stock_level import StockLevel
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentItemCreate
from app.schemas.product import (
    LocationStock,
    ProductAvailabilityResponse,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)
from app.services.document_service import DocumentService

router = APIRouter()


@router.get("", response_model=list[ProductResponse])
async def list_products(
    search: str | None = Query(None, description="Search by name or SKU"),
    category: str | None = Query(None, description="Filter by category"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(
            Product,
            func.coalesce(func.sum(StockLevel.current_quantity), Decimal("0.00")).label("total_stock"),
        )
        .outerjoin(StockLevel, Product.id == StockLevel.product_id)
        .group_by(Product.id)
        .order_by(Product.name.asc())
    )

    if search:
        search_fmt = f"%{search}%"
        stmt = stmt.where((Product.name.ilike(search_fmt)) | (Product.sku.ilike(search_fmt)))
    if category:
        stmt = stmt.where(Product.category == category)

    stmt = stmt.offset(skip).limit(limit)
    res = await db.execute(stmt)
    rows = res.all()

    products: list[ProductResponse] = []
    for prod, stock in rows:
        p_resp = ProductResponse.model_validate(prod)
        p_resp.total_stock = Decimal(str(stock))
        products.append(p_resp)

    return products


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_in: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    # Check if SKU exists
    existing = await db.execute(select(Product).where(Product.sku == product_in.sku))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product_in.sku}' already exists.",
        )

    product = Product(
        name=product_in.name,
        sku=product_in.sku,
        category=product_in.category,
        unit_of_measure=product_in.unit_of_measure,
        low_stock_threshold=product_in.low_stock_threshold,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)

    # If initial stock provided with location, record receipt in double-entry ledger
    total_stock = Decimal("0.00")
    if product_in.initial_stock > Decimal("0") and product_in.initial_location_id:
        doc_in = DocumentCreate(
            type=DocumentType.RECEIPT,
            destination_location_id=product_in.initial_location_id,
            notes=f"Initial stock creation for SKU {product.sku}",
            items=[DocumentItemCreate(product_id=product.id, quantity=product_in.initial_stock)],
        )
        doc = await DocumentService.create_document(db, doc_in, user=current_user)
        await DocumentService.validate_document(db, doc.id)
        total_stock = product_in.initial_stock

    resp = ProductResponse.model_validate(product)
    resp.total_stock = total_stock
    return resp


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(
            Product,
            func.coalesce(func.sum(StockLevel.current_quantity), Decimal("0.00")).label("total_stock"),
        )
        .outerjoin(StockLevel, Product.id == StockLevel.product_id)
        .where(Product.id == product_id)
        .group_by(Product.id)
    )
    res = await db.execute(stmt)
    row = res.first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found",
        )

    product, stock = row
    resp = ProductResponse.model_validate(product)
    resp.total_stock = Decimal(str(stock))
    return resp


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    update_in: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    res = await db.execute(select(Product).where(Product.id == product_id))
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found",
        )

    if update_in.name is not None:
        product.name = update_in.name
    if update_in.category is not None:
        product.category = update_in.category
    if update_in.unit_of_measure is not None:
        product.unit_of_measure = update_in.unit_of_measure
    if update_in.low_stock_threshold is not None:
        product.low_stock_threshold = update_in.low_stock_threshold

    await db.commit()
    await db.refresh(product)
    return await get_product(product_id=product.id, db=db, current_user=current_user)


@router.get("/{product_id}/availability", response_model=ProductAvailabilityResponse)
async def get_product_availability(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify product exists
    prod_res = await db.execute(select(Product).where(Product.id == product_id))
    product = prod_res.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found",
        )

    # Query all location stock levels
    stmt = (
        select(Location, StockLevel.current_quantity, StockLevel.reserved_quantity)
        .join(StockLevel, Location.id == StockLevel.location_id)
        .where(StockLevel.product_id == product_id)
        .order_by(Location.name.asc())
    )
    res = await db.execute(stmt)
    rows = res.all()

    locations_data: list[LocationStock] = []
    total = Decimal("0.00")
    for loc, cur_qty, res_qty in rows:
        physical = Decimal(str(cur_qty))
        reserved = Decimal(str(res_qty))
        available = physical - reserved
        total += physical
        locations_data.append(
            LocationStock(
                location_id=loc.id,
                location_name=loc.name,
                location_type=loc.type.value if hasattr(loc.type, "value") else str(loc.type),
                physical_stock=physical,
                reserved_stock=reserved,
                available_stock=available,
                quantity=physical,
            )
        )

    return ProductAvailabilityResponse(
        product_id=product.id,
        product_name=product.name,
        sku=product.sku,
        total_stock=total,
        locations=locations_data,
    )
