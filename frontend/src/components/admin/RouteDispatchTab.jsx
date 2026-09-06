import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Send, 
  MapPin, 
  Navigation, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Activity, 
  User,
  Sparkles
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

// Custom Leaflet Icons
const truckIcon = L.divIcon({
  className: 'custom-truck-marker',
  html: `<div style="background-color: #0284c7; width: 32px; height: 32px; border-radius: 8px; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">🚛</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const binIcon = (priority) => {
  const bg = priority === 'CRITICAL' || priority === 'HIGH' ? '#ef4444' : '#10b981';
  return L.divIcon({
    className: 'custom-bin-marker',
    html: `<div style="background-color: ${bg}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">🗑️</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export default function RouteDispatchTab() {
  const { socket } = useSocket() || {};

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [bins, setBins] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeRuns, setActiveRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dispatch Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedWard, setSelectedWard] = useState('All Wards');
  const [generatedRoute, setGeneratedRoute] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchDispatchPrerequisites = async () => {
    setLoading(true);
    try {
      const [vehRes, drvRes, binRes, reqRes, actRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers'),
        api.get('/iot/bins'),
        api.get('/collection-requests?status=REQUESTED'),
        api.get('/collection-runs/active'),
      ]);

      if (vehRes.data.success) {
        setVehicles(vehRes.data.data);
        if (vehRes.data.data.length > 0) setSelectedVehicleId(vehRes.data.data[0]._id);
      }
      if (drvRes.data.success) {
        setDrivers(drvRes.data.data);
        if (drvRes.data.data.length > 0) setSelectedDriverId(drvRes.data.data[0]._id);
      }
      if (binRes.data.success) setBins(binRes.data.data);
      if (reqRes.data.success) setRequests(reqRes.data.data);
      if (actRes.data.success) setActiveRuns(actRes.data.data);
    } catch (err) {
      console.error('Failed to load route dispatch prerequisites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatchPrerequisites();
  }, []);

  // Listen to WebSocket events for real-time live map & run updates
  useEffect(() => {
    if (!socket) return;

    socket.on('collection_run_started', () => fetchDispatchPrerequisites());
    socket.on('collection_stop_updated', () => fetchDispatchPrerequisites());
    socket.on('collection_run_completed', () => fetchDispatchPrerequisites());

    return () => {
      socket.off('collection_run_started');
      socket.off('collection_stop_updated');
      socket.off('collection_run_completed');
    };
  }, [socket]);

  // Generate Route Waypoints based on live bins & requests
  const handleGenerateRoute = async () => {
    const candidateBins = bins.filter((b) => selectedWard === 'All Wards' || b.wardName === selectedWard);
    const urgentCandidateBins = candidateBins.filter((b) => b.currentFillPercent >= 65);
    const binsToInclude = urgentCandidateBins.length > 0 ? urgentCandidateBins : candidateBins.slice(0, 4);

    const candidateRequests = requests.filter((r) => selectedWard === 'All Wards' || r.wardName === selectedWard);

    const stops = [
      ...binsToInclude.map((b) => ({
        type: 'SMART_BIN',
        refId: b._id,
        identifier: b.binId,
        name: b.name,
        wardName: b.wardName,
        address: b.address,
        coordinates: b.location.coordinates,
        fillPercent: b.currentFillPercent,
        estimatedWeightKg: b.currentWeightKg || 25,
        priority: b.currentFillPercent >= 80 ? 'CRITICAL' : 'HIGH',
      })),
      ...candidateRequests.slice(0, 3).map((r) => ({
        type: 'COLLECTION_REQUEST',
        refId: r._id,
        identifier: `REQ-${r._id.toString().slice(-4)}`,
        name: `Citizen Pickup (${r.category})`,
        wardName: r.wardName,
        address: r.pickupAddress,
        coordinates: r.location.coordinates,
        fillPercent: 50,
        estimatedWeightKg: r.estimatedVolumeKg || 10,
        priority: r.requestType === 'EVENT' ? 'HIGH' : 'MEDIUM',
      })),
    ];

    if (stops.length === 0) {
      alert('No smart bins or pending requests available for the selected ward.');
      return;
    }

    // Heuristic route metrics
    const distanceKm = parseFloat((stops.length * 2.8 + 4.5).toFixed(1));
    const durationMinutes = Math.round(distanceKm * 2.5 + stops.length * 6);

    setGeneratedRoute({
      stops,
      totalDistanceKm: distanceKm,
      estimatedDurationMinutes: durationMinutes,
    });
  };

  // Dispatch Route to Driver (Creates CollectionRun in MongoDB Atlas)
  const handleDispatchSubmit = async () => {
    if (!generatedRoute || !selectedVehicleId || !selectedDriverId) return;

    setSubmitting(true);
    try {
      const res = await api.post('/collection-runs/dispatch', {
        vehicleId: selectedVehicleId,
        driverId: selectedDriverId,
        wardName: selectedWard,
        stops: generatedRoute.stops,
        totalDistanceKm: generatedRoute.totalDistanceKm,
        estimatedDurationMinutes: generatedRoute.estimatedDurationMinutes,
      });

      if (res.data.success) {
        setFeedback(`Route manifest dispatched as ${res.data.data.runId}! Driver notified.`);
        setGeneratedRoute(null);
        fetchDispatchPrerequisites();
        setTimeout(() => setFeedback(null), 5000);
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to dispatch route to fleet.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900">Vehicle Route Dispatcher & Live Map</h3>
          <p className="text-xs text-slate-500">
            Generate VRP manifests from real smart bins & collection requests and dispatch them to driver smartphones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-700">{activeRuns.length} Active Runs Operating</span>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Grid: Route Builder & Live Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Planning Controls (1 Col) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h4 className="font-extrabold text-sm text-slate-900">Plan New Collection Run</h4>
            <p className="text-[11px] text-slate-500">Configure parameters to generate an optimized route.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Ward / Area</label>
              <select
                value={selectedWard}
                onChange={(e) => {
                  setSelectedWard(e.target.value);
                  setGeneratedRoute(null);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 outline-none"
              >
                <option value="All Wards">All Srinagar Wards</option>
                <option value="Lal Chowk">Lal Chowk</option>
                <option value="Rajbagh">Rajbagh</option>
                <option value="Hazratbal">Hazratbal</option>
                <option value="Dalgate">Dalgate</option>
                <option value="Soura">Soura</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Vehicle</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 outline-none"
              >
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.plateNumber} ({v.model})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Driver</label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 outline-none"
              >
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.phone || d.email})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerateRoute}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Generate Optimized Waypoints</span>
            </button>
          </div>

          {/* Generated Manifest Preview */}
          {generatedRoute && (
            <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">{generatedRoute.stops.length} Waypoints</span>
                <span className="font-mono text-slate-500 font-bold">{generatedRoute.totalDistanceKm} km (~{generatedRoute.estimatedDurationMinutes} min)</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {generatedRoute.stops.map((s, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">#{idx + 1} {s.identifier}</span>
                      <span className="text-slate-500">{s.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                      s.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {s.priority}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleDispatchSubmit}
                disabled={submitting}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Dispatching...' : 'Dispatch Route to Driver'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Live Map View (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">GIS Operations Radar</h4>
              <p className="text-[11px] text-slate-500">Live locations of collection trucks and IoT smart bins.</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-sky-700">🚛 Active Vehicles</span>
              <span className="flex items-center gap-1 text-emerald-700">🗑️ Smart Bins</span>
            </div>
          </div>

          <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-200 relative">
            <MapContainer
              center={[34.0837, 74.7973]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Smart Bins Markers */}
              {bins.map((bin) => (
                <Marker
                  key={bin.binId}
                  position={[bin.location.coordinates[1], bin.location.coordinates[0]]}
                  icon={binIcon(bin.status)}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-slate-900">{bin.binId}</div>
                      <div className="text-slate-600">{bin.name}</div>
                      <div className="font-bold text-rose-600">Fill: {bin.currentFillPercent}%</div>
                      <div className="text-slate-500">Weight: {bin.currentWeightKg || 0} kg</div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Fleet Vehicle Markers */}
              {vehicles.filter((v) => v.currentLocation?.coordinates).map((v) => (
                <Marker
                  key={v._id}
                  position={[v.currentLocation.coordinates[1], v.currentLocation.coordinates[0]]}
                  icon={truckIcon}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-slate-900">{v.plateNumber}</div>
                      <div className="text-slate-600">{v.model}</div>
                      <div className="font-bold text-sky-700">Status: {v.status}</div>
                      {v.driverId && <div className="text-slate-500">Driver: {v.driverId.name}</div>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Active Dispatches Feed */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="font-extrabold text-sm text-slate-900">Active Collection Runs in Progress</h4>
        {activeRuns.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No collection vehicles currently executing a dispatched run.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeRuns.map((run) => (
              <div key={run._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-xs text-slate-900">{run.runId}</span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                    {run.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  <div><span className="font-bold">Driver:</span> {run.driverId?.name} • 🚛 {run.vehicleId?.plateNumber}</div>
                  <div><span className="font-bold">Progress:</span> {run.completedStops || 0} / {run.totalStops} stops completed</div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${run.totalStops > 0 ? (run.completedStops / run.totalStops) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
