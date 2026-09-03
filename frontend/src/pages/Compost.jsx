import React from 'react';
import { Sprout } from 'lucide-react';

export default function Compost() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-lime-100 text-lime-700 rounded-xl">
          <Sprout className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Household Composting Assistant</h1>
          <p className="text-xs text-slate-500">Guides for carbon:nitrogen balancing, aeration, moisture, and local safety rules.</p>
        </div>
      </div>
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-xs">
        <p className="text-sm text-slate-600">Interactive composting calculator scheduled for Milestone 6.</p>
      </div>
    </div>
  );
}
