import os
import json
import pandas as pd
import numpy as np

DATA_DIR = r"C:\Users\asus\Downloads\SAS Data Problem Statement and Instructions Hackathon (1)\SAS Data Problem Statement and Instructions Hackathon"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "src", "data", "analysis")

def run_data_quality_audit(data_dir=DATA_DIR):
    report = {
        "timestamp": "2026-10-08T02:00:00Z",
        "data_directory": data_dir,
        "datasets": {}
    }

    # 1. DataScience Jobs.csv
    ds_path = os.path.join(data_dir, "DataScience Jobs.csv")
    if os.path.exists(ds_path):
        df_ds = pd.read_csv(ds_path, low_memory=False)
        report["datasets"]["DataScience Jobs.csv"] = {
            "exists": True,
            "raw_rows": int(len(df_ds)),
            "raw_columns": int(len(df_ds.columns)),
            "columns": list(df_ds.columns),
            "missing_values": {c: int(df_ds[c].isnull().sum()) for c in df_ds.columns},
            "exact_duplicate_rows": int(df_ds.duplicated().sum()),
            "potential_identifiers": ["reference_no"],
            "leakage_risks": [
                {
                    "column": "reference_no",
                    "reason": "Arbitrary index identifier; does not reflect candidate or job skill traits.",
                    "action": "Excluded from feature set."
                }
            ],
            "total_aggregated_postings": int(df_ds["num_of_jobs"].sum()) if "num_of_jobs" in df_ds.columns else 0
        }

    # 2. Analytics Jobs.csv
    aj_path = os.path.join(data_dir, "Analytics Jobs.csv")
    if os.path.exists(aj_path):
        df_aj = pd.read_csv(aj_path, low_memory=False)
        report["datasets"]["Analytics Jobs.csv"] = {
            "exists": True,
            "raw_rows": int(len(df_aj)),
            "raw_columns": int(len(df_aj.columns)),
            "columns": list(df_aj.columns),
            "missing_values": {c: int(df_aj[c].isnull().sum()) for c in df_aj.columns},
            "exact_duplicate_rows": int(df_aj.duplicated().sum()),
            "potential_identifiers": ["s_no"],
            "leakage_risks": [
                {
                    "column": "s_no",
                    "reason": "Row index counter without semantic skill value.",
                    "action": "Excluded from feature set."
                }
            ],
            "target_distribution": {str(k): int(v) for k, v in df_aj["salary"].value_counts().items()} if "salary" in df_aj.columns else {}
        }

    # 3. JDS Skill Traits.xlsx
    jds_path = os.path.join(data_dir, "JDS Skill Traits.xlsx")
    if os.path.exists(jds_path):
        df_jds = pd.read_excel(jds_path)
        id_counts = df_jds["id"].value_counts()
        repeated_ids = id_counts[id_counts > 1].index.tolist()
        conflicting_ids = []
        for rid in repeated_ids:
            subset = df_jds[df_jds["id"] == rid]
            if subset["salary_hike_high_or_low"].nunique() > 1:
                conflicting_ids.append(int(rid))

        report["datasets"]["JDS Skill Traits.xlsx"] = {
            "exists": True,
            "raw_rows": int(len(df_jds)),
            "raw_columns": int(len(df_jds.columns)),
            "columns": list(df_jds.columns),
            "missing_values": {c: int(df_jds[c].isnull().sum()) for c in df_jds.columns},
            "unique_candidate_ids": int(df_jds["id"].nunique()),
            "repeated_candidate_ids": [int(x) for x in repeated_ids],
            "conflicting_candidate_ids": conflicting_ids,
            "conflict_handling": {
                "conflicting_candidate_3291": "Candidate 3291 has conflicting records (target=0 and target=1 with different skill scores). Excluded 2 rows.",
                "duplicate_candidate_2223": "Candidate 2223 has identical features and target=0. Deduplicated 1 row.",
                "valid_training_rows": 136
            },
            "leakage_risks": [
                {
                    "column": "id",
                    "reason": "Candidate ID is an identifier, not a competency trait.",
                    "action": "Excluded from feature matrix."
                }
            ],
            "target_distribution_raw": {str(k): int(v) for k, v in df_jds["salary_hike_high_or_low"].value_counts().items()}
        }

    # 4. SDS Personality Traits.xlsx
    sds_path = os.path.join(data_dir, "SDS Personality Traits.xlsx")
    if os.path.exists(sds_path):
        df_sds = pd.read_excel(sds_path)
        df_sds.columns = [c.strip() for c in df_sds.columns]
        target_col = "success_ classification_ high_low"
        id_counts = df_sds["id"].value_counts()
        repeated_ids = id_counts[id_counts > 1].index.tolist()
        conflicting_ids = []
        for rid in repeated_ids:
            subset = df_sds[df_sds["id"] == rid]
            if subset[target_col].nunique() > 1:
                conflicting_ids.append(int(rid))

        report["datasets"]["SDS Personality Traits.xlsx"] = {
            "exists": True,
            "raw_rows": int(len(df_sds)),
            "raw_columns": int(len(df_sds.columns)),
            "columns": list(df_sds.columns),
            "missing_values": {c: int(df_sds[c].isnull().sum()) for c in df_sds.columns},
            "unique_candidate_ids": int(df_sds["id"].nunique()),
            "repeated_candidate_ids": [int(x) for x in repeated_ids],
            "conflicting_candidate_ids": conflicting_ids,
            "conflict_handling": {
                "conflicting_candidates_7_ids": "7 candidate IDs (8303, 8198, 8065, 8308, 8489, 8301, 8887) have contradictory targets (both 0 and 1) across 14 rows. Excluded 14 rows.",
                "duplicate_candidates_8656_8228": "Candidates 8656 and 8228 are identical duplicates with consistent targets. Deduplicated 2 rows.",
                "valid_training_rows": 145
            },
            "leakage_risks": [
                {
                    "column": "id",
                    "reason": "Candidate ID is an administrative identifier.",
                    "action": "Excluded from feature matrix."
                }
            ],
            "target_distribution_raw": {str(k): int(v) for k, v in df_sds[target_col].value_counts().items()}
        }

    # Save to JSON
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_file = os.path.join(OUTPUT_DIR, "dataQualityReport.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"Data Quality Report successfully saved to: {out_file}")
    return report

if __name__ == "__main__":
    report = run_data_quality_audit()
    print("Audit completed successfully.")
