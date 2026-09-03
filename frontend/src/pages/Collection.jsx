import React from 'react';
import { Truck } from 'lucide-react';

export default function Collection() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
          <Truck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Collection Schedules & Live Vehicle Radar</h1>
          <p className="text-xs text-slate-500">Track incoming municipal collection vehicles in real-time with 500-metre proximity warnings.</p>
        </div>
      </div>
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-xs">
        <p className="text-sm text-slate-600">VRP Route Execution & Proximity Radar scheduled for Milestones 12 & 13.</p>
      </div>
    </div>
  );
}
