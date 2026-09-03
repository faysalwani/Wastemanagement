import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Recycle, 
  LogIn, 
  AlertCircle, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  KeyRound, 
  ArrowRight, 
  Clock, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Truck,
  User,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  // Role First Portal Context ('CITIZEN', 'ADMIN', 'DRIVER')
  const [selectedRole, setSelectedRole] = useState('CITIZEN');

  // Citizen Credentials
  const [citizenEmail, setCitizenEmail] = useState('');
  const [citizenPassword, setCitizenPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Monthly OTP State (Citizen only)
  const [requireMonthlyOtp, setRequireMonthlyOtp] = useState(false);
  const [monthlyOtp, setMonthlyOtp] = useState('');

  // Staff (Admin / Driver) State
  const [staffEmail, setStaffEmail] = useState('');
  const [staffOtp, setStaffOtp] = useState('');
  const [staffOtpSent, setStaffOtpSent] = useState(false);

  // Shared UX State
  const [cooldown, setCooldown] = useState(0);
  const [demoOtpHint, setDemoOtpHint] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { loginCitizen, verifyMonthlyOtp, sendStaffOtp, verifyStaffOtp, getDashboardRoute } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Reset state when switching role tabs
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError('');
    setSuccessMsg('');
    setDemoOtpHint('');
    setRequireMonthlyOtp(false);
    setStaffOtpSent(false);
    setStaffOtp('');
    setMonthlyOtp('');
  };

  // 1. Citizen Sign In
  const handleCitizenSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      if (!requireMonthlyOtp) {
        // Step 1A: Email + Password
        const res = await loginCitizen(citizenEmail, citizenPassword);
        if (res.requireMonthlyOtp) {
          setRequireMonthlyOtp(true);
          setCooldown(res.cooldownSeconds || 60);
          setSuccessMsg(res.message || 'Monthly security verification required.');
          if (res.demoOtp) setDemoOtpHint(res.demoOtp);
        } else if (res.success) {
          const dest = from || getDashboardRoute(res.user);
          navigate(dest, { replace: true });
        }
      } else {
        // Step 1B: Verify Monthly OTP
        const res = await verifyMonthlyOtp(citizenEmail, monthlyOtp);
        if (res.success) {
          const dest = from || getDashboardRoute(res.user);
          navigate(dest, { replace: true });
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        'Authentication failed. Please verify your credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Staff Send OTP (Admin / Driver)
  const handleStaffSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await sendStaffOtp(staffEmail, selectedRole);
      if (res.success) {
        setStaffOtpSent(true);
        setCooldown(res.cooldownSeconds || 60);
        setSuccessMsg(res.message);
        if (res.demoOtp) setDemoOtpHint(res.demoOtp);
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        `Unable to dispatch verification code for ${selectedRole} portal.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Staff Verify OTP (Admin / Driver)
  const handleStaffVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await verifyStaffOtp(staffEmail, staffOtp, selectedRole);
      if (res.success) {
        const dest = from || res.dashboardRoute || getDashboardRoute(res.user);
        navigate(dest, { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        'Invalid or expired verification code.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-500/20">
            <Recycle className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-xs text-slate-500">
            Choose your designated portal to sign in to EcoCycle Srinagar
          </p>
        </div>

        {/* ROLE FIRST SELECTOR: CITIZEN | ADMIN | DRIVER */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 text-center">
            Login As
          </label>
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleRoleChange('CITIZEN')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                selectedRole === 'CITIZEN'
                  ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Citizen</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('ADMIN')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                selectedRole === 'ADMIN'
                  ? 'bg-white text-indigo-800 shadow-xs border border-indigo-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('DRIVER')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                selectedRole === 'DRIVER'
                  ? 'bg-white text-amber-800 shadow-xs border border-amber-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-amber-600" />
              <span>Driver</span>
            </button>
          </div>
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

        {/* Development / Evaluation Demo Code Quick-Fill Pill */}
        {demoOtpHint && (
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
              onClick={() => {
                if (selectedRole === 'CITIZEN') setMonthlyOtp(demoOtpHint);
                else setStaffOtp(demoOtpHint);
              }}
              className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
            >
              Fill Code
            </button>
          </div>
        )}

        {/* ========================================================== */}
        {/* 1. CITIZEN LOGIN FORM (EMAIL + PASSWORD + MONTHLY OTP)    */}
        {/* ========================================================== */}
        {selectedRole === 'CITIZEN' && (
          <form onSubmit={handleCitizenSubmit} className="space-y-4">
            {!requireMonthlyOtp ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Citizen Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="citizen@ecocycle.local"
                      value={citizenEmail}
                      onChange={(e) => setCitizenEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Password *
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-semibold text-emerald-700 hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={citizenPassword}
                      onChange={(e) => setCitizenPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>{submitting ? 'Authenticating...' : 'Sign In as Citizen'}</span>
                </button>
              </>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Periodic security check: Please enter the 6-digit verification code sent to your email.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter 6-Digit Monthly Verification Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={monthlyOtp}
                    onChange={(e) => setMonthlyOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center font-mono text-lg tracking-widest font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || monthlyOtp.length < 6}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{submitting ? 'Verifying...' : 'Verify & Enter Citizen Dashboard'}</span>
                </button>
              </div>
            )}
          </form>
        )}

        {/* ========================================================== */}
        {/* 2. STAFF (ADMIN / DRIVER) LOGIN FORM (OTP ONLY)            */}
        {/* ========================================================== */}
        {selectedRole !== 'CITIZEN' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span>
                {selectedRole === 'ADMIN'
                  ? 'Admin Portal: Secure passwordless access for Municipal & Super Admins.'
                  : 'Driver Portal: Secure passwordless access for Collection Fleet Operators.'}
              </span>
            </div>

            {!staffOtpSent ? (
              <form onSubmit={handleStaffSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered {selectedRole} Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder={selectedRole === 'ADMIN' ? 'admin@ecocycle.local' : 'driver@ecocycle.local'}
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !staffEmail}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>{submitting ? 'Sending Code...' : `Send ${selectedRole} Login Code`}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleStaffVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Enter 6-Digit Access Code *
                    </label>
                    <button
                      type="button"
                      onClick={() => setStaffOtpSent(false)}
                      className="text-[11px] text-slate-600 hover:underline font-semibold"
                    >
                      Change Email
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={staffOtp}
                    onChange={(e) => setStaffOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center font-mono text-lg tracking-widest font-bold focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || staffOtp.length < 6}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>{submitting ? 'Verifying...' : `Sign In to ${selectedRole} Portal`}</span>
                </button>

                {/* Resend Cooldown */}
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
                      onClick={handleStaffSendOtp}
                      disabled={submitting}
                      className="text-slate-900 font-bold hover:underline"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer Navigation */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-emerald-700 hover:underline">
              Create Citizen Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
