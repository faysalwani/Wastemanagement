import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import {
  Truck,
  Navigation,
  MapPin,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  BellRing,
  Send,
  Plus,
  CalendarDays,
  ListChecks,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const createTruckIcon = () => {
  try {
    return L.divIcon({
      className: 'custom-truck-marker',
      html: `<div style="
        background-color: #21834A;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        border: 2px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
      ">🚛</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  } catch {
    return null;
  }
};

const STATUS_LABELS = {
  REQUESTED: { label: 'Pending Review', style: 'bg-amber-50 text-amber-800 border-amber-200' },
  ASSIGNED: { label: 'Driver Assigned', style: 'bg-sky-50 text-sky-800 border-sky-200' },
  IN_PROGRESS: { label: 'In Progress', style: 'bg-sky-100 text-sky-900 border-sky-300' },
  COMPLETED: { label: 'Completed', style: 'bg-[#E5F4E8] text-[#1A693B] border-[#BCE0C6]' },
  CANCELLED: { label: 'Cancelled', style: 'bg-slate-100 text-slate-600 border-slate-200' },
  REJECTED: { label: 'Declined', style: 'bg-rose-50 text-rose-800 border-rose-200' },
};

export default function Collection() {
  const { user } = useAuth() || {};
  const { socket } = useSocket() || {};

  const [fleet, setFleet] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('REQUEST'); // REQUEST, MY_REQUESTS, SCHEDULE, MAP
  const [proximityAlert, setProximityAlert] = useState(null);

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

  const fetchFleetAndSchedules = async () => {
    setLoading(true);
    try {
      const [fleetRes, schedRes] = await Promise.all([
        api.get('/tracking/fleet').catch(() => ({ data: { success: false } })),
        api.get('/collection-schedules').catch(() => ({ data: { success: false } })),
      ]);

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
    fetchFleetAndSchedules();
    fetchMyRequests();
  }, [user]);

  // Filter valid fleet vehicles with real coordinates [lng, lat]
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

    const R = 6371e3;
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

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!user) {
      setRequestFeedback({
        type: 'error',
        message: 'Please sign in to submit a pickup request.',
      });
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
          message: `Your ${requestType === 'EVENT' ? 'event' : 'household'} pickup request has been submitted!`,
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
        message: err.response?.data?.error?.message || 'Could not submit your pickup request. Please try again.',
      });
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Cancel this pickup request?')) return;
    try {
      await api.delete(`/collection-requests/${requestId}`);
      fetchMyRequests();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Could not cancel request.');
    }
  };

  const truckIcon = createTruckIcon();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* 500m Proximity Notification Banner */}
      {proximityAlert && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-[#21834A] text-white shadow-md flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <BellRing className="w-6 h-6 flex-shrink-0" />
            <div>
              <div className="text-sm font-bold">{proximityAlert.message}</div>
              <span className="text-xs text-[#E5F4E8]">
                Driver: {proximityAlert.driverName} • Vehicle: {proximityAlert.plateNumber}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setProximityAlert(null)}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26372B] tracking-tight">
            Waste Pickup & Schedules
          </h1>
          <p className="text-sm sm:text-base text-[#526356] mt-1">
            Schedule a doorstep pickup, check your local collection days, or see active collection trucks.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Pickup and schedule views"
          className="flex flex-wrap p-1.5 rounded-2xl bg-white border border-[#DCE6DF] text-xs sm:text-sm font-semibold gap-1 self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'REQUEST'}
            onClick={() => setActiveTab('REQUEST')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'REQUEST'
                ? 'bg-[#21834A] text-white shadow-xs'
                : 'text-[#526356] hover:text-[#26372B] hover:bg-[#F8FAF8]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Request Pickup</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'MY_REQUESTS'}
            onClick={() => {
              setActiveTab('MY_REQUESTS');
              fetchMyRequests();
            }}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'MY_REQUESTS'
                ? 'bg-[#21834A] text-white shadow-xs'
                : 'text-[#526356] hover:text-[#26372B] hover:bg-[#F8FAF8]'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>My Requests ({myRequests.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'SCHEDULE'}
            onClick={() => setActiveTab('SCHEDULE')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'SCHEDULE'
                ? 'bg-[#21834A] text-white shadow-xs'
                : 'text-[#526356] hover:text-[#26372B] hover:bg-[#F8FAF8]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'MAP'}
            onClick={() => setActiveTab('MAP')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'MAP'
                ? 'bg-[#21834A] text-white shadow-xs'
                : 'text-[#526356] hover:text-[#26372B] hover:bg-[#F8FAF8]'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Live Map</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Request Pickup */}
      {activeTab === 'REQUEST' && (
        <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-[#DCE6DF] shadow-xs space-y-6">
          <div className="pb-4 border-b border-[#DCE6DF]">
            <h2 className="text-lg sm:text-xl font-bold text-[#26372B] flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-[#21834A]" />
              <span>Book a Waste Pickup</span>
            </h2>
            <p className="text-sm text-[#526356] mt-1">
              Request a pickup for extra household recyclables, bulk items, or a special event.
            </p>
          </div>

          {!user && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-center justify-between gap-4">
              <span>Please sign in to submit and track your pickup requests.</span>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-[#21834A] text-white text-xs font-bold whitespace-nowrap hover:bg-[#1A693B]"
              >
                Sign In
              </Link>
            </div>
          )}

          {requestFeedback && (
            <div
              role="status"
              className={`p-4 rounded-2xl text-sm font-medium flex items-center justify-between gap-3 ${
                requestFeedback.type === 'success'
                  ? 'bg-[#E5F4E8] text-[#1A693B] border border-[#BCE0C6]'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {requestFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#21834A] flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                )}
                <span>{requestFeedback.message}</span>
              </div>
              {requestFeedback.type === 'success' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('MY_REQUESTS')}
                  className="text-xs font-bold underline whitespace-nowrap"
                >
                  View status
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleCreateRequest} className="space-y-5">
            {/* Request Type Switcher */}
            <div>
              <span className="block text-sm font-semibold text-[#26372B] mb-2">
                What kind of pickup do you need?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRequestType('ON_DEMAND')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    requestType === 'ON_DEMAND'
                      ? 'bg-[#E5F4E8]/70 border-[#21834A] text-[#26372B] ring-2 ring-[#21834A]/20'
                      : 'bg-white border-[#DCE6DF] text-[#526356] hover:bg-[#F8FAF8]'
                  }`}
                >
                  <div className="text-sm font-bold text-[#26372B]">Household Pickup</div>
                  <span className="text-xs text-[#526356] mt-0.5 block">
                    Extra recyclables, organic waste, or bulky items
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType('EVENT')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    requestType === 'EVENT'
                      ? 'bg-[#E5F4E8]/70 border-[#21834A] text-[#26372B] ring-2 ring-[#21834A]/20'
                      : 'bg-white border-[#DCE6DF] text-[#526356] hover:bg-[#F8FAF8]'
                  }`}
                >
                  <div className="text-sm font-bold text-[#26372B]">Special Event Pickup</div>
                  <span className="text-xs text-[#526356] mt-0.5 block">
                    Weddings, community gatherings, or local festivals
                  </span>
                </button>
              </div>
            </div>

            {/* Waste Type & Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="pickup-category" className="block text-sm font-semibold text-[#26372B] mb-1.5">
                  Type of waste
                </label>
                <select
                  id="pickup-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] bg-white focus:outline-none focus:border-[#21834A]"
                >
                  <option value="RECYCLABLE">Dry Recyclables (Paper, Cardboard, Plastic, Metal)</option>
                  <option value="ORGANIC">Food & Garden Waste</option>
                  <option value="BULK_RESIDUAL">Bulky Household Items or General Waste</option>
                  <option value="HAZARDOUS">Batteries, E-Waste, or Household Chemicals</option>
                  <option value="MIXED">Mixed Event / Household Waste</option>
                </select>
              </div>

              <div>
                <label htmlFor="pickup-weight" className="block text-sm font-semibold text-[#26372B] mb-1.5">
                  Approx. weight (kg)
                </label>
                <input
                  id="pickup-weight"
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={estimatedVolumeKg}
                  onChange={(e) => setEstimatedVolumeKg(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] bg-white focus:outline-none focus:border-[#21834A]"
                  placeholder="e.g. 10"
                />
              </div>
            </div>

            {/* Event Details if EVENT */}
            {requestType === 'EVENT' && (
              <div className="p-4 rounded-2xl bg-[#F8FAF8] border border-[#DCE6DF] space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[#26372B]">
                  <CalendarDays className="w-4 h-4 text-[#21834A]" />
                  <span>Event Information</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="event-name" className="block text-xs font-semibold text-[#526356] mb-1">
                      Event name
                    </label>
                    <input
                      id="event-name"
                      type="text"
                      required
                      placeholder="e.g. Family Wedding"
                      value={eventDetails.eventName}
                      onChange={(e) => setEventDetails({ ...eventDetails, eventName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCE6DF] text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="event-date" className="block text-xs font-semibold text-[#526356] mb-1">
                      Event date
                    </label>
                    <input
                      id="event-date"
                      type="date"
                      required
                      value={eventDetails.eventDate}
                      onChange={(e) => setEventDetails({ ...eventDetails, eventDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#DCE6DF] text-sm bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="event-guests" className="block text-xs font-semibold text-[#526356] mb-1">
                    Estimated number of guests (optional)
                  </label>
                  <input
                    id="event-guests"
                    type="number"
                    placeholder="e.g. 200"
                    value={eventDetails.expectedAttendees}
                    onChange={(e) => setEventDetails({ ...eventDetails, expectedAttendees: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE6DF] text-sm bg-white"
                  />
                </div>
              </div>
            )}

            {/* Address & Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pickup-address" className="block text-sm font-semibold text-[#26372B] mb-1.5">
                  Pickup address
                </label>
                <input
                  id="pickup-address"
                  type="text"
                  required
                  placeholder="House number, street, landmark"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] bg-white focus:outline-none focus:border-[#21834A]"
                />
              </div>
              <div>
                <label htmlFor="pickup-ward" className="block text-sm font-semibold text-[#26372B] mb-1.5">
                  Neighborhood / Ward
                </label>
                <input
                  id="pickup-ward"
                  type="text"
                  required
                  placeholder="e.g. Rajbagh"
                  value={wardName}
                  onChange={(e) => setWardName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] bg-white focus:outline-none focus:border-[#21834A]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pickup-notes" className="block text-sm font-semibold text-[#26372B] mb-1.5">
                Pickup notes (optional)
              </label>
              <textarea
                id="pickup-notes"
                rows={2}
                placeholder="Any helpful directions for the driver (e.g., bags placed near front gate)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] bg-white focus:outline-none focus:border-[#21834A]"
              />
            </div>

            <button
              type="submit"
              disabled={submittingRequest || !user}
              className="w-full py-3.5 px-5 rounded-xl bg-[#21834A] hover:bg-[#1A693B] text-white text-sm font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{submittingRequest ? 'Submitting request...' : 'Request Pickup'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: My Requests */}
      {activeTab === 'MY_REQUESTS' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-[#DCE6DF] flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-[#26372B]">My Pickup Requests</h2>
              <p className="text-xs sm:text-sm text-[#526356]">
                View the status of your requested pickups and assigned collection trucks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('REQUEST')}
              className="px-4 py-2 rounded-xl bg-[#21834A] text-white text-xs sm:text-sm font-bold hover:bg-[#1A693B] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Request</span>
            </button>
          </div>

          {loadingMyRequests ? (
            <div className="py-16 text-center text-sm text-[#526356] bg-white rounded-2xl border border-[#DCE6DF]">
              Loading your pickup requests...
            </div>
          ) : myRequests.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-[#DCE6DF] text-center space-y-3">
              <Truck className="w-10 h-10 text-[#526356]/50 mx-auto" />
              <h3 className="text-base font-bold text-[#26372B]">No pickup requests yet</h3>
              <p className="text-sm text-[#526356] max-w-md mx-auto">
                When you book a pickup for extra household waste or a special event, its status will appear here.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('REQUEST')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#21834A] text-white text-sm font-bold hover:bg-[#1A693B]"
              >
                <Plus className="w-4 h-4" />
                <span>Book a Pickup</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => {
                const statusInfo = STATUS_LABELS[req.status] || {
                  label: req.status,
                  style: 'bg-slate-100 text-slate-700 border-slate-200',
                };
                return (
                  <div
                    key={req._id}
                    className="p-5 rounded-2xl bg-white border border-[#DCE6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-base text-[#26372B]">
                          {req.estimatedVolumeKg} kg • {(req.category || 'RECYCLABLE').replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.style}`}
                        >
                          {statusInfo.label}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#F8FAF8] border border-[#DCE6DF] text-[#526356] text-xs font-semibold">
                          {req.requestType === 'EVENT' ? 'Event Pickup' : 'Household Pickup'}
                        </span>
                      </div>

                      <div className="text-sm text-[#526356] flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#21834A] flex-shrink-0" />
                        <span>
                          {req.pickupAddress}, {req.wardName}
                        </span>
                      </div>

                      {req.assignedDriverId && (
                        <div className="text-xs text-[#1A693B] bg-[#E5F4E8] px-3 py-1 rounded-lg inline-block font-semibold">
                          Driver: {req.assignedDriverId?.name || 'Assigned Driver'} • Truck:{' '}
                          {req.assignedVehicleId?.plateNumber || 'Assigned'}
                        </div>
                      )}

                      <div className="text-xs text-[#526356]">
                        Requested on{' '}
                        {new Date(req.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>

                    {req.status === 'REQUESTED' && (
                      <button
                        type="button"
                        onClick={() => handleCancelRequest(req._id)}
                        className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors self-start sm:self-center"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Collection Schedule */}
      {activeTab === 'SCHEDULE' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-[#DCE6DF] flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-[#26372B]">Regular Collection Schedule</h2>
              <p className="text-xs sm:text-sm text-[#526356]">
                Scheduled neighborhood collection days and hours.
              </p>
            </div>
            <span className="text-xs font-bold text-[#1A693B] bg-[#E5F4E8] px-3 py-1 rounded-full">
              {schedules.length} Areas Listed
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-[#526356] bg-white rounded-2xl border border-[#DCE6DF]">
              Loading collection schedules...
            </div>
          ) : schedules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map((sch) => (
                <div
                  key={sch._id}
                  className="p-5 bg-white rounded-2xl border border-[#DCE6DF] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-base text-[#26372B]">{sch.wardName}</div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E5F4E8] text-[#1A693B]">
                      {(sch.wasteType || 'MIXED').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-[#26372B] font-medium">
                    {sch.daysOfWeek?.join(' • ') || 'Daily Collection'}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-[#526356]">
                    <Clock className="w-4 h-4 text-[#21834A]" />
                    <span>
                      {sch.startTime || '07:00 AM'} – {sch.endTime || '11:00 AM'}
                    </span>
                  </div>
                  {sch.vehicleId?.plateNumber && (
                    <div className="pt-2 border-t border-[#DCE6DF] text-xs text-[#526356]">
                      Assigned Truck:{' '}
                      <span className="font-semibold text-[#26372B]">{sch.vehicleId.plateNumber}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-[#526356] bg-white rounded-2xl border border-[#DCE6DF]">
              No regular schedules have been posted for your area yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Live Map */}
      {activeTab === 'MAP' && (
        <div className="space-y-6">
          {/* Proximity Banner */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              nearestVehicleDist <= 500
                ? 'bg-[#E5F4E8] border-[#21834A] text-[#26372B]'
                : 'bg-white border-[#DCE6DF] text-[#26372B]'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  nearestVehicleDist <= 500
                    ? 'bg-[#21834A] text-white'
                    : 'bg-[#F8FAF8] text-[#526356] border border-[#DCE6DF]'
                }`}
              >
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base">
                  {nearestVehicleDist <= 500
                    ? `A collection truck is nearby (~${nearestVehicleDist}m away)`
                    : validVehicles.length > 0
                    ? 'Active collection trucks on route'
                    : 'No collection trucks are actively broadcasting right now'}
                </h2>
                <p className="text-xs sm:text-sm text-[#526356] mt-0.5">
                  {nearestVehicleDist <= 500
                    ? `Truck ${nearestVehicle?.plateNumber || ''} is within 500 meters of your location.`
                    : nearestVehicleDist < Infinity
                    ? `The nearest active collection truck is approximately ${(nearestVehicleDist / 1000).toFixed(1)} km away.`
                    : 'Live vehicle locations appear here automatically when drivers start their collection shift.'}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold self-start sm:self-center ${
                validVehicles.length > 0
                  ? 'bg-[#E5F4E8] text-[#1A693B]'
                  : 'bg-[#F8FAF8] text-[#526356] border border-[#DCE6DF]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  validVehicles.length > 0 ? 'bg-[#21834A]' : 'bg-slate-400'
                }`}
              />
              <span>{validVehicles.length} Active Trucks</span>
            </span>
          </div>

          {/* Map */}
          <div className="bg-white p-4 rounded-2xl border border-[#DCE6DF] space-y-3">
            <div className="h-[420px] rounded-xl overflow-hidden border border-[#DCE6DF] relative z-10">
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
                          <div className="font-bold text-[#26372B]">
                            {veh.plateNumber || 'Collection Truck'}
                          </div>
                          <div className="text-[#526356]">
                            Driver: {veh.driverId?.name || 'Assigned Driver'}
                          </div>
                          <div className="text-[#21834A] font-semibold">
                            Status: {veh.status || 'Active'}
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
                        color: '#21834A',
                        fillColor: '#21834A',
                        fillOpacity: 0.12,
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
    </div>
  );
}
