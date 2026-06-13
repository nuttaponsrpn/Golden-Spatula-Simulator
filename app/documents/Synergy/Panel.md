# SynergyPanel

> แสดง trait activations ทั้งหมดที่ active บนบอร์ด พร้อม threshold progress

**Type:** Pure
**Component:** `app/components/Synergy/Panel.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `activations` | `SynergyActivation[]` | ✅ | — | ผลลัพธ์จาก `getSynergyActivations()` |

## Behavior

- เรียง active synergy ก่อน (tier สูงสุดขึ้นก่อน) แล้วตามด้วย inactive
- Inactive synergies แสดงด้วย opacity ลดลง
- แสดงข้อความ "เพิ่มแชมป์เพื่อดู synergy" เมื่อ activations ว่าง
- `data-testid="synergy-panel"`

## Examples

### Default

```json
{
  "activations": []
}
```

```vue
<SynergyPanel :activations="activations" />
```
