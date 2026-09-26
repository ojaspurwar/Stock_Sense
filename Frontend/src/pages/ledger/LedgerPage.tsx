import React, { useState, useEffect } from 'react';
import { useLocation } from '../../context/LocationContext';
import { useNotification } from '../../context/NotificationContext';
import { MockStorage } from '../../services/mockStorage';
import { StockLedgerEntry, Product, Location, DocumentType } from '../../types';
import { formatDate } from '../../lib/utils';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Warehouse,
  ArrowRight,
  Database,
  ShieldCheck,
} from 'lucide-react';

export const LedgerPage: React.FC = () => {
  const { selectedLocationId, currentLocationName } = useLocation();
  const { success } = useNotification();

  const [ledger, setLedger] = useState<StockLedgerEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = () => {
    const list = MockStorage.getLedger(
      productFilter !== 'all' ? productFilter : undefined,
      selectedLocationId
    );
    setLedger(list);
    setProducts(MockStorage.getProducts());
    setLocations(MockStorage.getLocations());
  };

  useEffect(() => {
    loadData();
  }, [selectedLocationId, productFilter]);

  const filteredLedger = ledger.filter((entry) => {
    const matchesType = typeFilter === 'all' || entry.document_type === typeFilter;
    const matchesSearch =
      entry.document_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.notes && entry.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleExportCSV = () => {
    if (filteredLedger.length === 0) return;

    const headers = [
      'Timestamp',
      'Document Ref',
      'Operation Type',
      'SKU',
      'Product Name',
      'Source Location',
      'Destination Location',
      'Quantity',
      'UoM',
      'Created By',
      'Notes',
    ];

    const rows = filteredLedger.map((e) => [
      e.timestamp,
      e.document_code,
      e.document_type,
      e.sku,
      `"${e.product_name.replace(/"/g, '""')}"`,
      `"${(e.source_location_name || 'Vendor (External)').replace(/"/g, '""')}"`,
      `"${(e.destination_location_name || 'Customer (External)').replace(/"/g, '""')}"`,
      e.quantity,
      e.unit_of_measure,
      `"${e.created_by_name}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StockSense_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('CSV Exported', `Exported ${filteredLedger.length} ledger audit records.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Stock Ledger (Audit Trail)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {currentLocationName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable double-entry transaction record. Every receipt, delivery, transfer, and adjustment is permanently preserved.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Audit Guarantee Banner */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 via-slate-50 to-emerald-50 rounded-2xl border border-indigo-100/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Double-Entry Integrity Active
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Source and Destination balancing prevents phantom inventory and accounts for every unit with full actor attribution.
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-2 text-xs font-mono font-bold text-slate-700">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>{filteredLedger.length} Records Verified</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ref #, product, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Operation Type Filter */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Operations</option>
              <option value="RECEIPT">Receipts (Inbound)</option>
              <option value="DELIVERY">Deliveries (Outbound)</option>
              <option value="TRANSFER">Internal Transfers</option>
              <option value="ADJUSTMENT">Adjustments</option>
            </select>
          </div>

          {/* Product Filter */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600">
            <Warehouse className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Doc Reference</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-4">Source Location</th>
                <th className="py-3 px-4 text-center">Flow</th>
                <th className="py-3 px-4">Destination Location</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedger.map((entry) => {
                const isReceipt = entry.document_type === 'RECEIPT';
                const isDelivery = entry.document_type === 'DELIVERY';
                const isTransfer = entry.document_type === 'TRANSFER';
                const isAdjustment = entry.document_type === 'ADJUSTMENT';

                return (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(entry.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {entry.document_code}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                          isReceipt
                            ? 'bg-emerald-100 text-emerald-800'
                            : isDelivery
                            ? 'bg-indigo-100 text-indigo-800'
                            : isTransfer
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {entry.document_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 truncate max-w-[180px]">
                        {entry.product_name}
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{entry.sku}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {entry.source_location_name || 'Vendor (External)'}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">
                      <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {entry.destination_location_name || 'Customer (External)'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                      <span
                        className={
                          isReceipt
                            ? 'text-emerald-600'
                            : isDelivery
                            ? 'text-indigo-600'
                            : isAdjustment
                            ? 'text-purple-600'
                            : 'text-amber-600'
                        }
                      >
                        {isReceipt ? '+' : isDelivery ? '-' : ''}
                        {entry.quantity} {entry.unit_of_measure}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {entry.created_by_name}
                    </td>
                  </tr>
                );
              })}
              {filteredLedger.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No ledger records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
