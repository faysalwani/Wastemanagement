import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Recycle, 
  UserPlus, 
  AlertCircle, 
  MapPin, 
  CheckCircle, 
  Navigation, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Truck, 
  ShieldCheck, 
  Sparkles,
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

export default function Register() {
  const [role, setRole] = useState('CITIZEN'); // CITIZEN, DRIVER, ADMIN
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    adminSecret: '',
    wardName: 'Lal Chowk',
    address: '',
    coordinates: [74.7973, 34.0837],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength calculator
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    if (pass.length < 6) return { score: 1, label: 'Too short', color: 'bg-rose-500' };
    let score = 1;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passStrength = getPasswordStrength(formData.password);

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          coordinates: [parseFloat(longitude.toFixed(6)), parseFloat(latitude.toFixed(6))],
        }));
        setGpsSuccess(true);
        setDetectingGps(false);
      },
      (err) => {
        setError('Could not access device GPS. Default coordinates applied.');
        setDetectingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (role === 'ADMIN' && !formData.adminSecret) {
      setError('Please provide the Administrator Secret Key.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role,
        adminSecret: role === 'ADMIN' ? formData.adminSecret : undefined,
        wardName: formData.wardName,
        address: formData.address,
        coordinates: formData.coordinates,
      };

      const res = await register(payload);
      if (res.success) {
        navigate('/profile', { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        'Registration failed. Please check your details and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-500/20">
            <Recycle className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create Real Account
          </h2>
          <p className="text-xs text-slate-500">
            Join the Srinagar intelligent circular waste and resource recovery network
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Select Account Role *
          </label>
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setRole('CITIZEN')}
              className={`py-2 px-2 rounded-xl transition-all flex flex-col items-center gap-1 ${
                role === 'CITIZEN'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>Citizen</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('DRIVER')}
              className={`py-2 px-2 rounded-xl transition-all flex flex-col items-center gap-1 ${
                role === 'DRIVER'
                  ? 'bg-white text-amber-800 shadow-xs font-bold border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Driver</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('ADMIN')}
              className={`py-2 px-2 rounded-xl transition-all flex flex-col items-center gap-1 ${
                role === 'ADMIN'
                  ? 'bg-white text-indigo-800 shadow-xs font-bold border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Welcome Bonus Callout */}
        {role === 'CITIZEN' && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>New citizen accounts receive a <strong className="font-bold">+20 Eco-Credits welcome bonus</strong>!</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Real Registration Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Admin Secret Key (Only if Admin role selected) */}
          {role === 'ADMIN' && (
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1">
              <label className="block text-xs font-bold text-indigo-900">
                Administrator Verification Key *
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter admin secret (Default: SrinagarAdmin2026)"
                  value={formData.adminSecret}
                  onChange={(e) => setFormData({ ...formData, adminSecret: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-indigo-200 text-xs bg-white"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Mohd Faisal Wani"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="+91 9419012345"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="faisal@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                  <div className="w-12 h-1 rounded-full bg-slate-200 overflow-hidden">
                    <div className={`h-full ${passStrength.color}`} style={{ width: `${passStrength.score * 33.3}%` }}></div>
                  </div>
                  <span className="text-slate-500">{passStrength.label}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Srinagar Ward *
              </label>
              <select
                value={formData.wardName}
                onChange={(e) => setFormData({ ...formData, wardName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none"
              >
                {SRINAGAR_WARDS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Street Address / Area
              </label>
              <input
                type="text"
                placeholder="e.g. Near Bund Road"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
              />
            </div>
          </div>

          {/* GPS Coordinates Locker */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              <span className="font-semibold block text-[11px] text-slate-400 uppercase">Geographic Location</span>
              <span>{formData.coordinates[0]}° E, {formData.coordinates[1]}° N</span>
            </div>
            <button
              type="button"
              onClick={handleGpsDetect}
              disabled={detectingGps}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span>{detectingGps ? 'Detecting...' : gpsSuccess ? 'GPS Locked' : 'Detect GPS'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            <span>{submitting ? 'Registering Account...' : 'Create Real Account'}</span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-emerald-700 hover:underline">
              Sign in to Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
