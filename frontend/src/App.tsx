import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Lazy loading pages
const Landing = React.lazy(() => import('./pages/Landing'));
const Predictor = React.lazy(() => import('./pages/Predictor'));
const Explorer = React.lazy(() => import('./pages/Explorer'));
const ModelLab = React.lazy(() => import('./pages/ModelLab'));
const Scenarios = React.lazy(() => import('./pages/Scenarios'));
const Visuals3D = React.lazy(() => import('./pages/Visuals3D'));
const Satellite = React.lazy(() => import('./pages/Satellite'));
const Methodology = React.lazy(() => import('./pages/Methodology'));

const FallbackLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-agri-bg dark:bg-gray-950">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-sm text-stone-500 dark:text-stone-400">Loading...</p>
    </div>
  </div>
);

function App() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-agri-bg dark:bg-gray-950">
      <Navbar />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Suspense fallback={<FallbackLoader />}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Landing />} />
              <Route path="/predict" element={<Predictor />} />
              <Route path="/explore" element={<Explorer />} />
              <Route path="/models" element={<ModelLab />} />
              <Route path="/scenarios" element={<Scenarios />} />
              <Route path="/visuals" element={<Visuals3D />} />
              <Route path="/satellite" element={<Satellite />} />
              <Route path="/methodology" element={<Methodology />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default App;
