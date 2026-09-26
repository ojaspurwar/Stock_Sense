import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../context/LocationContext';
import { MockStorage } from '../../services/mockStorage';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../lib/utils';
import {
  Boxes,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  PackageOpen,
} from 'lucide-react';
import { DashboardMetrics, ProductStockSummary, StockLedgerEntry, Document } from '../../types';

export const DashboardPage: React.FC = () => {
  const { selectedLocationId, currentLocationName } = useLocation();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [lowStockItems, setLowStockItems] = useState<ProductStockSummary[]>([]);
  const [recentLedger, setRecentLedger] = useState<StockLedgerEntry[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);

  const loadData = () => {
    const m = MockStorage.getDashboardMetrics(selectedLocationId);
    setMetrics(m);

    const summaries = MockStorage.getProductStockSummaries(selectedLocationId);
    setLowStockItems(summaries.filter((s) => s.is_low_stock || s.is_out_of_stock));

    const ledger = MockStorage.getLedger(undefined, selectedLocationId).slice(0, 5);
    setRecentLedger(ledger);

    const docs = MockStorage.getDocuments(undefined, undefined, selectedLocationId).slice(0, 5);
    setRecentDocuments(docs);
  };

  useEffect(() => {
    loadData();
  }, [selectedLocationId]);

  if (!metrics) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Title & Scope */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Inventory Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {currentLocationName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-location stock balances, pending movements, and ledger audit.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/receipts?action=new')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Receive Goods</span>
          </button>
          <button
            onClick={() => navigate('/deliveries?action=new')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            <span>New Delivery</span>
          </button>
          <button
            onClick={() => navigate('/transfers?action=new')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Internal Transfer</span>
          </button>
          <button
            onClick={() => navigate('/adjustments')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>Adjust Stock</span>
          </button>
        </div>
      </div>

      {/* 4 Top-line KPI StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Catalog Products"
          value={metrics.total_products}
          subtitle="Active SKUs in inventory"
          icon={Boxes}
          variant="info"
          onClick={() => navigate('/products')}
        />
        <StatCard
          title="Low & Out of Stock"
          value={metrics.low_stock_count + metrics.out_of_stock_count}
          subtitle={`${metrics.out_of_stock_count} depleted • ${metrics.low_stock_count} near threshold`}
          icon={AlertTriangle}
          variant={metrics.low_stock_count + metrics.out_of_stock_count > 0 ? 'danger' : 'success'}
          badge={metrics.out_of_stock_count > 0 ? 'Critical' : 'Attention'}
          onClick={() => navigate('/products?filter=low')}
        />
        <StatCard
          title="Pending In & Out"
          value={metrics.pending_receipts + metrics.pending_deliveries}
          subtitle={`${metrics.pending_receipts} Inbound • ${metrics.pending_deliveries} Outbound`}
          icon={ArrowDownToLine}
          variant="warning"
          onClick={() => navigate('/receipts')}
        />
        <StatCard
          title="Scheduled Transfers"
          value={metrics.scheduled_transfers}
          subtitle="Awaiting location fulfillment"
          icon={ArrowLeftRight}
          variant="default"
          onClick={() => navigate('/transfers')}
        />
      </div>

      {/* Operational Highlights Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Low Stock Alerts Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Inventory Alerts ({lowStockItems.length})
                </h3>
              </div>
              <button
                onClick={() => navigate('/products?filter=low')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                View all items <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              {lowStockItems.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 pb-2">
                      <th className="pb-2">SKU & Item</th>
                      <th className="pb-2 text-right">Current Stock</th>
                      <th className="pb-2 text-right">Min Threshold</th>
                      <th className="pb-2 text-center">Status</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lowStockItems.slice(0, 5).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3">
                          <div className="font-semibold text-slate-800">{item.name}</div>
                          <span className="font-mono text-[11px] text-slate-400">{item.sku}</span>
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-slate-800">
                          {item.total_stock} <span className="text-[10px] text-slate-400 font-normal">{item.unit_of_measure}</span>
                        </td>
                        <td className="py-3 text-right font-mono text-slate-500">
                          {item.min_reorder_level} {item.unit_of_measure}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.is_out_of_stock
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {item.is_out_of_stock ? 'DEPLETED' : 'REORDER'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => navigate('/receipts?action=new&sku=' + item.sku)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg text-[11px] transition-colors"
                          >
                            + Reorder
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center">
                  <Sparkles className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800">All Stock Levels Optimal</p>
                  <p className="text-xs text-slate-400 mt-1">
                    No products are currently below their minimum safety thresholds.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Double-Entry Ledger Feed (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Recent Ledger Activity</h3>
              </div>
              <button
                onClick={() => navigate('/ledger')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                Full Audit Trail <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {recentLedger.length > 0 ? (
                recentLedger.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-indigo-600">{entry.document_code}</span>
                        <span className="font-medium text-slate-800 truncate max-w-[140px]">
                          {entry.product_name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {entry.source_location_name || 'Vendor'} ➔{' '}
                        {entry.destination_location_name || 'Customer'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-600">
                        +{entry.quantity} {entry.unit_of_measure}
                      </div>
                      <span className="text-[10px] text-slate-400">{formatDate(entry.timestamp)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <PackageOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No stock movements recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Operational Documents List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recent Operational Documents</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest receipts, deliveries, transfers, and adjustment orders
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 pb-2">
                <th className="pb-2">Reference</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Route / Partner</th>
                <th className="pb-2">Items</th>
                <th className="pb-2 text-center">Status</th>
                <th className="pb-2 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDocuments.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => {
                    if (doc.type === 'RECEIPT') navigate('/receipts');
                    else if (doc.type === 'DELIVERY') navigate('/deliveries');
                    else if (doc.type === 'TRANSFER') navigate('/transfers');
                    else if (doc.type === 'ADJUSTMENT') navigate('/adjustments');
                  }}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="py-3 font-mono font-bold text-indigo-600">{doc.code}</td>
                  <td className="py-3 font-semibold text-slate-700">{doc.type}</td>
                  <td className="py-3 text-slate-600">
                    {doc.partner_name ||
                      `${doc.source_location_name || 'N/A'} ➔ ${doc.destination_location_name || 'N/A'}`}
                  </td>
                  <td className="py-3 font-mono text-slate-600">
                    {doc.lines.reduce((s, l) => s + l.quantity, 0)} total
                  </td>
                  <td className="py-3 text-center">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="py-3 text-right text-slate-400">{formatDate(doc.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
