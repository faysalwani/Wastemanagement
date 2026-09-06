import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Check, 
  Filter, 
  RefreshCw 
} from 'lucide-react';
import api from '../../services/api';

export default function SmartBinAlertsTab() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [feedback, setFeedback] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get('/iot/alerts', { params });
      if (res.data.success) {
        setAlerts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load smart bin alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  const handleAcknowledge = async (id) => {
    try {
      const res = await api.patch(`/iot/alerts/${id}/acknowledge`);
      if (res.data.success) {
        setFeedback('Alert acknowledged by municipal administrator.');
        fetchAlerts();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      alert('Failed to acknowledge alert.');
    }
  };

  const handleResolve = async (id) => {
    try {
      const res = await api.patch(`/iot/alerts/${id}/resolve`);
      if (res.data.success) {
        setFeedback('Alert marked as resolved.');
        fetchAlerts();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      alert('Failed to resolve alert.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-extrabold text-base text-slate-900">IoT Hardware & Fill Threshold Alerts</h3>
          <p className="text-xs text-slate-500">
            Real-time automatic alerts generated when bins exceed 80% fill or ESP32 hardware drops offline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 outline-none"
          >
            <option value="ACTIVE">Active Alerts</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ALL">All Alerts</option>
          </select>
          <button
            onClick={fetchAlerts}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Alerts Feed */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No {statusFilter.toLowerCase()} smart bin alerts.</p>
            <p className="text-[11px] text-slate-400">All smart bins operating within nominal parameters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {alerts.map((a) => (
              <div key={a._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-xs text-slate-900">{a.binIdentifier}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      a.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : a.severity === 'HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}>
                      {a.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {a.alertType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">{a.message}</p>
                  <div className="text-[11px] text-slate-400">
                    Ward: {a.wardName} • Triggered: {new Date(a.triggeredAt).toLocaleString()}
                    {a.acknowledgedBy && <span> • Ack by: {a.acknowledgedBy.name}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {a.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleAcknowledge(a._id)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  {a.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleResolve(a._id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {a.status === 'RESOLVED' && (
                    <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Resolved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
