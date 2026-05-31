#!/usr/bin/env python3
"""Train a classifier to predict ARA hits from indicator features."""
import json
import os
import sys
import warnings
from collections import Counter

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

RESULTS_FILE = os.path.join(os.path.dirname(__file__), "backtest_results.json")
MODEL_FILE = os.path.join(os.path.dirname(__file__), "ara_predictor.pkl")


def load_data():
    with open(RESULTS_FILE) as f:
        raw = json.load(f)
    df = pd.DataFrame(raw)
    df["hit_ara"] = df["hit_ara"].astype(int)
    print(f"Loaded {len(df)} observations ({df['hit_ara'].sum()} ARA hits, "
          f"{len(df) - df['hit_ara'].sum()} misses)")
    return df


def engineer_features(df):
    features = pd.DataFrame(index=df.index)
    features["hit_ara"] = df["hit_ara"]

    raw_features = [
        "price_change_1d", "price_change_3d", "price_change_5d",
        "volume_ratio", "rsi", "bb_position", "macd_bullish",
        "consecutive_up_days", "atr_pct_14", "ara_remaining_pct",
        "price", "momentum_score", "volume_score", "technical_score",
        "proximity_score", "consistency_score", "score",
    ]
    for c in raw_features:
        if c in df.columns:
            features[c] = pd.to_numeric(df[c], errors="coerce")

    features["acceleration"] = (
        features["price_change_1d"] / (features["price_change_5d"].abs() / 5 + 0.01)
    )
    features["vol_x_mom"] = features["volume_ratio"] * features["price_change_1d"]
    features["rsi_sq"] = features["rsi"] ** 2
    features["bb_x_rsi"] = features["bb_position"] * features["rsi"]
    features["up_ratio"] = features["consecutive_up_days"] / 5.0
    features["room_pct"] = features["ara_remaining_pct"] / 25.0
    features["price_tier"] = pd.cut(
        features["price"], bins=[0, 50, 100, 200, 500, 1e6],
        labels=[0, 1, 2, 3, 4]
    ).astype(float)
    features["log_price"] = np.log1p(features["price"])

    return features


def analyze_correlations(features):
    print("\n=== Feature Correlation with ARA Hit ===")
    corr = features.select_dtypes(include=[np.number]).corr()["hit_ara"].drop("hit_ara")
    corr = corr.sort_values(key=abs, ascending=False)
    for name, val in corr.items():
        bar = "█" * int(abs(val) * 40)
        print(f"  {name:>20s}: {val:+.4f} {bar}")
    return corr


def analyze_brackets(features):
    print("\n=== Bracket Analysis (single features) ===")

    brackets = {
        "price_change_1d": [(0, 1), (1, 3), (3, 7), (7, 15), (15, 100)],
        "volume_ratio": [(0, 1), (1, 2), (2, 4), (4, 10), (10, 1000)],
        "rsi": [(0, 40), (40, 50), (50, 60), (60, 70), (70, 80), (80, 100)],
        "consecutive_up_days": [0, 1, 2, 3, 4, 5],
        "ara_remaining_pct": [(0, 2), (2, 5), (5, 10), (10, 15), (15, 25)],
        "price": [(0, 50), (50, 100), (100, 200), (200, 500), (500, 5000)],
        "bb_position": [(0, 0.2), (0.2, 0.4), (0.4, 0.6), (0.6, 0.8), (0.8, 1.0), (1.0, 2)],
    }

    for feat, bins in brackets.items():
        if feat not in features.columns:
            continue
        print(f"\n  {feat}:")
        if isinstance(bins[0], (int, float)):
            for b in bins:
                subset = features[features[feat] == b]
                if len(subset) > 0:
                    hits = subset["hit_ara"].sum()
                    print(f"    ={b:>4}: {hits:>3}/{len(subset):>4} = {hits/len(subset)*100:5.1f}%")
        else:
            for lo, hi in bins:
                subset = features[(features[feat] >= lo) & (features[feat] < hi)]
                if len(subset) > 0:
                    hits = subset["hit_ara"].sum()
                    print(f"    [{lo:>4}-{hi:>4}): {hits:>3}/{len(subset):>4} = {hits/len(subset)*100:5.1f}%")


def train_model(features):
    print("\n=== Training Classifier ===")
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import cross_val_score, StratifiedKFold

    exclude = {"hit_ara"}
    feature_cols = [c for c in features.columns if c not in exclude and c != "price_tier" and not features[c].isna().all()]
    X = features[feature_cols].fillna(0)
    y = features["hit_ara"]

    model = RandomForestClassifier(
        n_estimators=300, max_depth=5, min_samples_leaf=10,
        class_weight="balanced", random_state=42, n_jobs=-1,
    )

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(model, X, y, cv=cv, scoring="precision")
    print(f"  5-fold CV Precision: {scores.mean():.3f} ± {scores.std():.3f}")
    scores_rec = cross_val_score(model, X, y, cv=cv, scoring="recall")
    print(f"  5-fold CV Recall:    {scores_rec.mean():.3f} ± {scores_rec.std():.3f}")
    scores_f1 = cross_val_score(model, X, y, cv=cv, scoring="f1")
    print(f"  5-fold CV F1:        {scores_f1.mean():.3f} ± {scores_f1.std():.3f}")

    model.fit(X, y)
    importances = sorted(
        zip(feature_cols, model.feature_importances_),
        key=lambda x: x[1], reverse=True,
    )
    print("\n  Top 15 Feature Importances:")
    for name, imp in importances[:15]:
        print(f"    {name:>20s}: {imp:.4f}")

    import joblib
    model_data = {"model": model, "feature_cols": feature_cols}
    joblib.dump(model_data, MODEL_FILE)
    print(f"\nModel saved to {MODEL_FILE}")

    return model, feature_cols


def predict_top_n(features, model, feature_cols, dates, top_n_range=(1, 3, 5, 10, 20)):
    print(f"\n=== Simulated Top-N Precision (ML model) ===")
    X = features[feature_cols].fillna(0)
    probs = model.predict_proba(X)[:, 1]
    features = features.copy()
    features["prob"] = probs
    features["date"] = dates.values

    for n in top_n_range:
        total_hits = 0
        total_picks = 0
        for _, week_df in features.groupby("date"):
            top = week_df.nlargest(n, "prob")
            total_hits += top["hit_ara"].sum()
            total_picks += len(top)
        prec = total_hits / total_picks * 100 if total_picks > 0 else 0
        print(f"  Precision@{n}: {prec:.1f}%")


def search_high_precision_subset(features):
    print(f"\n=== Searching for High-Precision Subsets ===")
    best_rules = []

    # Single feature thresholds
    checks = [
        ("price_change_1d", [(3, 100), (5, 100), (7, 100), (10, 100)]),
        ("price", [(0, 50), (0, 100), (0, 200)]),
        ("rsi", [(50, 100), (60, 100), (50, 85), (60, 80)]),
        ("volume_ratio", [(1, 100), (2, 100)]),
        ("consecutive_up_days", [(3, 5), (4, 5)]),
        ("bb_position", [(0.6, 100), (0.8, 1.0)]),
    ]

    for feat, thresholds in checks:
        if feat not in features.columns:
            continue
        for lo, hi in thresholds:
            if hi == 100:
                subset = features[features[feat] >= lo]
            else:
                subset = features[(features[feat] >= lo) & (features[feat] <= hi)]
            if len(subset) >= 10:
                hits = subset["hit_ara"].sum()
                prec = hits / len(subset) * 100
                best_rules.append((prec, len(subset), f"{feat} in [{lo}, {hi}]"))

    # Multi-feature combinations
    price_brackets = [(0, 200), (0, 100), (50, 200)]
    for p_lo, p_hi in price_brackets:
        for c1_lo, c1_hi in [(3, 100), (5, 100), (7, 25)]:
            subset = features[
                (features["price"] >= p_lo) & (features["price"] <= p_hi)
                & (features["price_change_1d"] >= c1_lo)
                & (features["price_change_1d"] <= c1_hi)
            ]
            if len(subset) >= 5:
                hits = subset["hit_ara"].sum()
                prec = hits / len(subset) * 100
                best_rules.append((prec, len(subset),
                    f"price [{p_lo},{p_hi}] + pc1d [{c1_lo},{c1_hi}]"))

    best_rules.sort(key=lambda x: x[0], reverse=True)
    print(f"{'Precision':>10} {'Count':>6}  Rule")
    print("-" * 50)
    for prec, count, rule in best_rules[:20]:
        print(f"{prec:>9.1f}% {count:>6}  {rule}")


def main():
    df = load_data()
    features = engineer_features(df)
    analyze_correlations(features)
    analyze_brackets(features)
    search_high_precision_subset(features)
    model, feature_cols = train_model(features)
    predict_top_n(features, model, feature_cols, df["date"])


def main():
    df = load_data()
    features = engineer_features(df)
    analyze_correlations(features)
    analyze_brackets(features)
    search_high_precision_subset(features)
    model, feature_cols = train_model(features)
    predict_top_n(features, model, feature_cols, df["date"])


if __name__ == "__main__":
    main()
