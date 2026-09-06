import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Square, 
  Clock, 
  Radio, 
  Navigation, 
  ChevronRight, 
  AlertOctagon, 
  Send, 
  FileText,
  History,
  X,
  Phone
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function DriverDashboard() {
  const { user } = useAuth() || {};
  const { socket } = useSocket() || {};

  const [activeRun, setActiveRun] = useState(null);
  const [assignedVehicle, setAssignedVehicle] = useState(null);
  const [historyRuns, setHistoryRuns] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('today');
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState('ACTIVE_RUN'); // ACTIVE_RUN or HISTORY

  // GPS Telemetry Tracking
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const watchIdRef = useRef(null);

  // Stop Action Modals
  const [collectModalStop, setCollectModalStop] = useState(null);
  const [skipModalStop, setSkipModalStop] = useState(null);
  const [collectedWeight, setCollectedWeight] = useState('');
  const [driverNotes, setDriverNotes] = useState('');
  const [skipReason, setSkipReason] = useState('Road inaccessible');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Fetch Driver Active Run & Vehicle
  const fetchDriverState = async () => {
    setLoading(true);
    try {
      const [runRes, vehRes] = await Promise.all([
        api.get('/collection-runs/active'),
        api.get('/vehicles'),
      ]);

      if (runRes.data.success) {
        setActiveRun(runRes.data.data);
      }

      if (vehRes.data.success) {
        // Find vehicle assigned to this driver
        const myVeh = vehRes.data.data.find(
          (v) => v.driverId?._id === user?._id || v.driverId === user?._id
        );
        setAssignedVehicle(myVeh || null);
      }
    } catch (err) {
      console.error('Failed to load driver state:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/collection-runs/history?timeRange=${historyFilter}`);
      if (res.data.success) {
        setHistoryRuns(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load driver history:', err);
    }
  };

  useEffect(() => {
    fetchDriverState();
  }, []);

  useEffect(() => {
    if (viewTab === 'HISTORY') {
      fetchHistory();
    }
  }, [viewTab, historyFilter]);

  // Listen for admin dispatches
  useEffect(() => {
    if (!socket) return;

    socket.on('new_route_dispatched', () => {
      setFeedback('New collection route dispatched to your vehicle!');
      fetchDriverState();
    });

    return () => {
      socket.off('new_route_dispatched');
    };
  }, [socket]);

  // Live GPS Tracking Handler
  const toggleGpsTracking = () => {
    if (gpsActive) {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      setGpsActive(false);
    } else {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      setGpsActive(true);
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, speed, heading } = position.coords;
          setGpsCoords({ latitude, longitude, speed: speed ? (speed * 3.6).toFixed(1) : 0 });

          const vehicleIdToPing = activeRun?.vehicleId?._id || assignedVehicle?._id;
          if (vehicleIdToPing) {
            try {
              await api.post('/tracking/update', {
                vehicleId: vehicleIdToPing,
                coordinates: [longitude, latitude],
                speedKmh: speed ? speed * 3.6 : 20,
                heading: heading || 0,
              });
            } catch (err) {
              // Background tracking sync
            }
          }
        },
        (error) => {
          console.warn('GPS watchPosition error:', error);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }
  };

  // Clean up GPS on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Start Collection Run
  const handleStartRun = async () => {
    if (!activeRun) return;
    try {
      const res = await api.patch(`/collection-runs/${activeRun._id}/start`);
      if (res.data.success) {
        setFeedback('Collection run activated. Drive safely!');
        fetchDriverState();
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to start run.');
    }
  };

  // Mark Stop as Collected
  const handleConfirmCollect = async (e) => {
    e.preventDefault();
    if (!collectModalStop || !activeRun) return;

    setSubmittingAction(true);
    try {
      const res = await api.patch(
        `/collection-runs/${activeRun._id}/stops/${collectModalStop.stopSequence}`,
        {
          status: 'COLLECTED',
          collectedWeightKg: collectedWeight ? parseFloat(collectedWeight) : undefined,
          driverNotes,
        }
      );

      if (res.data.success) {
        setFeedback(`Stop #${collectModalStop.stopSequence} marked as COLLECTED.`);
        setCollectModalStop(null);
        setCollectedWeight('');
        setDriverNotes('');
        fetchDriverState();
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update stop.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Mark Stop as Skipped
  const handleConfirmSkip = async (e) => {
    e.preventDefault();
    if (!skipModalStop || !activeRun) return;

    setSubmittingAction(true);
    try {
      const res = await api.patch(
        `/collection-runs/${activeRun._id}/stops/${skipModalStop.stopSequence}`,
        {
          status: 'SKIPPED',
          skipReason,
          driverNotes,
        }
      );

      if (res.data.success) {
        setFeedback(`Stop #${skipModalStop.stopSequence} marked as SKIPPED (${skipReason}).`);
        setSkipModalStop(null);
        setDriverNotes('');
        fetchDriverState();
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to skip stop.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // End Collection Run
  const handleEndRun = async () => {
    if (!activeRun) return;

    const remainingPending = activeRun.stops.filter((s) => s.status === 'PENDING').length;
    if (remainingPending > 0) {
      const confirm = window.confirm(
        `There are still ${remainingPending} uncollected stops in this run. Are you sure you want to end the collection run now?`
      );
      if (!confirm) return;
    }

    try {
      const res = await api.patch(`/collection-runs/${activeRun._id}/end`);
      if (res.data.success) {
        setFeedback('Collection run completed! Manifest archived.');
        setActiveRun(null);
        fetchDriverState();
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to end collection run.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Driver Header */}
      <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-300 mb-2">
            <Truck className="w-3.5 h-3.5" />
            <span>Driver Telematics Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Welcome, {user?.name || 'Municipal Driver'}
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Assigned Vehicle: <span className="font-mono font-bold text-emerald-400">{assignedVehicle?.plateNumber || 'No vehicle currently assigned'}</span>
          </p>
        </div>

        {/* GPS Broadcast Switch */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleGpsTracking}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
              gpsActive
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <Radio className={`w-4 h-4 ${gpsActive ? 'animate-pulse' : ''}`} />
            <span>{gpsActive ? 'Live GPS Active' : 'Enable Live GPS'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setViewTab('ACTIVE_RUN')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            viewTab === 'ACTIVE_RUN'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Active Run Manifest
        </button>
        <button
          onClick={() => setViewTab('HISTORY')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            viewTab === 'HISTORY'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Collection History
        </button>
      </div>

      {/* TAB 1: ACTIVE RUN MANIFEST */}
      {viewTab === 'ACTIVE_RUN' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Checking for assigned runs...</div>
          ) : !activeRun ? (
            <div className="p-12 rounded-3xl bg-white border border-slate-200 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">No Active Collection Run</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You currently have no active collection route assigned by the municipal dispatcher. When a new route is dispatched, it will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Run Overview Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono font-extrabold text-base text-slate-900">{activeRun.runId}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        activeRun.status === 'IN_PROGRESS'
                          ? 'bg-sky-100 text-sky-800 animate-pulse'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {activeRun.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ward: <span className="font-bold text-slate-700">{activeRun.wardName}</span> • Est: {activeRun.totalDistanceKm} km (~{activeRun.estimatedDurationMinutes} min)
                    </p>
                  </div>

                  {/* Actions: Start or End */}
                  <div className="flex items-center gap-2">
                    {activeRun.status === 'ASSIGNED' ? (
                      <button
                        onClick={handleStartRun}
                        className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Start Collection Run</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleEndRun}
                        className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-600/20 transition-all flex items-center gap-2"
                      >
                        <Square className="w-4 h-4 fill-white" />
                        <span>End Collection Run</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Stops Progress</span>
                    <span>{activeRun.completedStops || 0} of {activeRun.totalStops} Completed ({activeRun.skippedStops || 0} skipped)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${(activeRun.completedStops / activeRun.totalStops) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Waypoints Stops List */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm text-slate-900">Assigned Waypoints Sequence</h4>

                <div className="space-y-3">
                  {activeRun.stops.map((stop) => {
                    const isPending = stop.status === 'PENDING';
                    const isCollected = stop.status === 'COLLECTED';
                    const isSkipped = stop.status === 'SKIPPED';

                    return (
                      <div
                        key={stop.stopSequence}
                        className={`p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isCollected
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : isSkipped
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-2xl flex items-center justify-center font-extrabold text-xs flex-shrink-0 ${
                            isCollected
                              ? 'bg-emerald-600 text-white'
                              : isSkipped
                              ? 'bg-slate-400 text-white'
                              : 'bg-slate-900 text-white'
                          }`}>
                            #{stop.stopSequence}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">{stop.identifier}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                stop.type === 'SMART_BIN' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {stop.type === 'SMART_BIN' ? 'Smart Bin' : 'Citizen Pickup'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                stop.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {stop.priority}
                              </span>
                            </div>

                            <div className="font-semibold text-xs text-slate-800">{stop.name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{stop.address || stop.wardName}</span>
                            </div>

                            {isSkipped && (
                              <div className="text-[11px] text-rose-600 font-bold pt-1">
                                Reason: {stop.skipReason} {stop.driverNotes && `— ${stop.driverNotes}`}
                              </div>
                            )}

                            {isCollected && stop.collectedWeightKg && (
                              <div className="text-[11px] text-emerald-800 font-bold pt-1">
                                Collected: {stop.collectedWeightKg} kg
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Stop Action Buttons (Only enabled if run is in progress) */}
                        <div className="flex items-center gap-2 sm:self-center">
                          {isPending && (
                            <>
                              <button
                                onClick={() => {
                                  setCollectModalStop(stop);
                                  setCollectedWeight(stop.estimatedWeightKg || '');
                                }}
                                disabled={activeRun.status !== 'IN_PROGRESS'}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                                  activeRun.status === 'IN_PROGRESS'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                Mark Collected
                              </button>
                              <button
                                onClick={() => setSkipModalStop(stop)}
                                disabled={activeRun.status !== 'IN_PROGRESS'}
                                className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                                  activeRun.status === 'IN_PROGRESS'
                                    ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                    : 'border-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                Skip
                              </button>
                            </>
                          )}

                          {isCollected && (
                            <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100/60">
                              <CheckCircle2 className="w-4 h-4" /> Collected
                            </span>
                          )}

                          {isSkipped && (
                            <span className="text-slate-500 font-bold text-xs px-3 py-1.5 rounded-xl bg-slate-200/60">
                              Skipped
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COLLECTION HISTORY */}
      {viewTab === 'HISTORY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200">
            <h3 className="font-extrabold text-sm text-slate-900">Your Completed Runs History</h3>
            <select
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 outline-none"
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {historyRuns.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
              <History className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No completed runs in this timeframe.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyRuns.map((h) => (
                <div key={h._id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900">{h.runId}</span>
                    <span className="text-xs text-slate-500">{new Date(h.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Ward: <span className="font-bold text-slate-800">{h.wardName}</span> • Completed: {h.completedStops} / {h.totalStops} stops ({h.skippedStops || 0} skipped)
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collect Modal */}
      {collectModalStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-sm text-slate-900">
                Confirm Collection #{collectModalStop.stopSequence}
              </h4>
              <button onClick={() => setCollectModalStop(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleConfirmCollect} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Measured Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={collectedWeight}
                  onChange={(e) => setCollectedWeight(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Driver Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Bin emptied completely"
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCollectModalStop(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs"
                >
                  {submittingAction ? 'Saving...' : 'Confirm Collected'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Skip Modal */}
      {skipModalStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-sm text-slate-900">
                Skip Stop #{skipModalStop.stopSequence}
              </h4>
              <button onClick={() => setSkipModalStop(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleConfirmSkip} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Required Skip Reason *</label>
                <select
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                >
                  <option value="Road inaccessible">Road inaccessible</option>
                  <option value="Bin unavailable">Bin unavailable</option>
                  <option value="Vehicle capacity reached">Vehicle capacity reached</option>
                  <option value="Request cancelled">Request cancelled</option>
                  <option value="Location issue">Location issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Details / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Construction truck blocked alleyway"
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSkipModalStop(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs"
                >
                  {submittingAction ? 'Submitting...' : 'Confirm Skip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
