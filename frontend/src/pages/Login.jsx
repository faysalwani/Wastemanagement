import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LogIn,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Clock,
  CheckCircle2,
  Truck,
  User,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandMark } from '../components/BrandLogo';

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('CITIZEN');

  // Citizen Credentials
  const [citizenEmail, setCitizenEmail] = useState('');
  const [citizenPassword, setCitizenPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Periodic OTP State (Citizen only)
  const [requireMonthlyOtp, setRequireMonthlyOtp] = useState(false);
  const [monthlyOtp, setMonthlyOtp] = useState('');

  // Staff (Admin / Driver) State
  const [staffEmail, setStaffEmail] = useState('');
  const [staffOtp, setStaffOtp] = useState('');
  const [staffOtpSent, setStaffOtpSent] = useState(false);

  // Shared UX State
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    loginCitizen,
    verifyMonthlyOtp,
    sendStaffOtp,
    verifyStaffOtp,
    getDashboardRoute,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError('');
    setSuccessMsg('');
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
        const res = await loginCitizen(citizenEmail, citizenPassword);
        if (res.requireMonthlyOtp) {
          setRequireMonthlyOtp(true);
          setCooldown(res.cooldownSeconds || 60);
          setSuccessMsg(
            res.message || 'Please enter the verification code sent to your email.'
          );
        } else if (res.success) {
          const dest = from || getDashboardRoute(res.user);
          navigate(dest, { replace: true });
        }
      } else {
        const res = await verifyMonthlyOtp(citizenEmail, monthlyOtp);
        if (res.success) {
          const dest = from || getDashboardRoute(res.user);
          navigate(dest, { replace: true });
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          'Sign in failed. Please check your email and password.'
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
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          `Unable to send verification code for ${selectedRole.toLowerCase()} sign in.`
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
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6 bg-white p-7 sm:p-9 rounded-2xl border border-[#DCE6DF] shadow-sm">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BrandMark className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#26372B] tracking-tight">
            Sign in to Clear Waste
          </h1>
          <p className="text-sm text-[#526356]">
            Smarter waste. Cleaner communities.
          </p>
        </div>

        {/* Role Selector */}
        <div className="space-y-1.5">
          <span className="block text-xs font-bold uppercase tracking-wider text-[#526356] text-center">
            Select account type
          </span>
          <div
            role="tablist"
            aria-label="Account type"
            className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-[#F8FAF8] border border-[#DCE6DF] text-xs font-bold"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedRole === 'CITIZEN'}
              onClick={() => handleRoleChange('CITIZEN')}
              className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                selectedRole === 'CITIZEN'
                  ? 'bg-white text-[#21834A] shadow-2xs border border-[#DCE6DF]'
                  : 'text-[#526356] hover:text-[#26372B]'
              }`}
            >
              <User className="w-4 h-4 text-[#21834A]" />
              <span>Citizen</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={selectedRole === 'DRIVER'}
              onClick={() => handleRoleChange('DRIVER')}
              className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                selectedRole === 'DRIVER'
                  ? 'bg-white text-[#21834A] shadow-2xs border border-[#DCE6DF]'
                  : 'text-[#526356] hover:text-[#26372B]'
              }`}
            >
              <Truck className="w-4 h-4 text-[#21834A]" />
              <span>Driver</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={selectedRole === 'ADMIN'}
              onClick={() => handleRoleChange('ADMIN')}
              className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                selectedRole === 'ADMIN'
                  ? 'bg-white text-[#21834A] shadow-2xs border border-[#DCE6DF]'
                  : 'text-[#526356] hover:text-[#26372B]'
              }`}
            >
              <Shield className="w-4 h-4 text-[#21834A]" />
              <span>Admin</span>
            </button>
          </div>
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

        {/* 1. CITIZEN LOGIN FORM */}
        {selectedRole === 'CITIZEN' && (
          <form onSubmit={handleCitizenSubmit} className="space-y-4">
            {!requireMonthlyOtp ? (
              <>
                <div>
                  <label
                    htmlFor="citizen-email"
                    className="block text-xs font-bold text-[#26372B] mb-1.5"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#526356] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="citizen-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={citizenEmail}
                      onChange={(e) => setCitizenEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] focus:border-[#21834A] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="citizen-password"
                      className="block text-xs font-bold text-[#26372B]"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-[#21834A] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#526356] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="citizen-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={citizenPassword}
                      onChange={(e) => setCitizenPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] focus:border-[#21834A] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#526356] hover:text-[#26372B] p-1"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-[#21834A] hover:bg-[#1B6E3E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>{submitting ? 'Signing in...' : 'Sign in'}</span>
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#F8FAF8] border border-[#DCE6DF] text-xs text-[#526356]">
                  For your security, please enter the 6-digit verification code sent to your email address.
                </div>

                <div>
                  <label
                    htmlFor="citizen-monthly-otp"
                    className="block text-xs font-bold text-[#26372B] mb-1.5"
                  >
                    6-digit verification code
                  </label>
                  <input
                    id="citizen-monthly-otp"
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    placeholder="6-digit code"
                    value={monthlyOtp}
                    onChange={(e) =>
                      setMonthlyOtp(e.target.value.replace(/\D/g, ''))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-[#DCE6DF] text-center font-mono text-lg tracking-widest font-bold focus:border-[#21834A] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || monthlyOtp.length < 6}
                  className="w-full py-3.5 rounded-xl bg-[#21834A] hover:bg-[#1B6E3E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Verifying...' : 'Verify & Continue'}</span>
                </button>
              </div>
            )}
          </form>
        )}

        {/* 2. STAFF (DRIVER / ADMIN) OTP LOGIN FORM */}
        {selectedRole !== 'CITIZEN' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#F8FAF8] border border-[#DCE6DF] text-xs text-[#526356] flex items-center gap-2.5">
              <KeyRound className="w-4 h-4 text-[#21834A] flex-shrink-0" />
              <span>
                {selectedRole === 'ADMIN'
                  ? 'Administrator sign-in uses a one-time verification code sent to your authorized email.'
                  : 'Driver sign-in uses a one-time verification code sent to your registered email.'}
              </span>
            </div>

            {!staffOtpSent ? (
              <form onSubmit={handleStaffSendOtp} className="space-y-4">
                <div>
                  <label
                    htmlFor="staff-email"
                    className="block text-xs font-bold text-[#26372B] mb-1.5"
                  >
                    Authorized {selectedRole === 'ADMIN' ? 'Admin' : 'Driver'} Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#526356] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="staff-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="name@organization.org"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] focus:border-[#21834A] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !staffEmail}
                  className="w-full py-3.5 rounded-xl bg-[#21834A] hover:bg-[#1B6E3E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>
                    {submitting ? 'Sending code...' : 'Send Verification Code'}
                  </span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleStaffVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="staff-otp"
                      className="block text-xs font-bold text-[#26372B]"
                    >
                      Enter 6-digit verification code
                    </label>
                    <button
                      type="button"
                      onClick={() => setStaffOtpSent(false)}
                      className="text-xs text-[#21834A] hover:underline font-semibold"
                    >
                      Change email
                    </button>
                  </div>
                  <input
                    id="staff-otp"
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    placeholder="6-digit code"
                    value={staffOtp}
                    onChange={(e) =>
                      setStaffOtp(e.target.value.replace(/\D/g, ''))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-[#DCE6DF] text-center font-mono text-lg tracking-widest font-bold focus:border-[#21834A] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || staffOtp.length < 6}
                  className="w-full py-3.5 rounded-xl bg-[#21834A] hover:bg-[#1B6E3E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{submitting ? 'Verifying...' : 'Verify & Sign In'}</span>
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
                      onClick={handleStaffSendOtp}
                      disabled={submitting}
                      className="text-[#21834A] font-bold hover:underline"
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer Navigation */}
        <div className="text-center pt-3 border-t border-[#DCE6DF]">
          <p className="text-xs sm:text-sm text-[#526356]">
            New to Clear Waste?{' '}
            <Link
              to="/register"
              className="font-bold text-[#21834A] hover:underline"
            >
              Create a citizen account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
