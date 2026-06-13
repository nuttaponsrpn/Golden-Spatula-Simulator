# SynergyTraitTooltip

> Floating tooltip that appears on hover over a trait row, showing full synergy detail: icon, description, and all activation thresholds with their bonuses.

**Type:** Pure
**Component:** `app/components/Synergy/TraitTooltip.vue`

## Props

| Name         | Type                    | Required | Default | Description                                              |
| ------------ | ----------------------- | -------- | ------- | -------------------------------------------------------- |
| `activation` | `SynergyActivation`     | ✅       | —       | Full synergy activation data including trait and counts  |
| `visible`    | `boolean`               | ✅       | —       | Whether the tooltip is shown                             |
| `anchorRect` | `DOMRect \| null`       | ✅       | —       | Bounding rect of the triggering element for positioning  |

## Emits

None.

## Slots

None.

## Behavior

- Rendered via `<Teleport to="body">` to escape any parent `overflow: hidden` containers.
- `pointer-events: none` — does not interfere with mouse events.
- Positioned to the **right** of the anchor rect; falls back to left if there is insufficient space.
- Vertically centered on the anchor, clamped to the viewport with an 8px margin.
- Header background and count color reflect the active tier (bronze / silver / gold / prismatic).
- Each threshold row is highlighted when it matches the currently active threshold, with an "ACTIVE" badge.
- Uses `nextTick` after `visible` changes to measure its own height before computing final position.

## Examples

### Default (used inside TraitRow)

```json
{}
```

```vue
<SynergyTraitTooltip
  :activation="activation"
  :visible="isHovered"
  :anchor-rect="anchorRect"
/>
```
