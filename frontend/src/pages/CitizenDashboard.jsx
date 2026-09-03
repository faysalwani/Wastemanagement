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
  Bell, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  Clock, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [diversion, setDiversion] = useState(null);
  const [recentListings, setRecentListings] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [wardBins, setWardBins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCitizenData = async () => {
      try {
        const [divRes, listRes, repRes, binRes] = await Promise.all([
          api.get('/analytics/diversion'),
          api.get('/exchange/listings'),
          api.get('/reports'),
          api.get('/iot/bins'),
        ]);

        if (divRes.data.success) setDiversion(divRes.data.data);
        if (listRes.data.success) setRecentListings(listRes.data.data.slice(0, 3));
        if (repRes.data.success) {
          // Filter reports submitted by current user or in current ward
          const userWardReports = repRes.data.data.filter(
            (r) => r.wardName === user?.wardName
          );
          setMyReports(userWardReports.slice(0, 3));
        }
        if (binRes.data.success) {
          const binsInWard = binRes.data.data.filter(
            (b) => b.wardName === user?.wardName
          );
          setWardBins(binsInWard);
        }
      } catch (err) {
        console.warn('Error fetching citizen telemetry:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCitizenData();
  }, [user]);

  const quickActions = [
    {
      title: 'AI Waste Scanner',
      desc: 'Instant visual classification with MobileNetV3 & circular disposal advice.',
      link: '/scan',
      icon: Camera,
      color: 'bg-emerald-500',
      badge: '+10 Pts',
    },
    {
      title: 'Composting Assistant',
      desc: 'Scientific C:N calculator (Greens vs Browns) for kitchen bio-waste.',
      link: '/compost',
      icon: Sprout,
      color: 'bg-lime-600',
      badge: 'Organic',
    },
    {
      title: 'P2P Resource Exchange',
      desc: 'Trade reusable cartons, glass bottles, and organic waste with neighbors.',
      link: '/exchange',
      icon: Repeat,
      color: 'bg-blue-600',
      badge: '+25 Pts',
    },
    {
      title: 'Report Illegal Dumping',
      desc: 'Submit geotagged photos to municipal clearance squads.',
      link: '/reports',
      icon: AlertTriangle,
      color: 'bg-rose-500',
      badge: '+50 Pts',
    },
    {
      title: 'Truck Proximity Radar',
      desc: 'Track incoming municipal compactor vehicles within 500m of your home.',
      link: '/collection',
      icon: Truck,
      color: 'bg-amber-500',
      badge: 'Live Radar',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-200">
            <MapPin className="w-3.5 h-3.5" />
            <span>Ward: {user?.wardName || 'Lal Chowk'}</span>
            <span>•</span>
            <span className="capitalize">{user?.role} Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Citizen'}!
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
            You are actively participating in Srinagar's decentralized municipal waste reduction and circular recovery network.
          </p>
        </div>

        {/* Eco-Credits Highlight Card */}
        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center gap-4 flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-extrabold shadow-md">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-emerald-200">Eco-Credits Balance</div>
            <div className="text-2xl font-extrabold text-white">{user?.ecoCredits || 0} pts</div>
            <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              {user?.tier || 'BRONZE'} TIER
            </div>
          </div>
        </div>
      </div>

      {/* 4 Community KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diversion Rate</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">
            {diversion?.diversionRatePercent ?? 72.4}%
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Reused • Composted • Recycled</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reward Points</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
            {user?.ecoCredits || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Redeemable at local partners</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active P2P Listings</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-2">
            {recentListings.length}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Available for community pickup</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ward Smart Bins</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 mt-2">
            {wardBins.length || 3}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">IoT telematics connected</span>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Citizen Action Hub</h2>
          <span className="text-xs text-slate-500">Pick an activity to divert waste and earn points</span>
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

      {/* Two Column Layout: Ward Smart Bins & Community Exchange */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ward Smart Bins Telematics */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Nearby Smart Bins ({user?.wardName || 'Lal Chowk'})</h3>
              <p className="text-[11px] text-slate-500">Live fill levels updated by ESP32 sensors</p>
            </div>
            <Link to="/collection" className="text-xs font-semibold text-emerald-700 hover:underline">
              Radar View
            </Link>
          </div>

          {wardBins.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No smart bins currently provisioned in your ward.</p>
          ) : (
            <div className="space-y-3">
              {wardBins.slice(0, 3).map((bin) => (
                <div key={bin.binId} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{bin.name}</span>
                    <span className="text-[11px] text-slate-500">{bin.currentWeightKg} kg • Temp: {bin.temperatureC}°C</span>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      bin.status === 'URGENT' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {bin.currentFillPercent}% Fill
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Community Resource Listings */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Community Resource Exchange</h3>
              <p className="text-[11px] text-slate-500">Available recyclable items & organic scraps</p>
            </div>
            <Link to="/exchange" className="text-xs font-semibold text-emerald-700 hover:underline">
              Browse All
            </Link>
          </div>

          {recentListings.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No active community resource listings found.</p>
          ) : (
            <div className="space-y-3">
              {recentListings.map((item) => (
                <div key={item._id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{item.title}</span>
                    <span className="text-[11px] text-slate-500">{item.category} • {item.wardName}</span>
                  </div>
                  <Link
                    to="/exchange"
                    className="px-3 py-1 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
                  >
                    Claim Item
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
