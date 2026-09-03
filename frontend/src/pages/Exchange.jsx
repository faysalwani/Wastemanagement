import React from 'react';
import { Repeat } from 'lucide-react';

export default function Exchange() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
          <Repeat className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">P2P Bio-Waste & Resource Exchange</h1>
          <p className="text-xs text-slate-500">Connect kitchen gardeners, home composters, and scrap users across Srinagar.</p>
        </div>
      </div>
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-xs">
        <p className="text-sm text-slate-600">P2P Marketplace with concurrency-protected claims scheduled for Milestone 7.</p>
      </div>
    </div>
  );
}
