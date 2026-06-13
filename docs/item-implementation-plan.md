# Item Implementation Plan

> Each occupied hexagon cell on the board will display 3 item slots below the champion portrait. Items can be dragged from an item picker and dropped into any available slot.

---

## Overview

Items are equipment that players assign to champions. Each champion can hold up to **3 items**. Items are sourced from an item picker panel and placed onto champion slots via drag-and-drop.

---

## Step 1 — Types (`app/types/item.ts`)

Create a new type file for items.

```ts
// app/types/item.ts

export interface Item {
  id: string;
  name: string;
  description: string;
  image?: string;
  components?: [string, string]; // IDs of the two component items that combine into this
}

export type ItemSlot = Item | null;
export type UnitItems = [ItemSlot, ItemSlot, ItemSlot]; // fixed 3-slot tuple
```

### Update `app/types/team.ts`

Add `items` to `TeamUnit`:

```ts
export interface TeamUnit {
  id: string;
  championId: string;
  position: BoardPosition;
  items: UnitItems; // add this field
}
```

---

## Step 2 — Data (`app/data/items.ts`)

Populate a list of TFT Set 14 items. Each entry maps to the `Item` interface.

Examples:
- Component items: B.F. Sword, Chain Vest, Needlessly Large Rod, Tear of the Goddess, Giant's Belt, Recurve Bow, Sparring Gloves, Negatron Cloak
- Combined items: Infinity Edge, Warmog's Armor, Rabadon's Deathcap, etc.

```ts
// app/data/items.ts
import type { Item } from '~/types/item';

export const items: Item[] = [
  {
    id: 'bf-sword',
    name: "B.F. Sword",
    description: "+10 Attack Damage",
  },
  // ... more items
];
```

---

## Step 3 — Drag Type (`app/types/drag.ts`)

Extend `DragSourceKind` to include item dragging:

```ts
export type DragSourceKind = "picker" | "board" | "item-picker";

export interface DragPayload {
  kind: DragSourceKind;
  championId?: string;
  unitId?: string;
  itemId?: string; // add this field
}
```

---

## Step 4 — New Components

### `app/components/Item/ItemSlot.vue` (Pure)

Renders a single item slot.

- **Props:** `item: ItemSlot`
- **Emits:** `drop(item: Item)`, `remove()`
- **Behavior:**
  - Empty slot: shows a `+` placeholder, accepts drag-over highlight
  - Occupied slot: shows the item image (or name initial as fallback)
  - Shows a remove button on hover when occupied

**Documents:** `app/documents/Item/ItemSlot.md`

---

### `app/components/Item/ItemSlots.vue` (Pure)

Renders the row of 3 item slots beneath a champion.

- **Props:** `items: UnitItems`
- **Emits:** `item-drop(slotIndex: 0 | 1 | 2, item: Item)`, `item-remove(slotIndex: 0 | 1 | 2)`
- **Behavior:**
  - Renders three `<ItemItemSlot>` in a horizontal row
  - Passes slot data down and bubbles events up

**Documents:** `app/documents/Item/ItemSlots.md`

---

### `app/components/Item/Picker.vue` (Smart)

Panel listing all available items.

- **Behavior:**
  - Reads from `app/data/items.ts`
  - Each item card is draggable (`DragSourceKind = "item-picker"`)
  - Emits `item-drag-start(item: Item)`

**Documents:** `app/documents/Item/Picker.md`

---

## Step 5 — Modify Existing Components

### `app/components/Board/UnitToken.vue`

Add `ItemSlots` below the champion portrait.

- Add prop: `items: UnitItems`
- Render `<ItemItemSlots>` at the bottom of the token
- Bubble up `item-drop` and `item-remove` emits

### `app/components/Board/HexCell.vue`

Pass `unit.items` down into `UnitToken`.

- Add prop forwarding: `items` → `UnitToken`
- Bubble up `item-drop(unitId, slotIndex, item)` and `item-remove(unitId, slotIndex)` to `HexGrid`

### `app/components/Board/HexGrid.vue`

Wire item events into `useTeamBuilder`.

- Handle `item-drop` → call `addItemToUnit(unitId, slotIndex, item)`
- Handle `item-remove` → call `removeItemFromUnit(unitId, slotIndex)`

---

## Step 6 — Update `useTeamBuilder.ts`

Add item management methods and initialize `items` on `addUnit`.

```ts
// Initialize items when adding a unit
const addUnit = (championId: string, position?: BoardPosition) => {
  const unit: TeamUnit = {
    id: generateId(),
    championId,
    position: resolvedPosition,
    items: [null, null, null], // initialize empty
  };
  // ...
};

const addItemToUnit = (unitId: string, slotIndex: 0 | 1 | 2, item: Item): void => {
  // find unit → set items[slotIndex] = item
};

const removeItemFromUnit = (unitId: string, slotIndex: 0 | 1 | 2): void => {
  // find unit → set items[slotIndex] = null
};
```

---

## Step 7 — Update `useDragDrop.ts`

Add drag handlers for items.

```ts
const onItemDragStart = (event: DragEvent, item: Item): void => {
  const payload: DragPayload = { kind: "item-picker", itemId: item.id };
  event.dataTransfer?.setData("application/tft-drag", JSON.stringify(payload));
};

const onItemSlotDrop = (event: DragEvent, unitId: string, slotIndex: 0 | 1 | 2): void => {
  const raw = event.dataTransfer?.getData("application/tft-drag");
  if (!raw) return;
  const payload: DragPayload = JSON.parse(raw);
  if (payload.kind !== "item-picker" || !payload.itemId) return;
  const item = getItemById(payload.itemId);
  if (item) addItemToUnit(unitId, slotIndex, item);
};
```

---

## Step 8 — Documentation Files

Create paired `.md` files in `app/documents/` for every new component:

| Component | Document |
| --- | --- |
| `app/components/Item/ItemSlot.vue` | `app/documents/Item/ItemSlot.md` |
| `app/components/Item/ItemSlots.vue` | `app/documents/Item/ItemSlots.md` |
| `app/components/Item/Picker.vue` | `app/documents/Item/Picker.md` |

Update existing documents for `UnitToken`, `HexCell`, and `HexGrid` to reflect new props/emits.

---

## Visual Layout

```
┌─────────────┐
│   [image]   │
│  Champion   │
│  Name ───── │
├─────────────┤
│ [▪] [▪] [▪] │  ← 3 item slots
└─────────────┘
```

Each slot:
- Empty: dim background, `+` icon, highlights on drag-over
- Occupied: item image (24×24px), remove button on hover

---

## Implementation Order

| # | Task | Files |
|---|------|-------|
| 1 | Add `Item`, `ItemSlot`, `UnitItems` types | `types/item.ts`, `types/team.ts` |
| 2 | Add item data | `data/items.ts` |
| 3 | Extend drag payload type | `types/drag.ts` |
| 4 | Build `ItemSlot.vue` + doc | `components/Item/`, `documents/Item/` |
| 5 | Build `ItemSlots.vue` + doc | `components/Item/`, `documents/Item/` |
| 6 | Update `UnitToken.vue` | `components/Board/UnitToken.vue` |
| 7 | Update `HexCell.vue` | `components/Board/HexCell.vue` |
| 8 | Update `HexGrid.vue` | `components/Board/HexGrid.vue` |
| 9 | Add item methods to `useTeamBuilder` | `composables/tft/useTeamBuilder.ts` |
| 10 | Add item drag handlers to `useDragDrop` | `composables/tft/useDragDrop.ts` |
| 11 | Build `Item/Picker.vue` + doc | `components/Item/`, `documents/Item/` |
| 12 | Update docs for modified components | `documents/Board/` |
