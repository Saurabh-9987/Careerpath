# Career Mobility Intelligence — Stage 2 Data Reprocessing & Feature Engineering Summary

## 1. Executive Overview

Stage 2 transforms the audited raw data from all four official hackathon datasets into standardized, clean, reproducible, and analysis-ready representations. 

- **No existing UI components, routes, or algorithms were modified.**
- **No Node/npm dependencies were added.**
- **All four datasets remain analytically distinct** without row-by-row merging or artificial link creation.
- **Traceability is 100% preserved**: original raw features and flagged records are retained alongside engineered variables.

---

## 2. Dataset Reprocessing & Cleaning Actions

### 2.1 Analytics Jobs (`Analytics Jobs.csv`)
- **Raw Records**: 15,841 | **Processed Records**: 15,841
- **Schema Normalization**: Lowercase standardized column headers (`s_no`, `experience`, `job_description`, `job_desig`, `job_type`, `key_skills`, `location`, `salary`).
- **`job_type` Standardization**: 5 casing/spelling variants normalized to `"Analytics"`. Missing records (12,011 missing rows mapped to 'Not Specified' with job_type_missing_flag=true.) mapped to `"Not Specified"` with `job_type_missing_flag = true`. Zero rows dropped.
- **`job_description` Handling**: 3,508 missing records filled with empty string `""` with `job_description_missing_flag = true`. Zero rows dropped.
- **`key_skills` Parsing**: Delimiters split (`|` and `,`), whitespace stripped, punctuation and scraping truncation artifacts (`...`) eliminated. Distinct technologies strictly preserved (e.g., Java vs. JavaScript, SQL vs. NoSQL). Single missing row (s_no: 7810) mapped to empty array `[]` with `key_skills_missing_flag = true`.
- **Semantic Duplicates Policy**: 1,001 records share identical content across all 7 attributes. Flagged with `is_semantic_duplicate = true`. Downstream clean subset available: **14,840 unique records**.
- **Experience Parsing**: Mapped to `parsed_min_experience` (0–23 yrs), `parsed_max_experience` (0–30 yrs), and `experience_midpoint`.
- **Salary Parsing**: Mapped 6 salary brackets to numeric LPA (`salary_min_lpa`, `salary_max_lpa`, `salary_midpoint_lpa`).
- **Normalized Role**: Free-text titles mapped to canonical career taxonomy (`Business Analyst`, `Data Scientist`, `Data Analyst`, `Data Engineer`, `Machine Learning Engineer`, etc.).

---

### 2.2 DataScience Jobs (`DataScience Jobs.csv`)
- **Raw Records**: 1,602 clusters | **Total Aggregated Postings**: 93,005
- **Salary LPA Conversion**: Stripped `'L'` string suffix and converted to numeric float LPA (`avg_salary_lpa`, `min_salary_lpa`, `max_salary_lpa`).
- **Identifier Disambiguation**: Audit proved `reference_no` has 142 duplicate collisions across companies. Engineered safe natural composite primary key: `company_name + "__" + job_title + "__" + min_experience + "y"` (**100% unique across all 1,602 rows**).
- **Posting Volume Preservation**: `num_of_jobs` preserved as weight multiplier. Each row is correctly treated as a market cluster, not an individual job posting.
- **Market Share & Weighted Compensation**: Derived `role_market_share_pct` and `role_weighted_avg_salary_lpa`.

---

### 2.3 JDS Skill Traits (`JDS Skill Traits.xlsx`)
- **Raw Records**: 139 | **Unique Candidates**: 137
- **Schema Normalization**: Clean feature headers (`big_data_skills`, `maths_stats_skills`, `coding_skills`, `ai_and_ml_skills`, `dashboard_and_storytelling_skills`, `salary_hike_high_or_low`).
- **Conflict Resolution Policy (Candidate 3291)**:
  - Row 3: Class `0` (Mean score: 3.52, Dashboard: 2.3)
  - Row 29: Class `1` (Mean score: 4.82, Dashboard: 5.0)
  - Finding: Significant skill progression (+2.7 in dashboarding, +1.7 in coding, +1.5 in maths) directly accompanied by promotion to high salary hike.
  - Transparent Policy: Both records are preserved in `all_records` with `is_repeated_candidate = true` and `has_target_conflict = true`.
  - Clean Modeling View (`clean_unambiguous_records`): **136 records**, strictly excluding Candidate 3291 to eliminate label ambiguity during ML training.
  - Upskilling Progression View (`latest_attempt_records`): **137 records**, retaining Attempt 2.
- **Engineered Technical Features**:
  - `technical_capability_index`: Unweighted composite skill average (1.0–5.0).
  - `hike_weighted_readiness_score`: Correlation-weighted score (0–100 scale, r = +0.679 with salary hike).
  - Domain sub-indices: `analytical_depth_score`, `engineering_execution_score`, `communication_presentation_score`.

---

### 2.4 SDS Personality Traits (`SDS Personality Traits.xlsx`)
- **Raw Records**: 161 | **Unique Candidates**: 152
- **Schema Normalization**: Stripped leading whitespace from `' extraversion'` -> `'extraversion'`; normalized target `'success_ classification_ high_low'` -> `'success_classification'`.
- **Conflict Resolution Policy (Repeated Candidates)**:
  - 9 repeated candidate IDs detected (18 rows).
  - 2 candidates (`8228`, `8656`) have consistent labels across attempts.
  - 7 candidates (`8065`, `8198`, `8301`, `8303`, `8308`, `8489`, `8887`) have contradictory classifications (`0` vs `1`).
  - Transparent Policy: All 161 rows preserved in `all_records` with audit flags.
  - Clean Modeling View (`clean_unambiguous_records`): **145 records**, strictly excluding the 7 conflicting candidate pairs.
  - Latest Attempt View (`latest_attempt_records`): **152 records**, retaining the second assessment attempt.
- **Engineered Personality Features**:
  - Min-max normalized trait scores (0–100 scale).
  - `success_personality_index`: Correlation-weighted behavioral index (0–100 scale, **r = +0.765** with career success, driven by Conscientiousness and Openness).
  - `learning_agility_index`: Composite midpoint of Openness and Conscientiousness.
  - `collaboration_quotient`: Composite midpoint of Extraversion and Agreeableness.
  - `emotional_stability_score`: Inverted Neuroticism score (100 - Neuroticism).

---

## 3. Record Count Summary (Before vs. After)

| Dataset | Raw Count | Processed Total | Duplicate / Conflicted Rows Flagged | Clean Modeling Benchmark |
| :--- | :---: | :---: | :---: | :---: |
| **Analytics Jobs** | 15,841 | 15,841 | 1,001 semantic duplicates | 14,840 unique postings |
| **DataScience Jobs** | 1,602 | 1,602 | 142 duplicate references (resolved by composite key) | 1,602 clusters (93,005 postings) |
| **JDS Skill Traits** | 139 | 139 | 2 rows (Candidate 3291 label contradiction) | 136 unambiguous candidates |
| **SDS Personality Traits** | 161 | 161 | 14 rows (7 candidate pairs contradictory) | 145 unambiguous candidates |

---

## 4. Derived Cross-Dataset Career & Skill Features

### 4.1 Top Role Market Intelligence
| Standardized Role | Posting Volume | Market Share | Weighted Avg Salary (LPA) | Avg Experience | Top Distinctive Skills |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Business Analyst** | 32,843 | 35.31% | 8.95 | 1.7 yrs | Business Analysis, SQL, Requirement Gathering, Agile |
| **Data Analyst** | 18,095 | 19.46% | 5.71 | 0.8 yrs | Data Analysis, Excel, SQL, Data Analytics, Python |
| **Senior Business Analyst** | 14,115 | 15.18% | 13.17 | 3.3 yrs | Business Analysis, Agile, Scrum, Project Management |
| **Data Scientist** | 9,051 | 9.73% | 13.20 | 2.7 yrs | Machine Learning, Python, R, Statistics, Deep Learning |
| **Data Engineer** | 8,044 | 8.65% | 10.15 | 2.7 yrs | Hadoop, Spark, SQL, Big Data, Hive |
| **Senior Data Analyst** | 3,825 | 4.11% | 11.23 | 3.2 yrs | SQL, Tableau, Power BI, Advanced Analytics |
| **Senior Data Engineer** | 3,411 | 3.67% | 16.59 | 4.4 yrs | Spark, Scala, AWS/GCP, Kafka, Distributed Systems |
| **Senior Data Scientist** | 2,129 | 2.29% | 20.89 | 5.0 yrs | Machine Learning, Python, MLOps, System Architecture |
| **Machine Learning Engineer** | 964 | 1.04% | 10.37 | 1.9 yrs | Machine Learning, Python, NLP, PyTorch, Docker |
| **Data Architect** | 528 | 0.57% | 26.68 | 7.7 yrs | Data Architecture, Cloud Data Lakes, Governance, Big Data |

---

## 5. Artifact Verification & Reproducibility

The generated Stage 2 JSON artifacts are saved under `src/data/analysis/`:
- `analyticsJobsProcessed.json` (Summary metadata, parsed distributions, sample records)
- `dataScienceJobsProcessed.json` (Full 1,602 cluster records with composite IDs and salary stats)
- `jdsProcessed.json` (Complete audit records, clean modeling benchmark, latest-attempt view)
- `sdsProcessed.json` (Complete audit records, clean modeling benchmark, latest-attempt view)
- `careerFeatures.json` (Synthesized role intelligence profiles)
- `roleFeatures.json` (Ranked role array with compensation and hiring companies)
- `skillFeatures.json` (Top 150 skills with posting coverage, domain taxonomy, and role affinities)

To reproduce all Stage 2 artifacts at any time:
```powershell
python scripts/run_stage2_pipeline.py
```
