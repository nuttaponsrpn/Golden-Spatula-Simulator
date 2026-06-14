# BoardUnitToken

> Champion token บนบอร์ด — แสดง portrait, cost ring, ชื่อ, และปุ่มลบ (hover)

**Type:** Smart (เรียก `useChampions().getChampionById()` และ `useDragDrop()`)
**Component:** `app/components/Board/UnitToken.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `unit` | `TeamUnit` | ✅ | — | unit บนบอร์ด |
| `readOnly` | `boolean` | — | `false` | ปิด drag และใช้ eager loading — ใช้ใน preview context |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `remove` | `string` (unitId) | เมื่อกดปุ่มลบ |

## Behavior

- แสดงปุ่มลบเมื่อ hover
- สามารถลาก (draggable) เพื่อย้ายตำแหน่งหรือสลับแชมป์บนบอร์ด — ถูกปิดเมื่อ `readOnly`
- ชื่อแชมป์แสดงที่ด้านล่างพร้อม gradient overlay
- Cost badge มุมบนขวา
- `data-testid="unit-token"`, `data-testid="remove-unit-button"`
- @mousedown.stop บนปุ่มลบเพื่อป้องกันการเริ่ม drag เมื่อตั้งใจจะกดลบ

## Examples

### Default

```json
{ "unit": { "id": "uuid-1", "championId": "jinx", "position": { "row": 3, "col": 0 } } }
```

```vue
<BoardUnitToken :unit="unit" @remove="removeUnit" />
```
