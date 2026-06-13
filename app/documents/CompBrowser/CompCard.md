# CompBrowserCompCard

> Card แสดงข้อมูล team composition พร้อมปุ่ม Load เพื่อโหลดลงบอร์ด

**Type:** Pure
**Component:** `app/components/CompBrowser/CompCard.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `comp` | `SuggestedComp` | ✅ | — | ข้อมูล composition |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `load` | `SuggestedComp` | เมื่อกดปุ่ม Load |

## Behavior

- แสดงชื่อ, ระดับความยาก (ง่าย/ปานกลาง/ยาก), คำอธิบาย
- Portrait แชมป์สูงสุด 9 ตัว พร้อม cost color border
- Key traits จาก `CompBrowserTraitSummary`
- Playstyle hint แสดงเป็น italic
- `data-testid="comp-card"`

## Examples

### Default

```json
{
  "comp": { "id": "rebel-sorcerer", "name": "Rebel Sorcerers", "description": "...", "championIds": ["jinx","vi","ekko"], "keyTraits": ["rebel","sorcerer"], "difficulty": "medium", "playstyle": "Fast-8 reroll" }
}
```

```vue
<CompBrowserCompCard :comp="comp" @load="onLoadComp" />
```
