import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Sprout, 
  AlertTriangle, 
  Recycle, 
  Repeat, 
  Layers, 
  Save, 
  CheckCircle2, 
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import api from '../../services/api';

export default function RewardConfigTab() {
  const [config, setConfig] = useState({
    compostingPoints: 20,
    dumpingReportPoints: 50,
    recyclingDropOffPoints: 30,
    resourceExchangePoints: 25,
    sourceSegregationPoints: 15,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/credits/config');
      if (res.data.success && res.data.data) {
        setConfig(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load reward configuration:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/credits/config', config);
      if (res.data.success) {
        setConfig(res.data.data);
        setFeedback('Eco-Credit reward rates updated successfully! All future transactions will reflect these incentives.');
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update reward configuration');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    {
      key: 'compostingPoints',
      title: 'Home Composting Verification',
      description: 'Awarded when a citizen records organic waste diverted to backyard/community compost bin.',
      icon: Sprout,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200'
    },
    {
      key: 'dumpingReportPoints',
      title: 'Illegal Dumping Report Verified',
      description: 'Awarded when municipal admins review and resolve a GPS-tagged open dumping grievance submitted by a citizen.',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    },
    {
      key: 'recyclingDropOffPoints',
      title: 'Scrap Depot Drop-Off',
      description: 'Awarded when scrap recyclable materials are deposited at a certified municipal recovery depot.',
      icon: Recycle,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-200'
    },
    {
      key: 'resourceExchangePoints',
      title: 'Circular Resource Exchange',
      description: 'Awarded when reusable goods, electronics, or furniture are successfully shared or re-homed.',
      icon: Repeat,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-200'
    },
    {
      key: 'sourceSegregationPoints',
      title: 'Source Segregation Compliance',
      description: 'Awarded to households adhering to clean wet/dry/hazardous separation during doorstep vehicle collection.',
      icon: Layers,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Dynamic Eco-Credits & Reward Incentive Configuration</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Set real-time points multipliers for positive ecological actions taken by Srinagar citizens.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs hover:bg-slate-850 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-emerald-400" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
          Loading system reward configuration...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((f) => {
              const Icon = f.icon;
              return (
                <div 
                  key={f.key}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${f.bg} ${f.border} border`}>
                          <Icon className={`w-4 h-4 ${f.color}`} />
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900">{f.title}</h4>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Per Event
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      {f.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Incentive Value (EC):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={config[f.key] ?? 0}
                        onChange={(e) => setConfig({ ...config, [f.key]: Number(e.target.value) })}
                        className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-extrabold text-right text-emerald-800 bg-slate-50 focus:bg-white outline-none focus:border-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-400">pts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-100 rounded-2xl text-[11px] text-slate-600 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <p>
              Points modified here are immediately used when any citizen logs a composting activity, when administrators approve illegal dumping grievances, and during scrap redemption. No server restarts are necessary.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
