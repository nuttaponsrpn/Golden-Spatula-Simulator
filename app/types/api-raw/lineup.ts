// app/types/api-raw/lineup.ts
export interface ApiRawLineupResponse {
  lineup_list: ApiRawLineup[];
}

export interface ApiRawLineup {
  id: string;
  quality: string;      // "S"|"A"|"B"|"C"
  detail: string;       // JSON string — ต้อง parse
}

export interface ApiRawLineupDetail {
  line_name: string;
  line_tag: string;
  line_feature: string;
  early_info: string;
  levelMap: Record<string, ApiRawUnitPlacement[]>;
  equipment_order: string;
}

export interface ApiRawUnitPlacement {
  idInLineup: number;
  chess_type: "hero" | "pet";
  hero_id: string;
  equipment_id: string; // comma-separated item IDs
  location: string;     // "row,col"
  star: number;
  is_carry_hero: boolean;
  carry_index: number;
}
