# ChampionCard

> Champion tile แสดงเฉพาะภาพและชื่อแชมป์ — เน้นความประหยัดพื้นที่ ใช้ใน Champion Picker grid

**Type:** Pure
**Component:** `app/components/Champion/Card.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `champion` | `Champion` | ✅ | — | ข้อมูลแชมป์ |
| `isSelected` | `boolean` | — | `false` | highlight เมื่อถูกเลือก |
| `isInTeam` | `boolean` | — | `false` | ลดความสว่างเมื่ออยู่บนบอร์ดแล้ว |
| `disabled` | `boolean` | — | `false` | บล็อก interaction เมื่อบอร์ดเต็ม |
| `dimmed` | `boolean` | — | `false` | grey-out + grayscale เมื่อไม่ตรงกับ filter (ไม่ลบออกจาก grid) |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `select` | `string` (championId) | เมื่อผู้ใช้คลิกการ์ด |
| `drag-start` | `DragEvent`, `string` (id) | เริ่มลากการ์ด |
| `drag-end` | `DragEvent` | สิ้นสุดการลาก |

## Behavior

- แสดง portrait ของแชมป์ (ไม่มีขอบสีตามราคา)
- แสดงชื่อแชมป์ที่ด้านล่าง
- เน้นความกะทัดรัด ไม่มีกรอบนอกและ Padding เพื่อเพิ่มความหนาแน่นใน Grid
- สามารถลาก (draggable) เพื่อไปวางบนบอร์ดได้
- hover → แสดง `ChampionTooltip` ผ่าน `Teleport` ไปที่ `body` (ไม่ถูก overflow clip) ทางขวาของการ์ด หรือซ้ายถ้าชิดขอบขวาของ viewport
- หาก `isInTeam` = true → opacity ลดลงอย่างมาก (แชมป์อยู่บนบอร์ดแล้ว)
- หาก `disabled` = true → cursor-not-allowed, ไม่ emit, ไม่สามารถลากได้
- รองรับ touch target ≥ 44×44px
- `data-testid="champion-card"`

## Examples

### Default

```json
{
  "champion": { "id": "jinx", "name": "Jinx", "cost": 1, "traits": ["punk","marksman"], "class": "carry", "imageUrl": "/champions/jinx.webp", "ability": { "name": "Get Excited!", "description": "..." } }
}
```

```vue
<ChampionCard :champion="jinx" @select="onSelect" />
```
