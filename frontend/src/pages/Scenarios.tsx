import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Thermometer, AlertTriangle, Info, Sprout, TrendingDown, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine
} from 'recharts';

const CHART_COLORS = ['#22C55E', '#0EA5E9', '#F5B83D', '#C2410C', '#8B5CF6', '#EC4899', '#14532D', '#06B6D4', '#84CC16', '#F97316'];

const WARMING_STEPS = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0];

interface ScenarioResult {
  crop: string;
  delta_temp: number;
  baseline_yield: number;
  predicted_yield: number;
  percent_change: number;
}

export default function Scenarios() {
  const [crops, setCrops] = useState<string[]>([]);
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['Wheat', 'Maize', 'Rice, paddy']);
  const [warming, setWarming] = useState(1.5);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [singleResults, setSingleResults] = useState<ScenarioResult[]>([]);

  useEffect(() => {
    fetch('/api/crops')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCrops(d); })
      .catch(() => setCrops(['Wheat', 'Maize', 'Rice, paddy', 'Potatoes', 'Soybeans']));
  }, []);

  // Fetch scenarios for all warming levels for selected crops
  const fetchScenarios = useCallback(async () => {
    if (selectedCrops.length === 0) return;
    setLoading(true);

    try {
      const allData: any[] = [];
      for (const step of WARMING_STEPS) {
        const row: any = { warming: `+${step}°C` };
        for (const crop of selectedCrops) {
          try {
            const res = await fetch(`/api/scenario?crop=${encodeURIComponent(crop)}&delta=${step}`);
            const data: ScenarioResult = await res.json();
            row[crop] = data.percent_change ?? 0;
          } catch {
            row[crop] = 0;
          }
        }
        allData.push(row);
      }
      setChartData(allData);

      // Also get single-warming results for cards
      const singleRes: ScenarioResult[] = [];
      for (const crop of selectedCrops) {
        try {
          const res = await fetch(`/api/scenario?crop=${encodeURIComponent(crop)}&delta=${warming}`);
          singleRes.push(await res.json());
        } catch {
          singleRes.push({ crop, delta_temp: warming, baseline_yield: 0, predicted_yield: 0, percent_change: 0 });
        }
      }
      setSingleResults(singleRes);
    } catch {
      // fallback
    }
    setLoading(false);
  }, [selectedCrops, warming]);

  useEffect(() => { fetchScenarios(); }, [fetchScenarios]);

  const toggleCrop = (c: string) => {
    setSelectedCrops(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-screen bg-agri-bg dark:bg-gray-950 pt-20 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-agri-text dark:text-white">
            Climate Scenario Simulator
          </h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
            Explore how warming of 0–3 °C could affect predicted crop yields.
          </p>
          <div className="inline-flex items-center gap-1.5 mt-3 bg-highlight/10 dark:bg-highlight/20 text-highlight-dark dark:text-highlight text-xs font-medium px-3 py-1.5 rounded-full">
            <Info className="h-3.5 w-3.5" /> Association, not causation
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left controls */}
          <div className="space-y-5">
            {/* Warming slider */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-agri-text dark:text-white mb-4 flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-danger" /> Warming Level
              </h3>
              <div className="text-center mb-3">
                <span className="text-3xl font-mono font-bold text-danger">+{warming.toFixed(1)}°C</span>
              </div>
              <input type="range" min={0} max={3} step={0.5} value={warming}
                onChange={e => setWarming(Number(e.target.value))}
                className="w-full accent-danger"
                aria-label="Warming level slider" />
              <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-1">
                <span>0°C</span><span>+1.5°C</span><span>+3°C</span>
              </div>
            </div>

            {/* Crop multi-select */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-agri-text dark:text-white mb-3 flex items-center gap-2">
                <Sprout className="h-4 w-4 text-accent" /> Select Crops
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {crops.map(c => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={selectedCrops.includes(c)}
                      onChange={() => toggleCrop(c)}
                      className="rounded border-stone-300 dark:border-stone-600 text-accent focus:ring-accent" />
                    <span className="text-stone-700 dark:text-stone-300">{c}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-5">
            {/* Result cards */}
            {singleResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {singleResults.map((r, i) => (
                  <motion.div key={r.crop}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-4 shadow-sm">
                    <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{r.crop}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {r.percent_change >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-accent" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-danger" />
                      )}
                      <span className={`text-2xl font-mono font-bold ${r.percent_change >= 0 ? 'text-accent' : 'text-danger'}`}>
                        {r.percent_change >= 0 ? '+' : ''}{r.percent_change.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                      {r.baseline_yield.toFixed(2)} → {r.predicted_yield.toFixed(2)} t/ha
                    </p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Chart */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-agri-text dark:text-white mb-4">
                Predicted Yield Change (%) by Warming Level
              </h3>
              {loading ? (
                <div className="h-72 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="warming" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${v}%`}
                      label={{ value: '% Change', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
                    <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 12 }} />
                    <Legend />
                    <ReferenceLine y={0} stroke="#78716c" strokeDasharray="3 3" label={{ value: "Baseline", position: "right", fontSize: 11 }} />
                    {selectedCrops.map((crop, i) => (
                      <Line key={crop} type="monotone" dataKey={crop}
                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Caution Card */}
            <div className="rounded-2xl bg-danger/5 dark:bg-danger/10 border border-danger/20 p-6">
              <h3 className="font-semibold text-danger flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5" /> Important Caveats
              </h3>
              <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                <li className="flex items-start gap-2">
                  <span className="text-danger mt-0.5 flex-shrink-0">•</span>
                  <span><strong>Association, not causation:</strong> These are statistical predictions from a regression model, not climate science simulations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-danger mt-0.5 flex-shrink-0">•</span>
                  <span><strong>Ignores adaptation:</strong> Farmers adapt — new varieties, irrigation changes, planting date shifts — none of which are modelled.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-danger mt-0.5 flex-shrink-0">•</span>
                  <span><strong>Extrapolation risk:</strong> For already-hot countries, adding +3°C pushes far beyond training data. Predictions become unreliable.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-danger mt-0.5 flex-shrink-0">•</span>
                  <span><strong>Cross-country artefacts:</strong> Some crops (e.g. potatoes) are grown in very different climates across countries. The "temperature effect" may partly reflect country-level economic differences.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
