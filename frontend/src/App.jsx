import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import BrandLogo from './components/BrandLogo';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Scan from './pages/Scan';
import Exchange from './pages/Exchange';
import Compost from './pages/Compost';
import Collection from './pages/Collection';
import Reports from './pages/Reports';
import SmartBins from './pages/SmartBins';
import CitizenDashboard from './pages/CitizenDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminHub from './pages/AdminHub';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import Wallet from './pages/Wallet';
import Marketplace from './pages/Marketplace';
import Orders from './pages/Orders';
import Recyclers from './pages/Recyclers';

function NotFoundPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#E5F4E8] text-[#21834A] font-extrabold text-2xl">
        404
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#26372B]">
        Page not found
      </h1>
      <p className="text-sm sm:text-base text-[#526356]">
        We couldn’t find the page you were looking for. Use the button below to return home.
      </p>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#21834A] hover:bg-[#1B6E3E] text-white text-sm font-semibold transition-colors"
        >
          Back to Clear Waste Home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-[#F8FAF8] text-[#26372B]">
            {/* Accessible Skip Link */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[#21834A] focus:text-white focus:font-semibold"
            >
              Skip to main content
            </a>

            <Navbar />

            <main id="main-content" className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Role-Specific Dashboards */}
                <Route
                  path="/citizen"
                  element={
                    <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN', 'SUPER_ADMIN']}>
                      <CitizenDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/driver"
                  element={
                    <ProtectedRoute allowedRoles={['DRIVER', 'SUPER_ADMIN']}>
                      <DriverDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                      <AdminHub />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/super-admin"
                  element={
                    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                      <SuperAdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Core Feature Modules */}
                <Route path="/scan" element={<Scan />} />
                <Route path="/exchange" element={<Exchange />} />
                <Route path="/compost" element={<Compost />} />
                <Route path="/collection" element={<Collection />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/smart-bins" element={<SmartBins />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/recyclers" element={<Recyclers />} />

                {/* Authenticated Citizen / User Profile, Wallet & Orders */}
                <Route
                  path="/wallet"
                  element={
                    <ProtectedRoute>
                      <Wallet />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>

            {/* Global Footer */}
            <footer className="bg-white border-t border-[#DCE6DF] py-10 mt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <BrandLogo showTagline={true} size="sm" />

                <nav
                  aria-label="Footer Navigation"
                  className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#526356]"
                >
                  <Link to="/scan" className="hover:text-[#21834A] transition-colors">
                    Scan Waste
                  </Link>
                  <Link to="/collection" className="hover:text-[#21834A] transition-colors">
                    Request a Pickup
                  </Link>
                  <Link to="/reports" className="hover:text-[#21834A] transition-colors">
                    Report Dumping
                  </Link>
                  <Link to="/exchange" className="hover:text-[#21834A] transition-colors">
                    Reuse & Share
                  </Link>
                  <Link to="/recyclers" className="hover:text-[#21834A] transition-colors">
                    Recycling Centres
                  </Link>
                  <Link to="/marketplace" className="hover:text-[#21834A] transition-colors">
                    My Rewards
                  </Link>
                </nav>

                <p className="text-xs text-[#526356]">
                  © {new Date().getFullYear()} <strong>Clear Waste</strong>. Smarter waste. Cleaner communities.
                </p>
              </div>
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </SocketProvider>
  );
}
