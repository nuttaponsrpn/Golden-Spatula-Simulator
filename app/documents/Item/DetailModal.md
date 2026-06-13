# ItemDetailModal

> Modal แสดงรายละเอียดของ item ที่ใส่ในตัวละครบน board พร้อมปุ่มนำออกที่มุมซ้ายล่าง

**Type:** Pure
**Component:** `app/components/Item/DetailModal.vue`

## Props

| Name      | Type        | Required | Default | Description                          |
| --------- | ----------- | -------- | ------- | ------------------------------------ |
| `item`    | `Item\|null` | ✅       | —       | Item ที่จะแสดง — null = modal ว่างเปล่า |
| `visible` | `boolean`   | ✅       | —       | เปิด/ปิด modal                        |

## Emits

| Event    | Payload | Description                                              |
| -------- | ------- | -------------------------------------------------------- |
| `close`  | —       | ปิด modal (กด × หรือ backdrop)                           |
| `remove` | —       | ลบ item ออกจาก slot — จะ emit `close` ตามมาอัตโนมัติ     |

## Behavior

- ใช้ `ElementBaseModal` เป็น wrapper
- แสดง icon, ชื่อ, category badge พร้อม color ตาม type
- ถ้า item มี `components` → แสดง recipe (icon + ชื่อ component ทั้งสอง)
- ถ้า item มี `stats` → แสดงตารางค่า stat สีเหลือง
- ถ้า item มี `effect` → แสดงข้อความ effect; fallback เป็น `description`
- ปุ่ม "นำออก" อยู่มุมซ้ายล่าง — emit `remove` แล้วปิด modal ทันที
- `data-testid="item-detail-remove"` ที่ปุ่มลบ

## Examples

### Occupied Item

```json
{
  "item": {
    "id": "rabadons",
    "name": "Rabadon's Deathcap",
    "description": "Increases Ability Power",
    "stats": [{ "value": "+50", "name": "Ability Power" }],
    "effect": "Increases the holder's total Ability Power by 40%.",
    "imageUrl": "/items/rabadons.png",
    "category": "combined",
    "components": ["needlessly-large-rod", "needlessly-large-rod"]
  },
  "visible": true
}
```

```vue
<ItemDetailModal :item="item" :visible="true" @close="onClose" @remove="onRemove" />
```
