import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import {
  AlertTriangle,
  Plus,
  MapPin,
  CheckCircle2,
  Award,
  Camera,
  Send,
  Map,
  ListChecks,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const createReportIcon = (severity) => {
  const color =
    severity === 'CRITICAL'
      ? '#991b1b'
      : severity === 'HIGH'
      ? '#dc2626'
      : severity === 'MEDIUM'
      ? '#d97706'
      : '#21834A';

  return L.divIcon({
    className: 'custom-report-marker',
    html: `<div style="
      background-color: ${color};
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

const SRINAGAR_WARDS = [
  'Lal Chowk',
  'Rajbagh',
  'Hazratbal',
  'Bemina',
  'Nishat',
  'Soura',
  'Batamaloo',
  'Khanyar',
  'Dalgate',
  'Karan Nagar',
];

const STATUS_BADGE = {
  SUBMITTED: { label: 'Submitted', style: 'bg-amber-50 text-amber-800 border-amber-200' },
  ASSIGNED: { label: 'Team Assigned', style: 'bg-sky-50 text-sky-800 border-sky-200' },
  VERIFIED: { label: 'Verified', style: 'bg-sky-100 text-sky-900 border-sky-300' },
  RESOLVED: { label: 'Resolved', style: 'bg-[#E5F4E8] text-[#1A693B] border-[#BCE0C6]' },
  REJECTED: { label: 'Closed', style: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function Reports() {
  const { user, isAuthenticated } = useAuth() || {};

  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Subtab State: REPORT_FORM, MY_SUBMISSIONS, COMMUNITY_MAP
  const [subtab, setSubtab] = useState('REPORT_FORM');
  const [myReports, setMyReports] = useState([]);
  const [loadingMy, setLoadingMy] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    wasteCategory: 'MIXED_MUNICIPAL',
    severity: 'MEDIUM',
    description: '',
    address: '',
    wardName: user?.wardName || 'Lal Chowk',
    coordinates: [74.7973, 34.0837],
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [detectingGps, setDetectingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [repRes, hotRes] = await Promise.all([
        api.get('/reports').catch(() => ({ data: { success: false } })),
        api.get('/reports/hotspots').catch(() => ({ data: { success: false } })),
      ]);

      if (repRes.data?.success) setReports(repRes.data.data);
      if (hotRes.data?.success) setHotspots(hotRes.data.data);
    } catch (err) {
      console.error('Failed to fetch dumping reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReports = async () => {
    if (!isAuthenticated) return;
    setLoadingMy(true);
    try {
      const res = await api.get('/reports/my');
      if (res.data?.success) {
        setMyReports(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch my reports:', err);
    } finally {
      setLoadingMy(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (isAuthenticated) fetchMyReports();
  }, [isAuthenticated]);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setActionError('Location access is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    setActionError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          coordinates: [
            parseFloat(pos.coords.longitude.toFixed(6)),
            parseFloat(pos.coords.latitude.toFixed(6)),
          ],
        }));
        setDetectingGps(false);
      },
      () => {
        setActionError('Could not detect your current GPS coordinates. You can still enter the street address below.');
        setDetectingGps(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setActionError('Please sign in to submit a dumping report.');
      return;
    }

    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    const data = new FormData();
    data.append('wasteCategory', formData.wasteCategory);
    data.append('severity', formData.severity);
    data.append('description', formData.description);
    data.append('address', formData.address);
    data.append('wardName', formData.wardName);
    data.append('coordinates', JSON.stringify(formData.coordinates));
    if (photoFile) data.append('photo', photoFile);

    try {
      const res = await api.post('/reports', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setActionSuccess('Thank you! Your report has been submitted to the cleanup team.');
        setFormData({
          wasteCategory: 'MIXED_MUNICIPAL',
          severity: 'MEDIUM',
          description: '',
          address: '',
          wardName: user?.wardName || 'Lal Chowk',
          coordinates: [74.7973, 34.0837],
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        fetchData();
        fetchMyReports();
      }
    } catch (err) {
      setActionError(
        err.response?.data?.error?.message || 'Could not submit your report. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26372B] tracking-tight">
            Report Illegal Dumping
          </h1>
          <p className="text-sm sm:text-base text-[#526356] mt-1">
            Help keep our streets clean. Verified reports earn{' '}
            <strong className="text-[#21834A]">+50 reward points</strong> once inspected.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Dumping report views"
          className="flex flex-wrap p-1.5 rounded-2xl bg-white border border-[#DCE6DF] text-xs sm:text-sm font-semibold gap-1 self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={subtab === 'REPORT_FORM'}
            onClick={() => setSubtab('REPORT_FORM')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              subtab === 'REPORT_FORM'
                ? 'bg-[#21834A] text-white shadow-xs'
                : 'text-[#526356] hover:text-[#26372B] hover:bg-[#F8FAF8]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Submit Report</span>
          </button>

          {isAuthenticated && (
            <button
              type="button"
              role="tab"
              aria-selected={subtab === 'MY_SUBMISSIONS'}
              onClick={() => {
                setSubtab('MY_SUBMISSIONS');
                fetchMyReports();
              }}
              className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                subtab === 'MY_SUBMISSIONS'
                  ? 'bg-[#21834A] text-white shadow-xs'
                  : 'text-[#526356] hover:text-[#26372B] hover:bg-[#F8FAF8]'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              <span>My Reports ({myReports.length})</span>
            </button>
          )}

          <button
            type="button"
            role="tab"
            aria-selected={subtab === 'COMMUNITY_MAP'}
            onClick={() => setSubtab('COMMUNITY_MAP')}
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              subtab === 'COMMUNITY_MAP'
                ? 'bg-[#21834A] text-white shadow-xs'
                : 'text-[#526356] hover:text-[#26372B] hover:bg-[#F8FAF8]'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Community Map ({reports.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: STEP-BY-STEP REPORT FORM */}
      {subtab === 'REPORT_FORM' && (
        <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-[#DCE6DF] shadow-xs space-y-6">
          <div className="pb-4 border-b border-[#DCE6DF]">
            <h2 className="text-lg sm:text-xl font-bold text-[#26372B]">
              Report an Uncollected Waste Pile or Dumping Site
            </h2>
            <p className="text-sm text-[#526356] mt-1">
              Provide the location and a brief description so our cleanup crew can find and clear it.
            </p>
          </div>

          {!isAuthenticated && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-center justify-between gap-4">
              <span>Please sign in to submit a report and earn reward points.</span>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-[#21834A] text-white text-xs font-bold whitespace-nowrap hover:bg-[#1A693B]"
              >
                Sign In
              </Link>
            </div>
          )}

          {actionSuccess && (
            <div
              role="status"
              className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#E5F4E8] border border-[#BCE0C6] text-sm font-medium text-[#1A693B]"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#21834A] flex-shrink-0" />
                <span>{actionSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setSubtab('MY_SUBMISSIONS')}
                className="text-xs font-bold underline whitespace-nowrap"
              >
                View my reports
              </button>
            </div>
          )}

          {actionError && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-900"
            >
              {actionError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Location */}
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#21834A]">
                1. Where is the waste located?
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="report-ward" className="block text-sm font-semibold text-[#26372B] mb-1.5">
                    Neighborhood / Ward
                  </label>
                  <select
                    id="report-ward"
                    value={formData.wardName}
                    onChange={(e) => setFormData({ ...formData, wardName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] bg-white focus:outline-none focus:border-[#21834A]"
                  >
                    {SRINAGAR_WARDS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="report-address" className="block text-sm font-semibold text-[#26372B] mb-1.5">
                    Street or nearby landmark
                  </label>
                  <input
                    id="report-address"
                    type="text"
                    required
                    placeholder="e.g. Near main market entrance"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] bg-white focus:outline-none focus:border-[#21834A]"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FAF8] border border-[#DCE6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-[#526356] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#21834A] flex-shrink-0" />
                  <span>
                    GPS pin: <strong>{formData.coordinates[1]}° N</strong>,{' '}
                    <strong>{formData.coordinates[0]}° E</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={detectingGps}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#DCE6DF] text-xs font-bold text-[#26372B] hover:bg-[#E5F4E8]/50 disabled:opacity-50 self-start sm:self-auto"
                >
                  {detectingGps ? 'Detecting location...' : 'Use My Current Location'}
                </button>
              </div>
            </div>

            {/* Step 2: Issue Type & Urgency */}
            <div className="space-y-4 pt-2 border-t border-[#DCE6DF]">
              <div className="text-xs font-bold uppercase tracking-wider text-[#21834A]">
                2. What kind of issue is it?
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="report-category" className="block text-sm font-semibold text-[#26372B] mb-1.5">
                    Type of waste
                  </label>
                  <select
                    id="report-category"
                    value={formData.wasteCategory}
                    onChange={(e) => setFormData({ ...formData, wasteCategory: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] bg-white focus:outline-none focus:border-[#21834A]"
                  >
                    <option value="MIXED_MUNICIPAL">Mixed Household Rubbish</option>
                    <option value="PLASTIC_POLLUTION">Plastic Bags & Bottles</option>
                    <option value="CONSTRUCTION_DEBRIS">Construction Rubble / Debris</option>
                    <option value="BIO_ORGANIC">Rotting Food or Garden Waste</option>
                    <option value="HAZARDOUS_MEDICAL">Hazardous or Medical Waste</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="report-severity" className="block text-sm font-semibold text-[#26372B] mb-1.5">
                    Urgency level
                  </label>
                  <select
                    id="report-severity"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] bg-white focus:outline-none focus:border-[#21834A]"
                  >
                    <option value="LOW">Low — Small roadside litter</option>
                    <option value="MEDIUM">Medium — Noticeable waste pile</option>
                    <option value="HIGH">High — Blocking road or drain</option>
                    <option value="CRITICAL">Urgent — Near water body or school</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="report-description" className="block text-sm font-semibold text-[#26372B] mb-1.5">
                  Brief description
                </label>
                <textarea
                  id="report-description"
                  rows={2}
                  required
                  placeholder="Describe the issue briefly so the cleanup team knows what to bring..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] bg-white focus:outline-none focus:border-[#21834A]"
                />
              </div>
            </div>

            {/* Step 3: Photo */}
            <div className="space-y-3 pt-2 border-t border-[#DCE6DF]">
              <label htmlFor="report-photo" className="block text-sm font-semibold text-[#26372B]">
                3. Add a photo (optional)
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="report-photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setPhotoFile(file || null);
                    setPhotoPreview(file ? URL.createObjectURL(file) : null);
                  }}
                  className="w-full text-xs sm:text-sm text-[#526356] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#E5F4E8] file:text-[#1A693B] hover:file:bg-[#d4ebd9]"
                />
              </div>
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Selected site preview"
                  className="h-32 w-auto rounded-xl border border-[#DCE6DF] object-cover"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !isAuthenticated}
              className="w-full py-3.5 px-5 rounded-xl bg-[#21834A] hover:bg-[#1A693B] text-white text-sm font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting report...' : 'Submit Report'}</span>
            </button>
          </form>
        </div>
      )}

      {/* VIEW 2: MY SUBMISSIONS */}
      {subtab === 'MY_SUBMISSIONS' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-[#DCE6DF] flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-[#26372B]">My Submitted Reports</h2>
              <p className="text-xs sm:text-sm text-[#526356]">
                Track cleanup progress. You receive +50 reward points when a report is verified.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubtab('REPORT_FORM')}
              className="px-4 py-2 rounded-xl bg-[#21834A] text-white text-xs sm:text-sm font-bold hover:bg-[#1A693B]"
            >
              New Report
            </button>
          </div>

          {loadingMy ? (
            <div className="py-16 text-center text-sm text-[#526356] bg-white rounded-2xl border border-[#DCE6DF]">
              Loading your submitted reports...
            </div>
          ) : myReports.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-[#DCE6DF] text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-[#526356]/50 mx-auto" />
              <h3 className="text-base font-bold text-[#26372B]">No reports submitted yet</h3>
              <p className="text-sm text-[#526356] max-w-md mx-auto">
                Spot an uncollected waste pile in your neighborhood? Report it to help our cleanup teams respond faster.
              </p>
              <button
                type="button"
                onClick={() => setSubtab('REPORT_FORM')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#21834A] text-white text-sm font-bold hover:bg-[#1A693B]"
              >
                <Plus className="w-4 h-4" />
                <span>Report Dumping</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myReports.map((item) => {
                const badge = STATUS_BADGE[item.status] || {
                  label: item.status,
                  style: 'bg-slate-100 text-slate-700 border-slate-200',
                };
                return (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl border border-[#DCE6DF] p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#26372B] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#21834A]" />
                          {item.wardName}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div className="text-xs text-[#526356] font-medium">{item.address}</div>

                      <p className="text-sm text-[#26372B] leading-relaxed">{item.description}</p>

                      <div className="pt-2 border-t border-[#DCE6DF] flex items-center justify-between text-xs text-[#526356]">
                        <span>{(item.wasteCategory || 'MIXED').replace(/_/g, ' ')}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div>
                      {item.status === 'VERIFIED' || item.status === 'RESOLVED' ? (
                        <div className="p-2.5 rounded-xl bg-[#E5F4E8] text-[#1A693B] text-xs text-center font-bold flex items-center justify-center gap-1.5">
                          <Award className="w-4 h-4 text-[#21834A]" />
                          <span>Verified • +50 Points Earned</span>
                        </div>
                      ) : item.status === 'REJECTED' ? (
                        <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs text-center font-medium">
                          Closed by review team
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 text-xs text-center font-medium">
                          Awaiting cleanup inspection
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: COMMUNITY MAP */}
      {subtab === 'COMMUNITY_MAP' && (
        <div className="space-y-6">
          {/* Simple Summary Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#DCE6DF]">
              <span className="text-xs font-semibold text-[#526356]">Total Reports</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#26372B] mt-1">
                {reports.length}
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#DCE6DF]">
              <span className="text-xs font-semibold text-[#526356]">In Progress</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 mt-1">
                {reports.filter((r) => r.status !== 'RESOLVED' && r.status !== 'REJECTED').length}
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#E5F4E8]/60 border border-[#BCE0C6]">
              <span className="text-xs font-semibold text-[#1A693B]">Cleaned Up</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#21834A] mt-1">
                {reports.filter((r) => r.status === 'RESOLVED').length}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="bg-white p-4 rounded-2xl border border-[#DCE6DF] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <h2 className="text-sm font-bold text-[#26372B]">
                Reported Locations Around Srinagar
              </h2>
              <div className="flex items-center gap-3 text-xs text-[#526356]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#21834A]"></span> Low
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span> Medium
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Urgent
                </span>
              </div>
            </div>

            <div className="h-[400px] rounded-xl overflow-hidden border border-[#DCE6DF] relative z-10">
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

                {reports.map((rep) => {
                  const coords = [rep.location.coordinates[1], rep.location.coordinates[0]];
                  return (
                    <Marker key={rep._id} position={coords} icon={createReportIcon(rep.severity)}>
                      <Popup>
                        <div className="p-1 space-y-1 text-xs">
                          <div className="font-bold text-[#26372B]">{rep.wardName}</div>
                          <div className="text-[#526356]">{rep.address}</div>
                          <div className="pt-1 border-t border-slate-200 text-[#26372B]">
                            Status: <strong>{rep.status}</strong>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {hotspots.map((hot, idx) => (
                  <Circle
                    key={idx}
                    center={[hot.centerCoordinates[1], hot.centerCoordinates[0]]}
                    radius={250}
                    pathOptions={{
                      color: '#dc2626',
                      fillColor: '#f87171',
                      fillOpacity: 0.2,
                      weight: 1.5,
                    }}
                  >
                    <Popup>
                      <div className="p-1 text-xs">
                        <strong>Frequent Dumping Area</strong>
                        <div>{hot.reportCount} reports nearby</div>
                      </div>
                    </Popup>
                  </Circle>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
