# ChatBoardPreview

> Read-only board display for the Chat page. Shows a TFT hex grid with placed units but no drag-drop or editing interaction.

**Type:** Pure
**Component:** `app/components/Chat/BoardPreview.vue`

## Props

| Name        | Type        | Required | Default | Description                           |
| ----------- | ----------- | -------- | ------- | ------------------------------------- |
| `board`     | `TeamBoard` | ✅       | —       | 4×7 grid of cells, computed from units |
| `unitCount` | `number`    | ✅       | —       | Number of units currently on the board |

## Emits

None — read-only component.

## Slots

None.

## Behavior

- Renders the same 4×7 hex grid layout as `BoardHexGrid`, using the same `BOARD_WIDTH=659` / `BOARD_HEIGHT=470` constants and `ResizeObserver`-based scale.
- All drag-and-drop event handlers on `BoardHexCell` are bound to no-ops (`() => {}`). No `useDragDrop()` or `useTeamBuilder()` is called.
- Does NOT show the "ล้างบอร์ด" (clear board) button.
- `data-testid="chat-board-preview"`

## Examples

### Default

```json
{
  "board": "...",
  "unitCount": 7
}
```

```vue
<ChatBoardPreview :board="previewBoard" :unit-count="units.length" />
```

## Notes

- Intentionally does not reuse `BoardHexGrid` because that component is Smart and wires drag/drop on mount, which would mutate the main board's shared state.
- The `board` prop must be computed externally from a `PlacedUnits` array — see `ChatBoardPreviewPanel` for the pattern.
