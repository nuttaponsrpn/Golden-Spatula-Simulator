# ItemSlot

> Renders a single item slot for a champion.

**Type:** Pure
**Component:** `app/components/Item/ItemSlot.vue`

## Props

| Name   | Type       | Required | Default | Description       |
| ------ | ---------- | -------- | ------- | ----------------- |
| `item` | `ItemSlot` | ✅       | —       | The item in the slot |

## Emits

| Event    | Payload       | Description                                |
| -------- | ------------- | ------------------------------------------ |
| `drop`   | `Item`        | Fired when an item is dropped into the slot |
| `remove` | —             | Fired when the remove button is clicked    |

## Behavior

- Empty slot shows a `+` placeholder.
- Occupied slot shows the item image or the first letter of the name as a fallback.
- Highlights when an item is dragged over the slot.
- Shows a red remove button on hover when occupied.

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
    "description": "+10% Attack Damage"
  }
}
```

```vue
<ItemSlot :item="item" @remove="onRemove" />
```
