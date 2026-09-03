import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { 
  AlertOctagon, 
  Plus, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Upload, 
  X, 
  Filter,
  Flame,
  Award,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const createReportIcon = (severity) => {
  const color =
    severity === 'CRITICAL'
      ? '#991b1b'
      : severity === 'HIGH'
      ? '#ef4444'
      : severity === 'MEDIUM'
      ? '#f59e0b'
      : '#3b82f6';

  return L.divIcon({
    className: 'custom-report-marker',
    html: `<div style="
      background-color: ${color};
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

const SRINAGAR_WARDS = [
  'Lal Chowk',
  'Rajbagh',
  'Hazratbal',
  'Bemina',
  'Nishat',
  'Soura',
  'Batamaloo',
  'Khanyar',
  'Dalgate',
  'Karan Nagar',
];

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    wasteCategory: 'MIXED_MUNICIPAL',
    severity: 'MEDIUM',
    description: '',
    address: '',
    wardName: 'Lal Chowk',
    coordinates: [74.7973, 34.0837],
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [detectingGps, setDetectingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { user, isAuthenticated, refreshUser } = useAuth() || {};

  const fetchData = async () => {
    setLoading(true);
    try {
      const [repRes, hotRes] = await Promise.all([
        api.get('/reports'),
        api.get('/reports/hotspots'),
      ]);

      if (repRes.data.success) setReports(repRes.data.data);
      if (hotRes.data.success) setHotspots(hotRes.data.data);
    } catch (err) {
      console.error('Failed to fetch reports/hotspots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setActionError('HTML5 Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          coordinates: [
            parseFloat(pos.coords.longitude.toFixed(6)),
            parseFloat(pos.coords.latitude.toFixed(6)),
          ],
        }));
        setDetectingGps(false);
      },
      () => {
        setActionError('Unable to retrieve current location.');
        setDetectingGps(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);

    const data = new FormData();
    data.append('wasteCategory', formData.wasteCategory);
    data.append('severity', formData.severity);
    data.append('description', formData.description);
    data.append('address', formData.address);
    data.append('wardName', formData.wardName);
    data.append('coordinates', JSON.stringify(formData.coordinates));
    if (photoFile) data.append('photo', photoFile);

    try {
      const res = await api.post('/reports', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setShowModal(false);
        setActionSuccess('Illicit dumping complaint registered! Municipal team notified.');
        setFormData({
          wasteCategory: 'MIXED_MUNICIPAL',
          severity: 'MEDIUM',
          description: '',
          address: '',
          wardName: user?.wardName || 'Lal Chowk',
          coordinates: [74.7973, 34.0837],
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        fetchData();
        setTimeout(() => setActionSuccess(null), 5000);
      }
    } catch (err) {
      setActionError(
        err.response?.data?.error?.message || 'Failed to submit dumping report.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold mb-2">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            Citizen GIS Reporting & Spatial Clustering
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Illicit Open-Dumping & Hotspot Detection
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Report unauthorized waste dumps across Srinagar. Verified reports earn <strong className="text-emerald-700">+50 Eco-Credits</strong> upon municipal inspection.
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => {
              setActionError(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Report Dumping Site</span>
          </button>
        )}
      </div>

      {actionSuccess && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reports</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{reports.length}</div>
          <span className="text-[11px] text-slate-500">Citizen submissions</span>
        </div>

        <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 shadow-xs">
          <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Detected Hotspots</span>
          <div className="text-3xl font-extrabold text-rose-950 mt-2">{hotspots.length}</div>
          <span className="text-[11px] text-rose-700">Recurring 250m spatial clusters</span>
        </div>

        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 shadow-xs">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending Action</span>
          <div className="text-3xl font-extrabold text-amber-950 mt-2">
            {reports.filter((r) => r.status === 'SUBMITTED' || r.status === 'ASSIGNED').length}
          </div>
          <span className="text-[11px] text-amber-700">Scheduled for cleanup</span>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Resolved Sites</span>
          <div className="text-3xl font-extrabold text-emerald-950 mt-2">
            {reports.filter((r) => r.status === 'RESOLVED').length}
          </div>
          <span className="text-[11px] text-emerald-700">Cleared & verified</span>
        </div>
      </div>

      {/* Interactive GIS Map */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-600" />
            <span>Srinagar Open-Dumping Complaints & 250m Hotspot Clusters</span>
          </h2>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Low
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> High/Critical
            </span>
            <span className="flex items-center gap-1 text-rose-700">
              <span className="w-3 h-3 rounded-full border border-rose-500 bg-rose-500/20"></span> Hotspot Cluster
            </span>
          </div>
        </div>

        <div className="h-[440px] rounded-2xl overflow-hidden border border-slate-200 relative z-10">
          <MapContainer
            center={[34.0837, 74.7973]}
            zoom={12}
            scrollWheelZoom={false}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Individual Complaint Markers */}
            {reports.map((rep) => {
              const coords = [rep.location.coordinates[1], rep.location.coordinates[0]];
              return (
                <Marker key={rep._id} position={coords} icon={createReportIcon(rep.severity)}>
                  <Popup>
                    <div className="p-1 space-y-1.5 text-xs">
                      <div className="font-bold text-slate-900">{rep.wardName}</div>
                      <div className="text-[11px] text-slate-500">{rep.address}</div>
                      <div className="pt-1 border-t border-slate-200 space-y-0.5">
                        <div className="flex justify-between gap-4 font-semibold">
                          <span>Category:</span>
                          <span className="text-slate-700">{rep.wasteCategory.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex justify-between gap-4 font-semibold">
                          <span>Severity:</span>
                          <span className="text-rose-600">{rep.severity}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Status:</span>
                          <span className="font-bold uppercase text-slate-800">{rep.status}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Spatial Hotspot Circles (250m radius) */}
            {hotspots.map((hs) => (
              <Circle
                key={hs.hotspotId}
                center={[hs.centroid[1], hs.centroid[0]]}
                radius={hs.radiusMeters}
                pathOptions={{
                  color: '#dc2626',
                  fillColor: '#ef4444',
                  fillOpacity: 0.2,
                  weight: 2,
                  dashArray: '4, 4',
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <div className="font-bold text-rose-800">
                      🚨 Hotspot Cluster ({hs.incidentCount} incidents)
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Ward: {hs.wardName} • Severity: {hs.highestSeverity}
                    </div>
                  </div>
                </Popup>
              </Circle>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Recent Community Complaints</h3>

        {reports.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No open-dumping reports registered yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((r) => (
              <div
                key={r._id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {r.wardName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      r.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : r.status === 'VERIFIED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{r.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-rose-700 uppercase">
                    {r.severity} Priority
                  </span>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Report Illicit Open Dumping Site</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Waste Category *
                  </label>
                  <select
                    value={formData.wasteCategory}
                    onChange={(e) => setFormData({ ...formData, wasteCategory: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="MIXED_MUNICIPAL">Mixed Municipal Waste</option>
                    <option value="CONSTRUCTION_DEBRIS">Construction Debris</option>
                    <option value="PLASTIC_POLLUTION">Plastic Pollution</option>
                    <option value="BIO_ORGANIC">Bio-Waste / Carcasses</option>
                    <option value="HAZARDOUS_MEDICAL">Hazardous / Medical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Severity Level *
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="LOW">Low (Small roadside litter)</option>
                    <option value="MEDIUM">Medium (Noticeable pile)</option>
                    <option value="HIGH">High (Obstructing drainage)</option>
                    <option value="CRITICAL">Critical (Hazardous/Near water)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Srinagar Ward *
                  </label>
                  <select
                    value={formData.wardName}
                    onChange={(e) => setFormData({ ...formData, wardName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    {SRINAGAR_WARDS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street / Landmark *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Behind SKIMS Outer Gate"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* GPS Coordinates & Autodetect */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  <span>GPS: </span>
                  <strong>{formData.coordinates[0]}</strong>° E, <strong>{formData.coordinates[1]}</strong>° N
                </div>
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={detectingGps}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  {detectingGps ? 'Detecting...' : 'Detect GPS'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Incident Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide additional details regarding dumping time or vehicle registration if observed..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Site Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setPhotoFile(file || null);
                    setPhotoPreview(file ? URL.createObjectURL(file) : null);
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60"
                >
                  {submitting ? 'Submitting Report...' : 'Submit Report (+50 pts on verify)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
