# BoardHexGrid

> Hex board 4×7 สำหรับวางแชมป์ — แสดง unit tokens ในตำแหน่งที่ถูกต้อง

**Type:** Smart (เรียก `useDragDrop()` และ `useTeamBuilder()`)
**Component:** `app/components/Board/HexGrid.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `board` | `TeamBoard` | ✅ | — | grid 4×7 ของ BoardCell |
| `unitCount` | `number` | ✅ | — | จำนวน unit ที่วางบนบอร์ด |
| `maxUnits` | `number` | ✅ | — | จำนวน unit สูงสุด (10) |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `cell-click` | `BoardPosition` | คลิก cell (เปิด detail หรือเลือก) |
| `remove` | `string` (unitId) | ลบ unit ออกจากบอร์ด |
| `clear` | — | ล้างบอร์ดทั้งหมด |

## Behavior

- แถวคี่จะ offset ไปทางขวา (hex grid offset pattern)
- แสดง unit count `x/10` และปุ่ม "ล้างบอร์ด" เมื่อมี unit
- จัดการสถานะ drag-over และส่งต่อ event ไปยัง `useDragDrop`
- จัดการการเพิ่ม/ลบไอเทมโดยเรียก `useTeamBuilder`
- `data-testid="hex-grid"`, `data-testid="clear-board-button"`

## Examples

### Default

```json
{
  "unitCount": 3,
  "maxUnits": 10
}
```

```vue
<BoardHexGrid :board="board" :unit-count="unitCount" :max-units="10" @cell-click="onCellClick" @remove="removeUnit" @clear="clearBoard" />
```
