import React, { useState, useEffect } from 'react';
import {
  Building2,
  Trash2,
  Truck,
  AlertOctagon,
  Recycle,
  Calendar,
  TrendingUp,
  Users,
  Activity,
  ArrowRight,
  FileText,
  AlertTriangle,
  ShoppingBag,
  Award,
} from 'lucide-react';
import api from '../services/api';
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
  const { socket } = useSocket() || {};

  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [bins, setBins] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [diversion, setDiversion] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const fetchOverviewTelemetry = async () => {
    try {
      const [binsRes, reqsRes, repsRes, vehsRes, divRes, alrtRes] = await Promise.all([
        api.get('/iot/bins'),
        api.get('/collection-requests'),
        api.get('/reports'),
        api.get('/vehicles'),
        api.get('/analytics/diversion'),
        api.get('/iot/alerts?status=ACTIVE'),
      ]);

      if (binsRes.data.success) setBins(binsRes.data.data);
      if (reqsRes.data.success) setRequests(reqsRes.data.data);
      if (repsRes.data.success) setReports(repsRes.data.data);
      if (vehsRes.data.success) setVehicles(vehsRes.data.data);
      if (divRes.data.success) setDiversion(divRes.data.data);
      if (alrtRes.data.success) setAlerts(alrtRes.data.data);
    } catch (err) {
      console.error('Failed to fetch admin overview data:', err);
    }
  };

  useEffect(() => {
    fetchOverviewTelemetry();
  }, []);

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
  const activeVehiclesCount = vehicles.filter(
    (v) => v.status === 'COLLECTING' || v.status === 'ON_ROUTE'
  ).length;

  const navGroups = [
    {
      title: 'Operations',
      items: [
        { id: 'OVERVIEW', label: 'Overview', icon: Activity },
        {
          id: 'REQUESTS',
          label: 'Collection Requests',
          badge: pendingRequests.length || null,
          icon: Calendar,
        },
        { id: 'DISPATCH', label: 'Route Dispatch', icon: Truck },
        { id: 'FLEET', label: 'Drivers & Vehicles', icon: Users },
      ],
    },
    {
      title: 'Bins & Alerts',
      items: [
        { id: 'BINS', label: 'Smart Bins', badge: bins.length || null, icon: Trash2 },
        { id: 'ALERTS', label: 'Alerts', badge: alerts.length || null, icon: AlertTriangle },
      ],
    },
    {
      title: 'Community & Rewards',
      items: [
        { id: 'MARKETPLACE', label: 'Rewards & Orders', icon: ShoppingBag },
        { id: 'RECYCLERS', label: 'Recycling Resources', icon: Recycle },
        { id: 'REWARDS_CONFIG', label: 'Eco-Credits Settings', icon: Award },
      ],
    },
    {
      title: 'Insights',
      items: [
        { id: 'ANALYTICS', label: 'Analytics', icon: TrendingUp },
        { id: 'EXPORTS', label: 'Reports Export', icon: FileText },
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 bg-[#26372B] rounded-3xl text-white shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#E5F4E8] mb-2">
            <Building2 className="w-3.5 h-3.5 text-[#84D19B]" />
            Clear Waste Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#E5F4E8]/80 mt-1">
            Manage pickup requests, dispatch collection routes, monitor public smart bins, and oversee community rewards.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-white/10 px-3.5 py-2 rounded-xl self-start sm:self-center">
          <span className="w-2 h-2 rounded-full bg-[#84D19B]"></span>
          <span className="text-[#E5F4E8] font-semibold">Live System Connected</span>
        </div>
      </div>

      {/* Main Layout: Sidebar Navigation on Desktop + Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Navigation */}
        <aside
          aria-label="Admin sections"
          className="lg:col-span-3 bg-white rounded-3xl border border-[#DCE6DF] p-4 space-y-5"
        >
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#526356]">
                {group.title}
              </div>
              <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
                {group.items.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-[#21834A] text-white shadow-2xs'
                          : 'text-[#26372B] hover:bg-[#E5F4E8]/60'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#21834A]'}`} />
                        <span>{tab.label}</span>
                      </span>
                      {tab.badge ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-[#E5F4E8] text-[#1A693B]'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* 4 Key Operational Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-[#DCE6DF]">
                  <span className="text-xs font-semibold text-[#526356] block">
                    Pending Pickups
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#26372B] mt-1">
                    {pendingRequests.length}
                  </div>
                  <span className="text-xs text-amber-700 font-medium">Awaiting assignment</span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#DCE6DF]">
                  <span className="text-xs font-semibold text-[#526356] block">
                    Bins Needing Pickup
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-rose-700 mt-1">
                    {urgentBins.length}
                  </div>
                  <span className="text-xs text-[#526356]">Of {bins.length} total bins</span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#DCE6DF]">
                  <span className="text-xs font-semibold text-[#526356] block">
                    Active Trucks
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#21834A] mt-1">
                    {activeVehiclesCount} / {vehicles.length}
                  </div>
                  <span className="text-xs text-[#526356]">Currently on route</span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#DCE6DF]">
                  <span className="text-xs font-semibold text-[#526356] block">
                    Open Dumping Reports
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#26372B] mt-1">
                    {openReports.length}
                  </div>
                  <span className="text-xs text-[#21834A] font-medium">
                    {diversion ? `${diversion.diversionRatePercent}% diversion rate` : 'Active'}
                  </span>
                </div>
              </div>

              {/* Priority Action Queues */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Urgent Smart Bins */}
                <div className="p-6 bg-white rounded-3xl border border-[#DCE6DF] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#DCE6DF]">
                    <h2 className="text-base font-bold text-[#26372B] flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 text-rose-600" />
                      <span>Bins Needing Emptying (≥80%)</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('BINS')}
                      className="text-xs font-bold text-[#21834A] hover:underline flex items-center gap-1"
                    >
                      <span>All Bins</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {urgentBins.length === 0 ? (
                    <p className="text-sm text-[#526356] py-6 text-center">
                      All public smart bins have plenty of space right now.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {urgentBins.slice(0, 4).map((b) => (
                        <div
                          key={b.binId}
                          className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#26372B] block">
                              {b.name} ({b.binId})
                            </span>
                            <span className="text-[#526356]">
                              {b.wardName} • {b.currentWeightKg || 0} kg
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-bold">
                            {b.currentFillPercent}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending Collection Requests */}
                <div className="p-6 bg-white rounded-3xl border border-[#DCE6DF] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#DCE6DF]">
                    <h2 className="text-base font-bold text-[#26372B] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#21834A]" />
                      <span>New Pickup Requests</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('REQUESTS')}
                      className="text-xs font-bold text-[#21834A] hover:underline flex items-center gap-1"
                    >
                      <span>All Requests</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {pendingRequests.length === 0 ? (
                    <p className="text-sm text-[#526356] py-6 text-center">
                      No pending citizen pickup requests right now.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {pendingRequests.slice(0, 4).map((r) => (
                        <div
                          key={r._id}
                          className="p-3.5 rounded-2xl bg-[#F8FAF8] border border-[#DCE6DF] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#26372B] block">
                              {r.wardName} • {(r.category || '').replace(/_/g, ' ')}
                            </span>
                            <span className="text-[#526356]">
                              {r.pickupAddress} • {r.estimatedVolumeKg} kg
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('REQUESTS')}
                            className="px-3 py-1.5 rounded-xl bg-[#21834A] text-white font-bold text-xs hover:bg-[#1A693B]"
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

          {activeTab === 'REQUESTS' && <CollectionRequestsTab />}
          {activeTab === 'DISPATCH' && <RouteDispatchTab />}
          {activeTab === 'BINS' && <SmartBinsHealthTab />}
          {activeTab === 'ALERTS' && <SmartBinAlertsTab />}
          {activeTab === 'FLEET' && <VehiclesDriversTab />}
          {activeTab === 'ANALYTICS' && <WasteAnalyticsTab />}
          {activeTab === 'MARKETPLACE' && <MarketplaceAdminTab />}
          {activeTab === 'RECYCLERS' && <RecyclersAdminTab />}
          {activeTab === 'REWARDS_CONFIG' && <RewardConfigTab />}
          {activeTab === 'EXPORTS' && <ReportsExportTab />}
        </div>
      </div>
    </div>
  );
}
