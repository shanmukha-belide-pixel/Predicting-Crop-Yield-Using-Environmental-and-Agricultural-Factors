import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Box, Download, Maximize2, Minimize2, ChevronDown, Info, Sprout, Globe2
} from 'lucide-react';

// Lazy load Plotly for code splitting
const Plot = lazy(() => import('react-plotly.js'));

const PlotFallback = () => (
  <div className="h-96 flex items-center justify-center bg-stone-50 dark:bg-stone-800/50 rounded-xl">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-stone-500">Loading 3D visualisation...</p>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Chart Card wrapper                                                 */
/* ------------------------------------------------------------------ */
function ChartCard({ title, caption, children, plotRef }: {
  title: string; caption: string; children: React.ReactNode; plotRef?: React.RefObject<any>;
}) {
  const [fullscreen, setFullscreen] = useState(false);

  const downloadPng = () => {
    if (plotRef?.current?.el) {
      import('plotly.js').then(Plotly => {
        Plotly.downloadImage(plotRef.current.el, {
          format: 'png', width: 1200, height: 800, filename: title.replace(/\s+/g, '_'),
        });
      });
    }
  };

  return (
    <div className={`rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 shadow-sm overflow-hidden ${
      fullscreen ? 'fixed inset-4 z-50 overflow-auto' : ''
    }`}>
      {fullscreen && <div className="fixed inset-0 bg-black/50 -z-10" onClick={() => setFullscreen(false)} />}
      <div className="flex items-center justify-between p-4 border-b border-stone-100 dark:border-stone-800">
        <div>
          <h3 className="text-sm font-semibold text-agri-text dark:text-white">{title}</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{caption}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadPng} title="Download PNG"
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 transition-colors">
            <Download className="h-4 w-4" />
          </button>
          <button onClick={() => setFullscreen(!fullscreen)} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 transition-colors">
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function Visuals3D() {
  const [crops, setCrops] = useState<string[]>([]);
  const [crop, setCrop] = useState('Wheat');
  const [scatterData, setScatterData] = useState<any>(null);
  const [surfaceData, setSurfaceData] = useState<any>(null);
  const [countryData, setCountryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMobile3D, setShowMobile3D] = useState(false);
  const [surfaceAxes, setSurfaceAxes] = useState({ x: 'avg_temp', y: 'average_rain_fall_mm_per_year' });

  useEffect(() => {
    fetch('/api/crops').then(r => r.json()).then(d => { if (Array.isArray(d)) setCrops(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/eda?crop=${encodeURIComponent(crop)}`).then(r => r.json()),
      fetch(`/api/surface?crop=${encodeURIComponent(crop)}&x=${surfaceAxes.x}&y=${surfaceAxes.y}`).then(r => r.json()),
      fetch(`/api/countries?crop=${encodeURIComponent(crop)}`).then(r => r.json()),
    ]).then(([eda, surface, countries]) => {
      setScatterData(eda);
      setSurfaceData(surface);
      setCountryData(Array.isArray(countries) ? countries : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [crop, surfaceAxes]);

  const plotLayout = (title: string, extra: any = {}) => ({
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
    font: { family: 'Inter, sans-serif', size: 11, color: '#78716c' },
    margin: { l: 50, r: 30, t: 40, b: 50 },
    title: { text: title, font: { size: 14, color: '#1C1917' } },
    ...extra,
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-screen bg-agri-bg dark:bg-gray-950 pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-agri-text dark:text-white">
            3D & Immersive Visuals
          </h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Presentation components — these are visualisations, not extra models.
          </p>
          <div className="inline-flex items-center gap-1.5 mt-3 bg-info/10 dark:bg-info/20 text-info text-xs font-medium px-3 py-1.5 rounded-full">
            <Info className="h-3.5 w-3.5" /> Presentation components, not extra models
          </div>
        </div>

        {/* Crop selector */}
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm font-medium text-stone-600 dark:text-stone-400 flex items-center gap-2">
            <Sprout className="h-4 w-4 text-accent" /> Crop:
          </label>
          <div className="relative">
            <select value={crop} onChange={e => setCrop(e.target.value)}
              className="appearance-none rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 px-4 py-2 pr-8 text-sm text-agri-text dark:text-white focus:ring-2 focus:ring-accent/40 focus:outline-none">
              {crops.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-stone-400 pointer-events-none" />
          </div>
        </div>

        {/* Mobile 3D toggle */}
        <div className="md:hidden mb-4">
          <button onClick={() => setShowMobile3D(!showMobile3D)}
            className="w-full rounded-xl bg-primary dark:bg-accent text-white py-3 font-medium flex items-center justify-center gap-2">
            <Box className="h-5 w-5" /> {showMobile3D ? 'Hide 3D Views' : 'View 3D Visuals'}
          </button>
        </div>

        {(showMobile3D || typeof window !== 'undefined') && (
          <div className={`space-y-6 ${!showMobile3D ? 'hidden md:block' : ''}`}>

            {/* 3D Scatter: temp × rainfall × yield */}
            <ChartCard title="3D Scatter: Temperature × Rainfall × Yield"
              caption="Each point is a country-year observation. Colour represents year (darker = more recent).">
              <Suspense fallback={<PlotFallback />}>
                {scatterData?.scatter_data && (
                  <Plot
                    data={[{
                      type: 'scatter3d' as const,
                      mode: 'markers',
                      x: scatterData.scatter_data.find((s: any) => s.feature.includes('Temp'))?.x || [],
                      y: scatterData.scatter_data.find((s: any) => s.feature.includes('Rain'))?.x || [],
                      z: scatterData.scatter_data.find((s: any) => s.feature.includes('Temp'))?.y || [],
                      marker: {
                        size: 3, opacity: 0.7,
                        color: scatterData.scatter_data.find((s: any) => s.feature.includes('Temp'))?.x || [],
                        colorscale: 'Viridis', showscale: true,
                        colorbar: { title: { text: 'Temp (°C)' }, thickness: 12 },
                      },
                    }]}
                    layout={plotLayout('', {
                      scene: {
                        xaxis: { title: 'Temperature (°C)' },
                        yaxis: { title: 'Rainfall (mm/yr)' },
                        zaxis: { title: 'Yield (t/ha)' },
                      },
                      height: 500,
                    })}
                    config={{ responsive: true, displayModeBar: true }}
                    style={{ width: '100%' }}
                  />
                )}
              </Suspense>
            </ChartCard>

            {/* 3D Surface */}
            <ChartCard title="3D Fitted Surfaces"
              caption="Linear plane vs polynomial degree 3 surface. The surface is drawn only over the observed data range.">
              <div className="flex items-center gap-3 mb-3">
                <label className="text-xs text-stone-500">Axes:</label>
                <select value={`${surfaceAxes.x}|${surfaceAxes.y}`}
                  onChange={e => {
                    const [x, y] = e.target.value.split('|');
                    setSurfaceAxes({ x, y });
                  }}
                  className="text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2 py-1">
                  <option value="avg_temp|average_rain_fall_mm_per_year">Temperature × Rainfall</option>
                  <option value="avg_temp|pesticides_tonnes">Temperature × Pesticides</option>
                  <option value="average_rain_fall_mm_per_year|pesticides_tonnes">Rainfall × Pesticides</option>
                </select>
              </div>
              <Suspense fallback={<PlotFallback />}>
                {surfaceData?.x_grid && surfaceData.x_grid.length > 0 && (
                  <Plot
                    data={[
                      {
                        type: 'surface' as const,
                        x: surfaceData.x_grid, y: surfaceData.y_grid, z: surfaceData.z_grid,
                        colorscale: 'YlGn', opacity: 0.7, name: 'Linear surface',
                        showscale: false,
                      },
                      {
                        type: 'surface' as const,
                        x: surfaceData.x_grid, y: surfaceData.y_grid, z: surfaceData.z_grid_poly,
                        colorscale: 'Viridis', opacity: 0.5, name: 'Poly deg 3',
                        showscale: true, colorbar: { title: { text: 'Yield (t/ha)' }, thickness: 12, x: 1.05 },
                      },
                      {
                        type: 'scatter3d' as const,
                        mode: 'markers',
                        x: surfaceData.x_data, y: surfaceData.y_data, z: surfaceData.z_data,
                        marker: { size: 2, color: '#14532D', opacity: 0.5 },
                        name: 'Observed data',
                      },
                    ]}
                    layout={plotLayout('', {
                      scene: {
                        xaxis: { title: surfaceAxes.x === 'avg_temp' ? 'Temperature (°C)' : surfaceAxes.x },
                        yaxis: { title: surfaceAxes.y.includes('rain') ? 'Rainfall (mm/yr)' : surfaceAxes.y },
                        zaxis: { title: 'Yield (t/ha)' },
                      },
                      height: 500, showlegend: true,
                      legend: { x: 0, y: 1 },
                    })}
                    config={{ responsive: true }}
                    style={{ width: '100%' }}
                  />
                )}
              </Suspense>
            </ChartCard>

            {/* Choropleth */}
            <ChartCard title="World Map: Yield by Country"
              caption="Average yield per country. Hover for details.">
              <Suspense fallback={<PlotFallback />}>
                {countryData.length > 0 && (
                  <Plot
                    data={[{
                      type: 'choropleth' as const,
                      locationmode: 'country names',
                      locations: countryData.map(c => c.country),
                      z: countryData.map(c => c.mean_yield),
                      text: countryData.map(c => `${c.country}\nYield: ${c.mean_yield.toFixed(1)} t/ha\nTemp: ${c.mean_temp}°C`),
                      colorscale: 'YlGn',
                      colorbar: { title: { text: 't/ha' }, thickness: 12 },
                      marker: { line: { color: '#fff', width: 0.5 } },
                    }]}
                    layout={plotLayout('', {
                      geo: {
                        showframe: false, showcoastlines: true,
                        projection: { type: 'natural earth' },
                        bgcolor: 'transparent',
                      },
                      height: 450,
                    })}
                    config={{ responsive: true }}
                    style={{ width: '100%' }}
                  />
                )}
              </Suspense>
            </ChartCard>

            {/* Parallel Coordinates */}
            <ChartCard title="Parallel Coordinates"
              caption="Each line represents a data point. Trace patterns across temperature, rainfall, pesticides, year, and yield.">
              <Suspense fallback={<PlotFallback />}>
                {scatterData?.scatter_data && (
                  <Plot
                    data={[{
                      type: 'parcoords' as const,
                      line: {
                        color: scatterData.scatter_data.find((s: any) => s.feature.includes('Temp'))?.y || [],
                        colorscale: 'YlGn', showscale: true,
                        cmin: Math.min(...(scatterData.scatter_data[0]?.y || [0])),
                        cmax: Math.max(...(scatterData.scatter_data[0]?.y || [10])),
                      } as any,
                      dimensions: [
                        {
                          label: 'Temperature (°C)',
                          values: scatterData.scatter_data.find((s: any) => s.feature.includes('Temp'))?.x || [],
                        },
                        {
                          label: 'Rainfall (mm/yr)',
                          values: scatterData.scatter_data.find((s: any) => s.feature.includes('Rain'))?.x || [],
                        },
                        {
                          label: 'Pesticides (t)',
                          values: scatterData.scatter_data.find((s: any) => s.feature.includes('Pest'))?.x || [],
                        },
                        {
                          label: 'Yield (t/ha)',
                          values: scatterData.scatter_data.find((s: any) => s.feature.includes('Temp'))?.y || [],
                        },
                      ],
                    } as any]}
                    layout={plotLayout('', { height: 400 })}
                    config={{ responsive: true }}
                    style={{ width: '100%' }}
                  />
                )}
              </Suspense>
            </ChartCard>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
