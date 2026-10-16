import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Navigation,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Phone,
  CheckCircle2,
  Clock,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandMark } from '../components/BrandLogo';

const COMMUNITY_WARDS = [
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
  const [step, setStep] = useState(1); // 1: Details, 2: OTP verification
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
  const [cooldown, setCooldown] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { initiateRegister, verifyRegister } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    if (pass.length < 6) return { score: 1, label: 'Too short', color: 'bg-rose-500' };
    let score = 1;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-[#21834A]' };
  };

  const passStrength = getPasswordStrength(formData.password);

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      setError('Location services are not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          coordinates: [
            parseFloat(longitude.toFixed(6)),
            parseFloat(latitude.toFixed(6)),
          ],
        }));
        setGpsSuccess(true);
        setDetectingGps(false);
      },
      () => {
        setError('Could not access GPS location. Your selected area will be used instead.');
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
      setError('Passwords do not match. Please check and try again.');
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
        setSuccessMsg(
          res.message || `We sent a 6-digit verification code to ${formData.email}.`
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          'Could not start registration. Please check your details.'
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
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-6 bg-white p-7 sm:p-9 rounded-2xl border border-[#DCE6DF] shadow-sm">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BrandMark className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#26372B] tracking-tight">
            Create your Clear Waste account
          </h1>
          <p className="text-sm text-[#526356]">
            {step === 1
              ? 'Request pickups, scan waste and earn community rewards.'
              : 'Enter the 6-digit verification code sent to your email.'}
          </p>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#E5F4E8] border border-[#C5E6CD] text-xs sm:text-sm text-[#26372B]"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#21834A]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: CITIZEN INFORMATION FORM */}
        {step === 1 && (
          <form className="space-y-4" onSubmit={handleInitiateSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs font-bold text-[#26372B] mb-1.5"
                >
                  Full name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#526356] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] focus:border-[#21834A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-phone"
                  className="block text-xs font-bold text-[#26372B] mb-1.5"
                >
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#526356] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-phone"
                    type="tel"
                    placeholder="Optional contact number"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] focus:border-[#21834A] outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-bold text-[#26372B] mb-1.5"
              >
                Email address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#526356] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] focus:border-[#21834A] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-bold text-[#26372B] mb-1.5"
                >
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#526356] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] focus:border-[#21834A] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#526356] hover:text-[#26372B]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-1.5 flex items-center gap-2 text-xs">
                    <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full ${passStrength.color}`}
                        style={{ width: `${passStrength.score * 33.3}%` }}
                      />
                    </div>
                    <span className="text-[#526356]">{passStrength.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="reg-confirm-password"
                  className="block text-xs font-bold text-[#26372B] mb-1.5"
                >
                  Confirm password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#526356] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] focus:border-[#21834A] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="reg-ward"
                  className="block text-xs font-bold text-[#26372B] mb-1.5"
                >
                  Local Area / Ward *
                </label>
                <select
                  id="reg-ward"
                  value={formData.wardName}
                  onChange={(e) =>
                    setFormData({ ...formData, wardName: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] bg-white outline-none focus:border-[#21834A]"
                >
                  {COMMUNITY_WARDS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="reg-address"
                  className="block text-xs font-bold text-[#26372B] mb-1.5"
                >
                  Street address
                </label>
                <input
                  id="reg-address"
                  type="text"
                  placeholder="Street or neighbourhood"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] outline-none focus:border-[#21834A]"
                />
              </div>
            </div>

            {/* Optional GPS Location Detection */}
            <div className="p-3.5 rounded-xl bg-[#F8FAF8] border border-[#DCE6DF] flex items-center justify-between gap-3">
              <div className="text-xs text-[#526356]">
                <span className="font-semibold text-[#26372B] block">
                  Pickup & alert location
                </span>
                <span>
                  {gpsSuccess
                    ? 'Current GPS location saved'
                    : 'Optional: use GPS for nearby collection alerts'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleGpsDetect}
                disabled={detectingGps}
                className="px-3 py-2 rounded-xl bg-white border border-[#DCE6DF] hover:bg-[#E5F4E8] text-[#26372B] text-xs font-semibold flex items-center gap-1.5 transition-colors flex-shrink-0"
              >
                <Navigation className="w-3.5 h-3.5 text-[#21834A]" />
                <span>
                  {detectingGps
                    ? 'Locating...'
                    : gpsSuccess
                    ? 'Location Saved'
                    : 'Use My Location'}
                </span>
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-[#21834A] hover:bg-[#1B6E3E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Sending verification code...'
                  : 'Continue & Verify Email'}
              </span>
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY REGISTRATION OTP */}
        {step === 2 && (
          <form className="space-y-4" onSubmit={handleVerifySubmit}>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="reg-otp"
                  className="block text-xs font-bold text-[#26372B]"
                >
                  Enter 6-digit verification code *
                </label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[#21834A] font-semibold hover:underline"
                >
                  Edit details
                </button>
              </div>
              <input
                id="reg-otp"
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 rounded-xl border border-[#DCE6DF] text-center font-mono text-lg tracking-widest font-bold focus:border-[#21834A] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || otp.length < 6}
              className="w-full py-3.5 rounded-xl bg-[#21834A] hover:bg-[#1B6E3E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {submitting ? 'Creating account...' : 'Verify & Create Account'}
              </span>
            </button>

            <div className="flex items-center justify-between text-xs text-[#526356] pt-1">
              <span>Didn’t receive the email?</span>
              {cooldown > 0 ? (
                <span className="flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Resend in {cooldown}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleInitiateSubmit}
                  disabled={submitting}
                  className="text-[#21834A] font-bold hover:underline"
                >
                  Resend code
                </button>
              )}
            </div>
          </form>
        )}

        <div className="text-center pt-3 border-t border-[#DCE6DF]">
          <p className="text-xs sm:text-sm text-[#526356]">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-[#21834A] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
