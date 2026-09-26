import React, { useState, useEffect } from 'react';
import { MobileStorage } from '../../services/storage';
import { Document, Location, Product } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';

export interface TransfersScreenProps {
  searchQuery?: string;
  filterWarehouse?: string;
  autoOpenCreate?: boolean;
}

export const TransfersScreen: React.FC<TransfersScreenProps> = ({
  searchQuery = '',
  filterWarehouse = 'All',
  autoOpenCreate = false,
}) => {
  const [transfers, setTransfers] = useState<Document[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [activeTransfer, setActiveTransfer] = useState<Document | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(autoOpenCreate);

  // Form states
  const [sourceLocId, setSourceLocId] = useState('');
  const [destLocId, setDestLocId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('92');

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      const locs = await MobileStorage.getLocations();
      setLocations(locs);
      if (locs.length >= 2) {
        if (!sourceLocId) setSourceLocId(locs[0].id);
        if (!destLocId) setDestLocId(locs[1].id);
      }

      const prods = await MobileStorage.getProducts();
      setProducts(prods);
      if (prods.length > 0 && !productId) {
        setProductId(prods[0].id);
      }

      let locIdFilter: string | undefined = undefined;
      if (filterWarehouse !== 'All') {
        const match = locs.find((l) => l.name === filterWarehouse);
        if (match) locIdFilter = match.id;
      }

      const docs = await MobileStorage.getDocuments('TRANSFER', undefined, locIdFilter);
      setTransfers(docs);
    } catch (e) {
      console.error('Error loading transfers', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterWarehouse]);

  useEffect(() => {
    if (autoOpenCreate) {
      setIsCreateOpen(true);
    }
  }, [autoOpenCreate]);

  const handleCreateTransfer = async () => {
    if (!sourceLocId || !destLocId || !productId || !Number(quantity)) {
      setToastMsg('Please fill all transfer fields.');
      return;
    }
    if (sourceLocId === destLocId) {
      setToastMsg('Source and destination locations must be different.');
      return;
    }

    const prod = products.find((p) => p.id === productId);
    const sLoc = locations.find((l) => l.id === sourceLocId);
    const dLoc = locations.find((l) => l.id === destLocId);
    if (!prod || !sLoc || !dLoc) return;

    // Check available stock at source
    const avail = await MobileStorage.getStockAtLocation(prod.id, sLoc.id);
    if (avail < Number(quantity)) {
      setToastMsg(`Insufficient stock at ${sLoc.name}. Available: ${avail} ${prod.unit_of_measure}.`);
      return;
    }

    const count = transfers.length + 1;
    const code = `WH/INT/${String(count).padStart(5, '0')}`;

    setIsLoading(true);
    try {
      const newDoc = await MobileStorage.createDocument({
        code,
        type: 'TRANSFER',
        status: 'READY',
        source_location_id: sLoc.id,
        source_location_name: sLoc.name,
        destination_location_id: dLoc.id,
        destination_location_name: dLoc.name,
        lines: [
          {
            id: `line-${Date.now()}`,
            product_id: prod.id,
            product_name: prod.name,
            sku: prod.sku,
            requested_quantity: Number(quantity),
            processed_quantity: Number(quantity),
            unit_of_measure: prod.unit_of_measure,
          },
        ],
        notes: `Internal transfer from ${sLoc.name} to ${dLoc.name}`,
      });

      setIsCreateOpen(false);
      setToastMsg(`Created transfer ${code}`);
      await loadData();
      setActiveTransfer(newDoc);
    } catch (err: any) {
      setToastMsg(err.message || 'Error creating transfer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateTransfer = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await MobileStorage.validateDocument(id);
      if (res.success) {
        setToastMsg(res.message);
        setActiveTransfer(null);
        await loadData();
      } else {
        setToastMsg(res.message);
      }
    } catch (err: any) {
      setToastMsg(err.message || 'Error validating transfer');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransfers = transfers.filter((doc) => {
    if (statusFilter !== 'All' && doc.status !== statusFilter.toUpperCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = doc.code.toLowerCase().includes(q);
      const matchLines = doc.lines.some(
        (l) => l.product_name.toLowerCase().includes(q) || l.sku.toLowerCase().includes(q)
      );
      if (!matchCode && !matchLines) return false;
    }
    return true;
  });

  return (
    <div className="list">
      <div className="list-head">
        <h1>
          Internal transfers<span>{transfers.length}</span>
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="tabs">
            {['All', 'Ready', 'Waiting', 'Draft', 'Done'].map((st) => (
              <span
                key={st}
                className={`tab ${statusFilter === st ? 'on' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </span>
            ))}
          </div>
          <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
            + New transfer
          </Button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Reference</th>
            <th>Route</th>
            <th>Products</th>
            <th>Scheduled</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransfers.map((doc) => (
            <tr
              key={doc.id}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveTransfer(doc)}
            >
              <td className="ref">
                <span className="rt">
                  <i style={{ background: 'var(--sky-300)' }}></i>
                  <span>
                    {doc.code}
                    <small>Internal transfer</small>
                  </span>
                </span>
              </td>
              <td>
                <span className="route">
                  {doc.source_location_name} → {doc.destination_location_name}
                </span>
              </td>
              <td>
                {doc.lines.map((l) => (
                  <span key={l.id} style={{ marginRight: 8 }}>
                    {l.product_name} <b className="mono">{l.requested_quantity} {l.unit_of_measure}</b>
                  </span>
                ))}
              </td>
              <td className="when">
                {new Date(doc.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
              <td>
                <Badge status={doc.status} />
              </td>
            </tr>
          ))}

          {filteredTransfers.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)' }}>
                No internal transfers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* View / Validate Transfer Modal */}
      {activeTransfer && (
        <Modal
          isOpen={!!activeTransfer}
          onClose={() => setActiveTransfer(null)}
          title={activeTransfer.code}
          subtitle={`Internal transfer from ${activeTransfer.source_location_name} to ${activeTransfer.destination_location_name}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setActiveTransfer(null)}>
                Close
              </Button>
              {activeTransfer.status !== 'DONE' && activeTransfer.status !== 'CANCELED' && (
                <Button
                  variant="primary"
                  disabled={isLoading}
                  onClick={() => handleValidateTransfer(activeTransfer.id)}
                >
                  {isLoading ? 'Validating...' : 'Validate transfer'}
                </Button>
              )}
            </>
          }
        >
          <div className="lines">
            {activeTransfer.lines.map((l) => (
              <div key={l.id} className="line">
                <span>
                  {l.product_name}
                  <span className="sku">{l.sku}</span>
                </span>
                <span className="mono" style={{ color: 'var(--ink-2)' }}>
                  {l.requested_quantity} {l.unit_of_measure}
                </span>
              </div>
            ))}
          </div>

          <div className="effect" style={{ marginTop: 14 }}>
            Total stock stays the same. Only the location changes, and the move is logged.
          </div>
        </Modal>
      )}

      {/* New Transfer Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="New internal transfer"
          subtitle="Relocate stock between warehouses or racks"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={isLoading}
                onClick={handleCreateTransfer}
              >
                Create transfer
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="arrow-mid">
              <div className="field">
                <label>From</label>
                <div className="input">
                  <select
                    value={sourceLocId}
                    onChange={(e) => setSourceLocId(e.target.value)}
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <i>→</i>
              <div className="field">
                <label>To</label>
                <div className="input">
                  <select
                    value={destLocId}
                    onChange={(e) => setDestLocId(e.target.value)}
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="two">
              <div className="field">
                <label>Product</label>
                <div className="input">
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Input
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                suffix={products.find((p) => p.id === productId)?.unit_of_measure || 'kg'}
              />
            </div>

            <div className="effect">
              Total stock stays the same. Only the location changes, and the move is logged.
            </div>
          </div>
        </Modal>
      )}

      <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </div>
  );
};
