import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MobileStorage } from '../../services/storage';
import { ProductStockSummary, Location } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Pill } from '../../components/ui/Pill';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Drawer } from '../../components/ui/Drawer';
import { Toast } from '../../components/ui/Toast';
import { TabTransition } from '../../components/motion/TabTransition';

export interface ProductsScreenProps {
  searchQuery?: string;
  filterWarehouse?: string;
  filterCategory?: string;
  onNavigateToHistory?: (productId: string) => void;
  openNewProductDrawer?: boolean;
  onCloseNewProductDrawer?: () => void;
}

export const ProductsScreen: React.FC<ProductsScreenProps> = ({
  searchQuery = '',
  filterWarehouse = 'All',
  filterCategory = 'All',
  onNavigateToHistory,
  openNewProductDrawer = false,
  onCloseNewProductDrawer,
}) => {
  const [products, setProducts] = useState<ProductStockSummary[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'instock' | 'low' | 'out'>('all');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, visible: false });

  // Sliding pill for tabs
  useEffect(() => {
    const updatePill = () => {
      if (!tabsRef.current) return;
      const activeEl = tabsRef.current.querySelector('.tab.on') as HTMLElement | null;
      if (activeEl) {
        setPillStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          visible: true,
        });
      }
    };
    updatePill();
    const t = setTimeout(updatePill, 30);
    window.addEventListener('resize', updatePill);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updatePill);
    };
  }, [activeTab]);

  const [page, setPage] = useState(1);
  const rowsPerPage = 12;

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(openNewProductDrawer);
  const [editingProduct, setEditingProduct] = useState<ProductStockSummary | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('Raw material');
  const [formUnit, setFormUnit] = useState('kg');
  const [formInitialQty, setFormInitialQty] = useState('');
  const [formLocationId, setFormLocationId] = useState('');
  const [formMinReorder, setFormMinReorder] = useState('150');
  const [formMaxReorder, setFormMaxReorder] = useState('600');
  const [formError, setFormError] = useState<string | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const locs = await MobileStorage.getLocations();
      setLocations(locs);
      if (locs.length > 0 && !formLocationId) {
        setFormLocationId(locs[0].id);
      }

      let locIdFilter: string | undefined = undefined;
      if (filterWarehouse !== 'All') {
        const match = locs.find((l) => l.name === filterWarehouse);
        if (match) locIdFilter = match.id;
      }

      const prods = await MobileStorage.getProductStockSummaries(locIdFilter);
      setProducts(prods);
    } catch (e) {
      console.error('Error loading products', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterWarehouse]);

  useEffect(() => {
    if (openNewProductDrawer) {
      handleOpenCreate();
    }
  }, [openNewProductDrawer]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku(`SKU-${Math.floor(100 + Math.random() * 900)}`);
    setFormCategory('Raw material');
    setFormUnit('kg');
    setFormInitialQty('');
    setFormMinReorder('150');
    setFormMaxReorder('600');
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (prod: ProductStockSummary) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormSku(prod.sku);
    setFormCategory(prod.category);
    setFormUnit(prod.unit_of_measure);
    setFormInitialQty('');
    setFormMinReorder(String(prod.min_reorder_level || 0));
    setFormMaxReorder(String((prod.min_reorder_level || 50) * 4));
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingProduct(null);
    onCloseNewProductDrawer?.();
  };

  const handleSaveProduct = async () => {
    setFormError(null);
    if (!formName.trim()) {
      setFormError('Product name is required.');
      return;
    }
    if (!formSku.trim()) {
      setFormError('SKU code is required.');
      return;
    }

    try {
      if (editingProduct) {
        // Edit product
        await MobileStorage.updateProduct(editingProduct.id, {
          name: formName.trim(),
          sku: formSku.trim().toUpperCase(),
          category: formCategory,
          unit_of_measure: formUnit,
          min_reorder_level: Number(formMinReorder) || 0,
        });
        setToastMsg(`Updated ${formName}`);
      } else {
        // Validate SKU unique
        const existing = products.find(
          (p) => p.sku.toLowerCase() === formSku.trim().toLowerCase()
        );
        if (existing) {
          setFormError(`A product with SKU ${formSku.toUpperCase()} already exists.`);
          return;
        }

        const initQty = Number(formInitialQty);
        await MobileStorage.createProduct({
          name: formName.trim(),
          sku: formSku.trim().toUpperCase(),
          category: formCategory,
          unit_of_measure: formUnit,
          min_reorder_level: Number(formMinReorder) || 0,
          initial_stock:
            initQty > 0
              ? {
                  location_id: formLocationId || locations[0]?.id || 'loc-main',
                  quantity: initQty,
                }
              : undefined,
        });
        setToastMsg(`Created product ${formName}`);
      }

      await loadData();
      handleCloseDrawer();
    } catch (err: any) {
      setFormError(err.message || 'Error saving product.');
    }
  };

  // Filter products by tab, search, warehouse, and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Tab filter
      if (activeTab === 'instock' && p.total_stock <= 0) return false;
      if (activeTab === 'low' && !p.is_low_stock) return false;
      if (activeTab === 'out' && !p.is_out_of_stock) return false;

      // Category filter
      if (filterCategory !== 'All' && p.category !== filterCategory) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesCat) return false;
      }

      return true;
    });
  }, [products, activeTab, filterCategory, searchQuery]);

  // Tab counts
  const totalCount = products.length;
  const inStockCount = products.filter((p) => p.total_stock > 0).length;
  const lowCount = products.filter((p) => p.is_low_stock).length;
  const outCount = products.filter((p) => p.is_out_of_stock).length;

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage) || 1;
  const paginated = filteredProducts.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="list">
      {/* List Head with Tabs and "+ New product" action */}
      <div className="list-head">
        <h1>
          Products<span>{totalCount}</span>
        </h1>
        <div className="tabs" ref={tabsRef}>
          {pillStyle.visible && (
            <span
              className="tab-pill"
              style={{
                transform: `translate3d(${pillStyle.left}px, 0, 0)`,
                width: `${pillStyle.width}px`,
              }}
            />
          )}
          <span
            className={`tab ${activeTab === 'all' ? 'on' : ''}`}
            onClick={() => {
              setActiveTab('all');
              setPage(1);
            }}
          >
            All <b>{totalCount}</b>
          </span>
          <span
            className={`tab ${activeTab === 'instock' ? 'on' : ''}`}
            onClick={() => {
              setActiveTab('instock');
              setPage(1);
            }}
          >
            In stock <b>{inStockCount}</b>
          </span>
          <span
            className={`tab low ${activeTab === 'low' ? 'on' : ''}`}
            onClick={() => {
              setActiveTab('low');
              setPage(1);
            }}
          >
            Low stock <b>{lowCount}</b>
          </span>
          <span
            className={`tab low ${activeTab === 'out' ? 'on' : ''}`}
            onClick={() => {
              setActiveTab('out');
              setPage(1);
            }}
          >
            Out of stock <b>{outCount}</b>
          </span>
        </div>
      </div>

      {/* Products Table with TabTransition */}
      <TabTransition activeTab={activeTab} tabOrder={['all', 'instock', 'low', 'out']}>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Unit</th>
              <th className="num">On hand</th>
              <th>By warehouse</th>
              <th>Reorder min / max</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((prod) => {
              const isZero = prod.total_stock <= 0;
              const reorderMin = prod.min_reorder_level || 0;
              const reorderMax = reorderMin * 4 || 100;
              const isExpanded = expandedProductId === prod.id;

              return (
                <React.Fragment key={prod.id}>
                  <tr
                    style={{ cursor: 'pointer' }}
                    onClick={() => setExpandedProductId(isExpanded ? null : prod.id)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <svg
                          viewBox="0 0 24 24"
                          className={`accordion-chevron ${isExpanded ? 'open' : ''}`}
                          style={{ width: 14, height: 14, marginRight: 8, flexShrink: 0 }}
                        >
                          <path
                            d="m9 18 6-6-6-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div>
                          <span className="name">{prod.name}</span>
                          <span className="sku">{prod.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="cat">{prod.category}</td>
                    <td>{prod.unit_of_measure}</td>
                    <td className={`onhand ${isZero ? 'zero' : ''}`}>
                      {prod.total_stock.toLocaleString()}
                    </td>
                    <td>
                      {prod.location_breakdown.filter((l) => l.quantity > 0).length > 0 ? (
                        prod.location_breakdown
                          .filter((l) => l.quantity > 0)
                          .map((l) => (
                            <Pill key={l.location_id}>
                              {l.location_name} {l.quantity}
                            </Pill>
                          ))
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>None</span>
                      )}
                    </td>
                    <td className="rule">
                      {reorderMin.toLocaleString()} / {reorderMax.toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        {prod.is_out_of_stock ? (
                          <Badge status="out" />
                        ) : prod.is_low_stock ? (
                          <Badge status="low" />
                        ) : (
                          <Badge status="ok" />
                        )}
                        <button
                          type="button"
                          className="btn secondary"
                          style={{ padding: '4px 8px', fontSize: 11 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(prod);
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable row: stock by location accordion */}
                  <tr>
                    <td colSpan={7} style={{ padding: 0, border: 'none' }}>
                      <div className={`accordion-wrapper ${isExpanded ? 'open' : ''}`}>
                        <div className="accordion-content">
                          <div
                            style={{
                              padding: '12px 20px',
                              background: 'var(--grey-50)',
                              borderBottom: '1px solid var(--grey-200)',
                              display: 'flex',
                              gap: 16,
                              alignItems: 'center',
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: 'var(--muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              Stock by Location:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {prod.location_breakdown.map((loc) => (
                                <Pill key={loc.location_id}>
                                  {loc.location_name}: <b>{loc.quantity} {prod.unit_of_measure}</b>
                                </Pill>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}

            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)' }}>
                  No products found matching the criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TabTransition>

      {/* Pager */}
      <div className="pager">
        <span>
          Showing {paginated.length > 0 ? (page - 1) * rowsPerPage + 1 : 0}–
          {Math.min(page * rowsPerPage, filteredProducts.length)} of {filteredProducts.length}
        </span>
        <div className="arrows">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ←
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            →
          </button>
        </div>
      </div>

      {/* 460px Slide-in Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        title={editingProduct ? 'Edit product' : 'New product'}
        description={
          editingProduct
            ? `Update properties and reorder rules for ${editingProduct.sku}.`
            : 'Fields marked optional can be filled later.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseDrawer}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveProduct}>
              Save product
            </Button>
          </>
        }
      >
        {formError && (
          <div style={{ color: 'var(--coral)', fontSize: 13, marginBottom: 8 }}>
            {formError}
          </div>
        )}

        <div className="field">
          <label>Name</label>
          <div className="input focus">
            <input
              type="text"
              placeholder="e.g. Steel rod 16mm"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
        </div>

        <div className="two">
          <div className="field">
            <label>SKU / code</label>
            <div className="input mono">
              <input
                type="text"
                placeholder="e.g. STL-ROD-016"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <div className="field">
            <label>Category</label>
            <div className="input">
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
              >
                <option value="Raw material">Raw material</option>
                <option value="Components">Components</option>
                <option value="Fasteners">Fasteners</option>
                <option value="Finished goods">Finished goods</option>
                <option value="Consumables">Consumables</option>
                <option value="Packaging">Packaging</option>
              </select>
            </div>
          </div>
        </div>

        <div className="field">
          <label>Unit of measure</label>
          <div className="input">
            <select
              value={formUnit}
              onChange={(e) => setFormUnit(e.target.value)}
            >
              <option value="kg">kg (kilogram)</option>
              <option value="pcs">pcs (pieces)</option>
              <option value="L">L (litres)</option>
              <option value="m">m (metres)</option>
              <option value="box">box</option>
            </select>
          </div>
        </div>

        {/* Initial Stock (Only on create) */}
        {!editingProduct ? (
          <div className="group">
            <h3>
              Initial stock<span>Optional</span>
            </h3>
            <div className="two">
              <div className="field">
                <label>Quantity</label>
                <div className="input">
                  <input
                    type="number"
                    placeholder="0"
                    value={formInitialQty}
                    onChange={(e) => setFormInitialQty(e.target.value)}
                  />
                  <span className="suffix">{formUnit}</span>
                </div>
              </div>
              <div className="field">
                <label>Location</label>
                <div className="input">
                  <select
                    value={formLocationId}
                    onChange={(e) => setFormLocationId(e.target.value)}
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
            <p className="note">This is recorded in move history as the opening stock.</p>
          </div>
        ) : (
          <div className="group">
            <h3>Stock by location</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {editingProduct.location_breakdown.map((lb) => (
                <div
                  key={lb.location_id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--grey-50)',
                    borderRadius: 4,
                    fontSize: 13,
                  }}
                >
                  <span>{lb.location_name}</span>
                  <b style={{ fontFamily: 'var(--font-mono)' }}>
                    {lb.quantity} {editingProduct.unit_of_measure}
                  </b>
                </div>
              ))}
            </div>
            <p className="note" style={{ marginTop: 8 }}>
              <span
                className="link"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  handleCloseDrawer();
                  onNavigateToHistory?.(editingProduct.id);
                }}
              >
                View move history for {editingProduct.sku} →
              </span>
            </p>
          </div>
        )}

        {/* Reordering Rules */}
        <div className="group">
          <h3>
            Reordering rule<span>Optional</span>
          </h3>
          <div className="two">
            <div className="field">
              <label>Minimum</label>
              <div className="input">
                <input
                  type="number"
                  value={formMinReorder}
                  onChange={(e) => setFormMinReorder(e.target.value)}
                />
                <span className="suffix">{formUnit}</span>
              </div>
            </div>
            <div className="field">
              <label>Maximum</label>
              <div className="input">
                <input
                  type="number"
                  value={formMaxReorder}
                  onChange={(e) => setFormMaxReorder(e.target.value)}
                />
                <span className="suffix">{formUnit}</span>
              </div>
            </div>
          </div>
          <p className="note">
            When stock drops below the minimum, this product shows up in low stock alerts on the dashboard.
          </p>
        </div>
      </Drawer>

      <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </div>
  );
};
