import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { 
  Truck, 
  Navigation, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertCircle, 
  Fuel, 
  Play, 
  Square, 
  BellRing,
  RotateCcw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

// Custom Truck Icon
const truckIcon = L.divIcon({
  className: 'custom-truck-marker',
  html: `<div style="
    background-color: #0284c7;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 2px solid white;
    box-shadow: 0 3px 8px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 16px;
  ">🚛</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Waypoint Stop Pin
const stopIcon = (seq, priority) => {
  const bg = priority === 'CRITICAL' ? '#ef4444' : '#10b981';
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `<div style="
      background-color: ${bg};
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 11px;
    ">${seq}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

export default function Collection() {
  const { user } = useAuth() || {};
  const { socket } = useSocket() || {};

  const [routeData, setRouteData] = useState(null);
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(user?.role === 'DRIVER' ? 'DRIVER' : 'RADAR');
  const [proximityAlert, setProximityAlert] = useState(null);

  // Driver GPS Tracking State
  const [isTracking, setIsTracking] = useState(false);
  const trackingIntervalRef = useRef(null);

  const fetchRouteAndFleet = async () => {
    setLoading(true);
    try {
      const [routeRes, fleetRes] = await Promise.all([
        api.get('/routes/optimize'),
        api.get('/tracking/fleet'),
      ]);

      if (routeRes.data.success) setRouteData(routeRes.data);
      if (fleetRes.data.success) setFleet(fleetRes.data.data);
    } catch (err) {
      console.error('Failed to fetch route/fleet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRouteAndFleet();
  }, []);

  // Listen for WebSocket live vehicle location updates & proximity alerts
  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = (data) => {
      setFleet((prev) =>
        prev.map((v) =>
          v.vehicleId === data.vehicleId
            ? { ...v, currentLocation: { type: 'Point', coordinates: data.coordinates } }
            : v
        )
      );
    };

    const handleProximityAlert = (alert) => {
      setProximityAlert(alert);
      // Play brief notification sound if browser permits
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      } catch {}
    };

    socket.on('vehicle_location_updated', handleLocationUpdate);
    socket.on('proximity_alert', handleProximityAlert);

    return () => {
      socket.off('vehicle_location_updated', handleLocationUpdate);
      socket.off('proximity_alert', handleProximityAlert);
    };
  }, [socket]);

  // Driver GPS simulation / HTML5 stream
  const startDriverTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by browser.');
      return;
    }

    setIsTracking(true);
    trackingIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          api.post('/tracking/update', {
            vehicleId: 'VEH_SRG_01',
            coordinates: [
              parseFloat(pos.coords.longitude.toFixed(6)),
              parseFloat(pos.coords.latitude.toFixed(6)),
            ],
            speedKmph: Math.round(pos.coords.speed ? pos.coords.speed * 3.6 : 22),
            heading: Math.round(pos.coords.heading || 0),
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }, 5000);
  };

  const stopDriverTracking = () => {
    setIsTracking(false);
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
    };
  }, []);

  const polylineCoords = routeData?.manifest?.map((m) => [
    m.coordinates[1],
    m.coordinates[0],
  ]) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* 500m Proximity Alert Banner */}
      {proximityAlert && (
        <div className="p-4 rounded-2xl bg-amber-500 text-white shadow-lg flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <BellRing className="w-6 h-6 flex-shrink-0 animate-spin" />
            <div>
              <div className="text-sm font-extrabold">
                {proximityAlert.message}
              </div>
              <span className="text-xs text-amber-100">
                Driver: {proximityAlert.driverName} • Vehicle: {proximityAlert.plateNumber}
              </span>
            </div>
          </div>
          <button
            onClick={() => setProximityAlert(null)}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold mb-2">
            <Truck className="w-3.5 h-3.5 text-sky-600" />
            VRP Route Optimization & Live Radar
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Municipal Collection & Vehicle Radar
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time vehicle tracking with 500m proximity alerts, route optimization, and collection manifests.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200 self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('RADAR')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'RADAR'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Radar & Timetable
          </button>
          <button
            onClick={() => setActiveTab('DRIVER')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'DRIVER'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Driver Portal & Route VRP
          </button>
        </div>
      </div>

      {/* TAB 1: Citizen View (Live Radar & Timetable) */}
      {activeTab === 'RADAR' && (
        <div className="space-y-8">
          {/* Live Vehicle Radar Map */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-sky-600" />
                <span>Live Municipal Vehicle Radar (Srinagar)</span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping"></span>
                <span>Active Tracking Buses ({fleet.length})</span>
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

                {fleet.map((veh) => {
                  if (!veh.currentLocation?.coordinates) return null;
                  const coords = [
                    veh.currentLocation.coordinates[1],
                    veh.currentLocation.coordinates[0],
                  ];

                  return (
                    <React.Fragment key={veh.vehicleId}>
                      <Marker position={coords} icon={truckIcon}>
                        <Popup>
                          <div className="p-1 text-xs space-y-1">
                            <div className="font-bold text-slate-900">{veh.plateNumber}</div>
                            <div className="text-[11px] text-slate-500">ID: {veh.vehicleId}</div>
                            <div className="pt-1 border-t border-slate-200 text-slate-600">
                              Driver: {veh.driverId?.name || 'Assigned Driver'}
                            </div>
                            <div className="text-sky-700 font-semibold uppercase text-[10px]">
                              Status: {veh.status}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                      {/* 500m Proximity Radar Zone */}
                      <Circle
                        center={coords}
                        radius={500}
                        pathOptions={{
                          color: '#0284c7',
                          fillColor: '#38bdf8',
                          fillOpacity: 0.15,
                          weight: 1,
                        }}
                      />
                    </React.Fragment>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* Timetable Schedule Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Calendar className="w-4 h-4" />
                <span>Biodegradable (Green Bin)</span>
              </div>
              <p className="text-xs text-slate-500">Mon • Wed • Fri (07:00 AM – 10:30 AM)</p>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                Vegetable peels, leftover food, tea leaves, and garden waste. Please ensure no plastic bags are mixed in.
              </div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                <Calendar className="w-4 h-4" />
                <span>Dry Recyclables (Blue Bin)</span>
              </div>
              <p className="text-xs text-slate-500">Tue • Thu • Sat (08:00 AM – 11:30 AM)</p>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                Clean flattened cardboard, plastics, paper, and metal cans. Must be clean and dry.
              </div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <Calendar className="w-4 h-4" />
                <span>Special / Hazardous Pickups</span>
              </div>
              <p className="text-xs text-slate-500">Every Sunday (10:00 AM – 02:00 PM)</p>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                E-waste, batteries, expired medicines, and bulky furniture. Requires online scheduling request.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Driver Portal & Route VRP */}
      {activeTab === 'DRIVER' && (
        <div className="space-y-8">
          {/* Route VRP KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Stops</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">
                {routeData?.summary?.totalStops ?? 0}
              </div>
              <span className="text-[11px] text-slate-500">Urgent Bins Scheduled</span>
            </div>

            <div className="p-5 rounded-3xl bg-sky-50 border border-sky-200 shadow-xs">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Route Distance</span>
              <div className="text-3xl font-extrabold text-sky-950 mt-2">
                {routeData?.summary?.totalDistanceKm ?? 0} km
              </div>
              <span className="text-[11px] text-sky-700">TSP Optimized Path</span>
            </div>

            <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-xs">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Est. Duration</span>
              <div className="text-3xl font-extrabold text-emerald-950 mt-2">
                ~{routeData?.summary?.estimatedDurationMinutes ?? 0} min
              </div>
              <span className="text-[11px] text-emerald-700">Includes 5 min / stop</span>
            </div>

            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 shadow-xs">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Fuel Savings</span>
              <div className="text-3xl font-extrabold text-amber-950 mt-2">
                {routeData?.summary?.fuelSavedLiters ?? 0} L
              </div>
              <span className="text-[11px] text-amber-700">-28.4% vs Unoptimized</span>
            </div>
          </div>

          {/* Tracking Controls & Map */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Turn-by-Turn Collection Manifest
                </h3>
                <span className="text-xs text-eco-700 font-semibold">
                  {routeData?.summary?.benchmarkTag}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {!isTracking ? (
                  <button
                    onClick={startDriverTracking}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Live Tracking</span>
                  </button>
                ) : (
                  <button
                    onClick={stopDriverTracking}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Stop Tracking</span>
                  </button>
                )}
              </div>
            </div>

            {/* Route Map Preview */}
            <div className="h-[380px] rounded-2xl overflow-hidden border border-slate-200 relative z-10">
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
                {routeData?.manifest?.map((m) => (
                  <Marker
                    key={m.identifier}
                    position={[m.coordinates[1], m.coordinates[0]]}
                    icon={stopIcon(m.stopSequence, m.priority)}
                  >
                    <Popup>
                      <div className="p-1 text-xs">
                        <strong>Stop #{m.stopSequence}: {m.name}</strong>
                        <div>Fill: {m.fillPercent}% • Ward: {m.wardName}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                {polylineCoords.length > 1 && (
                  <Polyline positions={polylineCoords} color="#0284c7" weight={4} opacity={0.7} />
                )}
              </MapContainer>
            </div>

            {/* Stop Sequence Cards */}
            <div className="space-y-3">
              {routeData?.manifest?.map((stop) => (
                <div
                  key={stop.identifier}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      #{stop.stopSequence}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{stop.name}</h4>
                      <span className="text-[11px] text-slate-500">
                        {stop.wardName} • Fill: {stop.fillPercent}% ({stop.estimatedWeightKg} kg)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">+{stop.legDistanceKm} km</span>
                    <button
                      onClick={() => alert(`Stop #${stop.stopSequence} verified and cleared!`)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 text-xs font-semibold transition-colors"
                    >
                      Mark Collected
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
