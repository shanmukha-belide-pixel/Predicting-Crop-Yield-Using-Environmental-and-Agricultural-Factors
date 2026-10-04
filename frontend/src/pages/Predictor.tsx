import React, { useState, useEffect } from 'react';
import {
  Sprout, Droplets, Thermometer, Bug, Calendar,
  AlertTriangle, RotateCcw, ChevronDown, TrendingUp,
  TrendingDown, Info, BarChart3, Minus
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface PredictResponse {
  predicted_yield: number;
  crop_average: number;
  delta_percent: number;
  is_outside_range: boolean;
  outside_features: string[];
  model_name: string;
}

interface CropRange {
  year: [number, number];
  rainfall: [number, number];
  pesticides: [number, number];
  temp: [number, number];
  avg_yield: number;
}

interface CompareResult {
  model: string;
  predicted_yield: number;
}

/* ------------------------------------------------------------------ */
/*  Crop icons/emoji                                                   */
/* ------------------------------------------------------------------ */
const CROP_EMOJI: Record<string, string> = {
  'Maize': '🌽', 'Wheat': '🌾', 'Rice, paddy': '🍚', 'Potatoes': '🥔',
  'Soybeans': '🫘', 'Sorghum': '🌿', 'Cassava': '🍠', 'Sweet potatoes': '🍠',
  'Plantains and others': '🍌', 'Yams': '🥕',
};

const MODELS = [
  { value: 'multiple_linear', label: 'Multiple Linear' },
  { value: 'poly_2_multi', label: 'Polynomial Deg 2' },
  { value: 'poly_3_multi', label: 'Polynomial Deg 3' },
  { value: 'poly_5_ridge', label: 'Poly Deg 5 + Ridge' },
];

/* ------------------------------------------------------------------ */
/*  Debounce hook                                                      */
/* ------------------------------------------------------------------ */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ------------------------------------------------------------------ */
/*  Radial Gauge Component - Stable, smooth transitions, NO popups     */
/* ------------------------------------------------------------------ */
function RadialGauge({ value, max, average, unit = 't/ha' }: {
  value: number; max: number; average: number; unit?: string;
}) {
  const pct = Math.min(Math.max(value / (max || 1), 0), 1);
  const avgPct = Math.min(Math.max(average / (max || 1), 0), 1);
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct * 0.75);
  const avgAngle = -225 + avgPct * 270;

  return (
    <div className="relative w-64 h-64 mx-auto select-none">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-[135deg]">
        {/* Background arc */}
        <circle cx="100" cy="100" r={radius} fill="none"
          stroke="currentColor" className="text-stone-200 dark:text-stone-700"
          strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} />
        {/* Value arc - smooth CSS transition without unmounting */}
        <circle cx="100" cy="100" r={radius} fill="none"
          stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.3s ease-out' }} />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="50%" stopColor="#F5B83D" />
            <stop offset="100%" stopColor="#C2410C" />
          </linearGradient>
        </defs>
      </svg>
      {/* Average marker */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ transform: `rotate(${avgAngle}deg)`, transition: 'transform 0.3s ease-out' }}>
        <div className="absolute top-2 w-1 h-5 bg-primary dark:bg-accent rounded-full shadow-sm" />
      </div>
      {/* Center text - rock solid, tabular numbers, NO popup scale animation */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-4 pointer-events-none">
        <span className="text-4xl font-mono font-bold text-agri-text dark:text-white tabular-nums tracking-tight">
          {value.toFixed(1)}
        </span>
        <span className="text-sm text-stone-500 dark:text-stone-400 font-medium">{unit}</span>
        <span className="text-xs text-stone-400 dark:text-stone-500 mt-1 tabular-nums">
          Avg: {average.toFixed(1)} {unit}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slider with numeric input                                          */
/* ------------------------------------------------------------------ */
function ParamSlider({ label, icon: Icon, value, onChange, min, max, step, unit, color }: {
  label: string; icon: React.ElementType; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit: string; color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-agri-text dark:text-stone-200">
          <Icon className={`h-4 w-4 ${color}`} /> {label}
        </label>
        <div className="flex items-center gap-1">
          <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
            min={min} max={max} step={step}
            className="w-20 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2 py-1 text-right text-sm font-mono text-agri-text dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/40"
            aria-label={`${label} value`}
          />
          <span className="text-xs text-stone-400 w-14 text-left ml-1">{unit}</span>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-stone-200 dark:bg-stone-700 cursor-pointer accent-accent"
        aria-label={`${label} slider`}
      />
      <div className="flex justify-between text-[10px] text-stone-400 font-mono">
        <span>{min} {unit}</span><span>{max} {unit}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Predictor Page                                                */
/* ------------------------------------------------------------------ */
export default function Predictor() {
  const [crops, setCrops] = useState<string[]>([]);
  const [crop, setCrop] = useState('Wheat');
  const [model, setModel] = useState('multiple_linear');
  const [year, setYear] = useState(2005);
  const [rainfall, setRainfall] = useState(800);
  const [pesticides, setPesticides] = useState(10000);
  const [temp, setTemp] = useState(20);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [compareData, setCompareData] = useState<CompareResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [ranges, setRanges] = useState<CropRange>({
    year: [1990, 2013], rainfall: [10, 3500], pesticides: [0, 2000000], temp: [-2, 32], avg_yield: 5.0,
  });

  // Load crops
  useEffect(() => {
    fetch('/api/crops')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCrops(d); })
      .catch(() => setCrops(['Wheat', 'Maize', 'Rice, paddy', 'Potatoes', 'Soybeans']));
  }, []);

  // Load ranges for selected crop
  useEffect(() => {
    fetch(`/api/eda?crop=${encodeURIComponent(crop)}`)
      .then(r => r.json())
      .then(d => {
        if (d.ranges) {
          setRanges(d.ranges);
          // Reset sliders to median
          setYear(Math.round((d.ranges.year[0] + d.ranges.year[1]) / 2));
          setRainfall(Math.round((d.ranges.rainfall[0] + d.ranges.rainfall[1]) / 2));
          setPesticides(Math.round((d.ranges.pesticides[0] + d.ranges.pesticides[1]) / 2));
          setTemp(Number(((d.ranges.temp[0] + d.ranges.temp[1]) / 2).toFixed(1)));
        }
      })
      .catch(() => {});
  }, [crop]);

  // Debounced parameters for smooth server calls
  const debouncedParams = useDebounce({ crop, model, year, rainfall, pesticides, temp }, 200);

  useEffect(() => {
    setLoading(true);

    // 1. Fetch main model prediction
    fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop: debouncedParams.crop, model: debouncedParams.model,
        year: debouncedParams.year, rainfall: debouncedParams.rainfall,
        pesticides: debouncedParams.pesticides, temp: debouncedParams.temp,
      }),
    })
      .then(r => r.json())
      .then(d => {
        setPrediction(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // 2. Fetch all 4 models in parallel for smooth comparison bars (no manual click needed)
    Promise.all(MODELS.map(m =>
      fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: debouncedParams.crop,
          model: m.value,
          year: debouncedParams.year,
          rainfall: debouncedParams.rainfall,
          pesticides: debouncedParams.pesticides,
          temp: debouncedParams.temp
        }),
      }).then(r => r.json()).then(d => ({ model: m.label, predicted_yield: d.predicted_yield ?? 0 }))
    )).then(setCompareData).catch(() => {});

  }, [debouncedParams]);

  const resetToMedian = () => {
    setYear(Math.round((ranges.year[0] + ranges.year[1]) / 2));
    setRainfall(Math.round((ranges.rainfall[0] + ranges.rainfall[1]) / 2));
    setPesticides(Math.round((ranges.pesticides[0] + ranges.pesticides[1]) / 2));
    setTemp(Number(((ranges.temp[0] + ranges.temp[1]) / 2).toFixed(1)));
  };

  const isOutside = prediction?.is_outside_range;
  const delta = prediction?.delta_percent ?? 0;
  const maxYield = Math.max((ranges.avg_yield ?? 5) * 2.5, prediction?.predicted_yield ?? 8, 10);

  return (
    <div className="min-h-screen bg-agri-bg dark:bg-gray-950 pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-agri-text dark:text-white">
            Live Yield Predictor
          </h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Adjust environmental and agricultural inputs to observe real-time predicted yields.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ============ LEFT PANEL: CONTROLS ============ */}
          <div className="lg:col-span-2 space-y-5">
            {/* Crop selector */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-5 shadow-sm">
              <label className="block text-sm font-semibold text-agri-text dark:text-white mb-3">
                <Sprout className="inline h-4 w-4 mr-1 text-accent" /> Select Crop
              </label>
              <div className="relative">
                <select value={crop} onChange={e => setCrop(e.target.value)}
                  className="w-full appearance-none rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-4 py-3 pr-10 text-agri-text dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-accent/40"
                  aria-label="Select crop">
                  {crops.map(c => (
                    <option key={c} value={c}>{CROP_EMOJI[c] || '🌱'} {c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-stone-400 pointer-events-none" />
              </div>
            </div>

            {/* Model selector */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-5 shadow-sm">
              <label className="block text-sm font-semibold text-agri-text dark:text-white mb-3">
                <BarChart3 className="inline h-4 w-4 mr-1 text-info" /> Regression Model
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MODELS.map(m => (
                  <button key={m.value} onClick={() => setModel(m.value)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium border transition-colors ${
                      model === m.value
                        ? 'bg-primary dark:bg-accent text-white border-primary dark:border-accent shadow-sm'
                        : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750'
                    }`}
                    aria-pressed={model === m.value}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Parameter sliders */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-agri-text dark:text-white">Input Parameters</h3>
                <button onClick={resetToMedian}
                  className="flex items-center gap-1 text-xs text-accent hover:text-accent-dark dark:hover:text-accent-light font-medium transition-colors"
                  aria-label="Reset to median values">
                  <RotateCcw className="h-3 w-3" /> Reset to Median
                </button>
              </div>

              <ParamSlider label="Year" icon={Calendar} value={year} onChange={setYear}
                min={ranges.year[0]} max={ranges.year[1]} step={1} unit="" color="text-primary dark:text-accent" />
              <ParamSlider label="Rainfall" icon={Droplets} value={rainfall} onChange={setRainfall}
                min={Math.floor(ranges.rainfall[0])} max={Math.ceil(ranges.rainfall[1])} step={10} unit="mm/yr" color="text-info" />
              <ParamSlider label="Pesticides" icon={Bug} value={pesticides} onChange={setPesticides}
                min={0} max={Math.ceil(ranges.pesticides[1])} step={100} unit="tonnes" color="text-highlight-dark" />
              <ParamSlider label="Temperature" icon={Thermometer} value={temp} onChange={setTemp}
                min={Math.floor(ranges.temp[0])} max={Math.ceil(ranges.temp[1])} step={0.5} unit="°C" color="text-danger" />
            </div>
          </div>

          {/* ============ RIGHT PANEL: GAUGE & COMPARISON ============ */}
          <div className="lg:col-span-3 space-y-5">
            {/* Main prediction gauge card - completely stable, NO bouncing layout */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-6 shadow-sm">
              <div className="text-center mb-4 flex items-center justify-center gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-agri-text dark:text-white">Predicted Yield</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {CROP_EMOJI[crop] || '🌱'} {crop} • {MODELS.find(m => m.value === model)?.label}
                  </p>
                </div>
                {loading && (
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping ml-1" title="Updating..." />
                )}
              </div>

              {prediction ? (
                <>
                  <RadialGauge
                    value={prediction.predicted_yield}
                    max={maxYield}
                    average={prediction.crop_average}
                  />

                  {/* Delta indicator */}
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {delta > 0 ? (
                      <div className="flex items-center gap-1 text-accent font-semibold">
                        <TrendingUp className="h-5 w-5" />
                        <span>+{delta.toFixed(1)}% vs average</span>
                      </div>
                    ) : delta < 0 ? (
                      <div className="flex items-center gap-1 text-danger font-semibold">
                        <TrendingDown className="h-5 w-5" />
                        <span>{delta.toFixed(1)}% vs average</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-stone-500">
                        <Minus className="h-5 w-5" />
                        <span>At average</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-64 h-64 mx-auto flex items-center justify-center text-stone-400">
                  <div className="w-10 h-10 rounded-full border-4 border-accent/30 border-t-accent animate-spin" />
                </div>
              )}

              {/* Outside range warning */}
              {isOutside && (
                <div className="mt-4 rounded-xl bg-highlight/10 dark:bg-highlight/20 border border-highlight/30 px-4 py-3 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-highlight-dark flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-highlight-dark dark:text-highlight">Outside Training Range</p>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                      {prediction?.outside_features?.join(', ')} outside observed range. Low confidence prediction.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Compare all models - smooth live bar comparison, NO popping */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-agri-text dark:text-white">Compare All Models</h3>
                <span className="text-xs text-stone-400">Live predictions (t/ha)</span>
              </div>
              <div className="space-y-3">
                {MODELS.map((m) => {
                  const item = compareData.find(x => x.model === m.label);
                  const pred = item ? item.predicted_yield : (m.value === model && prediction ? prediction.predicted_yield : 0);
                  const barMax = Math.max(...compareData.map(x => x.predicted_yield), prediction?.predicted_yield || 1, 1);
                  const pct = Math.min(Math.max((pred / barMax) * 100, 3), 100);
                  return (
                    <div key={m.value} className="flex items-center gap-3">
                      <span className={`text-xs w-32 truncate ${m.value === model ? 'font-bold text-primary dark:text-accent' : 'text-stone-600 dark:text-stone-400'}`}>
                        {m.label}
                      </span>
                      <div className="flex-1 h-5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            m.value === model
                              ? 'bg-gradient-to-r from-accent to-primary shadow-sm'
                              : 'bg-stone-300 dark:bg-stone-700'
                          }`}
                        />
                      </div>
                      <span className="text-xs font-mono font-semibold text-agri-text dark:text-white w-14 text-right tabular-nums">
                        {pred > 0 ? pred.toFixed(2) : '...'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800/60 px-4 py-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
              <p className="text-xs text-stone-500 dark:text-stone-400">
                <strong>Country-level statistical model. Illustration only, not for farm decisions.</strong>{' '}
                Results are statistical associations, not causation. Satellite imagery is context only and is NOT a model input.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
