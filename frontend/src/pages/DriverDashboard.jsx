import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  Navigation, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Radio, 
  Layers, 
  TrendingUp, 
  ArrowRight,
  Shield,
  Activity,
  Play,
  Square
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function DriverDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [routeData, setRouteData] = useState(null);
  const [completedStops, setCompletedStops] = useState(new Set());
  const [isTracking, setIsTracking] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [telemetryLog, setTelemetryLog] = useState([]);
  const [alertsTriggered, setAlertsTriggered] = useState(0);
  const [loading, setLoading] = useState(true);

  const watchIdRef = useRef(null);

  useEffect(() => {
    const fetchDriverRoute = async () => {
      try {
        const res = await api.get('/routes/optimize');
        if (res.data.success) {
          setRouteData(res.data);
        }
      } catch (err) {
        console.error('Failed to load VRP route manifest:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverRoute();
  }, []);

  // HTML5 Live GPS Telematics Stream
  const startLiveTracking = () => {
    if (!navigator.geolocation) {
      alert('HTML5 Geolocation is not supported by your browser.');
      return;
    }

    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { longitude, latitude, speed, heading } = pos.coords;
        const coords = [parseFloat(longitude.toFixed(6)), parseFloat(latitude.toFixed(6))];
        setCurrentCoords(coords);

        try {
          const res = await api.post('/tracking/update', {
            vehicleId: 'VEH_SRG_01',
            coordinates: coords,
            speedKmph: speed ? Math.round(speed * 3.6) : 22,
            heading: heading || 0,
          });

          if (res.data.success) {
            const count = res.data.data.proximityAlertsTriggered;
            if (count > 0) {
              setAlertsTriggered((prev) => prev + count);
            }

            setTelemetryLog((prev) => [
              {
                time: new Date().toLocaleTimeString(),
                coords,
                alerts: count,
              },
              ...prev.slice(0, 9),
            ]);
          }
        } catch (err) {
          console.warn('Live location upload failed:', err);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      }
    );
  };

  const stopLiveTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const toggleStopCompleted = (stopSeq) => {
    setCompletedStops((prev) => {
      const next = new Set(prev);
      if (next.has(stopSeq)) {
        next.delete(stopSeq);
      } else {
        next.add(stopSeq);
      }
      return next;
    });
  };

  const stops = routeData?.manifest || [];
  const completedCount = completedStops.size;
  const progressPercent = stops.length > 0 ? Math.round((completedCount / stops.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-slate-900 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-xs font-semibold text-amber-300">
            <Truck className="w-3.5 h-3.5" />
            <span>Driver Logistics Console</span>
            <span>•</span>
            <span>Vehicle: VEH_SRG_01 (Tata Ace Mini Compactor)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name || 'Driver'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Stream live GPS breadcrumbs, view your VRP-optimized route manifest, and automatically alert citizens within 500m.
          </p>
        </div>

        {/* Live GPS Broadcast Switch */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {!isTracking ? (
            <button
              onClick={startLiveTracking}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-transform hover:scale-105"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Collection Run</span>
            </button>
          ) : (
            <button
              onClick={stopLiveTracking}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-transform hover:scale-105"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>End Collection Run</span>
            </button>
          )}
        </div>
      </div>

      {/* Operational Telematics Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live GPS Status</span>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isTracking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
            <span>{isTracking ? 'Broadcasting' : 'Standby'}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {currentCoords ? `${currentCoords[0]}° E, ${currentCoords[1]}° N` : 'GPS Inactive'}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Route Progress</span>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-2">
            {completedCount} / {stops.length} Stops
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Distance Optimized</span>
          <div className="text-xl sm:text-2xl font-extrabold text-sky-700 mt-2">
            {routeData?.summary?.totalDistanceKm ?? 20.2} km
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            -28.4% fuel saved (VRP)
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Citizen Proximity Alerts</span>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-2">
            {alertsTriggered}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Within 500m radius</span>
        </div>
      </div>

      {/* Main Content: Turn-by-Turn Manifest & Telematics Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Manifest (2 Columns) */}
        <div className="lg:col-span-2 p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Today's Optimized Route Manifest</h3>
              <p className="text-xs text-slate-500">
                Algorithm: {routeData?.summary?.algorithm || 'TSP Nearest-Neighbor + 2-Opt'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              {progressPercent}% Complete
            </span>
          </div>

          <div className="space-y-3">
            {stops.map((stop) => {
              const isDone = completedStops.has(stop.stopSequence);
              return (
                <div
                  key={stop.identifier}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    isDone
                      ? 'bg-emerald-50/50 border-emerald-200 opacity-70'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleStopCompleted(stop.stopSequence)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                        isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-emerald-100'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : `#${stop.stopSequence}`}
                    </button>
                    <div>
                      <span className={`font-bold text-xs block ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {stop.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {stop.wardName} • Fill: {stop.fillPercent}% • Est. Weight: {stop.estimatedWeightKg} kg
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div className="text-[11px] font-semibold text-slate-600">
                      +{stop.legDistanceKm} km
                    </div>
                    <button
                      onClick={() => toggleStopCompleted(stop.stopSequence)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xs'
                      }`}
                    >
                      {isDone ? 'Completed' : 'Mark Collected'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Telematics Log (1 Column) */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Live Telematics Breadcrumbs</h3>
            <p className="text-[11px] text-slate-500">Real-time WebSocket telemetry stream</p>
          </div>

          {!isTracking ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
              <Radio className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 font-semibold">GPS Stream Off</p>
              <p className="text-[11px] text-slate-400">
                Click "Start Collection Run" to begin broadcasting live vehicle coordinates.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {telemetryLog.map((log, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-mono text-slate-700 font-bold block">{log.time}</span>
                    <span className="text-slate-400">{log.coords[0]}, {log.coords[1]}</span>
                  </div>
                  {log.alerts > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      +{log.alerts} Alerted
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">Pinging</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
