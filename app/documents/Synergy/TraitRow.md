# SynergyTraitRow

> Single trait row แสดง count, name, threshold pips, และ active bonus

**Type:** Pure
**Component:** `app/components/Synergy/TraitRow.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `activation` | `SynergyActivation` | ✅ | — | activation ของ trait |

## Behavior

- Active tier → full opacity และ tier-colored count badge
- Inactive → opacity 60%
- แสดง active bonus text หรือ hint "เพิ่มอีก X เพื่อ activate"
- `data-testid="trait-row"`

## Examples

### Default

```json
{ "activation": { "trait": {}, "activeCount": 2, "activeTier": "bronze", "activeThreshold": { "count": 2, "tier": "bronze", "bonus": "20 AP" }, "nextThreshold": null, "contributingUnitIds": [] } }
```

```vue
<SynergyTraitRow :activation="activation" />
```
