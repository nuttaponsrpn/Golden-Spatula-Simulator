# ChatBoardPreviewPanel

> Desktop side panel that displays a read-only board preview when the AI suggests a team composition. Includes synergy activations and a "Load to Board" button.

**Type:** Smart
**Component:** `app/components/Chat/BoardPreviewPanel.vue`

## Props

| Name      | Type                 | Required | Default | Description                                  |
| --------- | -------------------- | -------- | ------- | -------------------------------------------- |
| `units`   | `PlacedUnits \| null` | ✅       | —       | AI-suggested units; null hides the panel     |
| `visible` | `boolean`            | ✅       | —       | Whether the panel should be rendered         |

## Emits

| Event  | Payload | Description                                    |
| ------ | ------- | ---------------------------------------------- |
| `load` | —       | Fired when the user clicks "Load to Board"     |

## Slots

None.

## Behavior

- Shown only on `lg:` breakpoint and above (handled by parent `chat.vue`).
- When `units` is non-null, computes `TeamBoard` locally (does not use `useTeamBuilder` shared state) and passes it to `ChatBoardPreview`.
- Calls `useSynergies().getSynergyActivations()` to compute active synergies from `units`.
- Slides in from the right via CSS transition when `visible` becomes true.
- The "Load to Board" button emits `load` — the parent page calls `useTeamBuilder().loadUnits()` then navigates to `/`.

## Examples

### Default

```json
{
  "units": [],
  "visible": true
}
```

```vue
<ChatBoardPreviewPanel :units="previewUnits" :visible="!!previewUnits" @load="onLoadToBoard" />
```
