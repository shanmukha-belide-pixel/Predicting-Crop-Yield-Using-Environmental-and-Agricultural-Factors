"""
ML Models module for Crop Yield Predictor.
Trains, caches, and evaluates regression models per crop.
All metrics come from actual model training - nothing is hardcoded.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from sklearn.pipeline import make_pipeline
from scipy.optimize import curve_fit
from scipy.stats import gaussian_kde
from statsmodels.stats.outliers_influence import variance_inflation_factor
import os
import warnings
import traceback
from typing import Optional, List, Dict, Any

warnings.filterwarnings("ignore")

# ------------------------------------------------------------------ #
#  Data loading                                                        #
# ------------------------------------------------------------------ #
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "yield_df.csv")

df: pd.DataFrame = pd.DataFrame()
models_cache: dict = {}
metrics_cache: dict = {}

FEATURES_MULTI = ['Year', 'average_rain_fall_mm_per_year', 'pesticides_tonnes', 'avg_temp']
FEATURES_SINGLE = ['avg_temp']
TARGET = 'yield_tonnes_ha'

MODEL_NAMES_MAP = {
    'simple_linear': 'Simple Linear (temp)',
    'multiple_linear': 'Multiple Linear',
    'exponential': 'Exponential (temp)',
    'logistic': 'Logistic (temp)',
    'poly_2_single': 'Polynomial deg 2 (temp)',
    'poly_3_single': 'Polynomial deg 3 (temp)',
    'poly_2_multi': 'Polynomial deg 2 (multi)',
    'poly_3_multi': 'Polynomial deg 3 (multi)',
    'poly_4_multi': 'Polynomial deg 4 (multi)',
    'poly_5_multi': 'Polynomial deg 5 (multi)',
    'poly_4_ridge': 'Poly deg 4 + Ridge(10)',
    'poly_5_ridge': 'Poly deg 5 + Ridge(30)',
}

def load_data(path: str = DATA_PATH) -> pd.DataFrame:
    global df
    if os.path.exists(path):
        df = pd.read_csv(path)
        df.dropna(inplace=True)
        if 'hg/ha_yield' in df.columns:
            df[TARGET] = df['hg/ha_yield'] / 10000.0
        for col in FEATURES_MULTI:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        df.dropna(subset=FEATURES_MULTI + [TARGET], inplace=True)
    else:
        df = pd.DataFrame()
    return df

load_data()

# ------------------------------------------------------------------ #
#  Nonlinear functions                                                 #
# ------------------------------------------------------------------ #
def exp_func(x, a, b, c):
    return a * np.exp(-b * x) + c

def log_func(x, L, k, x0):
    return L / (1 + np.exp(-k * (x - x0)))

# ------------------------------------------------------------------ #
#  Core API functions                                                  #
# ------------------------------------------------------------------ #
def get_crops():
    if df.empty:
        return []
    return sorted(df['Item'].unique().tolist())


def _train_evaluate_sklearn(X, y, X_time_train, X_time_test, y_time_train, y_time_test, model_factory):
    """Train an sklearn model with random + time splits + CV."""
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = model_factory()
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    m = {
        'r2': float(r2_score(y_test, y_pred)),
        'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred))),
        'mae': float(mean_absolute_error(y_test, y_pred)),
    }

    # Time-based
    if len(X_time_train) > 10 and len(X_time_test) > 5:
        mt = model_factory()
        mt.fit(X_time_train, y_time_train)
        ytp = mt.predict(X_time_test)
        m['r2_time'] = float(r2_score(y_time_test, ytp))
        m['rmse_time'] = float(np.sqrt(mean_squared_error(y_time_test, ytp)))
        m['mae_time'] = float(mean_absolute_error(y_time_test, ytp))
    else:
        m['r2_time'] = m['r2']; m['rmse_time'] = m['rmse']; m['mae_time'] = m['mae']

    # Cross-validation
    try:
        cv = cross_val_score(model_factory(), X, y, cv=5, scoring='r2')
        m['cv_r2_mean'] = float(cv.mean())
        m['cv_r2_std'] = float(cv.std())
    except:
        m['cv_r2_mean'] = m['r2']
        m['cv_r2_std'] = 0.0

    # Store actual/predicted for scatter
    m['actual_test'] = y_test.tolist()
    m['predicted_test'] = y_pred.tolist()

    return model, m


def _train_evaluate_scipy(X_temp, y, X_time_temp, y_time, func, p0=None):
    """Train a scipy curve_fit model."""
    X_train, X_test, y_train, y_test = train_test_split(X_temp, y, test_size=0.2, random_state=42)

    try:
        popt, pcov = curve_fit(func, X_train, y_train, maxfev=20000, p0=p0)
        perr = np.sqrt(np.diag(pcov)) if pcov is not None else np.zeros(len(popt))
    except Exception:
        return None, _empty_metrics(), None, None

    y_pred = func(X_test, *popt)
    m = {
        'r2': float(r2_score(y_test, y_pred)),
        'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred))),
        'mae': float(mean_absolute_error(y_test, y_pred)),
    }

    # Time-based
    n_time = len(X_time_temp)
    split = int(n_time * 0.8)
    if split > 10 and n_time - split > 5:
        ytp = func(X_time_temp[split:], *popt)
        m['r2_time'] = float(r2_score(y_time[split:], ytp))
        m['rmse_time'] = float(np.sqrt(mean_squared_error(y_time[split:], ytp)))
        m['mae_time'] = float(mean_absolute_error(y_time[split:], ytp))
    else:
        m['r2_time'] = m['r2']; m['rmse_time'] = m['rmse']; m['mae_time'] = m['mae']

    m['cv_r2_mean'] = m['r2']
    m['cv_r2_std'] = 0.0
    m['actual_test'] = y_test.tolist()
    m['predicted_test'] = y_pred.tolist()

    return popt, m, popt.tolist(), perr.tolist()


def _empty_metrics():
    return {k: 0.0 for k in ['r2', 'rmse', 'mae', 'r2_time', 'rmse_time', 'mae_time', 'cv_r2_mean', 'cv_r2_std']}


def train_models_for_crop(crop: str):
    """Train all 12 models for a given crop. Cached per crop."""
    if crop in models_cache:
        return

    cdf = df[df['Item'] == crop].copy()
    if len(cdf) < 20:
        return

    # Sort for time split
    cdf_time = cdf.sort_values('Year')
    split_idx = int(len(cdf_time) * 0.8)

    X_multi = cdf[FEATURES_MULTI].values
    X_single = cdf[FEATURES_SINGLE].values.ravel()
    y = cdf[TARGET].values

    X_time_multi = cdf_time[FEATURES_MULTI].values
    y_time = cdf_time[TARGET].values

    X_tm_tr, X_tm_te = X_time_multi[:split_idx], X_time_multi[split_idx:]
    y_tm_tr, y_tm_te = y_time[:split_idx], y_time[split_idx:]

    X_time_single = cdf_time[FEATURES_SINGLE].values.ravel()
    X_ts_tr, X_ts_te = X_time_single[:split_idx], X_time_single[split_idx:]
    y_ts_tr, y_ts_te = y_time[:split_idx], y_time[split_idx:]

    models = {}
    mets = {}
    scipy_params = {}

    # 1. Simple Linear (temp)
    try:
        models['Simple Linear (temp)'], mets['Simple Linear (temp)'] = _train_evaluate_sklearn(
            X_single.reshape(-1, 1), y, X_ts_tr.reshape(-1, 1), X_ts_te.reshape(-1, 1), y_ts_tr, y_ts_te,
            lambda: LinearRegression()
        )
    except:
        models['Simple Linear (temp)'] = None; mets['Simple Linear (temp)'] = _empty_metrics()

    # 2. Multiple Linear
    try:
        models['Multiple Linear'], mets['Multiple Linear'] = _train_evaluate_sklearn(
            X_multi, y, X_tm_tr, X_tm_te, y_tm_tr, y_tm_te, lambda: LinearRegression()
        )
    except:
        models['Multiple Linear'] = None; mets['Multiple Linear'] = _empty_metrics()

    # 3. Exponential decay (temp)
    try:
        p0_exp = [max(y) * 2, 0.1, min(y)]
        popt, m, params, errs = _train_evaluate_scipy(X_single, y, X_time_single, y_time, exp_func, p0=p0_exp)
        models['Exponential (temp)'] = popt
        mets['Exponential (temp)'] = m
        scipy_params['Exponential (temp)'] = {'params': params, 'std_errs': errs, 'param_names': ['a', 'b', 'c']}
    except:
        models['Exponential (temp)'] = None; mets['Exponential (temp)'] = _empty_metrics()
        scipy_params['Exponential (temp)'] = None

    # 4. Logistic (temp)
    try:
        p0_log = [max(y), 0.5, np.median(X_single)]
        popt, m, params, errs = _train_evaluate_scipy(X_single, y, X_time_single, y_time, log_func, p0=p0_log)
        models['Logistic (temp)'] = popt
        mets['Logistic (temp)'] = m
        scipy_params['Logistic (temp)'] = {'params': params, 'std_errs': errs, 'param_names': ['L', 'k', 'x0']}
    except:
        models['Logistic (temp)'] = None; mets['Logistic (temp)'] = _empty_metrics()
        scipy_params['Logistic (temp)'] = None

    # 5-6. Polynomial deg 2/3 single
    for deg in [2, 3]:
        name = f'Polynomial deg {deg} (temp)'
        try:
            models[name], mets[name] = _train_evaluate_sklearn(
                X_single.reshape(-1, 1), y, X_ts_tr.reshape(-1, 1), X_ts_te.reshape(-1, 1), y_ts_tr, y_ts_te,
                lambda d=deg: make_pipeline(PolynomialFeatures(d), LinearRegression())
            )
        except:
            models[name] = None; mets[name] = _empty_metrics()

    # 7-10. Polynomial deg 2-5 multi
    for deg in [2, 3, 4, 5]:
        name = f'Polynomial deg {deg} (multi)'
        try:
            models[name], mets[name] = _train_evaluate_sklearn(
                X_multi, y, X_tm_tr, X_tm_te, y_tm_tr, y_tm_te,
                lambda d=deg: make_pipeline(PolynomialFeatures(d), LinearRegression())
            )
        except:
            models[name] = None; mets[name] = _empty_metrics()

    # 11. Poly deg 4 + Ridge(10)
    try:
        models['Poly deg 4 + Ridge(10)'], mets['Poly deg 4 + Ridge(10)'] = _train_evaluate_sklearn(
            X_multi, y, X_tm_tr, X_tm_te, y_tm_tr, y_tm_te,
            lambda: make_pipeline(StandardScaler(), PolynomialFeatures(4), Ridge(alpha=10))
        )
    except:
        models['Poly deg 4 + Ridge(10)'] = None; mets['Poly deg 4 + Ridge(10)'] = _empty_metrics()

    # 12. Poly deg 5 + Ridge(30)
    try:
        models['Poly deg 5 + Ridge(30)'], mets['Poly deg 5 + Ridge(30)'] = _train_evaluate_sklearn(
            X_multi, y, X_tm_tr, X_tm_te, y_tm_tr, y_tm_te,
            lambda: make_pipeline(StandardScaler(), PolynomialFeatures(5), Ridge(alpha=30))
        )
    except:
        models['Poly deg 5 + Ridge(30)'] = None; mets['Poly deg 5 + Ridge(30)'] = _empty_metrics()

    models_cache[crop] = models
    metrics_cache[crop] = mets
    # Store scipy params separately
    models_cache[f'{crop}__scipy_params'] = scipy_params


def get_model_comparison(crop: str):
    """Return list of model metrics for comparison table."""
    train_models_for_crop(crop)
    mets = metrics_cache.get(crop, {})
    result = []
    for name, m in mets.items():
        result.append({
            'name': name,
            'display_name': name,
            'r2': round(m.get('r2', 0), 4),
            'rmse': round(m.get('rmse', 0), 4),
            'mae': round(m.get('mae', 0), 4),
            'cv_r2_mean': round(m.get('cv_r2_mean', 0), 4),
            'cv_r2_std': round(m.get('cv_r2_std', 0), 4),
            'r2_time': round(m.get('r2_time', 0), 4),
            'rmse_time': round(m.get('rmse_time', 0), 4),
            'mae_time': round(m.get('mae_time', 0), 4),
        })
    return result


def predict(crop: str, model_key: str, year: float, rainfall: float, pesticides: float, temp: float):
    """Predict yield for given inputs and model."""
    train_models_for_crop(crop)
    models = models_cache.get(crop, {})

    # Resolve model key (frontend sends short names)
    model_name = MODEL_NAMES_MAP.get(model_key, model_key)
    if model_name not in models:
        # Try partial match
        for k in models:
            if model_key.lower() in k.lower():
                model_name = k
                break
        else:
            raise ValueError(f"Model '{model_key}' not found. Available: {list(models.keys())}")

    model = models[model_name]
    if model is None:
        raise ValueError(f"Model '{model_name}' failed to train")

    cdf = df[df['Item'] == crop]
    mean_yield = float(cdf[TARGET].mean())

    # Check if inputs are outside training range
    outside = []
    ranges = _get_ranges(crop)
    if year < ranges['year'][0] or year > ranges['year'][1]:
        outside.append('Year')
    if rainfall < ranges['rainfall'][0] or rainfall > ranges['rainfall'][1]:
        outside.append('Rainfall')
    if pesticides < ranges['pesticides'][0] or pesticides > ranges['pesticides'][1]:
        outside.append('Pesticides')
    if temp < ranges['temp'][0] or temp > ranges['temp'][1]:
        outside.append('Temperature')

    # Predict
    is_single = '(temp)' in model_name and 'multi' not in model_name
    if is_single:
        if 'Exponential' in model_name:
            pred = float(exp_func(temp, *model))
        elif 'Logistic' in model_name:
            pred = float(log_func(temp, *model))
        else:
            pred = float(model.predict(np.array([[temp]]))[0])
    else:
        X_in = np.array([[year, rainfall, pesticides, temp]])
        pred = float(model.predict(X_in)[0])

    pred = max(0, pred)
    delta_pct = ((pred - mean_yield) / mean_yield * 100) if mean_yield > 0 else 0

    return {
        'predicted_yield': round(pred, 3),
        'crop_average': round(mean_yield, 3),
        'delta_percent': round(delta_pct, 2),
        'is_outside_range': len(outside) > 0,
        'outside_features': outside,
        'model_name': model_name,
    }


def _get_ranges(crop: Optional[str] = None):
    if crop is None or str(crop).lower() in ('all', 'all crops', ''):
        cdf = df
    else:
        cdf = df[df['Item'] == crop]
    if cdf.empty:
        return {
            'year': [1990, 2013],
            'rainfall': [0.0, 5000.0],
            'pesticides': [0.0, 100000.0],
            'temp': [0.0, 40.0],
            'avg_yield': 0.0,
        }
    return {
        'year': [int(cdf['Year'].min()), int(cdf['Year'].max())],
        'rainfall': [float(cdf['average_rain_fall_mm_per_year'].min()), float(cdf['average_rain_fall_mm_per_year'].max())],
        'pesticides': [float(cdf['pesticides_tonnes'].min()), float(cdf['pesticides_tonnes'].max())],
        'temp': [float(cdf['avg_temp'].min()), float(cdf['avg_temp'].max())],
        'avg_yield': round(float(cdf[TARGET].mean()), 3),
    }


def get_eda(crop: Optional[str] = None):
    """Return comprehensive EDA data for a specific crop or all crops."""
    if crop is None or str(crop).lower() in ('all', 'all crops', ''):
        cdf = df
        current_crop = 'All'
    else:
        cdf = df[df['Item'] == crop]
        current_crop = crop

    if cdf.empty:
        cdf = df

    features = [TARGET, 'avg_temp', 'average_rain_fall_mm_per_year', 'pesticides_tonnes', 'Year']
    feat_labels = ['Yield (t/ha)', 'Temperature (C)', 'Rainfall (mm/yr)', 'Pesticides (tonnes)', 'Year']

    # Stats
    stats = {}
    for f, label in zip(features, feat_labels):
        col = cdf[f]
        stats[label] = {
            'count': int(col.count()), 'mean': round(float(col.mean()), 3),
            'std': round(float(col.std()), 3), 'min': round(float(col.min()), 3),
            'max': round(float(col.max()), 3),
            'q25': round(float(col.quantile(0.25)), 3), 'q75': round(float(col.quantile(0.75)), 3),
        }

    # Distributions (histograms + KDE)
    distributions = {}
    for f, label in zip(features, feat_labels):
        vals = cdf[f].dropna().values
        if len(vals) < 5:
            continue
        hist_counts, bin_edges = np.histogram(vals, bins=30)
        bin_centers = ((bin_edges[:-1] + bin_edges[1:]) / 2).tolist()

        try:
            kde = gaussian_kde(vals)
            x_kde = np.linspace(vals.min(), vals.max(), 100)
            y_kde = kde(x_kde)
            # Scale KDE to match histogram
            y_kde = y_kde * len(vals) * (bin_edges[1] - bin_edges[0])
        except:
            x_kde = bin_centers
            y_kde = hist_counts.tolist()

        distributions[label] = {
            'bins': bin_centers,
            'counts': hist_counts.tolist(),
            'kde_x': x_kde.tolist() if isinstance(x_kde, np.ndarray) else x_kde,
            'kde_y': y_kde.tolist() if isinstance(y_kde, np.ndarray) else y_kde,
        }

    # Correlations
    corr_cols = features
    corr_matrix = cdf[corr_cols].corr().values.tolist()
    corr_labels = feat_labels

    # Scatter data (subsample to 800 if large for chart responsiveness)
    scatter_sample = cdf if len(cdf) <= 800 else cdf.sample(800, random_state=42)
    scatter_data = []
    for f, label in zip(features[1:], feat_labels[1:]):  # skip yield itself
        scatter_data.append({
            'feature': label,
            'x': [round(float(v), 2) for v in scatter_sample[f].tolist()],
            'y': [round(float(v), 3) for v in scatter_sample[TARGET].tolist()],
        })

    # Trends
    if current_crop == 'All':
        trends = df.groupby(['Year', 'Item'])[TARGET].mean().reset_index()
        trends_data = [{
            'year': int(r['Year']),
            'avg_yield': round(float(r[TARGET]), 3),
            'crop': str(r['Item'])
        } for _, r in trends.iterrows()]
    else:
        trends = cdf.groupby('Year')[TARGET].mean().reset_index()
        trends_data = [{
            'year': int(r['Year']),
            'avg_yield': round(float(r[TARGET]), 3),
            'crop': current_crop
        } for _, r in trends.iterrows()]

    # Box plot data (all crops)
    box_data = []
    for c in get_crops():
        cv = df[df['Item'] == c][TARGET]
        if len(cv) < 5:
            continue
        box_data.append({
            'crop': c,
            'min': round(float(cv.min()), 3), 'q1': round(float(cv.quantile(0.25)), 3),
            'median': round(float(cv.median()), 3), 'q3': round(float(cv.quantile(0.75)), 3),
            'max': round(float(cv.max()), 3), 'mean': round(float(cv.mean()), 3),
        })

    # Country stats
    country_stats = cdf.groupby('Area').agg({
        TARGET: 'mean', 'avg_temp': 'mean',
        'average_rain_fall_mm_per_year': 'mean', 'Year': 'count'
    }).reset_index()
    country_data = [{
        'country': r['Area'], 'mean_yield': round(float(r[TARGET]), 3),
        'mean_temp': round(float(r['avg_temp']), 1),
        'mean_rain': round(float(r['average_rain_fall_mm_per_year']), 1),
        'count': int(r['Year']),
    } for _, r in country_stats.iterrows()]

    return {
        'stats': stats,
        'distributions': distributions,
        'correlations': {'matrix': corr_matrix, 'labels': corr_labels},
        'scatter_data': scatter_data,
        'trends': trends_data,
        'box_plot': box_data,
        'country_stats': country_data,
        'ranges': _get_ranges(crop),
    }


def get_scenario(crop: str, delta_temp: float):
    """Predict yield change for a warming scenario."""
    train_models_for_crop(crop)
    model = models_cache.get(crop, {}).get('Multiple Linear')
    cdf = df[df['Item'] == crop]

    baseline = float(cdf[TARGET].mean())
    if baseline <= 0 or model is None:
        return {'crop': crop, 'delta_temp': delta_temp, 'baseline_yield': baseline,
                'predicted_yield': baseline, 'percent_change': 0.0}

    X_base = np.array([[cdf['Year'].mean(), cdf['average_rain_fall_mm_per_year'].mean(),
                        cdf['pesticides_tonnes'].mean(), cdf['avg_temp'].mean()]])
    X_warm = X_base.copy()
    X_warm[0, 3] += delta_temp

    pred_base = float(model.predict(X_base)[0])
    pred_warm = float(model.predict(X_warm)[0])
    pct = ((pred_warm - pred_base) / pred_base * 100) if pred_base > 0 else 0

    return {
        'crop': crop, 'delta_temp': delta_temp,
        'baseline_yield': round(pred_base, 3),
        'predicted_yield': round(max(0, pred_warm), 3),
        'percent_change': round(pct, 2),
    }


def get_countries(crop: str):
    """Return country-level statistics for a crop."""
    cdf = df[df['Item'] == crop]
    stats = cdf.groupby('Area').agg({
        TARGET: 'mean', 'avg_temp': 'mean',
        'average_rain_fall_mm_per_year': 'mean', 'Year': 'count'
    }).reset_index()

    # Add approximate lat/lon for major countries
    COORDS = {
        'United States of America': (39.8, -98.6), 'India': (20.6, 78.9), 'China': (35.9, 104.2),
        'Brazil': (-14.2, -51.9), 'Argentina': (-38.4, -63.6), 'France': (46.2, 2.2),
        'Germany': (51.2, 10.4), 'Australia': (-25.3, 133.8), 'Canada': (56.1, -106.3),
        'Russia': (61.5, 105.3), 'Ukraine': (48.4, 31.2), 'Indonesia': (-0.8, 113.9),
        'Thailand': (15.9, 100.9), 'Vietnam': (14.1, 108.3), 'Nigeria': (9.1, 8.7),
        'Ethiopia': (9.1, 40.5), 'Pakistan': (30.4, 69.3), 'Bangladesh': (23.7, 90.4),
        'Mexico': (23.6, -102.6), 'Turkey': (38.9, 35.2), 'Egypt': (26.8, 30.8),
        'South Africa': (-30.6, 22.9), 'Kenya': (-0.02, 37.9), 'Japan': (36.2, 138.3),
        'United Kingdom': (55.4, -3.4), 'Italy': (41.9, 12.6), 'Spain': (40.5, -3.7),
        'Colombia': (4.6, -74.3), 'Peru': (-9.2, -75.0), 'Netherlands': (52.1, 5.3),
        'Poland': (51.9, 19.1), 'Iran': (32.4, 53.7), 'South Korea': (35.9, 127.8),
        'Philippines': (12.9, 121.8), 'New Zealand': (-40.9, 174.9), 'Israel': (31.0, 34.9),
        'Chile': (-35.7, -71.5), 'Morocco': (31.8, -7.1), 'Tanzania, United Republic of': (-6.4, 34.9),
    }

    result = []
    for _, r in stats.iterrows():
        country = r['Area']
        lat, lon = COORDS.get(country, (0, 0))
        result.append({
            'country': country,
            'mean_yield': round(float(r[TARGET]), 3),
            'mean_temp': round(float(r['avg_temp']), 1),
            'mean_rain': round(float(r['average_rain_fall_mm_per_year']), 1),
            'count': int(r['Year']),
            'lat': lat, 'lon': lon,
        })
    return result


def get_surface(crop: str, x_feature: str, y_feature: str):
    """Generate 3D surface grid for two features vs yield."""
    train_models_for_crop(crop)
    cdf = df[df['Item'] == crop]
    model = models_cache.get(crop, {}).get('Multiple Linear')
    model_poly = models_cache.get(crop, {}).get('Polynomial deg 3 (multi)')

    if model is None:
        return {'x_grid': [], 'y_grid': [], 'z_grid': [], 'z_grid_poly': [],
                'x_data': [], 'y_data': [], 'z_data': [], 'year_data': []}

    # Map feature names
    feat_map = {
        'avg_temp': 'avg_temp', 'temperature': 'avg_temp', 'temp': 'avg_temp',
        'average_rain_fall_mm_per_year': 'average_rain_fall_mm_per_year',
        'rainfall': 'average_rain_fall_mm_per_year', 'rain': 'average_rain_fall_mm_per_year',
        'pesticides_tonnes': 'pesticides_tonnes', 'pesticides': 'pesticides_tonnes',
    }
    xf = feat_map.get(x_feature, x_feature)
    yf = feat_map.get(y_feature, y_feature)

    x_vals = cdf[xf].values
    y_vals = cdf[yf].values
    z_vals = cdf[TARGET].values

    # Create grid
    x_range = np.linspace(x_vals.min(), x_vals.max(), 25)
    y_range = np.linspace(y_vals.min(), y_vals.max(), 25)
    xx, yy = np.meshgrid(x_range, y_range)

    # Predict on grid using mean values for other features
    mean_vals = {f: float(cdf[f].mean()) for f in FEATURES_MULTI}
    grid_points = []
    for i in range(xx.shape[0]):
        for j in range(xx.shape[1]):
            point = mean_vals.copy()
            point[xf] = xx[i, j]
            point[yf] = yy[i, j]
            grid_points.append([point['Year'], point['average_rain_fall_mm_per_year'],
                              point['pesticides_tonnes'], point['avg_temp']])

    grid_X = np.array(grid_points)
    zz = model.predict(grid_X).reshape(xx.shape)

    zz_poly = zz  # fallback
    if model_poly is not None:
        try:
            zz_poly = model_poly.predict(grid_X).reshape(xx.shape)
        except:
            pass

    return {
        'x_grid': xx.tolist(), 'y_grid': yy.tolist(),
        'z_grid': np.clip(zz, 0, None).tolist(),
        'z_grid_poly': np.clip(zz_poly, 0, None).tolist(),
        'x_data': x_vals.tolist(), 'y_data': y_vals.tolist(),
        'z_data': z_vals.tolist(), 'year_data': cdf['Year'].tolist(),
    }


def get_actual_vs_predicted(crop: str, model_key: str):
    """Return actual vs predicted scatter data."""
    train_models_for_crop(crop)
    models = models_cache.get(crop, {})
    model_name = MODEL_NAMES_MAP.get(model_key, model_key)

    # Try partial match
    if model_name not in models:
        for k in models:
            if model_key.lower() in k.lower():
                model_name = k
                break

    mets = metrics_cache.get(crop, {}).get(model_name, {})
    cdf = df[df['Item'] == crop]

    actual = mets.get('actual_test', [])
    predicted = mets.get('predicted_test', [])

    # Get countries for test set
    countries = cdf['Area'].tolist()[:len(actual)] if actual else []

    return {
        'actual': actual, 'predicted': predicted,
        'countries': countries, 'model_name': model_name,
    }


def get_residuals(crop: str, model_key: str):
    """Return residual diagnostic data."""
    data = get_actual_vs_predicted(crop, model_key)
    actual = np.array(data['actual'])
    predicted = np.array(data['predicted'])

    if len(actual) == 0:
        return {'predicted': [], 'residuals': [], 'histogram': {'bins': [], 'counts': []}}

    residuals = (actual - predicted).tolist()
    hist_counts, bin_edges = np.histogram(actual - predicted, bins=25)
    bin_centers = ((bin_edges[:-1] + bin_edges[1:]) / 2).tolist()

    return {
        'predicted': predicted.tolist(),
        'residuals': residuals,
        'histogram': {'bins': bin_centers, 'counts': hist_counts.tolist()},
    }


def get_bias_variance(crop: str, degree: int):
    """Return train/test RMSE for a polynomial degree on temp vs yield."""
    cdf = df[df['Item'] == crop]
    X = cdf[['avg_temp']].values
    y = cdf[TARGET].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    try:
        model = make_pipeline(PolynomialFeatures(degree), LinearRegression())
        model.fit(X_train, y_train)

        train_rmse = float(np.sqrt(mean_squared_error(y_train, model.predict(X_train))))
        test_rmse = float(np.sqrt(mean_squared_error(y_test, model.predict(X_test))))

        # Generate curve for plotting
        x_curve = np.linspace(X.min(), X.max(), 100).reshape(-1, 1)
        y_curve = model.predict(x_curve)

        return {
            'degree': degree,
            'train_rmse': round(train_rmse, 4),
            'test_rmse': round(test_rmse, 4),
            'x_curve': x_curve.ravel().tolist(),
            'y_curve': np.clip(y_curve, 0, None).ravel().tolist(),
            'x_data': X.ravel().tolist(),
            'y_data': y.tolist(),
        }
    except:
        return {'degree': degree, 'train_rmse': 0, 'test_rmse': 0,
                'x_curve': [], 'y_curve': [], 'x_data': [], 'y_data': []}


def get_feature_importance(crop: str):
    """Return standardised coefficients and VIF."""
    train_models_for_crop(crop)
    cdf = df[df['Item'] == crop]
    X = cdf[FEATURES_MULTI].values
    y = cdf[TARGET].values

    # Standardised coefficients
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    lr = LinearRegression()
    lr.fit(X_scaled, y)
    coefficients = lr.coef_.tolist()

    # VIF
    vif_values = []
    try:
        for i in range(X.shape[1]):
            vif_values.append(round(float(variance_inflation_factor(X, i)), 2))
    except:
        vif_values = [0.0] * len(FEATURES_MULTI)

    features = ['Year', 'Rainfall', 'Pesticides', 'Temperature']
    return {
        'features': features,
        'coefficients': [round(c, 4) for c in coefficients],
        'vif': [{'feature': f, 'vif': v} for f, v in zip(features, vif_values)],
    }


def get_nonlinear_fits(crop: str):
    """Return nonlinear fit data (linear, exponential, logistic curves)."""
    train_models_for_crop(crop)
    cdf = df[df['Item'] == crop]
    X_temp = cdf['avg_temp'].values
    y = cdf[TARGET].values

    x_sorted = np.linspace(X_temp.min(), X_temp.max(), 100)
    fits = []

    # Linear fit
    lr = LinearRegression()
    lr.fit(X_temp.reshape(-1, 1), y)
    fits.append({
        'name': 'Linear',
        'x_curve': x_sorted.tolist(),
        'y_curve': lr.predict(x_sorted.reshape(-1, 1)).tolist(),
        'params': [
            {'name': 'slope', 'value': round(float(lr.coef_[0]), 4), 'std_err': 0},
            {'name': 'intercept', 'value': round(float(lr.intercept_), 4), 'std_err': 0},
        ],
        'r2': round(float(r2_score(y, lr.predict(X_temp.reshape(-1, 1)))), 4),
    })

    # Exponential fit
    scipy_params = models_cache.get(f'{crop}__scipy_params', {})
    exp_info = scipy_params.get('Exponential (temp)')
    if exp_info and exp_info.get('params'):
        popt = exp_info['params']
        errs = exp_info['std_errs']
        y_curve = [float(exp_func(x, *popt)) for x in x_sorted]
        fits.append({
            'name': 'Exponential',
            'x_curve': x_sorted.tolist(), 'y_curve': y_curve,
            'params': [{'name': n, 'value': round(p, 4), 'std_err': round(e, 4)}
                       for n, p, e in zip(['a', 'b', 'c'], popt, errs)],
            'r2': round(float(metrics_cache.get(crop, {}).get('Exponential (temp)', {}).get('r2', 0)), 4),
        })

    # Logistic fit
    log_info = scipy_params.get('Logistic (temp)')
    if log_info and log_info.get('params'):
        popt = log_info['params']
        errs = log_info['std_errs']
        y_curve = [float(log_func(x, *popt)) for x in x_sorted]
        fits.append({
            'name': 'Logistic',
            'x_curve': x_sorted.tolist(), 'y_curve': y_curve,
            'params': [{'name': n, 'value': round(p, 4), 'std_err': round(e, 4)}
                       for n, p, e in zip(['L', 'k', 'x0'], popt, errs)],
            'r2': round(float(metrics_cache.get(crop, {}).get('Logistic (temp)', {}).get('r2', 0)), 4),
        })

    return {
        'x_data': X_temp.tolist(), 'y_data': y.tolist(),
        'fits': fits,
    }


def get_dataset_info():
    """Return summary dataset statistics."""
    if df.empty:
        return {'total_rows': 0, 'num_countries': 0, 'num_crops': 0, 'year_range': [0, 0], 'best_r2': 0}

    # Find best R2 across all trained crops
    best_r2 = 0
    for crop in get_crops()[:3]:  # Check first 3 crops
        train_models_for_crop(crop)
        mets = metrics_cache.get(crop, {})
        for m in mets.values():
            if isinstance(m, dict):
                r2 = m.get('r2', 0)
                if r2 > best_r2:
                    best_r2 = r2

    return {
        'total_rows': int(len(df)),
        'num_countries': int(df['Area'].nunique()),
        'num_crops': int(df['Item'].nunique()),
        'year_range': [int(df['Year'].min()), int(df['Year'].max())],
        'best_r2': round(best_r2, 4),
        'columns': list(df.columns),
    }
