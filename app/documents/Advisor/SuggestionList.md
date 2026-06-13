# AdvisorSuggestionList

> แสดงรายการคำแนะนำ AI สำหรับปรับปรุง team composition

**Type:** Pure
**Component:** `app/components/Advisor/SuggestionList.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `suggestions` | `string[]` | ✅ | — | คำแนะนำจาก `getSuggestions()` |

## Behavior

- แสดง bullet list พร้อม gold arrow icon
- ถ้า suggestions ว่าง → "ไม่มีคำแนะนำ"
- `data-testid="suggestion-list"`

## Examples

### Default

```json
{ "suggestions": ["เพิ่ม Tank อย่างน้อย 2 ตัว"] }
```

```vue
<AdvisorSuggestionList :suggestions="suggestions" />
```
