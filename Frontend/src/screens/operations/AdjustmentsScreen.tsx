import React, { useState, useEffect } from 'react';
import { MobileStorage } from '../../services/storage';
import { Document, Location, Product } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';

export interface AdjustmentsScreenProps {
  searchQuery?: string;
  filterWarehouse?: string;
  autoOpenCreate?: boolean;
}

export const AdjustmentsScreen: React.FC<AdjustmentsScreenProps> = ({
  searchQuery = '',
  filterWarehouse = 'All',
  autoOpenCreate = false,
}) => {
  const [adjustments, setAdjustments] = useState<Document[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [activeAdjustment, setActiveAdjustment] = useState<Document | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(autoOpenCreate);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [systemQty, setSystemQty] = useState(0);
  const [countedQty, setCountedQty] = useState('');
  const [reason, setReason] = useState<'Damaged' | 'Lost' | 'Found' | 'Count correction'>('Damaged');

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      const locs = await MobileStorage.getLocations();
      setLocations(locs);
      if (locs.length > 0 && !locationId) {
        setLocationId(locs[0].id);
      }

      const prods = await MobileStorage.getProducts();
      setProducts(prods);
      if (prods.length > 0 && !selectedProductId) {
        setSelectedProductId(prods[0].id);
      }

      let locIdFilter: string | undefined = undefined;
      if (filterWarehouse !== 'All') {
        const match = locs.find((l) => l.name === filterWarehouse);
        if (match) locIdFilter = match.id;
      }

      const docs = await MobileStorage.getDocuments('ADJUSTMENT', undefined, locIdFilter);
      setAdjustments(docs);
    } catch (e) {
      console.error('Error loading adjustments', e);
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

  // Update system quantity when product or location changes
  useEffect(() => {
    async function updateSystemQty() {
      if (selectedProductId && locationId) {
        const qty = await MobileStorage.getStockAtLocation(selectedProductId, locationId);
        setSystemQty(qty);
        if (!countedQty) {
          setCountedQty(String(qty));
        }
      }
    }
    updateSystemQty();
  }, [selectedProductId, locationId]);

  const diff = Number(countedQty || 0) - systemQty;
  const currentProd = products.find((p) => p.id === selectedProductId);

  const handleApplyAdjustment = async () => {
    if (!selectedProductId || !locationId || countedQty === '') {
      setToastMsg('Please fill all adjustment fields.');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    const loc = locations.find((l) => l.id === locationId);
    if (!prod || !loc) return;

    const delta = Number(countedQty) - systemQty;
    if (delta === 0) {
      setToastMsg('Counted quantity equals system quantity. No adjustment needed.');
      return;
    }

    const count = adjustments.length + 1;
    const code = `WH/ADJ/${String(count).padStart(5, '0')}`;

    setIsLoading(true);
    try {
      const newDoc = await MobileStorage.createDocument({
        code,
        type: 'ADJUSTMENT',
        status: 'READY',
        source_location_id: loc.id,
        source_location_name: loc.name,
        destination_location_id: loc.id,
        destination_location_name: loc.name,
        partner_name: `Physical Recount (${reason})`,
        lines: [
          {
            id: `line-${Date.now()}`,
            product_id: prod.id,
            product_name: prod.name,
            sku: prod.sku,
            requested_quantity: delta,
            processed_quantity: delta,
            unit_of_measure: prod.unit_of_measure,
          },
        ],
        notes: `Reason: ${reason}`,
      });

      // Validate atomically immediately
      const res = await MobileStorage.validateDocument(newDoc.id);

      setIsCreateOpen(false);
      setToastMsg(res.message);
      await loadData();
    } catch (err: any) {
      setToastMsg(err.message || 'Error applying adjustment');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAdjustments = adjustments.filter((doc) => {
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
          Stock Adjustments<span>{adjustments.length}</span>
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="tabs">
            {['All', 'Done', 'Ready', 'Draft'].map((st) => (
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
            + New adjustment
          </Button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Reference</th>
            <th>Location</th>
            <th>Product</th>
            <th className="num">Discrepancy</th>
            <th>Scheduled</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredAdjustments.map((doc) => {
            const line = doc.lines[0];
            const qty = line?.requested_quantity || 0;
            return (
              <tr
                key={doc.id}
                style={{ cursor: 'pointer' }}
                onClick={() => setActiveAdjustment(doc)}
              >
                <td className="ref">
                  <span className="rt">
                    <i style={{ background: 'var(--coral)' }}></i>
                    <span>
                      {doc.code}
                      <small>Adjustment</small>
                    </span>
                  </span>
                </td>
                <td>
                  {doc.destination_location_name || 'Warehouse'}
                  {doc.notes && <span className="reason">{doc.notes}</span>}
                </td>
                <td>
                  {line ? (
                    <span>
                      {line.product_name} <span className="sku">{line.sku}</span>
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="num q-adj">
                  {qty > 0 ? `+${qty}` : `${qty}`} {line?.unit_of_measure}
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
            );
          })}

          {filteredAdjustments.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)' }}>
                No adjustments found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* View Adjustment Modal */}
      {activeAdjustment && (
        <Modal
          isOpen={!!activeAdjustment}
          onClose={() => setActiveAdjustment(null)}
          title={activeAdjustment.code}
          subtitle={`Stock recount at ${activeAdjustment.destination_location_name || 'Warehouse'}`}
          footer={
            <Button variant="secondary" onClick={() => setActiveAdjustment(null)}>
              Close
            </Button>
          }
        >
          <div className="lines">
            {activeAdjustment.lines.map((l) => (
              <div key={l.id} className="line">
                <span>
                  {l.product_name}
                  <span className="sku">{l.sku}</span>
                </span>
                <span className="q-adj">
                  {l.requested_quantity > 0 ? `+${l.requested_quantity}` : l.requested_quantity}{' '}
                  {l.unit_of_measure}
                </span>
              </div>
            ))}
          </div>

          <div className="effect" style={{ marginTop: 14 }}>
            {activeAdjustment.notes || 'Count correction recorded in ledger.'}
          </div>
        </Modal>
      )}

      {/* New Adjustment Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="New adjustment"
          subtitle="Match the system to what you counted"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={isLoading}
                onClick={handleApplyAdjustment}
              >
                {isLoading ? 'Applying...' : 'Apply adjustment'}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="two">
              <div className="field">
                <label>Product</label>
                <div className="input">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Location</label>
                <div className="input">
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>In the system</label>
                <div className="input" style={{ background: 'var(--grey-50)', color: 'var(--ink-2)' }}>
                  {systemQty}
                  <span className="suffix">{currentProd?.unit_of_measure || 'kg'}</span>
                </div>
              </div>
              <Input
                label="Counted"
                type="number"
                value={countedQty}
                onChange={(e) => setCountedQty(e.target.value)}
                suffix={currentProd?.unit_of_measure || 'kg'}
              />
            </div>

            <div className="two" style={{ alignItems: 'end' }}>
              <div className="diff">
                <b>{diff > 0 ? `+${diff}` : diff}</b>
                <span>{currentProd?.unit_of_measure || 'kg'} difference</span>
              </div>
              <div className="field">
                <label>Reason</label>
                <div className="input">
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as any)}
                  >
                    <option value="Damaged">Damaged</option>
                    <option value="Lost">Lost</option>
                    <option value="Found">Found</option>
                    <option value="Count correction">Count correction</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </div>
  );
};
