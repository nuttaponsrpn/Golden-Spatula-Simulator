# Golden Spatula API Data Sources

Reference for all data endpoints used to provide tools to the DeepAgent.
All URLs verified against live API (2026-06-14).

---

## Step 0 — Resolve Current Version Dynamically

**Never hardcode the version path.** Always fetch the version config first, then pick the entry where `is_newest_version === 1` for the desired `mode`.

```
GET https://goldenspatula.com/act/jkxzlkFile/js/EN/config/versiondataconfig.js
```

Returns a JSON array. Each entry has:

```json
{
  "version": "18.17.3",
  "season": "S18",
  "is_newest_version": 1,
  "mode": "17",
  "name": "Space Gods",
  "herourl":    "/17/18.17.3-S18/chess.js",
  "traiturl":   "/17/18.17.3-S18/trait.js",
  "equipurl":   "/17/18.17.3-S18/equip.js",
  "hexurl":     "/17/18.17.3-S18/hex.js",
  "godurl":     "/17/18.17.3-S18/god.js",
  "raceurl":    "/17/18.17.3-S18/race.js",
  "joburl":     "/17/18.17.3-S18/job.js",
  "configurl":  "/17/18.17.3-S18/config.js",
  "lang": "EN"
}
```

**Base URL:** `https://goldenspatula.com/act/jkxzlkFile/js/EN`  
**Full URL:** `base + herourl` → `https://goldenspatula.com/act/jkxzlkFile/js/EN/17/18.17.3-S18/chess.js`

> Note: Multiple entries can have `is_newest_version: 1` at the same time (different `mode` values run in parallel). The primary game mode for this project is **mode 17 (Space Gods / S18)**.

---

## URLs That Have Real Data

### 1. `herourl` — Champions (`chess.js`)

**Purpose:** Full champion roster with stats, traits, ability, and cost.

**Sample shape:**
```json
{
  "version": "18.17.3",
  "data": {
    "10166": {
      "id": "10166",
      "name": "Dummy",
      "class": "-1",
      "heroType": "1",
      "price": "0",
      "picture": "https://...",
      "showHeroTag": "1",
      "skillName": "Tower of Rebellion",
      "skillDesc": "...",
      "initAttackDamage": "35",
      "initHP": "550",
      "maxMP": "0",
      "setid": "17"
    }
  }
}
```

**Key fields:**
| Field | Meaning |
|-------|---------|
| `heroType` | `"0"` = real champion, `"1"` = dummy/tower (filter out) |
| `class` | pipe-separated trait IDs (e.g. `"314\|319"`) — maps to `job.js` |
| `species` | pipe-separated trait IDs (e.g. `"409"`) — maps to `race.js` |
| `price` | gold cost 1–5 |
| `showHeroTag` | `"1"` = show in picker |
| `initAttackDamage` | base damage stat |

**Used for tool:** `get_champions`

---

### 2. `traiturl` — Traits (unified, `trait.js`)

**Purpose:** All traits with full threshold and bonus descriptions.

**Sample shape:**
```json
{
  "data": {
    "83100101": {
      "id": 83100101,
      "checkId": "402",
      "name": "Meeple",
      "type": 0,
      "numList": "3|5|7|10",
      "values": "3|5|7|10",
      "picture": "https://...",
      "desc": "Full description with bonus details",
      "prefix": "Short lore/intro text"
    }
  }
}
```

**Key fields:**
| Field | Meaning |
|-------|---------|
| `checkId` | Primary ID used by champions to reference traits |
| `type` | `0` = origin/species (race), `1` = class (job) |
| `numList` | Activation counts per tier, pipe-separated |
| `desc` | Full description including `[MinUnits]` placeholders |

> **Important:** `trait.js` is the **unified** source for all traits. `race.js` and `job.js` are subsets — use `trait.js` as the authoritative source.

**Used for tool:** `get_traits`

---

### 3. `raceurl` — Origin Traits (`race.js`)

**Purpose:** Traits of type origin/species only (subset of `trait.js`).

**Sample shape:**
```json
{
  "data": {
    "400": {
      "id": "400",
      "name": "Anima",
      "numList": "3|6",
      "desc2": "(3) Start Researching! |(6) After winning a player combat, gain loot!",
      "picture": "https://..."
    }
  }
}
```

**Note:** `desc2` contains tier-specific descriptions, pipe-separated by threshold tier (different from `trait.js`'s `desc`). **Prefer `trait.js`** for completeness; use `race.js` only if filtering origin traits specifically.

---

### 4. `joburl` — Class Traits (`job.js`)

**Purpose:** Traits of type class only (subset of `trait.js`).

**Sample shape:**
```json
{
  "data": {
    "310": {
      "id": "310",
      "name": "Bastion",
      "numList": "2|4|6",
      "desc2": "(2) 16 Armor/MR |(4) 40 Armor/MR |(6) 60 Armor/MR",
      "picture": "https://..."
    }
  }
}
```

**Note:** Same as `race.js` — subset of `trait.js`. **Prefer `trait.js`.**

---

### 5. `equipurl` — Items (`equip.js`)

**Purpose:** All items including basic components, combined items, radiant, artifact, emblem.

**Sample shape:**
```json
{
  "data": {
    "1001": {
      "id": "1001",
      "name": "B.F. Sword",
      "basicDesc": "+10Attack Damage",
      "desc": "",
      "type": "基础装备",
      "synthesis1": "0",
      "synthesis2": "0",
      "picture": "https://...",
      "planID": "17",
      "setID": "17"
    }
  }
}
```

**Key fields:**
| Field | Meaning |
|-------|---------|
| `type` | Chinese string: `基础装备` = basic, `成型装备` = combined, `光明武器` = radiant |
| `planID` | Filter by `"17"` for current set only |
| `synthesis1/2` | Component item IDs (`"0"` = none) |
| `basicDesc` | Stat bonuses (e.g. `+10Attack Damage`) |
| `desc` | Effect/passive description |

**Used for tool:** `get_items`

---

### 6. `hexurl` — Hex Augments (`hex.js`)

**Purpose:** All augment options that appear at rounds 2-2, 3-2, 4-2.

**Sample shape:**
```json
{
  "data": {
    "1002": {
      "id": "1002",
      "name": "Calculated Loss",
      "desc": "After losing your combat, gain 2 gold and a free Shop reroll.",
      "icon": "https://...",
      "level": "2",
      "is_legend": 0
    }
  }
}
```

**Key fields:**
| Field | Meaning |
|-------|---------|
| `level` | Augment tier: `"1"` = silver, `"2"` = gold, `"3"` = prismatic |
| `is_legend` | `1` = legend/special augment |
| `desc` | Full augment effect description |

**Potential tool:** `get_augments` — useful for answering "what augments work with my comp?"

---

### 7. `godurl` — Tactician Gods (`god.js`)

**Purpose:** God/Tactician options — each offers quests and rewards across stages.

**Sample shape:**
```json
{
  "data": [
    {
      "godId": 2,
      "godName": "Aurelion Sol, God of Wonders",
      "godTips": "Aurelion Sol offers Rewarding Quests",
      "stages": [
        {
          "num": 2,
          "wishes": [
            {
              "id": 1702010,
              "name": "Wealth Quest",
              "desc": "When you reach 50 gold, gain a component anvil and 4 gold.",
              "icon": "https://..."
            }
          ]
        }
      ]
    }
  ]
}
```

**Potential tool:** `get_gods` — for answering "which god pairs well with my comp?" (e.g. economy god for econ-heavy comps).

---

### 8. `configurl` — Combined Config (`config.js`)

**Purpose:** Merged snapshot of `race` + `job` + `chess` + `equip` data in one response.

**Note:** Redundant with individual endpoints — useful only if you want a single-request fetch for all data. The individual endpoints are cleaner to cache separately.

---

## URLs That Return Empty Data (Not Useful)

| URL key | Status | Note |
|---------|--------|------|
| `legendurl` | `{"data":[]}` | Legend system not active this set |
| `galaxyurl` | `{"data":[]}` | Not active |
| `missionurl` | `{"data":[]}` | Not active |
| `adventureurl` | `{"data":[]}` | Not active |
| `goopurl` | `{"data":[]}` | Not active |
| `tinyherourl` | 404 | Does not exist for mode 17 |

---

## Lineup URL (Separate from version config)

**Not referenced in version config** — uses a separate URL pattern:

```
GET https://goldenspatula.com/act/jkxzlkJson/json/EN/lineupJson/m{season}/{edition}/{mode}/lineup_detail_total.json
```

Current example: `m18/29/17/lineup_detail_total.json`

**Sample shape:**
```json
{
  "lineup_list": [
    {
      "id": "5402",
      "quality": "A",
      "mode": "17",
      "simulator_edition": "18.17.3",
      "season": "18",
      "detail": "{...JSON string with full comp data...}"
    }
  ]
}
```

The `detail` field is a **JSON string** that must be parsed separately. Contains `levelMap` with unit placements per level (7/8/9).

**Note:** The lineup URL segments (`m18`, `29`, `17`) need to be derived from the version config — `season` = `18` → `m18`, edition and mode from the version entry. **This requires further investigation** to determine how `edition` (`29`) maps to version config fields.

**Used for tool:** `get_lineups`

---

## Proposed Server API Endpoints

Based on the above, these Nuxt server API routes should be created to serve as tool backends:

| Route | Source URL | Purpose |
|-------|-----------|---------|
| `GET /api/tft/version` | `versiondataconfig.js` | Return current version metadata (resolve URLs dynamically) |
| `GET /api/tft/champions` | `herourl` (chess.js) | Champions filtered and adapted |
| `GET /api/tft/traits` | `traiturl` (trait.js) | All traits with thresholds |
| `GET /api/tft/items` | `equipurl` (equip.js) | Items filtered by current planID |
| `GET /api/tft/augments` | `hexurl` (hex.js) | Augments by tier |
| `GET /api/tft/gods` | `godurl` (god.js) | Tactician gods and quests |
| `GET /api/tft/lineups` | lineup JSON | Meta comps, filterable by quality |

**Each endpoint should:**
1. Call `GET /api/tft/version` first to resolve the live URL paths
2. Fetch and transform the data using the existing adapter pattern
3. Cache with `useStorage()` or HTTP cache headers (data changes only on patch)

---

## Caching Strategy

| Endpoint | Cache TTL | Reason |
|----------|-----------|--------|
| `/api/tft/version` | 1 hour | Version changes only on patch day |
| `/api/tft/champions` | 1 hour | Tied to version |
| `/api/tft/traits` | 1 hour | Tied to version |
| `/api/tft/items` | 1 hour | Tied to version |
| `/api/tft/augments` | 1 hour | Tied to version |
| `/api/tft/gods` | 1 hour | Tied to version |
| `/api/tft/lineups` | 15 min | Updated more frequently (community submissions) |
