import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  ShieldAlert, 
  Search, 
  Filter, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  AlertTriangle,
  Key,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminDashboard() {
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('USERS'); // 'USERS' or 'AUDIT'
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Action Modal State (Role Promotion)
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('CITIZEN');
  const [roleReason, setRoleReason] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Status Confirmation Modal
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [statusReason, setStatusReason] = useState('');

  const [feedback, setFeedback] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/super-admin/users?${params.toString()}`);
      if (res.data.success) {
        setUsers(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch user directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/super-admin/audit-logs');
      if (res.data.success) {
        setAuditLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'USERS') {
      fetchUsers();
    } else {
      fetchAuditLogs();
    }
  }, [activeTab, page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Execute Role Change
  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      const res = await api.patch(`/super-admin/users/${selectedUser._id}/role`, {
        role: newRole,
        reason: roleReason || 'Administrative promotion by Super Administrator',
      });

      if (res.data.success) {
        setFeedback({ type: 'success', message: res.data.message });
        setModalOpen(false);
        fetchUsers();
        fetchAuditLogs();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Failed to update user role.',
      });
    }
  };

  // Execute Status Toggle (Suspend / Reactivate)
  const handleToggleStatus = async () => {
    if (!statusModalUser) return;
    const nextStatus = !statusModalUser.isActive;

    try {
      const res = await api.patch(`/super-admin/users/${statusModalUser._id}/status`, {
        isActive: nextStatus,
        reason: statusReason || `Account ${nextStatus ? 'reactivated' : 'suspended'} by Super Administrator`,
      });

      if (res.data.success) {
        setFeedback({ type: 'success', message: res.data.message });
        setStatusModalUser(null);
        fetchUsers();
        fetchAuditLogs();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Failed to update user account status.',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-slate-900 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Root System Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Super Administrator Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            System-wide identity governance, privileged role assignment, account suspension, and immutable security audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Directory</span>
            <span className="text-2xl font-extrabold text-white">{totalCount} Accounts</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-xs underline font-bold">Dismiss</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'USERS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User & Role Governance ({totalCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'AUDIT'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Security Audit Logs</span>
        </button>
      </div>

      {/* TAB 1: USER & ROLE MANAGEMENT */}
      {activeTab === 'USERS' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, ward..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs outline-none"
              />
            </form>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
              >
                <option value="">All Roles</option>
                <option value="CITIZEN">Citizen</option>
                <option value="DRIVER">Driver</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="SUSPENDED">Suspended Only</option>
              </select>
            </div>
          </div>

          {/* User Directory Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Ward</th>
                  <th className="py-3 px-3">Eco-Credits</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Privileged Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isMe = u._id === currentUser?._id;
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'ADMIN'
                            ? 'bg-indigo-100 text-indigo-800'
                            : u.role === 'DRIVER'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-600">{u.wardName || 'Lal Chowk'}</td>
                      <td className="py-3 px-3 font-bold text-slate-800">{u.ecoCredits || 0} pts</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        {/* Change Role Button */}
                        <button
                          disabled={isMe}
                          onClick={() => {
                            setSelectedUser(u);
                            setNewRole(u.role);
                            setRoleReason('');
                            setModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-colors disabled:opacity-30"
                        >
                          Change Role
                        </button>

                        {/* Suspend / Reactivate Button */}
                        <button
                          disabled={isMe}
                          onClick={() => {
                            setStatusModalUser(u);
                            setStatusReason('');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors disabled:opacity-30 ${
                            u.isActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {u.isActive ? 'Suspend' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Privileged Action Security Log</h3>
            <p className="text-xs text-slate-500">Immutable trace of role reassignments, promotions, and account status updates.</p>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[11px] text-slate-400">• {new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-600">
                    Target: <strong className="font-bold">{log.targetUser?.name || 'Unknown'}</strong> ({log.targetUser?.email})
                    {' '}| Value: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{log.previousValue} → {log.newValue}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 italic">Reason: {log.reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[11px] text-slate-500">By: {log.performedBy?.name}</span>
                  <div className="text-[10px] text-slate-400 font-mono">IP: {log.ipAddress}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Modification Modal */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Assign Role for {selectedUser.name}
            </h3>
            <p className="text-xs text-slate-500">
              Current Role: <strong className="font-bold text-slate-800">{selectedUser.role}</strong>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select New Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="CITIZEN">Citizen (Household Segregator)</option>
                  <option value="DRIVER">Driver (Collection Vehicle Operator)</option>
                  <option value="ADMIN">Admin (Municipal Operations)</option>
                  <option value="SUPER_ADMIN">Super Admin (Root Authority)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason for Change</label>
                <input
                  type="text"
                  placeholder="e.g. Assigned to Batamaloo compactor fleet"
                  value={roleReason}
                  onChange={(e) => setRoleReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateRole}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold shadow-xs"
                >
                  Apply Role Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend / Reactivate Confirmation Modal */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Confirm Account {statusModalUser.isActive ? 'Suspension' : 'Reactivation'}
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to {statusModalUser.isActive ? 'suspend' : 'reactivate'} the account of{' '}
              <strong className="font-bold">{statusModalUser.name}</strong> ({statusModalUser.email})?
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Violation of civic waste disposal rules"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  className={`px-5 py-2 rounded-xl text-white font-semibold shadow-xs ${
                    statusModalUser.isActive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {statusModalUser.isActive ? 'Confirm Suspension' : 'Confirm Reactivation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
