# ChatMessageList

> Scrollable list of chat messages. Auto-scrolls to the bottom when new messages arrive or while streaming.

**Type:** Pure
**Component:** `app/components/Chat/MessageList.vue`

## Props

| Name                  | Type                              | Required | Default | Description                                                              |
| --------------------- | --------------------------------- | -------- | ------- | ------------------------------------------------------------------------ |
| `messages`            | `ChatMessage[]`                   | ✅       | —       | All messages for the current session                                     |
| `streamingMessage`    | `string \| null`                  | ✅       | —       | Live token stream; non-null while AI is responding                       |
| `streamingToolCalls`  | `ToolCallStep[]`                  | ✅       | —       | Tool invocation steps shown in the thinking panel during DeepAgents runs |
| `streamingStage`      | `{ stage: string; label: string } \| null` | ✅ | —  | Current pipeline stage; drives the stage icon and color in the typing indicator |

## Emits

None.

## Slots

None.

## Behavior

- Renders a `ChatMessageBubble` for each completed message in `messages` (streaming messages are excluded from `completedMessages`).
- When `streamingMessage` is non-null, renders an additional AI bubble at the bottom with the streaming text.
- When `streamingMessage` is empty/null but `streamingToolCalls` or `streamingStage` is present, shows a typing indicator (three bouncing dots) with the current stage label.
- Stage indicator shows a colored icon + Thai label determined by `streamingStage.stage`:
  - `router` → 🔍 blue
  - `propose` → 💡 yellow
  - `plan` / `planner` → 📋 purple
  - `builder` → 🔨 orange
  - `answer` → 💬 green
  - `clarify` → ❓ sky
  - unknown → ⚙️ gray
- Auto-scrolls to bottom on every change to `messages.length`, `streamingMessage`, or `streamingToolCalls.length` via a `watch` + `nextTick`.
- `data-testid="chat-message-list"`

## Examples

### Default

```json
{
  "messages": [],
  "streamingMessage": null,
  "streamingToolCalls": [],
  "streamingStage": null
}
```

```vue
<ChatMessageList
  class="flex-1 min-h-0"
  :messages="messages"
  :streaming-message="isStreaming ? streamingContent : null"
  :streaming-tool-calls="streamingToolCalls"
  :streaming-stage="streamingStage"
/>
```
