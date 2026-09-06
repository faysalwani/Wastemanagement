import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, 
  Coins, 
  TrendingUp, 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sprout, 
  AlertTriangle, 
  Repeat, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Wallet() {
  const { user } = useAuth() || {};
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('ALL');

  const fetchWallet = async (currentPage = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/credits/wallet?page=${currentPage}&limit=15`);
      if (res.data.success) {
        setWalletData(res.data.data);
        setPage(currentPage);
      }
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet(1);
  }, []);

  const getTierDetails = (tierName) => {
    switch (tierName) {
      case 'Green Pioneer':
        return {
          color: 'from-emerald-800 to-teal-900',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          text: 'Master Tier • Municipal Carbon Champion',
        };
      case 'Gold Champion':
        return {
          color: 'from-amber-700 to-yellow-900',
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          text: 'Gold Member • Dedicated Recycler',
        };
      case 'Silver Guardian':
        return {
          color: 'from-slate-700 to-slate-900',
          badge: 'bg-slate-200 text-slate-900 border-slate-300',
          text: 'Silver Member • Active Contributor',
        };
      default:
        return {
          color: 'from-amber-900 to-orange-950',
          badge: 'bg-amber-50 text-amber-900 border-amber-200',
          text: 'Bronze Member • Getting Started',
        };
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'COMPOSTING_ACTIVITY':
        return <Sprout className="w-4 h-4 text-emerald-600" />;
      case 'VERIFIED_DUMPING_REPORT':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'RESOURCE_EXCHANGE':
        return <Repeat className="w-4 h-4 text-sky-600" />;
      case 'MARKETPLACE_REDEMPTION':
        return <ShoppingBag className="w-4 h-4 text-purple-600" />;
      case 'REDEMPTION_REFUND':
        return <RotateCcw className="w-4 h-4 text-teal-600" />;
      default:
        return <Award className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatActivityName = (type) => {
    switch (type) {
      case 'COMPOSTING_ACTIVITY':
        return 'Household Composting';
      case 'VERIFIED_DUMPING_REPORT':
        return 'Verified Dumping Report';
      case 'RESOURCE_EXCHANGE':
        return 'P2P Resource Recovery';
      case 'MARKETPLACE_REDEMPTION':
        return 'Marketplace Redemption';
      case 'REDEMPTION_REFUND':
        return 'Order Refund';
      case 'SOURCE_SEGREGATION':
        return 'Source Segregation';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  const tier = walletData?.tier?.name || 'Bronze Steward';
  const tierStyle = getTierDetails(tier);
  const balance = walletData?.balance || user?.ecoCredits || 0;
  const metrics = walletData?.metrics || { totalEarned: 0, totalRedeemed: 0, totalTransactions: 0 };
  const transactions = walletData?.transactions?.data || [];
  const totalPages = walletData?.transactions?.pages || 1;

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'EARNED') return (tx.creditsEarned || tx.amount) > 0;
    if (filterType === 'REDEEMED') return (tx.creditsEarned || tx.amount) < 0;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Top Banner & Wallet Identity */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            <Coins className="w-3.5 h-3.5 text-emerald-600" />
            Verified Reward Currency
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Eco-Credit Digital Wallet
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Track verified circular economy earnings, monitor tier standing, and redeem rewards.
          </p>
        </div>

        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Redeem in Marketplace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Wallet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tier Card (1 Col) */}
        <div className={`p-8 rounded-3xl bg-gradient-to-br ${tierStyle.color} text-white shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden`}>
          {/* Subtle decorative background ring */}
          <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-200 tracking-wider uppercase">
                EcoCycle Citizen Pass
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-extrabold border border-white/20">
                {tier}
              </span>
            </div>

            <div className="pt-2">
              <span className="text-xs text-white/70 block">Available Reward Balance</span>
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-1 flex items-baseline gap-2">
                <span>{balance.toLocaleString()}</span>
                <span className="text-xl font-bold text-amber-300">EC</span>
              </div>
              <span className="text-xs text-white/80 mt-1 block">{tierStyle.text}</span>
            </div>
          </div>

          {/* Tier Progress Bar */}
          <div className="space-y-2 pt-4 border-t border-white/10">
            <div className="flex justify-between text-xs font-semibold text-white/80">
              <span>Tier Progress</span>
              <span>
                {balance >= 3000
                  ? 'Maximum Tier Reached'
                  : `${balance} / ${walletData?.tier?.nextTierThreshold || 1500} EC`}
              </span>
            </div>
            <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-amber-300 rounded-full transition-all duration-500"
                style={{ width: `${walletData?.tier?.progressPercent || 25}%` }}
              />
            </div>
            <p className="text-[11px] text-white/60">
              {balance >= 3000
                ? '⭐ You are a Green Pioneer with top municipal recognition.'
                : `Earn ${Math.max(0, (walletData?.tier?.nextTierThreshold || 500) - balance)} more EC to reach the next tier.`}
            </p>
          </div>
        </div>

        {/* Metric Summary Cards (2 Cols) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Earned</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-emerald-700">
                +{metrics.totalEarned.toLocaleString()} EC
              </div>
              <span className="text-xs text-slate-500 mt-1 block">From composting, reports, and exchange</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Redeemed</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-purple-700">
                {metrics.totalRedeemed.toLocaleString()} EC
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Converted into physical eco-products</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Transactions</span>
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900">
                {metrics.totalTransactions.toLocaleString()}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Immutable ledger records</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Protection</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm font-extrabold text-teal-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Idempotent Ledger Guard</span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Prevents duplicate rewards and replay exploits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-600" />
              <span>Immutable Credit Transaction Ledger</span>
            </h2>
            <p className="text-xs text-slate-500">
              Audit trail of every eco-credit earned, redeemed, or refunded.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200 self-start sm:self-auto text-xs font-bold">
            {['ALL', 'EARNED', 'REDEEMED'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterType(f)}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  filterType === f
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading ledger records...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Coins className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No transactions found</p>
            <p className="text-[11px] text-slate-400">
              Start by logging a composting batch or reporting open dumping to earn credits.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => {
              const amount = tx.creditsEarned || tx.amount || 0;
              const isPositive = amount > 0;

              return (
                <div key={tx._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors rounded-2xl px-3">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-slate-100 flex-shrink-0 mt-0.5">
                      {getActivityIcon(tx.activityType)}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">
                          {formatActivityName(tx.activityType)}
                        </span>
                        {tx.referenceId && (
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            Ref: {tx.referenceId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-normal">
                        {tx.description || 'Verified environmental action'}
                      </p>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(tx.timestamp || tx.createdAt).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right flex-shrink-0 pl-12 sm:pl-0">
                    <div className={`text-base font-extrabold ${isPositive ? 'text-emerald-700' : 'text-purple-700'}`}>
                      {isPositive ? `+${amount}` : amount} EC
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium block">
                      Balance: {tx.balanceAfter?.toLocaleString() || 0} EC
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-semibold">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => fetchWallet(page - 1)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => fetchWallet(page + 1)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
