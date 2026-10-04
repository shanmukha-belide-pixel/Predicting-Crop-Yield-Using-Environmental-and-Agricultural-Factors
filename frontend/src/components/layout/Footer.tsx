import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="glass border-t mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Predicting Crop Yield. All rights reserved.
          </p>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            Built with <Heart className="h-4 w-4 text-danger mx-1" /> for Agriculture
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 text-center md:text-right max-w-xs">
            Disclaimer: Predictions are based on historical ML models and should not substitute expert agricultural advice.
          </div>
        </div>
      </div>
    </footer>
  );
}
