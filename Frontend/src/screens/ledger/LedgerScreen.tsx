import React, { useState, useEffect, useMemo } from 'react';
import { MobileStorage } from '../../services/storage';
import { StockLedgerEntry, Product, Location } from '../../types';
import { Pill } from '../../components/ui/Pill';

export interface LedgerScreenProps {
  initialProductId?: string;
  searchQuery?: string;
  filterWarehouse?: string;
}

export const LedgerScreen: React.FC<LedgerScreenProps> = ({
  initialProductId,
  searchQuery = '',
  filterWarehouse = 'All',
}) => {
  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Local filters
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || 'All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [page, setPage] = useState(1);
  const rowsPerPage = 15;

  const loadData = async () => {
    try {
      const [entries, prods, locs] = await Promise.all([
        MobileStorage.getLedger(),
        MobileStorage.getProducts(),
        MobileStorage.getLocations(),
      ]);
      setLedgerEntries(entries);
      setProducts(prods);
      setLocations(locs);
    } catch (e) {
      console.error('Error loading ledger', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(initialProductId);
    }
  }, [initialProductId]);

  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter((entry) => {
      // Product filter
      if (selectedProductId !== 'All' && entry.product_id !== selectedProductId) {
        return false;
      }

      // Document Type filter
      if (selectedType !== 'All' && entry.document_type !== selectedType) {
        return false;
      }

      // Warehouse filter
      if (filterWarehouse !== 'All') {
        const matchesSource = entry.source_location_name?.includes(filterWarehouse);
        const matchesDest = entry.destination_location_name?.includes(filterWarehouse);
        if (!matchesSource && !matchesDest) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = entry.document_code.toLowerCase().includes(q);
        const matchProd = entry.product_name.toLowerCase().includes(q);
        const matchSku = entry.sku.toLowerCase().includes(q);
        const matchWho = (entry.created_by_name || '').toLowerCase().includes(q);
        if (!matchCode && !matchProd && !matchSku && !matchWho) return false;
      }

      return true;
    });
  }, [ledgerEntries, selectedProductId, selectedType, filterWarehouse, searchQuery]);

  const totalPages = Math.ceil(filteredEntries.length / rowsPerPage) || 1;
  const paginated = filteredEntries.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="list">
      <div className="list-head">
        <div>
          <h1>
            Move history<span>{filteredEntries.length}</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Every stock change, permanently recorded. Never edited or deleted.
          </p>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="field">
            <div className="input" style={{ height: 36 }}>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All">All Operations</option>
                <option value="RECEIPT">Receipts</option>
                <option value="DELIVERY">Deliveries</option>
                <option value="TRANSFER">Internal Transfers</option>
                <option value="ADJUSTMENT">Adjustments</option>
              </select>
            </div>
          </div>

          <div className="field">
            <div className="input" style={{ height: 36 }}>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Reference</th>
            <th>Product</th>
            <th>From → To</th>
            <th className="num">Quantity</th>
            <th>Done by</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((entry) => {
            let qtyClass = 'q-in';
            let qtyPrefix = '+';
            if (entry.document_type === 'DELIVERY') {
              qtyClass = 'q-out';
              qtyPrefix = '−';
            } else if (entry.document_type === 'ADJUSTMENT') {
              qtyClass = 'q-adj';
              qtyPrefix = entry.source_location_id ? '−' : '+';
            } else if (entry.document_type === 'TRANSFER') {
              qtyClass = '';
              qtyPrefix = '';
            }

            const fromStr = entry.source_location_name || 'Opening Balance';
            const toStr = entry.destination_location_name || 'Customer';

            return (
              <tr key={entry.id}>
                <td className="when">
                  {new Date(entry.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </td>
                <td className="ref">{entry.document_code}</td>
                <td>
                  <span className="name">{entry.product_name}</span>
                  <span className="sku">{entry.sku}</span>
                </td>
                <td>
                  <span className="route">
                    <span>{fromStr}</span> → <span>{toStr}</span>
                  </span>
                  {entry.notes && <span className="reason">{entry.notes}</span>}
                </td>
                <td className={`num ${qtyClass}`}>
                  {qtyPrefix}
                  {entry.quantity} {entry.unit_of_measure}
                </td>
                <td className="who">{entry.created_by_name || 'Staff'}</td>
              </tr>
            );
          })}

          {paginated.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)' }}>
                No ledger entries found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pager */}
      <div className="pager">
        <span>
          Showing {paginated.length > 0 ? (page - 1) * rowsPerPage + 1 : 0}–
          {Math.min(page * rowsPerPage, filteredEntries.length)} of {filteredEntries.length}
        </span>
        <div className="arrows">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ←
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};
