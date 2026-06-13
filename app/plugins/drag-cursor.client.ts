export default defineNuxtPlugin(() => {
  const { isDragging } = useDragDrop();

  // Prevent browser "not-allowed" cursor when dragging over non-drop-target areas
  document.addEventListener("dragover", (e: DragEvent) => {
    if (isDragging.value) e.preventDefault();
  });
});
