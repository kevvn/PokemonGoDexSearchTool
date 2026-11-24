/**
 * Shared React 19 ref-cleanup helper for native `<dialog>` elements (`mwg: dialog`):
 * - Reads & resets `dialog.returnValue = ''` on `close` so stale return values never leak.
 * - Attaches pointer bounding-rect light-dismiss fallback only when `closedBy` is unsupported,
 *   guarding `e.target === dialog` and resetting state on `pointerup` / `pointercancel`.
 * - Returns a cleanup function so zero `useEffect` is required.
 */
export function createDialogRefHandler(dialogRefObj, onClose) {
  return (dialog) => {
    dialogRefObj.current = dialog;
    if (!dialog) return undefined;

    const handleClose = () => {
      const returnValue = dialog.returnValue || '';
      dialog.returnValue = '';
      onClose?.(returnValue);
    };

    dialog.addEventListener('close', handleClose);

    let cleanupOutside = null;
    if (
      typeof HTMLDialogElement !== 'undefined' &&
      !('closedBy' in HTMLDialogElement.prototype)
    ) {
      const isOutside = (e) => {
        const r = dialog.getBoundingClientRect();
        return (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        );
      };

      let pressedOutside = false;
      const onPointerDown = (e) => {
        pressedOutside = e.target === dialog && isOutside(e);
      };
      const onPointerUp = (e) => {
        const shouldClose = pressedOutside && e.target === dialog && isOutside(e);
        pressedOutside = false;
        if (shouldClose) {
          dialog.close();
        }
      };
      const onPointerCancel = () => {
        pressedOutside = false;
      };

      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      dialog.addEventListener('pointercancel', onPointerCancel);
      cleanupOutside = () => {
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
        dialog.removeEventListener('pointercancel', onPointerCancel);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      cleanupOutside?.();
      if (dialogRefObj.current === dialog) {
        dialogRefObj.current = null;
      }
    };
  };
}
