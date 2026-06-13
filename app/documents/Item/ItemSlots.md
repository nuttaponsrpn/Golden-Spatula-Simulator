# ItemSlots

> Renders a row of 3 item slots for a champion.

**Type:** Pure
**Component:** `app/components/Item/ItemSlots.vue`

## Props

| Name    | Type        | Required | Default | Description             |
| ------- | ----------- | -------- | ------- | ----------------------- |
| `items` | `UnitItems` | ✅       | —       | Tuple of 3 item slots   |

## Emits

| Event         | Payload                             | Description                                    |
| ------------- | ----------------------------------- | ---------------------------------------------- |
| `item-drop`   | `slotIndex: 0\|1\|2, item: Item` | Fired when an item is dropped into any slot    |
| `item-remove` | `slotIndex: 0\|1\|2`                | Fired when an item is removed from any slot    |

## Behavior

- Renders three `<ItemSlot>` components in a horizontal row.
- Maps each slot to its corresponding item in the `items` array.
- Bubbles up events from child `ItemSlot` components with the appropriate index.

## Examples

### Default (Empty)

```json
{
  "items": [null, null, null]
}
```

```vue
<ItemSlots :items="items" @item-drop="onItemDrop" @item-remove="onItemRemove" />
```
