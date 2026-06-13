# ElementBaseInput

> Text input พร้อม icon slot และ v-model support

**Type:** Pure
**Component:** `app/components/Element/BaseInput.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `modelValue` | `string` | ✅ | — | ค่าปัจจุบัน (v-model) |
| `placeholder` | `string` | — | — | placeholder text |
| `label` | `string` | — | — | aria-label override |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string` | เมื่อ input เปลี่ยนแปลง |

## Slots

| Name | Props | Description |
| --- | --- | --- |
| `icon` | — | icon ซ้ายมือของ input |

## Examples

### Default

```json
{ "modelValue": "", "placeholder": "ค้นหา..." }
```

```vue
<ElementBaseInput v-model="query" placeholder="ค้นหาแชมป์...">
  <template #icon><SearchIcon /></template>
</ElementBaseInput>
```
