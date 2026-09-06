import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User as UserIcon, 
  Award, 
  MapPin, 
  Mail, 
  Phone, 
  Shield, 
  LogOut, 
  Save, 
  CheckCircle,
  TrendingUp,
  Sparkles,
  History,
  Trophy,
  PieChart as PieIcon,
  Layers,
  ArrowUpRight,
  ShoppingBag,
  Wallet
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, logout, updateUserProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    wardName: user?.wardName || 'Lal Chowk',
    address: user?.address || '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Milestone 8 States: Ledger, Leaderboard, Diversion
  const [ledger, setLedger] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [diversionData, setDiversionData] = useState(null);
  const [personalDiversion, setPersonalDiversion] = useState(null);
  const [activeTab, setActiveTab] = useState('DIVERSION'); // DIVERSION, LEDGER, LEADERBOARD

  useEffect(() => {
    // Fetch Ledger
    api.get('/credits/ledger')
      .then((res) => setLedger(res.data.data || []))
      .catch(() => setLedger([]));

    // Fetch Leaderboard
    api.get('/credits/leaderboard')
      .then((res) => setLeaderboard(res.data.data || []))
      .catch(() => setLeaderboard([]));

    // Fetch Waste Diversion Metrics
    api.get('/analytics/diversion')
      .then((res) => setDiversionData(res.data.data))
      .catch(() => setDiversionData(null));

    // Fetch Personal Diversion Metrics
    api.get('/credits/my-diversion')
      .then((res) => setPersonalDiversion(res.data.data))
      .catch(() => setPersonalDiversion(null));
  }, []);

  // Compute tier progress
  const credits = user?.ecoCredits || 0;
  let nextTier = 'SILVER';
  let targetCredits = 100;
  let currentTierMin = 0;

  if (user?.tier === 'BRONZE') {
    nextTier = 'SILVER';
    targetCredits = 100;
    currentTierMin = 0;
  } else if (user?.tier === 'SILVER') {
    nextTier = 'GOLD';
    targetCredits = 250;
    currentTierMin = 100;
  } else if (user?.tier === 'GOLD') {
    nextTier = 'ECO_CHAMPION';
    targetCredits = 500;
    currentTierMin = 250;
  } else {
    nextTier = 'MAX';
    targetCredits = 500;
    currentTierMin = 500;
  }

  const progressPercent = Math.min(
    100,
    Math.round(((credits - currentTierMin) / (targetCredits - currentTierMin || 1)) * 100)
  );

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const res = await updateUserProfile(formData);
    if (res.success) {
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-eco-600 to-emerald-400 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-eco-500/20">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                user?.role === 'ADMIN'
                  ? 'bg-indigo-100 text-indigo-800'
                  : user?.role === 'DRIVER'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold border border-slate-200 hover:border-rose-200 transition-colors self-start sm:self-center"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          <CheckCircle className="w-4 h-4" />
          <span>Profile updated successfully.</span>
        </div>
      )}

      {/* Grid: Eco-Credits Card & Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Eco Credits Summary Card */}
        <div className="md:col-span-1 p-6 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl text-white shadow-lg shadow-eco-600/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Eco-Credits Ledger
              </span>
              <Award className="w-5 h-5 text-amber-300" />
            </div>

            <div className="mt-6">
              <div className="text-4xl font-extrabold tracking-tight">
                {credits} <span className="text-sm font-medium text-emerald-200">pts</span>
              </div>
              <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold text-white">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Tier: {user?.tier || 'BRONZE'}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-emerald-500/40">
            {nextTier !== 'MAX' ? (
              <>
                <div className="flex justify-between text-xs text-emerald-100 mb-2">
                  <span>Progress to {nextTier}</span>
                  <span className="font-bold">{credits} / {targetCredits}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-emerald-900/40 overflow-hidden">
                  <div 
                    className="h-full bg-amber-300 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </>
            ) : (
              <div className="text-xs text-emerald-100 font-semibold text-center">
                🏆 Top Tier Achieved: Eco-Champion
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-emerald-500/30 flex items-center gap-2">
              <Link
                to="/wallet"
                className="flex-1 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold text-center transition-colors flex items-center justify-center gap-1"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>My Wallet</span>
              </Link>
              <Link
                to="/marketplace"
                className="flex-1 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold text-center transition-colors flex items-center justify-center gap-1 shadow-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Redeem</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Personal & Location Details */}
        <div className="md:col-span-2 p-6 bg-white rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-eco-600" />
              <span>Personal & Location Details</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-semibold text-eco-600 hover:text-eco-700"
            >
              {isEditing ? 'Cancel' : 'Edit Details'}
            </button>
          </div>

          {!isEditing ? (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <span className="block text-slate-400 font-medium">Full Name</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">{user?.name}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Email Address</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">{user?.email}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Contact Phone</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">{user?.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Srinagar Ward / Locality</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">{user?.wardName || 'Lal Chowk'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-slate-400 font-medium">Street Address</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">{user?.address || 'Srinagar, J&K'}</span>
              </div>
              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-eco-600 flex-shrink-0" />
                <span>
                  Coordinates: <strong>{user?.location?.coordinates?.[0] ?? 74.7973}</strong>° E, <strong>{user?.location?.coordinates?.[1] ?? 34.0837}</strong>° N
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-eco-500/20 focus:border-eco-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Name</label>
                <input
                  type="text"
                  value={formData.wardName}
                  onChange={(e) => setFormData({ ...formData, wardName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-eco-600 hover:bg-eco-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Tabs: Diversion Analytics, Transaction Ledger, Leaderboard */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/60 p-2 gap-2">
          <button
            onClick={() => setActiveTab('DIVERSION')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'DIVERSION'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-4 h-4 text-eco-600" />
            <span>Waste Diversion Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'LEDGER'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-blue-600" />
            <span>Transaction Ledger ({ledger.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('LEADERBOARD')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'LEADERBOARD'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Srinagar Leaderboard</span>
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: Waste Diversion Analytics */}
          {activeTab === 'DIVERSION' && (
            <div className="space-y-6">
              {/* Personal Diversion Rate Highlight */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
                    Your Personal Household Diversion Efficiency
                  </span>
                  <div className="text-2xl font-extrabold mt-1">
                    {personalDiversion?.diversionRatePercent ?? 0}% Diverted from Landfill
                  </div>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Total: {personalDiversion?.totalDivertedKg ?? 0} kg diverted ({personalDiversion?.compostedKg ?? 0} kg composted + {personalDiversion?.exchangedKg ?? 0} kg exchanged).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/wallet"
                    className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors"
                  >
                    View Wallet
                  </Link>
                  <Link
                    to="/marketplace"
                    className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold transition-colors shadow-xs"
                  >
                    Redeem EC
                  </Link>
                </div>
              </div>

              {/* Formula & Overall Score */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Community Diversion Rate
                  </span>
                  <div className="mt-2 text-3xl font-extrabold text-emerald-950">
                    {diversionData?.diversionRatePercent ?? 72.4}%
                  </div>
                  <span className="text-[11px] text-emerald-700 mt-1">
                    (Reused + Composted + Recycled) / Total Waste
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Total Diverted Mass
                  </span>
                  <div className="mt-2 text-3xl font-extrabold text-slate-900">
                    {diversionData?.totalDivertedKg ?? 350} kg
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1">
                    Saved from municipal dumping grounds
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Residual Waste
                  </span>
                  <div className="mt-2 text-3xl font-extrabold text-slate-900">
                    {diversionData?.breakdownKg?.residual ?? 150} kg
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1">
                    Controlled sanitary landfilling stream
                  </span>
                </div>
              </div>

              {/* Data Transparency & Source Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{diversionData?.dataSources?.measuredData?.badge}</span>
                    <span className="text-emerald-700 font-extrabold">
                      {diversionData?.dataSources?.measuredData?.measuredWeightKg} kg
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {diversionData?.dataSources?.measuredData?.source} ({diversionData?.dataSources?.measuredData?.totalSmartBins} Active Bins)
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{diversionData?.dataSources?.citizenEstimates?.badge}</span>
                    <span className="text-blue-700 font-extrabold">
                      {diversionData?.dataSources?.citizenEstimates?.estimatedWeightKg} kg
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {diversionData?.dataSources?.citizenEstimates?.source}
                  </p>
                </div>
              </div>

              {/* Breakdown Bars */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700">Mass Breakdown by Recovery Stream</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <span className="text-blue-700 font-medium">Reused / Swapped</span>
                    <div className="text-lg font-bold text-blue-950 mt-0.5">
                      {diversionData?.breakdownKg?.reused} kg
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-lime-50 border border-lime-200">
                    <span className="text-lime-700 font-medium">Composted</span>
                    <div className="text-lg font-bold text-lime-950 mt-0.5">
                      {diversionData?.breakdownKg?.composted} kg
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-amber-700 font-medium">Recycled Material</span>
                    <div className="text-lg font-bold text-amber-950 mt-0.5">
                      {diversionData?.breakdownKg?.recycled} kg
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-300">
                    <span className="text-slate-600 font-medium">Residual Waste</span>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">
                      {diversionData?.breakdownKg?.residual} kg
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Immutable Transaction Ledger */}
          {activeTab === 'LEDGER' && (
            <div className="space-y-4">
              {ledger.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No eco-credit transactions recorded yet. Complete a waste scan or resource exchange to earn credits!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Activity</th>
                        <th className="py-2.5 px-3">Credits</th>
                        <th className="py-2.5 px-3">Balance After</th>
                        <th className="py-2.5 px-3">Idempotency Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledger.map((tx) => (
                        <tr key={tx._id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-slate-500">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {tx.activityType.replace(/_/g, ' ')}
                            <div className="text-[10px] text-slate-400 font-normal">{tx.description}</div>
                          </td>
                          <td className="py-2.5 px-3 font-extrabold text-emerald-600">
                            +{tx.creditsEarned}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-700">
                            {tx.balanceAfter} pts
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 truncate max-w-xs">
                            {tx.idempotencyKey}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Leaderboard */}
          {activeTab === 'LEADERBOARD' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 mb-2">
                Top citizens leading source segregation and circular resource recovery across Srinagar:
              </div>
              <div className="space-y-2">
                {leaderboard.map((u) => {
                  const isCurrentUser = user && u.userId === user.id;
                  return (
                    <div
                      key={u.userId}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isCurrentUser
                          ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          u.rank === 1
                            ? 'bg-amber-100 text-amber-800'
                            : u.rank === 2
                            ? 'bg-slate-200 text-slate-700'
                            : u.rank === 3
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.rank === 1 ? '🥇' : u.rank === 2 ? '🥈' : u.rank === 3 ? '🥉' : u.rank}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.displayName}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">{u.wardName}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-extrabold text-emerald-700">
                          {u.ecoCredits} <span className="text-[10px] font-medium">pts</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {u.tier}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
