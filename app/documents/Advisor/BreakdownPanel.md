# AdvisorBreakdownPanel

> แสดง score breakdown แต่ละ dimension เป็น progress bar

**Type:** Pure
**Component:** `app/components/Advisor/BreakdownPanel.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `score` | `CompScore` | ✅ | — | ผลลัพธ์จาก `analyzeComp()` |

## Behavior

- แต่ละ dimension มี label, feedback text, และ progress bar
- สีของ bar: ≥80=green, ≥55=blue, ≥35=yellow, <35=red
- `data-testid="breakdown-panel"`

## Examples

### Default

```json
{ "score": { "total": 72, "grade": "B", "dimensions": [] } }
```

```vue
<AdvisorBreakdownPanel :score="score" />
```
