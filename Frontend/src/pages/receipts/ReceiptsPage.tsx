import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocation } from '../../context/LocationContext';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { MockStorage } from '../../services/mockStorage';
import { Document, Product, Location, DocumentStatus, DocumentLine } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../lib/utils';
import {
  ArrowDownToLine,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  PackageCheck,
  Building,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export const ReceiptsPage: React.FC = () => {
  const { selectedLocationId, currentLocationName } = useLocation();
  const { success, error, warning } = useNotification();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [receipts, setReceipts] = useState<Document[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(searchParams.get('action') === 'new');
  const [selectedReceipt, setSelectedReceipt] = useState<Document | null>(null);

  // New Receipt Form
  const [vendorName, setVendorName] = useState<string>('');
  const [destLocationId, setDestLocationId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [lines, setLines] = useState<
    { productId: string; quantity: number; receivedQuantity: number }[]
  >([]);

  const loadData = () => {
    const list = MockStorage.getDocuments('RECEIPT', undefined, selectedLocationId);
    setReceipts(list);
    const prods = MockStorage.getProducts();
    setProducts(prods);
    const locs = MockStorage.getLocations();
    setLocations(locs);

    if (locs.length > 0 && !destLocationId) {
      setDestLocationId(locs[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedLocationId]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsNewModalOpen(true);
      const prefilledSku = searchParams.get('sku');
      if (prefilledSku && products.length > 0) {
        const match = products.find((p) => p.sku === prefilledSku);
        if (match) {
          setLines([{ productId: match.id, quantity: 100, receivedQuantity: 100 }]);
        }
      }
    }
  }, [searchParams, products]);

  const handleAddLine = () => {
    if (products.length === 0) return;
    setLines([...lines, { productId: products[0].id, quantity: 50, receivedQuantity: 50 }]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      error('Validation Error', 'Vendor name is required.');
      return;
    }
    if (lines.length === 0) {
      error('Validation Error', 'At least one line item is required.');
      return;
    }

    const destLoc = locations.find((l) => l.id === destLocationId);
    const docLines: DocumentLine[] = lines.map((line, idx) => {
      const prod = products.find((p) => p.id === line.productId)!;
      return {
        id: `line-${Date.now()}-${idx}`,
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku,
        quantity: Number(line.quantity),
        received_quantity: Number(line.receivedQuantity),
        unit_of_measure: prod.unit_of_measure,
      };
    });

    const newCode = `REC-2026-${String(receipts.length + 10).padStart(3, '0')}`;
    const newDoc = MockStorage.createDocument({
      code: newCode,
      type: 'RECEIPT',
      status: 'READY',
      created_by: user?.id || 'usr-001',
      creator_name: user?.name || 'Inventory Staff',
      source_location_id: null,
      source_location_name: `${vendorName} (Vendor)`,
      destination_location_id: destLocationId,
      destination_location_name: destLoc?.name || 'Warehouse',
      partner_name: vendorName,
      notes: notes,
      lines: docLines,
    });

    success('Receipt Created', `Receipt ${newDoc.code} has been created and is READY for receiving.`);
    setIsNewModalOpen(false);
    setVendorName('');
    setNotes('');
    setLines([]);
    loadData();
    setSelectedReceipt(newDoc);
  };

  const handleValidateReceipt = (docId: string) => {
    const res = MockStorage.validateDocument(docId);
    if (res.success) {
      success('Goods Received & Validated!', res.message);
      loadData();
      if (selectedReceipt && selectedReceipt.id === docId) {
        setSelectedReceipt(MockStorage.getDocumentById(docId) || null);
      }
    } else {
      error('Validation Failed', res.message);
    }
  };

  const filteredReceipts = receipts.filter((rec) => {
    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
    const matchesSearch =
      rec.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.partner_name && rec.partner_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Receipts (Incoming Goods)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {currentLocationName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Receive incoming vendor shipments, verify delivered quantities, and validate to update the double-entry stock ledger.
          </p>
        </div>

        <button
          onClick={() => {
            setIsNewModalOpen(true);
            if (lines.length === 0 && products.length > 0) {
              setLines([{ productId: products[0].id, quantity: 100, receivedQuantity: 100 }]);
            }
          }}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Receipt Order</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by receipt code or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Receipt Ref #</th>
                <th className="py-3 px-4">Vendor / Supplier</th>
                <th className="py-3 px-4">Destination Warehouse</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Total Qty</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.map((rec) => {
                const totalUnits = rec.lines.reduce(
                  (sum, l) => sum + (l.received_quantity ?? l.quantity),
                  0
                );

                return (
                  <tr
                    key={rec.id}
                    onClick={() => setSelectedReceipt(rec)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">{rec.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{rec.partner_name}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{rec.destination_location_name}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {rec.lines.length} item{rec.lines.length > 1 ? 's' : ''}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      +{totalUnits}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">{formatDate(rec.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      {rec.status !== 'DONE' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleValidateReceipt(rec.id);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs shadow-xs transition-colors inline-flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Validate</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-600 font-semibold">
                          Validated ✓
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredReceipts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No receipt orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Receipt Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Create New Vendor Receipt (Incoming Goods)"
        subtitle="Log arriving shipments, specify quantities, and allocate destination warehouse"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateReceipt} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor / Supplier Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Industrial Supplies"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receiving Destination Location *
              </label>
              <select
                value={destLocationId}
                onChange={(e) => setDestLocationId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Notes / Po Number
            </label>
            <input
              type="text"
              placeholder="e.g. PO-8921 • Delivery bay 3 inspection"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Product Line Items ({lines.length})
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {lines.map((line, idx) => {
                const prod = products.find((p) => p.id === line.productId);

                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-3 text-xs"
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
                            updated[idx].receivedQuantity = Number(e.target.value);
                            setLines(updated);
                          }}
                          className="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white"
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
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              Create Receipt Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt Detail & Inspection Drawer */}
      {selectedReceipt && (
        <Modal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title={`Receipt: ${selectedReceipt.code}`}
          subtitle={`Supplier: ${selectedReceipt.partner_name} • Destination: ${selectedReceipt.destination_location_name}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Header info bar */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <StatusBadge status={selectedReceipt.status} className="mt-1" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Created At</span>
                <span className="text-xs text-slate-700 font-medium">
                  {formatDate(selectedReceipt.created_at)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Created By</span>
                <span className="text-xs text-slate-700 font-medium">
                  {selectedReceipt.creator_name}
                </span>
              </div>
            </div>

            {selectedReceipt.notes && (
              <p className="text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60">
                <strong>Notes:</strong> {selectedReceipt.notes}
              </p>
            )}

            {/* Line items table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Delivered Items Checklist
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">Item / SKU</th>
                      <th className="py-2.5 px-3 text-right">Expected Qty</th>
                      <th className="py-2.5 px-3 text-right">Received Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedReceipt.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800 block">{l.product_name}</span>
                          <span className="font-mono text-[10px] text-slate-400">{l.sku}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {l.quantity} {l.unit_of_measure}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          {l.received_quantity ?? l.quantity} {l.unit_of_measure}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {selectedReceipt.status === 'DONE'
                  ? '✓ Stock balances have been updated and ledger entries posted.'
                  : 'Ready for goods intake validation into inventory.'}
              </span>

              {selectedReceipt.status !== 'DONE' && (
                <button
                  onClick={() => handleValidateReceipt(selectedReceipt.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Validate & Increase Stock</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
