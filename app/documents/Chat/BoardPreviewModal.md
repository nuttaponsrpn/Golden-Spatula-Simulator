# ChatBoardPreviewModal

> Mobile modal that shows a read-only board preview when the AI suggests a team composition. Includes synergy activations and a "Load to Board" button.

**Type:** Smart
**Component:** `app/components/Chat/BoardPreviewModal.vue`

## Props

| Name      | Type                  | Required | Default | Description                                   |
| --------- | --------------------- | -------- | ------- | --------------------------------------------- |
| `units`   | `PlacedUnits \| null` | ✅       | —       | AI-suggested units; null prevents rendering   |
| `visible` | `boolean`             | ✅       | —       | Whether the modal is open                     |

## Emits

| Event   | Payload | Description                                              |
| ------- | ------- | -------------------------------------------------------- |
| `close` | —       | Fired when the user dismisses the modal                  |
| `load`  | —       | Fired when the user clicks "Load to Board" (also closes) |

## Slots

None.

## Behavior

- Wraps `ElementBaseModal` with the board content.
- Does not render board content when `units` is null.
- "Load to Board" emits both `load` and `close` so the parent does not need to close manually.
- Uses `useSynergies().getSynergyActivations()` to show active traits.

## Examples

### Default

```json
{
  "units": [],
  "visible": true
}
```

```vue
<ChatBoardPreviewModal
  :units="previewUnits"
  :visible="showMobilePreview"
  @close="showMobilePreview = false"
  @load="onLoadToBoard"
/>
```
