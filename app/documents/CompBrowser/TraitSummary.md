# CompBrowserTraitSummary

> Compact list ของ key traits ของ suggested comp

**Type:** Smart (เรียก `useSynergies().getTraitById()`)
**Component:** `app/components/CompBrowser/TraitSummary.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `keyTraits` | `string[]` | ✅ | — | trait IDs ที่เป็นหลักของ comp |

## Examples

### Default

```json
{ "keyTraits": ["rebel", "sorcerer"] }
```

```vue
<CompBrowserTraitSummary :key-traits="['rebel', 'sorcerer']" />
```
