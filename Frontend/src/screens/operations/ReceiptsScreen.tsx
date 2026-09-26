import React, { useState, useEffect } from 'react';
import { MobileStorage } from '../../services/storage';
import { Document, Location, Product } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';
import { SlidingTabs } from '../../components/ui/SlidingTabs';
import { TabTransition } from '../../components/motion/TabTransition';

export interface ReceiptsScreenProps {
  searchQuery?: string;
  filterWarehouse?: string;
  autoOpenCreate?: boolean;
}

export const ReceiptsScreen: React.FC<ReceiptsScreenProps> = ({
  searchQuery = '',
  filterWarehouse = 'All',
  autoOpenCreate = false,
}) => {
  const [receipts, setReceipts] = useState<Document[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modal / Detail state
  const [activeReceipt, setActiveReceipt] = useState<Document | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(autoOpenCreate);

  // Form states for new receipt
  const [vendorName, setVendorName] = useState('Tata Steel');
  const [destLocationId, setDestLocationId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('50');

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      const locs = await MobileStorage.getLocations();
      setLocations(locs);
      if (locs.length > 0 && !destLocationId) {
        setDestLocationId(locs[0].id);
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

      const docs = await MobileStorage.getDocuments('RECEIPT', undefined, locIdFilter);
      setReceipts(docs);
    } catch (e) {
      console.error('Error loading receipts', e);
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

  const handleCreateReceipt = async () => {
    if (!vendorName.trim() || !destLocationId || !selectedProductId || !Number(quantity)) {
      setToastMsg('Please fill all required receipt fields.');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    const loc = locations.find((l) => l.id === destLocationId);
    if (!prod || !loc) return;

    const count = receipts.length + 1;
    const code = `WH/IN/${String(count).padStart(5, '0')}`;

    setIsLoading(true);
    try {
      const newDoc = await MobileStorage.createDocument({
        code,
        type: 'RECEIPT',
        status: 'READY',
        source_location_id: null,
        source_location_name: vendorName,
        destination_location_id: loc.id,
        destination_location_name: loc.name,
        partner_name: vendorName,
        created_by: 'system',
        creator_name: 'Inventory Manager',
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
        notes: `Incoming goods from ${vendorName}`,
      });

      setIsCreateOpen(false);
      setToastMsg(`Created receipt ${code}`);
      await loadData();
      setActiveReceipt(newDoc);
    } catch (err: any) {
      setToastMsg(err.message || 'Error creating receipt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateReceipt = async (docId: string) => {
    setIsLoading(true);
    try {
      const res = await MobileStorage.validateDocument(docId);
      if (res.success) {
        setToastMsg(res.message);
        setActiveReceipt(null);
        await loadData();
      } else {
        setToastMsg(res.message);
      }
    } catch (err: any) {
      setToastMsg(err.message || 'Error validating receipt');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter receipts
  const filteredReceipts = receipts.filter((doc) => {
    if (statusFilter !== 'All' && doc.status !== statusFilter.toUpperCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = doc.code.toLowerCase().includes(q);
      const matchPartner = (doc.partner_name || '').toLowerCase().includes(q);
      const matchLines = doc.lines.some(
        (l) => l.product_name.toLowerCase().includes(q) || l.sku.toLowerCase().includes(q)
      );
      if (!matchCode && !matchPartner && !matchLines) return false;
    }
    return true;
  });

  return (
    <div className="list">
      <div className="list-head">
        <h1>
          Receipts<span>{receipts.length}</span>
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
            + New receipt
          </Button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Reference</th>
            <th>Supplier</th>
            <th>Destination</th>
            <th>Products</th>
            <th>Scheduled</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredReceipts.map((doc) => (
            <tr
              key={doc.id}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveReceipt(doc)}
            >
              <td className="ref">
                <span className="rt">
                  <i style={{ background: 'var(--sky-500)' }}></i>
                  <span>
                    {doc.code}
                    <small>Receipt</small>
                  </span>
                </span>
              </td>
              <td>{doc.partner_name || 'Vendor'}</td>
              <td>{doc.destination_location_name || 'Warehouse'}</td>
              <td>
                {doc.lines.map((l) => (
                  <span key={l.id} style={{ marginRight: 8 }}>
                    {l.product_name} <b className="q-in">+{l.requested_quantity} {l.unit_of_measure}</b>
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

          {filteredReceipts.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)' }}>
                No receipts found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* View / Validate Receipt Modal */}
      {activeReceipt && (
        <Modal
          isOpen={!!activeReceipt}
          onClose={() => setActiveReceipt(null)}
          title={activeReceipt.code}
          subtitle={`Receipt from ${activeReceipt.partner_name || 'Vendor'}, into ${
            activeReceipt.destination_location_name || 'Warehouse'
          }`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setActiveReceipt(null)}>
                Back
              </Button>
              {activeReceipt.status !== 'DONE' && activeReceipt.status !== 'CANCELED' && (
                <Button
                  variant="primary"
                  disabled={isLoading}
                  onClick={() => handleValidateReceipt(activeReceipt.id)}
                >
                  {isLoading ? 'Validating...' : 'Validate receipt'}
                </Button>
              )}
            </>
          }
        >
          <div className="lines">
            {activeReceipt.lines.map((l) => (
              <div key={l.id} className="line">
                <span>
                  {l.product_name}
                  <span className="sku">{l.sku}</span>
                </span>
                <span className="q-in">
                  +{l.requested_quantity} {l.unit_of_measure}
                </span>
              </div>
            ))}
          </div>

          <div className="effect">
            Validating adds{' '}
            {activeReceipt.lines
              .map((l) => `${l.requested_quantity} ${l.unit_of_measure}`)
              .join(' and ')}{' '}
            to {activeReceipt.destination_location_name || 'destination warehouse'} and writes lines to move history.
          </div>
        </Modal>
      )}

      {/* New Receipt Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="New receipt"
          subtitle="Record goods arriving from a supplier"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={isLoading}
                onClick={handleCreateReceipt}
              >
                Create receipt
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Supplier / Vendor"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
            <div className="field">
              <label>Destination Warehouse</label>
              <div className="input">
                <select
                  value={destLocationId}
                  onChange={(e) => setDestLocationId(e.target.value)}
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
              <Input
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                suffix={products.find((p) => p.id === selectedProductId)?.unit_of_measure || 'kg'}
              />
            </div>
          </div>
        </Modal>
      )}

      <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </div>
  );
};
