import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Database, TrendingUp, Settings, HelpCircle,
  AlertTriangle, Zap, GitBranch, Shield, Clock, ChevronDown,
  Sprout, BarChart3, Wrench, Lightbulb, Target, Layers,
  Thermometer, Calendar, FlaskConical
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Pipeline steps                                                     */
/* ------------------------------------------------------------------ */
const PIPELINE = [
  { icon: Database, step: 'Raw Data', desc: 'Country-level FAO records, 1990–2013' },
  { icon: Wrench, step: 'Cleaning', desc: 'Handle missing values, convert hg/ha → t/ha' },
  { icon: BarChart3, step: 'EDA', desc: 'Distributions, correlations, scatter plots' },
  { icon: Layers, step: 'Feature Eng.', desc: 'Polynomial expansion, standardisation' },
  { icon: FlaskConical, step: 'Training', desc: '12 regression models per crop' },
  { icon: Target, step: 'Evaluation', desc: 'R², RMSE, MAE across 3 split strategies' },
  { icon: Sprout, step: 'Prediction', desc: 'Interactive yield estimation' },
];

/* ------------------------------------------------------------------ */
/*  Accordion Item                                                     */
/* ------------------------------------------------------------------ */
function Accordion({ title, icon: Icon, children, defaultOpen = false }: {
  title: string; icon?: React.ElementType; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-stone-200/60 dark:border-stone-800/60 bg-white dark:bg-stone-900 overflow-hidden shadow-sm">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
        aria-expanded={open}>
        <span className="flex items-center gap-3 font-semibold text-agri-text dark:text-white">
          {Icon && <Icon className="h-5 w-5 text-accent" />}
          {title}
        </span>
        <ChevronDown className={`h-5 w-5 text-stone-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="px-5 pb-5 text-sm text-stone-600 dark:text-stone-400 leading-relaxed border-t border-stone-100 dark:border-stone-800 pt-4">
          {children}
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ Data                                                           */
/* ------------------------------------------------------------------ */
const FAQ_ITEMS = [
  { q: 'Why these four features?', a: 'Temperature, rainfall, pesticide use and year are the most widely available global variables that intersect climate, agricultural practice and technology. They provide a meaningful baseline for regression analysis, though real agronomic models would include soil type, irrigation, crop variety and more.' },
  { q: 'Why polynomial regression?', a: 'Crop yield responses to temperature and rainfall are fundamentally non-linear — both too little and too much of either reduce yields. Polynomial terms capture these curved relationships. We compare degrees 2–5 and use Ridge regularisation to prevent high-degree polynomials from overfitting.' },
  { q: 'How do you handle overfitting?', a: 'Three strategies: (1) Ridge regularisation (L2 penalty) for high-degree polynomials, (2) 5-fold cross-validation to estimate generalisation error, and (3) a time-based train/test split to test temporal generalisation. We also monitor the gap between training and test RMSE in the bias-variance explorer.' },
  { q: 'Why separate models per crop?', a: 'Different crops have entirely different biological responses. Rice thrives in hot, wet conditions where wheat fails. A single model would force averaged coefficients that misrepresent every crop. Separate models let each capture crop-specific temperature optima and rainfall requirements.' },
  { q: 'What does R² mean in this context?', a: 'R² (coefficient of determination) is the proportion of variance in crop yield explained by our model. An R² of 0.85 means 85% of yield variation is accounted for. However, high R² does not imply causation — it measures correlation strength. On country-level aggregated data, R² can be inflated by between-country differences.' },
  { q: 'Why include a time-based split?', a: 'Random train/test splits can leak temporal information — the model sees 2012 data when predicting 2011. A chronological split (train on 1990–2008, test on 2009–2013) simulates real forecasting and reveals whether the model can generalise forward in time, not just interpolate.' },
  { q: 'Can this predict real farm yields?', a: 'No. This is a country-level statistical illustration, not an agronomic tool. Real farm yields depend on soil quality, irrigation, crop variety, planting density, pest outbreaks, harvest timing and many other local factors not captured here. The app is designed for learning about regression, not for making agricultural decisions.' },
  { q: 'Why is year a feature?', a: 'Year acts as a temporal proxy for unmeasured factors that improve over time — breeding programmes, fertiliser technology, mechanisation, policy changes. It captures a steady upward trend in yields. It is explicitly not a causal input and should not be extrapolated far beyond the training period (1990–2013).' },
  { q: 'What are the main limitations?', a: 'Country-level aggregation masks local variation; only 4 features capture a fraction of real-world complexity; no soil, irrigation or variety data; the static model ignores future adaptation; high polynomial degrees risk extrapolation artefacts; pesticide data quality varies by country; and spatial autocorrelation is ignored.' },
  { q: 'How would you improve this?', a: 'Use farm-level data, add satellite-derived features (NDVI), include soil and irrigation variables, try ensemble methods (Random Forest, XGBoost), implement time-series models (LSTM), integrate CMIP6 climate projections, and deploy as a continuously learning pipeline with proper MLOps.' },
];

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function Methodology() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-screen bg-agri-bg dark:bg-gray-950 pt-20 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-agri-text dark:text-white">
            Methodology & Limitations
          </h1>
          <p className="mt-3 text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
            Understanding the data pipeline, model choices, evaluation strategy and honest limitations.
          </p>
        </div>

        {/* ============ Pipeline Timeline ============ */}
        <section className="mb-14">
          <h2 className="text-xl font-display font-bold text-agri-text dark:text-white mb-6 flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" /> Data Science Pipeline
          </h2>
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-6 shadow-sm">
            {/* Desktop horizontal */}
            <div className="hidden md:flex items-start justify-between relative">
              <div className="absolute top-6 left-8 right-8 h-0.5 bg-stone-200 dark:bg-stone-700" />
              {PIPELINE.map((item, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center mb-3 border-2 border-accent/30">
                    <item.icon className="h-6 w-6 text-accent-dark dark:text-accent" />
                  </div>
                  <h4 className="text-sm font-semibold text-agri-text dark:text-white">{item.step}</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-[110px]">{item.desc}</p>
                </div>
              ))}
            </div>
            {/* Mobile vertical */}
            <div className="md:hidden space-y-4">
              {PIPELINE.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-accent-dark dark:text-accent" />
                    </div>
                    {i < PIPELINE.length - 1 && (
                      <div className="absolute top-10 left-1/2 w-0.5 h-4 bg-stone-200 dark:bg-stone-700 -translate-x-1/2" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-agri-text dark:text-white">{item.step}</h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ Technical Decisions ============ */}
        <section className="mb-14">
          <h2 className="text-xl font-display font-bold text-agri-text dark:text-white mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-info" /> Technical Decisions
          </h2>
          <div className="space-y-3">
            <Accordion title="Data Cleaning & Preparation" icon={Database}>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Missing values:</strong> Rows with NaN in any of the four features or yield are dropped. For the bundled dataset this affects &lt;2% of records.</li>
                <li><strong>Unit conversion:</strong> Yield is stored as hectograms per hectare (hg/ha) per FAO convention. We divide by 10,000 to get tonnes per hectare (t/ha) for interpretability.</li>
                <li><strong>Outlier handling:</strong> Outliers are retained because they often represent genuine extreme weather events or high-input farming systems. The box plot in the Data Explorer shows their distribution.</li>
                <li><strong>Feature types:</strong> All four features are continuous numeric. No categorical encoding is needed for the regression models (country is used for grouping, not as a model input).</li>
              </ul>
            </Accordion>

            <Accordion title="Why Model One Crop at a Time" icon={Sprout}>
              <p className="mb-3">Different crops have fundamentally different biological responses to environmental conditions:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Temperature optima:</strong> Rice thrives at 25–30°C while wheat prefers 15–20°C. A pooled model would average these, misrepresenting both.</li>
                <li><strong>Water requirements:</strong> Paddy rice needs 1,200+ mm of rainfall; sorghum is drought-tolerant at 400 mm.</li>
                <li><strong>Yield scales:</strong> Potato yields are measured in 15–40 t/ha while sorghum is 1–3 t/ha. Mixing these distorts residuals.</li>
              </ul>
              <p className="mt-3">Training one model per crop allows each to capture crop-specific non-linear relationships between climate variables and yield.</p>
            </Accordion>

            <Accordion title="The Year Temporal Proxy" icon={Calendar}>
              <p className="mb-3">Year is included as a feature but with an important caveat:</p>
              <div className="bg-highlight/10 dark:bg-highlight/20 rounded-xl p-4 border border-highlight/30 mb-3">
                <p className="text-sm font-medium text-highlight-dark dark:text-highlight">
                  ⚠ Year is a temporal proxy for technology and farming practice changes — it is NOT a direct causal input.
                </p>
              </div>
              <ul className="list-disc pl-5 space-y-2">
                <li>Year captures a steady upward trend driven by improved seeds, fertilisers, mechanisation and policy.</li>
                <li>The coefficient on year should be interpreted as "average annual yield improvement", not "years cause yield".</li>
                <li>Extrapolating year beyond the training range (1990–2013) is unreliable — technological progress is not guaranteed to continue linearly.</li>
              </ul>
            </Accordion>

            <Accordion title="Random vs Time-Based Evaluation" icon={GitBranch}>
              <p className="mb-3">We use three evaluation strategies to give an honest picture:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>80/20 random split:</strong> Standard approach. Fast and familiar. But can leak temporal information (model sees 2012 while predicting 2010).</li>
                <li><strong>5-fold cross-validation:</strong> Averages performance across 5 different splits, giving a more robust estimate with error bars (mean ± std).</li>
                <li><strong>Time-based split:</strong> Train on earlier years (1990–2008), test on later years (2009–2013). Simulates real forecasting. Typically shows lower R² — this is expected and honest.</li>
              </ul>
              <p className="mt-3">If a model scores well on random split but poorly on the time split, it may be memorising temporal patterns rather than learning generalisable relationships.</p>
            </Accordion>

            <Accordion title="Regularisation (Ridge)" icon={Shield}>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Problem:</strong> Polynomial features of degree 4–5 with 4 base features create 70–252 terms, many highly correlated. OLS becomes unstable with wild coefficient magnitudes.</li>
                <li><strong>Solution:</strong> Ridge regression adds an L2 penalty (α·‖w‖²) that shrinks coefficients toward zero, trading a small increase in bias for a large reduction in variance.</li>
                <li><strong>Alpha selection:</strong> α=10 for degree 4 and α=30 for degree 5 were chosen by comparing cross-validation R² across α values. Higher polynomial degrees need stronger regularisation.</li>
                <li><strong>Scaling:</strong> Features are standardised (zero mean, unit variance) before Ridge to ensure the penalty treats all features equally regardless of their natural scale.</li>
              </ul>
            </Accordion>
          </div>
        </section>

        {/* ============ Limitations ============ */}
        <section className="mb-14">
          <h2 className="text-xl font-display font-bold text-agri-text dark:text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger" /> Limitations
          </h2>
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-6 shadow-sm">
            <ol className="list-decimal pl-5 space-y-3 text-sm text-stone-600 dark:text-stone-400">
              <li><strong className="text-agri-text dark:text-white">Country-level aggregation</strong> masks vital within-country variation. India's Punjab and Rajasthan have vastly different conditions.</li>
              <li><strong className="text-agri-text dark:text-white">Limited features</strong> — only temperature, rainfall, pesticides and year. Missing: soil quality, irrigation, crop variety, labour, market prices.</li>
              <li><strong className="text-agri-text dark:text-white">No soil or irrigation data</strong> — two of the strongest predictors of real farm yields are absent from the model.</li>
              <li><strong className="text-agri-text dark:text-white">Temporal lag</strong> between climatic events and harvest is not captured. A drought in the planting season affects yield months later.</li>
              <li><strong className="text-agri-text dark:text-white">Static model</strong> ignores future adaptation — new drought-resistant varieties, changing irrigation access, policy shifts.</li>
              <li><strong className="text-agri-text dark:text-white">Extrapolation risk</strong> — polynomial models can produce wildly unrealistic predictions outside the training data range.</li>
              <li><strong className="text-agri-text dark:text-white">Data quality</strong> varies by reporting country. Pesticide tonnage data is particularly inconsistent across nations and years.</li>
            </ol>
          </div>
        </section>

        {/* ============ Future Work ============ */}
        <section className="mb-14">
          <h2 className="text-xl font-display font-bold text-agri-text dark:text-white mb-6 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-highlight" /> Future Work
          </h2>
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-6 shadow-sm">
            <ol className="list-decimal pl-5 space-y-3 text-sm text-stone-600 dark:text-stone-400">
              <li><strong className="text-agri-text dark:text-white">Farm-level data</strong> — sub-national or farm-level datasets would dramatically improve prediction accuracy.</li>
              <li><strong className="text-agri-text dark:text-white">Satellite features as inputs</strong> — NDVI, soil moisture from Sentinel/MODIS could replace coarse proxies.</li>
              <li><strong className="text-agri-text dark:text-white">Ensemble methods</strong> — Random Forest, Gradient Boosting and XGBoost typically outperform polynomial regression.</li>
              <li><strong className="text-agri-text dark:text-white">Time-series models</strong> — LSTM or temporal convolutional networks could capture seasonal and multi-year patterns.</li>
              <li><strong className="text-agri-text dark:text-white">Climate projections</strong> — integrating CMIP6 scenarios would enable forward-looking risk assessment.</li>
              <li><strong className="text-agri-text dark:text-white">Soil data</strong> — global gridded soil databases (SoilGrids) could add critical pedological context.</li>
              <li><strong className="text-agri-text dark:text-white">MLOps deployment</strong> — continuous retraining pipeline with data validation, model monitoring and drift detection.</li>
            </ol>
          </div>
        </section>

        {/* ============ Viva / FAQ ============ */}
        <section className="mb-14">
          <h2 className="text-xl font-display font-bold text-agri-text dark:text-white mb-6 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary dark:text-accent" /> Viva Questions & Answers
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, i) => (
              <Accordion key={i} title={`${i + 1}. ${faq.q}`}>
                <p>{faq.a}</p>
              </Accordion>
            ))}
          </div>
        </section>

        {/* ============ Honesty Box ============ */}
        <section className="mb-8">
          <div className="rounded-2xl bg-highlight/5 dark:bg-highlight/10 border border-highlight/20 p-6">
            <h3 className="font-semibold text-highlight-dark dark:text-highlight mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Key Honesty Points
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-stone-600 dark:text-stone-400">
              <div className="flex items-start gap-2">
                <span className="text-highlight-dark dark:text-highlight mt-0.5">ⓘ</span>
                <span><code className="text-xs bg-stone-100 dark:bg-stone-800 px-1 rounded">year</code> is a temporal proxy for technology, not a causal input.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-highlight-dark dark:text-highlight mt-0.5">ⓘ</span>
                <span>Results are statistical associations, not causation.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-highlight-dark dark:text-highlight mt-0.5">ⓘ</span>
                <span>Satellite imagery is context only and is NOT a model input.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-highlight-dark dark:text-highlight mt-0.5">ⓘ</span>
                <span>Country-level data is for illustration, not farm-level decisions.</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </motion.div>
  );
}
