import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Trash2, 
  Truck, 
  AlertOctagon, 
  Recycle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  Plus, 
  Sparkles,
  Users,
  Activity,
  Layers,
  ArrowRight,
  Send,
  Calendar,
  FileText,
  Radio,
  AlertTriangle,
  ShoppingBag,
  Award
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

// Modular Admin Feature Tabs
import CollectionRequestsTab from '../components/admin/CollectionRequestsTab';
import VehiclesDriversTab from '../components/admin/VehiclesDriversTab';
import SmartBinsHealthTab from '../components/admin/SmartBinsHealthTab';
import RouteDispatchTab from '../components/admin/RouteDispatchTab';
import SmartBinAlertsTab from '../components/admin/SmartBinAlertsTab';
import WasteAnalyticsTab from '../components/admin/WasteAnalyticsTab';
import ReportsExportTab from '../components/admin/ReportsExportTab';
import MarketplaceAdminTab from '../components/admin/MarketplaceAdminTab';
import RecyclersAdminTab from '../components/admin/RecyclersAdminTab';
import RewardConfigTab from '../components/admin/RewardConfigTab';

export default function AdminHub() {
  const { user } = useAuth() || {};
  const { socket, isConnected } = useSocket() || {};

  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [bins, setBins] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [activeRuns, setActiveRuns] = useState([]);
  const [diversion, setDiversion] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOverviewTelemetry = async () => {
    setLoading(true);
    try {
      const [binsRes, reqsRes, repsRes, vehsRes, runsRes, divRes, alrtRes] = await Promise.all([
        api.get('/iot/bins'),
        api.get('/collection-requests'),
        api.get('/reports'),
        api.get('/vehicles'),
        api.get('/collection-runs/active'),
        api.get('/analytics/diversion'),
        api.get('/iot/alerts?status=ACTIVE'),
      ]);

      if (binsRes.data.success) setBins(binsRes.data.data);
      if (reqsRes.data.success) setRequests(reqsRes.data.data);
      if (repsRes.data.success) setReports(repsRes.data.data);
      if (vehsRes.data.success) setVehicles(vehsRes.data.data);
      if (runsRes.data.success) setActiveRuns(runsRes.data.data);
      if (divRes.data.success) setDiversion(divRes.data.data);
      if (alrtRes.data.success) setAlerts(alrtRes.data.data);
    } catch (err) {
      console.error('Failed to fetch admin overview telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewTelemetry();
  }, []);

  // Listen to WebSocket events to update overview counters live
  useEffect(() => {
    if (!socket) return;

    socket.on('smartbin_telemetry_updated', () => fetchOverviewTelemetry());
    socket.on('new_dumping_report', () => fetchOverviewTelemetry());
    socket.on('new_collection_request', () => fetchOverviewTelemetry());
    socket.on('collection_run_completed', () => fetchOverviewTelemetry());

    return () => {
      socket.off('smartbin_telemetry_updated');
      socket.off('new_dumping_report');
      socket.off('new_collection_request');
      socket.off('collection_run_completed');
    };
  }, [socket]);

  const urgentBins = bins.filter((b) => b.currentFillPercent >= 80);
  const pendingRequests = requests.filter((r) => r.status === 'REQUESTED');
  const openReports = reports.filter((r) => r.status === 'SUBMITTED');
  const activeVehiclesCount = vehicles.filter((v) => v.status === 'COLLECTING' || v.status === 'ON_ROUTE').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-slate-900 rounded-3xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-300 mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Srinagar Municipal Corporation (SMC) Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Municipal Operations Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time municipal telemetry, smart-bin health, citizen grievance resolution, and VRP route dispatching.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300 font-semibold">Central Telemetry Live</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'OVERVIEW', label: 'City Overview', icon: Activity },
          { id: 'REQUESTS', label: `Collection Requests (${pendingRequests.length})`, icon: Calendar },
          { id: 'DISPATCH', label: 'Route Dispatch (VRP)', icon: Truck },
          { id: 'BINS', label: `Smart Bins (${bins.length})`, icon: Trash2 },
          { id: 'ALERTS', label: `Alerts (${alerts.length})`, icon: AlertTriangle },
          { id: 'FLEET', label: `Vehicles & Drivers (${vehicles.length})`, icon: Users },
          { id: 'ANALYTICS', label: 'Waste Diversion', icon: TrendingUp },
          { id: 'MARKETPLACE', label: 'Rewards & Orders', icon: ShoppingBag },
          { id: 'RECYCLERS', label: 'Recyclers Directory', icon: Recycle },
          { id: 'REWARDS_CONFIG', label: 'Eco-Credits Config', icon: Award },
          { id: 'EXPORTS', label: 'Reports Export', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          {/* KPI Cards (Real Data Only) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deployed Bins</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{bins.length}</div>
              <span className="text-[10px] text-rose-600 font-semibold">{urgentBins.length} ≥ 80% Full</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Requests</span>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">{pendingRequests.length}</div>
              <span className="text-[10px] text-slate-500">Pickups requested</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Fleet</span>
              <div className="text-2xl font-extrabold text-sky-700 mt-1">{activeVehiclesCount} / {vehicles.length}</div>
              <span className="text-[10px] text-slate-500">Vehicles on route</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diversion Rate</span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                {diversion ? `${diversion.diversionRatePercent}%` : '0%'}
              </div>
              <span className="text-[10px] text-emerald-800 font-medium">Reused/Recycled</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Alerts</span>
              <div className="text-2xl font-extrabold text-rose-700 mt-1">{alerts.length}</div>
              <span className="text-[10px] text-rose-600">Hardware & Threshold</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dumping Grievances</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{openReports.length}</div>
              <span className="text-[10px] text-slate-500">Unresolved reports</span>
            </div>
          </div>

          {/* Priority Operations Feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Urgent Smart Bins */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>Urgent Smart Bins (≥80%)</span>
                </h3>
                <button
                  onClick={() => setActiveTab('BINS')}
                  className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <span>View All Bins</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {urgentBins.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">All smart bins operating below warning thresholds.</p>
              ) : (
                <div className="space-y-2">
                  {urgentBins.slice(0, 4).map((b) => (
                    <div key={b.binId} className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{b.binId} — {b.name}</span>
                        <span className="text-[11px] text-slate-500">{b.wardName} • {b.currentWeightKg || 0} kg</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-extrabold text-[11px]">
                        {b.currentFillPercent}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Collection Requests */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Urgent Collection Requests</span>
                </h3>
                <button
                  onClick={() => setActiveTab('REQUESTS')}
                  className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <span>View All Requests</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {pendingRequests.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No pending collection requests from citizens.</p>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.slice(0, 4).map((r) => (
                    <div key={r._id} className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{r.wardName} • {r.category}</span>
                        <span className="text-[11px] text-slate-500">{r.pickupAddress} • {r.estimatedVolumeKg} kg</span>
                      </div>
                      <button
                        onClick={() => setActiveTab('REQUESTS')}
                        className="px-3 py-1 rounded-xl bg-amber-600 text-white font-bold text-xs"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REQUESTS */}
      {activeTab === 'REQUESTS' && <CollectionRequestsTab />}

      {/* TAB 3: ROUTE DISPATCH & LIVE MAP */}
      {activeTab === 'DISPATCH' && <RouteDispatchTab />}

      {/* TAB 4: SMART BINS & TELEMETRY */}
      {activeTab === 'BINS' && <SmartBinsHealthTab />}

      {/* TAB 5: ALERTS */}
      {activeTab === 'ALERTS' && <SmartBinAlertsTab />}

      {/* TAB 6: FLEET & DRIVERS */}
      {activeTab === 'FLEET' && <VehiclesDriversTab />}

      {/* TAB 7: WASTE DIVERSION */}
      {activeTab === 'ANALYTICS' && <WasteAnalyticsTab />}

      {/* TAB 8: MARKETPLACE & ORDERS */}
      {activeTab === 'MARKETPLACE' && <MarketplaceAdminTab />}

      {/* TAB 9: RECYCLERS DIRECTORY */}
      {activeTab === 'RECYCLERS' && <RecyclersAdminTab />}

      {/* TAB 10: REWARD CONFIGURATION */}
      {activeTab === 'REWARDS_CONFIG' && <RewardConfigTab />}

      {/* TAB 11: EXPORTS */}
      {activeTab === 'EXPORTS' && <ReportsExportTab />}
    </div>
  );
}
