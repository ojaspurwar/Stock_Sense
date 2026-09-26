"""
Database Seeder Script for StockSense
Command: python -m app.core.seed

Loads realistic Indian industrial warehouse inventory data, real suppliers and customers,
multi-batch FIFO lots with prices in Indian Rupees (INR / ₹), completed transactions with
a cryptographically intact SHA-256 chain, and ready-to-use Manager & Staff accounts.
"""
import asyncio
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.location import Location, LocationType
from app.models.product import Product
from app.models.document import Document, DocumentItem, DocumentType, DocumentStatus
from app.models.product_lot import ProductLot
from app.models.stock_level import StockLevel
from app.models.stock_ledger import StockLedger
from app.services.ledger_engine import LedgerEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")


async def _seed_with_session(db: AsyncSession):
    # 1. Check if already seeded
    check_user = await db.execute(select(User).where(User.email == "manager@stocksense.in"))
    if check_user.scalar_one_or_none():
        logger.info("Database has already been seeded. Skipping seeding.")
        return

    logger.info("Seeding ready-to-use user accounts...")
    # 2. Users
    manager = User(
        email="manager@stocksense.in",
        name="Rajesh Sharma",
        password_hash=get_password_hash("Manager@123"),
        role=UserRole.MANAGER,
    )
    staff = User(
        email="staff@stocksense.in",
        name="Amit Kumar",
        password_hash=get_password_hash("Staff@123"),
        role=UserRole.STAFF,
    )
    db.add_all([manager, staff])
    await db.flush()

    logger.info("Seeding physical and virtual locations...")
    # 3. Locations
    loc_central = Location(
        name="Central Warehouse (Bhiwandi Hub)",
        type=LocationType.WAREHOUSE,
    )
    loc_rack_a = Location(
        name="Rack A - High Velocity",
        type=LocationType.RACK,
    )
    loc_rack_b = Location(
        name="Rack B - Heavy Storage",
        type=LocationType.RACK,
    )
    loc_prod = Location(
        name="Manufacturing & Assembly Floor",
        type=LocationType.PRODUCTION,
    )
    # Virtual Locations
    loc_vendor_tata = Location(
        name="Tata Steel Supplies Ltd (Vendor)",
        type=LocationType.VENDOR,
    )
    loc_vendor_bhel = Location(
        name="Bharat Heavy Electricals Ltd (Vendor)",
        type=LocationType.VENDOR,
    )
    loc_cust_lt = Location(
        name="L&T Infrastructure Projects (Customer)",
        type=LocationType.CUSTOMER,
    )
    loc_loss = Location(
        name="Inventory Loss & Scrap Disposal",
        type=LocationType.INVENTORY_LOSS,
    )
    db.add_all([
        loc_central, loc_rack_a, loc_rack_b, loc_prod,
        loc_vendor_tata, loc_vendor_bhel, loc_cust_lt, loc_loss
    ])
    await db.flush()

    logger.info("Seeding industrial products with realistic Indian industrial SKUs...")
    # 4. Products
    prod_coils = Product(
        name="Hot Rolled Steel Coils",
        sku="IND-STL-COIL-01",
        category="Raw Materials",
        unit_of_measure="ton",
        low_stock_threshold=Decimal("30.00"),
    )
    prod_racks = Product(
        name="Heavy Duty Industrial Shelves",
        sku="IND-SHF-HD-02",
        category="Storage Equipment",
        unit_of_measure="units",
        low_stock_threshold=Decimal("15.00"),
    )
    prod_bearings = Product(
        name="High-Precision Ball Bearings",
        sku="IND-BRG-PREC-03",
        category="Machinery Spares",
        unit_of_measure="pcs",
        low_stock_threshold=Decimal("50.00"),
    )
    prod_valves = Product(
        name="High-Pressure Hydraulic Valves",
        sku="IND-VLV-HYDR-04",
        category="Fluid Systems",
        unit_of_measure="pcs",
        low_stock_threshold=Decimal("20.00"),
    )
    prod_copper = Product(
        name="Electrolytic Copper Wire Spools",
        sku="IND-CPR-WIRE-05",
        category="Electrical Spares",
        unit_of_measure="spools",
        low_stock_threshold=Decimal("40.00"),
    )
    db.add_all([prod_coils, prod_racks, prod_bearings, prod_valves, prod_copper])
    await db.flush()

    logger.info("Processing realistic transaction slips with cryptographic chain & FIFO lots in INR (₹)...")
    base_ts = datetime.now(timezone.utc) - timedelta(days=90)
    ts1 = base_ts + timedelta(days=10)
    ts2 = base_ts + timedelta(days=40)
    ts3 = base_ts + timedelta(days=60)
    ts4 = base_ts + timedelta(days=70)
    ts5 = base_ts + timedelta(days=80)
    ts6 = base_ts + timedelta(days=85)
    ts7 = base_ts + timedelta(days=89)
    current_chain_hash = "0" * 64

    # Operation 1: January Receipt of Steel Coils (100 units @ ₹4,500/unit)
    doc1 = Document(
        document_number="REC-2026-001",
        type=DocumentType.RECEIPT,
        status=DocumentStatus.DONE,
        created_by=manager.id,
        source_location_id=loc_vendor_tata.id,
        destination_location_id=loc_central.id,
        notes="January shipment of Hot Rolled Steel Coils from Tata Steel",
        created_at=ts1,
    )
    db.add(doc1)
    await db.flush()

    item1 = DocumentItem(
        document_id=doc1.id,
        product_id=prod_coils.id,
        quantity=Decimal("100.0000"),
        unit_price=Decimal("4500.0000"),  # ₹4,500
    )
    db.add(item1)

    # Lot 1
    lot1 = ProductLot(
        lot_number="LOT-REC-2026-001-1",
        product_id=prod_coils.id,
        document_id=doc1.id,
        initial_quantity=Decimal("100.0000"),
        remaining_quantity=Decimal("100.0000"),
        unit_cost=Decimal("4500.0000"),
        created_at=ts1,
    )
    db.add(lot1)

    # Stock level
    lvl_coils_central = StockLevel(
        product_id=prod_coils.id,
        location_id=loc_central.id,
        current_quantity=Decimal("100.0000"),
        reserved_quantity=Decimal("0.0000"),
    )
    db.add(lvl_coils_central)

    # Ledger Entry for Doc 1
    h1 = LedgerEngine.calculate_hash(
        prev_hash=current_chain_hash,
        document_id=doc1.id,
        product_id=prod_coils.id,
        source_loc=None,
        dest_loc=loc_central.id,
        qty=Decimal("100.0000"),
        timestamp=ts1,
    )
    tx1 = StockLedger(
        document_id=doc1.id,
        product_id=prod_coils.id,
        source_location_id=None,
        destination_location_id=loc_central.id,
        quantity=Decimal("100.0000"),
        timestamp=ts1,
        prev_hash=current_chain_hash,
        entry_hash=h1,
    )
    db.add(tx1)
    current_chain_hash = h1

    # Operation 2: February Receipt of Steel Coils (50 units @ ₹5,200/unit due to price hike)
    doc2 = Document(
        document_number="REC-2026-002",
        type=DocumentType.RECEIPT,
        status=DocumentStatus.DONE,
        created_by=manager.id,
        source_location_id=loc_vendor_tata.id,
        destination_location_id=loc_central.id,
        notes="February shipment of Hot Rolled Steel Coils with updated commodity pricing",
        created_at=ts2,
    )
    db.add(doc2)
    await db.flush()

    item2 = DocumentItem(
        document_id=doc2.id,
        product_id=prod_coils.id,
        quantity=Decimal("50.0000"),
        unit_price=Decimal("5200.0000"),  # ₹5,200
    )
    db.add(item2)

    # Lot 2
    lot2 = ProductLot(
        lot_number="LOT-REC-2026-002-1",
        product_id=prod_coils.id,
        document_id=doc2.id,
        initial_quantity=Decimal("50.0000"),
        remaining_quantity=Decimal("50.0000"),
        unit_cost=Decimal("5200.0000"),
        created_at=ts2,
    )
    db.add(lot2)

    lvl_coils_central.current_quantity += Decimal("50.0000")

    h2 = LedgerEngine.calculate_hash(
        prev_hash=current_chain_hash,
        document_id=doc2.id,
        product_id=prod_coils.id,
        source_loc=None,
        dest_loc=loc_central.id,
        qty=Decimal("50.0000"),
        timestamp=ts2,
    )
    tx2 = StockLedger(
        document_id=doc2.id,
        product_id=prod_coils.id,
        source_location_id=None,
        destination_location_id=loc_central.id,
        quantity=Decimal("50.0000"),
        timestamp=ts2,
        prev_hash=current_chain_hash,
        entry_hash=h2,
    )
    db.add(tx2)
    current_chain_hash = h2

    # Operation 3: March Delivery Order to L&T Infra (60 units of Steel Coils)
    # FIFO Consumption: 60 consumed from Lot 1 @ ₹4,500 = COGS ₹270,000
    # Lot 1 remaining: 40 units. Lot 2 remaining: 50 units.
    doc3 = Document(
        document_number="DEL-2026-001",
        type=DocumentType.DELIVERY,
        status=DocumentStatus.DONE,
        created_by=staff.id,
        source_location_id=loc_central.id,
        destination_location_id=loc_cust_lt.id,
        notes="Dispatched 60 units of Steel Coils to L&T Project Site",
        cogs=Decimal("270000.0000"),  # 60 * 4500
        created_at=ts3,
    )
    db.add(doc3)
    await db.flush()

    item3 = DocumentItem(
        document_id=doc3.id,
        product_id=prod_coils.id,
        quantity=Decimal("60.0000"),
    )
    db.add(item3)

    lot1.remaining_quantity -= Decimal("60.0000")  # 40 left
    lvl_coils_central.current_quantity -= Decimal("60.0000")  # 90 left

    h3 = LedgerEngine.calculate_hash(
        prev_hash=current_chain_hash,
        document_id=doc3.id,
        product_id=prod_coils.id,
        source_loc=loc_central.id,
        dest_loc=None,
        qty=Decimal("60.0000"),
        timestamp=ts3,
    )
    tx3 = StockLedger(
        document_id=doc3.id,
        product_id=prod_coils.id,
        source_location_id=loc_central.id,
        destination_location_id=None,
        quantity=Decimal("60.0000"),
        timestamp=ts3,
        prev_hash=current_chain_hash,
        entry_hash=h3,
    )
    db.add(tx3)
    current_chain_hash = h3

    # Operation 4: Receipt of Shelves (30 units @ ₹8,500/unit) into Rack A
    doc4 = Document(
        document_number="REC-2026-003",
        type=DocumentType.RECEIPT,
        status=DocumentStatus.DONE,
        created_by=manager.id,
        source_location_id=loc_vendor_bhel.id,
        destination_location_id=loc_rack_a.id,
        notes="Heavy duty shelving assemblies received into Rack A",
        created_at=ts4,
    )
    db.add(doc4)
    await db.flush()

    item4 = DocumentItem(
        document_id=doc4.id,
        product_id=prod_racks.id,
        quantity=Decimal("30.0000"),
        unit_price=Decimal("8500.0000"),
    )
    db.add(item4)

    lot4 = ProductLot(
        lot_number="LOT-REC-2026-003-1",
        product_id=prod_racks.id,
        document_id=doc4.id,
        initial_quantity=Decimal("30.0000"),
        remaining_quantity=Decimal("30.0000"),
        unit_cost=Decimal("8500.0000"),
        created_at=ts4,
    )
    db.add(lot4)

    lvl_racks = StockLevel(
        product_id=prod_racks.id,
        location_id=loc_rack_a.id,
        current_quantity=Decimal("30.0000"),
        reserved_quantity=Decimal("0.0000"),
    )
    db.add(lvl_racks)

    h4 = LedgerEngine.calculate_hash(
        prev_hash=current_chain_hash,
        document_id=doc4.id,
        product_id=prod_racks.id,
        source_loc=None,
        dest_loc=loc_rack_a.id,
        qty=Decimal("30.0000"),
        timestamp=ts4,
    )
    tx4 = StockLedger(
        document_id=doc4.id,
        product_id=prod_racks.id,
        source_location_id=None,
        destination_location_id=loc_rack_a.id,
        quantity=Decimal("30.0000"),
        timestamp=ts4,
        prev_hash=current_chain_hash,
        entry_hash=h4,
    )
    db.add(tx4)
    current_chain_hash = h4

    # Operation 5: Receipt of Ball Bearings (150 pcs @ ₹220/pc) into Rack B
    doc5 = Document(
        document_number="REC-2026-004",
        type=DocumentType.RECEIPT,
        status=DocumentStatus.DONE,
        created_by=staff.id,
        source_location_id=loc_vendor_bhel.id,
        destination_location_id=loc_rack_b.id,
        notes="Precision bearings delivery from BHEL",
        created_at=ts5,
    )
    db.add(doc5)
    await db.flush()

    item5 = DocumentItem(
        document_id=doc5.id,
        product_id=prod_bearings.id,
        quantity=Decimal("150.0000"),
        unit_price=Decimal("220.0000"),
    )
    db.add(item5)

    lot5 = ProductLot(
        lot_number="LOT-REC-2026-004-1",
        product_id=prod_bearings.id,
        document_id=doc5.id,
        initial_quantity=Decimal("150.0000"),
        remaining_quantity=Decimal("150.0000"),
        unit_cost=Decimal("220.0000"),
        created_at=ts5,
    )
    db.add(lot5)

    lvl_bearings = StockLevel(
        product_id=prod_bearings.id,
        location_id=loc_rack_b.id,
        current_quantity=Decimal("150.0000"),
        reserved_quantity=Decimal("0.0000"),
    )
    db.add(lvl_bearings)

    h5 = LedgerEngine.calculate_hash(
        prev_hash=current_chain_hash,
        document_id=doc5.id,
        product_id=prod_bearings.id,
        source_loc=None,
        dest_loc=loc_rack_b.id,
        qty=Decimal("150.0000"),
        timestamp=ts5,
    )
    tx5 = StockLedger(
        document_id=doc5.id,
        product_id=prod_bearings.id,
        source_location_id=None,
        destination_location_id=loc_rack_b.id,
        quantity=Decimal("150.0000"),
        timestamp=ts5,
        prev_hash=current_chain_hash,
        entry_hash=h5,
    )
    db.add(tx5)
    current_chain_hash = h5

    # Operation 6: Internal Transfer of 25 Ball Bearings from Rack B to Production Floor
    doc6 = Document(
        document_number="TRF-2026-001",
        type=DocumentType.TRANSFER,
        status=DocumentStatus.DONE,
        created_by=staff.id,
        source_location_id=loc_rack_b.id,
        destination_location_id=loc_prod.id,
        notes="Moved 25 bearings to assembly floor for production run",
        created_at=ts6,
    )
    db.add(doc6)
    await db.flush()

    item6 = DocumentItem(
        document_id=doc6.id,
        product_id=prod_bearings.id,
        quantity=Decimal("25.0000"),
    )
    db.add(item6)

    lvl_bearings.current_quantity -= Decimal("25.0000")  # 125 left in Rack B
    lvl_bearings_prod = StockLevel(
        product_id=prod_bearings.id,
        location_id=loc_prod.id,
        current_quantity=Decimal("25.0000"),
        reserved_quantity=Decimal("0.0000"),
    )
    db.add(lvl_bearings_prod)

    h6 = LedgerEngine.calculate_hash(
        prev_hash=current_chain_hash,
        document_id=doc6.id,
        product_id=prod_bearings.id,
        source_loc=loc_rack_b.id,
        dest_loc=loc_prod.id,
        qty=Decimal("25.0000"),
        timestamp=ts6,
    )
    tx6 = StockLedger(
        document_id=doc6.id,
        product_id=prod_bearings.id,
        source_location_id=loc_rack_b.id,
        destination_location_id=loc_prod.id,
        quantity=Decimal("25.0000"),
        timestamp=ts6,
        prev_hash=current_chain_hash,
        entry_hash=h6,
    )
    db.add(tx6)
    current_chain_hash = h6

    # Operation 7: Pending Outgoing Delivery in WAITING stage reserving 10 Shelves
    # Shows two-phase stock reservation on dashboard and availability
    doc7 = Document(
        document_number="DEL-2026-002",
        type=DocumentType.DELIVERY,
        status=DocumentStatus.WAITING,
        created_by=manager.id,
        source_location_id=loc_rack_a.id,
        destination_location_id=loc_cust_lt.id,
        notes="Pending shipment to L&T awaiting loading truck dispatch",
        created_at=ts7,
    )
    db.add(doc7)
    await db.flush()

    item7 = DocumentItem(
        document_id=doc7.id,
        product_id=prod_racks.id,
        quantity=Decimal("10.0000"),
    )
    db.add(item7)
    lvl_racks.reserved_quantity += Decimal("10.0000")  # Physical 30, Reserved 10, Available 20!

    await db.commit()

    logger.info("Database seeding completed successfully!")
    logger.info("=" * 60)
    logger.info("StockSense Demo Accounts:")
    logger.info("  Manager : manager@stocksense.in | Manager@123")
    logger.info("  Staff   : staff@stocksense.in   | Staff@123")
    logger.info("=" * 60)


async def seed_database(session: AsyncSession | None = None):
    if session is not None:
        await _seed_with_session(session)
    else:
        logger.info("Initializing database schema if not present...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with async_session_maker() as db:
            await _seed_with_session(db)


if __name__ == "__main__":
    asyncio.run(seed_database())
