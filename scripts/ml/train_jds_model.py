import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import confusion_matrix, roc_auc_score, f1_score, accuracy_score

DATA_DIR = r"C:\Users\asus\Downloads\SAS Data Problem Statement and Instructions Hackathon (1)\SAS Data Problem Statement and Instructions Hackathon"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ANALYSIS_DIR = os.path.join(BASE_DIR, "src", "data", "analysis")
MODELS_DIR = os.path.join(ANALYSIS_DIR, "models")

RANDOM_STATE = 42

def train_jds_pipeline(data_dir=DATA_DIR, save_artifacts=True):
    print("=" * 70)
    print("TRAINING JDS SKILL OUTCOME ML PIPELINE")
    print("=" * 70)

    jds_file = os.path.join(data_dir, "JDS Skill Traits.xlsx")
    df = pd.read_excel(jds_file)

    # 1. Cleaning & Conflict Resolution
    # Candidate 3291 has contradictory targets -> exclude
    # Candidate 2223 has identical duplicate rows -> deduplicate
    clean_df = df[df["id"] != 3291].drop_duplicates(subset=["id"]).copy()

    feature_cols = [
        "big_data_skills",
        "maths-stats_skills",
        "coding_skills",
        "ai_and_ml_skills",
        "dashboard_and_storytelling_skills"
    ]
    target_col = "salary_hike_high_or_low"

    X = clean_df[feature_cols].copy()
    y = clean_df[target_col].copy()

    print(f"Dataset: JDS Skill Traits.xlsx")
    print(f"Original rows: {len(df)} -> Clean training rows: {len(X)}")
    print(f"Class distribution: 0={int((y==0).sum())}, 1={int((y==1).sum())}")
    print(f"Features: {feature_cols}")
    print(f"Target: {target_col}")

    # 2. Candidate Models
    models = {
        "LogisticRegression": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(random_state=RANDOM_STATE, C=1.0, solver="lbfgs"))
        ]),
        "RandomForest": Pipeline([
            ("clf", RandomForestClassifier(n_estimators=100, max_depth=4, random_state=RANDOM_STATE))
        ]),
        "HistGradientBoosting": Pipeline([
            ("clf", HistGradientBoostingClassifier(max_iter=50, random_state=RANDOM_STATE))
        ])
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    scoring = {
        "accuracy": "accuracy",
        "precision": "precision",
        "recall": "recall",
        "f1": "f1",
        "roc_auc": "roc_auc"
    }

    comparison = []
    trained_pipelines = {}

    for name, pipe in models.items():
        scores = cross_validate(pipe, X, y, cv=cv, scoring=scoring, return_train_score=False)
        mean_acc = float(np.mean(scores["test_accuracy"]))
        std_acc = float(np.std(scores["test_accuracy"]))
        mean_f1 = float(np.mean(scores["test_f1"]))
        std_f1 = float(np.std(scores["test_f1"]))
        mean_auc = float(np.mean(scores["test_roc_auc"]))
        std_auc = float(np.std(scores["test_roc_auc"]))
        mean_prec = float(np.mean(scores["test_precision"]))
        mean_rec = float(np.mean(scores["test_recall"]))

        record = {
            "model": name,
            "cv_accuracy": round(mean_acc, 4),
            "cv_accuracy_std": round(std_acc, 4),
            "cv_f1": round(mean_f1, 4),
            "cv_f1_std": round(std_f1, 4),
            "cv_roc_auc": round(mean_auc, 4),
            "cv_roc_auc_std": round(std_auc, 4),
            "cv_precision": round(mean_prec, 4),
            "cv_recall": round(mean_rec, 4)
        }
        comparison.append(record)
        print(f"  {name:22s} | Acc: {mean_acc:.4f} (+/- {std_acc:.4f}) | F1: {mean_f1:.4f} | ROC-AUC: {mean_auc:.4f}")

        # Fit on full clean dataset
        pipe.fit(X, y)
        trained_pipelines[name] = pipe

    # Select best model based on ROC-AUC then F1
    best_record = max(comparison, key=lambda r: (r["cv_roc_auc"], r["cv_f1"]))
    best_model_name = best_record["model"]
    selected_pipeline = trained_pipelines[best_model_name]

    for r in comparison:
        r["selected"] = (r["model"] == best_model_name)

    print(f"\nSelected Model: {best_model_name} (ROC-AUC={best_record['cv_roc_auc']}, F1={best_record['cv_f1']})")

    # 3. Interpretability & Feature Importance
    lr_pipe = trained_pipelines["LogisticRegression"]
    lr_coefs = lr_pipe.named_steps["clf"].coef_[0]
    lr_importance = {col: round(float(c), 4) for col, c in zip(feature_cols, lr_coefs)}

    rf_pipe = trained_pipelines["RandomForest"]
    rf_importances = rf_pipe.named_steps["clf"].feature_importances_
    rf_importance = {col: round(float(imp), 4) for col, imp in zip(feature_cols, rf_importances)}

    # Confusion matrix on full dataset
    y_pred = selected_pipeline.predict(X)
    cm = confusion_matrix(y, y_pred).tolist()

    # 4. Construct Output Payload
    output = {
        "dataset": "JDS Skill Traits.xlsx",
        "task": "Supervised Binary Classification (Junior Technical Skill Outcome)",
        "target": target_col,
        "classes": [0, 1],
        "class_labels": {
            "0": "Low / Standard Salary Hike",
            "1": "High Salary Hike"
        },
        "training_rows": len(X),
        "excluded_conflicts": 2,
        "features": feature_cols,
        "cv_method": "Stratified 5-Fold Cross-Validation (seed=42)",
        "selected_model": best_model_name,
        "model_comparison": comparison,
        "best_metrics": best_record,
        "confusion_matrix_full": cm,
        "interpretability": {
            "logistic_regression_coefficients": lr_importance,
            "random_forest_feature_importance": rf_importance,
            "primary_drivers": sorted(lr_importance.items(), key=lambda x: abs(x[1]), reverse=True)
        },
        "pipeline_metadata": {
            "scaler": "StandardScaler" if "scaler" in selected_pipeline.named_steps else None,
            "classifier": best_model_name,
            "random_state": RANDOM_STATE
        }
    }

    if save_artifacts:
        os.makedirs(MODELS_DIR, exist_ok=True)
        os.makedirs(ANALYSIS_DIR, exist_ok=True)

        model_path = os.path.join(MODELS_DIR, "jds_model.joblib")
        joblib.dump(selected_pipeline, model_path)
        print(f"Saved model artifact: {model_path}")

        json_path = os.path.join(ANALYSIS_DIR, "jdsModelResults.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2)
        print(f"Saved analysis results: {json_path}")

    return output, selected_pipeline

if __name__ == "__main__":
    train_jds_pipeline()
