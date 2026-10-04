import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sprout, BarChart3, CloudSun, FlaskConical,
  ArrowRight, Database, Globe2, TrendingUp,
  Droplets, Thermometer, Bug, Calendar,
  ChevronRight
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */
function AnimCounter({ end, duration = 2000, suffix = '', prefix = '' }: {
  end: number; duration?: number; suffix?: string; prefix?: string;
}) {
  const [val, setVal] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) { setVal(end); return; }
    let start = 0;
    const step = end / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(id); }
      else setVal(Math.round(start * 100) / 100);
    }, 16);
    return () => clearInterval(id);
  }, [end, duration, reduced]);

  return <span>{prefix}{typeof end === 'number' && end % 1 !== 0 ? val.toFixed(2) : Math.round(val)}{suffix}</span>;
}

/* ------------------------------------------------------------------ */
/*  Pipeline step                                                      */
/* ------------------------------------------------------------------ */
const PIPELINE = [
  { icon: Database, label: 'Collect Data', desc: 'Country-level crop records' },
  { icon: FlaskConical, label: 'Clean', desc: 'Handle missing values & outliers' },
  { icon: BarChart3, label: 'Explore', desc: 'EDA & visualization' },
  { icon: TrendingUp, label: 'Model', desc: 'Regression analysis' },
  { icon: CloudSun, label: 'Evaluate', desc: 'R², RMSE, cross-validation' },
  { icon: Sprout, label: 'Predict', desc: 'Yield estimation' },
];

/* ------------------------------------------------------------------ */
/*  Feature cards                                                      */
/* ------------------------------------------------------------------ */
const FEATURES = [
  {
    icon: Sprout, title: 'Live Yield Predictor',
    desc: 'Adjust temperature, rainfall, pesticide use and year to predict crop yield with multiple regression models.',
    link: '/predict', color: 'bg-accent/10 text-accent-dark dark:text-accent-light',
  },
  {
    icon: BarChart3, title: 'Data Explorer',
    desc: 'Interactive histograms, scatter matrices, correlation heatmaps and trend lines across 100+ countries.',
    link: '/explore', color: 'bg-info/10 text-info dark:text-info-light',
  },
  {
    icon: FlaskConical, title: 'Model Lab',
    desc: 'Compare 12 regression models side by side with R², RMSE, MAE, residuals and bias-variance analysis.',
    link: '/models', color: 'bg-highlight/10 text-highlight-dark',
  },
  {
    icon: CloudSun, title: 'Climate Scenarios',
    desc: 'Simulate how warming of 0–3 °C could change predicted yields across different crops.',
    link: '/scenarios', color: 'bg-danger/10 text-danger dark:text-danger-light',
  },
  {
    icon: Globe2, title: '3D Visualisations',
    desc: 'Explore 3D scatter plots, fitted surfaces, error bowls and animated choropleth maps.',
    link: '/visuals', color: 'bg-primary/10 text-primary dark:text-primary-light',
  },
  {
    icon: Thermometer, title: 'Methodology',
    desc: 'Understand the data pipeline, model choices, limitations and honest evaluation methodology.',
    link: '/methodology', color: 'bg-accent/10 text-accent-dark dark:text-accent-light',
  },
];

/* ------------------------------------------------------------------ */
/*  Stagger variants                                                   */
/* ------------------------------------------------------------------ */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Landing() {
  const [stats, setStats] = useState({ bestR2: 0.87, datasetSize: 13176, countries: 101 });

  useEffect(() => {
    fetch('/api/dataset-info')
      .then(r => r.json())
      .then(d => {
        if (d.total_rows) setStats({ bestR2: d.best_r2 ?? 0.87, datasetSize: d.total_rows, countries: d.num_countries });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-agri-bg to-accent/5 dark:from-primary-dark/20 dark:via-gray-950 dark:to-accent/5 pt-20 pb-24 lg:pt-32 lg:pb-36">
        {/* Subtle leaf pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 5 Q40 15 35 30 Q30 40 20 35 Q10 30 15 20 Q20 10 30 5Z\' fill=\'%2322C55E\' /%3E%3C/svg%3E")', backgroundSize: '120px 120px' }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 dark:bg-accent/20 px-4 py-1.5 text-sm font-medium text-accent-dark dark:text-accent mb-6">
              <Sprout className="h-4 w-4" /> Regression Analysis & Prediction
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-agri-text dark:text-white leading-tight tracking-tight max-w-4xl mx-auto">
              Predicting Crop Yield Using Environmental and Agricultural Factors
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
              Explore how temperature, rainfall, pesticide use and time relate to crop yield, and compare regression models side by side.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/predict"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary dark:bg-accent-dark text-white px-8 py-3.5 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
              <Sprout className="h-5 w-5" /> Try the Predictor <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/explore"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-primary/20 dark:border-accent/30 text-primary dark:text-accent px-8 py-3.5 text-base font-semibold hover:bg-primary/5 dark:hover:bg-accent/10 transition-all duration-200">
              <BarChart3 className="h-5 w-5" /> Explore the Data
            </Link>
          </motion.div>

          {/* Live stat cards */}
          <motion.div initial="hidden" animate="show" variants={container}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { label: 'Best Model R²', value: stats.bestR2, suffix: '', icon: TrendingUp, color: 'text-accent' },
              { label: 'Data Points', value: stats.datasetSize, suffix: '', icon: Database, color: 'text-info' },
              { label: 'Countries', value: stats.countries, suffix: '+', icon: Globe2, color: 'text-highlight' },
            ].map((s, i) => (
              <motion.div key={i} variants={item}
                className="rounded-2xl bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm border border-stone-200/50 dark:border-stone-700/50 p-5 shadow-sm hover:shadow-md transition-shadow">
                <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.color}`} />
                <div className={`text-3xl font-mono font-bold ${s.color}`}>
                  <AnimCounter end={s.value} suffix={s.suffix} />
                </div>
                <div className="text-sm text-stone-500 dark:text-stone-400 mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="py-16 bg-white dark:bg-stone-950 border-y border-stone-200/50 dark:border-stone-800/50">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl sm:text-3xl font-display font-bold text-agri-text dark:text-white mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {PIPELINE.map((step, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="relative group text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center group-hover:bg-accent/20 dark:group-hover:bg-accent/30 transition-colors">
                  <step.icon className="h-7 w-7 text-accent-dark dark:text-accent" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-agri-text dark:text-white">{step.label}</h3>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{step.desc}</p>
                {i < PIPELINE.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute top-5 -right-3 h-5 w-5 text-stone-300 dark:text-stone-600" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES BENTO GRID ============ */}
      <section className="py-20 bg-agri-bg dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-agri-text dark:text-white">
              Everything You Need to Explore
            </h2>
            <p className="mt-3 text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
              From interactive prediction to deep model analysis, every tool is at your fingertips.
            </p>
          </div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={container}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={i} variants={item}>
                <Link to={f.link}
                  className="group block rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-agri-text dark:text-white group-hover:text-primary dark:group-hover:text-accent transition-colors">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{f.desc}</p>
                  <div className="mt-4 text-sm font-medium text-primary dark:text-accent flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ KEY FACTORS ============ */}
      <section className="py-16 bg-white dark:bg-stone-950 border-t border-stone-200/50 dark:border-stone-800/50">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl sm:text-3xl font-display font-bold text-agri-text dark:text-white mb-10">
            Key Environmental & Agricultural Factors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Thermometer, label: 'Temperature', unit: '°C', desc: 'Annual average temperature affects crop growth rates and seasonal cycles.', color: 'text-danger' },
              { icon: Droplets, label: 'Rainfall', unit: 'mm/year', desc: 'Precipitation determines water availability for crop development.', color: 'text-info' },
              { icon: Bug, label: 'Pesticides', unit: 'tonnes', desc: 'Pesticide use reflects agricultural intensity and crop protection.', color: 'text-highlight-dark' },
              { icon: Calendar, label: 'Year', unit: '1990–2013', desc: 'A temporal proxy for technology, policy and farming practice changes.', color: 'text-primary dark:text-accent' },
            ].map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-stone-200/60 dark:border-stone-800/60 p-5 text-center hover:shadow-md transition-shadow bg-white dark:bg-stone-900">
                <f.icon className={`h-8 w-8 mx-auto ${f.color}`} />
                <h3 className="mt-3 font-semibold text-agri-text dark:text-white">{f.label}</h3>
                <span className="text-xs font-mono text-stone-400">{f.unit}</span>
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-stone-500 dark:text-stone-500 italic max-w-2xl mx-auto">
            ⓘ Year is included as a temporal proxy for technology and farming practice — it is not a direct causal input.
            All results represent statistical associations, not causation.
          </p>
        </div>
      </section>

      {/* ============ HONESTY NOTE ============ */}
      <section className="py-12 bg-highlight/5 dark:bg-highlight/10 border-t border-highlight/20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h3 className="text-lg font-semibold text-highlight-dark dark:text-highlight mb-3">Important Context</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {[
              'Results are statistical associations, not causation.',
              'Data is country-level — not suitable for farm-level decisions.',
              'Satellite imagery is context only and is NOT a model input.',
              '`year` is a temporal proxy for technology, not a causal input.',
            ].map((note, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
                <span className="mt-0.5 text-highlight-dark dark:text-highlight">ⓘ</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
