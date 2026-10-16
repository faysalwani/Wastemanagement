import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Upload,
  AlertCircle,
  RefreshCw,
  Repeat,
  Sprout,
  Recycle,
  Truck,
  ArrowRight,
  Award,
  Info,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ALL_CATEGORIES = [
  'Organic/Food Waste',
  'Plastic',
  'Paper/Cardboard',
  'Glass',
  'Metal',
  'E-Waste',
  'Textile',
  'Hazardous/Special Waste',
  'Residual Waste',
];

// Priority-ordered citizen guidance (1. Reuse -> 2. Compost -> 3. Recycle -> 4. Collection/Disposal)
const CATEGORY_GUIDANCE = {
  'Organic/Food Waste': {
    binLabel: 'Green Bin (Compostable)',
    summary:
      'Food scraps, vegetable peels and garden waste can be turned into nutrient-rich compost instead of going to a landfill.',
    actions: [
      {
        label: 'Compost at Home',
        desc: 'Follow our simple guide to compost kitchen scraps.',
        to: '/compost',
        icon: Sprout,
        primary: true,
      },
      {
        label: 'Share with Local Composters',
        desc: 'Offer clean organic material to neighbours who compost.',
        to: '/exchange',
        icon: Repeat,
      },
      {
        label: 'Request Organic Pickup',
        desc: 'Schedule collection if you cannot compost at home.',
        to: '/collection',
        icon: Truck,
      },
    ],
  },
  Plastic: {
    binLabel: 'Blue Bin (Dry Recyclable)',
    summary:
      'Clean plastic bottles, tubs and containers can be reused or dropped off at a verified recycling centre. Rinse and dry before recycling.',
    actions: [
      {
        label: 'Share Reusable Containers',
        desc: 'Pass clean, sturdy containers to neighbours for reuse.',
        to: '/exchange',
        icon: Repeat,
        primary: true,
      },
      {
        label: 'Find a Recycling Centre',
        desc: 'Locate verified local recyclers accepting plastic.',
        to: '/recyclers',
        icon: Recycle,
      },
      {
        label: 'Request Recyclable Pickup',
        desc: 'Arrange collection for sorted dry recyclables.',
        to: '/collection',
        icon: Truck,
      },
    ],
  },
  'Paper/Cardboard': {
    binLabel: 'Blue Bin (Dry Recyclable)',
    summary:
      'Clean cardboard boxes, cartons and paper should be kept dry. Flatten boxes so they can be reused or recycled easily.',
    actions: [
      {
        label: 'Share Boxes for Reuse',
        desc: 'Offer clean packing boxes or cartons to neighbours.',
        to: '/exchange',
        icon: Repeat,
        primary: true,
      },
      {
        label: 'Use Shredded Brown Paper in Compost',
        desc: 'Unbleached cardboard and paper help balance home compost.',
        to: '/compost',
        icon: Sprout,
      },
      {
        label: 'Find Paper & Cardboard Recyclers',
        desc: 'See local facilities that accept paper and cardboard.',
        to: '/recyclers',
        icon: Recycle,
      },
    ],
  },
  Glass: {
    binLabel: 'Blue Bin (Glass & Recyclables)',
    summary:
      'Intact glass jars and bottles are great for household reuse. Broken glass should be wrapped safely and sent for recycling or collection.',
    actions: [
      {
        label: 'Share Clean Glass Jars',
        desc: 'List intact jars or bottles for community reuse.',
        to: '/exchange',
        icon: Repeat,
        primary: true,
      },
      {
        label: 'Find Glass Recycling Options',
        desc: 'View verified scrap and recycling drop-off points.',
        to: '/recyclers',
        icon: Recycle,
      },
      {
        label: 'Arrange Safe Collection',
        desc: 'Schedule a pickup for bulky or safely packed glass.',
        to: '/collection',
        icon: Truck,
      },
    ],
  },
  Metal: {
    binLabel: 'Blue Bin (Recyclable Metals)',
    summary:
      'Aluminium cans, tin containers and clean scrap metal have high recycling value and can be recovered repeatedly.',
    actions: [
      {
        label: 'Share Usable Metal Items',
        desc: 'Offer intact tins or metal items for neighbourhood reuse.',
        to: '/exchange',
        icon: Repeat,
      },
      {
        label: 'Find Scrap & Metal Recyclers',
        desc: 'Locate authorized scrap dealers and recovery centres.',
        to: '/recyclers',
        icon: Recycle,
        primary: true,
      },
      {
        label: 'Request a Pickup',
        desc: 'Schedule collection for larger metal items.',
        to: '/collection',
        icon: Truck,
      },
    ],
  },
  'E-Waste': {
    binLabel: 'Special Handling (Electronic Waste)',
    summary:
      'Electronics, cables, circuit boards and batteries must never be thrown in regular bins. Take them to an authorized e-waste recycler or book a pickup.',
    actions: [
      {
        label: 'Find E-Waste Drop-Off Centres',
        desc: 'Locate certified facilities that handle electronics safely.',
        to: '/recyclers',
        icon: Recycle,
        primary: true,
      },
      {
        label: 'Request Special E-Waste Pickup',
        desc: 'Arrange safe doorstep collection for electronic items.',
        to: '/collection',
        icon: Truck,
      },
    ],
  },
  Textile: {
    binLabel: 'Reuse or Dry Recovery',
    summary:
      'Clean clothing, bags and fabric can be reused or shared before considering disposal.',
    actions: [
      {
        label: 'Share Usable Fabrics & Items',
        desc: 'Offer clean textiles or reusable bags on the community exchange.',
        to: '/exchange',
        icon: Repeat,
        primary: true,
      },
      {
        label: 'Request a Pickup',
        desc: 'Schedule collection for bundled textile waste.',
        to: '/collection',
        icon: Truck,
      },
    ],
  },
  'Hazardous/Special Waste': {
    binLabel: 'Red / Hazardous Handling Required',
    summary:
      'Paints, chemicals, medical items, syringes and pressurized cans require safe, separate collection. Do not mix with household trash or compost.',
    actions: [
      {
        label: 'Request Safe Hazardous Pickup',
        desc: 'Arrange dedicated municipal collection for special waste.',
        to: '/collection',
        icon: Truck,
        primary: true,
      },
      {
        label: 'Check Authorized Recovery Centres',
        desc: 'See facilities equipped to handle special materials.',
        to: '/recyclers',
        icon: Recycle,
      },
    ],
  },
  'Residual Waste': {
    binLabel: 'General / Residual Waste Bin',
    summary:
      'Heavily soiled or non-recyclable items cannot be composted or recycled. Keep them separate from clean recyclables and arrange regular collection.',
    actions: [
      {
        label: 'Request Waste Collection',
        desc: 'Arrange collection or check your area schedule.',
        to: '/collection',
        icon: Truck,
        primary: true,
      },
    ],
  },
};

export default function Scan() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [manualOverride, setManualOverride] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const { refreshUser } = useAuth() || {};

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid photo (JPEG, PNG or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('This photo is larger than 5 MB. Please choose a smaller image.');
      return;
    }

    setError(null);
    setResult(null);
    setManualOverride(false);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const res = await api.post('/ai/classify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setResult(res.data.data);
        setActiveCategory(res.data.data.predictedCategory);
        if (res.data.data.ecoCreditsEarned > 0 && refreshUser) {
          refreshUser();
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          'We could not analyze this photo right now. You can try again or choose a category below.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setManualOverride(false);
    setActiveCategory(null);
  };

  const handleSelectManualCategory = (cat) => {
    setActiveCategory(cat);
    setManualOverride(true);
  };

  const currentGuidance =
    CATEGORY_GUIDANCE[activeCategory] || CATEGORY_GUIDANCE['Residual Waste'];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Clear, Plain-Language Header */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[#21834A]">
          Step-by-Step Waste Guide
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26372B] tracking-tight">
          What should I do with this waste?
        </h1>
        <p className="text-sm sm:text-base text-[#526356]">
          Take a photo or upload an image of an item to see the best way to reuse, compost, recycle or dispose of it.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-800"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <p>{error}</p>
            {!result && (
              <div>
                <p className="text-xs font-semibold text-rose-900 mb-1.5">
                  Or pick the material type directly to see what to do next:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat);
                        setManualOverride(true);
                        setResult({
                          predictedCategory: cat,
                          confidenceLevel: 'MANUAL',
                          imageUrl: previewUrl,
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-semibold text-[#26372B] hover:bg-rose-100"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 1 & 2: UPLOAD / PREVIEW & PROCESSING */}
      {!result ? (
        <div className="bg-white rounded-2xl border border-[#DCE6DF] p-6 sm:p-8 space-y-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {!previewUrl ? (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Choose a waste photo to upload"
                className="border-2 border-dashed border-[#C5D4C9] hover:border-[#21834A] rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-colors bg-[#F8FAF8]"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E5F4E8] text-[#21834A] flex items-center justify-center">
                  <Camera className="w-7 h-7" />
                </div>
                <h2 className="mt-4 text-lg font-bold text-[#26372B]">
                  Step 1: Add a photo of the item
                </h2>
                <p className="mt-1 text-sm text-[#526356] max-w-md mx-auto">
                  Place a single item clearly in view for the best result. Supports JPEG, PNG or WebP up to 5 MB.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#21834A] hover:bg-[#1B6E3E] text-white text-sm font-semibold transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span>Take a Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-[#F8FAF8] text-[#26372B] text-sm font-semibold border border-[#DCE6DF] transition-colors"
                >
                  <Upload className="w-5 h-5 text-[#21834A]" />
                  <span>Upload from Device</span>
                </button>
              </div>

              {/* Manual Option Without Photo */}
              <div className="pt-6 border-t border-[#DCE6DF] space-y-2">
                <p className="text-xs font-semibold text-[#526356] text-center">
                  Don’t have a camera handy? Pick a waste type to see what to do:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {ALL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat);
                        setManualOverride(true);
                        setResult({
                          predictedCategory: cat,
                          confidenceLevel: 'MANUAL',
                          imageUrl: null,
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#F8FAF8] hover:bg-[#E5F4E8] text-xs font-semibold text-[#26372B] border border-[#DCE6DF] transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Preview & Check Photo */
            <div className="space-y-6">
              <div className="relative max-w-md mx-auto rounded-2xl overflow-hidden border border-[#DCE6DF] bg-slate-900 aspect-4/3 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Selected waste item"
                  className="w-full h-full object-contain"
                />

                {analyzing && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="absolute inset-0 bg-slate-900/75 flex flex-col items-center justify-center text-white p-4 text-center"
                  >
                    <div className="w-10 h-10 border-4 border-[#E5F4E8] border-t-[#21834A] rounded-full animate-spin" />
                    <span className="mt-3 text-sm font-semibold">
                      Checking your photo...
                    </span>
                    <span className="text-xs text-white/80 mt-1">
                      Identifying the material and best disposal option
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={analyzing}
                  className="px-5 py-3 rounded-xl bg-[#F8FAF8] hover:bg-slate-200 text-[#26372B] border border-[#DCE6DF] text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Choose a Different Photo
                </button>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#21834A] hover:bg-[#1B6E3E] text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <span>{analyzing ? 'Checking Photo...' : 'Check This Item'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* STEP 3, 4 & 5: RESULT, GUIDANCE & NEXT ACTIONS */
        <div className="bg-white rounded-2xl border border-[#DCE6DF] p-6 sm:p-8 space-y-6">
          {/* Top Summary Row */}
          <div className="flex flex-col sm:flex-row items-start gap-5 pb-6 border-b border-[#DCE6DF]">
            {(result.imageUrl || previewUrl) && (
              <div className="w-full sm:w-36 h-36 rounded-xl overflow-hidden border border-[#DCE6DF] bg-[#F8FAF8] flex-shrink-0">
                <img
                  src={result.imageUrl || previewUrl}
                  alt="Scanned waste item"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#21834A]">
                  {manualOverride ? 'Selected Material' : 'Estimated Material'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E5F4E8] text-[#21834A]">
                  {currentGuidance.binLabel}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#26372B]">
                {activeCategory}
              </h2>

              <p className="text-sm text-[#526356] leading-relaxed">
                {result.recommendation?.instruction || currentGuidance.summary}
              </p>

              {result.ecoCreditsEarned > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#E5F4E8] text-[#21834A] text-xs font-bold mt-1">
                  <Award className="w-4 h-4" />
                  <span>You earned +{result.ecoCreditsEarned} reward points!</span>
                </div>
              )}
            </div>
          </div>

          {/* Uncertainty / Verification Notice (Never claim prediction is guaranteed) */}
          {!manualOverride && result.confidenceLevel !== 'MANUAL' && (
            <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#DCE6DF] space-y-3">
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#526356]">
                <Info className="w-4 h-4 text-[#21834A] flex-shrink-0 mt-0.5" />
                <span>
                  {result.confidenceLevel === 'HIGH'
                    ? 'Image predictions are an estimate. If this item is made of a different material, select the right category below:'
                    : 'We are not completely certain from this photo alone. Please confirm or select the matching material below:'}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectManualCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      activeCategory === cat
                        ? 'bg-[#21834A] text-white'
                        : 'bg-white text-[#26372B] border border-[#DCE6DF] hover:bg-[#E5F4E8]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {manualOverride && (
            <div className="p-4 rounded-xl bg-[#F8FAF8] border border-[#DCE6DF] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#21834A]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Category selected manually. Switch material anytime:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectManualCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      activeCategory === cat
                        ? 'bg-[#21834A] text-white'
                        : 'bg-white text-[#26372B] border border-[#DCE6DF] hover:bg-[#E5F4E8]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Next Actions (Ordered: Reuse -> Compost -> Recycle -> Collection) */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-[#26372B]">
              Recommended next steps
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentGuidance.actions.map((act) => {
                const ActIcon = act.icon;
                return (
                  <Link
                    key={act.label}
                    to={act.to}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      act.primary
                        ? 'bg-[#E5F4E8] border-[#21834A] text-[#26372B]'
                        : 'bg-white border-[#DCE6DF] hover:border-[#21834A] text-[#26372B]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-white text-[#21834A] border border-[#DCE6DF] mt-0.5">
                        <ActIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#26372B]">
                          {act.label}
                        </div>
                        <div className="text-xs text-[#526356] mt-0.5">
                          {act.desc}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#21834A] flex-shrink-0 mt-1" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Scan Another Item Button */}
          <div className="pt-4 border-t border-[#DCE6DF] flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F8FAF8] hover:bg-[#E5F4E8] text-[#26372B] border border-[#DCE6DF] text-sm font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-[#21834A]" />
              <span>Scan another item</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
