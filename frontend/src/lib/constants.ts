export const CROP_ICONS: Record<string, string> = {
  'Wheat': 'Wheat',
  'Rice': 'Leaf',
  'Maize': 'Sprout',
  'Soybeans': 'Bean',
  'Potatoes': 'TreePine'
};

export const MODEL_NAMES: Record<string, string> = {
  'rf': 'Random Forest',
  'gb': 'Gradient Boosting',
  'xgb': 'XGBoost',
  'lr': 'Linear Regression',
  'dt': 'Decision Tree'
};

export const CHART_COLORS = [
  '#14532D', // Primary dark green
  '#22C55E', // Accent green
  '#F5B83D', // Highlight yellow/gold
  '#0EA5E9', // Info blue
  '#C2410C', // Danger orange
  '#8B5CF6', // Purple
  '#EC4899'  // Pink
];

export const FEATURE_LABELS: Record<string, string> = {
  average_rain_fall_mm_per_year: 'Rainfall',
  pesticides_tonnes: 'Pesticides',
  avg_temp: 'Temperature'
};

export const FEATURE_UNITS: Record<string, string> = {
  average_rain_fall_mm_per_year: 'mm/year',
  pesticides_tonnes: 'tonnes',
  avg_temp: '°C'
};
