import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Recycle, 
  LogIn, 
  AlertCircle, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserCheck, 
  Truck, 
  Shield, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDemoPills, setShowDemoPills] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        'Authentication failed. Please verify your email and password.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
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
            Sign in to access real-time waste tracking, your Eco-Credits ledger, and community exchanges.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Real Authentication Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Password *
              </label>
              <span className="text-[11px] text-slate-400">Min. 6 characters</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
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

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Remember me</span>
            </label>
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
            <span>{submitting ? 'Authenticating...' : 'Sign In to Account'}</span>
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-emerald-700 hover:underline">
              Create an Account
            </Link>
          </p>
        </div>

        {/* Discreet Collapsible Demo Helper for Viva Examiners */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowDemoPills(!showDemoPills)}
            className="w-full text-center text-[11px] text-slate-400 hover:text-slate-600 font-medium py-1"
          >
            {showDemoPills ? 'Hide Demonstration Accounts ▲' : '⚡ Show Demonstration Accounts for Viva Defense ▼'}
          </button>

          {showDemoPills && (
            <div className="mt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in duration-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                Pre-loaded Examination Profiles
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('citizen@ecocycle.local', 'Citizen@123')}
                  className="p-1.5 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 text-slate-700 text-[11px] font-semibold text-center"
                >
                  Citizen
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('driver@ecocycle.local', 'Driver@123')}
                  className="p-1.5 rounded-lg bg-white hover:bg-amber-50 border border-slate-200 text-slate-700 text-[11px] font-semibold text-center"
                >
                  Driver
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@ecocycle.local', 'Admin@123')}
                  className="p-1.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 text-[11px] font-semibold text-center"
                >
                  Admin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
