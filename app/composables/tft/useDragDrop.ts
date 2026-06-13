import type { BoardPosition } from "~/types/team";
import type { DragPayload, DragSourceKind } from "~/types/drag";
import type { Item } from "~/types/item";

const DRAG_DATA_KEY = "application/tft-drag";

export function useDragDrop() {
  const { addUnit, moveUnit, swapUnits, board } = useTeamBuilder();
  const dragOverPosition = useState<BoardPosition | null>(
    "tft-drag-over-position",
    () => null,
  );
  const isDraggingUnit = useState<boolean>("tft-is-dragging-unit", () => false);
  const isDragging = useState<boolean>("tft-is-dragging", () => false);
  const draggingUnitId = useState<string | null>("tft-dragging-unit-id", () => null);

  if (import.meta.client) {
    watchEffect(() => {
      document.body.classList.toggle("is-dragging", isDragging.value);
    });
  }

  function isDragPayload(value: unknown): value is DragPayload {
    if (typeof value !== "object" || value === null || !("kind" in value)) return false;
    
    const payload = value as DragPayload;
    if (payload.kind === "picker" || payload.kind === "board") {
      return typeof payload.championId === "string" || typeof payload.unitId === "string";
    }
    
    if (payload.kind === "item-picker") {
      return typeof payload.itemId === "string";
    }
    
    return false;
  }

  function setCustomDragImage(event: DragEvent, kind: DragSourceKind): void {
    if (!event.dataTransfer || !event.target) return;

    const target = event.target as HTMLElement;
    const img = target.tagName === "IMG" ? (target as HTMLImageElement) : target.querySelector("img");

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const SIZE = kind === "item-picker" ? 40 : 52;

    const ghost = document.createElement("div");
    ghost.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: ${SIZE}px;
      height: ${SIZE}px;
      border-radius: ${kind === "item-picker" ? "6px" : "50%"};
      overflow: hidden;
      background: #1f2937;
      box-shadow: 0 4px 12px rgba(0,0,0,0.6);
    `;

    const imgClone = document.createElement("img");
    imgClone.src = img.src;
    imgClone.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
    ghost.appendChild(imgClone);
    document.body.appendChild(ghost);

    event.dataTransfer.setDragImage(ghost, SIZE / 2, SIZE / 2);

    // Remove after next frame — browser only needs it during the dragstart snapshot
    requestAnimationFrame(() => ghost.remove());
  }

  function onPickerDragStart(event: DragEvent, championId: string): void {
    if (!event.dataTransfer) return;
    const kind: DragSourceKind = "picker";
    const payload: DragPayload = { kind, championId };
    event.dataTransfer.setData(DRAG_DATA_KEY, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "all";
    setCustomDragImage(event, kind);
    isDragging.value = true;
  }

  function onTokenDragStart(event: DragEvent, payload: DragPayload): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData(DRAG_DATA_KEY, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "all";
    setCustomDragImage(event, payload.kind);
    if (payload.kind === "board") {
      isDraggingUnit.value = true;
      draggingUnitId.value = payload.unitId ?? null;
    }
    isDragging.value = true;
  }

  function onPickerDragEnd(_event: DragEvent): void {
    isDragging.value = false;
  }

  function onTokenDragEnd(_event: DragEvent): void {
    dragOverPosition.value = null;
    isDraggingUnit.value = false;
    draggingUnitId.value = null;
    isDragging.value = false;
  }

  function onItemDragStart(event: DragEvent, item: Item): void {
    if (!event.dataTransfer) return;
    const kind: DragSourceKind = "item-picker";
    const payload: DragPayload = { kind, itemId: item.id };
    event.dataTransfer.setData(DRAG_DATA_KEY, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = "all";
    setCustomDragImage(event, kind);
    isDragging.value = true;
  }

  function onItemDragEnd(_event: DragEvent): void {
    isDragging.value = false;
  }

  function onCellDragEnter(position: BoardPosition): void {
    dragOverPosition.value = position;
  }

  function onCellDragOver(event: DragEvent, _position: BoardPosition): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  }

  function onCellDragLeave(event: DragEvent, position: BoardPosition): void {
    const currentTarget = event.currentTarget as HTMLElement | null;
    if (currentTarget?.contains(event.relatedTarget as Node | null)) return;

    if (
      dragOverPosition.value?.row === position.row &&
      dragOverPosition.value?.col === position.col
    ) {
      dragOverPosition.value = null;
    }
  }

  function onCellDrop(event: DragEvent, targetPosition: BoardPosition): void {
    event.preventDefault();
    dragOverPosition.value = null;
    if (!event.dataTransfer) return;

    let payload: unknown;
    try {
      payload = JSON.parse(event.dataTransfer.getData(DRAG_DATA_KEY));
    } catch {
      return;
    }
    if (!isDragPayload(payload)) return;

    if (payload.kind === "picker") {
      if (payload.championId) {
        addUnit(payload.championId, targetPosition);
      }
    } else {
      if (!payload.unitId) return;
      // Check if target cell is occupied — if so, swap instead of move
      const targetRow = board.value[targetPosition.row];
      const targetCell = targetRow?.[targetPosition.col];
      if (targetCell?.status === "occupied") {
        swapUnits(payload.unitId, targetCell.unit.id);
      } else {
        moveUnit(payload.unitId, targetPosition);
      }
    }
  }

  return {
    dragOverPosition,
    isDraggingUnit,
    draggingUnitId,
    isDragging,
    onPickerDragStart,
    onPickerDragEnd,
    onTokenDragStart,
    onTokenDragEnd,
    onItemDragStart,
    onItemDragEnd,
    onCellDragEnter,
    onCellDragOver,
    onCellDragLeave,
    onCellDrop,
  };
}
