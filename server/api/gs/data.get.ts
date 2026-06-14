// server/api/gs/data.get.ts
import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  const CHESS_URL = "https://goldenspatula.com/act/jkxzlkFile/js/EN/17/18.17.3-S18/chess.js";
  const TRAIT_URL = "https://goldenspatula.com/act/jkxzlkFile/js/EN/17/18.17.3-S18/trait.js";
  const EQUIP_URL = "https://goldenspatula.com/act/jkxzlkFile/js/EN/17/18.17.3-S18/equip.js";
  const LINEUP_URL = "https://goldenspatula.com/act/jkxzlkJson/json/EN/lineupJson/m18/29/17/lineup_detail_total.json";

  const parseJsonData = (text: string) => {
    // ลบ whitespace และระวังบรรทัดว่างที่หัวไฟล์
    const cleaned = text.trim();
    return JSON.parse(cleaned);
  };

  try {
    const [chessRaw, traitRaw, equipRaw, lineupRaw] = await Promise.all([
      $fetch<string>(CHESS_URL, { parseResponse: txt => txt }),
      $fetch<string>(TRAIT_URL, { parseResponse: txt => txt }),
      $fetch<string>(EQUIP_URL, { parseResponse: txt => txt }),
      $fetch<string>(LINEUP_URL, { parseResponse: txt => txt }),
    ]);

    return {
      chess: parseJsonData(chessRaw),
      trait: parseJsonData(traitRaw),
      equip: parseJsonData(equipRaw),
      lineup: parseJsonData(lineupRaw),
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch Golden Spatula game data',
      data: error.message
    });
  }
});
