import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Thermometer, 
  Scale, 
  Activity, 
  Clock, 
  Radio, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';

export default function BinDetailsModal({ bin, onClose }) {
  const [history, setHistory] = useState([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bin) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const limit = timeRange === '24h' ? 12 : timeRange === '7d' ? 28 : 45;
        const res = await api.get(`/iot/bins/${bin.binId}/history?limit=${limit}`);
        if (res.data.success) {
          setHistory(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load bin sensor history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [bin, timeRange]);

  if (!bin) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">{bin.binId}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  bin.status === 'URGENT'
                    ? 'bg-rose-100 text-rose-800'
                    : bin.status === 'WARNING'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {bin.status}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  bin.connectionStatus === 'ONLINE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : bin.connectionStatus === 'STALE'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {bin.connectionStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500">{bin.name} • {bin.wardName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Live Sensor Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Fill Level</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{bin.currentFillPercent}%</div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 mt-2 overflow-hidden">
                <div
                  className={`h-full ${bin.currentFillPercent >= 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${bin.currentFillPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Gross Weight</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{bin.currentWeightKg || 0} kg</div>
              <span className="text-[10px] text-slate-500">HX711 Strain Sensor</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Temperature</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{bin.currentTemperatureC || 20}°C</div>
              <span className="text-[10px] text-slate-500">DS18B20 Probe</span>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center justify-between pt-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Sensor Telemetry History
            </h4>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              {['24h', '7d', '30d'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    timeRange === t ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Historical Telemetry Render */}
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading historical telemetry readings...</div>
          ) : history.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-600 font-semibold">Not enough historical data available.</p>
              <p className="text-[11px] text-slate-400">
                New telemetry packets from this ESP32 smart bin will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Telemetry Table */}
              <div className="overflow-x-auto max-h-56 border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Fill %</th>
                      <th className="py-2.5 px-3">Raw Distance</th>
                      <th className="py-2.5 px-3">Weight (kg)</th>
                      <th className="py-2.5 px-3">Temp (°C)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                          {new Date(r.recordedAt).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">{r.fillPercent}%</td>
                        <td className="py-2 px-3 text-slate-500">{r.rawDistanceCm} cm</td>
                        <td className="py-2 px-3 text-slate-700">{r.weightKg} kg</td>
                        <td className="py-2 px-3 text-slate-700">{r.temperatureC}°C</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs hover:bg-slate-800"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
