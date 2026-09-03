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
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminHub() {
  const { user } = useAuth() || {};

  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW, BINS, REPORTS, ROUTES, RECYCLERS
  const [bins, setBins] = useState([]);
  const [reports, setReports] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [recyclers, setRecyclers] = useState([]);
  const [diversion, setDiversion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);

  // New Bin Modal State
  const [showBinModal, setShowBinModal] = useState(false);
  const [newBinData, setNewBinData] = useState({
    binId: '',
    name: '',
    wardName: 'Lal Chowk',
    address: '',
    lng: '74.8080',
    lat: '34.0725',
    depthCm: 100,
    capacityLiters: 240,
  });
  const [generatedToken, setGeneratedToken] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [binsRes, reportsRes, routeRes, recRes, divRes] = await Promise.all([
        api.get('/iot/bins'),
        api.get('/reports'),
        api.get('/routes/optimize'),
        api.get('/recommendations/recyclers'),
        api.get('/analytics/diversion'),
      ]);

      if (binsRes.data.success) setBins(binsRes.data.data);
      if (reportsRes.data.success) setReports(reportsRes.data.data);
      if (routeRes.data.success) setRouteData(routeRes.data);
      if (recRes.data.success) setRecyclers(recRes.data.data);
      if (divRes.data.success) setDiversion(divRes.data.data);
    } catch (err) {
      console.error('Failed to fetch admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifyReport = async (reportId) => {
    try {
      const res = await api.patch(`/reports/${reportId}/verify`, { status: 'VERIFIED' });
      if (res.data.success) {
        setActionMsg(`Report verified! +50 Eco-Credits awarded to citizen.`);
        fetchAdminData();
        setTimeout(() => setActionMsg(null), 4000);
      }
    } catch (err) {
      alert('Error verifying report');
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      const res = await api.patch(`/reports/${reportId}/verify`, { status: 'RESOLVED' });
      if (res.data.success) {
        setActionMsg(`Report marked as RESOLVED and cleared.`);
        fetchAdminData();
        setTimeout(() => setActionMsg(null), 4000);
      }
    } catch (err) {
      alert('Error resolving report');
    }
  };

  const handleCreateBin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/iot/bins', {
        binId: newBinData.binId,
        name: newBinData.name,
        wardName: newBinData.wardName,
        address: newBinData.address,
        coordinates: [parseFloat(newBinData.lng), parseFloat(newBinData.lat)],
        depthCm: parseInt(newBinData.depthCm, 10),
        capacityLiters: parseInt(newBinData.capacityLiters, 10),
      });

      if (res.data.success) {
        setGeneratedToken(res.data.deviceToken);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create smart bin.');
    }
  };

  const urgentBinsCount = bins.filter((b) => b.status === 'URGENT').length;
  const pendingReportsCount = reports.filter((r) => r.status === 'SUBMITTED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-slate-900 rounded-3xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-300 mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Srinagar Municipal Corporation (SMC) Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Executive Admin BI & Operations Hub
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

      {actionMsg && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'OVERVIEW', label: 'City KPI Overview', icon: Activity },
          { id: 'BINS', label: `Smart Bins (${bins.length})`, icon: Trash2 },
          { id: 'REPORTS', label: `Dumping Reports (${reports.length})`, icon: AlertOctagon },
          { id: 'ROUTES', label: 'Route Dispatch (VRP)', icon: Truck },
          { id: 'RECYCLERS', label: `Recyclers (${recyclers.length})`, icon: Recycle },
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

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Smart Bins</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">{bins.length}</div>
              <span className="text-[11px] text-rose-600 font-semibold">{urgentBinsCount} require urgent pickup</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Waste Diversion Rate</span>
              <div className="text-3xl font-extrabold text-emerald-700 mt-2">
                {diversion?.diversionRatePercent ?? 72.4}%
              </div>
              <span className="text-[11px] text-emerald-800 font-medium">Reused • Composted • Recycled</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Grievances</span>
              <div className="text-3xl font-extrabold text-amber-700 mt-2">{pendingReportsCount}</div>
              <span className="text-[11px] text-slate-500">Open dumping complaints</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fuel Optimization</span>
              <div className="text-3xl font-extrabold text-sky-700 mt-2">
                {routeData?.summary?.fuelSavedLiters ?? 18.5} L
              </div>
              <span className="text-[11px] text-slate-500">-28.4% distance reduced</span>
            </div>
          </div>

          {/* Action Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>Urgent Smart Bins (≥80%)</span>
                </h3>
                <button
                  onClick={() => setActiveTab('BINS')}
                  className="text-xs font-semibold text-eco-600 hover:text-eco-700 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {urgentBinsCount === 0 ? (
                <p className="text-xs text-slate-500 py-4">All smart bins operating below warning thresholds.</p>
              ) : (
                <div className="space-y-2.5">
                  {bins.filter((b) => b.status === 'URGENT').map((bin) => (
                    <div
                      key={bin.binId}
                      className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{bin.name}</span>
                        <span className="text-[11px] text-slate-500">{bin.wardName} • {bin.currentWeightKg} kg</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-extrabold text-[11px]">
                        {bin.currentFillPercent}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Pending Dumping Inspections</span>
                </h3>
                <button
                  onClick={() => setActiveTab('REPORTS')}
                  className="text-xs font-semibold text-eco-600 hover:text-eco-700 flex items-center gap-1"
                >
                  <span>Verify Reports</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {pendingReportsCount === 0 ? (
                <p className="text-xs text-slate-500 py-4">No unverified citizen dumping complaints pending.</p>
              ) : (
                <div className="space-y-2.5">
                  {reports.filter((r) => r.status === 'SUBMITTED').slice(0, 3).map((r) => (
                    <div
                      key={r._id}
                      className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{r.wardName}</span>
                        <span className="text-[11px] text-slate-500">{r.address}</span>
                      </div>
                      <button
                        onClick={() => handleVerifyReport(r._id)}
                        className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors"
                      >
                        Verify (+50 pts)
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SMART BINS */}
      {activeTab === 'BINS' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Registered Smart Bins</h3>
              <p className="text-xs text-slate-500">Configure thresholds and provision hardware device tokens.</p>
            </div>
            <button
              onClick={() => {
                setGeneratedToken(null);
                setShowBinModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Provision New Bin</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-3">Bin ID</th>
                  <th className="py-3 px-3">Location & Ward</th>
                  <th className="py-3 px-3">Fill Level</th>
                  <th className="py-3 px-3">Weight</th>
                  <th className="py-3 px-3">Battery</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Connection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bins.map((b) => (
                  <tr key={b.binId} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-bold text-slate-800">{b.binId}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{b.name}</div>
                      <div className="text-[11px] text-slate-500">{b.wardName}</div>
                    </td>
                    <td className="py-3 px-3 font-bold">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full ${
                              b.status === 'URGENT' ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${b.currentFillPercent}%` }}
                          ></div>
                        </div>
                        <span>{b.currentFillPercent}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold">{b.currentWeightKg} kg</td>
                    <td className="py-3 px-3 font-semibold">{b.batteryPercent}%</td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        b.status === 'URGENT' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {b.connectionStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DUMPING REPORTS */}
      {activeTab === 'REPORTS' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Open-Dumping Complaints Management</h3>
            <p className="text-xs text-slate-500">Review citizen reports, award eco-credits, and dispatch clearance teams.</p>
          </div>

          <div className="space-y-4">
            {reports.map((r) => (
              <div
                key={r._id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{r.wardName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      r.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {r.severity} Priority
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold">
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{r.description || 'Roadside illegal waste dump'}</p>
                  <div className="text-[11px] text-slate-400">
                    Location: {r.address} • Submitted: {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {r.status === 'SUBMITTED' && (
                    <button
                      onClick={() => handleVerifyReport(r._id)}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
                    >
                      Verify (+50 Credits)
                    </button>
                  )}
                  {r.status === 'VERIFIED' && (
                    <button
                      onClick={() => handleResolveReport(r._id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {r.status === 'RESOLVED' && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Cleared & Closed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ROUTES (VRP DISPATCH) */}
      {activeTab === 'ROUTES' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">VRP Route Optimization Dispatcher</h3>
              <p className="text-xs text-slate-500">
                Algorithm: {routeData?.summary?.algorithm} ({routeData?.summary?.benchmarkTag})
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 font-bold text-xs">
              -28.4% Fuel Reduced
            </span>
          </div>

          <div className="space-y-3">
            {routeData?.manifest?.map((m) => (
              <div
                key={m.identifier}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    #{m.stopSequence}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block">{m.name}</span>
                    <span className="text-[11px] text-slate-500">{m.wardName} • Fill: {m.fillPercent}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-700">+{m.legDistanceKm} km</span>
                  <div className="text-[10px] text-slate-400">Est. Weight: {m.estimatedWeightKg} kg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: RECYCLER DIRECTORY */}
      {activeTab === 'RECYCLERS' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Authorized Recycler & Vendor Directory</h3>
            <p className="text-xs text-slate-500">Verified scrap aggregators, composting depots, and e-waste collection partners.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recyclers.map((rec) => (
              <div
                key={rec._id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{rec.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {rec.wardName} • {rec.address}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-2">
                    {rec.acceptedMaterials?.map((mat) => (
                      <span
                        key={mat}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-600 font-semibold"
                      >
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-200/80 text-xs font-semibold text-slate-700">
                  Phone: {rec.contactPhone}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provision Smart Bin Modal */}
      {showBinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Provision Smart Bin Hardware</h3>

            {generatedToken ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                <span className="text-xs font-bold text-emerald-900 block">
                  🎉 Bin Provisioned! Flash Token into ESP32:
                </span>
                <div className="p-3 bg-white rounded-xl border border-emerald-300 font-mono text-xs text-slate-800 break-all select-all">
                  {generatedToken}
                </div>
                <p className="text-[11px] text-emerald-700">
                  This token is only shown once. It will be authenticated in the <code>X-Device-Token</code> header.
                </p>
                <button
                  onClick={() => setShowBinModal(false)}
                  className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateBin} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bin Identifier *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BIN_SRG_11"
                    value={newBinData.binId}
                    onChange={(e) => setNewBinData({ ...newBinData, binId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Name / Landmark *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dalgate Ghat 3"
                    value={newBinData.name}
                    onChange={(e) => setNewBinData({ ...newBinData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Ward Name</label>
                    <input
                      type="text"
                      value={newBinData.wardName}
                      onChange={(e) => setNewBinData({ ...newBinData, wardName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Depth (cm)</label>
                    <input
                      type="number"
                      value={newBinData.depthCm}
                      onChange={(e) => setNewBinData({ ...newBinData, depthCm: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Longitude</label>
                    <input
                      type="text"
                      value={newBinData.lng}
                      onChange={(e) => setNewBinData({ ...newBinData, lng: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Latitude</label>
                    <input
                      type="text"
                      value={newBinData.lat}
                      onChange={(e) => setNewBinData({ ...newBinData, lat: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBinModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold"
                  >
                    Generate Token & Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
