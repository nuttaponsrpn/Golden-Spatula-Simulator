# SynergyThresholdPips

> แสดง threshold milestones ของ trait พร้อม highlight tier ที่ active

**Type:** Pure
**Component:** `app/components/Synergy/ThresholdPips.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `thresholds` | `TraitThreshold[]` | ✅ | — | threshold ทั้งหมดของ trait |
| `currentCount` | `number` | ✅ | — | จำนวน unit ปัจจุบัน |

## Behavior

- แต่ละ pip แสดง count ของ threshold นั้น
- Active pip จะมีสี tier (bronze/silver/gold/prismatic)
- Tooltip = bonus description

## Examples

### Default

```json
{ "thresholds": [{ "count": 2, "tier": "bronze", "bonus": "20 AP" }, { "count": 4, "tier": "silver", "bonus": "50 AP" }], "currentCount": 2 }
```

```vue
<SynergyThresholdPips :thresholds="thresholds" :current-count="2" />
```
