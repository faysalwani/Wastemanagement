import React, { useState, useEffect } from 'react';
import { 
  Recycle, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  Sparkles, 
  Layers, 
  Building2,
  ExternalLink
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

const createFacilityIcon = () =>
  L.divIcon({
    className: 'custom-facility-marker',
    html: `
      <div style="
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background-color: #059669;
        border: 3px solid #ffffff;
        box-shadow: 0 4px 10px rgba(5,150,105,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
      ">
        ♻️
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });

const MATERIALS = [
  'ALL',
  'Plastic',
  'Paper',
  'Cardboard',
  'Metal Cans',
  'E-Waste',
  'Batteries',
  'Organic Waste',
];

export default function Recyclers() {
  const [recyclers, setRecyclers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('CARDS'); // CARDS or MAP

  const fetchRecyclers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedMaterial !== 'ALL') params.material = selectedMaterial;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/recyclers', { params });
      if (res.data.success) {
        setRecyclers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch recyclers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecyclers();
  }, [selectedMaterial]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecyclers();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            <Recycle className="w-3.5 h-3.5 text-emerald-600" />
            Verified Circular Economy Partners
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Recycler & Scrap Recovery Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Discover authorized local scrap dealers, dry recyclers, and hazardous e-waste collection points across Srinagar.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200 self-start sm:self-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('CARDS')}
            className={`px-4 py-2 rounded-xl transition-all ${
              viewMode === 'CARDS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Facility Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode('MAP')}
            className={`px-4 py-2 rounded-xl transition-all ${
              viewMode === 'MAP'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Map View
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Material Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {MATERIALS.map((mat) => (
            <button
              key={mat}
              type="button"
              onClick={() => setSelectedMaterial(mat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedMaterial === mat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {mat === 'ALL' ? 'All Materials' : mat}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative sm:w-72">
          <input
            type="text"
            placeholder="Search by name, material, ward..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* View 1: Facility Cards */}
      {viewMode === 'CARDS' && (
        <>
          {loading ? (
            <div className="py-24 text-center text-xs text-slate-400">Loading verified recyclers...</div>
          ) : recyclers.length === 0 ? (
            <div className="p-16 rounded-3xl bg-white border border-slate-200 shadow-xs text-center space-y-3">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No facilities found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No verified recyclers currently match your material filter or search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recyclers.map((facility) => (
                <div
                  key={facility._id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all p-6 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-800 uppercase inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified Recovery Hub</span>
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1.5 leading-snug">
                          {facility.name}
                        </h3>
                      </div>
                    </div>

                    {/* Address & Ward */}
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span>{facility.address} ({facility.wardName})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-semibold text-slate-800">{facility.contactPhone}</span>
                      </div>
                      {facility.operatingHours && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{facility.operatingHours}</span>
                        </div>
                      )}
                    </div>

                    {/* Accepted Materials */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Accepted Materials
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {facility.acceptedMaterials.map((mat, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold"
                          >
                            {mat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Pricing info if available */}
                    {facility.ratesPerKg && Object.keys(facility.ratesPerKg).length > 0 && (
                      <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-[11px] space-y-1">
                        <span className="font-bold text-emerald-900 block">Indicative Scrap Rates:</span>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-emerald-800 font-mono">
                          {Object.entries(facility.ratesPerKg).map(([k, v]) => (
                            <span key={k}>
                              {k}: ₹{v}/kg
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <a
                    href={`https://www.google.com/maps?q=${facility.location?.coordinates?.[1] || 34.0837},${facility.location?.coordinates?.[0] || 74.7973}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Get Directions on Map</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* View 2: Leaflet OpenStreetMap */}
      {viewMode === 'MAP' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden h-[550px] relative">
          <MapContainer
            center={[34.0837, 74.7973]}
            zoom={12}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {recyclers.map((facility) => {
              const coords = facility.location?.coordinates;
              if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return null;

              return (
                <Marker
                  key={facility._id}
                  position={[coords[1], coords[0]]}
                  icon={createFacilityIcon()}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <span className="font-bold text-slate-900 block">{facility.name}</span>
                      <p className="text-[11px] text-slate-600">{facility.address}</p>
                      <p className="text-[11px] text-slate-700">📞 {facility.contactPhone}</p>
                      <div className="pt-1 text-[10px] text-emerald-800 font-bold">
                        {facility.acceptedMaterials.slice(0, 3).join(', ')}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
