export type DragSourceKind = "picker" | "board" | "item-picker";

export interface DragPayload {
  kind: DragSourceKind;
  championId?: string; // used by addUnit()
  unitId?: string; // only when kind === "board" — used by moveUnit()
  itemId?: string; // used when kind === "item-picker"
}
