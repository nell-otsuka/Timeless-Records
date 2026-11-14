import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  /** The dialog's accessible name. */
  label: string;
  onClose: () => void;
  /** Rendered only while open, so a form inside starts fresh every time. Usually a <DialogLayout>. */
  children: ReactNode;
}

/**
 * The native <dialog>: focus trap, Esc and backdrop click come for free. It draws nothing itself;
 * the look lives in <DialogLayout>. It never scrolls, so the drop shadow of the sheet is never clipped.
 */
export function Modal({ open, label, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="m-auto max-h-none w-[min(940px,calc(100vw-2rem))] max-w-none overflow-visible bg-transparent p-0 text-pink backdrop:bg-cream/80 backdrop:backdrop-blur-[5px]"
    >
      {open && children}
    </dialog>
  );
}
