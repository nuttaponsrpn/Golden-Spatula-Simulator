# ChampionTooltip

> Hover tooltip shown when the user mouses over a champion token on the board, displaying traits, ability details, and damage stat.

**Type:** Pure  
**Component:** `app/components/Champion/Tooltip.vue`

## Props

| Name       | Type       | Required | Default | Description             |
| ---------- | ---------- | -------- | ------- | ----------------------- |
| `champion` | `Champion` | ✅       | —       | The champion to display |

## Emits

None.

## Slots

None.

## Behavior

- Shown/hidden by the parent (`Board/UnitToken.vue`) via `v-if` on hover
- Positioned `left-full top-0 ml-2` (to the right of the hex token) with `z-50`
- Renders traits with icon + name using `useSynergies().getTraitById()`
- Renders ability icon, name, mana, description, and scaling values
- Shows `Damage` stat row only when `champion.damage > 0`
- `pointer-events-none` — does not interfere with drag or click events on the token

## Examples

### Default

```json
{
  "champion": {
    "id": "10301",
    "name": "Twisted Fate",
    "cost": 2,
    "traits": ["stargazer-id", "fateweaver-id"],
    "imageUrl": "https://...",
    "isHero": true,
    "ability": {
      "name": "Fate's Gambit",
      "description": "Min Damage: 180 ...",
      "mana": 50,
      "iconUrl": "https://...",
      "scalingValues": "180/270/405"
    },
    "damage": 45
  }
}
```

```vue
<ChampionTooltip :champion="champion" />
```
