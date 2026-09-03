import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Recycle, 
  Camera, 
  Repeat, 
  Sprout, 
  Truck, 
  AlertTriangle, 
  Cpu, 
  LayoutDashboard, 
  Award,
  LogIn,
  UserCheck,
  LogOut,
  Menu,
  X,
  Radio,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConnected } = useSocket() || {};
  const { user, isAuthenticated, logout } = useAuth() || {};

  // Close mobile menu whenever the active route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/scan', label: 'AI Scanner', icon: Camera, badge: 'AI' },
    { path: '/exchange', label: 'Resource Exchange', icon: Repeat },
    { path: '/compost', label: 'Composting', icon: Sprout },
    { path: '/collection', label: 'Collection & Radar', icon: Truck },
    { path: '/reports', label: 'Report Dumping', icon: AlertTriangle },
    { path: '/smart-bins', label: 'Smart Bins', icon: Cpu, badge: 'IoT' },
    { path: '/admin', label: 'Admin Hub', icon: LayoutDashboard, role: 'ADMIN' },
  ];

  const citizenItems = navItems.filter((i) => i.path !== '/admin');
  const adminItem = navItems.find((i) => i.path === '/admin');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo & Title */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-xs shadow-emerald-600/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Recycle className="w-5 h-5" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 leading-none whitespace-nowrap">
                EcoCycle <span className="text-emerald-600">Srinagar</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 tracking-normal leading-none mt-1 whitespace-nowrap">
                Smart Waste & Resource Recovery
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Visible on xl screens >= 1280px) */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/80 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Status & Action Items */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* Live WebSocket Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200 text-[11px] font-medium text-slate-600">
              {isConnected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Live</span>
                </>
              ) : (
                <>
                  <span className="inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                  <span className="text-amber-700">Connecting</span>
                </>
              )}
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Eco Credits Pill */}
                <Link 
                  to="/profile" 
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-xs font-bold text-emerald-900 transition-colors"
                >
                  <Award className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{user?.ecoCredits || 0}</span>
                  <span className="text-[10px] font-medium text-emerald-700 hidden sm:inline">pts</span>
                </Link>

                {/* Profile Avatar Pill */}
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden md:inline font-medium">{user?.name?.split(' ')[0]}</span>
                </Link>

                {/* Sign Out Button */}
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <span>Register</span>
                </Link>
              </div>
            )}

            {/* Mobile / Tablet Menu Toggle (Visible on screens < 1280px) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-800" />
              ) : (
                <Menu className="w-5 h-5 text-slate-800" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Dropdown Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white/98 backdrop-blur-lg shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 max-h-[85vh] overflow-y-auto">
            {/* User Greeting & Status (Mobile) */}
            {isAuthenticated ? (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{user?.name}</div>
                    <div className="text-[10px] text-slate-500">{user?.wardName} • {user?.role}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-emerald-700">{user?.ecoCredits || 0} pts</span>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{user?.tier || 'BRONZE'}</div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-950">Welcome to EcoCycle</div>
                  <div className="text-[11px] text-emerald-700">Sign in to earn Eco-Credits & track waste</div>
                </div>
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-2xs"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Navigation Category 1: Citizen Services */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                Citizen Circular Services
              </div>
              {citizenItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Navigation Category 2: Municipal Operations & Admin */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                Municipal Operations & IoT
              </div>

              {adminItem && (
                <Link
                  to={adminItem.path}
                  className={`flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    location.pathname === adminItem.path
                      ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <span>{adminItem.label}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    SMC Admin
                  </span>
                </Link>
              )}

              {/* API Swagger Documentation Link */}
              <a
                href="http://localhost:5000/api-docs"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                    <Radio className="w-4 h-4" />
                  </div>
                  <span>OpenAPI Swagger Docs</span>
                </div>
                <span className="text-[10px] font-medium text-slate-400">External</span>
              </a>
            </div>

            {/* Live Connection Status & Quick Profile Link */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                <span className="text-[11px]">{isConnected ? 'Connected to Srinagar IoT Grid' : 'Connecting to Server...'}</span>
              </div>
              {isAuthenticated && (
                <button
                  onClick={logout}
                  className="text-[11px] text-rose-600 font-semibold hover:underline"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
