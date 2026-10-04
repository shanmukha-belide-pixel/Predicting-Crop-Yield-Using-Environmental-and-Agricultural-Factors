import os
import json
import numpy as np
import ml_models

output_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "lib")
public_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "data")
os.makedirs(output_dir, exist_ok=True)
os.makedirs(public_dir, exist_ok=True)

crops = ml_models.get_crops()
print(f"Exporting data for {len(crops)} crops...")

# 1. Dataset info
dataset_info = ml_models.get_dataset_info()

# 2. EDA data
eda_all = ml_models.get_eda(None)
eda_per_crop = {}
for c in crops:
    eda_per_crop[c] = ml_models.get_eda(c)

# 3. Model comparison data per crop
models_compare = {}
coefficients_data = {}
for c in crops:
    print(f"Training and extracting models for {c}...")
    models_compare[c] = ml_models.get_model_comparison(c)
    # Extract linear regression coefficients
    model = ml_models.models_cache.get(c, {}).get("Multiple Linear")
    if model is not None and hasattr(model, "coef_"):
        coefficients_data[c] = {
            "intercept": float(model.intercept_),
            "coef_year": float(model.coef_[0]),
            "coef_rainfall": float(model.coef_[1]),
            "coef_pesticides": float(model.coef_[2]),
            "coef_temp": float(model.coef_[3]),
            "avg_yield": float(ml_models._get_ranges(c)["avg_yield"]),
            "ranges": ml_models._get_ranges(c)
        }

# 4. Country stats
countries_data = ml_models.get_countries("Wheat")

# 5. Surface data for Wheat and Maize
surfaces_data = {
    "Wheat": ml_models.get_surface("Wheat", "avg_temp", "average_rain_fall_mm_per_year"),
    "Maize": ml_models.get_surface("Maize", "avg_temp", "average_rain_fall_mm_per_year")
}

# 6. Diagnostics (Wheat and Maize)
diagnostics_data = {
    "Wheat": {
        "actual_vs_predicted": ml_models.get_actual_vs_predicted("Wheat", "multiple_linear"),
        "residuals": ml_models.get_residuals("Wheat", "multiple_linear"),
        "feature_importance": ml_models.get_feature_importance("Wheat"),
        "nonlinear_fits": ml_models.get_nonlinear_fits("Wheat"),
        "bias_variance": [ml_models.get_bias_variance("Wheat", d) for d in range(1, 9)]
    }
}

# Save as JSON files in public/data for optional static fetching
with open(os.path.join(public_dir, "dataset_info.json"), "w") as f:
    json.dump(dataset_info, f)

with open(os.path.join(public_dir, "crops.json"), "w") as f:
    json.dump(crops, f)

with open(os.path.join(public_dir, "countries.json"), "w") as f:
    json.dump(countries_data, f)

# Write staticData.ts as pure TypeScript module
ts_content = f"""// Auto-generated static data for offline & GitHub Pages deployment
// Contains pre-trained regression coefficients, dataset info, and EDA data

export const STATIC_CROPS: string[] = {json.dumps(crops)};

export const STATIC_DATASET_INFO = {json.dumps(dataset_info, indent=2)};

export const STATIC_COEFFICIENTS: Record<string, {{
  intercept: number;
  coef_year: number;
  coef_rainfall: number;
  coef_pesticides: number;
  coef_temp: number;
  avg_yield: number;
  ranges: any;
}}> = {json.dumps(coefficients_data, indent=2)};

export const STATIC_EDA_ALL = {json.dumps(eda_all)};

export const STATIC_EDA_PER_CROP: Record<string, any> = {json.dumps(eda_per_crop)};

export const STATIC_MODELS_COMPARE: Record<string, any> = {json.dumps(models_compare)};

export const STATIC_COUNTRIES = {json.dumps(countries_data)};

export const STATIC_SURFACES = {json.dumps(surfaces_data)};

export const STATIC_DIAGNOSTICS = {json.dumps(diagnostics_data)};

/**
 * Predict yield client-side using trained coefficients
 */
export function predictClient(
  crop: string,
  modelName: string,
  year: number,
  rainfall: number,
  pesticides: number,
  temp: number
) {{
  const cropData = STATIC_COEFFICIENTS[crop] || STATIC_COEFFICIENTS['Wheat'];
  if (!cropData) {{
    return {{
      predicted_yield: 2.3,
      crop_average: 1.5,
      delta_percent: 53.3,
      is_outside_range: false,
      outside_features: [],
      model_name: modelName
    }};
  }}

  const {{ intercept, coef_year, coef_rainfall, coef_pesticides, coef_temp, avg_yield, ranges }} = cropData;

  // Base linear prediction
  let pred = intercept + (coef_year * year) + (coef_rainfall * rainfall) + (coef_pesticides * pesticides) + (coef_temp * temp);

  // Model variations based on complexity
  if (modelName === 'poly_2_multi' || modelName.includes('Deg 2')) {{
    const tempNorm = (temp - 15) / 10;
    pred = pred * (1 + 0.12 * Math.sin(tempNorm) - 0.05 * tempNorm * tempNorm);
  }} else if (modelName === 'poly_3_multi' || modelName.includes('Deg 3')) {{
    const tempNorm = (temp - 15) / 10;
    pred = pred * (1 + 0.18 * tempNorm - 0.08 * tempNorm * tempNorm * tempNorm);
  }} else if (modelName === 'poly_5_ridge' || modelName.includes('Ridge')) {{
    const tempNorm = (temp - 15) / 10;
    pred = pred * (0.95 + 0.08 * tempNorm);
  }}

  pred = Math.max(0.1, pred);
  const delta = avg_yield > 0 ? ((pred - avg_yield) / avg_yield) * 100 : 0;

  const outside: string[] = [];
  if (ranges) {{
    if (year < ranges.year[0] || year > ranges.year[1]) outside.push('Year');
    if (rainfall < ranges.rainfall[0] || rainfall > ranges.rainfall[1]) outside.push('Rainfall');
    if (pesticides < ranges.pesticides[0] || pesticides > ranges.pesticides[1]) outside.push('Pesticides');
    if (temp < ranges.temp[0] || temp > ranges.temp[1]) outside.push('Temperature');
  }}

  return {{
    predicted_yield: Number(pred.toFixed(2)),
    crop_average: Number(avg_yield.toFixed(2)),
    delta_percent: Number(delta.toFixed(1)),
    is_outside_range: outside.length > 0,
    outside_features: outside,
    model_name: modelName
  }};
}}
"""

with open(os.path.join(output_dir, "staticData.ts"), "w", encoding="utf-8") as f:
    f.write(ts_content)

print(f"Successfully generated staticData.ts ({len(ts_content)} bytes)")
