# ItemPicker

> Panel listing all available items for dragging onto champions.

**Type:** Smart
**Component:** `app/components/Item/Picker.vue`

## Behavior

- Reads the full list of items from `app/data/items.ts`.
- Each item is rendered as a square card.
- Supports drag-and-drop using `useDragDrop().onItemDragStart`.
- Shows a rich tooltip on hover: item icon + name, component icons (if combined/radiant), parsed stats (`ItemStat[]`), and passive effect text (`effect`).

## Examples

### Default

```json
{}
```

```vue
<ItemPicker />
```
