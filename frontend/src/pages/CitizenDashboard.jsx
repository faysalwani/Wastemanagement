import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Recycle, 
  Camera, 
  Repeat, 
  Sprout, 
  Truck, 
  AlertTriangle, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  Clock, 
  Sparkles,
  Layers,
  ChevronRight,
  LogOut,
  User,
  Activity,
  Calendar,
  AlertCircle,
  ShoppingBag,
  Package,
  Wallet
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CitizenDashboard() {
  const { user, logout } = useAuth() || {};
  const [summary, setSummary] = useState(null);
  const [myDiversion, setMyDiversion] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardSummary = async () => {
    setLoading(true);
    try {
      const [sumRes, divRes] = await Promise.all([
        api.get('/credits/citizen-summary').catch(() => ({ data: { success: false } })),
        api.get('/credits/my-diversion').catch(() => ({ data: { success: false } })),
      ]);

      if (sumRes.data.success) {
        setSummary(sumRes.data.data);
      }
      if (divRes.data.success) {
        setMyDiversion(divRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load citizen summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  const citizenUser = summary?.user || user;
  const personalDivertedKg = myDiversion?.totalDivertedKg ?? summary?.personalDivertedKg ?? 0;
  const personalDiversionRate = myDiversion?.diversionRatePercent ?? 0;
  const activeListingsCount = summary?.activeListingsCount || 0;
  const wardSmartBins = summary?.wardSmartBins || [];
  const recentTransactions = summary?.recentTransactions || [];

  const quickActions = [
    {
      title: 'AI Waste Scanner',
      desc: 'Instant visual classification with MobileNetV3 and recommended disposal pathway.',
      link: '/scan',
      icon: Camera,
      color: 'bg-emerald-500',
      badge: '+10 Pts',
    },
    {
      title: 'Composting Assistant',
      desc: 'Scientific organic waste calculator, C:N balance, and batch lifecycle tracking.',
      link: '/compost',
      icon: Sprout,
      color: 'bg-lime-600',
      badge: '+20 Pts',
    },
    {
      title: 'Rewards Marketplace',
      desc: 'Redeem earned Eco-Credits for home composting aerators, bins, and jute bags.',
      link: '/marketplace',
      icon: ShoppingBag,
      color: 'bg-emerald-700',
      badge: 'Redeem EC',
    },
    {
      title: 'Eco-Credits Wallet',
      desc: 'View your tier ranking, points balance, and auditable transaction ledger.',
      link: '/wallet',
      icon: Wallet,
      color: 'bg-amber-600',
      badge: 'My Wallet',
    },
    {
      title: 'P2P Resource Exchange',
      desc: 'Give away clean cardboard cartons, bottles, and organic waste to neighbours.',
      link: '/exchange',
      icon: Repeat,
      color: 'bg-blue-600',
      badge: '+25 Pts',
    },
    {
      title: 'Truck Proximity Radar',
      desc: 'Live collection timetable and 500m incoming vehicle radar.',
      link: '/collection',
      icon: Truck,
      color: 'bg-amber-500',
      badge: 'Live Radar',
    },
    {
      title: 'Verified Recyclers',
      desc: 'Locate certified scrap depots and recycling drop-off stations in Srinagar.',
      link: '/recyclers',
      icon: Recycle,
      color: 'bg-teal-600',
      badge: 'Directory',
    },
    {
      title: 'Report Illegal Dumping',
      desc: 'Submit geotagged photos to municipal clearance squads.',
      link: '/reports',
      icon: AlertTriangle,
      color: 'bg-rose-500',
      badge: '+50 Pts',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-200">
            <MapPin className="w-3.5 h-3.5" />
            <span>Ward: {citizenUser?.wardName || 'Srinagar'}</span>
            <span>•</span>
            <span className="capitalize">{citizenUser?.accountStatus || 'Active'} Citizen</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {citizenUser?.name || 'Citizen'}!
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
            Decentralized resource recovery, household composting, and circular waste diversion portal for Srinagar.
          </p>
        </div>

        {/* Profile Shortcuts & Eco-Credits Pill */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Link
            to="/wallet"
            className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all backdrop-blur-xs border border-white/20 flex items-center gap-4 flex-shrink-0 group cursor-pointer"
            title="Open Eco-Credits Wallet"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-extrabold shadow-md group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-emerald-200 flex items-center gap-1">
                <span>Eco-Credits Balance</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="text-2xl font-extrabold text-white">{citizenUser?.ecoCredits || 0} pts</div>
              <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                {citizenUser?.tier || 'BRONZE'} TIER • OPEN WALLET
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="View Profile"
            >
              <User className="w-5 h-5" />
            </Link>
            <button
              onClick={logout}
              className="p-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white transition-colors"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Personal Waste Diversion Banner */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Personal Waste Diversion Efficiency
            </span>
            <span className="text-sm font-extrabold text-emerald-700">
              {personalDiversionRate}% Diverted
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(personalDiversionRate, 0))}%` }}
            ></div>
          </div>
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 pt-1">
            <span>
              Total Household Waste Generated: <strong>{myDiversion?.totalGeneratedKg || personalDivertedKg || 0} kg</strong>
            </span>
            <span>
              Diverted from Landfill: <strong className="text-emerald-700">{personalDivertedKg} kg</strong> ({myDiversion?.compostedKg || 0}kg composted + {myDiversion?.exchangedKg || 0}kg reused)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to="/marketplace"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Rewards Store</span>
          </Link>
          <Link
            to="/recyclers"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Recycle className="w-4 h-4 text-emerald-600" />
            <span>Recycling Centers</span>
          </Link>
        </div>
      </div>

      {/* Real KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Personal Diverted Waste
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
            {personalDivertedKg > 0 ? `${personalDivertedKg} kg` : '0 kg'}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {personalDivertedKg > 0 ? 'Composted & Exchanged' : 'No waste-diversion activity recorded yet'}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Eco-Credits Tier
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
            {citizenUser?.tier || 'BRONZE'}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {citizenUser?.ecoCredits || 0} total points earned
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Exchange Listings
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">
            {activeListingsCount}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {activeListingsCount > 0 ? 'Available for neighbor pickup' : 'No active listings'}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Ward Smart Bins
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600">
            {wardSmartBins.length}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {wardSmartBins.length > 0 ? `In ${citizenUser?.wardName || 'Ward'}` : 'No smart bins in this ward'}
          </span>
        </div>
      </div>

      {/* Citizen Action Hub */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Citizen Action Hub</h2>
            <p className="text-xs text-slate-500">Pick an environmental activity to divert waste and earn verified Eco-Credits.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.link}
                className="group p-5 bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-2xl ${action.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                    {action.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {action.desc}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 pt-2 border-t border-slate-100">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Traceable Eco-Credits Recent Ledger */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Traceable Eco-Credit Activity Ledger</span>
            </h3>
            <p className="text-[11px] text-slate-500">Every earned credit is auditable through backend transaction keys.</p>
          </div>
          <Link
            to="/profile"
            className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>Full Ledger</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Award className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No Eco-Credit activity yet.</p>
            <p className="text-[11px] text-slate-400">Scan waste, start a compost batch, or report dumping to earn points.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTransactions.map((tx) => (
              <div key={tx._id} className="py-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">
                    {tx.description || tx.activityType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(tx.timestamp || tx.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-emerald-600 text-sm">+{tx.creditsEarned} pts</span>
                  <span className="text-[10px] text-slate-400 block">Balance: {tx.balanceAfter} pts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ward Smart Bins Radar Snapshot */}
      {wardSmartBins.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Recycle className="w-4 h-4 text-purple-600" />
                <span>Smart Bins in {citizenUser?.wardName || 'Your Ward'}</span>
              </h3>
              <p className="text-[11px] text-slate-500">Live fill percentage and capacity monitor.</p>
            </div>
            <Link
              to="/smart-bins"
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>Explore Map</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {wardSmartBins.map((bin) => (
              <div key={bin.binId} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900">{bin.binId}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                    bin.currentFillPercent >= 80
                      ? 'bg-rose-100 text-rose-800'
                      : bin.currentFillPercent >= 50
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {bin.currentFillPercent}% Full
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800">{bin.name}</div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full ${bin.currentFillPercent >= 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${bin.currentFillPercent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
