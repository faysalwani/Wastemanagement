import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sprout, 
  Leaf, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Droplets, 
  Wind, 
  ArrowRight,
  Info,
  Award,
  CheckCircle,
  History
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Compost() {
  const { user, isAuthenticated, refreshUser } = useAuth() || {};

  const [activeTab, setActiveTab] = useState('SIMULATOR');

  const [greensKg, setGreensKg] = useState(5);
  const [brownsKg, setBrownsKg] = useState(10);
  const [turningFreq, setTurningFreq] = useState('WEEKLY');
  const [wasteType, setWasteType] = useState('VEGETABLE_SCRAPS');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const [myBatches, setMyBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const greenItems = [
    'Raw vegetable peels & scraps',
    'Fruit rinds, apple cores & skins',
    'Fresh green lawn & weed clippings',
    'Coffee grounds & unbleached paper filters',
    'Crushed eggshells (calcium buffer)',
    'Tea bags & loose boiled tea leaves',
  ];

  const brownItems = [
    'Fallen autumn Chinar & poplar leaves',
    'Dry straw, hay & clean garden mulch',
    'Shredded cardboard & non-glossy newsprint',
    'Dry sawdust & clean wood shavings',
    'Dried pine needles (in small moderation)',
    'Crushed dry twigs & pruning trimmings',
  ];

  const prohibitedItems = [
    { item: 'Meat, Bones & Poultry', reason: 'Attracts rodents, dogs, and creates putrid odors.' },
    { item: 'Dairy, Cheese & Oils', reason: 'Slows down aeration and causes foul anaerobic slime.' },
    { item: 'Pet Waste (Cat/Dog Feces)', reason: 'Carries dangerous zoonotic parasites & pathogens.' },
    { item: 'Diseased Garden Plants', reason: 'Pathogens survive in piles and infect next season crops.' },
    { item: 'Glossy / Color Printed Paper', reason: 'Contains heavy metal chemical inks & plastic polymers.' },
    { item: 'Coal / Charcoal Ash', reason: 'Contains high sulfur & heavy metals toxic to soil bacteria.' },
  ];

  const totalWeight = Number(greensKg) + Number(brownsKg);
  const estimatedRatio = totalWeight > 0
    ? Math.round(((greensKg * 15) + (brownsKg * 60)) / totalWeight)
    : 30;

  let baseWeeks = 8;
  if (turningFreq === 'WEEKLY') baseWeeks = 6;
  if (turningFreq === 'BIWEEKLY') baseWeeks = 10;
  if (turningFreq === 'NONE') baseWeeks = 16;

  if (estimatedRatio < 25) baseWeeks += 3;
  if (estimatedRatio > 40) baseWeeks += 4;

  const estimatedWeeks = baseWeeks;

  let ratioBadge = { label: 'Optimal (25–35:1)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  let ratioMessage = 'Ideal biological balance. Thermophilic bacteria will heat the core rapidly without foul anaerobic odors.';

  if (estimatedRatio < 25) {
    ratioBadge = { label: 'Too Green (<25:1)', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    ratioMessage = 'Excess nitrogen & moisture. Risk of anaerobic decomposition, ammonia smell, and fruit flies. Add dry fallen leaves or shredded cardboard.';
  } else if (estimatedRatio > 35) {
    ratioBadge = { label: 'Too Brown (>35:1)', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    ratioMessage = 'Excess carbon. The pile will decompose very slowly and remain cool. Add fresh kitchen vegetable scraps, fruit waste, or green grass.';
  }

  const fetchMyBatches = async () => {
    if (!isAuthenticated) return;
    setLoadingBatches(true);
    try {
      const res = await api.get('/compost/activities');
      if (res.data.success) {
        setMyBatches(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch composting batches:', err);
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyBatches();
    }
  }, [isAuthenticated]);

  const handleSaveBatch = async () => {
    if (!isAuthenticated) {
      alert('Please log in as a citizen to record your batch and earn +20 Eco-Credits.');
      return;
    }

    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await api.post('/compost/activities', {
        wasteType,
        quantityKg: parseFloat(greensKg),
        brownQuantityKg: parseFloat(brownsKg),
        brownMaterialType: 'Dry Chinar Leaves & Shredded Cardboard',
        method: turningFreq === 'WEEKLY' ? 'HOME_BIN' : turningFreq === 'BIWEEKLY' ? 'OUTDOOR_PILE' : 'COMMUNITY_TUMBLER',
        notes: notes || `Batch with C:N ratio ~${estimatedRatio}:1, aerated ${turningFreq.toLowerCase()}`,
      });

      if (res.data.success) {
        setSaveSuccess('🌱 Composting batch logged successfully! +20 Eco-Credits awarded to your profile.');
        if (refreshUser) refreshUser();
        fetchMyBatches();
        setTimeout(() => setSaveSuccess(null), 5000);
      }
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to record batch. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await api.patch(`/compost/activities/${id}/status`, { status: newStatus });
      if (res.data.success) {
        fetchMyBatches();
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update batch status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            Biochemical Organic Waste Recovery
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Household & Community Composting Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Optimize C:N ratios, monitor microbial decomposition phases, and track organic diversion.
          </p>
        </div>

        <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200 self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'SIMULATOR'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌱 Simulator & Guide
          </button>
          <button
            onClick={() => {
              setActiveTab('MY_BATCHES');
              fetchMyBatches();
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'MY_BATCHES'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>My Batches {myBatches.length > 0 && `(${myBatches.length})`}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 shadow-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {activeTab === 'SIMULATOR' && (
        <div className="space-y-12">
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-emerald-600" />
                  <span>Interactive C:N Ratio & Microbial Aeration Simulator</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Adjust kitchen organic waste (Nitrogen) and dry bulking material (Carbon) to calculate microbial decay rates.
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${ratioBadge.color}`}>
                Ratio: {estimatedRatio}:1 ({ratioBadge.label})
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Organic Waste Category
                  </label>
                  <select
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                  >
                    <option value="VEGETABLE_SCRAPS">Vegetable Scraps & Kitchen Peels</option>
                    <option value="FRUIT_WASTE">Fruit Rinds & Surplus Fruit Waste</option>
                    <option value="FOOD_SCRAPS">Plant-Based Leftovers (Cooked/Uncooked)</option>
                    <option value="GARDEN_PLANT_WASTE">Green Lawn Trimmings & Soft Stalks</option>
                    <option value="COFFEE_TEA_WASTE">Used Coffee Grounds & Tea Leaves</option>
                    <option value="MIXED_ORGANIC">Mixed Household Organic Waste</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      Green Waste (Nitrogen Source)
                    </span>
                    <span className="text-sm font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      {greensKg} kg
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="0.5"
                    value={greensKg}
                    onChange={(e) => setGreensKg(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 kg</span>
                    <span>25 kg</span>
                    <span>50 kg</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      Brown Material (Carbon Source — Chinar Leaves / Cardboard)
                    </span>
                    <span className="text-sm font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      {brownsKg} kg
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="0.5"
                    value={brownsKg}
                    onChange={(e) => setBrownsKg(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 kg</span>
                    <span>25 kg</span>
                    <span>50 kg</span>
                  </div>
                </div>

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

                <div>
                  <input
                    type="text"
                    placeholder="Batch notes (e.g., backyard bin, added autumn Chinar leaves)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Batch Decomposition Outlook
                  </span>
                  <div className="space-y-1">
                    <div className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                      <Clock className="w-6 h-6 text-emerald-600" />
                      <span>~{estimatedWeeks} Weeks</span>
                    </div>
                    <p className="text-xs text-slate-500">Estimated time until harvest-ready dark crumbly compost</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-slate-800">
                      <Info className="w-3.5 h-3.5 text-emerald-600" />
                      Microbial Diagnosis:
                    </div>
                    <p className="leading-relaxed">{ratioMessage}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleSaveBatch}
                    disabled={saving}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Award className="w-4 h-4 text-amber-300" />
                    <span>{saving ? 'Logging Batch...' : 'Log This Batch (+20 Eco-Credits)'}</span>
                  </button>
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs space-y-1.5">
                    <span className="font-semibold text-emerald-900 block">Surplus Organic Scraps?</span>
                    <p className="text-[11px] text-emerald-800">
                      Don't dump excess kitchen waste in the municipal bin. Share it with local home composters!
                    </p>
                    <Link
                      to="/exchange"
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                    >
                      <span>Offer on Resource Exchange</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Nitrogen (Greens)', desc: 'Proteins & amino acids providing essential nourishment for rapid bacterial multiplication.', icon: Sprout, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { title: 'Carbon (Browns)', desc: 'Dry carbohydrates providing energy, structure, and microscopic air pockets.', icon: Leaf, color: 'text-amber-600', bg: 'bg-amber-50' },
              { title: 'Moisture (40–60%)', desc: 'Feels like a squeezed damp sponge. Water is needed for cellular metabolism.', icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-50' },
              { title: 'Aeration & Oxygen', desc: 'Turning the pile introduces vital oxygen, preventing bad odors.', icon: Wind, color: 'text-teal-600', bg: 'bg-teal-50' },
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

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-emerald-900 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                Nitrogen-Rich Ingredients ("Greens")
              </h3>
              <ul className="space-y-2.5">
                {greenItems.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-amber-100 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-600"></span>
                Carbon-Rich Ingredients ("Browns")
              </h3>
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

          <section className="p-6 sm:p-8 rounded-3xl bg-rose-50/70 border border-rose-200 shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900">Prohibited Items</h3>
                <p className="text-xs text-rose-700">Never add meat, dairy, pet waste, or glossy paper.</p>
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
      )}

      {activeTab === 'MY_BATCHES' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Your Composting Batches</h3>
              <p className="text-xs text-slate-500">Track biodegradation maturity and earn Eco-Credits.</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Batches</span>
              <div className="text-2xl font-extrabold text-slate-900">{myBatches.length}</div>
            </div>
          </div>

          {loadingBatches ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading your batches...</div>
          ) : myBatches.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-slate-200 shadow-xs text-center space-y-3">
              <Sprout className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">No batches logged yet</h4>
              <button
                onClick={() => setActiveTab('SIMULATOR')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs"
              >
                <span>Go to Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myBatches.map((batch) => (
                <div
                  key={batch._id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {batch.quantityKg} kg • {(batch.wasteType || 'ORGANIC').replace(/_/g, ' ')}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        batch.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : batch.status === 'IN_PROGRESS'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {batch.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Method: <span className="font-semibold text-slate-800">{batch.method || 'Home Bin'}</span> • Browns: {batch.brownQuantityKg || 0} kg ({batch.brownMaterialType || 'Leaves'})
                    </p>

                    <div className="text-[11px] text-slate-400">
                      Started: {new Date(batch.createdAt).toLocaleDateString()}
                      {batch.estimatedMaturityDate && (
                        <span> • Est. Harvest: {new Date(batch.estimatedMaturityDate).toLocaleDateString()}</span>
                      )}
                    </div>

                    {batch.notes && (
                      <p className="text-xs text-slate-500 italic pt-1">"{batch.notes}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {batch.status === 'STARTED' && (
                      <button
                        onClick={() => handleUpdateStatus(batch._id, 'IN_PROGRESS')}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors"
                      >
                        Mark In Progress
                      </button>
                    )}
                    {batch.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleUpdateStatus(batch._id, 'COMPLETED')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                      >
                        Mark Harvested
                      </button>
                    )}
                    {batch.status === 'COMPLETED' && (
                      <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Ready for Garden</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
