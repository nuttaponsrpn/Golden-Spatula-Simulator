# ItemSlot

> Renders a single item slot for a champion.

**Type:** Pure
**Component:** `app/components/Item/ItemSlot.vue`

## Props

| Name   | Type       | Required | Default | Description       |
| ------ | ---------- | -------- | ------- | ----------------- |
| `item` | `ItemSlot` | ✅       | —       | The item in the slot |

## Emits

| Event         | Payload | Description                                        |
| ------------- | ------- | -------------------------------------------------- |
| `drop`        | `Item`  | Fired when an item is dropped into the slot        |
| `open-detail` | —       | Fired when an occupied slot is clicked — parent opens the detail modal |

## Behavior

- Empty slot shows a `+` placeholder.
- Occupied slot shows the item image or the first letter of the name as a fallback.
- Highlights when an item is dragged over (`isOver`).
- Clicking an occupied slot emits `open-detail` — the remove action lives in `ItemDetailModal`, not here.
- Hit area is expanded via `.touch-target::after { inset: -8px }` for mobile.

## Examples

### Empty Slot

```json
{
  "item": null
}
```

```vue
<ItemSlot :item="null" @drop="onDrop" />
```

### Occupied Slot

```json
{
  "item": {
    "id": "bf-sword",
    "name": "B.F. Sword",
    "description": "+10% Attack Damage",
    "stats": [],
    "effect": "",
    "imageUrl": "",
    "category": "basic"
  }
}
```

```vue
<ItemSlot :item="item" @drop="onDrop" @open-detail="onOpenDetail" />
```
