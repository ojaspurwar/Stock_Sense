import React, { useState, useEffect } from 'react';
import { MobileStorage } from '../../services/storage';
import { Document, Location, Product } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Stepper } from '../../components/ui/Stepper';
import { Toast } from '../../components/ui/Toast';

export interface DeliveriesScreenProps {
  searchQuery?: string;
  filterWarehouse?: string;
  autoOpenCreate?: boolean;
}

export const DeliveriesScreen: React.FC<DeliveriesScreenProps> = ({
  searchQuery = '',
  filterWarehouse = 'All',
  autoOpenCreate = false,
}) => {
  const [deliveries, setDeliveries] = useState<Document[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Active delivery workflow modal
  const [activeDelivery, setActiveDelivery] = useState<Document | null>(null);
  const [stepperStep, setStepperStep] = useState<1 | 2 | 3>(1);
  const [pickedLines, setPickedLines] = useState<{ [lineId: string]: boolean }>({});
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  // Create Delivery modal
  const [isCreateOpen, setIsCreateOpen] = useState(autoOpenCreate);
  const [customerName, setCustomerName] = useState('Metro Interiors');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('200');

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      const locs = await MobileStorage.getLocations();
      setLocations(locs);
      if (locs.length > 0 && !sourceLocationId) {
        setSourceLocationId(locs[0].id);
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

      const docs = await MobileStorage.getDocuments('DELIVERY', undefined, locIdFilter);
      setDeliveries(docs);
    } catch (e) {
      console.error('Error loading deliveries', e);
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

  const handleOpenDeliveryModal = (doc: Document) => {
    setActiveDelivery(doc);
    setDeliveryError(null);
    if (doc.status === 'DONE') {
      setStepperStep(3);
      const allPicked: { [id: string]: boolean } = {};
      doc.lines.forEach((l) => (allPicked[l.id] = true));
      setPickedLines(allPicked);
    } else {
      setStepperStep(1);
      const initPicked: { [id: string]: boolean } = {};
      doc.lines.forEach((l) => (initPicked[l.id] = false));
      setPickedLines(initPicked);
    }
  };

  const handleTogglePicked = (lineId: string) => {
    setPickedLines((prev) => ({ ...prev, [lineId]: !prev[lineId] }));
  };

  const handleMarkAsPacked = () => {
    const allChecked = activeDelivery?.lines.every((l) => pickedLines[l.id]);
    if (!allChecked) {
      setDeliveryError('Please pick and tick all item lines first.');
      return;
    }
    setDeliveryError(null);
    setStepperStep(2);
  };

  const handleValidateDelivery = async () => {
    if (!activeDelivery) return;
    setIsLoading(true);
    setDeliveryError(null);

    try {
      const res = await MobileStorage.validateDocument(activeDelivery.id);
      if (res.success) {
        setStepperStep(3);
        setToastMsg(res.message);
        await loadData();
        setActiveDelivery(null);
      } else {
        setDeliveryError(res.message);
      }
    } catch (err: any) {
      setDeliveryError(err.message || 'Error validating delivery order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDelivery = async () => {
    if (!customerName.trim() || !sourceLocationId || !selectedProductId || !Number(quantity)) {
      setToastMsg('Please fill all required delivery order fields.');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    const loc = locations.find((l) => l.id === sourceLocationId);
    if (!prod || !loc) return;

    // Check available stock
    const currentStock = await MobileStorage.getStockAtLocation(prod.id, loc.id);
    if (currentStock < Number(quantity)) {
      setToastMsg(
        `Insufficient stock! ${prod.name} has only ${currentStock} ${prod.unit_of_measure} available at ${loc.name}.`
      );
      return;
    }

    const count = deliveries.length + 1;
    const code = `WH/OUT/${String(count).padStart(5, '0')}`;

    setIsLoading(true);
    try {
      const newDoc = await MobileStorage.createDocument({
        code,
        type: 'DELIVERY',
        status: 'READY',
        source_location_id: loc.id,
        source_location_name: loc.name,
        destination_location_id: null,
        destination_location_name: customerName,
        partner_name: customerName,
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
        notes: `Delivery order for ${customerName}`,
      });

      setIsCreateOpen(false);
      setToastMsg(`Created delivery ${code}`);
      await loadData();
      handleOpenDeliveryModal(newDoc);
    } catch (err: any) {
      setToastMsg(err.message || 'Error creating delivery order');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter((doc) => {
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
          Delivery orders<span>{deliveries.length}</span>
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
            + New delivery
          </Button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Reference</th>
            <th>Customer</th>
            <th>Source</th>
            <th>Products</th>
            <th>Scheduled</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredDeliveries.map((doc) => (
            <tr
              key={doc.id}
              style={{ cursor: 'pointer' }}
              onClick={() => handleOpenDeliveryModal(doc)}
            >
              <td className="ref">
                <span className="rt">
                  <i style={{ background: 'var(--ink)' }}></i>
                  <span>
                    {doc.code}
                    <small>Delivery</small>
                  </span>
                </span>
              </td>
              <td>{doc.partner_name || 'Customer'}</td>
              <td>{doc.source_location_name || 'Warehouse'}</td>
              <td>
                {doc.lines.map((l) => (
                  <span key={l.id} style={{ marginRight: 8 }}>
                    {l.product_name} <b className="q-out">−{l.requested_quantity} {l.unit_of_measure}</b>
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

          {filteredDeliveries.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)' }}>
                No delivery orders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 3-Step Delivery Workflow Modal */}
      {activeDelivery && (
        <Modal
          isOpen={!!activeDelivery}
          onClose={() => setActiveDelivery(null)}
          title={activeDelivery.code}
          subtitle={`Delivery to ${activeDelivery.partner_name || 'Customer'}, from ${
            activeDelivery.source_location_name || 'Warehouse'
          }`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setActiveDelivery(null)}>
                Close
              </Button>
              {stepperStep === 1 && activeDelivery.status !== 'DONE' && (
                <Button variant="primary" onClick={handleMarkAsPacked}>
                  Mark as packed
                </Button>
              )}
              {stepperStep === 2 && activeDelivery.status !== 'DONE' && (
                <>
                  <Button variant="secondary" onClick={() => setStepperStep(1)}>
                    Back to picking
                  </Button>
                  <Button
                    variant="primary"
                    disabled={isLoading}
                    onClick={handleValidateDelivery}
                  >
                    {isLoading ? 'Validating...' : 'Validate delivery'}
                  </Button>
                </>
              )}
            </>
          }
        >
          <Stepper
            steps={[
              { number: 1, label: 'Pick' },
              { number: 2, label: 'Pack' },
              { number: 3, label: 'Validate' },
            ]}
            currentStep={stepperStep}
          />

          {deliveryError && (
            <div
              style={{
                color: 'var(--coral)',
                background: '#FDEEEA',
                border: '1px solid #F3C3B9',
                padding: '8px 12px',
                borderRadius: 4,
                fontSize: 13,
                marginTop: 12,
              }}
            >
              {deliveryError}
            </div>
          )}

          <div className="lines">
            {activeDelivery.lines.map((l) => (
              <div key={l.id} className="line">
                <span className="l">
                  {stepperStep === 1 && activeDelivery.status !== 'DONE' && (
                    <span
                      className={`cb ${pickedLines[l.id] ? 'on' : ''}`}
                      onClick={() => handleTogglePicked(l.id)}
                    >
                      {pickedLines[l.id] ? '✓' : ''}
                    </span>
                  )}
                  <span>
                    {l.product_name}
                    <span className="sku">{l.sku}</span>
                  </span>
                </span>
                <span className="q-out">
                  −{l.requested_quantity} {l.unit_of_measure}
                </span>
              </div>
            ))}
          </div>

          <div className="effect">
            <b>
              −{activeDelivery.lines.reduce((s, l) => s + l.requested_quantity, 0)}
            </b>{' '}
            items leave {activeDelivery.source_location_name || 'Warehouse'} when you validate.
          </div>
        </Modal>
      )}

      {/* New Delivery Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="New delivery order"
          subtitle="Dispatch goods to customer or downstream site"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={isLoading}
                onClick={handleCreateDelivery}
              >
                Create delivery
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Customer / Destination"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <div className="field">
              <label>Source Warehouse</label>
              <div className="input">
                <select
                  value={sourceLocationId}
                  onChange={(e) => setSourceLocationId(e.target.value)}
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
                suffix={products.find((p) => p.id === selectedProductId)?.unit_of_measure || 'pcs'}
              />
            </div>
          </div>
        </Modal>
      )}

      <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </div>
  );
};
