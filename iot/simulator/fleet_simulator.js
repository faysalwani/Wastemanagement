/**
 * Virtual Smart-Bin Fleet Simulator for Srinagar Municipal Network
 * Simulates real-time telemetry from 20 smart bins across Srinagar wards.
 * Ideal for viva examination demonstrations and load testing.
 */

const http = require('http');

const API_HOST = process.env.API_HOST || '127.0.0.1';
const API_PORT = process.env.API_PORT || 5000;
const TICK_INTERVAL_MS = 5000; // Ingest every 5 seconds

// 20 Smart Bins distributed across Srinagar
const SMART_BINS = [
  { binId: 'BIN_SRG_01', name: 'Lal Chowk Ghanta Ghar', depthCm: 100, fill: 88, weight: 38.5, temp: 21.0 },
  { binId: 'BIN_SRG_02', name: 'Rajbagh Bund Promenade', depthCm: 100, fill: 42, weight: 16.0, temp: 19.5 },
  { binId: 'BIN_SRG_03', name: 'Hazratbal Shrine Gate 1', depthCm: 100, fill: 76, weight: 31.0, temp: 22.0 },
  { binId: 'BIN_SRG_04', name: 'Bemina NH Bypass Circle', depthCm: 100, fill: 92, weight: 44.0, temp: 24.5 },
  { binId: 'BIN_SRG_05', name: 'Nishat Foreshore Road', depthCm: 100, fill: 35, weight: 12.5, temp: 18.2 },
  { binId: 'BIN_SRG_06', name: 'Soura SKIMS Hospital Entrance', depthCm: 100, fill: 65, weight: 27.0, temp: 20.4 },
  { binId: 'BIN_SRG_07', name: 'Batamaloo Bus Terminus', depthCm: 100, fill: 84, weight: 39.0, temp: 23.1 },
  { binId: 'BIN_SRG_08', name: 'Dalgate Boulevard Ghat 1', depthCm: 100, fill: 55, weight: 22.0, temp: 19.8 },
  { binId: 'BIN_SRG_09', name: 'Khanyar Dastgeer Sahib', depthCm: 100, fill: 70, weight: 29.5, temp: 21.6 },
  { binId: 'BIN_SRG_10', name: 'Karan Nagar SMHS Access', depthCm: 100, fill: 89, weight: 41.2, temp: 22.8 },
];

function sendTelemetry(bin) {
  // Simulate small natural fill increase (or reset if emptied)
  if (bin.fill >= 98) {
    bin.fill = 15; // Emptying event
    bin.weight = 4.0;
  } else {
    bin.fill += Math.random() > 0.4 ? Math.floor(Math.random() * 3) : 0;
    bin.weight += +(Math.random() * 0.4).toFixed(1);
  }

  bin.temp = +(20 + Math.sin(Date.now() / 100000) * 4 + (Math.random() * 0.8 - 0.4)).toFixed(1);
  const rawDistanceCm = Math.max(0, Math.round(bin.depthCm * (1 - bin.fill / 100)));

  const payload = JSON.stringify({
    binId: bin.binId,
    rawDistanceCm,
    weightKg: bin.weight,
    temperatureC: bin.temp,
    batteryPercent: 96,
  });

  const options = {
    hostname: API_HOST,
    port: API_PORT,
    path: '/api/v1/iot/telemetry',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const req = http.request(options, (res) => {
    // Silent success
  });

  req.on('error', (err) => {
    // Backend may still be booting
  });

  req.write(payload);
  req.end();
}

console.log('====================================================');
console.log('📡 Starting Virtual Smart-Bin Fleet Simulator');
console.log(`Target Gateway: http://${API_HOST}:${API_PORT}/api/v1/iot/telemetry`);
console.log(`Active Simulated Bins: ${SMART_BINS.length} bins across Srinagar`);
console.log('====================================================');

setInterval(() => {
  // Pick 2 random bins each tick to send telematics
  const randomBin = SMART_BINS[Math.floor(Math.random() * SMART_BINS.length)];
  sendTelemetry(randomBin);
}, TICK_INTERVAL_MS);

// Immediate first tick for the first 3 bins
SMART_BINS.slice(0, 3).forEach(sendTelemetry);
