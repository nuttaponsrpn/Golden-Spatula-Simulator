# ElementBaseTag

> Colored pill tag สำหรับแสดง trait tier หรือ label

**Type:** Pure
**Component:** `app/components/Element/BaseTag.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `string` | ✅ | — | ข้อความใน tag |
| `color` | `"default" \| "bronze" \| "silver" \| "gold" \| "prismatic"` | — | `"default"` | สีของ tag |

## Examples

### Default

```json
{ "label": "Bronze", "color": "bronze" }
```

```vue
<ElementBaseTag label="Bronze" color="bronze" />
```
