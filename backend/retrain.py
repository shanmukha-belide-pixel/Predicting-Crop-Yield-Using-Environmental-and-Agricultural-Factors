"""
Retraining and evaluation script for Predicting Crop Yield models.
Trains all 12 regression models for specified or all crops,
evaluates on Random 80/20, 5-fold CV, and Time-based splits,
and outputs a performance summary table.

Usage:
    python retrain.py
    python retrain.py --crop Maize
"""

import sys
import os
import argparse
import time

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import ml_models

def retrain_crop(crop: str):
    print(f"\n=======================================================")
    print(f" Retraining 12 Regression Models for: {crop}")
    print(f"=======================================================")
    
    t0 = time.time()
    # Force retrain by clearing cache for this crop
    if crop in ml_models.models_cache:
        del ml_models.models_cache[crop]
    if crop in ml_models.metrics_cache:
        del ml_models.metrics_cache[crop]
        
    ml_models.train_models_for_crop(crop)
    elapsed = time.time() - t0
    
    metrics = ml_models.get_model_comparison(crop)
    
    header = f"{'Model Name':<28} | {'R2 (Rand)':<9} | {'RMSE':<8} | {'MAE':<8} | {'CV R2 (5-Fold)':<14} | {'R2 (Time)':<9}"
    print(header)
    print("-" * len(header))
    
    for m in metrics:
        cv_str = f"{m.get('cv_r2_mean', 0):.3f}+/-{m.get('cv_r2_std', 0):.2f}"
        print(
            f"{m.get('name', ''):<28} | "
            f"{m.get('r2', 0):>9.4f} | "
            f"{m.get('rmse', 0):>8.4f} | "
            f"{m.get('mae', 0):>8.4f} | "
            f"{cv_str:>14} | "
            f"{m.get('r2_time', 0):>9.4f}"
        )
        
    print("-" * len(header))
    print(f"Completed in {elapsed:.2f} seconds.")

def main():
    parser = argparse.ArgumentParser(description="Retrain Crop Yield Prediction Models")
    parser.add_argument("--crop", type=str, help="Specific crop to retrain (e.g. Wheat, Maize)")
    parser.add_argument("--all", action="store_true", help="Retrain models for all crops")
    args = parser.parse_args()

    ml_models.load_data()
    all_crops = ml_models.get_crops()
    
    if not all_crops:
        print("Error: No data loaded or no crops found.")
        sys.exit(1)
        
    print(f"Dataset loaded: {len(ml_models.df)} rows, {len(all_crops)} crops available: {', '.join(all_crops)}")
    
    if args.crop:
        if args.crop not in all_crops:
            print(f"Error: Crop '{args.crop}' not found in dataset. Choose from: {all_crops}")
            sys.exit(1)
        retrain_crop(args.crop)
    elif args.all:
        for c in all_crops:
            retrain_crop(c)
    else:
        # Default: retrain first 3 representative crops
        for c in all_crops[:3]:
            retrain_crop(c)
            
    print("\n[SUCCESS] Model retraining finished successfully.")

if __name__ == "__main__":
    main()
