import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe2, AlertTriangle, Info, Sprout, ChevronDown, MapPin, Eye,
  Thermometer, Droplets, Database
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const { BaseLayer, Overlay } = LayersControl;

/* ------------------------------------------------------------------ */
/*  Region cards                                                       */
/* ------------------------------------------------------------------ */
const REGIONS = [
  {
    name: 'Indo-Gangetic Plain',
    desc: 'One of the world\'s most productive agricultural regions, spanning northern India and Pakistan. Major crops: wheat, rice, sugarcane.',
    center: [27.5, 80.5] as [number, number],
    zoom: 6,
  },
  {
    name: 'Argentine Pampas',
    desc: 'Vast grassland prairies in central Argentina, a global leader in soybean, wheat and maize production.',
    center: [-35.0, -62.0] as [number, number],
    zoom: 6,
  },
  {
    name: 'Nile Valley',
    desc: 'Narrow fertile strip along the Nile in Egypt and Sudan. Irrigated agriculture producing wheat, rice, and cotton.',
    center: [27.0, 31.0] as [number, number],
    zoom: 6,
  },
  {
    name: 'Murray-Darling Basin',
    desc: 'Australia\'s food bowl spanning southeast Australia. Produces a third of Australia\'s food supply despite drought challenges.',
    center: [-33.5, 145.5] as [number, number],
    zoom: 6,
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function tempToColor(temp: number): string {
  if (temp < 10) return '#0EA5E9';
  if (temp < 18) return '#22C55E';
  if (temp < 25) return '#F5B83D';
  return '#C2410C';
}

function yieldToRadius(yield_val: number, maxYield: number): number {
  return Math.max(4, Math.min(20, (yield_val / maxYield) * 18 + 4));
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function Satellite() {
  const [crops, setCrops] = useState<string[]>([]);
  const [crop, setCrop] = useState('Wheat');
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    fetch('/api/crops').then(r => r.json()).then(d => { if (Array.isArray(d)) setCrops(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/countries?crop=${encodeURIComponent(crop)}`)
      .then(r => r.json())
      .then(d => {
        setCountries(Array.isArray(d) ? d.filter((c: any) => c.lat && c.lon) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [crop]);

  const maxYield = Math.max(...countries.map(c => c.mean_yield || 1), 1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-screen bg-agri-bg dark:bg-gray-950 pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-agri-text dark:text-white">
            Satellite Context
          </h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Explore crop-growing regions with satellite imagery and country yield data.
          </p>
        </div>

        {/* Disclaimer banner */}
        <div className="rounded-2xl bg-highlight/10 dark:bg-highlight/20 border border-highlight/30 p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-highlight-dark dark:text-highlight flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-highlight-dark dark:text-highlight">Context Only. Satellite imagery is NOT a model input.</p>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
              These maps provide geographical context. The prediction models use only temperature, rainfall, pesticide and year data — not satellite imagery.
            </p>
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
          <span className="text-xs text-stone-400">{countries.length} countries with location data</span>
        </div>

        {/* Map */}
        <div className="rounded-2xl overflow-hidden border border-stone-200/60 dark:border-stone-800/60 shadow-sm mb-8">
          {loading ? (
            <div className="h-[500px] flex items-center justify-center bg-stone-100 dark:bg-stone-800">
              <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : (
            <MapContainer center={[20, 0]} zoom={2} style={{ height: 500, width: '100%' }}
              className="z-0">
              <LayersControl position="topright">
                <BaseLayer checked name="Street Map">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                </BaseLayer>
                <BaseLayer name="Satellite (Esri)">
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; Esri'
                    eventHandlers={{ tileerror: () => setTileError(true) }}
                  />
                </BaseLayer>
                {!tileError && (
                  <BaseLayer name="NASA MODIS True Color">
                    <TileLayer
                      url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2023-01-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg"
                      attribution='&copy; NASA GIBS'
                      maxZoom={9}
                      eventHandlers={{ tileerror: () => setTileError(true) }}
                    />
                  </BaseLayer>
                )}
              </LayersControl>

              {/* Country markers */}
              {countries.map((c, i) => (
                <CircleMarker key={i}
                  center={[c.lat, c.lon]}
                  radius={yieldToRadius(c.mean_yield, maxYield)}
                  pathOptions={{
                    fillColor: tempToColor(c.mean_temp),
                    fillOpacity: 0.7,
                    color: '#fff',
                    weight: 1,
                  }}>
                  <Popup>
                    <div className="text-sm min-w-[180px]">
                      <p className="font-semibold text-base mb-2">{c.country}</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 flex items-center gap-1">
                            <Sprout className="h-3 w-3" /> Mean Yield
                          </span>
                          <span className="font-mono font-semibold">{c.mean_yield.toFixed(1)} t/ha</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 flex items-center gap-1">
                            <Thermometer className="h-3 w-3" /> Temperature
                          </span>
                          <span className="font-mono">{c.mean_temp}°C</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 flex items-center gap-1">
                            <Droplets className="h-3 w-3" /> Rainfall
                          </span>
                          <span className="font-mono">{c.mean_rain} mm/yr</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 flex items-center gap-1">
                            <Database className="h-3 w-3" /> Records
                          </span>
                          <span className="font-mono">{c.count}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
          {tileError && (
            <div className="bg-highlight/10 px-4 py-2 text-xs text-highlight-dark dark:text-highlight">
              ⚠ Some tile layers failed to load. Satellite imagery may be unavailable.
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 mb-8 text-xs text-stone-500 dark:text-stone-400">
          <span className="font-medium">Circle colour = temperature:</span>
          {[
            { color: '#0EA5E9', label: '< 10°C (cold)' },
            { color: '#22C55E', label: '10–18°C (mild)' },
            { color: '#F5B83D', label: '18–25°C (warm)' },
            { color: '#C2410C', label: '> 25°C (hot)' },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
            </span>
          ))}
          <span className="font-medium ml-4">Circle size = mean yield</span>
        </div>

        {/* Region cards */}
        <h2 className="text-xl font-display font-bold text-agri-text dark:text-white mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-accent" /> Key Agricultural Regions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REGIONS.map((region, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Globe2 className="h-4 w-4 text-accent" />
                <h3 className="font-semibold text-agri-text dark:text-white text-sm">{region.name}</h3>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{region.desc}</p>
              <p className="text-[10px] text-stone-400 mt-2 font-mono">
                {region.center[0].toFixed(1)}°{region.center[0] >= 0 ? 'N' : 'S'},{' '}
                {Math.abs(region.center[1]).toFixed(1)}°{region.center[1] >= 0 ? 'E' : 'W'}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
