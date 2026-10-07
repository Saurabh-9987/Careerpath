import os
import json
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ANALYSIS_DIR = os.path.join(BASE_DIR, "src", "data", "analysis")
MODELS_DIR = os.path.join(ANALYSIS_DIR, "models")

def build_model_registry_and_summary():
    print("=" * 70)
    print("BUILDING MODEL REGISTRY AND ML TRAINING SUMMARY")
    print("=" * 70)

    # 1. Load results from all pipeline runs
    with open(os.path.join(ANALYSIS_DIR, "jdsModelResults.json"), "r", encoding="utf-8") as f:
        jds_res = json.load(f)

    with open(os.path.join(ANALYSIS_DIR, "sdsModelResults.json"), "r", encoding="utf-8") as f:
        sds_res = json.load(f)

    with open(os.path.join(ANALYSIS_DIR, "marketModelResults.json"), "r", encoding="utf-8") as f:
        mkt_res = json.load(f)

    with open(os.path.join(ANALYSIS_DIR, "marketClusterResults.json"), "r", encoding="utf-8") as f:
        mkt_clu = json.load(f)

    # 2. Build model registry
    models_list = [
        {
            "name": "jds_skill_outcome_model",
            "dataset": jds_res["dataset"],
            "task": jds_res["task"],
            "algorithm": jds_res["selected_model"],
            "target": jds_res["target"],
            "training_rows": jds_res["training_rows"],
            "cv_metrics": jds_res["best_metrics"],
            "selected": True,
            "artifact": "models/jds_model.joblib",
            "artifact_size_bytes": os.path.getsize(os.path.join(MODELS_DIR, "jds_model.joblib")),
            "description": "Predicts junior high vs standard salary hike from technical skill mastery."
        },
        {
            "name": "sds_personality_outcome_model",
            "dataset": sds_res["dataset"],
            "task": sds_res["task"],
            "algorithm": sds_res["selected_model"],
            "target": sds_res["target"],
            "training_rows": sds_res["training_rows"],
            "cv_metrics": sds_res["best_metrics"],
            "selected": True,
            "artifact": "models/sds_model.joblib",
            "artifact_size_bytes": os.path.getsize(os.path.join(MODELS_DIR, "sds_model.joblib")),
            "description": "Predicts senior leadership success from Big Five personality traits."
        },
        {
            "name": "ds_salary_regressor",
            "dataset": mkt_res["dataset_ds"],
            "task": mkt_res["tasks"]["ds_salary_regression"]["task"],
            "algorithm": mkt_res["tasks"]["ds_salary_regression"]["selected_model"],
            "target": mkt_res["tasks"]["ds_salary_regression"]["target"],
            "training_rows": mkt_res["tasks"]["ds_salary_regression"]["training_rows"],
            "cv_metrics": mkt_res["tasks"]["ds_salary_regression"]["best_metrics"],
            "selected": True,
            "artifact": "models/ds_salary_regressor.joblib",
            "artifact_size_bytes": os.path.getsize(os.path.join(MODELS_DIR, "ds_salary_regressor.joblib")),
            "description": "Predicts average role salary in LPA based on experience, volume, and job title."
        },
        {
            "name": "analytics_salary_tier_classifier",
            "dataset": mkt_res["dataset_aj"],
            "task": mkt_res["tasks"]["aj_salary_tier_classification"]["task"],
            "algorithm": mkt_res["tasks"]["aj_salary_tier_classification"]["selected_model"],
            "target": mkt_res["tasks"]["aj_salary_tier_classification"]["target"],
            "training_rows": mkt_res["tasks"]["aj_salary_tier_classification"]["training_rows"],
            "cv_metrics": mkt_res["tasks"]["aj_salary_tier_classification"]["best_metrics"],
            "selected": True,
            "artifact": "models/analytics_salary_classifier.joblib",
            "artifact_size_bytes": os.path.getsize(os.path.join(MODELS_DIR, "analytics_salary_classifier.joblib")),
            "description": "Classifies salary bracket from TF-IDF key skill combinations."
        },
        {
            "name": "market_skill_cluster_model",
            "dataset": mkt_clu["dataset"],
            "task": mkt_clu["task"],
            "algorithm": mkt_clu["algorithm"],
            "target": None,
            "training_rows": mkt_clu["total_postings_clustered"],
            "cv_metrics": {
                "selected_k": mkt_clu["selected_k"],
                "silhouette_score": mkt_clu["silhouette_score"]
            },
            "selected": True,
            "artifact": "models/market_cluster_model.joblib",
            "artifact_size_bytes": os.path.getsize(os.path.join(MODELS_DIR, "market_cluster_model.joblib")),
            "description": "Unsupervised KMeans clustering of job postings into 6 skill archetypes."
        }
    ]

    registry = {
        "version": "1.0.0",
        "created_at": "2026-10-08T02:00:00Z",
        "models": models_list
    }

    registry_path = os.path.join(ANALYSIS_DIR, "modelRegistry.json")
    with open(registry_path, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)
    print(f"Saved model registry to: {registry_path}")

    # 3. Build overall ML training summary
    summary = {
        "timestamp": "2026-10-08T02:00:00Z",
        "summary": "Complete end-to-end ML pipeline executed successfully across all four hackathon datasets.",
        "datasets_used": [
            "DataScience Jobs.csv",
            "Analytics Jobs.csv",
            "JDS Skill Traits.xlsx",
            "SDS Personality Traits.xlsx"
        ],
        "models_trained_count": len(models_list),
        "primary_findings": {
            "jds_skill_model": {
                "model": jds_res["selected_model"],
                "cv_accuracy": jds_res["best_metrics"]["cv_accuracy"],
                "cv_roc_auc": jds_res["best_metrics"]["cv_roc_auc"],
                "top_skill_driver": jds_res["interpretability"]["primary_drivers"][0]
            },
            "sds_personality_model": {
                "model": sds_res["selected_model"],
                "cv_accuracy": sds_res["best_metrics"]["cv_accuracy"],
                "cv_roc_auc": sds_res["best_metrics"]["cv_roc_auc"],
                "top_personality_driver": sds_res["interpretability"]["primary_drivers"][0]
            },
            "market_salary_regression": {
                "model": mkt_res["tasks"]["ds_salary_regression"]["selected_model"],
                "cv_r2": mkt_res["tasks"]["ds_salary_regression"]["best_metrics"]["cv_r2"],
                "cv_mae_lpa": mkt_res["tasks"]["ds_salary_regression"]["best_metrics"]["cv_mae_lpa"]
            },
            "market_skill_clustering": {
                "clusters_count": mkt_clu["selected_k"],
                "silhouette_score": mkt_clu["silhouette_score"]
            }
        }
    }

    summary_path = os.path.join(ANALYSIS_DIR, "mlTrainingSummary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"Saved ML training summary to: {summary_path}")

    return registry, summary

if __name__ == "__main__":
    build_model_registry_and_summary()
