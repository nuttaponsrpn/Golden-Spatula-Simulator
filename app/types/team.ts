import type { UnitItems } from "./item";

export interface BoardPosition {
  row: number;
  col: number;
}

export interface TeamUnit {
  id: string;
  championId: string;
  position: BoardPosition;
  items: UnitItems;
}

export type BoardCell =
  | { status: "empty"; position: BoardPosition }
  | { status: "occupied"; position: BoardPosition; unit: TeamUnit };

export type TeamBoard = BoardCell[][];

export type PlacedUnits = TeamUnit[];
