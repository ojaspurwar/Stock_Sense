import React, { useState, useEffect } from 'react';
import { useLocation } from '../../context/LocationContext';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { MockStorage } from '../../services/mockStorage';
import { Document, Product, Location } from '../../types';
import { formatDate } from '../../lib/utils';
import {
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingUp,
  TrendingDown,
  Warehouse,
  Package,
} from 'lucide-react';

export const AdjustmentsPage: React.FC = () => {
  const { selectedLocationId, currentLocationName } = useLocation();
  const { success, error, warning } = useNotification();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pastAdjustments, setPastAdjustments] = useState<Document[]>([]);

  // Adjustment Form
  const [selectedLocId, setSelectedLocId] = useState<string>('');
  const [selectedProdId, setSelectedProdId] = useState<string>('');
  const [physicalCount, setPhysicalCount] = useState<number | string>('');
  const [reasonCategory, setReasonCategory] = useState<string>('Cycle Count Discrepancy');
  const [notes, setNotes] = useState<string>('');

  const loadData = () => {
    const prods = MockStorage.getProducts();
    setProducts(prods);
    const locs = MockStorage.getLocations();
    setLocations(locs);

    if (locs.length > 0 && !selectedLocId) {
      setSelectedLocId(selectedLocationId !== 'all' ? selectedLocationId : locs[0].id);
    }
    if (prods.length > 0 && !selectedProdId) {
      setSelectedProdId(prods[0].id);
    }

    const past = MockStorage.getDocuments('ADJUSTMENT', undefined, selectedLocationId);
    setPastAdjustments(past);
  };

  useEffect(() => {
    loadData();
  }, [selectedLocationId]);

  // Selected product and location
  const currentProduct = products.find((p) => p.id === selectedProdId);
  const currentLocation = locations.find((l) => l.id === selectedLocId);

  // Current system recorded quantity
  const systemRecordedQty =
    selectedProdId && selectedLocId
      ? MockStorage.getStockAtLocation(selectedProdId, selectedLocId)
      : 0;

  // Calculate delta
  const countNumber = physicalCount === '' ? systemRecordedQty : Number(physicalCount);
  const delta = countNumber - systemRecordedQty;

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocId || !selectedProdId) {
      error('Validation Error', 'Please select both a location and product.');
      return;
    }
    if (delta === 0) {
      warning('No Discrepancy', 'The physical count matches the system stock. No adjustment needed.');
      return;
    }

    const code = `ADJ-2026-${String(pastAdjustments.length + 10).padStart(3, '0')}`;
    const adjDoc = MockStorage.createDocument({
      code,
      type: 'ADJUSTMENT',
      status: 'READY',
      created_by: user?.id || 'usr-001',
      creator_name: user?.name || 'Inventory Manager',
      source_location_id: delta < 0 ? selectedLocId : null,
      source_location_name: currentLocation?.name || 'Location',
      destination_location_id: delta > 0 ? selectedLocId : null,
      destination_location_name: currentLocation?.name || 'Location',
      notes: `${reasonCategory}: ${notes.trim() || 'Physical inventory count reconciliation'}`,
      lines: [
        {
          id: `line-${Date.now()}`,
          product_id: currentProduct!.id,
          product_name: currentProduct!.name,
          sku: currentProduct!.sku,
          quantity: delta,
          unit_of_measure: currentProduct!.unit_of_measure,
        },
      ],
    });

    const res = MockStorage.validateDocument(adjDoc.id);
    if (res.success) {
      success('Adjustment Applied!', `Inventory balanced. Discrepancy delta of ${delta > 0 ? '+' : ''}${delta} logged to ledger.`);
      setPhysicalCount('');
      setNotes('');
      loadData();
    } else {
      error('Adjustment Failed', res.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Stock Adjustments & Physical Count
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {currentLocationName}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Reconcile physical stock counts with digital system balances. The double-entry engine logs every delta to maintain full audit compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Interactive Reconciliation Tool (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="pb-4 border-b border-slate-100 flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Discrepancy Reconciliation Form</h3>
          </div>

          <form onSubmit={handleApplyAdjustment} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Location *
                </label>
                <select
                  value={selectedLocId}
                  onChange={(e) => {
                    setSelectedLocId(e.target.value);
                    setPhysicalCount('');
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product *
                </label>
                <select
                  value={selectedProdId}
                  onChange={(e) => {
                    setSelectedProdId(e.target.value);
                    setPhysicalCount('');
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      [{prod.sku}] {prod.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reconciliation Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              {/* System Recorded */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  System Recorded
                </span>
                <p className="text-2xl font-bold font-mono text-slate-800 mt-1">
                  {systemRecordedQty}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    {currentProduct?.unit_of_measure}
                  </span>
                </p>
                <span className="text-[10px] text-slate-400 block mt-0.5">Current digital ledger</span>
              </div>

              {/* Physical Count Input */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-700 uppercase block">
                  Physical Count *
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder={String(systemRecordedQty)}
                  value={physicalCount}
                  onChange={(e) => setPhysicalCount(e.target.value)}
                  className="w-full text-2xl font-bold font-mono text-indigo-600 mt-1 outline-none border-b border-indigo-200 focus:border-indigo-500 bg-transparent"
                />
                <span className="text-[10px] text-indigo-500 block mt-0.5">Enter actual count</span>
              </div>

              {/* Computed Delta */}
              <div
                className={`p-3.5 rounded-xl border ${
                  delta > 0
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                    : delta < 0
                    ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                    : 'bg-slate-100/70 border-slate-200 text-slate-700'
                }`}
              >
                <span className="text-[10px] font-bold uppercase block">Discrepancy (Delta)</span>
                <div className="flex items-center space-x-1 mt-1">
                  {delta > 0 && <TrendingUp className="w-5 h-5 text-emerald-600" />}
                  {delta < 0 && <TrendingDown className="w-5 h-5 text-rose-600" />}
                  <span className="text-2xl font-bold font-mono">
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                  <span className="text-xs font-normal opacity-80">
                    {currentProduct?.unit_of_measure}
                  </span>
                </div>
                <span className="text-[10px] block mt-0.5 font-medium">
                  {delta > 0
                    ? 'Surplus (Stock In)'
                    : delta < 0
                    ? 'Deficit (Stock Out)'
                    : 'Balanced (No Delta)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Adjustment *
                </label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  <option value="Cycle Count Discrepancy">Cycle Count Discrepancy</option>
                  <option value="Damaged Goods / Scrap">Damaged Goods / Scrap</option>
                  <option value="Found Unrecorded Stock">Found Unrecorded Stock</option>
                  <option value="Theft or Loss">Theft or Loss</option>
                  <option value="Annual Physical Audit">Annual Physical Audit</option>
                  <option value="Vendor Packing Error">Vendor Packing Error</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Audit Notes / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Broken packaging found in aisle 4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={delta === 0}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply Adjustment & Balance Ledger</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: History of Past Adjustments (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Adjustment History</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {pastAdjustments.length} Total
              </span>
            </div>

            <div className="mt-4 space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {pastAdjustments.map((doc) => {
                const line = doc.lines[0];
                const isPositive = (line?.quantity ?? 0) > 0;

                return (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-indigo-600">{doc.code}</span>
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                          isPositive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isPositive ? `+${line?.quantity}` : line?.quantity}{' '}
                        {line?.unit_of_measure}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span className="font-medium truncate max-w-[200px]">
                        {line?.product_name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {doc.destination_location_name || doc.source_location_name}
                      </span>
                    </div>

                    {doc.notes && (
                      <p className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100">
                        {doc.notes}
                      </p>
                    )}

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Adjusted by {doc.creator_name}</span>
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                  </div>
                );
              })}
              {pastAdjustments.length === 0 && (
                <p className="text-xs text-slate-400 py-8 text-center">
                  No inventory adjustments recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
