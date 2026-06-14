# Data Alignment Plan — GoldenSpatula API

> แผนการปรับโค้ดให้ใช้ข้อมูลจริงจาก GoldenSpatula API แบบ runtime (SSR fetch)
> แทนที่ hardcoded data ใน `app/data/`

---

## ภาพรวม

```
sources/golden_spatula_endpoints.json   ← config URLs (committed)
  ↓ อ่านตอน runtime
app/composables/tft/useTftData.ts       ← fetch + cache ด้วย useState
  ↓ transform ผ่าน adapters
app/utils/adapters/                     ← raw → domain type mapping
  ↓ expose ผ่าน composables
app/composables/tft/useChampions.ts     ← ใช้ใน components
app/composables/tft/useTraits.ts
app/composables/tft/useItems.ts
app/composables/tft/useLineups.ts
```

---

## ความต่างระหว่าง Current Code กับ Real API

### champion (chess.js)

| Field ปัจจุบัน | Field ใน API | หมายเหตุ |
|---|---|---|
| `id: string` | `tftHeroId: string` | ใช้ `tftHeroId` เป็น key |
| `name: string` | `name: string` | ตรงกัน |
| `cost: 1\|2\|3\|4\|5` | `price: string` | ต้อง parse เป็น number |
| `traits: string[]` | `species: string` + `class: string` | `class` เป็น pipe-delimited เช่น `"319\|316"` — ต้อง split + รวมกัน |
| `class: ChampionClass` | ไม่มี (ถูกดูดเข้า traits) | ลบออก — class คือ trait type |
| `imageUrl: string` | `picture: string` | rename |
| `ability.name` | `skillName: string` | rename |
| `ability.description` | `skillDesc: string` | rename |
| `ability.mana` | `maxMP: string` | parse เป็น number |

**Raw fields ที่ filter ออก (ไม่ใช้ใน domain):**
`armor`, `attackRange`, `attackSpeed`, `criticalStrikeChance`, `initAttackDamage`, `initHP`, `initMP`, `magicResist`, `buyPrice`, `sellPrice`, `heroPaint`, `heroType`, `showHeroTag`, `skillIcon`, `skillBriefValue`, `skillValueDesc`, `mapID`, `setid`

---

### trait (trait.js)

| Field ปัจจุบัน | Field ใน API | หมายเหตุ |
|---|---|---|
| `id: string` | `checkId: string` | ใช้ `checkId` เป็น key (เช่น `"402"`) เพราะ champion.class/species อ้างอิง checkId |
| `name: string` | `name: string` | ตรงกัน |
| `type: "origin"\|"class"` | `type: 0\|1` | map: `0 → "origin"`, `1 → "class"` |
| `description: string` | `desc2: string` | ใช้ `desc2` (human-readable ไม่มี template vars) |
| `thresholds[].count` | `numList: "3\|5\|7\|10"` | split `\|` → parse เป็น number[] |
| `thresholds[].tier` | `color: string` | map: `"1"→"bronze"`, `"2"→"silver"`, `"3"→"gold"`, `"4"→"prismatic"` (per level) |
| `thresholds[].bonus` | `desc2` แต่ละ segment | split `desc2` ด้วย `\|` ให้ตรงกับแต่ละ threshold |
| `imageUrl: string` | `picture: string` | rename |

**หมายเหตุ color mapping:** API เก็บ `color` ของ trait ทั้งอัน ไม่ใช่ per-threshold — ต้องหา color จาก tier index แทน
- threshold index 0 → bronze
- threshold index 1 → silver  
- threshold index 2 → gold
- threshold index 3 → prismatic

---

### item (equip.js)

| Field ปัจจุบัน | Field ใน API | หมายเหตุ |
|---|---|---|
| `id: string` | `id: string` | ตรงกัน |
| `name: string` | `name: string` | ตรงกัน |
| `description: string` | `basicDesc: string` | rename |
| `image?: string` | `picture: string` | rename, always present |
| `components?: [string, string]` | `synthesis1: string` + `synthesis2: string` | `"0"` หมายถึงไม่มี component |

**Filter:** เอาเฉพาะ items ที่ `planID === "17"` (set 17) และ `mapID !== ""` ที่ match กับ current set

---

### lineup (lineup_detail_total.json)

| Field ปัจจุบัน (SuggestedComp) | Field ใน API | หมายเหตุ |
|---|---|---|
| `id: string` | `id: string` | ตรงกัน |
| `name: string` | `detail.line_name` | ต้อง `JSON.parse(detail)` ก่อน |
| `description: string` | `detail.early_info` | ย่อมาจาก early game guide |
| `championIds: string[]` | `detail.levelMap["8"]` หรือ `"9"` | เอาจาก level สูงสุด, map `hero_id` |
| `keyTraits: string[]` | ต้อง derive จาก champions | คำนวณจาก champion traits |
| `difficulty: "easy"\|"medium"\|"hard"` | `quality: "S"\|"A"\|"B"\|"C"` | map: S→easy, A→easy, B→medium, C→hard |
| `playstyle: string` | `detail.line_feature` | ใช้ตรง (เป็น tag ID — อาจต้องมี lookup table) |
| `imageUrl?: string` | ไม่มี | ลบออก หรือ derive จาก carry champion |

**หมายเหตุ detail parsing:**
- `detail` field เป็น JSON string — ต้อง `JSON.parse()` ก่อนใช้
- `levelMap` มี key 1-9 แทน stage — ใช้ level สูงสุดที่มีข้อมูล (ปกติ 8 หรือ 9) เป็น final board

---

## Phase ที่ต้องทำ

### Phase 1 — Raw API Types
**ไฟล์ใหม่:** `app/types/api-raw/chess.ts`, `trait.ts`, `equip.ts`, `lineup.ts`

```ts
// app/types/api-raw/chess.ts
export interface ApiRawChessResponse {
  version: string;
  season: string;
  setId: string;
  time: string;
  data: Record<string, ApiRawChampion>;
}

export interface ApiRawChampion {
  id: string;
  name: string;
  class: string;        // "314" หรือ "319|316"
  species: string;      // "409" หรือ "-1"
  price: string;        // "1" ถึง "5"
  picture: string;
  maxMP: string;
  skillName: string;
  skillDesc: string;
  skillIcon: string;
  heroType: string;     // "0" = hero, "1" = dummy
  tftHeroId: string;
  setid: string;
  // ... fields อื่น filter ออก
}
```

```ts
// app/types/api-raw/trait.ts
export interface ApiRawTraitResponse {
  version: string;
  season: string;
  setId: string;
  time: string;
  data: Record<string, ApiRawTrait>;
}

export interface ApiRawTrait {
  id: number;
  checkId: string;      // "402", "403" — ใช้เป็น key หลัก
  name: string;
  type: 0 | 1;          // 0 = origin, 1 = class
  color: string;        // "1"-"5"
  numList: string;      // "3|5|7|10"
  values: string;       // "3|5|7|10"
  picture: string;
  desc2: string;        // human-readable description
  realDesc: string;     // current active tier description
  setid: string;
}
```

```ts
// app/types/api-raw/equip.ts
export interface ApiRawEquipResponse {
  data: Record<string, ApiRawItem>;
}

export interface ApiRawItem {
  id: string;
  name: string;
  basicDesc: string;
  picture: string;
  synthesis1: string;   // "0" = no component
  synthesis2: string;
  type: string;         // "基础装备" = basic, "合成装备" = combined
  planID: string;       // filter by current set
  mapID: string;
  setID: string;
}
```

```ts
// app/types/api-raw/lineup.ts
export interface ApiRawLineupResponse {
  lineup_list: ApiRawLineup[];
}

export interface ApiRawLineup {
  id: string;
  quality: string;      // "S"|"A"|"B"|"C"
  detail: string;       // JSON string — ต้อง parse
}

export interface ApiRawLineupDetail {
  line_name: string;
  line_tag: string;
  line_feature: string;
  early_info: string;
  levelMap: Record<string, ApiRawUnitPlacement[]>;
  equipment_order: string;
}

export interface ApiRawUnitPlacement {
  idInLineup: number;
  chess_type: "hero" | "pet";
  hero_id: string;
  equipment_id: string; // comma-separated item IDs
  location: string;     // "row,col"
  star: number;
  is_carry_hero: boolean;
  carry_index: number;
}
```

---

### Phase 2 — Domain Type Updates
**ไฟล์เดิมที่ต้องแก้:**

**`app/types/champion.ts`**
- ลบ `ChampionClass` enum (class คือ trait ไม่ใช่ field แยก)
- เปลี่ยน `traits: string[]` → ยังเป็น `string[]` แต่ใช้ `checkId` (เช่น `["402", "314"]`)
- เพิ่ม field `imageUrl` จาก `picture`
- เพิ่ม `isHero: boolean` เพื่อ filter dummy units ออก

**`app/types/trait.ts`**
- `id` ยังเป็น `string` แต่ใช้ `checkId` เป็นค่า
- `type` เปลี่ยนเป็น `"origin" | "class"` (mapped แล้วใน adapter)

**`app/types/item.ts`**
- `image?: string` → `imageUrl: string` (always present)

**`app/types/comp.ts`**
- `SuggestedComp.championIds[]` → เพิ่ม `unitPlacements: UnitPlacement[]` สำหรับ position data
- เพิ่ม `quality: "S" | "A" | "B" | "C"` จาก API

---

### Phase 3 — Adapter Utils
**ไฟล์ใหม่:** `app/utils/adapters/`

```ts
// app/utils/adapters/champion.ts
export const toChampion = (
  raw: ApiRawChampion,
  traitCheckIds: Set<string>   // lookup เพื่อ validate trait IDs
): Champion => {
  const traitIds = [
    ...(raw.species !== "-1" ? [raw.species] : []),
    ...raw.class.split("|").filter(id => id !== "-1"),
  ].filter(id => traitCheckIds.has(id));

  return {
    id: raw.tftHeroId,
    name: raw.name,
    cost: Number(raw.price) as ChampionCost,
    traits: traitIds,
    imageUrl: raw.picture,
    isHero: raw.heroType === "0",
    ability: {
      name: raw.skillName,
      description: raw.skillDesc,
      mana: Number(raw.maxMP) || undefined,
    },
  };
};
```

```ts
// app/utils/adapters/trait.ts
const TIER_NAMES = ["bronze", "silver", "gold", "prismatic"] as const;

export const toTrait = (raw: ApiRawTrait): Trait => {
  const counts = raw.numList.split("|").map(Number);
  const descSegments = raw.desc2.split("|");

  return {
    id: raw.checkId,
    name: raw.name,
    type: raw.type === 0 ? "origin" : "class",
    description: raw.desc2,
    imageUrl: raw.picture,
    thresholds: counts.map((count, i) => ({
      count,
      tier: TIER_NAMES[i] ?? "prismatic",
      bonus: descSegments[i]?.trim() ?? "",
    })),
  };
};
```

```ts
// app/utils/adapters/item.ts
export const toItem = (raw: ApiRawItem): Item => ({
  id: raw.id,
  name: raw.name,
  description: raw.basicDesc,
  imageUrl: raw.picture,
  components:
    raw.synthesis1 !== "0" && raw.synthesis2 !== "0"
      ? [raw.synthesis1, raw.synthesis2]
      : undefined,
});
```

```ts
// app/utils/adapters/lineup.ts
export const toSuggestedComp = (raw: ApiRawLineup): SuggestedComp | null => {
  let detail: ApiRawLineupDetail;
  try {
    detail = JSON.parse(raw.detail);
  } catch {
    return null;
  }

  // ใช้ levelMap ที่มี level สูงสุด (8 หรือ 9)
  const finalLevel = ["9", "8", "7"].find(
    l => (detail.levelMap[l]?.length ?? 0) > 0
  ) ?? "8";
  const units = detail.levelMap[finalLevel] ?? [];
  const heroUnits = units.filter(u => u.chess_type === "hero");

  return {
    id: raw.id,
    name: detail.line_name,
    description: detail.early_info,
    championIds: heroUnits.map(u => u.hero_id),
    quality: raw.quality as "S" | "A" | "B" | "C",
    difficulty: raw.quality === "S" || raw.quality === "A" ? "easy"
      : raw.quality === "B" ? "medium" : "hard",
    playstyle: detail.line_feature,
    keyTraits: [],   // derive หลัง join กับ champion data
  };
};
```

---

### Phase 4 — Data Composables
**ไฟล์ใหม่:** `app/composables/tft/`

#### `useTftData.ts` — Base fetcher
```ts
// fetch ข้อมูลทั้งหมด 1 ครั้งตอน init, cache ด้วย useState
export const useTftData = () => {
  const champions = useState<Champion[]>("tft-champions", () => []);
  const traits = useState<Map<string, Trait>>("tft-traits", () => new Map());
  const items = useState<Item[]>("tft-items", () => []);
  const lineups = useState<SuggestedComp[]>("tft-lineups", () => []);
  const loading = useState<boolean>("tft-loading", () => false);
  const initialized = useState<boolean>("tft-initialized", () => false);

  const init = async () => { ... };

  return { champions, traits, items, lineups, loading, initialized, init };
};
```

#### `useChampions.ts`
```ts
export const useChampions = () => {
  const { champions } = useTftData();

  const byCost = (cost: ChampionCost) =>
    computed(() => champions.value.filter(c => c.cost === cost));

  const byId = (id: string) =>
    computed(() => champions.value.find(c => c.id === id) ?? null);

  const byTrait = (traitId: string) =>
    computed(() => champions.value.filter(c => c.traits.includes(traitId)));

  return { champions, byCost, byId, byTrait };
};
```

#### `useTraits.ts`
```ts
export const useTraits = () => {
  const { traits } = useTftData();
  const traitList = computed(() => [...traits.value.values()]);

  const byId = (id: string) =>
    computed(() => traits.value.get(id) ?? null);

  return { traits, traitList, byId };
};
```

#### `useItems.ts`
```ts
export const useItems = () => {
  const { items } = useTftData();

  const components = computed(() => items.value.filter(i => !i.components));
  const combined = computed(() => items.value.filter(i => !!i.components));
  const byId = (id: string) => computed(() =>
    items.value.find(i => i.id === id) ?? null
  );

  return { items, components, combined, byId };
};
```

#### `useLineups.ts`
```ts
export const useLineups = () => {
  const { lineups } = useTftData();

  const byQuality = (q: "S" | "A" | "B" | "C") =>
    computed(() => lineups.value.filter(l => l.quality === q));

  return { lineups, byQuality };
};
```

---

### Phase 5 — Nuxt Plugin สำหรับ Init
**ไฟล์ใหม่:** `app/plugins/tft-data.server.ts`

```ts
// ใช้ server plugin เพื่อ fetch ตอน SSR — client จะได้ hydrated data ทันที
export default defineNuxtPlugin(async () => {
  const { init, initialized } = useTftData();
  if (!initialized.value) {
    await init();
  }
});
```

---

### Phase 6 — ลบ Hardcoded Data

หลังจาก Phase 4-5 ทดสอบผ่าน:
- ลบ `app/data/champions.ts`
- ลบ `app/data/traits.ts`
- ลบ `app/data/items.ts`
- ลบ `app/data/suggestedComps.ts`
- ลบ `app/data/index.ts`
- อัปเดต components ทุกตัวที่ import จาก `~/data/` ให้ใช้ composables แทน

---

## ลำดับ Dependencies

```
Phase 1: Raw types          (ไม่มี dep)
    ↓
Phase 2: Domain type update (dep: Phase 1 เพื่อ design adapter interface)
    ↓
Phase 3: Adapters           (dep: Phase 1 + Phase 2)
    ↓
Phase 4: Composables        (dep: Phase 3)
    ↓
Phase 5: Nuxt Plugin        (dep: Phase 4)
    ↓
Phase 6: ลบ hardcoded data  (dep: Phase 5 ผ่านการทดสอบ)
```

---

## Error Handling

ทุก fetch ใน `useTftData.ts` ต้องเป็นไปตาม Error Handling convention ใน CLAUDE.md:
- return `{ status: "success" | "error" }` discriminated union
- ใช้ `normalizeError()` ใน catch block
- network error = `recoverable: true`
- missing/malformed data = log warning แต่ fallback เป็น empty array (ไม่ crash app)

---

## ไฟล์ที่ต้องสร้าง/แก้ไข (สรุป)

### สร้างใหม่
- `app/types/api-raw/chess.ts`
- `app/types/api-raw/trait.ts`
- `app/types/api-raw/equip.ts`
- `app/types/api-raw/lineup.ts`
- `app/utils/adapters/champion.ts`
- `app/utils/adapters/trait.ts`
- `app/utils/adapters/item.ts`
- `app/utils/adapters/lineup.ts`
- `app/composables/tft/useTftData.ts`
- `app/composables/tft/useChampions.ts`
- `app/composables/tft/useTraits.ts`
- `app/composables/tft/useItems.ts`
- `app/composables/tft/useLineups.ts`
- `app/plugins/tft-data.server.ts`

### แก้ไข
- `app/types/champion.ts` — ลบ `ChampionClass`, ปรับ `traits`, เพิ่ม `isHero`
- `app/types/trait.ts` — ไม่เปลี่ยน interface แต่ `id` ใช้ `checkId` แทน
- `app/types/item.ts` — `image?` → `imageUrl`
- `app/types/comp.ts` — เพิ่ม `quality`, เพิ่ม `unitPlacements`

### ลบ (Phase 6)
- `app/data/champions.ts`
- `app/data/traits.ts`
- `app/data/items.ts`
- `app/data/suggestedComps.ts`
- `app/data/index.ts`
