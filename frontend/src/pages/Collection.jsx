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
  ShieldCheck,
  Radio,
  Layers,
  Send,
  Trash2,
  CalendarDays,
  Plus
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

// Safe Leaflet Icons
const createTruckIcon = () => {
  try {
    return L.divIcon({
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
  } catch {
    return null;
  }
};

const createStopIcon = (seq, priority) => {
  try {
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
  } catch {
    return null;
  }
};

export default function Collection() {
  const { user } = useAuth() || {};
  const { socket } = useSocket() || {};

  const [routeData, setRouteData] = useState(null);
  const [fleet, setFleet] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('RADAR'); // RADAR, CALENDAR, REQUEST, MY_REQUESTS, DRIVER
  const [proximityAlert, setProximityAlert] = useState(null);

  // Driver GPS Tracking State
  const [isTracking, setIsTracking] = useState(false);
  const trackingIntervalRef = useRef(null);

  // Citizen Collection Request State
  const [requestType, setRequestType] = useState('ON_DEMAND'); // ON_DEMAND or EVENT
  const [category, setCategory] = useState('RECYCLABLE');
  const [estimatedVolumeKg, setEstimatedVolumeKg] = useState('5');
  const [pickupAddress, setPickupAddress] = useState(user?.address || '');
  const [wardName, setWardName] = useState(user?.wardName || 'Rajbagh');
  const [description, setDescription] = useState('');
  const [eventDetails, setEventDetails] = useState({
    eventName: '',
    eventDate: '',
    expectedAttendees: '',
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState(null);

  // My Requests State
  const [myRequests, setMyRequests] = useState([]);
  const [loadingMyRequests, setLoadingMyRequests] = useState(false);

  const fetchRouteAndFleet = async () => {
    setLoading(true);
    try {
      const [routeRes, fleetRes, schedRes] = await Promise.all([
        api.get('/routes/optimize').catch(() => ({ data: { success: false } })),
        api.get('/tracking/fleet').catch(() => ({ data: { success: false } })),
        api.get('/collection-schedules').catch(() => ({ data: { success: false } })),
      ]);

      if (routeRes.data?.success) setRouteData(routeRes.data);
      if (fleetRes.data?.success && Array.isArray(fleetRes.data.data)) {
        setFleet(fleetRes.data.data);
      }
      if (schedRes.data?.success && Array.isArray(schedRes.data.data)) {
        setSchedules(schedRes.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch collection data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    if (!user) return;
    setLoadingMyRequests(true);
    try {
      const res = await api.get('/collection-requests/my');
      if (res.data?.success) {
        setMyRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch my requests:', err);
    } finally {
      setLoadingMyRequests(false);
    }
  };

  useEffect(() => {
    fetchRouteAndFleet();
    fetchMyRequests();
  }, []);

  // Filter valid fleet vehicles with valid coordinates [lng, lat]
  const validVehicles = (Array.isArray(fleet) ? fleet : []).filter((v) => {
    const coords = v?.currentLocation?.coordinates;
    return (
      Array.isArray(coords) &&
      coords.length >= 2 &&
      typeof coords[0] === 'number' &&
      typeof coords[1] === 'number' &&
      !isNaN(coords[0]) &&
      !isNaN(coords[1])
    );
  });

  // Calculate proximity to citizen's coordinates
  const userCoords =
    user?.location?.coordinates &&
    Array.isArray(user.location.coordinates) &&
    user.location.coordinates.length >= 2
      ? user.location.coordinates
      : [74.7973, 34.0837];

  const calculateDistanceMeters = (coord1, coord2) => {
    if (!coord1 || !coord2) return Infinity;
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    if (isNaN(lon1) || isNaN(lat1) || isNaN(lon2) || isNaN(lat2)) return Infinity;

    const R = 6371e3; // Earth radius in metres
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  let nearestVehicleDist = Infinity;
  let nearestVehicle = null;

  validVehicles.forEach((v) => {
    const distM = calculateDistanceMeters(userCoords, v.currentLocation.coordinates);
    if (!isNaN(distM) && distM < nearestVehicleDist) {
      nearestVehicleDist = distM;
      nearestVehicle = v;
    }
  });

  // WebSocket Live Fleet updates
  useEffect(() => {
    if (!socket) return;

    const handleFleetUpdate = (data) => {
      setFleet((prevFleet) => {
        const existingIdx = prevFleet.findIndex(
          (veh) => veh.vehicleId === data.vehicleId || veh._id === data.vehicleId
        );
        if (existingIdx !== -1) {
          const updated = [...prevFleet];
          updated[existingIdx] = {
            ...updated[existingIdx],
            currentLocation: data.location,
            speedKmh: data.speedKmh,
            heading: data.heading,
            batteryPercent: data.batteryPercent,
            lastSeen: new Date(),
          };
          return updated;
        }
        return prevFleet;
      });
    };

    const handleProximity = (data) => {
      setProximityAlert(data);
    };

    socket.on('vehicle_location_updated', handleFleetUpdate);
    socket.on('vehicle_proximity_alert', handleProximity);

    return () => {
      socket.off('vehicle_location_updated', handleFleetUpdate);
      socket.off('vehicle_proximity_alert', handleProximity);
    };
  }, [socket]);

  // Clean Driver Simulation/Broadcast
  const startDriverTracking = () => {
    setIsTracking(true);
    let step = 0;
    const baseCoords = [74.7973, 34.0837];

    trackingIntervalRef.current = setInterval(async () => {
      step += 1;
      const latOffset = Math.sin(step * 0.1) * 0.005;
      const lngOffset = Math.cos(step * 0.1) * 0.005;
      const simCoords = [baseCoords[0] + lngOffset, baseCoords[1] + latOffset];

      try {
        await api.post('/tracking/update', {
          vehicleId: 'JK-01-WM-2026',
          coordinates: simCoords,
          speedKmh: 24.5,
          heading: (step * 15) % 360,
          batteryPercent: 92,
        });
      } catch {
        // Ignore broadcast drops
      }
    }, 4000);
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

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to submit a collection request.');
      return;
    }

    setSubmittingRequest(true);
    setRequestFeedback(null);

    try {
      const res = await api.post('/collection-requests', {
        requestType,
        category,
        estimatedVolumeKg: parseFloat(estimatedVolumeKg) || 5,
        pickupAddress: pickupAddress.trim(),
        wardName: wardName.trim(),
        description: description.trim(),
        eventDetails: requestType === 'EVENT' ? eventDetails : undefined,
      });

      if (res.data.success) {
        setRequestFeedback({
          type: 'success',
          message: `${requestType === 'EVENT' ? 'Special Event' : 'On-Demand'} collection request registered successfully!`,
        });
        setDescription('');
        if (requestType === 'EVENT') {
          setEventDetails({ eventName: '', eventDate: '', expectedAttendees: '' });
        }
        fetchMyRequests();
      }
    } catch (err) {
      setRequestFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Failed to submit collection request.',
      });
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this collection request?')) return;
    try {
      await api.delete(`/collection-requests/${requestId}`);
      fetchMyRequests();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to cancel request.');
    }
  };

  const truckIcon = createTruckIcon();

  const safeManifest = (routeData?.manifest || []).filter(
    (m) =>
      m &&
      Array.isArray(m.coordinates) &&
      m.coordinates.length >= 2 &&
      typeof m.coordinates[0] === 'number' &&
      typeof m.coordinates[1] === 'number' &&
      !isNaN(m.coordinates[0]) &&
      !isNaN(m.coordinates[1])
  );

  const polylineCoords = safeManifest.map((m) => [m.coordinates[1], m.coordinates[0]]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* 500m Audio-Visual Proximity Notification Banner */}
      {proximityAlert && (
        <div className="p-4 rounded-2xl bg-amber-500 text-white shadow-lg flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <BellRing className="w-6 h-6 flex-shrink-0 animate-spin" />
            <div>
              <div className="text-sm font-extrabold">{proximityAlert.message}</div>
              <span className="text-xs text-amber-100">
                Driver: {proximityAlert.driverName} • Vehicle: {proximityAlert.plateNumber}
              </span>
            </div>
          </div>
          <button
            type="button"
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
            Municipal Fleet Tracking & Ward Logistics
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Municipal Collection & Vehicle Radar
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Track live collection trucks, review ward collection calendars, and request on-demand waste pickups.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('RADAR')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'RADAR'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Radar
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CALENDAR')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'CALENDAR'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Collection Calendar
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REQUEST')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'REQUEST'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Request Pickup
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('MY_REQUESTS');
              fetchMyRequests();
            }}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'MY_REQUESTS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Requests ({myRequests.length})
          </button>

          {user && (user.role === 'DRIVER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
            <button
              type="button"
              onClick={() => setActiveTab('DRIVER')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'DRIVER'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Driver Portal
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Live Radar */}
      {activeTab === 'RADAR' && (
        <div className="space-y-8">
          {/* 500m Proximity Radar Banner */}
          <div className={`p-5 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
            nearestVehicleDist <= 500
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-start sm:items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                nearestVehicleDist <= 500
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm">
                  {nearestVehicleDist <= 500
                    ? `Collection Vehicle Approaching! (~${nearestVehicleDist}m away)`
                    : 'No collection vehicle is currently nearby.'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {nearestVehicleDist <= 500
                    ? `Municipal truck ${nearestVehicle?.plateNumber || ''} is within 500 meters of your registered area. Please keep segregated dry/wet bins ready.`
                    : nearestVehicleDist < Infinity
                    ? `Nearest active municipal vehicle is approx. ${(nearestVehicleDist / 1000).toFixed(1)} km away.`
                    : 'No collection vehicles are actively broadcasting GPS coordinates at this moment.'}
                </p>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                nearestVehicleDist <= 500
                  ? 'bg-emerald-200/80 text-emerald-900'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                <span className={`w-2 h-2 rounded-full ${nearestVehicleDist <= 500 ? 'bg-emerald-600 animate-ping' : 'bg-slate-400'}`} />
                <span>{nearestVehicleDist <= 500 ? '500m In-Range Alert' : 'Radar Standby'}</span>
              </span>
            </div>
          </div>

          {/* Live Vehicle Radar Map */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-sky-600" />
                <span>Live Municipal Vehicle Radar (Srinagar)</span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping" />
                <span>Active Tracking Trucks ({validVehicles.length})</span>
              </div>
            </div>

            <div className="h-[460px] rounded-2xl overflow-hidden border border-slate-200 relative z-10">
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

                {validVehicles.map((veh) => {
                  const coords = [veh.currentLocation.coordinates[1], veh.currentLocation.coordinates[0]];
                  return (
                    <Marker
                      key={`marker-${veh.vehicleId || veh._id}`}
                      position={coords}
                      icon={truckIcon || undefined}
                    >
                      <Popup>
                        <div className="p-1 text-xs space-y-1">
                          <div className="font-bold text-slate-900">{veh.plateNumber || 'Municipal Vehicle'}</div>
                          <div className="text-[11px] text-slate-500">ID: {veh.vehicleId || veh._id}</div>
                          <div className="pt-1 border-t border-slate-200 text-slate-600">
                            Driver: {veh.driverId?.name || 'Assigned Sweeper'}
                          </div>
                          <div className="text-sky-700 font-semibold uppercase text-[10px]">
                            Status: {veh.status || 'ACTIVE'}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {validVehicles.map((veh) => {
                  const coords = [veh.currentLocation.coordinates[1], veh.currentLocation.coordinates[0]];
                  return (
                    <Circle
                      key={`circle-${veh.vehicleId || veh._id}`}
                      center={coords}
                      radius={500}
                      pathOptions={{
                        color: '#0284c7',
                        fillColor: '#38bdf8',
                        fillOpacity: 0.15,
                        weight: 1,
                      }}
                    />
                  );
                })}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Collection Calendar */}
      {activeTab === 'CALENDAR' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Ward Waste Collection Timetables</h3>
              <p className="text-xs text-slate-500">Official Srinagar Municipal Corporation scheduled sweeps.</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {schedules.length} Active Wards
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {schedules.length > 0 ? (
              schedules.map((sch) => (
                <div key={sch._id} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-sm text-slate-900">{sch.wardName}</div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                      {(sch.wasteType || 'MIXED').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold">
                    {sch.daysOfWeek?.join(' • ') || 'Daily'}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sch.startTime || '07:00 AM'} – {sch.endTime || '11:00 AM'}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    Assigned Vehicle: <span className="font-semibold text-slate-800">{sch.vehicleId?.plateNumber || 'Municipal Sweeper'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
                No ward schedules configured.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Request Pickup */}
      {activeTab === 'REQUEST' && (
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-sky-600" />
              <span>Submit Waste Collection Request</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Request on-demand municipal pickup for excess household waste or book a special event sweep.
            </p>
          </div>

          {requestFeedback && (
            <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              requestFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}>
              {requestFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{requestFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleCreateRequest} className="space-y-4">
            {/* Request Type Switcher */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Request Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRequestType('ON_DEMAND')}
                  className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                    requestType === 'ON_DEMAND'
                      ? 'bg-sky-50 border-sky-500 text-sky-950 ring-2 ring-sky-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div>On-Demand Household</div>
                  <span className="text-[10px] font-normal text-slate-500">Excess recyclable or bulk waste</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType('EVENT')}
                  className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                    requestType === 'EVENT'
                      ? 'bg-purple-50 border-purple-500 text-purple-950 ring-2 ring-purple-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div>Special Event Collection</div>
                  <span className="text-[10px] font-normal text-slate-500">Weddings, festivals, public gatherings</span>
                </button>
              </div>
            </div>

            {/* Waste Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Waste Stream</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-sky-500/20 bg-slate-50/50"
              >
                <option value="RECYCLABLE">Dry Recyclable Waste (Cardboard, Plastics, Metals)</option>
                <option value="ORGANIC">Kitchen & Garden Organic Waste</option>
                <option value="BULK_RESIDUAL">Bulk Furniture or Non-Recyclable Residual</option>
                <option value="HAZARDOUS">Special / Hazardous Waste (Batteries, Chemicals)</option>
                <option value="MIXED">Mixed Community Waste</option>
              </select>
            </div>

            {/* Estimated Volume */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Estimated Volume (kg) *
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                required
                value={estimatedVolumeKg}
                onChange={(e) => setEstimatedVolumeKg(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-sky-500/20 bg-slate-50/50"
                placeholder="e.g. 15"
              />
            </div>

            {/* If Event Collection, Event Specific Fields */}
            {requestType === 'EVENT' && (
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3">
                <span className="text-xs font-extrabold text-purple-900 block">Event Specific Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Event Name (e.g. Community Wedding) *"
                      value={eventDetails.eventName}
                      onChange={(e) => setEventDetails({ ...eventDetails, eventName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      required
                      value={eventDetails.eventDate}
                      onChange={(e) => setEventDetails({ ...eventDetails, eventDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs bg-white"
                    />
                  </div>
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Expected Attendees (e.g. 250)"
                    value={eventDetails.expectedAttendees}
                    onChange={(e) => setEventDetails({ ...eventDetails, expectedAttendees: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs bg-white"
                  />
                </div>
              </div>
            )}

            {/* Address & Ward */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pickup Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street / House No *"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Srinagar Ward *</label>
                <input
                  type="text"
                  required
                  placeholder="Ward Name (e.g. Rajbagh) *"
                  value={wardName}
                  onChange={(e) => setWardName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Description & Landmark</label>
              <textarea
                rows={2}
                placeholder="Details on waste packaging, gate accessibility, or landmark..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={submittingRequest}
              className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{submittingRequest ? 'Submitting Request...' : 'Submit Collection Request'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: My Requests */}
      {activeTab === 'MY_REQUESTS' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Your Submitted Collection Requests</h3>
              <p className="text-xs text-slate-500">Track review, driver allocation, and completion timestamps.</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('REQUEST')}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Request</span>
            </button>
          </div>

          {loadingMyRequests ? (
            <div className="py-20 text-center text-xs text-slate-400">Loading requests...</div>
          ) : myRequests.length === 0 ? (
            <div className="p-16 rounded-3xl bg-white border border-slate-200 shadow-xs text-center space-y-3">
              <Truck className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">No collection requests yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Have excess recyclables or an upcoming wedding/festival? Submit a pickup request anytime.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map((req) => (
                <div
                  key={req._id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {req.estimatedVolumeKg} kg • {(req.category || 'RECYCLABLE').replace(/_/g, ' ')}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        req.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'ASSIGNED' || req.status === 'IN_PROGRESS'
                          ? 'bg-sky-100 text-sky-800'
                          : req.status === 'CANCELLED' || req.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {req.requestType === 'EVENT' ? 'Special Event' : 'On-Demand'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{req.pickupAddress}, {req.wardName}</span>
                    </div>

                    {req.assignedDriverId && (
                      <div className="text-[11px] text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg inline-block font-semibold">
                        Assigned Driver: {req.assignedDriverId?.name || 'Driver'} • Vehicle: {req.assignedVehicleId?.plateNumber || 'Truck'}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400">
                      Requested on {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  {req.status === 'REQUESTED' && (
                    <button
                      type="button"
                      onClick={() => handleCancelRequest(req._id)}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Driver Portal & Route VRP (Only for Driver / Admin) */}
      {activeTab === 'DRIVER' && (
        <div className="space-y-8">
          {/* Route VRP KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Stops</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">
                {routeData?.summary?.totalStops ?? safeManifest.length}
              </div>
              <span className="text-[11px] text-slate-500">Urgent Bins Scheduled</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Route Distance</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">
                {routeData?.summary?.totalDistanceKm ?? 14.8} km
              </div>
              <span className="text-[11px] text-slate-500">Optimized TSP Path</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Time</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">
                {routeData?.summary?.estimatedDurationMin ?? 45}m
              </div>
              <span className="text-[11px] text-slate-500">At Urban Speed Limit</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Simulated Savings</span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-2">
                {routeData?.summary?.fuelSavedPercent ?? 24.5}%
              </div>
              <span className="text-[11px] text-slate-500">2-Opt VRP Heuristic</span>
            </div>
          </div>

          {/* GPS Broadcast Switch Card */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-sky-300 mb-2">
                <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                <span>Live Telemetry Channel</span>
              </div>
              <h3 className="text-base font-bold">Driver Mobile GPS Broadcast</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Stream real-time HTML5 coordinates to the central server and notify citizens within 500 meters.
              </p>
            </div>

            <div>
              {isTracking ? (
                <button
                  type="button"
                  onClick={stopDriverTracking}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop GPS Broadcast</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startDriverTracking}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Start GPS Broadcast</span>
                </button>
              )}
            </div>
          </div>

          {/* Route Stop Manifest */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Assigned Route Stop Sequence</h3>

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
                {safeManifest.map((m) => (
                  <Marker
                    key={m.identifier || m.stopSequence}
                    position={[m.coordinates[1], m.coordinates[0]]}
                    icon={createStopIcon(m.stopSequence, m.priority) || undefined}
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

            <div className="space-y-3">
              {safeManifest.map((stop) => (
                <div
                  key={stop.identifier || stop.stopSequence}
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
                      type="button"
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
