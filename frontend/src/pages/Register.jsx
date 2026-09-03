import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Recycle, 
  UserPlus, 
  AlertCircle, 
  MapPin, 
  Navigation, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Sparkles,
  CheckCircle2,
  Clock,
  KeyRound,
  ArrowRight
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
  const [step, setStep] = useState(1); // 1: Details form, 2: OTP verification
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    wardName: 'Lal Chowk',
    address: '',
    coordinates: [74.7973, 34.0837],
  });

  const [otp, setOtp] = useState('');
  const [demoOtpHint, setDemoOtpHint] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { initiateRegister, verifyRegister } = useAuth();
  const navigate = useNavigate();

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Password strength meter
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
        setError('Could not access device GPS. Default ward coordinates applied.');
        setDetectingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Step 1: Submit Details & Request Registration OTP
  const handleInitiateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        wardName: formData.wardName,
        address: formData.address,
        coordinates: formData.coordinates,
      };

      const res = await initiateRegister(payload);
      if (res.success) {
        setStep(2);
        setCooldown(res.cooldownSeconds || 60);
        setSuccessMsg(res.message || `A verification code was dispatched to ${formData.email}.`);
        if (res.demoOtp) setDemoOtpHint(res.demoOtp);
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        'Registration could not be initiated. Please check your details.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Verify Registration OTP and Activate Citizen Account
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await verifyRegister(formData.email, otp);
      if (res.success) {
        navigate('/citizen', { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        'Invalid or expired verification code. Please try again.'
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
            Create Citizen Account
          </h2>
          <p className="text-xs text-slate-500">
            {step === 1
              ? 'Join the Srinagar municipal smart waste segregation & circular recovery network'
              : 'Enter the verification code sent to your email to activate your account'}
          </p>
        </div>

        {/* Informational Callout */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            Citizen registration grants access to AI Waste Scanning, Household Composting, P2P Exchanges, and Eco-Credits.
          </span>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Demo OTP Pill */}
        {demoOtpHint && step === 2 && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <div>
              <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-800">
                Evaluation Demo Code:
              </span>
              <span className="font-mono text-base font-extrabold text-amber-950 tracking-widest">
                {demoOtpHint}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOtp(demoOtpHint)}
              className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
            >
              Fill Code
            </button>
          </div>
        )}

        {/* STEP 1: CITIZEN INFORMATION FORM */}
        {step === 1 && (
          <form className="space-y-4" onSubmit={handleInitiateSubmit}>
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
                  placeholder="citizen@example.com"
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
                  placeholder="e.g. Bund Road, Near Footbridge"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>
            </div>

            {/* GPS Location Auto-Detection */}
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
                <KeyRound className="w-4 h-4" />
              )}
              <span>{submitting ? 'Generating Verification Code...' : 'Continue & Verify Email'}</span>
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY REGISTRATION OTP */}
        {step === 2 && (
          <form className="space-y-4 animate-in fade-in duration-200" onSubmit={handleVerifySubmit}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Enter 6-Digit Verification Code *
                </label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] text-emerald-700 font-semibold hover:underline"
                >
                  Edit Details
                </button>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center font-mono text-lg tracking-widest font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || otp.length < 6}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{submitting ? 'Activating Account...' : 'Verify & Activate Citizen Account'}</span>
            </button>

            {/* Resend Cooldown Section */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Didn't receive code?</span>
              {cooldown > 0 ? (
                <span className="flex items-center gap-1 text-slate-400 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Resend in {cooldown}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleInitiateSubmit}
                  disabled={submitting}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Resend Code
                </button>
              )}
            </div>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-emerald-700 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
