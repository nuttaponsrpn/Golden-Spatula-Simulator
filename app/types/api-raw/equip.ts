// app/types/api-raw/equip.ts
export interface ApiRawEquipResponse {
  data: Record<string, ApiRawItem>;
}

export interface ApiRawItem {
  id: string;
  name: string;
  basicDesc: string;
  desc: string;
  picture: string;
  synthesis1: string;   // "0" = no component
  synthesis2: string;
  type: string;         // "基础装备" = basic, "合成装备" = combined
  planID: string;       // filter by current set
  mapID: string;
  setID: string;
}
