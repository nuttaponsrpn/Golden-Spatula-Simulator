# BoardHexCell

> Single hex cell — empty หรือ occupied โดย UnitToken

**Type:** Pure
**Component:** `app/components/Board/HexCell.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `cell` | `BoardCell` | ✅ | — | discriminated union: empty หรือ occupied |
| `isDragOver` | `boolean` | — | `false` | แสดง highlight เมื่อมีการลาก unit มาวางทับ |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `click` | `BoardPosition` | คลิก cell |
| `remove` | `string` (unitId) | ลบ unit |
| `drag-enter` | `BoardPosition` | เริ่มลากมาวางทับ |
| `drag-over` | `BoardPosition`, `DragEvent` | ลากค้างไว้บน cell |
| `drag-leave` | `BoardPosition`, `DragEvent` | ลากออกจาก cell |
| `drop` | `BoardPosition`, `DragEvent` | ปล่อย unit ลงบน cell |
| `item-drop` | `unitId: string, slotIndex: 0\|1\|2, item: Item` | เมื่อวางไอเทมลงใน unit |
| `item-remove` | `unitId: string, slotIndex: 0\|1\|2` | เมื่อลบไอเทมออกจาก unit |

## Behavior

- ถ้า `cell.status === "occupied"` → render `BoardUnitToken`
- แสดง 3 ไอเทมสล็อตที่ด้านล่างของ Hexagon (แสดงตลอดเวลาแม้ไม่มี Hero)
- Clip-path hex shape จาก `.hex-cell` class
- `data-testid="hex-cell-{row}-{col}"`
- แสดง indigo ring highlight เมื่อ `isDragOver` เป็น true

## Examples

### Default

```json
{ "cell": { "status": "empty", "position": { "row": 0, "col": 0 } } }
```

```vue
<BoardHexCell :cell="cell" @click="onCellClick" @remove="onRemove" />
```
