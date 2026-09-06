import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Plus, 
  AlertOctagon, 
  Radio, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Thermometer, 
  Scale, 
  ShieldAlert 
} from 'lucide-react';
import api from '../../services/api';
import BinDetailsModal from './BinDetailsModal';

export default function SmartBinsHealthTab() {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBin, setSelectedBin] = useState(null);

  // New Bin Modal
  const [showModal, setShowModal] = useState(false);
  const [newBin, setNewBin] = useState({
    binId: '',
    name: '',
    wardName: 'Lal Chowk',
    address: '',
    lng: '74.8080',
    lat: '34.0725',
    depthCm: 100,
    capacityLiters: 240,
  });
  const [deviceToken, setDeviceToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchBins = async () => {
    setLoading(true);
    try {
      const res = await api.get('/iot/bins');
      if (res.data.success) {
        setBins(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load smart bins telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBins();
  }, []);

  const handleCreateBin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/iot/bins', {
        binId: newBin.binId.trim(),
        name: newBin.name.trim(),
        wardName: newBin.wardName,
        address: newBin.address,
        coordinates: [parseFloat(newBin.lng), parseFloat(newBin.lat)],
        depthCm: parseInt(newBin.depthCm, 10),
        capacityLiters: parseInt(newBin.capacityLiters, 10),
      });

      if (res.data.success) {
        setDeviceToken(res.data.deviceToken);
        fetchBins();
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to provision smart bin.');
    } finally {
      setSubmitting(false);
    }
  };

  const onlineCount = bins.filter((b) => b.connectionStatus === 'ONLINE').length;
  const staleCount = bins.filter((b) => b.connectionStatus === 'STALE').length;
  const offlineCount = bins.filter((b) => b.connectionStatus === 'OFFLINE').length;

  return (
    <div className="space-y-6">
      {/* Top Telemetry Health Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Deployed Smart Bins</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">{bins.length}</div>
          <span className="text-[11px] text-slate-500">Srinagar IoT Grid</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Online & Transmitting</span>
          <div className="text-3xl font-extrabold text-emerald-700 mt-1">{onlineCount}</div>
          <span className="text-[11px] text-emerald-800">Heartbeat &lt; 10 min</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Stale Devices</span>
          <div className="text-3xl font-extrabold text-amber-700 mt-1">{staleCount}</div>
          <span className="text-[11px] text-slate-500">Silent 10–30 min</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Offline Hardware</span>
          <div className="text-3xl font-extrabold text-rose-700 mt-1">{offlineCount}</div>
          <span className="text-[11px] text-rose-600">Needs Field Service</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">ESP32 Smart Bin Telemetry Monitor</h3>
            <p className="text-xs text-slate-500">Ultrasonic fill sensors, HX711 load-cell weights, and DS18B20 temperature probes.</p>
          </div>
          <button
            onClick={() => {
              setDeviceToken(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New Bin</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading smart bins from MongoDB...</div>
        ) : bins.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Trash2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No smart bins registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Bin Identifier</th>
                  <th className="py-3 px-4">Location & Ward</th>
                  <th className="py-3 px-4">Fill Percentage</th>
                  <th className="py-3 px-4">Sensor Weight</th>
                  <th className="py-3 px-4">Temp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Connection</th>
                  <th className="py-3 px-4 text-right">Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bins.map((b) => (
                  <tr key={b.binId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{b.binId}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{b.name}</div>
                      <div className="text-[11px] text-slate-400">{b.wardName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full ${
                              b.currentFillPercent >= 80
                                ? 'bg-rose-500'
                                : b.currentFillPercent >= 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${b.currentFillPercent}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-slate-800">{b.currentFillPercent}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {b.currentWeightKg || 0} kg
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {b.currentTemperatureC || 20}°C
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        b.status === 'URGENT'
                          ? 'bg-rose-100 text-rose-800'
                          : b.status === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                        b.connectionStatus === 'ONLINE'
                          ? 'text-emerald-700'
                          : b.connectionStatus === 'STALE'
                          ? 'text-amber-700'
                          : 'text-rose-600'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          b.connectionStatus === 'ONLINE'
                            ? 'bg-emerald-500'
                            : b.connectionStatus === 'STALE'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}></span>
                        {b.connectionStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedBin(b)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-base text-slate-900">Provision Smart Bin</h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                ✕
              </button>
            </div>

            {deviceToken ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-slate-900">Smart Bin Created!</h5>
                <p className="text-xs text-slate-600">
                  Flash this unique hardware device token into your ESP32 firmware (<code className="font-mono text-emerald-800">X-Device-Token</code> header).
                </p>
                <div className="p-3 bg-slate-100 rounded-xl font-mono text-xs font-bold text-slate-900 break-all select-all border border-slate-200">
                  {deviceToken}
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateBin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bin Identifier *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BIN-SRG-007"
                    value={newBin.binId}
                    onChange={(e) => setNewBin({ ...newBin, binId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs uppercase font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dalgate Ghat 2 Point"
                    value={newBin.name}
                    onChange={(e) => setNewBin({ ...newBin, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ward Name</label>
                    <select
                      value={newBin.wardName}
                      onChange={(e) => setNewBin({ ...newBin, wardName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                    >
                      <option value="Lal Chowk">Lal Chowk</option>
                      <option value="Rajbagh">Rajbagh</option>
                      <option value="Hazratbal">Hazratbal</option>
                      <option value="Dalgate">Dalgate</option>
                      <option value="Soura">Soura</option>
                      <option value="Bemina">Bemina</option>
                      <option value="Karan Nagar">Karan Nagar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Depth (cm)</label>
                    <input
                      type="number"
                      required
                      value={newBin.depthCm}
                      onChange={(e) => setNewBin({ ...newBin, depthCm: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Longitude (°E)</label>
                    <input
                      type="text"
                      required
                      value={newBin.lng}
                      onChange={(e) => setNewBin({ ...newBin, lng: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Latitude (°N)</label>
                    <input
                      type="text"
                      required
                      value={newBin.lat}
                      onChange={(e) => setNewBin({ ...newBin, lat: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs"
                  >
                    {submitting ? 'Generating Token...' : 'Provision Bin'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedBin && (
        <BinDetailsModal bin={selectedBin} onClose={() => setSelectedBin(null)} />
      )}
    </div>
  );
}
