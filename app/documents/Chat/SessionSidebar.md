# ChatSessionSidebar

> Lists past chat sessions and provides a "New Chat" button. Shown as a static sidebar on desktop and as a collapsible drawer on mobile.

**Type:** Smart (receives data as props — session state is managed by the parent page)
**Component:** `app/components/Chat/SessionSidebar.vue`

## Props

| Name              | Type                                           | Required | Default | Description                              |
| ----------------- | ---------------------------------------------- | -------- | ------- | ---------------------------------------- |
| `sessions`        | `{ id: string; title: string; updatedAt: number }[]` | ✅ | —   | List of sessions sorted by `updatedAt` descending |
| `activeSessionId` | `string \| null`                               | ✅       | —       | ID of the currently open session         |

## Emits

| Event    | Payload              | Description                                       |
| -------- | -------------------- | ------------------------------------------------- |
| `select` | `string` (sessionId) | Fired when the user clicks a session row          |
| `new`    | —                    | Fired when the user clicks "ใหม่"                 |
| `delete` | `string` (sessionId) | Fired when the user clicks the trash icon on a row |

## Slots

None.

## Behavior

- Active session row is highlighted with `bg-gray-700`.
- Timestamps are formatted in Thai locale (`th-TH`) with day/month/hour/minute.
- When `sessions` is empty, shows a "ยังไม่มีประวัติการสนทนา" placeholder.
- Trash icon is hidden by default and revealed on row hover (`group-hover:opacity-100`); clicking it fires `delete` without also firing `select`.
- `data-testid="chat-session-sidebar"`, `data-testid="new-chat-button"`, `data-testid="delete-session-{id}"`

## Examples

### Default

```json
{
  "sessions": [],
  "activeSessionId": null
}
```

```vue
<ChatSessionSidebar
  :sessions="sessions"
  :active-session-id="activeSessionId"
  @select="switchSession"
  @new="startNewSession"
/>
```
