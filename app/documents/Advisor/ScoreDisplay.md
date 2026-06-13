# AdvisorScoreDisplay

> แสดงคะแนนรวมและ grade (S/A/B/C/D) ของ team composition

**Type:** Pure
**Component:** `app/components/Advisor/ScoreDisplay.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `score` | `CompScore` | ✅ | — | ผลลัพธ์จาก `analyzeComp()` |

## Behavior

- Grade circle มีสีตาม tier: S=prismatic, A=gold, B=green, C=blue, D=gray
- แสดงคะแนน 0-100 และ grade letter
- `data-testid="score-display"`

## Examples

### Default

```json
{
  "score": { "total": 72, "grade": "B", "dimensions": [] }
}
```

```vue
<AdvisorScoreDisplay :score="score" />
```
