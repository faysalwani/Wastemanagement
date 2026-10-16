import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Play,
  Square,
  Clock,
  Radio,
  History,
  X,
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

  // Real GPS Telemetry Tracking
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

  useEffect(() => {
    if (!socket) return;

    socket.on('new_route_dispatched', () => {
      setFeedback('New collection route assigned to your vehicle.');
      fetchDriverState();
    });

    return () => {
      socket.off('new_route_dispatched');
    };
  }, [socket]);

  // Real Browser Geolocation GPS Handler
  const toggleGpsTracking = () => {
    if (gpsActive) {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      setGpsActive(false);
    } else {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported on this device.');
        return;
      }
      setGpsActive(true);
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, speed, heading } = position.coords;
          setGpsCoords({
            latitude: latitude.toFixed(5),
            longitude: longitude.toFixed(5),
            speed: speed ? (speed * 3.6).toFixed(1) : 0,
          });

          const vehicleIdToPing = activeRun?.vehicleId?._id || assignedVehicle?._id;
          if (vehicleIdToPing) {
            try {
              await api.post('/tracking/update', {
                vehicleId: vehicleIdToPing,
                coordinates: [longitude, latitude],
                speedKmh: speed ? speed * 3.6 : 20,
                heading: heading || 0,
              });
            } catch {
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

  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const handleStartRun = async () => {
    if (!activeRun) return;
    try {
      const res = await api.patch(`/collection-runs/${activeRun._id}/start`);
      if (res.data.success) {
        setFeedback('Route started. Safe driving!');
        fetchDriverState();
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to start route.');
    }
  };

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
        setFeedback(`Stop #${collectModalStop.stopSequence} marked as collected.`);
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
        setFeedback(`Stop #${skipModalStop.stopSequence} skipped (${skipReason}).`);
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

  const handleEndRun = async () => {
    if (!activeRun) return;

    const remainingPending = activeRun.stops.filter((s) => s.status === 'PENDING').length;
    if (remainingPending > 0) {
      const confirm = window.confirm(
        `There are still ${remainingPending} uncollected stops on your route. End the route now?`
      );
      if (!confirm) return;
    }

    try {
      const res = await api.patch(`/collection-runs/${activeRun._id}/end`);
      if (res.data.success) {
        setFeedback('Route completed and saved.');
        setActiveRun(null);
        fetchDriverState();
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to end route.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Driver Status Card — High Contrast Outdoor Layout */}
      <div className="p-6 bg-[#26372B] rounded-3xl text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#E5F4E8]">
            <Truck className="w-4 h-4 text-[#84D19B]" />
            <span>Clear Waste Driver Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight pt-1">
            {user?.name || 'Collection Driver'}
          </h1>
          <div className="text-sm text-[#E5F4E8]/90 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              Vehicle:{' '}
              <strong className="font-mono text-white">
                {assignedVehicle?.plateNumber || 'Unassigned'}
              </strong>
            </span>
            {assignedVehicle?.status && (
              <span>
                Status: <strong className="text-[#84D19B]">{assignedVehicle.status}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Large Touch-Friendly GPS Button */}
        <div className="flex flex-col sm:items-end gap-1.5">
          <button
            type="button"
            onClick={toggleGpsTracking}
            className={`min-h-[48px] px-5 py-3 rounded-2xl text-sm font-extrabold transition-colors flex items-center justify-center gap-2.5 shadow-xs ${
              gpsActive
                ? 'bg-[#21834A] text-white border border-[#84D19B]/40'
                : 'bg-white text-[#26372B] hover:bg-[#E5F4E8]'
            }`}
          >
            <Radio className={`w-4 h-4 ${gpsActive ? 'animate-pulse' : 'text-[#21834A]'}`} />
            <span>{gpsActive ? 'GPS Broadcasting On' : 'Turn On Live GPS'}</span>
          </button>
          {gpsActive && gpsCoords && (
            <span className="text-xs text-[#E5F4E8]/80 font-mono">
              {gpsCoords.latitude}° N, {gpsCoords.longitude}° E
            </span>
          )}
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-[#E5F4E8] border border-[#BCE0C6] text-sm font-bold text-[#1A693B] flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#21834A] flex-shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Touch-Friendly View Switcher */}
      <div className="grid grid-cols-2 gap-3 p-1.5 bg-white rounded-2xl border border-[#DCE6DF]">
        <button
          type="button"
          onClick={() => setViewTab('ACTIVE_RUN')}
          className={`min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-bold transition-colors ${
            viewTab === 'ACTIVE_RUN'
              ? 'bg-[#21834A] text-white shadow-xs'
              : 'text-[#526356] hover:text-[#26372B]'
          }`}
        >
          Current Assignment
        </button>
        <button
          type="button"
          onClick={() => setViewTab('HISTORY')}
          className={`min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-bold transition-colors ${
            viewTab === 'HISTORY'
              ? 'bg-[#21834A] text-white shadow-xs'
              : 'text-[#526356] hover:text-[#26372B]'
          }`}
        >
          Past Routes
        </button>
      </div>

      {/* TAB 1: CURRENT ASSIGNMENT */}
      {viewTab === 'ACTIVE_RUN' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-16 text-center text-sm text-[#526356] bg-white rounded-3xl border border-[#DCE6DF]">
              Loading your current assignment...
            </div>
          ) : !activeRun ? (
            <div className="p-12 rounded-3xl bg-white border border-[#DCE6DF] text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E5F4E8] text-[#21834A] flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h2 className="font-extrabold text-lg text-[#26372B]">No Active Route Assigned</h2>
              <p className="text-sm text-[#526356] max-w-md mx-auto">
                You do not have an active route right now. When operations dispatch a new route to your truck, it will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Assignment Summary & Primary Start/End Button */}
              <div className="p-6 rounded-3xl bg-white border border-[#DCE6DF] shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE6DF]">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="font-mono font-extrabold text-lg text-[#26372B]">
                        {activeRun.runId}
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                          activeRun.status === 'IN_PROGRESS'
                            ? 'bg-[#E5F4E8] text-[#1A693B]'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {activeRun.status === 'IN_PROGRESS' ? 'In Progress' : 'Ready to Start'}
                      </span>
                    </div>
                    <p className="text-sm text-[#526356] mt-1">
                      Area: <strong className="text-[#26372B]">{activeRun.wardName}</strong> •{' '}
                      {activeRun.totalDistanceKm} km (~{activeRun.estimatedDurationMinutes} mins)
                    </p>
                  </div>

                  {/* Large Touch Action */}
                  <div>
                    {activeRun.status === 'ASSIGNED' ? (
                      <button
                        type="button"
                        onClick={handleStartRun}
                        className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-2xl bg-[#21834A] hover:bg-[#1A693B] text-white text-sm font-extrabold shadow-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Start Route</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleEndRun}
                        className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-extrabold shadow-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <Square className="w-4 h-4 fill-white" />
                        <span>Finish Route</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-bold text-[#26372B]">
                    <span>Route Progress</span>
                    <span>
                      {activeRun.completedStops || 0} of {activeRun.totalStops} stops completed
                      {activeRun.skippedStops > 0 && ` (${activeRun.skippedStops} skipped)`}
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#F8FAF8] border border-[#DCE6DF] overflow-hidden">
                    <div
                      className="h-full bg-[#21834A] transition-all duration-300"
                      style={{
                        width: `${Math.round(
                          ((activeRun.completedStops || 0) / (activeRun.totalStops || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Route Stops List */}
              <div className="space-y-3">
                <h3 className="font-bold text-base text-[#26372B] px-1">
                  Assigned Pickup Stops ({activeRun.stops.length})
                </h3>

                <div className="space-y-3">
                  {activeRun.stops.map((stop) => {
                    const isPending = stop.status === 'PENDING';
                    const isCollected = stop.status === 'COLLECTED';
                    const isSkipped = stop.status === 'SKIPPED';

                    return (
                      <div
                        key={stop.stopSequence}
                        className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isCollected
                            ? 'bg-[#E5F4E8]/50 border-[#BCE0C6]'
                            : isSkipped
                            ? 'bg-slate-50 border-slate-200 opacity-75'
                            : 'bg-white border-[#DCE6DF] shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm flex-shrink-0 ${
                              isCollected
                                ? 'bg-[#21834A] text-white'
                                : isSkipped
                                ? 'bg-slate-400 text-white'
                                : 'bg-[#26372B] text-white'
                            }`}
                          >
                            #{stop.stopSequence}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-base text-[#26372B]">
                                {stop.name}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-lg bg-[#F8FAF8] border border-[#DCE6DF] text-[#26372B] text-xs font-bold">
                                {stop.type === 'SMART_BIN' ? 'Public Bin' : 'Citizen Pickup'}
                              </span>
                              {stop.priority === 'CRITICAL' && (
                                <span className="px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold">
                                  Urgent
                                </span>
                              )}
                            </div>

                            <div className="text-sm text-[#526356] flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-[#21834A] flex-shrink-0" />
                              <span>{stop.address || stop.wardName}</span>
                            </div>

                            {isSkipped && (
                              <div className="text-xs text-rose-700 font-bold pt-1">
                                Skipped: {stop.skipReason}{' '}
                                {stop.driverNotes && `— ${stop.driverNotes}`}
                              </div>
                            )}

                            {isCollected && stop.collectedWeightKg && (
                              <div className="text-xs text-[#1A693B] font-bold pt-1">
                                Weight recorded: {stop.collectedWeightKg} kg
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Large Touch Stop Buttons */}
                        <div className="flex items-center gap-2.5 sm:self-center">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setCollectModalStop(stop);
                                  setCollectedWeight(stop.estimatedWeightKg || '');
                                }}
                                disabled={activeRun.status !== 'IN_PROGRESS'}
                                className={`flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                                  activeRun.status === 'IN_PROGRESS'
                                    ? 'bg-[#21834A] hover:bg-[#1A693B] text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                Confirm Pickup
                              </button>
                              <button
                                type="button"
                                onClick={() => setSkipModalStop(stop)}
                                disabled={activeRun.status !== 'IN_PROGRESS'}
                                className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-colors ${
                                  activeRun.status === 'IN_PROGRESS'
                                    ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                    : 'border-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                Skip
                              </button>
                            </>
                          )}

                          {isCollected && (
                            <span className="text-[#1A693B] font-bold text-xs sm:text-sm flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E5F4E8]">
                              <CheckCircle2 className="w-4 h-4 text-[#21834A]" /> Collected
                            </span>
                          )}

                          {isSkipped && (
                            <span className="text-slate-600 font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-slate-200/70">
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

      {/* TAB 2: PAST ROUTES */}
      {viewTab === 'HISTORY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#DCE6DF]">
            <h2 className="font-bold text-sm sm:text-base text-[#26372B]">Completed Routes</h2>
            <select
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-xs sm:text-sm font-semibold bg-[#F8FAF8] text-[#26372B] outline-none"
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {historyRuns.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-[#DCE6DF] text-center space-y-2">
              <History className="w-8 h-8 text-[#526356]/50 mx-auto" />
              <p className="text-sm font-semibold text-[#526356]">
                No completed routes for this period.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyRuns.map((h) => (
                <div
                  key={h._id}
                  className="p-5 rounded-2xl bg-white border border-[#DCE6DF] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-[#26372B]">{h.runId}</span>
                    <span className="text-xs text-[#526356]">
                      {new Date(h.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-[#526356]">
                    Area: <strong className="text-[#26372B]">{h.wardName}</strong> • Completed:{' '}
                    {h.completedStops} / {h.totalStops} stops
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm Pickup Modal */}
      {collectModalStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#DCE6DF] shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE6DF]">
              <h3 className="font-bold text-base text-[#26372B]">
                Confirm Pickup #{collectModalStop.stopSequence}
              </h3>
              <button
                type="button"
                onClick={() => setCollectModalStop(null)}
                className="p-1 text-[#526356] hover:text-[#26372B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCollect} className="space-y-4">
              <div>
                <label htmlFor="collect-weight" className="block text-sm font-semibold text-[#26372B] mb-1">
                  Collected weight (kg)
                </label>
                <input
                  id="collect-weight"
                  type="number"
                  step="0.1"
                  required
                  value={collectedWeight}
                  onChange={(e) => setCollectedWeight(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm outline-none focus:border-[#21834A]"
                />
              </div>

              <div>
                <label htmlFor="collect-notes" className="block text-sm font-semibold text-[#26372B] mb-1">
                  Notes (optional)
                </label>
                <input
                  id="collect-notes"
                  type="text"
                  placeholder="e.g. Emptied completely"
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm outline-none focus:border-[#21834A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCollectModalStop(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#DCE6DF] text-xs font-bold text-[#526356]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2.5 rounded-xl bg-[#21834A] hover:bg-[#1A693B] text-white text-xs font-bold shadow-xs"
                >
                  {submittingAction ? 'Saving...' : 'Confirm Pickup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Skip Stop Modal */}
      {skipModalStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-[#DCE6DF] shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE6DF]">
              <h3 className="font-bold text-base text-[#26372B]">
                Skip Stop #{skipModalStop.stopSequence}
              </h3>
              <button
                type="button"
                onClick={() => setSkipModalStop(null)}
                className="p-1 text-[#526356] hover:text-[#26372B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSkip} className="space-y-4">
              <div>
                <label htmlFor="skip-reason" className="block text-sm font-semibold text-[#26372B] mb-1">
                  Reason for skipping
                </label>
                <select
                  id="skip-reason"
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm bg-white outline-none focus:border-[#21834A]"
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
                <label htmlFor="skip-notes" className="block text-sm font-semibold text-[#26372B] mb-1">
                  Additional details
                </label>
                <input
                  id="skip-notes"
                  type="text"
                  placeholder="e.g. Street blocked by roadwork"
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm outline-none focus:border-[#21834A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSkipModalStop(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#DCE6DF] text-xs font-bold text-[#526356]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
                >
                  {submittingAction ? 'Saving...' : 'Confirm Skip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
