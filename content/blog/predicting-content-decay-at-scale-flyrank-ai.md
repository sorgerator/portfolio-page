During my Machine Learning Engineering Internship at **FlyRank AI** (July – September 2026), I worked on one of the most persistent operational problems in search engine optimization and digital publishing: **content decay**.

High-performing articles naturally lose organic search visibility over time as search intent shifts, competitors publish fresher guides, and SERP layouts evolve. Yet for most editorial teams, deciding *which* pages to update is still a reactive, manual process driven by gut feel or naive age heuristics.

To solve this, I engineered an end-to-end **Content Opportunity Scoring and Decay Prediction Pipeline** across **78.8 million daily performance records** spanning **104 client portfolios** (~520,000 distinct articles). Using **DuckDB**, **Python**, and a **Random Forest** ranking architecture validated under a strict client-grouped time-series split, the pipeline achieved a **Precision@50 of 98.0%**—a **2.88× lift** over the traditional 34.0% baseline heuristic—and won **2nd Place at Prolog EXPO 2026**.

---

## 1. Why Traditional Age-Based Heuristics Fail

When editorial teams plan content refreshes, the default rule of thumb is almost always the same: sort the archive by oldest publish date and highest historical traffic, then start rewriting from the top.

The problem is that **age does not equal decay**:

- A five-year-old foundational technical guide can hold a stable #2 ranking with strong click-through and scroll engagement for years. Touching it wastes editorial bandwidth—and risks disrupting a page that isn't broken.
- Conversely, a six-month-old commercial article can silently lose impressions and clicks to new competitors weeks before anyone notices it slipping off the first page of Google.

The goal of this research was to transition SEO workflows from reactive spreadsheet triage to a predictive **Content Action Playbook**: scoring every active URL for decline risk *before* traffic collapses, and pairing each prediction with human-readable diagnostic reason codes.

---

## 2. The Dataset: 78.8M Daily Records in DuckDB

I worked with the pseudonymized FlyRank ML Internship data warehouse (`v20260703`), which unifies daily aggregations from **Google Search Console (GSC)** and **Google Analytics 4 (GA4)** across 104 client properties in a star schema:

- **`dim_clients`**: 104 pseudonymized client domains with varying historical depth and industry verticals.
- **`dim_content`**: A catalog of ~520,000 distinct anonymized articles and landing pages.
- **`fact_content_daily_performance`**: The core **78.8-million-row** daily fact table capturing impressions, clicks, average position, sessions, engaged sessions, and scroll events per URL.
- **`fact_content_query_90d`**: Rolling 90-day query-level performance aggregations over hashed search queries.

Because scanning and joining 78.8M rows repeatedly in in-memory Pandas DataFrames introduces massive memory bottlenecks, I used **DuckDB** to push window aggregations, 30-day vs. previous-30-day momentum deltas, and data contract checks directly into vectorized SQL queries.

```sql
-- Example DuckDB aggregation computing 30d vs. prev-30d momentum windows
SELECT
    content_id,
    client_id,
    SUM(impressions) AS impressions_90d,
    SUM(clicks) AS clicks_90d,
    COUNT(DISTINCT CASE WHEN impressions > 0 THEN report_date END) AS days_with_impressions,
    SUM(CASE WHEN report_date >= current_date - INTERVAL '30 days' THEN impressions ELSE 0 END) AS impressions_last_30d,
    SUM(CASE WHEN report_date BETWEEN current_date - INTERVAL '60 days'
                                  AND current_date - INTERVAL '31 days' THEN impressions ELSE 0 END) AS impressions_prev_30d,
    AVG(avg_position) AS avg_position
FROM fact_content_daily_performance
GROUP BY content_id, client_id
HAVING SUM(impressions) >= 10;
```

### Data Hygiene & Filtering Noise

Before feature engineering, three sources of noise had to be stripped out so the model would only learn from actionable editorial content:

1. **The Invisible Long Tail**: Pages with fewer than 10 impressions over the 90-day window were excluded. Zero-visibility or de-indexed URLs suffer from a cold-start problem rather than active decay.
2. **Non-Editorial Structural Pages**: Using URL path heuristics, I filtered out author bio pages, tag clouds, pagination archives, and checkout/legal routes that editorial teams wouldn't refresh as content assets.
3. **Bot & Scraper Anomalies**: Extreme CTR outliers (such as automated scraper spikes producing statistically impossible click-through ratios) were clipped to prevent distorted gradient and split thresholds.

---

## 3. Feature Engineering & Hunting Data Leakage

My core hypothesis was that **rank volatility, impression consistency, and engagement momentum** over rolling 30-to-90-day windows are far stronger predictors of decay than static content age.

Key engineered and log-transformed features included:

- **Visibility Density & Volume**: `days_with_impressions`, `log_impressions_90d`, `log_clicks_90d`, and `avg_position`.
- **On-Page Engagement Signals**: `ctr`, `scroll_rate`, `engagement_rate`, `days_with_sessions`, and `ai_traffic_pct`.
- **Content Structure & Freshness**: `content_age_days`, `word_count`, `char_count`, and `competition`.

### Eliminating Target Leakage & Client Bleed

In real-world ranking datasets, it is dangerously easy to achieve a 99% validation score by accidentally leaking the target into the feature matrix. To make sure our evaluation was honest:

1. **Stripping Label-Derived Columns**: The target (`is_declining_label`) reflects whether a page's trajectory has turned definitively downward. Any feature directly computed from the outcome window—such as `trend_direction` and `trend_pct`—was strictly excluded from the training matrix.
2. **Pseudonymous IDs as Grouping Keys Only**: Identifiers like `client_id` and `content_id` were never fed to the model as features, preventing the tree ensemble from memorizing specific client domains.
3. **Client-Grouped Holdout & Time-Series Validation**: Standard random `train_test_split` leaks domain-wide seasonality across train and test sets. Instead, validation enforced a **client-grouped holdout split** alongside temporal partitioning so the model was always evaluated on unseen client portfolios:

```python
def make_client_aware_split(
    frame: pd.DataFrame,
    target_series: pd.Series,
    random_state: int = 42,
) -> tuple[np.ndarray, np.ndarray]:
    """Splits dataset by holding out 20% of unique client portfolios."""
    all_indices = np.arange(len(frame))
    client_series = frame["client_id"].fillna("unknown").astype(str)
    unique_clients = client_series.drop_duplicates().to_numpy()

    rng = np.random.default_rng(random_state)
    shuffled_clients = rng.permutation(unique_clients)
    test_client_count = max(1, int(round(len(shuffled_clients) * 0.2)))
    test_clients = set(shuffled_clients[:test_client_count])

    test_mask = client_series.isin(test_clients).to_numpy()
    return all_indices[~test_mask], all_indices[test_mask]
```

---

## 4. Model Evaluation vs. Baseline Heuristic

Why optimize for **Precision@50** instead of overall accuracy?

An editorial team cannot rewrite 10,000 articles in a single sprint. In production, a content strategist opens the top 50 highest-priority recommendations for the week. If those top 50 slots are polluted with false positives, trust in the system evaporates.

I benchmarked three model families—**Logistic Regression**, **Decision Tree**, and **Random Forest**—against the traditional **Age + Historical Visibility Baseline** on the exact same validation split.

| Model / Method | Primary Metric (Precision@50 — Capstone Split) | Starter Benchmark (ROC AUC / Avg Precision / F1) | Key Takeaway |
| :--- | :---: | :---: | :--- |
| **Baseline Rule (Age + Visibility)** | **34.0%** | 0.627 AUC / 0.468 AP | Over-indexes on old but stable pages |
| **Logistic Regression** | — | 0.700 AUC / 0.566 F1 | Misses non-linear rank × CTR interactions |
| **Decision Tree** | — | 0.742 AUC / 0.634 F1 | Captures thresholds but higher variance |
| **Random Forest Classifier** | **98.0%** | **0.747 AUC / 0.638 F1** | **2.88× Precision@50 lift over baseline** |

On the full 78.8M-row capstone time-series split, the traditional baseline heuristic correctly identified an actively decaying page in its top 50 recommendations only **34.0%** of the time. The **Random Forest** model achieved a **Precision@50 of 98.0%**—a **2.88× lift** that lets editors focus almost exclusively on genuinely decaying assets.

### What the Model Actually Learned (Feature Importance)

Inspecting permutation and impurity feature importances revealed why the baseline heuristic struggled:

1. **`days_with_impressions` (16.1%)** & **`log_impressions_90d` (12.9%)**: High-visibility pages with intermittent impression dropouts signal early SERP instability long before total traffic zeroes out.
2. **`avg_position` (10.8%)**: Pages hovering on the boundary of page one (positions 7–15) are far more vulnerable to sudden click decay than top-3 anchors.
3. **`content_age_days` (9.5%)**: Age still matters, but only as an interaction term alongside position and engagement—accounting for less than 10% of total split importance.
4. **`word_count` (4.1%)**, **`ctr` (3.3%)**, and **`scroll_rate` (3.1%)**: Thin content and low on-page scroll depth help separate content-quality decay from SERP-snippet mismatches.

---

## 5. From Probabilities to an Action Playbook

A raw probability like `P(decline) = 0.82` alerts a data scientist, but it doesn't tell an editor *how* to fix the article. To bridge the gap between ML inference and daily editorial execution, I built a two-layer **Action Playbook** post-processor:

### 1. Blended Priority Score (0–100)

Each page receives a composite priority score combining the Random Forest decline probability (`70%` weight) with the business value / visibility baseline score (`30%` weight):

```python
final_score = 100.0 * (0.70 * model_decline_prob + 0.30 * baseline_opportunity_score)
```

Out of 30,000 scored candidate pages in the final release queue, **2,916 pages** cleared the strict **High-Confidence** threshold (`>= 500` impressions, `>= 10` sessions, `P(decline) >= 0.50`, and `Final Score >= 64.47`).

### 2. Diagnostic Reason Codes & Tactical Actions

Instead of a black-box score, every row in the exported queue is tagged with deterministic diagnostic codes mapped to one of five concrete editorial actions:

- **`REFRESH_AND_REVIEW_CTR`**: Triggered when a page holds page-one visibility (`0 < avg_position <= 20`) with high impressions but low CTR (`< 0.5%`). *Editorial Play*: Rewrite the meta title and description to match current SERP intent rather than overhauling the body text.
- **`REFRESH_AND_REVIEW_ENGAGEMENT`**: Triggered when search clicks are arriving, but on-page `scroll_rate < 30%` or engagement is dropping. *Editorial Play*: Improve above-the-fold UX, update outdated sections, and tighten formatting.
- **`EXPAND_AND_REFRESH`**: Flagged for decaying articles with thin depth (`word_count < 1,200`) competing in high-density query spaces.
- **`REFRESH`**: Standard full-content update for stale pages (`> 180 days`) exhibiting multi-signal decay.
- **`MONITOR`**: Stable or low-density pages where intervention is currently net-negative.

---

## 6. Guardrails, Limitations & Prolog EXPO 2026

A key lesson from my time at FlyRank AI was **intellectual honesty in production ML**—being explicit about where a model stops being valid:

- **Decision-Support, Not Causal Proof**: The classifier identifies historical patterns of organic decline; it does not "crack Google's ranking algorithm." Recovery still depends on editorial quality.
- **Human-in-the-Loop Checklist**: Before acting on a flagged URL, editors verify whether CTR drops were caused by new Google AI Overviews/Featured Snippets or intentional internal cannibalization by a newer post on the same domain.
- **Hard Retraining Triggers**: The playbook defines automated retraining triggers if holdout Precision@50 drops below 60%, if editors reject more than 30% of high-confidence recommendations, or after major search layout updates.

In September 2026, I presented this capstone research paper—*"Content Opportunity Scoring and Refresh Pipeline"*—at **Prolog EXPO 2026** (organized by Naučno društvo *"Vladimir Prelog"*), where it was awarded **2nd Place**.

### Explore the Code & Research Paper

- **GitHub Repository (Reproducible Pipeline & Scripts)**: [github.com/sorgerator/flyrank-internship](https://github.com/sorgerator/flyrank-internship)
- **Full Interactive Research Paper**: [sorgerator.github.io/flyrank-internship](https://sorgerator.github.io/flyrank-internship/)
