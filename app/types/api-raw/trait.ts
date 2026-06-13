// app/types/api-raw/trait.ts
export interface ApiRawTraitResponse {
  version: string;
  season: string;
  setId: string;
  time: string;
  data: Record<string, ApiRawTrait>;
}

export interface ApiRawTrait {
  id: number;
  checkId: string;      // "402", "403" — ใช้เป็น key หลัก
  name: string;
  type: 0 | 1;          // 0 = origin, 1 = class
  color: string;        // "1"-"5"
  numList: string;      // "3|5|7|10"
  values: string;       // "3|5|7|10"
  picture: string;
  desc2: string;        // human-readable description
  realDesc: string;     // current active tier description
  setid: string;
}
