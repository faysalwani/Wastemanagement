import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Reports() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Open-Dumping Geotagged Reporting</h1>
          <p className="text-xs text-slate-500">Report illicit waste dumping with photo evidence and GPS coordinates to trigger cleanup.</p>
        </div>
      </div>
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-xs">
        <p className="text-sm text-slate-600">Geotagged complaint dispatcher & GIS Hotspot clustering scheduled for Milestone 11.</p>
      </div>
    </div>
  );
}
