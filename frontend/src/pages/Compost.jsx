import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sprout, 
  Leaf, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Droplets, 
  Wind, 
  ThermometerSun, 
  Layers, 
  Sparkles, 
  Repeat, 
  ArrowRight,
  Info
} from 'lucide-react';

export default function Compost() {
  // Simulator State: Green Waste (kg) and Brown Waste (kg)
  const [greensKg, setGreensKg] = useState(3);
  const [brownsKg, setBrownsKg] = useState(6);
  const [turningFreq, setTurningFreq] = useState('WEEKLY'); // WEEKLY, BIWEEKLY, NONE

  // Average C:N approximations: Greens ~ 18:1, Browns ~ 60:1
  // Effective ratio weighted by mass
  const totalMass = greensKg + brownsKg;
  const estimatedRatio = totalMass > 0 
    ? Math.round((greensKg * 18 + brownsKg * 60) / totalMass)
    : 30;

  // Estimated decomposition weeks
  let estimatedWeeks = 8;
  if (estimatedRatio >= 25 && estimatedRatio <= 35) {
    if (turningFreq === 'WEEKLY') estimatedWeeks = 6;
    else if (turningFreq === 'BIWEEKLY') estimatedWeeks = 9;
    else estimatedWeeks = 16;
  } else if (estimatedRatio < 25) {
    estimatedWeeks = 12; // too wet/smelly, takes longer
  } else {
    estimatedWeeks = 18; // too dry/carbonaceous, very slow
  }

  // Ratio status classification
  let ratioStatus = 'OPTIMAL';
  let ratioMessage = 'Ideal Carbon-to-Nitrogen balance! Healthy thermophilic bacterial activity.';
  let ratioBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';

  if (estimatedRatio < 22) {
    ratioStatus = 'TOO_GREEN';
    ratioMessage = 'Excess Nitrogen (Too Wet). High risk of anaerobic smell. Add more dry brown leaves or shredded cardboard.';
    ratioBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
  } else if (estimatedRatio > 38) {
    ratioStatus = 'TOO_BROWN';
    ratioMessage = 'Excess Carbon (Too Dry). Decomposition will stall. Add fresh vegetable peels or moist garden trimmings.';
    ratioBadgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
  }

  const greenItems = [
    'Fresh vegetable peels & fruit scraps',
    'Used coffee grounds & tea leaves',
    'Fresh green lawn grass clippings',
    'Crushed eggshells (calcium mineral source)',
    'Uncooked kitchen food leftovers (plant-based)'
  ];

  const brownItems = [
    'Dry fallen Chinar & autumn garden leaves',
    'Uncoated corrugated cardboard strips',
    'Plain shredded brown paper / egg cartons',
    'Untreated wood shavings & fine sawdust',
    'Dry straw & dead flower stalks'
  ];

  const prohibitedItems = [
    { item: 'Meat, poultry & fish bones', reason: 'Attracts rodents and stray animals; releases putrid odors.' },
    { item: 'Dairy, cheese & butter', reason: 'Fat slows aeration and attracts pests.' },
    { item: 'Oils, lard & greasy foods', reason: 'Smothers beneficial aerobic microorganisms.' },
    { item: 'Diseased garden plants', reason: 'Fungal spores survive sub-optimal home pile temperatures.' },
    { item: 'Dog or cat feces', reason: 'May harbor harmful parasites (e.g., Toxoplasma).' },
    { item: 'Glossy magazine paper / colored ink', reason: 'Contains synthetic dyes and toxic heavy metals.' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold text-emerald-200">
            <Sprout className="w-3.5 h-3.5 text-lime-300" />
            Zero-Waste Circular Living • Srinagar
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Scientific Household Composting Assistant
          </h1>
          <p className="text-sm text-emerald-100 leading-relaxed font-normal">
            Convert kitchen scraps and fallen Chinar leaves into nutrient-rich organic humus. Composting diverts up to 45% of Srinagar's municipal solid waste from landfills.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Interactive C:N Ratio Simulator */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-eco-600" />
              <span>Interactive Batch C:N Ratio Calculator</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate your compost ingredients to achieve the golden microbial ratio (~30:1).
            </p>
          </div>
          <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold border ${ratioBadgeClass}`}>
            Ratio: {estimatedRatio}:1 ({ratioStatus.replace('_', ' ')})
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Sliders Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Green Waste Slider */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Green Nitrogen Waste (Kitchen Scraps, Peels)
                </label>
                <span className="text-sm font-extrabold text-emerald-900">{greensKg} kg</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15"
                step="0.5"
                value={greensKg}
                onChange={(e) => setGreensKg(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-emerald-700 font-medium">
                <span>0.5 kg (Small Kitchen)</span>
                <span>15 kg (Bulk Community)</span>
              </div>
            </div>

            {/* Brown Waste Slider */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                  Brown Carbon Waste (Dry Leaves, Cardboard)
                </label>
                <span className="text-sm font-extrabold text-amber-900">{brownsKg} kg</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="25"
                step="0.5"
                value={brownsKg}
                onChange={(e) => setBrownsKg(parseFloat(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-amber-700 font-medium">
                <span>0.5 kg (A few cartons)</span>
                <span>25 kg (Bags of dry Chinar leaves)</span>
              </div>
            </div>

            {/* Turning Frequency */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Pile Aeration Frequency
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'WEEKLY', label: 'Every 5–7 Days', sub: 'Fast Aerobic' },
                  { id: 'BIWEEKLY', label: 'Every 2 Weeks', sub: 'Moderate' },
                  { id: 'NONE', label: 'Passive (Unturned)', sub: 'Slow Digestion' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTurningFreq(f.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      turningFreq === f.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>{f.label}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{f.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Analysis KPI Card */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Batch Decomposition Outlook
              </span>
              
              <div className="mt-4 space-y-1">
                <div className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-eco-600" />
                  <span>~{estimatedWeeks} Weeks</span>
                </div>
                <p className="text-xs text-slate-500">Estimated time until harvest-ready dark compost</p>
              </div>

              {/* Advice Message */}
              <div className="mt-5 p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-slate-800">
                  <Info className="w-3.5 h-3.5 text-eco-600" />
                  Microbial Diagnosis:
                </div>
                <p className="leading-relaxed">{ratioMessage}</p>
              </div>
            </div>

            {/* P2P Surplus Direct Link */}
            <div className="p-3 rounded-2xl bg-eco-50 border border-eco-200 text-xs space-y-2">
              <span className="font-semibold text-eco-900 block">Surplus Organic Scraps?</span>
              <p className="text-[11px] text-eco-800">
                Don't dump excess kitchen waste in the municipal bin. Share it with local home composters!
              </p>
              <Link
                to="/exchange"
                className="inline-flex items-center gap-1 text-xs font-bold text-eco-700 hover:text-eco-900"
              >
                <span>Offer on Resource Exchange</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars of Aerobic Composting */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Nitrogen (Greens)',
            desc: 'Proteins & amino acids providing essential nourishment for rapid bacterial multiplication.',
            icon: Sprout,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            title: 'Carbon (Browns)',
            desc: 'Dry carbohydrates providing energy, structure, and microscopic air pockets inside the pile.',
            icon: Leaf,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            title: 'Moisture (40–60%)',
            desc: 'Feels like a squeezed damp sponge. Water is needed for cellular metabolism across microbes.',
            icon: Droplets,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            title: 'Aeration & Oxygen',
            desc: 'Turning the pile introduces vital oxygen, preventing bad odors and foul anaerobic methane gas.',
            icon: Wind,
            color: 'text-teal-600',
            bg: 'bg-teal-50',
          },
        ].map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div key={pillar.title} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className={`w-10 h-10 rounded-xl ${pillar.bg} ${pillar.color} flex items-center justify-center shadow-xs`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">{pillar.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">{pillar.desc}</p>
            </div>
          );
        })}
      </section>

      {/* Greens vs Browns Ingredient Guide */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Greens Column */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-emerald-900 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            Nitrogen-Rich Ingredients ("Greens")
          </h3>
          <p className="text-xs text-slate-500">
            Moist, rich in nitrogen, breaks down rapidly with heat generation.
          </p>
          <ul className="space-y-2.5">
            {greenItems.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Browns Column */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-amber-100 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-600"></span>
            Carbon-Rich Ingredients ("Browns")
          </h3>
          <p className="text-xs text-slate-500">
            Dry, porous, rich in cellulose, creates airflow and absorbs excess moisture.
          </p>
          <ul className="space-y-2.5">
            {brownItems.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Prohibited Materials Safety Warning Card */}
      <section className="p-6 sm:p-8 rounded-3xl bg-rose-50/70 border border-rose-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-900">
              Prohibited Items (Never Add to Household Compost)
            </h3>
            <p className="text-xs text-rose-700">
              Adding these items compromises pathogen control, attracts pests, and produces foul odors.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {prohibitedItems.map((p) => (
            <div key={p.item} className="p-4 rounded-2xl bg-white border border-rose-200/80 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-rose-900 block">❌ {p.item}</span>
              <p className="text-[11px] text-slate-600 leading-normal">{p.reason}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
