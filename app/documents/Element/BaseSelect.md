# ElementBaseSelect

> Custom dropdown select with keyboard-accessible listbox pattern. Supports icons per option and disabled options.

**Type:** Pure
**Component:** `app/components/Element/BaseSelect.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `modelValue` | `string \| number \| null` | ✅ | — | Currently selected value |
| `options` | `Option[]` | ✅ | — | List of selectable options |
| `placeholder` | `string` | — | — | Shown when no value is selected |
| `ariaLabel` | `string` | — | — | Accessible label for the trigger button |

### `Option` shape

| Field | Type | Description |
| --- | --- | --- |
| `value` | `string \| number` | Unique identifier for the option |
| `label` | `string` | Display text |
| `icon` | `string` | Optional image URL shown before the label |
| `disabled` | `boolean` | Grays out the option and prevents selection |

## Emits

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string \| number \| null` | Fired when the user selects a non-disabled option |

## Slots

None.

## Behavior

- Disabled options are rendered with `text-gray-600` and `cursor-not-allowed`; clicking them does nothing.
- Click outside the dropdown closes it.
- `aria-disabled` is set on disabled `<li>` elements.

## Examples

### Default

```json
{
  "modelValue": "gemini",
  "options": [
    { "value": "claude", "label": "Claude (Anthropic)" },
    { "value": "gemini", "label": "Gemini (Google)" },
    { "value": "copilot", "label": "Copilot / OpenAI-compatible", "disabled": true }
  ]
}
```

```vue
<ElementBaseSelect :model-value="kind" :options="providerOptions" @update:model-value="kind = $event" />
```
