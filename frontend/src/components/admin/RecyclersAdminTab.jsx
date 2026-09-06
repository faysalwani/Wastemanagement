import React, { useState, useEffect } from 'react';
import { 
  Recycle, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  CheckCircle2, 
  X,
  Building,
  ExternalLink
} from 'lucide-react';
import api from '../../services/api';

const COMMON_MATERIALS = [
  'Plastic Bottles (PET)',
  'Cardboard & Paper',
  'Metals & Cans',
  'Glass Containers',
  'E-Waste & Batteries',
  'Organic Compost',
  'Tetra Paks',
  'Textiles & Fabrics'
];

export default function RecyclersAdminTab() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: '',
    address: '',
    wardName: 'Ward 1 - Nishat',
    contactPhone: '',
    contactEmail: '',
    operatingHours: 'Mon - Sat: 9:00 AM - 6:00 PM',
    acceptedMaterials: ['Plastic Bottles (PET)', 'Cardboard & Paper'],
    latitude: 34.0837,
    longitude: 74.7973,
    isVerified: true,
  });

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recyclers');
      if (res.data.success) {
        setFacilities(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load recyclers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const showNotification = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const openCreateModal = () => {
    setEditingFacility(null);
    setForm({
      name: '',
      address: '',
      wardName: 'Ward 1 - Nishat',
      contactPhone: '',
      contactEmail: '',
      operatingHours: 'Mon - Sat: 9:00 AM - 6:00 PM',
      acceptedMaterials: ['Plastic Bottles (PET)', 'Cardboard & Paper'],
      latitude: 34.0837,
      longitude: 74.7973,
      isVerified: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (f) => {
    setEditingFacility(f);
    setForm({
      name: f.name,
      address: f.address,
      wardName: f.wardName,
      contactPhone: f.contactPhone,
      contactEmail: f.contactEmail || '',
      operatingHours: f.operatingHours || 'Mon - Sat: 9:00 AM - 6:00 PM',
      acceptedMaterials: f.acceptedMaterials || [],
      latitude: f.location?.coordinates ? f.location.coordinates[1] : 34.0837,
      longitude: f.location?.coordinates ? f.location.coordinates[0] : 74.7973,
      isVerified: f.isVerified ?? true,
    });
    setIsModalOpen(true);
  };

  const toggleMaterial = (mat) => {
    setForm((prev) => {
      const exists = prev.acceptedMaterials.includes(mat);
      return {
        ...prev,
        acceptedMaterials: exists 
          ? prev.acceptedMaterials.filter(m => m !== mat)
          : [...prev.acceptedMaterials, mat]
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        address: form.address,
        wardName: form.wardName,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        operatingHours: form.operatingHours,
        acceptedMaterials: form.acceptedMaterials,
        location: {
          type: 'Point',
          coordinates: [Number(form.longitude), Number(form.latitude)],
        },
        isVerified: form.isVerified,
      };

      if (editingFacility) {
        await api.patch(`/recyclers/${editingFacility._id}`, payload);
        showNotification('Recycling center updated successfully.');
      } else {
        await api.post('/recyclers', payload);
        showNotification('New verified recycling center added.');
      }

      setIsModalOpen(false);
      setEditingFacility(null);
      fetchFacilities();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save recycling facility');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete recycling facility "${name}"?`)) return;
    try {
      await api.delete(`/recyclers/${id}`);
      showNotification(`Facility "${name}" removed.`);
      fetchFacilities();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete recycling facility');
    }
  };

  const filteredFacilities = facilities.filter((f) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name?.toLowerCase().includes(q) ||
      f.wardName?.toLowerCase().includes(q) ||
      f.address?.toLowerCase().includes(q) ||
      f.acceptedMaterials?.some(m => m.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Recycle className="w-5 h-5 text-emerald-600" />
            <span>Verified Recyclers & Scrap Centers Directory</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authorized recycling drop-off stations and registered scrap cooperatives across Srinagar.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Recycling Facility</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search facilities by name, ward, material or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-white border border-slate-200 placeholder:text-slate-400 text-slate-800 outline-none focus:border-emerald-500"
        />
      </div>

      {/* Facility Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
          Loading recycling facilities...
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
          No recycling facilities found. Click "Add Recycling Facility" to register a drop-off depot.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFacilities.map((f) => (
            <div 
              key={f._id}
              className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                    {f.wardName}
                  </span>
                  {f.isVerified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{f.name}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{f.address}</span>
                  </p>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{f.contactPhone}</span>
                  </div>
                  {f.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{f.contactEmail}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{f.operatingHours}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                    Accepted Materials
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {f.acceptedMaterials?.map((mat, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4 text-xs">
                <span className="text-[10px] text-slate-400 font-mono">
                  [{f.location?.coordinates?.[1]?.toFixed(4)}, {f.location?.coordinates?.[0]?.toFixed(4)}]
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(f)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                    title="Edit Facility"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(f._id, f.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Facility"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================= ADD / EDIT MODAL ======================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>{editingFacility ? 'Edit Recycling Center' : 'Add New Recycling Facility'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Shalimar Eco-Drop Scrap Depot"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ward Name</label>
                  <input
                    type="text"
                    required
                    value={form.wardName}
                    onChange={(e) => setForm({ ...form, wardName: e.target.value })}
                    placeholder="Ward 5 - Shalimar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    placeholder="+91 94190 00000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Physical Address</label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Near Shalimar Garden Gate, Harwan Road"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={form.operatingHours}
                    onChange={(e) => setForm({ ...form, operatingHours: e.target.value })}
                    placeholder="Mon - Sat: 9am - 6pm"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    placeholder="shalimar@ecocycle.in"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Accepted Waste Materials</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_MATERIALS.map((mat) => {
                    const isSelected = form.acceptedMaterials.includes(mat);
                    return (
                      <button
                        type="button"
                        key={mat}
                        onClick={() => toggleMaterial(mat)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {mat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  {saving ? 'Saving...' : editingFacility ? 'Save Changes' : 'Register Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
