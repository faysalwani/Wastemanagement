import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandMark } from '../components/BrandLogo';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password, 3: Done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isStaffBlocked, setIsStaffBlocked] = useState(false);

  const { forgotPassword, resetPassword } = useAuth();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsStaffBlocked(false);
    setSubmitting(true);

    try {
      const res = await forgotPassword(email);
      if (res.success) {
        setStep(2);
        setSuccessMsg(res.message);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message || 'Password reset request failed.';
      if (msg.includes('staff accounts')) {
        setIsStaffBlocked(true);
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await resetPassword(email, otp, newPassword);
      if (res.success) {
        setSuccessMsg(
          res.message || 'Your password has been updated.'
        );
        setStep(3);
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          'Could not reset password. Please check your verification code.'
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
            Reset your password
          </h1>
          <p className="text-sm text-[#526356]">
            Recover access to your Clear Waste citizen account
          </p>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800"
          >
            {isStaffBlocked ? (
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            )}
            <span>{error}</span>
          </div>
        )}

        {successMsg && step !== 3 && (
          <div
            role="status"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#E5F4E8] border border-[#C5E6CD] text-xs sm:text-sm text-[#26372B]"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#21834A]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: ENTER EMAIL */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label
                htmlFor="reset-email"
                className="block text-xs font-bold text-[#26372B] mb-1.5"
              >
                Email address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#526356] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] focus:border-[#21834A] outline-none"
                />
              </div>
              <p className="text-xs text-[#526356] mt-1.5">
                We’ll send a 6-digit verification code to this email address.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !email}
              className="w-full py-3.5 rounded-xl bg-[#21834A] hover:bg-[#1B6E3E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {submitting ? 'Sending code...' : 'Send Reset Code'}
              </span>
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY CODE & NEW PASSWORD */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label
                htmlFor="reset-otp"
                className="block text-xs font-bold text-[#26372B] mb-1.5"
              >
                6-digit verification code *
              </label>
              <input
                id="reset-otp"
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

            <div>
              <label
                htmlFor="reset-new-password"
                className="block text-xs font-bold text-[#26372B] mb-1.5"
              >
                New password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#526356] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] focus:border-[#21834A] outline-none"
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
            </div>

            <div>
              <label
                htmlFor="reset-confirm-password"
                className="block text-xs font-bold text-[#26372B] mb-1.5"
              >
                Confirm new password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#526356] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="reset-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#DCE6DF] text-sm text-[#26372B] focus:border-[#21834A] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || otp.length < 6 || !newPassword}
              className="w-full py-3.5 rounded-xl bg-[#21834A] hover:bg-[#1B6E3E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {submitting ? 'Updating password...' : 'Update Password'}
              </span>
            </button>
          </form>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 bg-[#E5F4E8] text-[#21834A] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#26372B]">
              Password updated
            </h2>
            <p className="text-sm text-[#526356]">
              Your citizen account password has been changed. You can now sign in.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#21834A] hover:bg-[#1B6E3E] text-white text-sm font-semibold transition-colors"
              >
                <span>Return to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {step !== 3 && (
          <div className="text-center pt-3 border-t border-[#DCE6DF]">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#526356] hover:text-[#26372B] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to sign in</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
