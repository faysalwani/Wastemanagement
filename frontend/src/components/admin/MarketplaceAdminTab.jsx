import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Package, 
  Plus, 
  CheckCircle2, 
  Truck, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Search, 
  X, 
  Clock, 
  Award,
  RefreshCw,
  Eye,
  Check,
  Filter
} from 'lucide-react';
import api from '../../services/api';

const PRODUCT_CATEGORIES = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'DUSTBINS', label: 'Dustbins & Baskets' },
  { id: 'COMPOSTING_KITS', label: 'Composting Kits' },
  { id: 'REUSABLE_BAGS', label: 'Reusable Jute Bags' },
  { id: 'SEGREGATION_BINS', label: 'Color-Coded Bins' },
  { id: 'RECYCLING_ACCESSORIES', label: 'Recycling Accessories' },
  { id: 'GARDENING', label: 'Organic Gardening' },
  { id: 'ECO_HOUSEHOLD', label: 'Eco-Household' },
];

const ORDER_STATUS_PROGRESS = [
  'CONFIRMED',
  'PROCESSING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export default function MarketplaceAdminTab() {
  const [activeSubView, setActiveSubView] = useState('CATALOG'); // 'CATALOG' or 'ORDERS'
  
  // Products state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: 'SEGREGATION_BINS',
    moneyPrice: 0,
    ecoCreditPrice: 100,
    stock: 50,
    status: 'ACTIVE',
    vendor: 'EcoCycle Municipal Cooperative',
    imageUrl: '',
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Fetch Products
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      const res = await api.get('/marketplace/products', { params });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch marketplace products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch Orders
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const params = {};
      if (orderStatusFilter !== 'ALL') params.status = orderStatusFilter;
      const res = await api.get('/marketplace/orders', { params });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    if (activeSubView === 'ORDERS') {
      fetchOrders();
    }
  }, [activeSubView, orderStatusFilter]);

  const showNotification = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Handle Product Form Submit (Create or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        moneyPrice: Number(productForm.moneyPrice),
        ecoCreditPrice: Number(productForm.ecoCreditPrice),
        stock: Number(productForm.stock),
        status: productForm.status,
        vendor: productForm.vendor,
        images: productForm.imageUrl ? [productForm.imageUrl] : [],
      };

      if (editingProduct) {
        await api.patch(`/marketplace/products/${editingProduct._id}`, payload);
        showNotification('Product updated successfully!');
      } else {
        await api.post('/marketplace/products', payload);
        showNotification('New product added to rewards catalog!');
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      category: 'SEGREGATION_BINS',
      moneyPrice: 0,
      ecoCreditPrice: 100,
      stock: 50,
      status: 'ACTIVE',
      vendor: 'EcoCycle Municipal Cooperative',
      imageUrl: '',
    });
    setIsProductModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description,
      category: p.category,
      moneyPrice: p.moneyPrice,
      ecoCreditPrice: p.ecoCreditPrice,
      stock: p.stock,
      status: p.status,
      vendor: p.vendor || 'EcoCycle Municipal Cooperative',
      imageUrl: p.images && p.images[0] ? p.images[0] : '',
    });
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate/delete "${name}"?`)) return;
    try {
      await api.delete(`/marketplace/products/${id}`);
      showNotification(`Product "${name}" deleted.`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.patch(`/marketplace/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        showNotification(`Order marked as ${newStatus}`);
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(res.data.data);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <span>EcoCycle Rewards Store & Order Redemptions</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage sustainable hardware catalog, inventory stocks, and fulfill citizen redemptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveSubView('CATALOG')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeSubView === 'CATALOG'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catalog & Stock ({products.length})
            </button>
            <button
              onClick={() => setActiveSubView('ORDERS')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeSubView === 'ORDERS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Redemptions & Orders ({orders.length})
            </button>
          </div>

          {activeSubView === 'CATALOG' && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* ======================= CATALOG SUB-VIEW ======================= */}
      {activeSubView === 'CATALOG' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search catalog by title, keyword or vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 placeholder:text-slate-400 text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 outline-none"
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Product Cards Grid */}
          {productsLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
              Loading marketplace catalog...
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
              No products found matching the criteria. Click "Add Product" to populate the catalog.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div 
                  key={p._id} 
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {p.category.replace(/_/g, ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        p.stock > 10 
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.stock > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {p.stock > 0 ? `${p.stock} in stock` : 'Out of Stock'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{p.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Eco-Credits</span>
                        <div className="font-extrabold text-emerald-600 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{p.ecoCreditPrice} EC</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-semibold block">Cash Value</span>
                        <div className="font-extrabold text-slate-700">₹{p.moneyPrice}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Edit Product"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p._id, p.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================= ORDERS & REDEMPTIONS SUB-VIEW ======================= */}
      {activeSubView === 'ORDERS' && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600">Filter Status:</span>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 outline-none"
            >
              <option value="ALL">All Orders</option>
              {ORDER_STATUS_PROGRESS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {ordersLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
              Loading orders and redemptions...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
              No orders or citizen redemptions found.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div 
                  key={ord._id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 font-mono">
                        {ord.orderNumber}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        ord.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-800'
                          : ord.status === 'OUT_FOR_DELIVERY'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.status}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700">
                      <strong>Recipient:</strong> {ord.userId?.name || 'Citizen'} ({ord.shippingAddress?.contactPhone})
                    </div>

                    <div className="text-xs text-slate-500">
                      <strong>Delivery to:</strong> {ord.shippingAddress?.street}, {ord.shippingAddress?.wardName}, {ord.shippingAddress?.city}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {ord.items?.map((item, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {item.name} × {item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Payment & Action */}
                  <div className="flex flex-col sm:flex-row items-end md:items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Payment</span>
                      <span className="text-xs font-bold text-slate-900">
                        {ord.paymentMethod === 'ECO_CREDITS' 
                          ? `${ord.ecoCreditAmount} EC`
                          : `₹${ord.moneyAmount}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord._id, e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800 outline-none focus:border-emerald-500"
                      >
                        {ORDER_STATUS_PROGRESS.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================= ADD / EDIT PRODUCT MODAL ======================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>{editingProduct ? 'Edit Catalog Product' : 'Add New Rewards Product'}</span>
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Home Compost Aerator Spiral"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-semibold text-slate-800"
                >
                  {PRODUCT_CATEGORIES.filter(c => c.id !== 'ALL').map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Describe material, benefits, or usage instructions..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Eco-Credit Cost (EC)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.ecoCreditPrice}
                    onChange={(e) => setProductForm({ ...productForm, ecoCreditPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cash Price (INR ₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.moneyPrice}
                    onChange={(e) => setProductForm({ ...productForm, moneyPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catalog Status</label>
                  <select
                    value={productForm.status}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-semibold text-slate-800"
                  >
                    <option value="ACTIVE">Active (Available)</option>
                    <option value="INACTIVE">Inactive (Hidden)</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Vendor / Partner</label>
                <input
                  type="text"
                  value={productForm.vendor}
                  onChange={(e) => setProductForm({ ...productForm, vendor: e.target.value })}
                  placeholder="EcoCycle Municipal Cooperative"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  {saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
