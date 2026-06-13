# BoardSynergyBar

> แถบ synergy badges ด้านล่าง board แสดง synergies ทั้งหมดจาก champion ที่วางอยู่

**Type:** Pure  
**Component:** `app/components/Board/SynergyBar.vue`

## Props

| Name          | Type                  | Required | Default | Description                                  |
| ------------- | --------------------- | -------- | ------- | -------------------------------------------- |
| `activations` | `SynergyActivation[]` | ✅       | —       | รายการ synergy activations จาก getSynergyActivations |

## Emits

_None_

## Slots

_None_

## Behavior

- ซ่อนตัวเองถ้า `activations` ว่างเปล่า
- render `BoardSynergyBadge` หนึ่งตัวต่อ activation
- `data-testid="board-synergy-bar"`

## Examples

### With activations

```vue
<BoardSynergyBar :activations="synergyActivations" />
```
