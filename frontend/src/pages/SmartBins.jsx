import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  BatteryCharging, 
  Thermometer, 
  Weight, 
  MapPin, 
  RefreshCw,
  Layers,
  Radio
} from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

// Custom Leaflet Pin Generator
const createBinIcon = (status) => {
  const color =
    status === 'URGENT' ? '#ef4444' : status === 'WARNING' ? '#f59e0b' : '#10b981';

  return L.divIcon({
    className: 'custom-bin-marker',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export default function SmartBins() {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState('ALL');
  const { socket } = useSocket() || {};

  const fetchBins = async () => {
    try {
      const res = await api.get('/iot/bins');
      if (res.data.success) {
        setBins(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch smart bins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBins();
  }, []);

  // Listen for real-time WebSocket telemetry updates
  useEffect(() => {
    if (!socket) return;

    const handleTelemetryUpdate = (updatedBin) => {
      setBins((prev) =>
        prev.map((b) => (b.binId === updatedBin.binId ? { ...b, ...updatedBin } : b))
      );
    };

    socket.on('smartbin_telemetry_updated', handleTelemetryUpdate);

    return () => {
      socket.off('smartbin_telemetry_updated', handleTelemetryUpdate);
    };
  }, [socket]);

  // Aggregate Metrics
  const totalBins = bins.length;
  const urgentBins = bins.filter((b) => b.status === 'URGENT').length;
  const warningBins = bins.filter((b) => b.status === 'WARNING').length;
  const normalBins = bins.filter((b) => b.status === 'NORMAL').length;
  const avgFill = totalBins > 0
    ? Math.round(bins.reduce((acc, b) => acc + b.currentFillPercent, 0) / totalBins)
    : 0;

  const filteredBins = selectedWard === 'ALL'
    ? bins
    : bins.filter((b) => b.wardName === selectedWard);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
            ESP32 Microcontroller Telematics
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            IoT Smart Bin Telematics Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time ultrasonic fill tracking, load-cell strain measurements, and thermal alert monitoring across Srinagar.
          </p>
        </div>

        <button
          onClick={fetchBins}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Refresh Telematics</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Smart Bins</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{totalBins}</div>
          <span className="text-[11px] text-slate-500">Active monitoring points</span>
        </div>

        <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 shadow-xs">
          <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Urgent Bins (≥80%)</span>
          <div className="text-3xl font-extrabold text-rose-950 mt-2">{urgentBins}</div>
          <span className="text-[11px] text-rose-700">Immediate pickup required</span>
        </div>

        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 shadow-xs">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Warning Bins (50-79%)</span>
          <div className="text-3xl font-extrabold text-amber-950 mt-2">{warningBins}</div>
          <span className="text-[11px] text-amber-700">Approaching threshold</span>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Average Fleet Fill</span>
          <div className="text-3xl font-extrabold text-emerald-950 mt-2">{avgFill}%</div>
          <span className="text-[11px] text-emerald-700">Normal operating load</span>
        </div>
      </div>

      {/* Interactive Leaflet GIS Map */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-eco-600" />
            <span>Srinagar Smart Bins Geographic Telemetry Map</span>
          </h2>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Normal
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Warning
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Urgent
            </span>
          </div>
        </div>

        <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-200 relative z-10">
          <MapContainer
            center={[34.0837, 74.7973]}
            zoom={12}
            scrollWheelZoom={false}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredBins.map((bin) => {
              const coords = [bin.location.coordinates[1], bin.location.coordinates[0]];
              return (
                <React.Fragment key={bin.binId}>
                  <Marker position={coords} icon={createBinIcon(bin.status)}>
                    <Popup>
                      <div className="p-1 space-y-1.5 text-xs">
                        <div className="font-bold text-slate-900">{bin.name}</div>
                        <div className="text-[11px] text-slate-500">{bin.wardName} • {bin.binId}</div>
                        <div className="pt-1 border-t border-slate-200 flex justify-between gap-4 font-semibold">
                          <span>Fill Level:</span>
                          <span className={bin.status === 'URGENT' ? 'text-rose-600 font-bold' : ''}>
                            {bin.currentFillPercent}%
                          </span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-600">
                          <span>Weight:</span>
                          <span>{bin.currentWeightKg} kg</span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-600">
                          <span>Temperature:</span>
                          <span>{bin.currentTemperatureC}°C</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                  {bin.status === 'URGENT' && (
                    <Circle
                      center={coords}
                      radius={250}
                      pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15 }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Telematics List Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Individual Smart-Bin Sensor Readouts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBins.map((bin) => (
            <div
              key={bin.binId}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {bin.binId}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{bin.name}</h4>
                  <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {bin.wardName}
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  bin.status === 'URGENT'
                    ? 'bg-rose-100 text-rose-800'
                    : bin.status === 'WARNING'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {bin.status}
                </span>
              </div>

              {/* Fill Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Ultrasonic Fill Level</span>
                  <span className={bin.status === 'URGENT' ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                    {bin.currentFillPercent}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      bin.status === 'URGENT'
                        ? 'bg-rose-500'
                        : bin.status === 'WARNING'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${bin.currentFillPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Sensor Grid Readings */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50">
                  <Weight className="w-3.5 h-3.5 mx-auto text-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-500 block">Weight</span>
                  <span className="text-xs font-bold text-slate-800">{bin.currentWeightKg} kg</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50">
                  <Thermometer className="w-3.5 h-3.5 mx-auto text-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-500 block">Temp</span>
                  <span className="text-xs font-bold text-slate-800">{bin.currentTemperatureC}°C</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50">
                  <BatteryCharging className="w-3.5 h-3.5 mx-auto text-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-500 block">Battery</span>
                  <span className="text-xs font-bold text-slate-800">{bin.batteryPercent}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
