# ChatMessageBubble

> Renders a single chat message as a styled bubble. User messages appear on the right; AI messages appear on the left.

**Type:** Pure
**Component:** `app/components/Chat/MessageBubble.vue`

## Props

| Name      | Type          | Required | Default | Description              |
| --------- | ------------- | -------- | ------- | ------------------------ |
| `message` | `ChatMessage` | ✅       | —       | The message to display   |

## Emits

None.

## Slots

None.

## Behavior

- `role === "user"` → right-aligned, `bg-cost-5` background, dark text.
- `role === "assistant"` → left-aligned, `bg-gray-800` background, light text.
- `status === "streaming"` with empty content → shows three bouncing dots typing indicator.
- Content is rendered with `whitespace-pre-wrap break-words` to preserve line breaks and avoid overflow.
- When `message.boardSnapshot` contains units, a hero avatar strip is shown above the Board Data accordion. Each avatar is a circular image bordered by the champion's cost color (gray/green/blue/purple/yellow for cost 1–5), with the champion name truncated below.
- `data-testid="chat-message-bubble"`

## Examples

### Default

```json
{
  "message": {
    "id": "1",
    "sessionId": "s1",
    "role": "user",
    "content": "ช่วยจัดทีมให้หน่อย",
    "timestamp": 1718000000000,
    "status": "done"
  }
}
```

```vue
<ChatMessageBubble :message="msg" />
```
