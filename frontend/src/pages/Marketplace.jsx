import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Coins, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  Sparkles, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  Package, 
  X,
  CreditCard,
  Layers,
  Award
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'ALL', label: 'All Rewards' },
  { id: 'SEGREGATION_BINS', label: 'Segregation Bins' },
  { id: 'COMPOSTING_KITS', label: 'Composting Kits' },
  { id: 'REUSABLE_BAGS', label: 'Reusable Bags' },
  { id: 'ECO_HOUSEHOLD', label: 'Eco Household' },
  { id: 'GARDENING', label: 'Gardening & Aeration' },
  { id: 'DUSTBINS', label: 'Smart & Regular Bins' },
];

export default function Marketplace() {
  const { user, isAuthenticated, refreshUser } = useAuth() || {};
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Checkout Modal State
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('ECO_CREDITS');
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    wardName: user?.wardName || 'Rajbagh',
    contactPhone: user?.phone || '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [orderError, setOrderError] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (inStockOnly) params.inStockOnly = 'true';

      const res = await api.get('/marketplace/products', { params });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, inStockOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const openCheckout = (product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setCheckoutProduct(product);
    setQuantity(1);
    setPaymentMethod('ECO_CREDITS');
    setOrderError(null);
    setOrderSuccess(null);
    setShippingAddress({
      street: user?.address || '',
      wardName: user?.wardName || 'Rajbagh',
      contactPhone: user?.phone || '',
      notes: '',
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!checkoutProduct) return;

    if (!shippingAddress.street || !shippingAddress.wardName || !shippingAddress.contactPhone) {
      setOrderError('Please provide street address, Srinagar ward, and phone number.');
      return;
    }

    setSubmitting(true);
    setOrderError(null);

    try {
      const res = await api.post('/marketplace/orders', {
        productId: checkoutProduct._id,
        quantity,
        paymentMethod,
        shippingAddress,
      });

      if (res.data.success) {
        setOrderSuccess(res.data.data);
        if (refreshUser) refreshUser();
        fetchProducts();
      }
    } catch (err) {
      setOrderError(err.response?.data?.error?.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const userCredits = user?.ecoCredits || 0;
  const totalCreditsRequired = checkoutProduct ? checkoutProduct.ecoCreditPrice * quantity : 0;
  const totalMoneyRequired = checkoutProduct ? checkoutProduct.moneyPrice * quantity : 0;
  const hasSufficientCredits = userCredits >= totalCreditsRequired;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#21834A] rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold text-[#E5F4E8]">
            <Award className="w-3.5 h-3.5 text-white" />
            Clear Waste Rewards Store
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Redeem Your Points for Home Recycling & Composting Gear
          </h1>
          <p className="text-sm text-[#E5F4E8] font-normal leading-relaxed">
            Use points earned from composting, sharing reusable materials, and reporting waste piles—or purchase directly.
          </p>
        </div>

        {isAuthenticated && (
          <div className="p-4 rounded-2xl bg-white/15 border border-white/25 text-left md:text-right flex-shrink-0">
            <span className="text-xs font-bold text-[#E5F4E8] uppercase tracking-wider block">
              Your Available Balance
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
              {userCredits.toLocaleString()} <span className="text-base text-[#E5F4E8]">pts</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs font-bold text-white">
              <Link to="/wallet" className="underline hover:text-[#E5F4E8]">
                Points History
              </Link>
              <span>•</span>
              <Link to="/orders" className="underline hover:text-[#E5F4E8]">
                My Orders
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#21834A] text-white shadow-xs'
                  : 'bg-white text-[#526356] hover:bg-[#E5F4E8]/50 border border-[#DCE6DF]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Stock Filter */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search rewards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DCE6DF] text-xs focus:border-[#21834A] bg-white"
            />
            <Search className="w-4 h-4 text-[#526356] absolute left-3 top-2.5" />
          </form>

          <button
            type="button"
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
              inStockOnly
                ? 'bg-[#E5F4E8] border-[#21834A] text-[#1A693B]'
                : 'bg-white border-[#DCE6DF] text-[#526356]'
            }`}
          >
            In Stock Only
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="py-24 text-center text-sm text-[#526356]">Loading rewards store...</div>
      ) : products.length === 0 ? (
        <div className="p-16 rounded-3xl bg-white border border-[#DCE6DF] shadow-xs text-center space-y-3">
          <ShoppingBag className="w-10 h-10 text-[#526356]/50 mx-auto" />
          <h3 className="text-base font-bold text-[#26372B]">No matching rewards found</h3>
          <p className="text-xs text-[#526356] max-w-sm mx-auto">
            Try choosing another category or clearing your search filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const isOutOfStock = product.stock === 0;
            const hasPoints = product.ecoCreditPrice > 0;
            const hasMoney = product.moneyPrice > 0;
            const paymentTag =
              hasPoints && hasMoney
                ? 'Points or Cash'
                : hasPoints
                ? 'Points Only'
                : 'Cash Only';

            return (
              <div
                key={product._id}
                className="bg-white rounded-3xl border border-[#DCE6DF] shadow-xs hover:border-[#21834A]/50 transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  {/* Category, Payment Option & Stock Tag */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-[#F8FAF8] border border-[#DCE6DF] text-[#26372B] text-[10px] font-bold uppercase">
                        {product.category.replace(/_/g, ' ')}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-[#E5F4E8] text-[#1A693B] text-[10px] font-bold">
                        {paymentTag}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        isOutOfStock
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-[#E5F4E8] text-[#1A693B]'
                      }`}
                    >
                      {isOutOfStock ? 'Out of Stock' : `${product.stock} In Stock`}
                    </span>
                  </div>

                  {/* Product Title & Details */}
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-[#26372B] leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#526356] leading-relaxed font-normal line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  {product.vendor && (
                    <div className="text-xs text-[#526356]">
                      Partner: <span className="text-[#26372B] font-semibold">{product.vendor}</span>
                    </div>
                  )}
                </div>

                {/* Pricing & CTA Footer */}
                <div className="p-6 pt-0 space-y-4">
                  <div className="p-3.5 rounded-2xl bg-[#F8FAF8] border border-[#DCE6DF] flex items-center justify-between">
                    {hasPoints && (
                      <div>
                        <span className="text-[10px] font-bold text-[#526356] uppercase tracking-wider block">
                          Redeem with Points
                        </span>
                        <div className="text-lg font-extrabold text-[#21834A] flex items-baseline gap-1">
                          <span>{product.ecoCreditPrice.toLocaleString()}</span>
                          <span className="text-xs font-bold">pts</span>
                        </div>
                      </div>
                    )}

                    {hasMoney && (
                      <div className={hasPoints ? 'text-right' : 'text-left'}>
                        <span className="text-[10px] font-bold text-[#526356] uppercase tracking-wider block">
                          Or Buy with Cash
                        </span>
                        <div className="text-base font-extrabold text-[#26372B]">
                          ₹{product.moneyPrice.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => openCheckout(product)}
                    className="w-full py-3 px-4 rounded-xl bg-[#21834A] hover:bg-[#1A693B] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isOutOfStock ? 'Out of Stock' : 'Redeem or Buy'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                  Reward Checkout
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {checkoutProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {orderSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-emerald-900">
                      Order Confirmed!
                    </h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      Order #{orderSuccess.orderNumber} has been logged in the municipal delivery queue.
                    </p>
                  </div>

                  <div className="pt-2 flex gap-3 justify-center">
                    <Link
                      to="/orders"
                      className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 shadow-xs"
                    >
                      View My Orders
                    </Link>
                    <button
                      type="button"
                      onClick={() => setCheckoutProduct(null)}
                      className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePlaceOrder} className="space-y-5">
                  {orderError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{orderError}</span>
                    </div>
                  )}

                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-bold text-slate-700">Quantity</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-extrabold text-slate-900 w-6 text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        disabled={quantity >= checkoutProduct.stock}
                        onClick={() => setQuantity(Math.min(checkoutProduct.stock, quantity + 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('ECO_CREDITS')}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          paymentMethod === 'ECO_CREDITS'
                            ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Coins className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-extrabold text-emerald-800">
                            {totalCreditsRequired} EC
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-900 block mt-1">
                          Redeem Eco-Credits
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Balance: {userCredits} EC
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('MONEY')}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          paymentMethod === 'MONEY'
                            ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <CreditCard className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-extrabold">₹{totalMoneyRequired}</span>
                        </div>
                        <span className={`text-xs font-bold block mt-1 ${paymentMethod === 'MONEY' ? 'text-white' : 'text-slate-900'}`}>
                          Cash on Delivery
                        </span>
                        <span className={`text-[10px] block ${paymentMethod === 'MONEY' ? 'text-slate-300' : 'text-slate-500'}`}>
                          Standard Currency
                        </span>
                      </button>
                    </div>

                    {paymentMethod === 'ECO_CREDITS' && !hasSufficientCredits && (
                      <p className="text-[11px] text-rose-600 font-semibold pt-1">
                        ⚠️ Insufficient Eco-Credits. You need {totalCreditsRequired - userCredits} more EC to redeem this item.
                      </p>
                    )}
                  </div>

                  {/* Delivery Address Fields */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700">
                      Delivery Details
                    </label>

                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Street Address, House No, Locality *"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Srinagar Ward *"
                          value={shippingAddress.wardName}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, wardName: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                        />
                      </div>
                      <div>
                        <input
                          type="tel"
                          required
                          placeholder="Contact Phone *"
                          value={shippingAddress.contactPhone}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, contactPhone: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Delivery notes or landmark (optional)..."
                        value={shippingAddress.notes}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, notes: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || (paymentMethod === 'ECO_CREDITS' && !hasSufficientCredits)}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {submitting
                        ? 'Processing Redemption...'
                        : paymentMethod === 'ECO_CREDITS'
                        ? `Confirm Redemption (${totalCreditsRequired} EC)`
                        : `Place Order (₹${totalMoneyRequired})`}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
