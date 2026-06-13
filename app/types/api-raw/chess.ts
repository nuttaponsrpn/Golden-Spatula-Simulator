// app/types/api-raw/chess.ts
export interface ApiRawChessResponse {
  version: string;
  season: string;
  setId: string;
  time: string;
  data: Record<string, ApiRawChampion>;
}

export interface ApiRawChampion {
  id: string;
  name: string;
  class: string;        // "314" หรือ "319|316"
  species: string;      // "409" หรือ "-1"
  price: string;        // "1" ถึง "5"
  picture: string;
  maxMP: string;
  skillName: string;
  skillDesc: string;
  skillIcon: string;
  heroType: string;     // "0" = hero, "1" = dummy
  showHeroTag: string;  // "1" = show in list
  tftHeroId: string;
  setid: string;
  skillBriefValue: string;
  initAttackDamage: string;
  // ... fields อื่น filter ออก
}
