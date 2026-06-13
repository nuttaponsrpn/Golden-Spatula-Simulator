# DeleteZone

> A floating drop target that appears at the bottom of the screen when the user is dragging a board unit. Dropping a unit here removes it from the team.

**Type:** Smart  
**Component:** `app/components/Board/DeleteZone.vue`

## Props

_None_

## Emits

| Event    | Payload       | Description                              |
| -------- | ------------- | ---------------------------------------- |
| `remove` | `string` (unitId) | Fired when a board unit is dropped onto the zone |

## Slots

_None_

## Behavior

- Visible only while `isDraggingUnit` (from `useDragDrop`) is `true` — hidden otherwise
- Slides in from the bottom with a fade transition when drag starts; slides out when drag ends
- Scales up and changes color when the dragged item is hovering directly over the zone
- Accepts drops only from `kind === "board"` payloads; ignores picker and item drags
- `data-testid="delete-zone"`

## Examples

### Default (rendered inside HexGrid)

```json
{}
```

```vue
<BoardDeleteZone @remove="onRemoveUnit" />
```
