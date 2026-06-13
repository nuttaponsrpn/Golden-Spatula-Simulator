# BoardSynergyBadge

> Badge แสดง synergy หนึ่งตัวบน board — สว่างเมื่อ active, ทึบเมื่อยังไม่ถึง threshold

**Type:** Pure  
**Component:** `app/components/Board/SynergyBadge.vue`

## Props

| Name         | Type                | Required | Default | Description                              |
| ------------ | ------------------- | -------- | ------- | ---------------------------------------- |
| `activation` | `SynergyActivation` | ✅       | —       | ข้อมูล synergy activation จาก useSynergies |

## Emits

_None_

## Slots

_None_

## Behavior

- แสดงรูปภาพ trait + ชื่อ + `activeCount/nextThresholdCount`
- ถ้า `activeTier !== null` → สว่างปกติ พร้อม glow ตาม tier (bronze/silver/gold/prismatic)
- ถ้า `activeTier === null` → opacity 40% ทึบ
- `nextThresholdCount` คือ threshold ถัดไปที่ยังไม่ถึง หรือ threshold ปัจจุบันถ้า maxed แล้ว
- `data-testid="synergy-badge-{traitId}"`

## Examples

### Active synergy

```json
{
  "activation": {
    "trait": { "id": "t1", "name": "Rebel", "imageUrl": "/traits/rebel.png", "thresholds": [{ "count": 2, "tier": "bronze", "bonus": "+150 HP" }] },
    "activeCount": 3,
    "activeTier": "bronze",
    "activeThreshold": { "count": 2, "tier": "bronze", "bonus": "+150 HP" },
    "nextThreshold": null,
    "contributingUnitIds": ["u1", "u2", "u3"]
  }
}
```

```vue
<BoardSynergyBadge :activation="activation" />
```
