import React from 'react';
import { Camera, Sparkles } from 'lucide-react';

export default function Scan() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
          <Camera className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Waste Classification & Action Recommender</h1>
          <p className="text-xs text-slate-500">Capture or upload an image to identify waste stream, confidence score, and action pathways.</p>
        </div>
      </div>
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Ready for Milestone 5 Integration
        </div>
        <p className="text-sm text-slate-600">Deep Learning CNN Classifier (MobileNetV3 / EfficientNet-B0) with confidence calibration.</p>
      </div>
    </div>
  );
}
