# ChampionTraitBadge

> Small pill แสดงชื่อ trait ของแชมป์

**Type:** Pure
**Component:** `app/components/Champion/TraitBadge.vue`

## Props

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `traitId` | `string` | ✅ | — | ID ของ trait |
| `traitName` | `string` | ✅ | — | ชื่อ trait สำหรับแสดง |
| `iconUrl` | `string` | — | — | URL ของไอคอน trait |

## Examples

### Default

```json
{
  "traitId": "sorcerer",
  "traitName": "Sorcerer",
  "iconUrl": "https://game.gtimg.cn/images/jswz/web202308/traits/1.png"
}
```

```vue
<ChampionTraitBadge trait-id="sorcerer" trait-name="Sorcerer" icon-url="..." />
```
