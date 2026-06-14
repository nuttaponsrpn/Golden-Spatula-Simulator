# ThinkingPanel

> Expandable panel showing tool-call steps the AI agent performed while thinking. Collapses by default; user can open to inspect inputs and result summaries.

**Type:** Pure
**Component:** `app/components/Chat/ThinkingPanel.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `steps` | `ToolCallStep[]` | ✅ | — | List of tool call steps to display |
| `isStreaming` | `boolean` | ✅ | — | When true, shows a spinner on pending steps |

## Emits

(none)

## Slots

(none)

## Behavior

- Collapsed by default using a native `<details>` element
- Shows step count in summary: "Thinking (3 steps)"
- Displays a spinner next to the summary when `isStreaming` is true and any step has `status === "pending"`
- Each step row: status icon (⏳/✓/✗), tool name, compact input JSON
- When expanded: shows `resultSummary` under each step if available
- Non-DeepAgents providers produce no tool calls — parent renders this only when `steps.length > 0`

## Examples

### Default

```json
{
  "steps": [
    { "id": "1", "toolName": "get_champions", "input": { "trait_id": "402" }, "resultSummary": "Found 6 champions", "status": "done" },
    { "id": "2", "toolName": "get_traits", "input": { "trait_id": "402" }, "resultSummary": "Thresholds: 3/5/7", "status": "done" }
  ],
  "isStreaming": false
}
```

```vue
<ChatThinkingPanel :steps="message.toolCalls" :is-streaming="message.status === 'streaming'" />
```
