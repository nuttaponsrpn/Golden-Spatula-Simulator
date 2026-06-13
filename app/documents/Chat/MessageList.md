# ChatMessageList

> Scrollable list of chat messages. Auto-scrolls to the bottom when new messages arrive or while streaming.

**Type:** Pure
**Component:** `app/components/Chat/MessageList.vue`

## Props

| Name               | Type              | Required | Default | Description                                                  |
| ------------------ | ----------------- | -------- | ------- | ------------------------------------------------------------ |
| `messages`         | `ChatMessage[]`   | ✅       | —       | All messages for the current session                         |
| `streamingMessage` | `string \| null`  | ✅       | —       | Live token stream; non-null while AI is responding           |

## Emits

None.

## Slots

None.

## Behavior

- Renders a `ChatMessageBubble` for each message in `messages`.
- When `streamingMessage` is non-null, renders an additional AI bubble at the bottom with the streaming text. Shows a typing indicator (three bouncing dots) when the string is empty.
- Auto-scrolls to bottom on every change to `messages.length` or `streamingMessage` via a `watch` + `nextTick`.
- `data-testid="chat-message-list"`

## Examples

### Default

```json
{
  "messages": [],
  "streamingMessage": null
}
```

```vue
<ChatMessageList
  class="flex-1 min-h-0"
  :messages="messages"
  :streaming-message="isStreaming ? streamingContent : null"
/>
```
