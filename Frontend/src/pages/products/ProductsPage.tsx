import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocation } from '../../context/LocationContext';
import { useNotification } from '../../context/NotificationContext';
import { MockStorage } from '../../services/mockStorage';
import { ProductStockSummary, Location, StockLedgerEntry } from '../../types';
import { Modal } from '../../components/common/Modal';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Warehouse,
  AlertTriangle,
  History,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export const ProductsPage: React.FC = () => {
  const { selectedLocationId, currentLocationName } = useLocation();
  const { success, error } = useNotification();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState<ProductStockSummary[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState(
    searchParams.get('filter') === 'low' ? 'low' : 'all'
  );

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Raw Materials');
  const [newProductUom, setNewProductUom] = useState('pcs');
  const [newProductMinStock, setNewProductMinStock] = useState<number>(50);
  const [initialStockQty, setInitialStockQty] = useState<number>(0);
  const [initialStockLocation, setInitialStockLocation] = useState<string>('');

  // Product Inspection Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<ProductStockSummary | null>(null);
  const [productLedger, setProductLedger] = useState<StockLedgerEntry[]>([]);

  const loadData = () => {
    const list = MockStorage.getProductStockSummaries(selectedLocationId);
    setProducts(list);
    const locs = MockStorage.getLocations();
    setLocations(locs);
    if (locs.length > 0 && !initialStockLocation) {
      setInitialStockLocation(locs[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedLocationId]);

  // Handle viewing product details
  const handleInspectProduct = (prod: ProductStockSummary) => {
    setSelectedProduct(prod);
    const history = MockStorage.getLedger(prod.id);
    setProductLedger(history);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductSku.trim()) {
      error('Validation Error', 'Product Name and SKU are mandatory.');
      return;
    }

    try {
      MockStorage.createProduct({
        name: newProductName.trim(),
        sku: newProductSku.trim().toUpperCase(),
        category: newProductCategory,
        unit_of_measure: newProductUom,
        min_reorder_level: Number(newProductMinStock),
        initial_stock:
          initialStockQty > 0
            ? {
                location_id: initialStockLocation,
                quantity: Number(initialStockQty),
              }
            : undefined,
      });

      success('Product Created', `Product ${newProductSku.toUpperCase()} has been added to catalog.`);
      setIsAddModalOpen(false);
      // Reset form
      setNewProductName('');
      setNewProductSku('');
      setInitialStockQty(0);
      loadData();
    } catch (err: any) {
      error('Creation Failed', err.message || 'Could not create product');
    }
  };

  // Filtered products list
  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || prod.category === categoryFilter;
    const matchesStock =
      stockStatusFilter === 'all'
        ? true
        : stockStatusFilter === 'low'
        ? prod.is_low_stock || prod.is_out_of_stock
        : stockStatusFilter === 'healthy'
        ? !prod.is_low_stock && !prod.is_out_of_stock
        : true;

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Product Catalog & Stock Levels
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {currentLocationName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage product master catalog, track multi-location balances, and monitor replenishment safety levels.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600">
            <Warehouse className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Stock Statuses</option>
              <option value="healthy">In Stock (Healthy)</option>
              <option value="low">Low & Depleted Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">UoM</th>
                <th className="py-3 px-4 text-right">Available Stock</th>
                <th className="py-3 px-4 text-right">Min Threshold</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((prod) => (
                <tr
                  key={prod.id}
                  onClick={() => handleInspectProduct(prod)}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">{prod.sku}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{prod.name}</td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]">
                      {prod.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{prod.unit_of_measure}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {prod.total_stock}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">
                      {prod.unit_of_measure}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">
                    {prod.min_reorder_level} {prod.unit_of_measure}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {prod.is_out_of_stock ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        DEPLETED
                      </span>
                    ) : prod.is_low_stock ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                        LOW STOCK
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        OPTIMAL
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspectProduct(prod);
                      }}
                      className="px-2.5 py-1 rounded-lg text-indigo-600 hover:bg-indigo-50 font-medium inline-flex items-center text-xs"
                    >
                      Breakdown <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products matched your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Catalog Product"
        subtitle="Define master product specifications and optional opening stock"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Stainless Steel Fasteners"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU / Item Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FST-SS-001"
                value={newProductSku}
                onChange={(e) => setNewProductSku(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={newProductCategory}
                onChange={(e) => setNewProductCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              >
                <option value="Raw Materials">Raw Materials</option>
                <option value="Fasteners">Fasteners</option>
                <option value="Fluids & Chemicals">Fluids & Chemicals</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Packaging">Packaging</option>
                <option value="Safety & PPE">Safety & PPE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure (UoM)</label>
              <select
                value={newProductUom}
                onChange={(e) => setNewProductUom(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="liters">Liters</option>
                <option value="boxes">Boxes</option>
                <option value="meters">Meters</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Min Safety Threshold</label>
              <input
                type="number"
                min="0"
                value={newProductMinStock}
                onChange={(e) => setNewProductMinStock(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Optional Opening Stock */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center space-x-2">
              <Warehouse className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">Initial Opening Stock (Optional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Assign Location
                </label>
                <select
                  value={initialStockLocation}
                  onChange={(e) => setInitialStockLocation(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Initial Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={initialStockQty}
                  onChange={(e) => setInitialStockQty(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              Entering opening stock will automatically register an initial double-entry ledger receipt.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Product Detail & Location Breakdown Modal */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={selectedProduct.name}
          subtitle={`SKU: ${selectedProduct.sku} • Category: ${selectedProduct.category}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Top Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Total Stock</span>
                <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {selectedProduct.total_stock}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    {selectedProduct.unit_of_measure}
                  </span>
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Min Safety Level</span>
                <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {selectedProduct.min_reorder_level}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    {selectedProduct.unit_of_measure}
                  </span>
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Health Status</span>
                <div className="mt-1">
                  {selectedProduct.is_out_of_stock ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                      DEPLETED
                    </span>
                  ) : selectedProduct.is_low_stock ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                      LOW STOCK
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      HEALTHY
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Location Breakdown Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center">
                <Warehouse className="w-3.5 h-3.5 text-indigo-600 mr-1.5" />
                Physical Location Distribution
              </h4>
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-2.5 px-3">Location Name</th>
                      <th className="py-2.5 px-3 text-right">Quantity on Hand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedProduct.location_breakdown.map((loc) => (
                      <tr key={loc.location_id}>
                        <td className="py-2 px-3 font-medium text-slate-700">{loc.location_name}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {loc.quantity} {selectedProduct.unit_of_measure}
                        </td>
                      </tr>
                    ))}
                    {selectedProduct.location_breakdown.length === 0 && (
                      <tr>
                        <td colSpan={2} className="py-3 px-3 text-center text-slate-400">
                          No stock is currently allocated across locations.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mini Ledger Movement History */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center">
                <History className="w-3.5 h-3.5 text-indigo-600 mr-1.5" />
                Recent Movement History (Ledger)
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {productLedger.map((ledg) => (
                  <div
                    key={ledg.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-indigo-600">{ledg.document_code}</span>
                        <span className="font-semibold text-slate-700">{ledg.document_type}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {ledg.source_location_name || 'Vendor'} ➔ {ledg.destination_location_name || 'Customer'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-800">
                        {ledg.quantity} {ledg.unit_of_measure}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{formatDate(ledg.timestamp)}</span>
                    </div>
                  </div>
                ))}
                {productLedger.length === 0 && (
                  <p className="text-xs text-slate-400 py-3 text-center">No transaction history recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
