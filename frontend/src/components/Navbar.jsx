import React from 'react';
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
  Wifi,
  WifiOff
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function Navbar() {
  const location = useLocation();
  const { isConnected } = useSocket() || {};
  
  const navItems = [
    { path: '/scan', label: 'AI Scanner', icon: Camera },
    { path: '/exchange', label: 'Resource Exchange', icon: Repeat },
    { path: '/compost', label: 'Composting', icon: Sprout },
    { path: '/collection', label: 'Collection & Tracking', icon: Truck },
    { path: '/reports', label: 'Report Dumping', icon: AlertTriangle },
    { path: '/smart-bins', label: 'Smart Bins', icon: Cpu },
    { path: '/admin', label: 'Admin Hub', icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-eco-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-eco-500/20 group-hover:scale-105 transition-transform">
              <Recycle className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <span className="font-bold text-lg bg-gradient-to-r from-slate-900 via-eco-800 to-eco-600 bg-clip-text text-transparent block leading-tight">
                EcoCycle Srinagar
              </span>
              <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase">
                IoT & AI Resource Recovery
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-eco-50 text-eco-700 shadow-xs border border-eco-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-eco-600' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Status & Action Items */}
          <div className="flex items-center gap-3">
            {/* Live WebSocket Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-600">
              {isConnected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="hidden sm:inline">Live Sync</span>
                </>
              ) : (
                <>
                  <span className="inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                  <span className="hidden sm:inline text-amber-700">Connecting</span>
                </>
              )}
            </div>

            {/* Eco Credits Pill */}
            <Link 
              to="/profile" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/80 text-xs font-bold text-amber-900 hover:shadow-xs transition-shadow"
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>120 Credits</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
