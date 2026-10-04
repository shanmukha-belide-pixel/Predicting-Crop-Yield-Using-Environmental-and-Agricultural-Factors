import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, Sprout, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReportExportModal from '@/components/shared/ReportExportModal';

const navLinks = [
  { name: 'Predictor', path: '/predict' },
  { name: 'Explorer', path: '/explore' },
  { name: 'Model Lab', path: '/models' },
  { name: 'Scenarios', path: '/scenarios' },
  { name: '3D Visuals', path: '/visuals' },
  { name: 'Satellite', path: '/satellite' },
  { name: 'Methodology', path: '/methodology' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [modelsData, setModelsData] = useState<any[]>([]);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (showReportModal && modelsData.length === 0) {
      fetch('/api/models/compare?crop=Wheat')
        .then(r => r.json())
        .then(d => {
          if (d.models && Array.isArray(d.models)) {
            setModelsData(d.models);
          }
        })
        .catch(() => {});
    }
  }, [showReportModal, modelsData.length]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <nav className="fixed w-full z-50 glass border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="flex items-center gap-2">
              <Sprout className="h-7 w-7 text-primary dark:text-accent" />
              <span className="font-display font-bold text-base sm:text-lg text-agri-text dark:text-white">Predicting Crop Yield</span>
            </NavLink>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) => cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors relative',
                  isActive 
                    ? 'text-primary dark:text-primary-light' 
                    : 'text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
                )}
              >
                {({ isActive }) => (
                  <>
                    {link.name}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-primary-light"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
            
            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors ml-2"
              title="Download interactive report or CSV metrics"
            >
              <FileText className="h-3.5 w-3.5 text-accent" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setIsDark(!isDark)}
              className="ml-2 p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun className="w-5 h-5 text-highlight" /> : <Moon className="w-5 h-5 text-stone-600" />}
            </button>
          </div>

          <div className="flex items-center md:hidden gap-1">
            <button
              onClick={() => setShowReportModal(true)}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Export Report"
            >
              <FileText className="w-5 h-5 text-accent" />
            </button>
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun className="w-5 h-5 text-highlight" /> : <Moon className="w-5 h-5 text-stone-600" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-stone-700 dark:text-stone-200 hover:text-primary dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 focus:outline-none"
              aria-label="Open menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-b"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => cn(
                    'block px-3 py-2 rounded-md text-base font-medium',
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800'
                  )}
                >
                  {link.name}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReportExportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        crop="Wheat"
        modelsData={modelsData}
      />
    </nav>
  );
}
