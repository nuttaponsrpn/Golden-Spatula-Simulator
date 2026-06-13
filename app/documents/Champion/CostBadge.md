# ChampionCostBadge

> Circular badge แสดง cost tier ของแชมป์พร้อมสีที่กำหนด

**Type:** Pure
**Component:** `app/components/Champion/CostBadge.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `cost` | `ChampionCost` (1-5) | ✅ | — | cost tier ของแชมป์ |

## Behavior

- 1=gray, 2=green, 3=blue, 4=purple, 5=gold
- Size: 20×20px

## Examples

### Default

```json
{ "cost": 3 }
```

```vue
<ChampionCostBadge :cost="3" />
```
