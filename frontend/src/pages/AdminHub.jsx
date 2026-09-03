import React from 'react';
import { LayoutDashboard } from 'lucide-react';

export default function AdminHub() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-900 text-white rounded-xl">
          <LayoutDashboard className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Administrative BI & Fleet Hub</h1>
          <p className="text-xs text-slate-500">Executive metrics, route generation, complaint resolution, and device provisioning.</p>
        </div>
      </div>
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-xs">
        <p className="text-sm text-slate-600">Admin BI dashboard scheduled for Milestone 14.</p>
      </div>
    </div>
  );
}
