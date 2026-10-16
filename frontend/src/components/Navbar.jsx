import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Camera,
  Repeat,
  Sprout,
  Truck,
  MapPin,
  LayoutDashboard,
  Award,
  LogIn,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Home as HomeIcon,
  Gift,
  Recycle,
  ChevronDown,
  Package,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import BrandLogo from './BrandLogo';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reuseMenuOpen, setReuseMenuOpen] = useState(false);
  const reuseDropdownRef = useRef(null);
  const { user, isAuthenticated, logout, getDashboardRoute } = useAuth() || {};

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setReuseMenuOpen(false);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (reuseDropdownRef.current && !reuseDropdownRef.current.contains(e.target)) {
        setReuseMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userRole = user?.role || 'GUEST';
  const homePath = isAuthenticated ? getDashboardRoute(user) : '/';

  // Primary navigation items tailored to role in plain language
  let primaryNav = [];
  let reuseLinks = [];

  if (!isAuthenticated || userRole === 'CITIZEN') {
    primaryNav = [
      { path: isAuthenticated ? '/citizen' : '/', label: 'Home', icon: HomeIcon },
      { path: '/scan', label: 'Scan Waste', icon: Camera },
      { path: '/collection', label: 'Request a Pickup', icon: Truck },
      { path: '/reports', label: 'Report Dumping', icon: MapPin },
      { path: '/marketplace', label: 'My Rewards', icon: Gift },
    ];
    reuseLinks = [
      {
        path: '/exchange',
        label: 'Share & Reuse Items',
        desc: 'Give or claim clean reusable items nearby',
        icon: Repeat,
      },
      {
        path: '/compost',
        label: 'Home Composting Guide',
        desc: 'Turn kitchen scraps into garden compost',
        icon: Sprout,
      },
      {
        path: '/recyclers',
        label: 'Recycling Centres',
        desc: 'Find verified local drop-off & scrap centres',
        icon: Recycle,
      },
      {
        path: '/smart-bins',
        label: 'Public Smart Bins',
        desc: 'Check nearby community bin capacity',
        icon: Trash2,
      },
    ];
  } else if (userRole === 'DRIVER') {
    primaryNav = [
      { path: '/driver', label: 'My Route & Stops', icon: Truck },
      { path: '/collection', label: 'Live Route Map', icon: MapPin },
      { path: '/smart-bins', label: 'Smart Bins', icon: Trash2 },
    ];
  } else if (userRole === 'ADMIN') {
    primaryNav = [
      { path: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
      { path: '/smart-bins', label: 'Smart Bins', icon: Trash2 },
      { path: '/collection', label: 'Collection Map', icon: Truck },
      { path: '/reports', label: 'Dumping Reports', icon: MapPin },
    ];
  } else if (userRole === 'SUPER_ADMIN') {
    primaryNav = [
      { path: '/super-admin', label: 'Accounts & Roles', icon: ShieldCheck },
      { path: '/admin', label: 'Operations Dashboard', icon: LayoutDashboard },
      { path: '/smart-bins', label: 'Smart Bins', icon: Trash2 },
      { path: '/collection', label: 'Collection Map', icon: Truck },
    ];
  }

  const isReuseActive = ['/exchange', '/compost', '/recyclers', '/smart-bins'].includes(
    location.pathname
  );

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#DCE6DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo */}
          <Link
            to={homePath}
            className="flex items-center flex-shrink-0 rounded-xl focus:outline-none"
            aria-label="Clear Waste Home"
          >
            <BrandLogo showTagline={true} size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-1.5"
          >
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path === '/citizen' && location.pathname === '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#E5F4E8] text-[#21834A]'
                      : 'text-[#26372B] hover:bg-[#F2F7F3] hover:text-[#21834A]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#21834A]' : 'text-[#526356]'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Reuse & Recycle Dropdown for Citizens / Guests */}
            {reuseLinks.length > 0 && (
              <div className="relative" ref={reuseDropdownRef}>
                <button
                  type="button"
                  onClick={() => setReuseMenuOpen((prev) => !prev)}
                  aria-expanded={reuseMenuOpen}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                    isReuseActive || reuseMenuOpen
                      ? 'bg-[#E5F4E8] text-[#21834A]'
                      : 'text-[#26372B] hover:bg-[#F2F7F3] hover:text-[#21834A]'
                  }`}
                >
                  <Recycle
                    className={`w-4 h-4 ${
                      isReuseActive || reuseMenuOpen
                        ? 'text-[#21834A]'
                        : 'text-[#526356]'
                    }`}
                  />
                  <span>Reuse & Recycle</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      reuseMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {reuseMenuOpen && (
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white border border-[#DCE6DF] shadow-lg p-2 z-50">
                    {reuseLinks.map((sub) => {
                      const SubIcon = sub.icon;
                      const active = location.pathname === sub.path;
                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                            active
                              ? 'bg-[#E5F4E8] text-[#21834A]'
                              : 'hover:bg-[#F8FAF8] text-[#26372B]'
                          }`}
                        >
                          <div className="p-2 rounded-lg bg-[#E5F4E8] text-[#21834A] mt-0.5">
                            <SubIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{sub.label}</div>
                            <div className="text-xs text-[#526356] mt-0.5">
                              {sub.desc}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Right User Actions */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Citizen Points Balance */}
                {userRole === 'CITIZEN' && (
                  <Link
                    to="/wallet"
                    title="My Reward Points"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E5F4E8] hover:bg-[#d4ecd9] text-[#21834A] text-sm font-bold transition-colors"
                  >
                    <Award className="w-4 h-4 text-[#21834A]" />
                    <span>{user?.ecoCredits || 0}</span>
                    <span className="text-xs font-medium hidden sm:inline">pts</span>
                  </Link>
                )}

                {/* Notifications */}
                <NotificationCenter />

                {/* Profile Link */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F2F7F3] hover:bg-[#E5F4E8] text-sm font-semibold text-[#26372B] transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-[#21834A] text-white flex items-center justify-center text-xs font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden md:inline max-w-[110px] truncate">
                    {user?.name?.split(' ')[0] || 'Account'}
                  </span>
                </Link>

                {/* Sign Out */}
                <button
                  type="button"
                  onClick={logout}
                  title="Sign out"
                  aria-label="Sign out"
                  className="p-2.5 rounded-xl text-[#526356] hover:text-rose-700 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#26372B] hover:bg-[#F2F7F3] transition-colors"
                >
                  <LogIn className="w-4 h-4 text-[#21834A]" />
                  <span>Sign in</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#21834A] hover:bg-[#1B6E3E] text-white text-sm font-semibold shadow-xs transition-colors"
                >
                  <span>Create account</span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl text-[#26372B] hover:bg-[#F2F7F3] transition-colors"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#DCE6DF] bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-5 space-y-5 max-h-[82vh] overflow-y-auto">
            {isAuthenticated ? (
              <div className="p-4 rounded-2xl bg-[#F8FAF8] border border-[#DCE6DF] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#21834A] text-white flex items-center justify-center text-sm font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#26372B]">{user?.name}</div>
                    <div className="text-xs text-[#526356]">
                      {user?.wardName ? `Ward: ${user.wardName}` : userRole}
                    </div>
                  </div>
                </div>
                {userRole === 'CITIZEN' && (
                  <Link
                    to="/wallet"
                    className="px-3 py-1.5 rounded-xl bg-[#E5F4E8] text-[#21834A] text-xs font-bold"
                  >
                    {user?.ecoCredits || 0} pts
                  </Link>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#E5F4E8] flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-[#26372B]">Welcome to Clear Waste</div>
                  <div className="text-xs text-[#526356]">Smarter waste. Cleaner communities.</div>
                </div>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl bg-[#21834A] text-white text-xs font-bold"
                >
                  Sign in
                </Link>
              </div>
            )}

            {/* Main Links */}
            <div className="space-y-1">
              <div className="text-xs font-bold text-[#526356] uppercase tracking-wider px-2 mb-2">
                Main Actions
              </div>
              {primaryNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#E5F4E8] text-[#21834A]'
                        : 'text-[#26372B] hover:bg-[#F8FAF8]'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-[#21834A]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Reuse & Recycling Section */}
            {reuseLinks.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-[#DCE6DF]">
                <div className="text-xs font-bold text-[#526356] uppercase tracking-wider px-2 mb-2">
                  Reuse, Compost & Recycle
                </div>
                {reuseLinks.map((sub) => {
                  const SubIcon = sub.icon;
                  const isActive = location.pathname === sub.path;
                  return (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      className={`flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-[#E5F4E8] text-[#21834A]'
                          : 'text-[#26372B] hover:bg-[#F8FAF8]'
                      }`}
                    >
                      <SubIcon className="w-5 h-5 text-[#21834A]" />
                      <div>
                        <div>{sub.label}</div>
                        <div className="text-xs font-normal text-[#526356]">{sub.desc}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Account Footer Links */}
            {isAuthenticated && (
              <div className="pt-3 border-t border-[#DCE6DF] space-y-2">
                {userRole === 'CITIZEN' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/wallet"
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8FAF8] text-xs font-semibold text-[#26372B]"
                    >
                      <Award className="w-4 h-4 text-[#21834A]" />
                      <span>My Points History</span>
                    </Link>
                    <Link
                      to="/orders"
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8FAF8] text-xs font-semibold text-[#26372B]"
                    >
                      <Package className="w-4 h-4 text-[#21834A]" />
                      <span>My Orders</span>
                    </Link>
                  </div>
                )}
                <div className="flex items-center justify-between px-2 pt-2">
                  <Link
                    to="/profile"
                    className="text-sm font-semibold text-[#26372B] hover:text-[#21834A]"
                  >
                    Account Settings
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-sm font-semibold text-rose-700 hover:underline"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
