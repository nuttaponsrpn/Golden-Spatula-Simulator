# ChampionDetailModal

> Smart modal แสดงรายละเอียดเต็มของแชมป์: portrait, ability, trait descriptions

**Type:** Smart
**Component:** `app/components/Champion/DetailModal.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `champion` | `Champion \| null` | ✅ | — | ข้อมูลแชมป์ที่จะแสดง |
| `visible` | `boolean` | ✅ | — | แสดง/ซ่อน modal |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `close` | — | ปิด modal |

## Behavior

- เรียก `useSynergies().getTraitById()` เพื่อดึงคำอธิบาย trait
- แสดง cost badge, portrait, ability section พร้อม `ability.iconUrl` (ถ้ามี) หรือ fallback เป็น SVG icon
- แสดง trait แต่ละรายการพร้อม `trait.imageUrl` (ถ้ามี) หรือ fallback เป็น SVG icon ตาม `trait.type`
- Trait แสดง badge บอก type: `origin` (สีเขียว) / `class` (สีเหลือง)

## Examples

### Default

```json
{ "visible": true }
```

```vue
<ChampionDetailModal :champion="selectedChampion" :visible="isOpen" @close="close" />
```
