import React, { useState } from 'react';
import { Download, FileText, CheckCircle2, Table, Database } from 'lucide-react';
import api from '../../services/api';

export default function ReportsExportTab() {
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState(null);

  const downloadReport = async (endpoint, filename) => {
    setDownloading(true);
    setMsg(null);
    try {
      const res = await api.get(endpoint);
      const data = res.data.data || res.data;

      // Convert to JSON blob
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setMsg(`Downloaded ${filename}.json successfully.`);
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      alert('Failed to download report data.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900">Municipal Reports & Data Exports</h3>
          <p className="text-xs text-slate-500">
            Export structured JSON reports derived directly from live database collections for academic evaluation.
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 mt-2">Collection Runs History</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Complete log of all dispatched collection routes, completed stops, skip reasons, and driver timestamps.
            </p>
          </div>
          <button
            onClick={() => downloadReport('/collection-runs/history', 'srinagar_collection_runs')}
            disabled={downloading}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Collection Runs</span>
          </button>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 mt-2">Smart Bins & Telemetry</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Registered smart bin coordinates, physical depth, capacity, current fill percentages, and sensor weights.
            </p>
          </div>
          <button
            onClick={() => downloadReport('/iot/bins', 'srinagar_smart_bins')}
            disabled={downloading}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Smart Bins Data</span>
          </button>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Table className="w-4 h-4" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 mt-2">Dumping Grievances & Hotspots</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              All citizen open-dumping complaint records, verification statuses, GPS coordinates, and 250m GIS clusters.
            </p>
          </div>
          <button
            onClick={() => downloadReport('/reports', 'srinagar_dumping_reports')}
            disabled={downloading}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Grievance Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
}
