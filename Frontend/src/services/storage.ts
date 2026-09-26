import AsyncStorage from '@react-native-async-storage/async-storage';
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

const STORAGE_KEY = 'stocksense_mobile_db_v1';
const CURRENT_USER_KEY = 'stocksense_mobile_user_v1';

interface DBState {
  users: User[];
  locations: Location[];
  products: Product[];
  stockLevels: StockLevel[];
  documents: Document[];
  ledger: StockLedgerEntry[];
}

export const MobileStorage = {
  async getDB(): Promise<DBState> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial: DBState = {
          users: INITIAL_USERS,
          locations: INITIAL_LOCATIONS,
          products: INITIAL_PRODUCTS,
          stockLevels: INITIAL_STOCK_LEVELS,
          documents: INITIAL_DOCUMENTS,
          ledger: INITIAL_LEDGER,
        };
        await this.saveDB(initial);
        return initial;
      }
      return JSON.parse(raw);
    } catch {
      return {
        users: INITIAL_USERS,
        locations: INITIAL_LOCATIONS,
        products: INITIAL_PRODUCTS,
        stockLevels: INITIAL_STOCK_LEVELS,
        documents: INITIAL_DOCUMENTS,
        ledger: INITIAL_LEDGER,
      };
    }
  },

  async saveDB(state: DBState): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save to AsyncStorage', err);
    }
  },

  async resetToDefaults(): Promise<void> {
    const initial: DBState = {
      users: INITIAL_USERS,
      locations: INITIAL_LOCATIONS,
      products: INITIAL_PRODUCTS,
      stockLevels: INITIAL_STOCK_LEVELS,
      documents: INITIAL_DOCUMENTS,
      ledger: INITIAL_LEDGER,
    };
    await this.saveDB(initial);
  },

  // Auth & Current User
  async getCurrentUser(): Promise<User> {
    const raw = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    const defaultUser = INITIAL_USERS[0];
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultUser));
    return defaultUser;
  },

  async setCurrentUser(user: User): Promise<void> {
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  // Locations
  async getLocations(): Promise<Location[]> {
    const db = await this.getDB();
    return db.locations;
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const db = await this.getDB();
    return db.products;
  },

  async createProduct(data: {
    name: string;
    sku: string;
    category: string;
    unit_of_measure: string;
    min_reorder_level: number;
    initial_stock?: {
      location_id: string;
      quantity: number;
    };
  }): Promise<Product> {
    const db = await this.getDB();
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

    if (data.initial_stock && data.initial_stock.quantity > 0) {
      const loc = db.locations.find((l) => l.id === data.initial_stock?.location_id);
      db.stockLevels.push({
        product_id: newProduct.id,
        location_id: data.initial_stock.location_id,
        current_quantity: data.initial_stock.quantity,
      });

      const user = await this.getCurrentUser();
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
        created_by_name: user.name,
        timestamp: new Date().toISOString(),
        notes: 'Initial opening stock on mobile app',
      });
    }

    await this.saveDB(db);
    return newProduct;
  },

  // Stock Summaries with Location Breakdown
  async getProductStockSummaries(locationIdFilter?: string): Promise<ProductStockSummary[]> {
    const db = await this.getDB();
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

  async getStockAtLocation(productId: string, locationId: string): Promise<number> {
    const db = await this.getDB();
    const level = db.stockLevels.find(
      (sl) => sl.product_id === productId && sl.location_id === locationId
    );
    return level ? level.current_quantity : 0;
  },

  // Documents (Receipts, Deliveries, Transfers, Adjustments)
  async getDocuments(
    type?: DocumentType,
    status?: DocumentStatus,
    locationId?: string
  ): Promise<Document[]> {
    const db = await this.getDB();
    return db.documents
      .filter((doc) => {
        if (type && doc.type !== type) return false;
        if (status && doc.status !== status) return false;
        if (locationId && locationId !== 'all') {
          const matchesSource = doc.source_location_id === locationId;
          const matchesDest = doc.destination_location_id === locationId;
          if (!matchesSource && !matchesDest) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async createDocument(doc: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Promise<Document> {
    const db = await this.getDB();
    const now = new Date().toISOString();
    const newDoc: Document = {
      ...doc,
      id: `doc-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };
    db.documents.unshift(newDoc);
    await this.saveDB(db);
    return newDoc;
  },

  /**
   * ATOMIC DOUBLE-ENTRY TRANSACTION VALIDATOR ON MOBILE
   */
  async validateDocument(
    id: string
  ): Promise<{ success: boolean; message: string; document?: Document }> {
    const db = await this.getDB();
    const doc = db.documents.find((d) => d.id === id);
    if (!doc) return { success: false, message: 'Document not found' };
    if (doc.status === 'DONE') {
      return { success: false, message: 'Document has already been validated' };
    }

    const currentUser = await this.getCurrentUser();
    const now = new Date().toISOString();

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

    if (doc.type === 'RECEIPT') {
      if (!doc.destination_location_id) {
        return { success: false, message: 'Destination location required for receipts' };
      }
      for (const line of doc.lines) {
        const qty = line.processed_quantity || line.requested_quantity;
        if (qty <= 0) continue;
        updateStock(line.product_id, doc.destination_location_id, qty);
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
          quantity: qty,
          unit_of_measure: line.unit_of_measure,
          created_by_name: currentUser.name,
          timestamp: now,
          notes: doc.notes,
        });
      }
    } else if (doc.type === 'DELIVERY') {
      if (!doc.source_location_id) {
        return { success: false, message: 'Source location required for deliveries' };
      }
      for (const line of doc.lines) {
        const currentStock = await this.getStockAtLocation(
          line.product_id,
          doc.source_location_id
        );
        if (currentStock < line.requested_quantity) {
          return {
            success: false,
            message: `Insufficient stock for ${line.product_name}. Available: ${currentStock}, Required: ${line.requested_quantity}`,
          };
        }
      }
      for (const line of doc.lines) {
        updateStock(line.product_id, doc.source_location_id, -line.requested_quantity);
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
          quantity: line.requested_quantity,
          unit_of_measure: line.unit_of_measure,
          created_by_name: currentUser.name,
          timestamp: now,
          notes: doc.notes,
        });
      }
    } else if (doc.type === 'TRANSFER') {
      if (!doc.source_location_id || !doc.destination_location_id) {
        return { success: false, message: 'Source and destination locations required' };
      }
      for (const line of doc.lines) {
        const currentStock = await this.getStockAtLocation(
          line.product_id,
          doc.source_location_id
        );
        if (currentStock < line.requested_quantity) {
          return {
            success: false,
            message: `Insufficient stock for ${line.product_name}. Available: ${currentStock}`,
          };
        }
      }
      for (const line of doc.lines) {
        updateStock(line.product_id, doc.source_location_id, -line.requested_quantity);
        updateStock(line.product_id, doc.destination_location_id, line.requested_quantity);
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
          quantity: line.requested_quantity,
          unit_of_measure: line.unit_of_measure,
          created_by_name: currentUser.name,
          timestamp: now,
          notes: doc.notes,
        });
      }
    } else if (doc.type === 'ADJUSTMENT') {
      const locId = doc.destination_location_id || doc.source_location_id;
      if (!locId) {
        return { success: false, message: 'Target location required for adjustments' };
      }
      for (const line of doc.lines) {
        const delta = line.requested_quantity;
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
          notes: doc.notes,
        });
      }
    }

    doc.status = 'DONE';
    doc.updated_at = now;
    await this.saveDB(db);

    return {
      success: true,
      message: `${doc.code} validated. Stock ledger and levels updated.`,
      document: doc,
    };
  },

  // Stock Ledger
  async getLedger(productId?: string, locationId?: string): Promise<StockLedgerEntry[]> {
    const db = await this.getDB();
    return db.ledger
      .filter((entry) => {
        if (productId && entry.product_id !== productId) return false;
        if (locationId && locationId !== 'all') {
          if (entry.source_location_id !== locationId && entry.destination_location_id !== locationId) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  // Dashboard Metrics
  async getDashboardMetrics(locationIdFilter?: string): Promise<DashboardMetrics> {
    const summaries = await this.getProductStockSummaries(locationIdFilter);
    const documents = await this.getDocuments(undefined, undefined, locationIdFilter);

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
