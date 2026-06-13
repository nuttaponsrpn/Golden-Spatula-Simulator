import type { PlacedUnits, TeamUnit, BoardPosition, TeamBoard, BoardCell } from "~/types/team";
import type { SuggestedComp } from "~/types/comp";
import type { Champion } from "~/types/champion";
import type { Item } from "~/types/item";

const BOARD_ROWS = 4;
const BOARD_COLS = 7;
const MAX_UNITS = 10;

export function useTeamBuilder() {
  const teamUnits = useState<PlacedUnits>("tft-team-units", () => []);

  const unitCount = computed(() => teamUnits.value.length);
  const isBoardFull = computed(() => teamUnits.value.length >= MAX_UNITS);

  const board = computed<TeamBoard>(() => {
    const grid: TeamBoard = [];

    for (let r = 0; r < BOARD_ROWS; r++) {
      const row: BoardCell[] = [];
      for (let c = 0; c < BOARD_COLS; c++) {
        row.push({ status: "empty", position: { row: r, col: c } });
      }
      grid.push(row);
    }

    for (const unit of teamUnits.value) {
      const { row, col } = unit.position;
      if (row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS) {
        const targetRow = grid[row];
        if (targetRow) {
          targetRow[col] = {
            status: "occupied",
            position: { row, col },
            unit,
          };
        }
      }
    }

    return grid;
  });

  function findNextFreePosition(): BoardPosition | null {
    for (let r = BOARD_ROWS - 1; r >= 0; r--) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const isOccupied = teamUnits.value.some(
          (u) => u.position.row === r && u.position.col === c,
        );
        if (!isOccupied) return { row: r, col: c };
      }
    }
    return null;
  }

  function addUnit(championId: string, position?: BoardPosition): void {
    if (teamUnits.value.length >= MAX_UNITS) return;

    const pos = position ?? findNextFreePosition();
    if (!pos) return;

    const isOccupied = teamUnits.value.some(
      (u) => u.position.row === pos.row && u.position.col === pos.col,
    );
    if (isOccupied) return;

    const unit: TeamUnit = {
      id: crypto.randomUUID(),
      championId,
      position: pos,
      items: [null, null, null],
      stars: 1,
    };

    teamUnits.value = [...teamUnits.value, unit];
  }

  function removeUnit(unitId: string): void {
    teamUnits.value = teamUnits.value.filter((u) => u.id !== unitId);
  }

  function addItemToUnit(unitId: string, slotIndex: 0 | 1 | 2, item: Item): void {
    const idx = teamUnits.value.findIndex((u) => u.id === unitId);
    if (idx < 0) return;

    const updated = [...teamUnits.value];
    const unit = updated[idx];
    if (!unit) return;

    const newItems = [...unit.items] as [Item | null, Item | null, Item | null];
    newItems[slotIndex] = item;

    updated[idx] = { ...unit, items: newItems };
    teamUnits.value = updated;
  }

  function removeItemFromUnit(unitId: string, slotIndex: 0 | 1 | 2): void {
    const idx = teamUnits.value.findIndex((u) => u.id === unitId);
    if (idx < 0) return;

    const updated = [...teamUnits.value];
    const unit = updated[idx];
    if (!unit) return;

    const newItems = [...unit.items] as [Item | null, Item | null, Item | null];
    newItems[slotIndex] = null;

    updated[idx] = { ...unit, items: newItems };
    teamUnits.value = updated;
  }

  function moveUnit(unitId: string, newPosition: BoardPosition): void {
    const idx = teamUnits.value.findIndex((u) => u.id === unitId);
    if (idx < 0) return;

    const isOccupied = teamUnits.value.some(
      (u) =>
        u.id !== unitId &&
        u.position.row === newPosition.row &&
        u.position.col === newPosition.col,
    );
    if (isOccupied) return;

    const updated = [...teamUnits.value];
    const unit = updated[idx];
    if (!unit) return;
    updated[idx] = { ...unit, position: newPosition };
    teamUnits.value = updated;
  }

  function swapUnits(unitIdA: string, unitIdB: string): void {
    const idxA = teamUnits.value.findIndex((u) => u.id === unitIdA);
    const idxB = teamUnits.value.findIndex((u) => u.id === unitIdB);
    if (idxA < 0 || idxB < 0) return;

    const unitA = teamUnits.value[idxA];
    const unitB = teamUnits.value[idxB];
    if (!unitA || !unitB) return;

    const updated = [...teamUnits.value];
    updated[idxA] = { ...unitA, position: unitB.position };
    updated[idxB] = { ...unitB, position: unitA.position };
    teamUnits.value = updated;
  }

  function setUnitStars(unitId: string, stars: 1 | 2 | 3): void {
    const idx = teamUnits.value.findIndex((u) => u.id === unitId);
    if (idx < 0) return;
    const unit = teamUnits.value[idx];
    if (!unit) return;
    const updated = [...teamUnits.value];
    updated[idx] = { ...unit, stars };
    teamUnits.value = updated;
  }

  function clearBoard(): void {
    teamUnits.value = [];
  }

  function isChampionOnBoard(championId: string): boolean {
    return teamUnits.value.some((u) => u.championId === championId);
  }

  function loadComp(comp: SuggestedComp, champions: Champion[]): void {
    clearBoard();

    const validIds = comp.championIds.filter((id) =>
      champions.some((c) => c.id === id),
    );

    const unitsToPlace = validIds.slice(0, MAX_UNITS);
    let placedCount = 0;

    for (let r = BOARD_ROWS - 1; r >= 0; r--) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (placedCount >= unitsToPlace.length) break;
        const champId = unitsToPlace[placedCount];
        if (champId) {
          const unit: TeamUnit = {
            id: crypto.randomUUID(),
            championId: champId,
            position: { row: r, col: c },
            items: [null, null, null],
            stars: 1,
          };
          teamUnits.value = [...teamUnits.value, unit];
          placedCount++;
        }
      }
      if (placedCount >= unitsToPlace.length) break;
    }
  }

  return {
    board,
    teamUnits,
    unitCount,
    isBoardFull,
    addUnit,
    removeUnit,
    moveUnit,
    swapUnits,
    addItemToUnit,
    removeItemFromUnit,
    setUnitStars,
    clearBoard,
    isChampionOnBoard,
    loadComp,
  };
}
