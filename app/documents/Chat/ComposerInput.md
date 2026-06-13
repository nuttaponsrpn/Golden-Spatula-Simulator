# ChatComposerInput

> Text input for composing chat messages. Submits on Enter; Shift+Enter inserts a newline.

**Type:** Pure
**Component:** `app/components/Chat/ComposerInput.vue`

## Props

| Name       | Type      | Required | Default | Description                                    |
| ---------- | --------- | -------- | ------- | ---------------------------------------------- |
| `disabled` | `boolean` | ✅       | —       | Disables input and send button while streaming |

## Emits

| Event    | Payload       | Description                                        |
| -------- | ------------- | -------------------------------------------------- |
| `submit` | `string` (text) | Fired with trimmed text when user submits message |

## Slots

None.

## Behavior

- `<textarea>` with auto-resize: expands up to `max-h-40` as user types.
- `Enter` → submit (calls `emit("submit", text)`, clears input).
- `Shift+Enter` → inserts a newline without submitting.
- Submit button is disabled when `disabled` is true or when input is empty/whitespace.
- Minimum height 44px to meet touch target requirements.
- `data-testid="chat-composer"` on the textarea, `data-testid="chat-send-button"` on the button.

## Examples

### Default

```json
{
  "disabled": false
}
```

```vue
<ChatComposerInput :disabled="isStreaming" @submit="onSubmit" />
```
