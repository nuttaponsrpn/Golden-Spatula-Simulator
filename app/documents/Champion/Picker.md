# ChampionPicker

> Smart component สำหรับค้นหาและ filter แชมป์ก่อนเพิ่มลงบอร์ด

**Type:** Smart (เรียก `useChampions()`, `useSynergies()`, `useDragDrop()`)
**Component:** `app/components/Champion/Picker.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `isBoardFull` | `boolean` | ✅ | — | disable การเพิ่มแชมป์ใหม่เมื่อบอร์ดเต็ม |
| `isChampionOnBoard` | `(id: string) => boolean` | ✅ | — | ตรวจว่าแชมป์นี้อยู่บอร์ดแล้ว |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `select` | `string` (championId) | เมื่อคลิกการ์ดแชมป์ |

## Behavior

- เรียก `useChampions()`, `useSynergies()`, และ `useDragDrop()` ภายใน
- ช่องค้นหา filter ตามชื่อแบบ real-time
- Select dropdown 3 ตัว: **Cost** (1–5), **Class**, **Origin** — แสดงบน grid 3 คอลัมน์
- แชมป์ที่ **ไม่ตรงกับ filter** จะ grey-out (opacity ลดลง + grayscale) แต่ **ยังคงอยู่ใน grid** เสมอ
- แชมป์ที่ **ตรงกับ filter** แสดงปกติ
- รองรับการลาก (drag) แชมป์จากการ์ดเพื่อไปวางบนบอร์ด
- `data-testid="champion-picker"`, `data-testid="champion-search"`, `data-testid="champion-filter-selects"`, `data-testid="cost-filter"`, `data-testid="class-filter"`, `data-testid="origin-filter"`, `data-testid="champion-grid"`

## Examples

### Default

```json
{
  "isBoardFull": false
}
```

```vue
<ChampionPicker :is-board-full="isBoardFull" :is-champion-on-board="isChampionOnBoard" @select="addUnit" />
```
