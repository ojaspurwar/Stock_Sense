import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocation } from '../../context/LocationContext';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { MockStorage } from '../../services/mockStorage';
import { Document, Product, Location, DocumentLine } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../lib/utils';
import {
  ArrowLeftRight,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  PackageCheck,
  Warehouse,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export const TransfersPage: React.FC = () => {
  const { selectedLocationId, currentLocationName } = useLocation();
  const { success, error, warning } = useNotification();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [transfers, setTransfers] = useState<Document[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(searchParams.get('action') === 'new');
  const [selectedTransfer, setSelectedTransfer] = useState<Document | null>(null);

  // New Transfer Form State
  const [sourceLocId, setSourceLocId] = useState<string>('');
  const [destLocId, setDestLocId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [lines, setLines] = useState<{ productId: string; quantity: number }[]>([]);

  const loadData = () => {
    const list = MockStorage.getDocuments('TRANSFER', undefined, selectedLocationId);
    setTransfers(list);
    const prods = MockStorage.getProducts();
    setProducts(prods);
    const locs = MockStorage.getLocations();
    setLocations(locs);

    if (locs.length >= 2 && !sourceLocId) {
      setSourceLocId(locs[0].id);
      setDestLocId(locs[1].id);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedLocationId]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsNewModalOpen(true);
      if (lines.length === 0 && products.length > 0) {
        setLines([{ productId: products[0].id, quantity: 20 }]);
      }
    }
  }, [searchParams, products]);

  const handleAddLine = () => {
    if (products.length === 0) return;
    setLines([...lines, { productId: products[0].id, quantity: 10 }]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceLocId === destLocId) {
      error('Validation Error', 'Source location and destination location must be different.');
      return;
    }
    if (lines.length === 0) {
      error('Validation Error', 'At least one line item is required.');
      return;
    }

    const sLoc = locations.find((l) => l.id === sourceLocId);
    const dLoc = locations.find((l) => l.id === destLocId);

    // Validate available inventory at source
    for (const line of lines) {
      const available = MockStorage.getStockAtLocation(line.productId, sourceLocId);
      const prod = products.find((p) => p.id === line.productId);
      if (available < line.quantity) {
        error(
          'Insufficient Stock',
          `Cannot transfer ${line.quantity} of ${prod?.name}. Only ${available} available at ${sLoc?.name}.`
        );
        return;
      }
    }

    const docLines: DocumentLine[] = lines.map((line, idx) => {
      const prod = products.find((p) => p.id === line.productId)!;
      return {
        id: `line-${Date.now()}-${idx}`,
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku,
        quantity: Number(line.quantity),
        unit_of_measure: prod.unit_of_measure,
      };
    });

    const newCode = `TRF-2026-${String(transfers.length + 10).padStart(3, '0')}`;
    const newDoc = MockStorage.createDocument({
      code: newCode,
      type: 'TRANSFER',
      status: 'READY',
      created_by: user?.id || 'usr-001',
      creator_name: user?.name || 'Inventory Staff',
      source_location_id: sourceLocId,
      source_location_name: sLoc?.name || 'Source Warehouse',
      destination_location_id: destLocId,
      destination_location_name: dLoc?.name || 'Destination Warehouse',
      notes: notes,
      lines: docLines,
    });

    success('Transfer Created', `Internal Transfer ${newDoc.code} is ready for validation.`);
    setIsNewModalOpen(false);
    setNotes('');
    setLines([]);
    loadData();
    setSelectedTransfer(newDoc);
  };

  const handleValidateTransfer = (docId: string) => {
    const res = MockStorage.validateDocument(docId);
    if (res.success) {
      success('Transfer Completed!', res.message);
      loadData();
      if (selectedTransfer && selectedTransfer.id === docId) {
        setSelectedTransfer(MockStorage.getDocumentById(docId) || null);
      }
    } else {
      error('Validation Failed', res.message);
    }
  };

  const filteredTransfers = transfers.filter((trf) => {
    const matchesStatus = statusFilter === 'all' || trf.status === statusFilter;
    const matchesSearch =
      trf.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trf.source_location_name &&
        trf.source_location_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (trf.destination_location_name &&
        trf.destination_location_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Internal Transfers
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              {currentLocationName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Relocate stock across warehouses, assembly zones, and storage racks without altering total inventory.
          </p>
        </div>

        <button
          onClick={() => {
            setIsNewModalOpen(true);
            if (lines.length === 0 && products.length > 0) {
              setLines([{ productId: products[0].id, quantity: 20 }]);
            }
          }}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Transfer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by transfer code or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <div className="flex flex-wrap gap-1.5">
            {['all', 'DRAFT', 'WAITING', 'READY', 'DONE'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Transfer Ref #</th>
                <th className="py-3 px-4">Origin (Source)</th>
                <th className="py-3 px-4 text-center">Route</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4 text-right">Units Moved</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Created</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransfers.map((trf) => {
                const totalUnits = trf.lines.reduce((sum, l) => sum + l.quantity, 0);

                return (
                  <tr
                    key={trf.id}
                    onClick={() => setSelectedTransfer(trf)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">{trf.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {trf.source_location_name}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">➔</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {trf.destination_location_name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {totalUnits}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={trf.status} />
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">{formatDate(trf.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      {trf.status !== 'DONE' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleValidateTransfer(trf.id);
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-xs shadow-xs transition-colors inline-flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Transfer</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-600 font-semibold">
                          Completed ✓
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredTransfers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No internal transfer orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transfer Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Create Internal Stock Transfer"
        subtitle="Move items between warehouses or internal storage locations"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Source Location (From) *
              </label>
              <select
                value={sourceLocId}
                onChange={(e) => setSourceLocId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
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
                Destination Location (To) *
              </label>
              <select
                value={destLocId}
                onChange={(e) => setDestLocId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} disabled={loc.id === sourceLocId}>
                    {loc.name} ({loc.code}) {loc.id === sourceLocId ? '(Source)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transfer Reason / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Replenishment for assembly line A • Work Order #409"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Items to Transfer ({lines.length})
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {lines.map((line, idx) => {
                const prod = products.find((p) => p.id === line.productId);
                const available = sourceLocId
                  ? MockStorage.getStockAtLocation(line.productId, sourceLocId)
                  : 0;
                const isOverStock = line.quantity > available;

                return (
                  <div
                    key={idx}
                    className={`p-3 border rounded-xl flex items-center space-x-3 text-xs ${
                      isOverStock ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex-1">
                      <select
                        value={line.productId}
                        onChange={(e) => {
                          const updated = [...lines];
                          updated[idx].productId = e.target.value;
                          setLines(updated);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.sku}] {p.name}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1 flex items-center space-x-2 text-[11px]">
                        <span className="text-slate-500">
                          Available at source: <strong className="font-mono">{available}</strong>{' '}
                          {prod?.unit_of_measure}
                        </span>
                        {isOverStock && (
                          <span className="text-rose-600 font-semibold flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-0.5" /> Exceeds source balance!
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-28">
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => {
                            const updated = [...lines];
                            updated[idx].quantity = Number(e.target.value);
                            setLines(updated);
                          }}
                          className={`w-full px-2 py-1.5 text-xs font-mono border rounded-lg bg-white ${
                            isOverStock ? 'border-rose-400 text-rose-700' : 'border-slate-200'
                          }`}
                        />
                        <span className="text-slate-400 font-mono text-[11px]">
                          {prod?.unit_of_measure}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {lines.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-xl">
                  No line items added yet. Click &quot;Add Item&quot; to begin.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-colors"
            >
              Create Transfer
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Inspection Modal */}
      {selectedTransfer && (
        <Modal
          isOpen={!!selectedTransfer}
          onClose={() => setSelectedTransfer(null)}
          title={`Internal Transfer: ${selectedTransfer.code}`}
          subtitle={`${selectedTransfer.source_location_name} ➔ ${selectedTransfer.destination_location_name}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <StatusBadge status={selectedTransfer.status} className="mt-1" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Created</span>
                <span className="text-xs text-slate-700 font-medium">
                  {formatDate(selectedTransfer.created_at)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Operator</span>
                <span className="text-xs text-slate-700 font-medium">
                  {selectedTransfer.creator_name}
                </span>
              </div>
            </div>

            {selectedTransfer.notes && (
              <p className="text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60">
                <strong>Notes:</strong> {selectedTransfer.notes}
              </p>
            )}

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Manifest / Transferred Items
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">Item / SKU</th>
                      <th className="py-2.5 px-3 text-right">Transfer Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTransfer.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800 block">{l.product_name}</span>
                          <span className="font-mono text-[10px] text-slate-400">{l.sku}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {l.quantity} {l.unit_of_measure}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {selectedTransfer.status === 'DONE'
                  ? '✓ Relocation completed and logged into the double-entry ledger.'
                  : 'Items ready to be transferred to destination.'}
              </span>

              {selectedTransfer.status !== 'DONE' && (
                <button
                  onClick={() => handleValidateTransfer(selectedTransfer.id)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Execute Transfer</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
