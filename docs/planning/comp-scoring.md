# Comp Scoring System

Documents the scoring engine in [app/utils/tft.ts](../../app/utils/tft.ts). Runs locally in real time — no AI required.

---

## Overview

`buildCompScore(units, champions, traits)` → `CompScore`

```
total = Σ (dimension.value × dimension.weight)   // range 0–100
```

The total is then mapped to a letter grade.

---

## 5 Dimensions

### 1. Trait Synergy — 35% weight

**Function:** `calculateTraitScore(activations)`

```
base  = (active_count / total_traits) × 60          // 0–60
bonus = min(40, Σ tierValue(tier) × 10)             // 0–40
score = min(100, round(base + bonus))
```

**Tier values:** prismatic = 4 · gold = 3 · silver = 2 · bronze = 1

**Why highest weight (35%):** Synergies are the core mechanic of TFT. A comp with no active synergies almost never wins.

---

### 2. Carry Coverage — 25% weight

**Function:** `calculateCarryCoverage(units, champions)`

Counts champions with cost ≥ 4 as carry proxies (no explicit role field yet).

| Carries | Score |
|---------|-------|
| 0 | 0 |
| 1 | 60 |
| 2 | 85 |
| 3+ | 100 |

---

### 3. Frontline Balance — 20% weight

**Function:** `calculateFrontlineBalance(units, champions)`

Counts champions with cost ≥ 3 as frontline proxies.

`required` = 3 if unit count ≥ 7, else 2.

| Frontline count | Score |
|-----------------|-------|
| 0 | 0 |
| ≥ required + 1 | 100 |
| ≥ required | 80 |
| ≥ required − 1 | 50 |
| below | 25 |

---

### 4. Cost Efficiency — 10% weight

**Function:** `calculateCostEfficiency(units, champions)`

```
avgCost = totalCost / unitCount
score   = round(min(100, ((avgCost − 1) / 4) × 90 + 10))
```

| avgCost | Score |
|---------|-------|
| 1.0 | 10 |
| 3.0 | ~55 |
| 5.0 | 100 |

---

### 5. Slot Efficiency — 10% weight

**Function:** `calculateSlotEfficiency(unitCount)`

```
score = round((unitCount / 9) × 100)
```

---

## Grade Mapping

| Score | Grade |
|-------|-------|
| ≥ 90 | S |
| ≥ 75 | A |
| ≥ 55 | B |
| ≥ 35 | C |
| < 35 | D |

---

## Suggestions Engine

`buildSuggestions(score, units, champions, traits)` → `string[]` (Thai UI)

| Condition | Suggestion |
|-----------|-----------|
| Carry Coverage = 0 | Add a carry unit |
| Frontline Balance < 50 | Add tanks |
| Trait Synergy < 40 + near-active trait (≤ 2 away) | Name the trait + units needed |
| Trait Synergy < 40 (no near-active) | Focus on one synergy |
| Slot Efficiency < 60 | Add more champions |
| Cost Efficiency < 40 + ≥ 5 units | Upgrade to higher cost tier |
| score ≥ 75 + no other suggestions | Suggest upgrading to 2-star |

---

## Known Limitations

- **No role data:** Cost is used as a proxy for carry/frontline. Some cost-4 units may not be carries.
- **Items not counted:** Item bonuses have no effect on the score.
- **Position not counted:** Board placement does not affect the score.
- **Star level not counted:** 1-star and 3-star units score the same.
