import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
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
import AdminHub from './pages/AdminHub';

export default function App() {
  return (
    <SocketProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public & Core Feature Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/scan" element={<Scan />} />
                <Route path="/exchange" element={<Exchange />} />
                <Route path="/compost" element={<Compost />} />
                <Route path="/collection" element={<Collection />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/smart-bins" element={<SmartBins />} />

                {/* Authenticated Citizen / User Profile */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Role-Guarded Administrative Hub */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminHub />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>

            {/* Global Footer */}
            <footer className="bg-white border-t border-slate-200 py-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <p>
                  © 2026 <strong>EcoCycle Srinagar</strong> — M.Sc. AI & ML Major Project (NDU202500069).
                </p>
                <p className="flex items-center gap-2">
                  <span>NIELIT Deemed to be University • NDU Campus Srinagar</span>
                </p>
              </div>
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </SocketProvider>
  );
}
