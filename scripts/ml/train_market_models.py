import os
import json
import re
import joblib
import pandas as pd
import numpy as np

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import Ridge, LogisticRegression, SGDClassifier
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.naive_bayes import MultinomialNB
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, r2_score, mean_absolute_error, mean_squared_error
from sklearn.model_selection import KFold, StratifiedKFold, cross_validate

DATA_DIR = r"C:\Users\asus\Downloads\SAS Data Problem Statement and Instructions Hackathon (1)\SAS Data Problem Statement and Instructions Hackathon"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ANALYSIS_DIR = os.path.join(BASE_DIR, "src", "data", "analysis")
MODELS_DIR = os.path.join(ANALYSIS_DIR, "models")

RANDOM_STATE = 42

def parse_salary_lpa(val):
    if pd.isnull(val):
        return np.nan
    s = str(val).strip().upper()
    s = s.replace("L", "").replace("LPA", "").replace("₹", "").strip()
    try:
        return float(s)
    except Exception:
        return np.nan

def parse_exp_num(val):
    if pd.isnull(val):
        return 0.0
    s = str(val).lower()
    m = re.findall(r"(\d+)", s)
    if len(m) >= 2:
        return (float(m[0]) + float(m[1])) / 2.0
    elif len(m) == 1:
        return float(m[0])
    return 0.0

def train_market_models_pipeline(data_dir=DATA_DIR, save_artifacts=True):
    print("=" * 70)
    print("TRAINING JOB MARKET MODELS PIPELINE")
    print("=" * 70)

    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(ANALYSIS_DIR, exist_ok=True)

    # ---------------------------------------------------------
    # PART 1: DATASCIENCE JOBS - SALARY REGRESSION ML
    # ---------------------------------------------------------
    print("\n--- PART 1: DataScience Jobs Salary Regression ---")
    ds_path = os.path.join(data_dir, "DataScience Jobs.csv")
    df_ds = pd.read_csv(ds_path, low_memory=False)

    df_ds["avg_salary_lpa"] = df_ds["avg_salary"].apply(parse_salary_lpa)
    df_ds_clean = df_ds.dropna(subset=["avg_salary_lpa"]).copy()

    # Preprocessing
    num_features = ["min_experience", "num_of_jobs"]
    cat_features = ["job_title"]

    preprocessor_ds = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features)
        ]
    )

    X_ds = df_ds_clean[num_features + cat_features]
    y_ds = df_ds_clean["avg_salary_lpa"]

    reg_models = {
        "RidgeRegression": Pipeline([
            ("pre", preprocessor_ds),
            ("reg", Ridge(alpha=1.0, random_state=RANDOM_STATE))
        ]),
        "RandomForestRegressor": Pipeline([
            ("pre", preprocessor_ds),
            ("reg", RandomForestRegressor(n_estimators=100, max_depth=6, random_state=RANDOM_STATE))
        ]),
        "GradientBoostingRegressor": Pipeline([
            ("pre", preprocessor_ds),
            ("reg", GradientBoostingRegressor(n_estimators=100, max_depth=3, random_state=RANDOM_STATE))
        ])
    }

    kf_ds = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    ds_comparison = []
    trained_regressors = {}

    for name, pipe in reg_models.items():
        scoring = {
            "r2": "r2",
            "neg_mae": "neg_mean_absolute_error",
            "neg_rmse": "neg_root_mean_squared_error"
        }
        scores = cross_validate(pipe, X_ds, y_ds, cv=kf_ds, scoring=scoring)
        mean_r2 = float(np.mean(scores["test_r2"]))
        std_r2 = float(np.std(scores["test_r2"]))
        mean_mae = float(-np.mean(scores["test_neg_mae"]))
        mean_rmse = float(-np.mean(scores["test_neg_rmse"]))

        record = {
            "model": name,
            "cv_r2": round(mean_r2, 4),
            "cv_r2_std": round(std_r2, 4),
            "cv_mae_lpa": round(mean_mae, 4),
            "cv_rmse_lpa": round(mean_rmse, 4)
        }
        ds_comparison.append(record)
        print(f"  {name:25s} | R²: {mean_r2:.4f} (+/- {std_r2:.4f}) | MAE: {mean_mae:.2f} LPA | RMSE: {mean_rmse:.2f} LPA")

        pipe.fit(X_ds, y_ds)
        trained_regressors[name] = pipe

    best_reg_record = max(ds_comparison, key=lambda r: r["cv_r2"])
    best_reg_name = best_reg_record["model"]
    selected_regressor = trained_regressors[best_reg_name]

    for r in ds_comparison:
        r["selected"] = (r["model"] == best_reg_name)

    # ---------------------------------------------------------
    # PART 2: ANALYTICS JOBS - SALARY TIER CLASSIFICATION
    # ---------------------------------------------------------
    print("\n--- PART 2: Analytics Jobs Salary Tier Classification ---")
    aj_path = os.path.join(data_dir, "Analytics Jobs.csv")
    df_aj = pd.read_csv(aj_path, low_memory=False)

    df_aj_clean = df_aj.dropna(subset=["salary"]).copy()
    df_aj_clean["skills_text"] = df_aj_clean["key_skills"].fillna("").astype(str)

    tfidf_clf = TfidfVectorizer(max_features=800, stop_words="english", ngram_range=(1, 2))
    X_skills = tfidf_clf.fit_transform(df_aj_clean["skills_text"])
    y_aj = df_aj_clean["salary"].astype(str)

    clf_models = {
        "MultinomialNB": MultinomialNB(alpha=0.5),
        "SGDClassifier (Log Loss)": SGDClassifier(loss="log_loss", penalty="l2", max_iter=500, random_state=RANDOM_STATE),
        "LogisticRegression": LogisticRegression(max_iter=300, random_state=RANDOM_STATE, C=1.0)
    }

    skf_aj = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    aj_comparison = []
    trained_classifiers = {}

    for name, clf in clf_models.items():
        scoring = {
            "accuracy": "accuracy",
            "f1_weighted": "f1_weighted",
            "f1_macro": "f1_macro"
        }
        scores = cross_validate(clf, X_skills, y_aj, cv=skf_aj, scoring=scoring)
        mean_acc = float(np.mean(scores["test_accuracy"]))
        std_acc = float(np.std(scores["test_accuracy"]))
        mean_f1_w = float(np.mean(scores["test_f1_weighted"]))
        mean_f1_m = float(np.mean(scores["test_f1_macro"]))

        record = {
            "model": name,
            "cv_accuracy": round(mean_acc, 4),
            "cv_accuracy_std": round(std_acc, 4),
            "cv_f1_weighted": round(mean_f1_w, 4),
            "cv_f1_macro": round(mean_f1_m, 4)
        }
        aj_comparison.append(record)
        print(f"  {name:25s} | Acc: {mean_acc:.4f} (+/- {std_acc:.4f}) | F1 Weighted: {mean_f1_w:.4f} | F1 Macro: {mean_f1_m:.4f}")

        clf.fit(X_skills, y_aj)
        trained_classifiers[name] = clf

    best_clf_record = max(aj_comparison, key=lambda r: (r["cv_f1_weighted"], r["cv_accuracy"]))
    best_clf_name = best_clf_record["model"]
    selected_classifier = trained_classifiers[best_clf_name]

    for r in aj_comparison:
        r["selected"] = (r["model"] == best_clf_name)

    # ---------------------------------------------------------
    # PART 3: UNSUPERVISED MARKET SKILL CLUSTERING (KMEANS)
    # ---------------------------------------------------------
    print("\n--- PART 3: Unsupervised Market Skill Clustering ---")
    # Sample 4,000 postings for silhouette score computation (for speed and numerical stability)
    sample_indices = np.random.RandomState(RANDOM_STATE).choice(X_skills.shape[0], size=min(4000, X_skills.shape[0]), replace=False)
    X_sample = X_skills[sample_indices]

    cluster_candidates = [3, 4, 5, 6]
    cluster_eval = []

    for k in cluster_candidates:
        km = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=5)
        labels = km.fit_predict(X_skills)
        sample_labels = labels[sample_indices]
        sil = float(silhouette_score(X_sample, sample_labels))
        inertia = float(km.inertia_)
        cluster_eval.append({
            "k": k,
            "inertia": round(inertia, 2),
            "silhouette_score": round(sil, 4)
        })
        print(f"  k={k} | Silhouette: {sil:.4f} | Inertia: {inertia:.1f}")

    # Optimal k selection
    best_k_eval = max(cluster_eval, key=lambda x: x["silhouette_score"])
    chosen_k = best_k_eval["k"]
    print(f"\nChosen k for Skill Archetypes: {chosen_k} (Silhouette = {best_k_eval['silhouette_score']})")

    final_kmeans = KMeans(n_clusters=chosen_k, random_state=RANDOM_STATE, n_init=10)
    final_labels = final_kmeans.fit_predict(X_skills)

    # Cluster feature profile
    feature_names = tfidf_clf.get_feature_names_out()
    cluster_profiles = []

    for c in range(chosen_k):
        c_mask = (final_labels == c)
        c_size = int(np.sum(c_mask))
        c_pct = round(c_size / len(final_labels) * 100, 2)

        # Top terms by centroid weight
        centroid = final_kmeans.cluster_centers_[c]
        top_indices = centroid.argsort()[::-1][:10]
        top_terms = [feature_names[i] for i in top_indices]

        # Representative designations
        sample_desigs = df_aj_clean.loc[c_mask, "job_desig"].value_counts().head(5).to_dict()

        # Dominant salary bracket in cluster
        top_salary_tier = df_aj_clean.loc[c_mask, "salary"].value_counts().index[0]

        cluster_profiles.append({
            "cluster_id": c,
            "size": c_size,
            "percentage": c_pct,
            "top_skills_and_terms": top_terms,
            "representative_titles": sample_desigs,
            "dominant_salary_tier": top_salary_tier
        })

    # ---------------------------------------------------------
    # PART 4: ASSEMBLE OUTPUT JSONS & JOBLIB ARTIFACTS
    # ---------------------------------------------------------
    market_model_results = {
        "dataset_ds": "DataScience Jobs.csv",
        "dataset_aj": "Analytics Jobs.csv",
        "tasks": {
            "ds_salary_regression": {
                "task": "Supervised Salary Regression (DataScience Jobs)",
                "target": "avg_salary_lpa",
                "training_rows": len(X_ds),
                "features": num_features + cat_features,
                "cv_method": "5-Fold Cross-Validation (seed=42)",
                "selected_model": best_reg_name,
                "model_comparison": ds_comparison,
                "best_metrics": best_reg_record
            },
            "aj_salary_tier_classification": {
                "task": "Supervised Salary Tier Classification (Analytics Jobs)",
                "target": "salary",
                "training_rows": len(df_aj_clean),
                "text_features": "key_skills (TF-IDF 800 terms, ngram 1-2)",
                "cv_method": "Stratified 5-Fold Cross-Validation (seed=42)",
                "selected_model": best_clf_name,
                "model_comparison": aj_comparison,
                "best_metrics": best_clf_record
            }
        }
    }

    market_cluster_results = {
        "dataset": "Analytics Jobs.csv",
        "task": "Unsupervised Market Skill Clustering",
        "algorithm": "KMeans on TF-IDF Key Skills Vector Space",
        "total_postings_clustered": len(df_aj_clean),
        "cluster_evaluations": cluster_eval,
        "selected_k": chosen_k,
        "silhouette_score": best_k_eval["silhouette_score"],
        "clusters": cluster_profiles
    }

    if save_artifacts:
        # Save joblibs
        joblib.dump(selected_regressor, os.path.join(MODELS_DIR, "ds_salary_regressor.joblib"))
        joblib.dump(selected_classifier, os.path.join(MODELS_DIR, "analytics_salary_classifier.joblib"))
        joblib.dump(tfidf_clf, os.path.join(MODELS_DIR, "tfidf_vectorizer.joblib"))
        joblib.dump(final_kmeans, os.path.join(MODELS_DIR, "market_cluster_model.joblib"))
        print("\nSaved all joblib model artifacts in:", MODELS_DIR)

        # Save JSONs
        with open(os.path.join(ANALYSIS_DIR, "marketModelResults.json"), "w", encoding="utf-8") as f:
            json.dump(market_model_results, f, indent=2)
        with open(os.path.join(ANALYSIS_DIR, "marketClusterResults.json"), "w", encoding="utf-8") as f:
            json.dump(market_cluster_results, f, indent=2)
        print("Saved marketModelResults.json and marketClusterResults.json in:", ANALYSIS_DIR)

    return market_model_results, market_cluster_results

if __name__ == "__main__":
    train_market_models_pipeline()
