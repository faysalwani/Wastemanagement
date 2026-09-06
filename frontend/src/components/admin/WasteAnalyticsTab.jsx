import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Recycle, 
  Sprout, 
  Trash2, 
  Repeat, 
  CheckCircle2, 
  Activity, 
  AlertCircle 
} from 'lucide-react';
import api from '../../services/api';

export default function WasteAnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get('/analytics/diversion');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load waste diversion analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="py-16 text-center text-xs text-slate-400">Aggregating database waste metrics...</div>;
  }

  const diversionRate = data?.diversionRatePercent || 0;
  const breakdown = data?.breakdownKg || { reused: 0, composted: 0, recycled: 0, residual: 0 };
  const totalWaste = data?.totalWasteKg || 0;
  const totalDiverted = data?.totalDivertedKg || 0;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Circular Economy KPI
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900">Municipal Waste Diversion Rate</h3>
          <p className="text-xs text-slate-500 max-w-xl">
            Calculated strictly from verified physical smart bin load-cells and completed citizen resource recoveries. Zero fabricated baselines.
          </p>
          <div className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl inline-block border border-emerald-200">
            Formula: Diversion Rate = (Reused + Composted + Recycled) / Total Waste × 100
          </div>
        </div>

        <div className="text-center md:text-right p-6 rounded-2xl bg-slate-50 border border-slate-200 min-w-[200px]">
          <div className="text-4xl font-extrabold text-emerald-700">
            {totalWaste > 0 ? `${diversionRate}%` : '0%'}
          </div>
          <span className="text-xs font-bold text-slate-600 block mt-1">Total Diverted from Landfill</span>
          <span className="text-[11px] text-slate-400">{totalDiverted} kg of {totalWaste} kg total</span>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Repeat className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block pt-2">Reused</span>
          <div className="text-2xl font-extrabold text-slate-900">{breakdown.reused} kg</div>
          <span className="text-[11px] text-purple-700 font-semibold">P2P Material Exchanges</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Sprout className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block pt-2">Composted</span>
          <div className="text-2xl font-extrabold text-slate-900">{breakdown.composted} kg</div>
          <span className="text-[11px] text-emerald-700 font-semibold">Household Bio-Waste</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
            <Recycle className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block pt-2">Recycled</span>
          <div className="text-2xl font-extrabold text-slate-900">{breakdown.recycled} kg</div>
          <span className="text-[11px] text-sky-700 font-semibold">Verified Center Drop-offs</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <Trash2 className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block pt-2">Residual</span>
          <div className="text-2xl font-extrabold text-slate-900">{breakdown.residual} kg</div>
          <span className="text-[11px] text-rose-600 font-semibold">Smart Bin Sensor Load</span>
        </div>
      </div>

      {/* Verified Data Sources Provenance */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h4 className="font-extrabold text-sm text-slate-900">Academic Data Provenance & Telemetry Integrity</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-900 block">📡 Measured Physical Hardware Data</span>
            <p className="text-[11px]">Source: {data?.dataSources?.measuredData?.source}</p>
            <div className="font-bold text-slate-800 pt-1">
              {data?.dataSources?.measuredData?.totalSmartBins || 0} smart bins • {data?.dataSources?.measuredData?.measuredWeightKg || 0} kg measured load
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-900 block">👥 Verified Citizen Recovery Logs</span>
            <p className="text-[11px]">Source: {data?.dataSources?.citizenEstimates?.source}</p>
            <div className="font-bold text-slate-800 pt-1">
              {data?.dataSources?.citizenEstimates?.totalTransactions || 0} transactions • {data?.dataSources?.citizenEstimates?.estimatedWeightKg || 0} kg verified recovery
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
