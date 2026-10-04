import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info, BarChart2, Activity, TrendingUp, Search, 
  ChevronDown, Target, Zap, AlertTriangle 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell, 
  LineChart, Line, ComposedChart, ErrorBar, ReferenceLine
} from 'recharts';
import Plot from 'react-plotly.js';

// --- Types ---
type ModelComparison = {
  name: string;
  display_name: string;
  r2: number;
  rmse: number;
  mae: number;
  cv_r2_mean?: number;
  cv_r2_std?: number;
  r2_time?: number;
  rmse_time?: number;
  mae_time?: number;
};

type ActualVsPred = {
  actual: number[];
  predicted: number[];
  countries: string[];
};

type ResidualsData = {
  predicted: number[];
  residuals: number[];
  histogram: { bins: number[]; counts: number[] };
};

type BiasVariance = {
  degree: number;
  train_rmse: number;
  test_rmse: number;
  x_curve: number[];
  y_curve: number[];
  x_data: number[];
  y_data: number[];
};

type FeatureImportance = {
  features: string[];
  coefficients: number[];
  vif: { feature: string; vif: number }[];
};

type NonlinearFit = {
  name: string;
  x_curve: number[];
  y_curve: number[];
  params: { name: string; value: number; std_err: number }[];
  r2: number;
};

type NonlinearData = {
  x_data: number[];
  y_data: number[];
  fits: NonlinearFit[];
};

// --- Tooltip Component ---
const InfoTooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-flex items-center justify-center ml-1">
    <Info className="w-4 h-4 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-stone-800 dark:bg-stone-200 text-stone-100 dark:text-stone-900 text-xs rounded shadow-lg z-50 pointer-events-none">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-800 dark:border-t-stone-200"></div>
    </div>
  </div>
);

const SectionHeading = ({ id, title, icon: Icon }: { id: string, title: string, icon?: React.ElementType }) => (
  <h2 id={id} className="text-2xl font-semibold font-sora flex items-center gap-2 mb-6 text-stone-800 dark:text-stone-100 scroll-mt-24">
    {Icon && <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />}
    {title}
  </h2>
);

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

// --- Main Page Component ---
export default function ModelLab() {
  const [crops, setCrops] = useState<string[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [modelsData, setModelsData] = useState<ModelComparison[]>([]);
  const [actVsPredData, setActVsPredData] = useState<ActualVsPred | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('random_forest'); // default
  
  const [residualsData, setResidualsData] = useState<ResidualsData | null>(null);
  
  const [bvDegree, setBvDegree] = useState(1);
  const [bvData, setBvData] = useState<BiasVariance | null>(null);
  
  const [fiData, setFiData] = useState<FeatureImportance | null>(null);
  const [nlData, setNlData] = useState<NonlinearData | null>(null);
  
  // Table view state
  const [metricView, setMetricView] = useState<'holdout' | 'cv' | 'time'>('holdout');

  const [activeSection, setActiveSection] = useState('comparison');

  const navItems = [
    { id: 'comparison', label: 'Comparison' },
    { id: 'actual-vs-predicted', label: 'Actual vs Predicted' },
    { id: 'residuals', label: 'Residuals' },
    { id: 'bias-variance', label: 'Bias-Variance' },
    { id: 'nonlinear', label: 'Nonlinear Fits' },
    { id: 'features', label: 'Feature Importance' },
    { id: 'time-validation', label: 'Time Validation' },
  ];

  useEffect(() => {
    fetch('/api/crops')
      .then(res => res.json())
      .then(data => {
        setCrops(data);
        if (data.length > 0) setSelectedCrop(data[0]);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedCrop) return;
    setIsLoading(true);
    
    Promise.all([
      fetch(`/api/models/compare?crop=${selectedCrop}`).then(res => res.json()),
      fetch(`/api/feature-importance?crop=${selectedCrop}`).then(res => res.json()),
      fetch(`/api/nonlinear-fits?crop=${selectedCrop}`).then(res => res.json()),
    ])
    .then(([comp, fi, nl]) => {
      setModelsData(comp.models || []);
      if (comp.models && comp.models.length > 0) {
        setSelectedModel(comp.models[0].name);
      }
      setFiData(fi);
      setNlData(nl);
      setIsLoading(false);
    })
    .catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  }, [selectedCrop]);

  useEffect(() => {
    if (!selectedCrop || !selectedModel) return;
    
    Promise.all([
      fetch(`/api/actual-vs-predicted?crop=${selectedCrop}&model=${selectedModel}`).then(res => res.json()),
      fetch(`/api/residuals?crop=${selectedCrop}&model=${selectedModel}`).then(res => res.json())
    ])
    .then(([avp, resids]) => {
      setActVsPredData(avp);
      setResidualsData(resids);
    })
    .catch(console.error);
  }, [selectedCrop, selectedModel]);

  useEffect(() => {
    if (!selectedCrop) return;
    fetch(`/api/bias-variance?crop=${selectedCrop}&degree=${bvDegree}`)
      .then(res => res.json())
      .then(data => setBvData(data))
      .catch(console.error);
  }, [selectedCrop, bvDegree]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;
      for (let i = navItems.length - 1; i >= 0; i--) {
        const section = document.getElementById(navItems[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navItems[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navItems]);

  if (!crops.length) return <div className="p-8 text-center">Loading Data...</div>;

  const getMetricVals = (m: ModelComparison) => {
    if (metricView === 'cv') return { r2: m.cv_r2_mean ?? m.r2, rmse: m.rmse, mae: m.mae };
    if (metricView === 'time') return { r2: m.r2_time ?? m.r2, rmse: m.rmse_time ?? m.rmse, mae: m.mae_time ?? m.mae };
    return { r2: m.r2, rmse: m.rmse, mae: m.mae };
  };

  const sortedModels = [...modelsData].sort((a, b) => getMetricVals(b).r2 - getMetricVals(a).r2);
  const bestR2 = Math.max(...modelsData.map(m => getMetricVals(m).r2));
  const bestRMSE = Math.min(...modelsData.map(m => getMetricVals(m).rmse));
  const bestMAE = Math.min(...modelsData.map(m => getMetricVals(m).mae));

  const scatterData = actVsPredData ? actVsPredData.actual.map((a, i) => ({
    actual: a,
    predicted: actVsPredData.predicted[i],
    country: actVsPredData.countries[i],
    residualAbs: Math.abs(a - actVsPredData.predicted[i])
  })) : [];

  const maxVal = Math.max(...scatterData.map(d => Math.max(d.actual, d.predicted)), 0);

  const resScatterData = residualsData ? residualsData.predicted.map((p, i) => ({
    predicted: p,
    residual: residualsData.residuals[i]
  })) : [];

  const resHistData = residualsData ? residualsData.histogram.bins.slice(0, -1).map((b, i) => ({
    bin: `${b.toFixed(2)} to ${(residualsData.histogram.bins[i+1]).toFixed(2)}`,
    count: residualsData.histogram.counts[i]
  })) : [];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-inter text-stone-900 dark:text-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="font-sora text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Model Lab
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-stone-500 dark:text-stone-400">Target Crop:</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-stone-100 dark:bg-stone-800 border-none rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {crops.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8 items-start relative">
        
        {/* Sidebar Navigation */}
        <nav className="hidden lg:flex w-64 shrink-0 flex-col gap-1 sticky top-24">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2 pl-3">Sections</h3>
          {navItems.map(item => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                activeSection === item.id 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium' 
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/50'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-w-0 flex flex-col gap-12">
          {isLoading ? (
            <div className="animate-pulse space-y-8">
              <div className="h-64 bg-stone-200 dark:bg-stone-800 rounded-2xl"></div>
              <div className="h-96 bg-stone-200 dark:bg-stone-800 rounded-2xl"></div>
            </div>
          ) : (
            <>
              {/* 1. Comparison Table */}
              <section id="comparison">
                <SectionHeading id="comparison-heading" title="Model Comparison" icon={BarChart2} />
                <Card>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <p className="text-sm text-stone-600 dark:text-stone-400 max-w-xl">
                      Evaluate regression models across different validation strategies. Green highlights indicate the best score in each column.
                    </p>
                    <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-lg">
                      {(['holdout', 'cv', 'time'] as const).map(view => (
                        <button
                          key={view}
                          onClick={() => setMetricView(view)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            metricView === view 
                              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm' 
                              : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300'
                          }`}
                        >
                          {view === 'holdout' ? 'Random Hold-out' : view === 'cv' ? 'Cross-validation' : 'Time-based'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 uppercase text-xs font-semibold">
                        <tr>
                          <th className="p-4 border-b border-stone-200 dark:border-stone-700">Model</th>
                          <th className="p-4 border-b border-stone-200 dark:border-stone-700 whitespace-nowrap">
                            R² Score <InfoTooltip text="Proportion of variance explained. 1.0 = perfect, 0 = no better than mean." />
                          </th>
                          <th className="p-4 border-b border-stone-200 dark:border-stone-700 whitespace-nowrap">
                            RMSE <InfoTooltip text="Root Mean Square Error. Lower is better. In same units as yield (t/ha)." />
                          </th>
                          <th className="p-4 border-b border-stone-200 dark:border-stone-700 whitespace-nowrap">
                            MAE <InfoTooltip text="Mean Absolute Error. Average prediction error magnitude in t/ha." />
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 dark:divide-stone-700 font-jetbrains">
                        {sortedModels.map((m) => {
                          const vals = getMetricVals(m);
                          const isBestR2 = vals.r2 === bestR2;
                          const isBestRMSE = vals.rmse === bestRMSE;
                          const isBestMAE = vals.mae === bestMAE;
                          
                          return (
                            <tr key={m.name} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                              <td className="p-4 font-inter font-medium text-stone-900 dark:text-stone-100">
                                {m.display_name}
                              </td>
                              <td className={`p-4 ${isBestR2 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold' : ''}`}>
                                {vals.r2.toFixed(4)}
                                {metricView === 'cv' && m.cv_r2_std && <span className="text-xs text-stone-400 ml-1">±{m.cv_r2_std.toFixed(4)}</span>}
                              </td>
                              <td className={`p-4 ${isBestRMSE ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold' : ''}`}>
                                {vals.rmse.toFixed(4)}
                              </td>
                              <td className={`p-4 ${isBestMAE ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold' : ''}`}>
                                {vals.mae.toFixed(4)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* 2. Metric Bar Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 h-48">
                    {[
                      { key: 'r2', title: 'R² (Higher = Better)', dataKey: 'r2' },
                      { key: 'rmse', title: 'RMSE (Lower = Better)', dataKey: 'rmse' },
                      { key: 'mae', title: 'MAE (Lower = Better)', dataKey: 'mae' }
                    ].map(metric => (
                      <div key={metric.key} className="flex flex-col h-full">
                        <h4 className="text-xs font-semibold text-stone-500 mb-2 text-center uppercase">{metric.title}</h4>
                        <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sortedModels.map(m => ({ name: m.display_name, ...getMetricVals(m) }))} layout="horizontal" margin={{top:5, right:5, left:-20, bottom: 25}}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-stone-700" />
                              <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{fontSize: 10, fill: '#78716c'}} interval={0} height={40} />
                              <YAxis tick={{fontSize: 10, fill: '#78716c'}} />
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '8px', color: '#f5f5f4', fontSize: '12px' }}
                                itemStyle={{ color: '#10b981' }}
                              />
                              <Bar dataKey={metric.dataKey} fill="#059669" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>

              {/* 3. Actual vs Predicted Scatter */}
              <section id="actual-vs-predicted">
                <SectionHeading id="avp-heading" title="Actual vs Predicted" icon={Target} />
                <Card>
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      Points closer to the diagonal line represent more accurate predictions.
                    </p>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="bg-stone-100 dark:bg-stone-800 border-none rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {modelsData.map(m => <option key={m.name} value={m.name}>{m.display_name}</option>)}
                    </select>
                  </div>
                  
                  <div className="h-96 w-full">
                    {scatterData.length > 0 && (
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-stone-700" />
                          <XAxis type="number" dataKey="actual" name="Actual Yield" domain={[0, maxVal * 1.05]} tick={{fill: '#78716c'}} label={{ value: 'Actual Yield (t/ha)', position: 'insideBottom', offset: -10, fill: '#78716c' }} />
                          <YAxis type="number" dataKey="predicted" name="Predicted Yield" domain={[0, maxVal * 1.05]} tick={{fill: '#78716c'}} label={{ value: 'Predicted Yield (t/ha)', angle: -90, position: 'insideLeft', fill: '#78716c' }} />
                          <ZAxis type="number" range={[40, 40]} />
                          <RechartsTooltip 
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-stone-900 text-stone-100 p-3 rounded-lg shadow-xl border border-stone-700 text-xs font-jetbrains">
                                    <p className="font-inter font-bold text-sm mb-1">{data.country}</p>
                                    <p>Actual: {data.actual.toFixed(2)}</p>
                                    <p>Predicted: {data.predicted.toFixed(2)}</p>
                                    <p>Error: {data.residualAbs.toFixed(2)}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Scatter name="Yield" data={scatterData} fill="#0ea5e9" opacity={0.7} />
                          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: maxVal*1.05, y: maxVal*1.05 }]} stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Card>
              </section>

              {/* 4. Residual Diagnostics */}
              <section id="residuals">
                <SectionHeading id="res-heading" title="Residual Diagnostics" icon={Activity} />
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <h3 className="text-sm font-semibold mb-4 text-center">Residuals vs Predicted</h3>
                    <div className="h-64">
                      {resScatterData.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-stone-700" />
                            <XAxis type="number" dataKey="predicted" name="Predicted" tick={{fontSize: 11, fill: '#78716c'}} label={{ value: 'Predicted Yield', position: 'insideBottom', offset: -10, fill: '#78716c', fontSize: 12 }} />
                            <YAxis type="number" dataKey="residual" name="Residual" tick={{fontSize: 11, fill: '#78716c'}} label={{ value: 'Residual (Error)', angle: -90, position: 'insideLeft', fill: '#78716c', fontSize: 12 }} />
                            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1c1917', color: '#fff', fontSize: '12px', border: 'none', borderRadius: '8px' }} />
                            <Scatter data={resScatterData} fill="#8b5cf6" opacity={0.6} />
                            <ReferenceLine y={0} stroke="#f43f5e" strokeWidth={2} />
                          </ScatterChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </Card>
                  <Card>
                    <h3 className="text-sm font-semibold mb-4 text-center">Residual Distribution</h3>
                    <div className="h-64">
                      {resHistData.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={resHistData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-stone-700" />
                            <XAxis dataKey="bin" tick={{fontSize: 9, fill: '#78716c'}} angle={-30} textAnchor="end" height={40} />
                            <YAxis tick={{fontSize: 11, fill: '#78716c'}} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#1c1917', color: '#fff', fontSize: '12px', border: 'none', borderRadius: '8px' }} />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </Card>
                </div>
              </section>

              {/* 5. Bias-Variance Explorer */}
              <section id="bias-variance">
                <SectionHeading id="bv-heading" title="Bias-Variance Explorer" icon={TrendingUp} />
                <Card>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">Polynomial Degree: {bvDegree}</label>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        bvDegree < 3 ? 'bg-blue-100 text-blue-800' : 
                        bvDegree < 6 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {bvDegree < 3 ? 'Underfitting (High Bias)' : bvDegree < 6 ? 'Good Fit' : 'Overfitting (High Variance)'}
                      </span>
                    </div>
                    <input 
                      type="range" min="1" max="8" step="1" 
                      value={bvDegree} onChange={e => setBvDegree(parseInt(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  {bvData && (
                    <div className="grid md:grid-cols-2 gap-6 h-80">
                      {/* Scatter + Curve */}
                      <div className="relative w-full h-full">
                        <Plot
                          data={[
                            {
                              x: bvData.x_data,
                              y: bvData.y_data,
                              mode: 'markers',
                              type: 'scatter',
                              name: 'Data',
                              marker: { color: 'rgba(100, 116, 139, 0.5)' }
                            },
                            {
                              x: bvData.x_curve,
                              y: bvData.y_curve,
                              mode: 'lines',
                              type: 'scatter',
                              name: `Degree ${bvDegree}`,
                              line: { color: '#0ea5e9', width: 3, shape: 'spline' }
                            }
                          ]}
                          layout={{
                            autosize: true,
                            margin: { l: 40, r: 10, t: 10, b: 40 },
                            paper_bgcolor: 'transparent',
                            plot_bgcolor: 'transparent',
                            xaxis: { title: 'Temperature' as any, gridcolor: '#e5e7eb' },
                            yaxis: { title: 'Yield' as any, gridcolor: '#e5e7eb' },
                            showlegend: false
                          }}
                          style={{ width: '100%', height: '100%' }}
                          config={{ displayModeBar: false }}
                        />
                      </div>
                      
                      {/* Train/Test RMSE Bar or Line (we'll just show the values dynamically for current degree, or we can assume it returns an array if we requested it, but API says: degree, train_rmse, test_rmse. Let's just show a dynamic visualization of the errors) */}
                      <div className="flex flex-col justify-center items-center p-6 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                        <h4 className="text-sm font-semibold mb-6">Current Error Metrics</h4>
                        <div className="w-full space-y-6">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-stone-600 dark:text-stone-400">Training RMSE</span>
                              <span className="font-jetbrains font-medium text-emerald-600">{bvData.train_rmse.toFixed(4)}</span>
                            </div>
                            <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2">
                              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, bvData.train_rmse * 50)}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-stone-600 dark:text-stone-400">Testing RMSE</span>
                              <span className="font-jetbrains font-medium text-rose-600">{bvData.test_rmse.toFixed(4)}</span>
                            </div>
                            <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2">
                              <div className="bg-rose-500 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, bvData.test_rmse * 50)}%` }}></div>
                            </div>
                          </div>
                        </div>
                        <p className="mt-8 text-xs text-stone-500 text-center max-w-xs">
                          Notice how Training Error continues to decrease, but Testing Error eventually spikes as variance increases (overfitting).
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              </section>

              {/* 6. Nonlinear Fits */}
              <section id="nonlinear">
                <SectionHeading id="nl-heading" title="Nonlinear Fits" icon={Activity} />
                <Card>
                  {nlData && nlData.fits.length > 0 ? (
                    <div className="grid lg:grid-cols-2 gap-8">
                      <div className="h-96">
                        <Plot
                          data={[
                            {
                              x: nlData.x_data,
                              y: nlData.y_data,
                              mode: 'markers',
                              type: 'scatter',
                              name: 'Data',
                              marker: { color: 'rgba(120, 113, 108, 0.4)' }
                            },
                            ...nlData.fits.map((fit, idx) => ({
                              x: fit.x_curve,
                              y: fit.y_curve,
                              mode: 'lines' as const,
                              type: 'scatter' as const,
                              name: fit.name,
                              line: { width: 3, dash: idx === 0 ? 'solid' : idx === 1 ? 'dash' : 'dot' as any }
                            }))
                          ]}
                          layout={{
                            autosize: true,
                            margin: { l: 40, r: 10, t: 10, b: 40 },
                            paper_bgcolor: 'transparent',
                            plot_bgcolor: 'transparent',
                            xaxis: { title: 'Predictor' as any, gridcolor: '#e5e7eb' },
                            yaxis: { title: 'Yield' as any, gridcolor: '#e5e7eb' },
                            legend: { orientation: 'h', y: -0.2 }
                          }}
                          style={{ width: '100%', height: '100%' }}
                          config={{ displayModeBar: false }}
                        />
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm text-stone-500 uppercase tracking-wider">Fitted Parameters</h4>
                        {nlData.fits.map(fit => (
                          <div key={fit.name} className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                              <strong className="text-emerald-700 dark:text-emerald-400">{fit.name}</strong>
                              <span className="text-xs bg-white dark:bg-stone-700 px-2 py-1 rounded shadow-sm border border-stone-200 dark:border-stone-600 font-jetbrains">
                                R²: {fit.r2.toFixed(3)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {fit.params.map(p => (
                                <div key={p.name} className="flex justify-between border-b border-stone-200 dark:border-stone-700 pb-1">
                                  <span className="text-stone-500">{p.name}</span>
                                  <span className="font-jetbrains">{p.value.toFixed(4)} <span className="text-[10px] text-stone-400">±{p.std_err.toFixed(4)}</span></span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                     <div className="p-8 text-center text-stone-500">No nonlinear fit data available for this crop.</div>
                  )}
                </Card>
              </section>

              {/* 7. Feature Importance & VIF */}
              <section id="features">
                <SectionHeading id="fi-heading" title="Feature Importance & Multicollinearity" icon={BarChart2} />
                <Card>
                  {fiData && (
                    <div className="grid lg:grid-cols-5 gap-8">
                      <div className="lg:col-span-3 h-80">
                        <h3 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-4 text-center">Standardized Coefficients</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            layout="vertical" 
                            data={fiData.features.map((f, i) => ({ feature: f, coef: fiData.coefficients[i] })).sort((a,b) => Math.abs(b.coef) - Math.abs(a.coef))}
                            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" className="dark:stroke-stone-700" />
                            <XAxis type="number" tick={{fontSize: 11, fill: '#78716c'}} />
                            <YAxis dataKey="feature" type="category" tick={{fontSize: 11, fill: '#78716c'}} width={80} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#1c1917', color: '#fff', fontSize: '12px', border: 'none', borderRadius: '8px' }} cursor={{fill: '#f5f5f4', opacity: 0.1}} />
                            <Bar dataKey="coef" radius={[0, 4, 4, 0]}>
                              {fiData.features.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={fiData.coefficients[index] >= 0 ? '#10b981' : '#f43f5e'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="text-sm font-medium text-stone-600 dark:text-stone-400">VIF Analysis</h3>
                          <InfoTooltip text="Variance Inflation Factor (VIF). > 5 indicates moderate multicollinearity, > 10 is high." />
                        </div>
                        <div className="bg-stone-50 dark:bg-stone-800/30 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-stone-100 dark:bg-stone-800 text-xs text-stone-500 uppercase">
                              <tr>
                                <th className="px-4 py-2">Feature</th>
                                <th className="px-4 py-2">VIF</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                              {fiData.vif.sort((a,b) => b.vif - a.vif).map(v => (
                                <tr key={v.feature}>
                                  <td className="px-4 py-2 font-medium">{v.feature}</td>
                                  <td className="px-4 py-2 font-jetbrains">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                      v.vif > 10 ? 'bg-rose-100 text-rose-700' : 
                                      v.vif > 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                      {v.vif.toFixed(2)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </section>

              {/* 8. Time-Based Validation Panel */}
              <section id="time-validation">
                <SectionHeading id="time-heading" title="Time-Based Validation" icon={Activity} />
                <Card>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
                    Unlike random hold-out splits which can leak future information into the training phase (especially for time-series climate/yield data), time-based validation strictly trains on historical years and tests on subsequent future years. This provides a more realistic estimate of how the model will perform in the real world when predicting the upcoming harvest.
                  </p>
                  
                  {/* Timeline Visual (Mocked generic representation) */}
                  <div className="mb-8">
                    <h4 className="text-xs font-bold uppercase text-stone-400 mb-2">Split Strategy</h4>
                    <div className="flex h-6 w-full rounded-md overflow-hidden text-xs font-bold text-white shadow-inner">
                      <div className="bg-blue-500 w-3/4 flex items-center justify-center">Training Set (Past Years)</div>
                      <div className="bg-rose-500 w-1/4 flex items-center justify-center border-l-2 border-white dark:border-stone-900">Test Set (Future)</div>
                    </div>
                  </div>

                  {/* Side-by-side metric comparison for selected model */}
                  {selectedModel && modelsData.find(m => m.name === selectedModel) && (
                    <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-6 border border-stone-200 dark:border-stone-700">
                      <h4 className="font-semibold mb-4 text-center">Random vs Time-Based Performance ({modelsData.find(m => m.name === selectedModel)?.display_name})</h4>
                      <div className="grid grid-cols-2 gap-8 divide-x divide-stone-200 dark:divide-stone-700">
                        <div className="space-y-4 pr-4">
                          <h5 className="text-sm font-medium text-stone-500 text-center">Random Split</h5>
                          {(() => {
                            const m = modelsData.find(md => md.name === selectedModel)!;
                            return (
                              <div className="space-y-2 font-jetbrains text-sm">
                                <div className="flex justify-between"><span className="text-stone-500 font-inter">R²:</span> <span>{m.r2.toFixed(4)}</span></div>
                                <div className="flex justify-between"><span className="text-stone-500 font-inter">RMSE:</span> <span>{m.rmse.toFixed(4)}</span></div>
                                <div className="flex justify-between"><span className="text-stone-500 font-inter">MAE:</span> <span>{m.mae.toFixed(4)}</span></div>
                              </div>
                            )
                          })()}
                        </div>
                        <div className="space-y-4 pl-4">
                          <h5 className="text-sm font-medium text-stone-500 text-center">Time-Based Split</h5>
                          {(() => {
                            const m = modelsData.find(md => md.name === selectedModel)!;
                            return (
                              <div className="space-y-2 font-jetbrains text-sm">
                                <div className="flex justify-between"><span className="text-stone-500 font-inter">R²:</span> <span>{m.r2_time?.toFixed(4) ?? 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="text-stone-500 font-inter">RMSE:</span> <span>{m.rmse_time?.toFixed(4) ?? 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="text-stone-500 font-inter">MAE:</span> <span>{m.mae_time?.toFixed(4) ?? 'N/A'}</span></div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                      <div className="mt-6 flex items-start gap-3 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>
                          Metrics often drop during time-based validation compared to random splits. This penalty reflects the model's struggle to extrapolate to unseen weather conditions or systemic shifts over time. Models that maintain performance here are more robust.
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
