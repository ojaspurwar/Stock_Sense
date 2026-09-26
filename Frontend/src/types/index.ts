// Aligned with Database/Schema-Plan.md and Backend/README.md

export type Role = 'MANAGER' | 'STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Contact {
  id: string;
  name: string;
  type: 'SUPPLIER' | 'CUSTOMER' | 'INTERNAL';
  email?: string;
  phone?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_of_measure: string;
  min_reorder_level: number;
  created_at: string;
}

export type LocationType = 'WAREHOUSE' | 'RACK' | 'PRODUCTION';

export interface Location {
  id: string;
  name: string;
  code: string;
  type: LocationType;
  description?: string;
  created_at: string;
}

export type DocumentType = 'RECEIPT' | 'DELIVERY' | 'TRANSFER' | 'ADJUSTMENT';

export type DocumentStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';

export interface DocumentLine {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  requested_quantity: number;
  processed_quantity: number;
  quantity?: number;
  received_quantity?: number;
  unit_of_measure: string;
}

export interface Document {
  id: string;
  code: string; // e.g. REC-2026-001, DEL-2026-001, TRF-2026-001, ADJ-2026-001
  type: DocumentType;
  status: DocumentStatus;
  created_by: string;
  creator_name: string;
  source_location_id?: string | null;
  source_location_name?: string | null;
  destination_location_id?: string | null;
  destination_location_name?: string | null;
  contact_id?: string | null;
  partner_name?: string;
  notes?: string;
  lines: DocumentLine[];
  created_at: string;
  updated_at: string;
}

export interface StockLedgerEntry {
  id: string;
  document_id: string;
  document_code: string;
  document_type: DocumentType;
  product_id: string;
  product_name: string;
  sku: string;
  source_location_id?: string | null;
  source_location_name?: string | null;
  destination_location_id?: string | null;
  destination_location_name?: string | null;
  quantity: number;
  unit_of_measure: string;
  created_by_name: string;
  timestamp: string;
  notes?: string;
}

export interface StockLevel {
  product_id: string;
  location_id: string;
  current_quantity: number;
}

export interface ProductStockSummary extends Product {
  total_stock: number;
  location_breakdown: {
    location_id: string;
    location_name: string;
    quantity: number;
  }[];
  is_low_stock: boolean;
  is_out_of_stock: boolean;
}

export interface DashboardMetrics {
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  pending_receipts: number;
  pending_deliveries: number;
  scheduled_transfers: number;
  recent_adjustments: number;
}
