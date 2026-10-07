# Career Mobility Intelligence — Stage 1 Data Identification & Quality Audit

## 1. Executive Summary

This report documents the rigorous programmatic audit of the four official hackathon datasets conducted during **Stage 1 (Data Identification + Data Exploration + Data Quality Audit)**.

No UI components, routes, or existing models were modified. The analysis is 100% reproducible via `python scripts/run_data_audit.py`.

---

## 2. Dataset Identification Summary

| Dataset Name | File Format | Records (Rows) | Attributes (Cols) | ID Column | Unique IDs | Missing Values | Full Row Duplicates | Primary Analytical Purpose |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Analytics Jobs** | CSV | 15,841 | 8 | `s_no` | 15,841 | 15,520 cells (12.25%) | 0 (1,001 semantic duplicates) | Market roles, skills, salary brackets, experience, and locations |
| **DataScience Jobs** | CSV | 1,602 | 8 | `reference_no` | 1,460 | 0 cells (0.00%) | 0 (142 non-unique ref IDs) | Data-science cluster benchmarks, companies, salary, experience, and posting volumes (93,005 postings) |
| **JDS Skill Traits** | Excel (XLSX) | 139 | 7 | `id` | 137 | 0 cells (0.00%) | 0 (2 duplicate candidate IDs) | 5 technical capability dimensions vs. salary-hike outcome (binary) |
| **SDS Personality Traits** | Excel (XLSX) | 161 | 7 | `id` | 152 | 0 cells (0.00%) | 0 (9 duplicate candidate IDs) | Big Five personality traits vs. career success classification (binary) |

---

## 3. Exploratory Data Analysis Findings

### 3.1 Analytics Jobs (`Analytics Jobs.csv`)
- **Total Postings**: 15,841 raw job postings
- **Top Job Designations**: Business Analyst (108), Data Scientist (64), Data Analyst (50), Digital Marketing Manager (45), Product Manager (44)
- **Geographic Concentration (Top Cities)**:
  - Bengaluru: 4,108 postings (20.17%)
  - Mumbai: 2,643 postings (12.97%)
  - Gurgaon: 2,129 postings (10.45%)
  - Delhi NCR: 1,363 postings (6.69%)
  - Pune: 1,253 postings (6.15%)
  - Hyderabad: 1,179 postings (5.79%)
  - Chennai: 1,083 postings (5.32%)
- **Salary Range Distribution**:
  - `10to15` LPA: 3,608 postings (22.78%)
  - `15to25` LPA: 3,281 postings (20.71%)
  - `6to10` LPA: 2,876 postings (18.16%)
  - `0to3` LPA: 2,592 postings (16.36%)
  - `3to6` LPA: 2,239 postings (14.13%)
  - `25to50` LPA: 1,245 postings (7.86%)
- **Experience Distribution**:
  - Minimum Experience: Range 0 to 23 years (mean: 4.41 yrs, median: 4.0 yrs)
  - Maximum Experience: Range 0 to 30 years (mean: 8.44 yrs, median: 8.0 yrs)
  - Most frequent ranges: 5-10 yrs (1,010), 2-5 yrs (964), 3-8 yrs (750)
- **Top In-Demand Skills**:
  - SQL: 915 mentions
  - Analytics: 904 mentions
  - Python: 840 mentions
  - Finance: 756 mentions
  - Java: 726 mentions
  - R: 655 mentions
  - SAS: 636 mentions
  - Business Analysis: 633 mentions
  - Machine Learning: 629 mentions
  - Data Analysis: 618 mentions

---

### 3.2 DataScience Jobs (`DataScience Jobs.csv`)
- **Aggregated Records**: 1,602 cluster records representing **93,005 individual job postings**
- **Unique Companies**: 642 hiring organizations
- **Top Roles by Market Volume**:
  1. Business Analyst: 32,843 jobs (35.31% share) | Avg Salary: 8.95 LPA | Avg Min Exp: 1.7 yrs
  2. Data Analyst: 18,095 jobs (19.46% share) | Avg Salary: 5.71 LPA | Avg Min Exp: 0.8 yrs
  3. Senior Business Analyst: 14,115 jobs (15.18% share) | Avg Salary: 13.17 LPA | Avg Min Exp: 3.3 yrs
  4. Data Scientist: 9,051 jobs (9.73% share) | Avg Salary: 13.20 LPA | Avg Min Exp: 2.7 yrs
  5. Data Engineer: 8,044 jobs (8.65% share) | Avg Salary: 10.15 LPA | Avg Min Exp: 2.7 yrs
  6. Senior Data Analyst: 3,825 jobs (4.11% share) | Avg Salary: 11.23 LPA | Avg Min Exp: 3.2 yrs
  7. Senior Data Engineer: 3,411 jobs (3.67% share) | Avg Salary: 16.59 LPA | Avg Min Exp: 4.4 yrs
  8. Senior Data Scientist: 2,129 jobs (2.29% share) | Avg Salary: 20.89 LPA | Avg Min Exp: 5.0 yrs
  9. Machine Learning Engineer: 964 jobs (1.04% share) | Avg Salary: 10.37 LPA | Avg Min Exp: 1.9 yrs
  10. Data Architect: 528 jobs (0.57% share) | Avg Salary: 26.68 LPA | Avg Min Exp: 7.7 yrs
- **Compensation Benchmarks**:
  - Record Unweighted Avg: 13.23 LPA (median: 11.9 LPA, range: 1.4 to 82.0 LPA)
  - Posting-Weighted Avg: **9.69 LPA** (reflecting higher volume of junior analyst openings)
  - Minimum Salary: mean 8.63 LPA (range: 0.2 to 55.0 LPA)
  - Maximum Salary: mean 19.14 LPA (range: 2.0 to 102.0 LPA)
- **Top Hiring Employers by Postings**:
  - TCS (9,064 jobs across 10 roles)
  - Accenture (5,425 jobs across 10 roles)
  - Cognizant (3,813 jobs across 10 roles)
  - Wipro (2,566 jobs across 10 roles)
  - IBM (2,480 jobs across 10 roles)
  - Genpact (2,147 jobs)
  - Capgemini (1,994 jobs)

---

### 3.3 JDS Skill Traits (`JDS Skill Traits.xlsx`)
- **Candidate Evaluations**: 139 candidate records across 137 unique candidates
- **Target Distribution**: High Hike (1): 73 (52.52%) vs. Low Hike (0): 66 (47.48%) — nicely balanced benchmark
- **Technical Capabilities Predictive Power (Correlation with Target)**:
  1. `dashboard_and_storytelling_skills`: **r = +0.5541** (Low mean: 3.81 vs. High mean: 4.85, delta: +1.03)
  2. `maths-stats_skills`: **r = +0.5238** (Low mean: 3.83 vs. High mean: 4.71, delta: +0.88)
  3. `coding_skills`: **r = +0.4438** (Low mean: 3.85 vs. High mean: 4.64, delta: +0.79)
  4. `ai_and_ml_skills`: **r = +0.4046** (Low mean: 4.28 vs. High mean: 4.82, delta: +0.54)
  5. `big_data_skills`: **r = +0.1123** (Low mean: 3.75 vs. High mean: 3.94, delta: +0.19)
- **Key Insight**: Storytelling/visualization and mathematics/statistics are the strongest determinants of high salary hikes, outperforming pure big-data infrastructure tooling.

---

### 3.4 SDS Personality Traits (`SDS Personality Traits.xlsx`)
- **Candidate Evaluations**: 161 records across 152 unique candidates
- **Target Distribution**: High Success (1): 85 (52.80%) vs. Low Success (0): 76 (47.20%) — balanced benchmark
- **Big Five Personality Dimensions Predictive Power (Correlation with Target)**:
  1. `conscientiousness`: **r = +0.6802** (Low mean: 35.74 vs. High mean: 53.68, delta: +17.95)
  2. `openness_to_experience`: **r = +0.6713** (Low mean: 33.32 vs. High mean: 48.49, delta: +15.18)
  3. `extraversion`: **r = +0.4943** (Low mean: 36.88 vs. High mean: 48.86, delta: +11.98)
  4. `agreeableness`: **r = +0.2926** (Low mean: 41.12 vs. High mean: 47.72, delta: +6.60)
  5. `neuroticism`: **r = -0.0059** (Low mean: 36.26 vs. High mean: 36.13, delta: -0.13)
- **Key Insight**: Conscientiousness (discipline, goal pursuit) and Openness to Experience (intellectual curiosity, adaptiveness) dominate career success predictability. Neuroticism has virtually zero predictive utility.

---

## 4. Data Quality Audit & Stage 2 Preprocessing Flags

| ID | Dataset | Feature / Column | Anomaly Description | Affected Scope | Preprocessing Action for Stage 2 |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **Q1** | Analytics Jobs | `job_type` | 75.82% missing values | 12,011 rows | Impute from `job_desig` where possible or treat as "Not Specified". Do not filter out rows. |
| **Q2** | Analytics Jobs | `job_type` | 5 casing/spelling variants (`Analytics`, `analytics`, `ANALYTICS`, `analytic`, `Analytic`) | 3,830 rows | Normalize using `.str.strip().str.title()` to single category "Analytics". |
| **Q3** | Analytics Jobs | `job_description` | 22.14% missing descriptions | 3,508 rows | Impute with empty string; rely on `key_skills` as primary skill signal. |
| **Q4** | Analytics Jobs | `key_skills` | Truncation artifact (`...`) and 63,169 unstripped leading spaces | 946 postings / 63,169 tokens | Tokenize on comma/pipe, trim whitespace, filter out ellipsis tokens. |
| **Q5** | Analytics Jobs | `s_no` | Semantic duplicates: 1,001 rows share exact same content with different `s_no` | 1,001 rows | Audit whether duplicates represent recurring hiring quotas or scraper duplication. |
| **Q6** | DataScience Jobs | `reference_no` | Non-unique identifier (1,460 unique references for 1,602 rows) | 276 rows | Replace with composite natural key `(company_name, job_title, min_experience)`. |
| **Q7** | DataScience Jobs | `num_of_jobs` | Extreme right skew (mean 58.1 vs median 22.0, max 4,200) | 1,602 rows | Use log-scale or weighted statistics rather than unweighted means. |
| **Q8** | JDS Skill Traits | `id` | Candidate ID repetition and label contradiction on candidate 3291 (row 3: 0, row 29: 1) | 4 rows (IDs 2223 & 3291) | Resolve candidate reassessment logic or handle as multi-attempt candidate. |
| **Q9** | SDS Personality Traits| `id` | 9 repeated candidate IDs with 7 having conflicting success labels | 18 rows | Deduplicate deterministically or filter ambiguous candidate records prior to ML training. |
| **Q10**| SDS Personality Traits| Column Names | Leading space in `' extraversion'`, spaces in target name `'success_ classification_ high_low'` | Schema level | Standardize column names using `.str.strip().str.replace(' ', '_')`. |

---

## 5. Artifact Verification

Generated machine-readable artifacts in `src/data/analysis/`:
1. `dataAudit.json` (15.2 KB) — Full metadata, types, missingness, duplicate stats, and audit flags.
2. `marketExploration.json` (23.1 KB) — Detailed market distributions, roles, salaries, skills, and locations.
3. `jdsExploration.json` (5.7 KB) — Technical capability distributions, correlations, and class comparisons.
4. `sdsExploration.json` (9.5 KB) — Big Five personality distributions, correlations, and predictive rankings.
