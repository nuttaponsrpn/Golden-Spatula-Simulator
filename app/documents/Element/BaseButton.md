# BaseButton

> A reusable button component with variant support.

**Type:** Pure
**Component:** `app/components/Element/BaseButton.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `variant` | `'primary' | 'secondary'` | — | `'secondary'` | Visual style of the button |
| `disabled` | `boolean` | — | `false` | Whether the button is interactive |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `click` | — | Fired when the button is clicked |

## Examples

### Primary
```json
{
  "variant": "primary"
}
```

```vue
<ElementBaseButton variant="primary">Click Me</ElementBaseButton>
```
