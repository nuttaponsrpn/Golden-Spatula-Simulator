/**
 * Touch-to-drag polyfill for HTML5 Drag and Drop API.
 *
 * Mobile browsers do not fire drag events from touch — this plugin intercepts
 * touchstart/touchmove/touchend on elements that have draggable="true" and
 * re-dispatches the equivalent drag events so the existing DnD logic works
 * unchanged on mobile.
 *
 * How it works:
 * 1. touchstart on a draggable element → record as "pending drag" (do not start yet)
 * 2. touchmove beyond DRAG_THRESHOLD_PX → commit drag: fire dragstart + create ghost image
 *    → find the element under the finger → fire dragover on it
 *    (also fires dragleave on the previous target and dragenter on the new one)
 *    → move the ghost image to follow the finger
 * 3. touchend without drag started → let native click fire (tap to select)
 *    touchend with drag started → fire drop on the element under the finger, then dragend
 *    → remove the ghost image
 * 4. touchcancel → fire dragend to reset state → remove the ghost image
 */

export default defineNuxtPlugin(() => {
  // Only activate on touch-capable devices
  if (!("ontouchstart" in window)) return;

  let dragSource: Element | null = null;
  let lastDragOver: Element | null = null;
  let ghostEl: HTMLElement | null = null;
  let ghostOffsetX = 0;
  let ghostOffsetY = 0;

  // Pending drag — set on touchstart, committed only when touchmove exceeds threshold
  let pendingDragSource: Element | null = null;
  let pendingTouch: Touch | null = null;
  let dragStarted = false;
  const DRAG_THRESHOLD_PX = 8;

  // Synthetic DataTransfer — stores the key/value set by the draggable's dragstart handler
  // so that drop handlers can read it via event.dataTransfer.getData()
  class SyntheticDataTransfer {
    private store: Record<string, string> = {};
    dropEffect: DataTransfer["dropEffect"] = "move";
    effectAllowed: DataTransfer["effectAllowed"] = "all";

    setData(type: string, data: string) {
      this.store[type] = data;
    }
    getData(type: string): string {
      return this.store[type] ?? "";
    }
    clearData() {
      this.store = {};
    }
    setDragImage() {
      // no-op — ghost is handled by this polyfill directly
    }
  }

  const sharedTransfer = new SyntheticDataTransfer();

  function dispatchDragEvent(
    name: string,
    target: Element,
    touch: Touch,
    transfer: SyntheticDataTransfer,
  ): boolean {
    const event = new DragEvent(name, {
      bubbles: true,
      cancelable: true,
      clientX: touch.clientX,
      clientY: touch.clientY,
      screenX: touch.screenX,
      screenY: touch.screenY,
      // dataTransfer cannot be passed via constructor in Chrome — inject via defineProperty instead
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DragEvent.dataTransfer is read-only; override with synthetic impl
    Object.defineProperty(event, "dataTransfer", {
      value: transfer as unknown as DataTransfer,
      writable: false,
    });
    return target.dispatchEvent(event);
  }

  // Walk up the DOM to find the closest draggable ancestor
  function findDraggable(el: Element | null): Element | null {
    let node = el;
    while (node) {
      if ((node as HTMLElement).draggable) return node;
      node = node.parentElement;
    }
    return null;
  }

  function createGhost(source: Element, touch: Touch): void {
    const srcEl = source as HTMLElement;
    const rect = srcEl.getBoundingClientRect();

    // Clone the draggable element for the ghost
    const clone = srcEl.cloneNode(true) as HTMLElement;

    // Position ghost at the same spot as the source, then offset by touch within element
    ghostOffsetX = touch.clientX - rect.left;
    ghostOffsetY = touch.clientY - rect.top;

    clone.style.cssText = `
      position: fixed;
      left: ${touch.clientX - ghostOffsetX}px;
      top: ${touch.clientY - ghostOffsetY}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      opacity: 0.8;
      pointer-events: none;
      z-index: 99999;
      transform: scale(1.1);
      transform-origin: center center;
      border-radius: inherit;
    `;

    document.body.appendChild(clone);
    ghostEl = clone;
  }

  function moveGhost(touch: Touch): void {
    if (!ghostEl) return;
    ghostEl.style.left = `${touch.clientX - ghostOffsetX}px`;
    ghostEl.style.top = `${touch.clientY - ghostOffsetY}px`;
  }

  function removeGhost(): void {
    if (ghostEl) {
      ghostEl.remove();
      ghostEl = null;
    }
  }

  document.addEventListener(
    "touchstart",
    (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const draggable = findDraggable(target);
      if (!draggable) return;

      // Record intent but do NOT start the drag yet — wait for touchmove to exceed
      // the threshold so a short tap can still fire the native click event.
      pendingDragSource = draggable;
      pendingTouch = touch;
      dragStarted = false;
    },
    { passive: true },
  );

  document.addEventListener(
    "touchmove",
    (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      // Commit drag session once the finger moves past the threshold
      if (!dragStarted && pendingDragSource && pendingTouch) {
        const dx = touch.clientX - pendingTouch.clientX;
        const dy = touch.clientY - pendingTouch.clientY;
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD_PX) return;

        // Start the drag session now
        sharedTransfer.clearData();
        dragSource = pendingDragSource;
        lastDragOver = null;
        dragStarted = true;
        pendingDragSource = null;
        pendingTouch = null;

        dispatchDragEvent("dragstart", dragSource, touch, sharedTransfer);
        createGhost(dragSource, touch);
      }

      if (!dragSource) return;
      e.preventDefault();

      moveGhost(touch);

      // Temporarily hide the drag source so elementFromPoint finds the drop target beneath it
      (dragSource as HTMLElement).style.pointerEvents = "none";
      // Also hide the ghost so it doesn't intercept elementFromPoint
      if (ghostEl) ghostEl.style.pointerEvents = "none";
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      (dragSource as HTMLElement).style.pointerEvents = "";

      if (!elementBelow) return;

      if (elementBelow !== lastDragOver) {
        if (lastDragOver) {
          dispatchDragEvent("dragleave", lastDragOver, touch, sharedTransfer);
        }
        dispatchDragEvent("dragenter", elementBelow, touch, sharedTransfer);
        lastDragOver = elementBelow;
      }

      dispatchDragEvent("dragover", elementBelow, touch, sharedTransfer);
    },
    { passive: false },
  );

  document.addEventListener("touchend", (e: TouchEvent) => {
    // If drag never started (was just a tap), reset pending state and let the
    // native click event through — no drag cleanup needed.
    if (!dragStarted) {
      pendingDragSource = null;
      pendingTouch = null;
      return;
    }

    if (!dragSource) return;

    const touch = e.changedTouches[0];
    if (!touch) {
      removeGhost();
      dragSource = null;
      lastDragOver = null;
      dragStarted = false;
      return;
    }

    removeGhost();

    (dragSource as HTMLElement).style.pointerEvents = "none";
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    (dragSource as HTMLElement).style.pointerEvents = "";

    if (dropTarget) {
      dispatchDragEvent("drop", dropTarget, touch, sharedTransfer);
    }

    dispatchDragEvent("dragend", dragSource, touch, sharedTransfer);

    dragSource = null;
    lastDragOver = null;
    dragStarted = false;
  });

  document.addEventListener("touchcancel", (e: TouchEvent) => {
    pendingDragSource = null;
    pendingTouch = null;

    if (!dragSource) return;

    removeGhost();

    const touch = e.changedTouches[0];
    if (touch) {
      dispatchDragEvent("dragend", dragSource, touch, sharedTransfer);
    }

    dragSource = null;
    lastDragOver = null;
    dragStarted = false;
  });
});
