# ElementBaseModal

> Accessible modal overlay shell — ใช้ wrapping content ใน dialog

**Type:** Pure
**Component:** `app/components/Element/BaseModal.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `visible` | `boolean` | ✅ | — | แสดง/ซ่อน modal |
| `title` | `string` | ✅ | — | หัวข้อ modal |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `close` | — | เมื่อคลิก backdrop หรือปุ่ม × |

## Slots

| Name | Props | Description |
| --- | --- | --- |
| `default` | — | เนื้อหาของ modal |

## Behavior

- ใช้ `<Teleport to="body">` เพื่อหลีกเลี่ยง z-index issues
- คลิก backdrop → emit `close`
- `role="dialog"`, `aria-modal="true"`, `aria-label` จาก title
- `data-testid="modal-content"`

## Examples

### Default

```json
{ "visible": true, "title": "Champion Detail" }
```

```vue
<ElementBaseModal :visible="isOpen" title="Champion Detail" @close="close">
  <p>Content here</p>
</ElementBaseModal>
```
