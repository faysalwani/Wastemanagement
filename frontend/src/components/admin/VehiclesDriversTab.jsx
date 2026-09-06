import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  User, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Clock, 
  MapPin, 
  ShieldCheck,
  Fuel
} from 'lucide-react';
import api from '../../services/api';

export default function VehiclesDriversTab() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('VEHICLES'); // VEHICLES or DRIVERS

  // New Vehicle Modal State
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    plateNumber: '',
    model: 'Tata Ace Mini Compactor',
    capacityKg: 1200,
    vehicleType: 'MINI_COMPACTOR',
    driverId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vehRes, drvRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers'),
      ]);
      if (vehRes.data.success) setVehicles(vehRes.data.data);
      if (drvRes.data.success) setDrivers(drvRes.data.data);
    } catch (err) {
      console.error('Failed to load fleet and driver data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/vehicles', {
        plateNumber: newVehicle.plateNumber,
        model: newVehicle.model,
        capacityKg: parseInt(newVehicle.capacityKg, 10),
        vehicleType: newVehicle.vehicleType,
        driverId: newVehicle.driverId || undefined,
      });

      if (res.data.success) {
        setFeedback(`Vehicle ${res.data.data.plateNumber} registered.`);
        setShowVehicleModal(false);
        setNewVehicle({
          plateNumber: '',
          model: 'Tata Ace Mini Compactor',
          capacityKg: 1200,
          vehicleType: 'MINI_COMPACTOR',
          driverId: '',
        });
        fetchData();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to register vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignDriver = async (vehicleId, driverId) => {
    try {
      const res = await api.patch(`/vehicles/${vehicleId}`, {
        driverId: driverId || null,
      });
      if (res.data.success) {
        setFeedback('Driver assignment updated.');
        fetchData();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      alert('Failed to update driver assignment.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Toggle & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('VEHICLES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'VEHICLES' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4 text-sky-600" />
            <span>Fleet Vehicles ({vehicles.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('DRIVERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'DRIVERS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-amber-600" />
            <span>Driver Directory ({drivers.length})</span>
          </button>
        </div>

        {activeSubTab === 'VEHICLES' && (
          <button
            onClick={() => setShowVehicleModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Register Fleet Vehicle</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* SUBTAB 1: VEHICLES */}
      {activeSubTab === 'VEHICLES' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading fleet inventory from MongoDB...</div>
          ) : vehicles.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Truck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No collection vehicles registered yet.</p>
              <p className="text-[11px] text-slate-400">Click "Register Fleet Vehicle" to add municipal trucks.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Registration Plate</th>
                    <th className="py-3 px-4">Model & Type</th>
                    <th className="py-3 px-4">Payload Capacity</th>
                    <th className="py-3 px-4">Assigned Driver</th>
                    <th className="py-3 px-4">Operational Status</th>
                    <th className="py-3 px-4">Last Position Ping</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                        {v.plateNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{v.model}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{v.vehicleType}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {v.capacityKg} kg
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={v.driverId?._id || ''}
                          onChange={(e) => handleAssignDriver(v._id, e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800 outline-none"
                        >
                          <option value="">Unassigned</option>
                          {drivers.map((d) => (
                            <option key={d._id} value={d._id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          v.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.status === 'COLLECTING' || v.status === 'ON_ROUTE'
                            ? 'bg-sky-100 text-sky-800 animate-pulse'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {v.currentLocation?.coordinates
                          ? `${v.currentLocation.coordinates[0]}° E, ${v.currentLocation.coordinates[1]}° N`
                          : 'Depot Base'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: DRIVERS */}
      {activeSubTab === 'DRIVERS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading driver directory from MongoDB...</div>
          ) : drivers.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <User className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No driver accounts registered in system.</p>
              <p className="text-[11px] text-slate-400">Promote a user to DRIVER in Super Admin Console.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Driver Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Home Ward</th>
                    <th className="py-3 px-4">Assigned Vehicle</th>
                    <th className="py-3 px-4">Current Run Status</th>
                    <th className="py-3 px-4">Completed Runs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drivers.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{d.name}</div>
                        <div className="text-[11px] text-slate-400">{d.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-mono">
                        {d.phone || '+91 9419000000'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {d.wardName || 'Srinagar'}
                      </td>
                      <td className="py-3.5 px-4">
                        {d.assignedVehicle ? (
                          <div className="font-bold text-slate-800">
                            🚛 {d.assignedVehicle.plateNumber}
                            <span className="text-[10px] text-slate-400 block font-normal">{d.assignedVehicle.model}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {d.activeRun ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                            Run: {d.activeRun.runId} ({d.activeRun.status})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Standby (No Active Run)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {d.completedRunsCount} runs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Register Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-base text-slate-900">Register Municipal Fleet Vehicle</h4>
              <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registration Plate Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JK-01-WM-2028"
                  value={newVehicle.plateNumber}
                  onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs uppercase font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Make & Model</label>
                <input
                  type="text"
                  required
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type</label>
                  <select
                    value={newVehicle.vehicleType}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                  >
                    <option value="MINI_COMPACTOR">Mini Compactor</option>
                    <option value="TIPPER_TRUCK">Tipper Truck</option>
                    <option value="ELECTRIC_LOADER">Electric Loader</option>
                    <option value="HEAVY_COMPACTOR">Heavy Compactor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payload Capacity (kg)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    max={10000}
                    value={newVehicle.capacityKg}
                    onChange={(e) => setNewVehicle({ ...newVehicle, capacityKg: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign Initial Driver</label>
                <select
                  value={newVehicle.driverId}
                  onChange={(e) => setNewVehicle({ ...newVehicle, driverId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                >
                  <option value="">None (Unassigned)</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs"
                >
                  {submitting ? 'Registering...' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
