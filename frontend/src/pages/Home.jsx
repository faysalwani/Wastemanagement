import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  Repeat, 
  Sprout, 
  Truck, 
  AlertTriangle, 
  Cpu, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  MapPin
} from 'lucide-react';
import api from '../services/api';

export default function Home() {
  const [backendHealth, setBackendHealth] = useState(null);

  useEffect(() => {
    api.get('/health')
      .then((res) => setBackendHealth(res.data))
      .catch(() => setBackendHealth({ status: 'OFFLINE' }));
  }, []);

  const featureCards = [
    {
      title: 'AI Waste Classifier',
      desc: 'Instant visual classification with MobileNetV3 and waste-to-action routing.',
      icon: Camera,
      link: '/scan',
      color: 'from-emerald-500 to-teal-600',
      badge: 'Computer Vision'
    },
    {
      title: 'P2P Resource Exchange',
      desc: 'Route organic waste to home composters and swap reusable materials.',
      icon: Repeat,
      link: '/exchange',
      color: 'from-blue-500 to-indigo-600',
      badge: 'Circular Economy'
    },
    {
      title: 'Composting Assistant',
      desc: 'Scientific carbon-nitrogen ratios, aeration, and household guides.',
      icon: Sprout,
      link: '/compost',
      color: 'from-lime-500 to-emerald-600',
      badge: 'Organic Recovery'
    },
    {
      title: 'Smart Bins & Telematics',
      desc: 'Ultrasonic fill percentage, load-cell weight, and temperature alerts.',
      icon: Cpu,
      link: '/smart-bins',
      color: 'from-violet-500 to-purple-600',
      badge: 'ESP32 IoT'
    },
    {
      title: 'Collection & Radar',
      desc: 'Scheduled pickups, VRP route optimization, and 500m truck proximity alerts.',
      icon: Truck,
      link: '/collection',
      color: 'from-amber-500 to-orange-600',
      badge: 'Real-Time Radar'
    },
    {
      title: 'Open Dumping Reports',
      desc: 'Geotagged citizen complaints with spatial clustering hotspot GIS.',
      icon: AlertTriangle,
      link: '/reports',
      color: 'from-rose-500 to-pink-600',
      badge: 'GIS Hotspots'
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-eco-50/70 via-white to-slate-50 pt-16 pb-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eco-100 border border-eco-200 text-eco-800 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-eco-600" />
            M.Sc. AI & ML Major Project • NDU Srinagar
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-none max-w-4xl mx-auto">
            An IoT-Based Intelligent Waste Management & <span className="bg-gradient-to-r from-eco-600 to-teal-600 bg-clip-text text-transparent">Resource Recovery</span> Platform
          </h1>

          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Bridging citizens, collection services, smart bins, and recyclers into a unified circular economy coordination network.
          </p>

          {/* Philosophy Banner */}
          <div className="mt-10 max-w-3xl mx-auto p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Core Philosophy</div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">Generate Less</span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800">Reuse</span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded-md bg-lime-100 text-lime-800">Compost</span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800">Recycle</span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800">Collect</span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">Dispose Remaining</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-eco-600 hover:bg-eco-700 text-white font-semibold text-sm shadow-lg shadow-eco-600/30 hover:scale-[1.02] transition-all"
            >
              <Camera className="w-5 h-5" />
              Scan Waste with AI
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/smart-bins"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-sm border border-slate-300 shadow-xs hover:scale-[1.02] transition-all"
            >
              <Cpu className="w-5 h-5 text-eco-600" />
              Monitor Smart Bins
            </Link>
          </div>

          {/* Backend Health Pill */}
          <div className="mt-8 inline-flex items-center gap-2 text-xs text-slate-500">
            <span className={`w-2 h-2 rounded-full ${backendHealth?.status === 'HEALTHY' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            Backend API: <span className="font-semibold">{backendHealth?.status || 'Checking...'}</span> ({backendHealth?.version || 'v1.0.0'})
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Unified Circular Waste Ecosystem
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Engineered specifically for the geographical and community dynamics of Srinagar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.link}
                className="group relative p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-xl hover:border-slate-300 transition-all hover:-translate-y-1 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-eco-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1 text-xs font-bold text-eco-600 group-hover:translate-x-1 transition-transform">
                  Explore Module <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
