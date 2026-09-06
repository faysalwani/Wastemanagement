import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Coins, 
  CreditCard, 
  MapPin, 
  ArrowRight, 
  RotateCcw, 
  AlertTriangle,
  ShoppingBag
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Orders() {
  const { user, refreshUser } = useAuth() || {};
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/marketplace/orders/my', { params });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? If paid with Eco-Credits, your credits will be refunded to your wallet immediately.')) {
      return;
    }

    setCancellingId(orderId);
    setFeedback(null);

    try {
      const res = await api.patch(`/marketplace/orders/${orderId}/cancel`, {
        reason: 'Cancelled by citizen from orders dashboard',
      });

      if (res.data.success) {
        setFeedback({
          type: 'success',
          message: res.data.message || 'Order cancelled successfully.',
        });
        if (refreshUser) refreshUser();
        fetchOrders();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Failed to cancel order.',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">Delivered</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800">Out for Delivery</span>;
      case 'READY':
      case 'PROCESSING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">{status}</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">Confirmed</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            Order Fulfillment & Redemptions
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Orders & Redemptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review your reward delivery status, transaction receipts, and order histories.
          </p>
        </div>

        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Browse Marketplace</span>
        </Link>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        {['ALL', 'CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === st
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading your orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-16 rounded-3xl bg-white border border-slate-200 shadow-xs text-center space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No orders placed yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Use your Eco-Credits to redeem circular economy products in the marketplace.
          </p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs"
          >
            <span>Go to Marketplace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'PROCESSING';

            return (
              <div
                key={order._id}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left details */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-extrabold text-sm text-slate-900 font-mono">
                      #{order.orderNumber}
                    </span>
                    {getStatusBadge(order.status)}
                    <span className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="font-bold text-slate-900">{item.quantity}x</span>
                        <span>{item.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>
                      {order.shippingAddress?.street}, {order.shippingAddress?.wardName}, Srinagar
                    </span>
                  </div>

                  {order.cancellationReason && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-700 italic">
                      Cancelled: {order.cancellationReason}
                    </div>
                  )}
                </div>

                {/* Right payment & action */}
                <div className="flex flex-col md:items-end justify-between gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 flex-shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Paid With
                    </span>
                    {order.paymentMethod === 'ECO_CREDITS' ? (
                      <div className="text-base font-extrabold text-emerald-700 flex items-center gap-1 md:justify-end">
                        <Coins className="w-4 h-4 text-emerald-600" />
                        <span>{order.ecoCreditAmount} EC</span>
                      </div>
                    ) : (
                      <div className="text-base font-extrabold text-slate-800 flex items-center gap-1 md:justify-end">
                        <CreditCard className="w-4 h-4 text-slate-600" />
                        <span>₹{order.moneyAmount}</span>
                      </div>
                    )}
                  </div>

                  {canCancel && (
                    <button
                      type="button"
                      disabled={cancellingId === order._id}
                      onClick={() => handleCancelOrder(order._id)}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{cancellingId === order._id ? 'Cancelling...' : 'Cancel Order'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
