import React from 'react';
import { Cpu } from 'lucide-react';

export default function SmartBins() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-violet-100 text-violet-700 rounded-xl">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">IoT Smart Bins & Telematics</h1>
          <p className="text-xs text-slate-500">Live ultrasonic fill levels, load-cell strain measurements, and thermal warnings.</p>
        </div>
      </div>
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-xs">
        <p className="text-sm text-slate-600">Smart-bin telematics & Virtual Fleet Simulator integration scheduled for Milestones 9 & 10.</p>
      </div>
    </div>
  );
}
