import {
  User,
  Location,
  Product,
  Document,
  DocumentType,
  DocumentStatus,
  StockLedgerEntry,
  StockLevel,
  ProductStockSummary,
  DashboardMetrics,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_LOCATIONS,
  INITIAL_PRODUCTS,
  INITIAL_STOCK_LEVELS,
  INITIAL_DOCUMENTS,
  INITIAL_LEDGER,
} from './mockData';

const STORAGE_KEY = 'stocksense_db_v1';
const CURRENT_USER_KEY = 'stocksense_current_user_v1';

interface DBState {
  users: User[];
  locations: Location[];
  products: Product[];
  stockLevels: StockLevel[];
  documents: Document[];
  ledger: StockLedgerEntry[];
}

function getStoredDB(): DBState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: DBState = {
        users: INITIAL_USERS,
        locations: INITIAL_LOCATIONS,
        products: INITIAL_PRODUCTS,
        stockLevels: INITIAL_STOCK_LEVELS,
        documents: INITIAL_DOCUMENTS,
        ledger: INITIAL_LEDGER,
      };
      saveDB(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse mock database, resetting to default', err);
    return {
      users: INITIAL_USERS,
      locations: INITIAL_LOCATIONS,
      products: INITIAL_PRODUCTS,
      stockLevels: INITIAL_STOCK_LEVELS,
      documents: INITIAL_DOCUMENTS,
      ledger: INITIAL_LEDGER,
    };
  }
}

function saveDB(state: DBState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

export const MockStorage = {
  resetToDefaults(): void {
    const initial: DBState = {
      users: INITIAL_USERS,
      locations: INITIAL_LOCATIONS,
      products: INITIAL_PRODUCTS,
      stockLevels: INITIAL_STOCK_LEVELS,
      documents: INITIAL_DOCUMENTS,
      ledger: INITIAL_LEDGER,
    };
    saveDB(initial);
  },

  // Auth & Users
  getUsers(): User[] {
    return getStoredDB().users;
  },

  getCurrentUser(): User {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    const defaultUser = INITIAL_USERS[0]; // Sarah Connor (Manager)
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultUser));
    return defaultUser;
  },

  setCurrentUser(user: User): void {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  // Locations
  getLocations(): Location[] {
    return getStoredDB().locations;
  },

  getLocationById(id: string): Location | undefined {
    return getStoredDB().locations.find((l) => l.id === id);
  },

  // Products
  getProducts(): Product[] {
    return getStoredDB().products;
  },

  getProductById(id: string): Product | undefined {
    return getStoredDB().products.find((p) => p.id === id);
  },

  createProduct(data: {
    name: string;
    sku: string;
    category: string;
    unit_of_measure: string;
    min_reorder_level: number;
    initial_stock?: {
      location_id: string;
      quantity: number;
    };
  }): Product {
    const db = getStoredDB();
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: data.name,
      sku: data.sku.toUpperCase(),
      category: data.category,
      unit_of_measure: data.unit_of_measure,
      min_reorder_level: data.min_reorder_level,
      created_at: new Date().toISOString(),
    };

    db.products.push(newProduct);

    // If initial stock is specified, record it in stockLevels and Ledger!
    if (data.initial_stock && data.initial_stock.quantity > 0) {
      const loc = db.locations.find((l) => l.id === data.initial_stock?.location_id);
      db.stockLevels.push({
        product_id: newProduct.id,
        location_id: data.initial_stock.location_id,
        current_quantity: data.initial_stock.quantity,
      });

      // Add to Ledger as an initial receipt
      db.ledger.unshift({
        id: `ledg-${Date.now()}`,
        document_id: `doc-init-${Date.now()}`,
        document_code: `INIT-${newProduct.sku}`,
        document_type: 'RECEIPT',
        product_id: newProduct.id,
        product_name: newProduct.name,
        sku: newProduct.sku,
        source_location_id: null,
        source_location_name: 'Opening Balance',
        destination_location_id: data.initial_stock.location_id,
        destination_location_name: loc?.name || 'Assigned Location',
        quantity: data.initial_stock.quantity,
        unit_of_measure: newProduct.unit_of_measure,
        created_by_name: this.getCurrentUser().name,
        timestamp: new Date().toISOString(),
        notes: 'Initial opening stock upon product creation',
      });
    }

    saveDB(db);
    return newProduct;
  },

  // Stock Summaries
  getProductStockSummaries(locationIdFilter?: string): ProductStockSummary[] {
    const db = getStoredDB();
    const locationsMap = new Map(db.locations.map((l) => [l.id, l.name]));

    return db.products.map((prod) => {
      const prodLevels = db.stockLevels.filter((sl) => sl.product_id === prod.id);

      const locationBreakdown = prodLevels.map((lvl) => ({
        location_id: lvl.location_id,
        location_name: locationsMap.get(lvl.location_id) || 'Unknown Location',
        quantity: lvl.current_quantity,
      }));

      let totalStock = 0;
      if (locationIdFilter && locationIdFilter !== 'all') {
        const match = prodLevels.find((lvl) => lvl.location_id === locationIdFilter);
        totalStock = match ? match.current_quantity : 0;
      } else {
        totalStock = prodLevels.reduce((sum, lvl) => sum + lvl.current_quantity, 0);
      }

      return {
        ...prod,
        total_stock: totalStock,
        location_breakdown: locationBreakdown,
        is_low_stock: totalStock > 0 && totalStock <= prod.min_reorder_level,
        is_out_of_stock: totalStock <= 0,
      };
    });
  },

  // Stock level for a specific product & location
  getStockAtLocation(productId: string, locationId: string): number {
    const db = getStoredDB();
    const level = db.stockLevels.find(
      (sl) => sl.product_id === productId && sl.location_id === locationId
    );
    return level ? level.current_quantity : 0;
  },

  // Documents
  getDocuments(
    type?: DocumentType,
    status?: DocumentStatus,
    locationId?: string
  ): Document[] {
    const db = getStoredDB();
    return db.documents.filter((doc) => {
      if (type && doc.type !== type) return false;
      if (status && doc.status !== status) return false;
      if (locationId && locationId !== 'all') {
        const matchesSource = doc.source_location_id === locationId;
        const matchesDest = doc.destination_location_id === locationId;
        if (!matchesSource && !matchesDest) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getDocumentById(id: string): Document | undefined {
    return getStoredDB().documents.find((d) => d.id === id);
  },

  createDocument(doc: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Document {
    const db = getStoredDB();
    const now = new Date().toISOString();
    const newDoc: Document = {
      ...doc,
      id: `doc-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };
    db.documents.unshift(newDoc);
    saveDB(db);
    return newDoc;
  },

  updateDocumentStatus(id: string, status: DocumentStatus): Document {
    const db = getStoredDB();
    const docIndex = db.documents.findIndex((d) => d.id === id);
    if (docIndex === -1) throw new Error('Document not found');

    db.documents[docIndex].status = status;
    db.documents[docIndex].updated_at = new Date().toISOString();
    saveDB(db);
    return db.documents[docIndex];
  },

  /**
   * ATOMIC DOUBLE-ENTRY TRANSACTION VALIDATOR
   * Moves stock according to the double-entry accounting model and creates ledger entries.
   */
  validateDocument(id: string): { success: boolean; message: string; document?: Document } {
    const db = getStoredDB();
    const doc = db.documents.find((d) => d.id === id);
    if (!doc) return { success: false, message: 'Document not found' };
    if (doc.status === 'DONE') return { success: false, message: 'Document has already been validated' };

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();

    // Helper: update or insert stockLevel cache
    const updateStock = (productId: string, locationId: string, delta: number) => {
      const idx = db.stockLevels.findIndex(
        (sl) => sl.product_id === productId && sl.location_id === locationId
      );
      if (idx !== -1) {
        db.stockLevels[idx].current_quantity += delta;
      } else {
        db.stockLevels.push({
          product_id: productId,
          location_id: locationId,
          current_quantity: delta,
        });
      }
    };

    // 1. Process by Document Type
    if (doc.type === 'RECEIPT') {
      if (!doc.destination_location_id) {
        return { success: false, message: 'Destination location is required for Receipts' };
      }

      for (const line of doc.lines) {
        const qtyToReceive = line.received_quantity ?? line.quantity;
        if (qtyToReceive <= 0) continue;

        // Increase stock at destination
        updateStock(line.product_id, doc.destination_location_id, qtyToReceive);

        // Immutable Double-Entry Ledger Entry
        db.ledger.unshift({
          id: `ledg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          document_id: doc.id,
          document_code: doc.code,
          document_type: 'RECEIPT',
          product_id: line.product_id,
          product_name: line.product_name,
          sku: line.sku,
          source_location_id: null,
          source_location_name: doc.partner_name || 'Vendor (External)',
          destination_location_id: doc.destination_location_id,
          destination_location_name: doc.destination_location_name || 'Warehouse',
          quantity: qtyToReceive,
          unit_of_measure: line.unit_of_measure,
          created_by_name: currentUser.name,
          timestamp: now,
          notes: doc.notes,
        });
      }
    } else if (doc.type === 'DELIVERY') {
      if (!doc.source_location_id) {
        return { success: false, message: 'Source location is required for Deliveries' };
      }

      // Check stock availability first to avoid negative inventory
      for (const line of doc.lines) {
        const currentStock = this.getStockAtLocation(line.product_id, doc.source_location_id);
        if (currentStock < line.quantity) {
          return {
            success: false,
            message: `Insufficient stock for ${line.product_name}. Available: ${currentStock}, Required: ${line.quantity}`,
          };
        }
      }

      // Deduct stock and record ledger
      for (const line of doc.lines) {
        updateStock(line.product_id, doc.source_location_id, -line.quantity);

        db.ledger.unshift({
          id: `ledg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          document_id: doc.id,
          document_code: doc.code,
          document_type: 'DELIVERY',
          product_id: line.product_id,
          product_name: line.product_name,
          sku: line.sku,
          source_location_id: doc.source_location_id,
          source_location_name: doc.source_location_name || 'Warehouse',
          destination_location_id: null,
          destination_location_name: doc.partner_name || 'Customer (External)',
          quantity: line.quantity,
          unit_of_measure: line.unit_of_measure,
          created_by_name: currentUser.name,
          timestamp: now,
          notes: doc.notes,
        });
      }
    } else if (doc.type === 'TRANSFER') {
      if (!doc.source_location_id || !doc.destination_location_id) {
        return { success: false, message: 'Source and destination locations are required for Transfers' };
      }
      if (doc.source_location_id === doc.destination_location_id) {
        return { success: false, message: 'Source and destination locations must be different' };
      }

      // Check availability at source
      for (const line of doc.lines) {
        const currentStock = this.getStockAtLocation(line.product_id, doc.source_location_id);
        if (currentStock < line.quantity) {
          return {
            success: false,
            message: `Insufficient stock at source for ${line.product_name}. Available: ${currentStock}, Transfer qty: ${line.quantity}`,
          };
        }
      }

      // Move stock: -source, +destination
      for (const line of doc.lines) {
        updateStock(line.product_id, doc.source_location_id, -line.quantity);
        updateStock(line.product_id, doc.destination_location_id, line.quantity);

        db.ledger.unshift({
          id: `ledg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          document_id: doc.id,
          document_code: doc.code,
          document_type: 'TRANSFER',
          product_id: line.product_id,
          product_name: line.product_name,
          sku: line.sku,
          source_location_id: doc.source_location_id,
          source_location_name: doc.source_location_name || 'Source',
          destination_location_id: doc.destination_location_id,
          destination_location_name: doc.destination_location_name || 'Destination',
          quantity: line.quantity,
          unit_of_measure: line.unit_of_measure,
          created_by_name: currentUser.name,
          timestamp: now,
          notes: doc.notes,
        });
      }
    } else if (doc.type === 'ADJUSTMENT') {
      const locId = doc.destination_location_id || doc.source_location_id;
      if (!locId) {
        return { success: false, message: 'Location is required for Stock Adjustments' };
      }

      for (const line of doc.lines) {
        const delta = line.quantity; // delta can be positive or negative
        updateStock(line.product_id, locId, delta);

        db.ledger.unshift({
          id: `ledg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          document_id: doc.id,
          document_code: doc.code,
          document_type: 'ADJUSTMENT',
          product_id: line.product_id,
          product_name: line.product_name,
          sku: line.sku,
          source_location_id: delta < 0 ? locId : null,
          source_location_name: delta < 0 ? doc.destination_location_name || 'Location' : 'Physical Recount Adjustment',
          destination_location_id: delta > 0 ? locId : null,
          destination_location_name: delta > 0 ? doc.destination_location_name || 'Location' : 'Loss / Discrepancy Adjustment',
          quantity: Math.abs(delta),
          unit_of_measure: line.unit_of_measure,
          created_by_name: currentUser.name,
          timestamp: now,
          notes: doc.notes || `Discrepancy adjustment: ${delta > 0 ? '+' : ''}${delta}`,
        });
      }
    }

    doc.status = 'DONE';
    doc.updated_at = now;
    saveDB(db);

    return {
      success: true,
      message: `Document ${doc.code} validated successfully. Ledger and stock levels updated.`,
      document: doc,
    };
  },

  // Stock Ledger
  getLedger(productId?: string, locationId?: string): StockLedgerEntry[] {
    const db = getStoredDB();
    return db.ledger.filter((entry) => {
      if (productId && entry.product_id !== productId) return false;
      if (locationId && locationId !== 'all') {
        if (entry.source_location_id !== locationId && entry.destination_location_id !== locationId) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  // Dashboard Metrics
  getDashboardMetrics(locationIdFilter?: string): DashboardMetrics {
    const summaries = this.getProductStockSummaries(locationIdFilter);
    const documents = this.getDocuments(undefined, undefined, locationIdFilter);

    const pendingReceipts = documents.filter(
      (d) => d.type === 'RECEIPT' && (d.status === 'READY' || d.status === 'WAITING' || d.status === 'DRAFT')
    ).length;

    const pendingDeliveries = documents.filter(
      (d) => d.type === 'DELIVERY' && (d.status === 'READY' || d.status === 'WAITING' || d.status === 'DRAFT')
    ).length;

    const scheduledTransfers = documents.filter(
      (d) => d.type === 'TRANSFER' && (d.status === 'READY' || d.status === 'WAITING' || d.status === 'DRAFT')
    ).length;

    const recentAdjustments = documents.filter((d) => d.type === 'ADJUSTMENT').length;

    return {
      total_products: summaries.length,
      low_stock_count: summaries.filter((s) => s.is_low_stock).length,
      out_of_stock_count: summaries.filter((s) => s.is_out_of_stock).length,
      pending_receipts: pendingReceipts,
      pending_deliveries: pendingDeliveries,
      scheduled_transfers: scheduledTransfers,
      recent_adjustments: recentAdjustments,
    };
  },
};
