import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/**
 * Side sheet on the native <dialog> element: the browser provides the focus trap, Escape to close,
 * inert background and focus restoration, so none of it is hand-rolled (and none of it can regress).
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on the backdrop
      }}
    >
      {open && (
        <div className="sheet-body">
          <header className="sheet-head">
            <h2 id="sheet-title">{title}</h2>
            <button className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
