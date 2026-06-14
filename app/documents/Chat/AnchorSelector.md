# ChatAnchorSelector

> Modal for picking "anchor" champions — Golden Spatula champions locked into every team comp the AI suggests. Used both when starting a new session and when editing anchors on an existing one.

**Type:** Smart
**Component:** `app/components/Chat/AnchorSelector.vue`

## Props

| Name         | Type       | Required | Default | Description                                   |
| ------------ | ---------- | -------- | ------- | --------------------------------------------- |
| `initialIds` | `string[]` | —        | `[]`    | Pre-select these champion IDs when the modal opens (used when editing an existing session's anchors) |

## Emits

| Event    | Payload                  | Description                                                                  |
| -------- | ------------------------ | ---------------------------------------------------------------------------- |
| `select` | `string[]` (championIds) | Fired when the user confirms; may be empty (`[]`) to clear all anchors       |
| `skip`   | —                        | Fired when the user clicks "ยกเลิก" or closes the modal without confirming   |

## Slots

None.

## Behavior

- Rendered inside `ElementBaseModal` (always `visible: true` when mounted).
- Shows a searchable grid of all champions (5 columns mobile, 7 columns on larger screens).
- Multi-select: clicking a champion toggles it in/out of the selection (highlighted with `border-cost-5` and a ✓ badge).
- Confirm button label: "ยืนยัน N Champion" when ≥1 selected; "ไม่ใช้ Champion ตั้งต้น" when none selected.
- Closing the modal (× button or "ยกเลิก") fires `skip` — does not change the current anchor selection.

## Examples

### New session (no pre-selection)

```json
{}
```

```vue
<ChatAnchorSelector
  v-if="showAnchorSelector"
  :initial-ids="[]"
  @select="onAnchorSelected"
  @skip="onAnchorSkipped"
/>
```

### Edit existing session anchors

```json
{ "initialIds": ["lux", "jinx"] }
```

```vue
<ChatAnchorSelector
  v-if="showAnchorSelector"
  :initial-ids="anchorChampionIds"
  @select="onAnchorSelected"
  @skip="onAnchorSkipped"
/>
```
