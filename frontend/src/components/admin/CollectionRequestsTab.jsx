import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Truck, 
  User, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Filter,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';

export default function CollectionRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal State for Assigning Request
  const [selectedReq, setSelectedReq] = useState(null);
  const [assignData, setAssignData] = useState({
    vehicleId: '',
    driverId: '',
    scheduledDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (typeFilter !== 'ALL') params.requestType = typeFilter;

      const [reqsRes, vehRes, drvRes] = await Promise.all([
        api.get('/collection-requests', { params }),
        api.get('/vehicles'),
        api.get('/drivers'),
      ]);

      if (reqsRes.data.success) setRequests(reqsRes.data.data);
      if (vehRes.data.success) setVehicles(vehRes.data.data);
      if (drvRes.data.success) setDrivers(drvRes.data.data);
    } catch (err) {
      console.error('Failed to load collection requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, typeFilter]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;
    setSubmitting(true);
    try {
      const res = await api.patch(`/collection-requests/${selectedReq._id}/status`, {
        status: 'ASSIGNED',
        assignedVehicleId: assignData.vehicleId || undefined,
        assignedDriverId: assignData.driverId || undefined,
        scheduledDate: assignData.scheduledDate || undefined,
      });

      if (res.data.success) {
        setFeedback(`Request assigned to collection fleet.`);
        setSelectedReq(null);
        fetchRequests();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update request assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatus = async (reqId, newStatus) => {
    try {
      const res = await api.patch(`/collection-requests/${reqId}/status`, {
        status: newStatus,
      });
      if (res.data.success) {
        setFeedback(`Request status updated to ${newStatus}.`);
        fetchRequests();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update request.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-extrabold text-base text-slate-900">Municipal Collection Requests</h3>
          <p className="text-xs text-slate-500">
            Review citizen on-demand pickups and community special-event waste clearances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="REQUESTED">Requested (New)</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="ON_DEMAND">On-Demand</option>
            <option value="EVENT">Special Event</option>
          </select>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading collection requests from database...</div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No collection requests match your filters.</p>
            <p className="text-[11px] text-slate-400">New citizen requests will appear here in real-time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Citizen & Ward</th>
                  <th className="py-3 px-4">Type & Waste Category</th>
                  <th className="py-3 px-4">Est. Volume</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Assignment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{r.userId?.name || 'Citizen'}</div>
                      <div className="text-[11px] text-slate-500">{r.wardName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {r.requestType === 'EVENT' ? '🎪 Special Event' : '📦 On-Demand'}
                      </div>
                      <div className="text-[11px] text-slate-500">{r.category}</div>
                      {r.eventDetails?.eventName && (
                        <span className="text-[10px] text-purple-700 font-bold block">{r.eventDetails.eventName}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {r.estimatedVolumeKg} kg
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                      {r.pickupAddress}
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      {r.assignedDriverId ? (
                        <div>
                          <span className="font-bold text-slate-800 block">👤 {r.assignedDriverId.name}</span>
                          <span className="text-slate-500">🚛 {r.assignedVehicleId?.plateNumber || 'Fleet Vehicle'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        r.status === 'REQUESTED'
                          ? 'bg-amber-100 text-amber-800'
                          : r.status === 'ASSIGNED'
                          ? 'bg-indigo-100 text-indigo-800'
                          : r.status === 'IN_PROGRESS'
                          ? 'bg-sky-100 text-sky-800'
                          : r.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.status === 'REQUESTED' && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedReq(r);
                              setAssignData({
                                vehicleId: vehicles[0]?._id || '',
                                driverId: drivers[0]?._id || '',
                                scheduledDate: '',
                              });
                            }}
                            className="px-3 py-1 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-2xs"
                          >
                            Assign
                          </button>
                          <button
                            onClick={() => handleQuickStatus(r._id, 'CANCELLED')}
                            className="px-2.5 py-1 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {r.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleQuickStatus(r._id, 'COMPLETED')}
                          className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-2xs"
                        >
                          Mark Completed
                        </button>
                      )}
                      {r.status === 'COMPLETED' && (
                        <span className="text-emerald-700 font-bold text-[11px] flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Fulfilled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-base text-slate-900">Assign Request to Fleet</h4>
              <button onClick={() => setSelectedReq(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div><span className="font-bold text-slate-800">Citizen:</span> {selectedReq.userId?.name}</div>
              <div><span className="font-bold text-slate-800">Ward:</span> {selectedReq.wardName}</div>
              <div><span className="font-bold text-slate-800">Estimated Load:</span> {selectedReq.estimatedVolumeKg} kg ({selectedReq.category})</div>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign Collection Vehicle *</label>
                <select
                  required
                  value={assignData.vehicleId}
                  onChange={(e) => setAssignData({ ...assignData, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.plateNumber} — {v.model} ({v.capacityKg} kg capacity)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign Driver *</label>
                <select
                  required
                  value={assignData.driverId}
                  onChange={(e) => setAssignData({ ...assignData, driverId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                >
                  <option value="">Select driver...</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.phone || d.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Date</label>
                <input
                  type="date"
                  value={assignData.scheduledDate}
                  onChange={(e) => setAssignData({ ...assignData, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs"
                >
                  {submitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
