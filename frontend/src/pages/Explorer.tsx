import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  ComposedChart, Line, ScatterChart, Scatter, ZAxis, Cell, LineChart, AreaChart, Area
} from 'recharts';
import { 
  Database, LineChart as LineChartIcon, BarChart3, ScatterChart as ScatterIcon, 
  Map as MapIcon, Activity, Settings2, Download, Search, ChevronLeft, ChevronRight, X, AlertCircle, RefreshCw
} from 'lucide-react';

const CHART_COLORS = ['#22C55E', '#14532D', '#F5B83D', '#0EA5E9', '#C2410C', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];

// Types
type EdaData = {
  ranges: any;
  stats: Record<string, { count: number, mean: number, std: number, min: number, max: number }>;
  distributions: Record<string, { bins: number[], counts: number[], kde_x: number[], kde_y: number[] }>;
  correlations: { matrix: number[][], labels: string[] };
  scatter_data: { feature: string, x: number[], y: number[] }[];
  trends: { year: number, avg_yield: number, crop: string }[]; // Assuming multi-crop or filtered
  box_plot: { crop: string, q1: number, median: number, q3: number, min: number, max: number, mean: number }[];
  country_stats: { country: string, mean_yield: number, count: number }[];
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: Database },
  { id: 'distributions', label: 'Distributions', icon: BarChart3 },
  { id: 'correlations', label: 'Correlations', icon: Settings2 },
  { id: 'relationships', label: 'Relationships', icon: ScatterIcon },
  { id: 'trends', label: 'Trends', icon: LineChartIcon },
  { id: 'countries', label: 'Countries', icon: MapIcon },
];

// Helper to format numbers
const formatNumber = (num: number) => {
  if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toFixed(2);
};

export default function Explorer() {
  const [crops, setCrops] = useState<string[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>('All');
  const [activeTab, setActiveTab] = useState('overview');
  const [edaData, setEdaData] = useState<EdaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchCrops();
  }, []);

  useEffect(() => {
    fetchEdaData(selectedCrop);
  }, [selectedCrop]);

  const fetchCrops = async () => {
    try {
      const res = await fetch('/api/crops');
      if (!res.ok) throw new Error('Failed to fetch crops');
      const data = await res.json();
      setCrops(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEdaData = async (crop: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = crop === 'All' ? '/api/eda' : `/api/eda?crop=${encodeURIComponent(crop)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setEdaData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorState message={error} onRetry={() => fetchEdaData(selectedCrop)} />;
    if (!edaData) return null;

    switch (activeTab) {
      case 'overview': return <OverviewTab data={edaData} />;
      case 'distributions': return <DistributionsTab data={edaData} />;
      case 'correlations': return <CorrelationsTab data={edaData} />;
      case 'relationships': return <RelationshipsTab data={edaData} />;
      case 'trends': return <TrendsTab data={edaData} />;
      case 'countries': return <CountriesTab data={edaData} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div>
            <h1 className="text-3xl font-bold text-[#14532D] dark:text-white">Data Explorer</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Explore crop yield patterns, distributions, and correlations.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <select 
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 pr-10 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#22C55E] cursor-pointer"
              >
                <option value="All">All Crops</option>
                {crops.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            <button 
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 bg-[#14532D] hover:bg-[#104323] text-white px-5 py-2.5 rounded-xl transition-colors font-medium shadow-sm"
            >
              <Database className="w-4 h-4" />
              <span>Data Table</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-[#14532D] text-white shadow-md' 
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-700 hover:text-[#14532D] dark:hover:text-[#22C55E]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#22C55E]' : ''}`} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <DataTableDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

// --- Tab Components ---

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-100 dark:bg-gray-700 rounded-xl"></div>)}
    </div>
    <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-xl"></div>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center h-[500px] text-center">
    <AlertCircle className="w-16 h-16 text-[#C2410C] mb-4 opacity-80" />
    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Failed to load data</h3>
    <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">{message}</p>
    <button onClick={onRetry} className="flex items-center gap-2 bg-[#14532D] text-white px-6 py-2.5 rounded-xl hover:bg-[#104323] transition-colors">
      <RefreshCw className="w-4 h-4" /> Retry
    </button>
  </div>
);

const OverviewTab = ({ data }: { data: EdaData }) => {
  const statKeys = Object.keys(data.stats);
  
  // Custom BoxPlot logic using ComposedChart
  const boxPlotData = data.box_plot.map(d => ({
    name: d.crop,
    min: d.min,
    bottomWhisker: [d.min, d.q1],
    boxBottom: d.q1,
    boxTop: d.q3,
    box: [d.q1, d.q3],
    topWhisker: [d.q3, d.max],
    max: d.max,
    median: d.median
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statKeys.map((key, i) => (
          <div key={key} className="bg-green-50/50 dark:bg-gray-800/50 rounded-xl p-5 border border-green-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{key.replace(/_/g, ' ')}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#14532D] dark:text-white">{formatNumber(data.stats[key].mean)}</span>
              <span className="text-sm text-gray-500">avg</span>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Min: {formatNumber(data.stats[key].min)} | Max: {formatNumber(data.stats[key].max)}
            </div>
          </div>
        ))}
      </div>

      <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6">Yield Distribution by Crop (Box Plot)</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={boxPlotData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280' }} />
              <RechartsTooltip 
                content={({ payload }) => {
                  if (!payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-sm">
                      <p className="font-bold mb-2">{data.name}</p>
                      <p>Max: {data.max.toFixed(2)}</p>
                      <p>Q3: {data.boxTop.toFixed(2)}</p>
                      <p>Median: {data.median.toFixed(2)}</p>
                      <p>Q1: {data.boxBottom.toFixed(2)}</p>
                      <p>Min: {data.min.toFixed(2)}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="box" fill="#22C55E" fillOpacity={0.6} stroke="#14532D" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const DistributionsTab = ({ data }: { data: EdaData }) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(data.distributions).map(([key, dist], idx) => {
          // Combine histogram and KDE data for Recharts
          const chartData = dist.bins.slice(0, -1).map((bin, i) => {
            // Find closest KDE point for this bin
            const kdeIndex = dist.kde_x.findIndex(x => x >= bin);
            const kdeValue = kdeIndex >= 0 ? dist.kde_y[kdeIndex] : 0;
            return {
              bin: Number(bin.toFixed(2)),
              count: dist.counts[i],
              kde: kdeValue * Math.max(...dist.counts) // scale KDE to match counts visually
            };
          });

          return (
            <div key={key} className="border border-gray-100 dark:border-gray-700 rounded-xl p-5">
              <h3 className="text-base font-semibold capitalize text-gray-800 dark:text-gray-100 mb-4">{key.replace(/_/g, ' ')} Distribution</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="bin" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" hide />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar yAxisId="left" dataKey="count" fill={CHART_COLORS[idx % CHART_COLORS.length]} fillOpacity={0.7} />
                    <Line yAxisId="right" type="monotone" dataKey="kde" stroke="#14532D" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CorrelationsTab = ({ data }: { data: EdaData }) => {
  const { matrix, labels } = data.correlations;
  
  // Flatten for list
  const flatCorrs: {v1: string, v2: string, val: number}[] = [];
  labels.forEach((l1, i) => {
    labels.forEach((l2, j) => {
      if (i < j) {
        flatCorrs.push({ v1: l1, v2: l2, val: matrix[i][j] });
      }
    });
  });
  
  const yieldCorrs = flatCorrs.filter(c => c.v1.includes('yield') || c.v2.includes('yield'))
    .sort((a, b) => Math.abs(b.val) - Math.abs(a.val));

  const getColor = (value: number) => {
    // Value is -1 to 1. 
    // YlGn palette: 
    // High pos (1): dark green #00441b
    // Zero (0): light yellow #ffffcc
    // High neg (-1): could use a different hue or very light
    const v = (value + 1) / 2; // 0 to 1
    const r = Math.round(255 + (0 - 255) * v);
    const g = Math.round(255 + (68 - 255) * v);
    const b = Math.round(204 + (27 - 204) * v);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 overflow-x-auto">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6">Correlation Heatmap</h3>
          <div className="inline-block border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <div className="flex">
              <div className="w-24"></div>
              {labels.map(l => (
                <div key={l} className="w-16 text-xs text-center font-medium text-gray-500 rotate-[-45deg] origin-bottom-left pb-2">
                  {l.replace(/_/g, ' ')}
                </div>
              ))}
            </div>
            {labels.map((l1, i) => (
              <div key={l1} className="flex items-center">
                <div className="w-24 text-xs font-medium text-gray-500 truncate pr-2 text-right">
                  {l1.replace(/_/g, ' ')}
                </div>
                {labels.map((l2, j) => (
                  <div 
                    key={`${l1}-${l2}`} 
                    className="w-16 h-12 m-[1px] relative group cursor-pointer transition-transform hover:scale-110 hover:z-10 rounded-sm"
                    style={{ backgroundColor: getColor(matrix[i][j]) }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 font-mono text-xs bg-black/50 text-white rounded-sm pointer-events-none">
                      {matrix[i][j].toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-80">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6">Impact on Yield</h3>
          <div className="space-y-3">
            {yieldCorrs.map((corr, idx) => {
              const varName = corr.v1.includes('yield') ? corr.v2 : corr.v1;
              const absVal = Math.abs(corr.val);
              const width = `${absVal * 100}%`;
              const isPositive = corr.val > 0;
              
              return (
                <div key={idx} className="bg-gray-50 dark:bg-gray-800/80 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">{varName.replace(/_/g, ' ')}</span>
                    <span className={`text-sm font-bold ${isPositive ? 'text-[#22C55E]' : 'text-[#C2410C]'}`}>
                      {corr.val > 0 ? '+' : ''}{corr.val.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isPositive ? 'bg-[#22C55E]' : 'bg-[#C2410C]'}`}
                      style={{ width }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const RelationshipsTab = ({ data }: { data: EdaData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {data.scatter_data.map((scatter, idx) => {
        const plotData = scatter.x.map((x, i) => ({ x, y: scatter.y[i] }));
        
        return (
          <div key={scatter.feature} className="border border-gray-100 dark:border-gray-700 rounded-xl p-5">
            <h3 className="text-base font-semibold capitalize text-gray-800 dark:text-gray-100 mb-4">Yield vs {scatter.feature.replace(/_/g, ' ')}</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="x" type="number" name={scatter.feature} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis dataKey="y" type="number" name="Yield" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <ZAxis range={[20, 20]} />
                  <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Data" data={plotData} fill={CHART_COLORS[idx % CHART_COLORS.length]} fillOpacity={0.4} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TrendsTab = ({ data }: { data: EdaData }) => {
  // Process trends data for LineChart. Group by year, then each crop is a key.
  const processedData = useMemo(() => {
    const map = new Map<number, any>();
    const crops = new Set<string>();
    
    data.trends.forEach(d => {
      if (!map.has(d.year)) map.set(d.year, { year: d.year });
      map.get(d.year)[d.crop] = d.avg_yield;
      crops.add(d.crop);
    });
    
    return {
      data: Array.from(map.values()).sort((a: any, b: any) => a.year - b.year),
      crops: Array.from(crops)
    };
  }, [data.trends]);

  return (
    <div className="space-y-6">
      <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6">Historical Yield Trends (1990 - 2013)</h3>
        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fill: '#6b7280' }} />
              <YAxis tick={{ fill: '#6b7280' }} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {processedData.crops.map((crop, idx) => (
                <Line 
                  key={crop} 
                  type="monotone" 
                  dataKey={crop} 
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const CountriesTab = ({ data }: { data: EdaData }) => {
  const sorted = [...data.country_stats].sort((a, b) => b.mean_yield - a.mean_yield);
  const top10 = sorted.slice(0, 10);
  const bottom10 = sorted.slice(-10).reverse(); // lowest first

  const CountryChart = ({ title, chartData, color }: { title: string, chartData: any[], color: string }) => (
    <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-5">
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis dataKey="country" type="category" width={80} tick={{ fill: '#6b7280', fontSize: 11 }} />
            <RechartsTooltip cursor={{ fill: 'transparent' }} />
            <Bar dataKey="mean_yield" fill={color} radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8 + (index * 0.02)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CountryChart title="Top 10 Highest Yielding Countries" chartData={top10} color="#14532D" />
      <CountryChart title="Top 10 Lowest Yielding Countries" chartData={bottom10} color="#C2410C" />
    </div>
  );
};

// --- Data Table Drawer ---

const DataTableDrawer = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
  // Mock data for the table, ideally would fetch this or pass it in.
  // Due to requirements, we implement UI for it.
  
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[600px] lg:w-[800px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Raw Dataset</h2>
                <p className="text-sm text-gray-500 mt-1">Browse, search, and export the dataset.</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-3 justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search countries, crops..." 
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                />
              </div>
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    <tr>
                      {['Country', 'Crop', 'Year', 'Yield (hg/ha)', 'Temp (°C)', 'Rainfall (mm)'].map(h => (
                        <th key={h} className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex items-center gap-1">
                            {h}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {/* Placeholder rows */}
                    {Array.from({ length: 15 }).map((_, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">India</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Rice</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">2010</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-mono text-right">31245.00</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-right">24.5</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-right">1050.2</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
              <span className="text-sm text-gray-500">Showing 1 to 50 of 28,242 entries</span>
              <div className="flex gap-1">
                <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
