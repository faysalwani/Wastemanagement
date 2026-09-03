import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Award, 
  MapPin, 
  Mail, 
  Phone, 
  Shield, 
  LogOut, 
  Save, 
  CheckCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, logout, updateUserProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    wardName: user?.wardName || 'Lal Chowk',
    address: user?.address || '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Compute tier progress
  const credits = user?.ecoCredits || 0;
  let nextTier = 'SILVER';
  let targetCredits = 100;
  let currentTierMin = 0;

  if (user?.tier === 'BRONZE') {
    nextTier = 'SILVER';
    targetCredits = 100;
    currentTierMin = 0;
  } else if (user?.tier === 'SILVER') {
    nextTier = 'GOLD';
    targetCredits = 250;
    currentTierMin = 100;
  } else if (user?.tier === 'GOLD') {
    nextTier = 'ECO_CHAMPION';
    targetCredits = 500;
    currentTierMin = 250;
  } else {
    nextTier = 'MAX';
    targetCredits = 500;
    currentTierMin = 500;
  }

  const progressPercent = Math.min(
    100,
    Math.round(((credits - currentTierMin) / (targetCredits - currentTierMin || 1)) * 100)
  );

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const res = await updateUserProfile(formData);
    if (res.success) {
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-eco-600 to-emerald-400 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-eco-500/20">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                user?.role === 'ADMIN'
                  ? 'bg-indigo-100 text-indigo-800'
                  : user?.role === 'DRIVER'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold border border-slate-200 hover:border-rose-200 transition-colors self-start sm:self-center"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          <CheckCircle className="w-4 h-4" />
          <span>Profile updated successfully.</span>
        </div>
      )}

      {/* Grid: Eco-Credits Card & Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Eco Credits Card */}
        <div className="md:col-span-1 p-6 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl text-white shadow-lg shadow-eco-600/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Eco-Credits Ledger
              </span>
              <Award className="w-5 h-5 text-amber-300" />
            </div>

            <div className="mt-6">
              <div className="text-4xl font-extrabold tracking-tight">
                {credits} <span className="text-sm font-medium text-emerald-200">pts</span>
              </div>
              <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold text-white">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Tier: {user?.tier || 'BRONZE'}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-emerald-500/40">
            {nextTier !== 'MAX' ? (
              <>
                <div className="flex justify-between text-xs text-emerald-100 mb-2">
                  <span>Progress to {nextTier}</span>
                  <span className="font-bold">{credits} / {targetCredits}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-emerald-900/40 overflow-hidden">
                  <div 
                    className="h-full bg-amber-300 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </>
            ) : (
              <div className="text-xs text-emerald-100 font-semibold text-center">
                🏆 Top Tier Achieved: Eco-Champion
              </div>
            )}
          </div>
        </div>

        {/* Profile Details & Form */}
        <div className="md:col-span-2 p-6 bg-white rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-eco-600" />
              <span>Personal & Location Details</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-semibold text-eco-600 hover:text-eco-700"
            >
              {isEditing ? 'Cancel' : 'Edit Details'}
            </button>
          </div>

          {!isEditing ? (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <span className="block text-slate-400 font-medium">Full Name</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">{user?.name}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Email Address</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">{user?.email}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Contact Phone</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">{user?.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-medium">Srinagar Ward / Locality</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">{user?.wardName || 'Lal Chowk'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-slate-400 font-medium">Street Address</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">{user?.address || 'Srinagar, J&K'}</span>
              </div>
              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-eco-600 flex-shrink-0" />
                <span>
                  Registered Coordinates: <strong>{user?.location?.coordinates?.[0] ?? 74.7973}</strong>° E, <strong>{user?.location?.coordinates?.[1] ?? 34.0837}</strong>° N
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500/20 focus:border-eco-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500/20 focus:border-eco-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Name</label>
                <input
                  type="text"
                  value={formData.wardName}
                  onChange={(e) => setFormData({ ...formData, wardName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500/20 focus:border-eco-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-eco-500/20 focus:border-eco-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-eco-600 hover:bg-eco-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
