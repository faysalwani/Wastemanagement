import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  RefreshCw, 
  Repeat, 
  Sprout, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ALL_CATEGORIES = [
  'Plastic',
  'Paper/Cardboard',
  'Glass',
  'Metal',
  'Organic/Food Waste',
  'E-Waste',
  'Textile',
  'Hazardous/Special Waste',
  'Residual Waste',
];

export default function Scan() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [manualOverride, setManualOverride] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const { user, refreshUser } = useAuth() || {};

  // Fetch AI engine status on mount
  useEffect(() => {
    api.get('/ai/status')
      .then((res) => setAiStatus(res.data))
      .catch(() => setAiStatus({ fallbackReady: true }));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Selected image exceeds the 5MB size limit.');
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
        'Failed to classify waste image. Please try again.'
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            MobileNetV3 Computer Vision
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            AI Waste Classifier & Recommender
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Capture or upload a waste photo to determine its material category and circular recovery pathway.
          </p>
        </div>

        {/* AI Status Badge */}
        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 self-start sm:self-auto shadow-2xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>
            AI Pipeline: <strong className="text-slate-800">{aiStatus?.pythonMicroservice?.connected ? 'Python FastAPI' : 'Active (Resilient Mode)'}</strong>
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Interaction Area */}
      {!result ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs">
          {!previewUrl ? (
            <div className="space-y-6">
              {/* Dropzone Container */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-eco-500 rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-eco-50/20 group"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-eco-600 group-hover:scale-110 shadow-xs transition-all">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-800">
                  Upload Waste Image
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  Drag and drop an image here, or click to browse files from your device.
                </p>
                <span className="inline-block mt-3 px-2.5 py-1 rounded-md bg-slate-100 text-[11px] font-medium text-slate-500">
                  JPEG, PNG, or WebP (Max 5MB)
                </span>
              </div>

              {/* Action Buttons: Camera & Browse */}
              <div className="flex flex-wrap items-center justify-center gap-3">
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

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Open Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-300 shadow-2xs transition-colors"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Browse Photos</span>
                </button>
              </div>
            </div>
          ) : (
            /* Image Preview & Analyze Trigger */
            <div className="space-y-6">
              <div className="relative max-w-md mx-auto rounded-2xl overflow-hidden border border-slate-200 shadow-md aspect-4/3 bg-slate-900 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Waste item preview"
                  className="w-full h-full object-contain"
                />

                {analyzing && (
                  <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                    <div className="w-10 h-10 border-4 border-eco-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="mt-3 text-xs font-semibold tracking-wide">
                      Extracting Features with CNN...
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={analyzing}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Change Image
                </button>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-eco-600 hover:bg-eco-700 text-white text-xs font-semibold shadow-md shadow-eco-600/20 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{analyzing ? 'Analyzing Image...' : 'Classify with AI'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results Section */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Image Preview & Top Probabilities */}
            <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="rounded-2xl overflow-hidden aspect-4/3 bg-slate-100 border border-slate-200">
                <img
                  src={result.imageUrl}
                  alt="Classified waste"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Academic Honesty Badge */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span>Engine Model:</span>
                  <span className="text-eco-600">{result.modelStatus}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Latency:</span>
                  <span>{result.inferenceTimeMs} ms</span>
                </div>
              </div>

              {/* Class Probability Distribution */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Class Probabilities</h4>
                <div className="space-y-2">
                  {result.topPredictions?.map((pred, i) => (
                    <div key={pred.category} className="space-y-0.5">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span className="font-medium">{pred.category}</span>
                        <span className="font-bold">{pred.probability}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            i === 0 ? 'bg-eco-500' : 'bg-slate-300'
                          }`}
                          style={{ width: `${pred.probability}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Classification & Recommendation Details */}
            <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
              <div>
                {/* Confidence Meter Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Identified Material
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                      {activeCategory}
                    </h2>
                  </div>

                  {/* Confidence Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      result.confidenceLevel === 'HIGH'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : result.confidenceLevel === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {result.confidence}% Confidence ({result.confidenceLevel})
                    </span>
                  </div>
                </div>

                {/* Moderate or Low Confidence Notice */}
                {result.confidenceLevel !== 'HIGH' && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <span className="font-semibold">AI Prediction requires confirmation.</span> If this item is not <strong>{result.predictedCategory}</strong>, please select the exact material below:
                    </div>
                  </div>
                )}

                {/* 9-Class Manual Selector Fallback */}
                <div className="mt-4">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Verify or Select Category:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleSelectManualCategory(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          activeCategory === cat
                            ? 'bg-slate-900 text-white shadow-xs scale-102'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Circular Action Pathway */}
                <div className="mt-6 p-5 rounded-2xl bg-eco-50/50 border border-eco-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-eco-800 uppercase tracking-wider">
                      Recommended Waste Pathway
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                      result.recommendation?.binColor === 'GREEN'
                        ? 'bg-emerald-200 text-emerald-900'
                        : result.recommendation?.binColor === 'BLUE'
                        ? 'bg-blue-200 text-blue-900'
                        : result.recommendation?.binColor === 'YELLOW'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-slate-200 text-slate-900'
                    }`}>
                      {result.recommendation?.binName}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {result.recommendation?.instruction}
                  </p>

                  {/* Eco-Credit Reward Toast */}
                  {result.ecoCreditsEarned > 0 && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>+{result.ecoCreditsEarned} Eco-Credits awarded for source segregation!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Another Item</span>
                </button>

                <div className="flex items-center gap-2">
                  {activeCategory === 'Organic/Food Waste' && (
                    <Link
                      to="/compost"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lime-600 hover:bg-lime-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Sprout className="w-3.5 h-3.5" />
                      <span>Composting Guide</span>
                    </Link>
                  )}

                  <Link
                    to="/exchange"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-eco-600 hover:bg-eco-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>Offer in Exchange</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
