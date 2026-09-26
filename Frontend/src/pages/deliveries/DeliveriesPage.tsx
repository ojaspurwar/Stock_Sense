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
  ArrowUpFromLine,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  PackageCheck,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';

export const DeliveriesPage: React.FC = () => {
  const { selectedLocationId, currentLocationName } = useLocation();
  const { success, error, warning } = useNotification();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [deliveries, setDeliveries] = useState<Document[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(searchParams.get('action') === 'new');
  const [selectedDelivery, setSelectedDelivery] = useState<Document | null>(null);

  // New Delivery Form State
  const [customerName, setCustomerName] = useState<string>('');
  const [sourceLocationId, setSourceLocationId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [lines, setLines] = useState<{ productId: string; quantity: number }[]>([]);

  // Pick/Pack checklist simulation
  const [pickedLines, setPickedLines] = useState<Record<string, boolean>>({});
  const [packedLines, setPackedLines] = useState<Record<string, boolean>>({});

  const loadData = () => {
    const list = MockStorage.getDocuments('DELIVERY', undefined, selectedLocationId);
    setDeliveries(list);
    const prods = MockStorage.getProducts();
    setProducts(prods);
    const locs = MockStorage.getLocations();
    setLocations(locs);

    if (locs.length > 0 && !sourceLocationId) {
      setSourceLocationId(locs[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedLocationId]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsNewModalOpen(true);
      if (lines.length === 0 && products.length > 0) {
        setLines([{ productId: products[0].id, quantity: 10 }]);
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

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      error('Validation Error', 'Customer / Recipient name is required.');
      return;
    }
    if (lines.length === 0) {
      error('Validation Error', 'At least one line item is required.');
      return;
    }

    const sourceLoc = locations.find((l) => l.id === sourceLocationId);

    // Validate stock levels before creating order
    for (const line of lines) {
      const available = MockStorage.getStockAtLocation(line.productId, sourceLocationId);
      const prod = products.find((p) => p.id === line.productId);
      if (available < line.quantity) {
        error(
          'Insufficient Stock',
          `Not enough ${prod?.name} at ${sourceLoc?.name}. Available: ${available}, Requested: ${line.quantity}`
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

    const newCode = `DEL-2026-${String(deliveries.length + 10).padStart(3, '0')}`;
    const newDoc = MockStorage.createDocument({
      code: newCode,
      type: 'DELIVERY',
      status: 'READY',
      created_by: user?.id || 'usr-001',
      creator_name: user?.name || 'Inventory Staff',
      source_location_id: sourceLocationId,
      source_location_name: sourceLoc?.name || 'Warehouse',
      destination_location_id: null,
      destination_location_name: `${customerName} (Customer)`,
      partner_name: customerName,
      notes: notes,
      lines: docLines,
    });

    success('Delivery Created', `Order ${newDoc.code} has been created and is ready for Picking.`);
    setIsNewModalOpen(false);
    setCustomerName('');
    setNotes('');
    setLines([]);
    loadData();
    setSelectedDelivery(newDoc);
  };

  const handleValidateDelivery = (docId: string) => {
    const res = MockStorage.validateDocument(docId);
    if (res.success) {
      success('Order Dispatched & Validated!', res.message);
      loadData();
      if (selectedDelivery && selectedDelivery.id === docId) {
        setSelectedDelivery(MockStorage.getDocumentById(docId) || null);
      }
    } else {
      error('Validation Failed', res.message);
    }
  };

  const togglePick = (lineId: string) => {
    setPickedLines((prev) => ({ ...prev, [lineId]: !prev[lineId] }));
  };

  const togglePack = (lineId: string) => {
    setPackedLines((prev) => ({ ...prev, [lineId]: !prev[lineId] }));
  };

  const filteredDeliveries = deliveries.filter((del) => {
    const matchesStatus = statusFilter === 'all' || del.status === statusFilter;
    const matchesSearch =
      del.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (del.partner_name && del.partner_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Delivery Orders (Outgoing Goods)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {currentLocationName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pick, pack, and ship outgoing inventory orders while maintaining double-entry ledger balance.
          </p>
        </div>

        <button
          onClick={() => {
            setIsNewModalOpen(true);
            if (lines.length === 0 && products.length > 0) {
              setLines([{ productId: products[0].id, quantity: 10 }]);
            }
          }}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Delivery Order</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by order code or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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

      {/* Deliveries Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Order Ref #</th>
                <th className="py-3 px-4">Customer / Destination</th>
                <th className="py-3 px-4">Source Warehouse</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Total Units</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Created</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeliveries.map((del) => {
                const totalUnits = del.lines.reduce((sum, l) => sum + l.quantity, 0);

                return (
                  <tr
                    key={del.id}
                    onClick={() => setSelectedDelivery(del)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{del.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{del.partner_name}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{del.source_location_name}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {del.lines.length} item{del.lines.length > 1 ? 's' : ''}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      -{totalUnits}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={del.status} />
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">{formatDate(del.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      {del.status !== 'DONE' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleValidateDelivery(del.id);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs shadow-xs transition-colors inline-flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Dispatch</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-indigo-600 font-semibold">
                          Dispatched ✓
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredDeliveries.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No delivery orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Delivery Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Create New Delivery Order (Outgoing Shipment)"
        subtitle="Specify customer destination, dispatch location, and items to be picked"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateDelivery} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer / Destination Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Metro Machining Industries"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispatch Source Location *
              </label>
              <select
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
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
              Delivery Notes / Dispatch Reference
            </label>
            <input
              type="text"
              placeholder="e.g. Expedited freight • Dock 4 pickup"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Line items with real-time stock availability check */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Order Items ({lines.length})
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {lines.map((line, idx) => {
                const prod = products.find((p) => p.id === line.productId);
                const available = sourceLocationId
                  ? MockStorage.getStockAtLocation(line.productId, sourceLocationId)
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
                          On hand at source: <strong className="font-mono">{available}</strong>{' '}
                          {prod?.unit_of_measure}
                        </span>
                        {isOverStock && (
                          <span className="text-rose-600 font-semibold flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-0.5" /> Exceeds stock!
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
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              Create Delivery Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Delivery Inspection & Pick/Pack Workflow Modal */}
      {selectedDelivery && (
        <Modal
          isOpen={!!selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          title={`Delivery Order: ${selectedDelivery.code}`}
          subtitle={`Client: ${selectedDelivery.partner_name} • Dispatch Source: ${selectedDelivery.source_location_name}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <StatusBadge status={selectedDelivery.status} className="mt-1" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Order Date</span>
                <span className="text-xs text-slate-700 font-medium">
                  {formatDate(selectedDelivery.created_at)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Staff</span>
                <span className="text-xs text-slate-700 font-medium">
                  {selectedDelivery.creator_name}
                </span>
              </div>
            </div>

            {selectedDelivery.notes && (
              <p className="text-xs text-slate-600 bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-200/60">
                <strong>Dispatch Notes:</strong> {selectedDelivery.notes}
              </p>
            )}

            {/* Pick & Pack Checklist Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Pick & Pack Order Checklist
                </h4>
                <span className="text-[11px] text-slate-400">
                  {selectedDelivery.status === 'DONE' ? 'Completed' : 'Perform fulfillment checks'}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">Item / SKU</th>
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                      <th className="py-2.5 px-3 text-center w-20">Picked</th>
                      <th className="py-2.5 px-3 text-center w-20">Packed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDelivery.lines.map((l) => {
                      const isPicked = selectedDelivery.status === 'DONE' || !!pickedLines[l.id];
                      const isPacked = selectedDelivery.status === 'DONE' || !!packedLines[l.id];

                      return (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-800 block">{l.product_name}</span>
                            <span className="font-mono text-[10px] text-slate-400">{l.sku}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {l.quantity} {l.unit_of_measure}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              disabled={selectedDelivery.status === 'DONE'}
                              onClick={() => togglePick(l.id)}
                              className="text-slate-400 hover:text-indigo-600 disabled:opacity-75"
                            >
                              {isPicked ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600 inline" />
                              ) : (
                                <Square className="w-4 h-4 inline" />
                              )}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              disabled={selectedDelivery.status === 'DONE'}
                              onClick={() => togglePack(l.id)}
                              className="text-slate-400 hover:text-indigo-600 disabled:opacity-75"
                            >
                              {isPacked ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600 inline" />
                              ) : (
                                <Square className="w-4 h-4 inline" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {selectedDelivery.status === 'DONE'
                  ? '✓ Dispatched and ledger decrements executed.'
                  : 'Check items as picked & packed before finalizing shipment.'}
              </span>

              {selectedDelivery.status !== 'DONE' && (
                <button
                  onClick={() => handleValidateDelivery(selectedDelivery.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Validate & Dispatch Order</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
