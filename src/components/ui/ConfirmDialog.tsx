import type { ReactNode } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { Button } from './Button';
import { DialogLayout, type DialogTitle } from './DialogLayout';
import { FormActions } from './FormActions';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: DialogTitle;
  message: string;
  confirmLabel: string;
  /** Shown on the pink side, e.g. the poster of what is about to be deleted. */
  aside?: ReactNode;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, aside, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal open={open} label={`${title.lead} ${title.accent}`} onClose={onClose}>
      <ConfirmBody title={title} message={message} confirmLabel={confirmLabel} aside={aside} onConfirm={onConfirm} onClose={onClose} />
    </Modal>
  );
}

/** Rendered only while the dialog is open, so its pending/error state resets every time. */
function ConfirmBody({ title, message, confirmLabel, aside, onConfirm, onClose }: Omit<ConfirmDialogProps, 'open'>) {
  const { run, pending, error } = useAsyncAction(onConfirm);

  return (
    <DialogLayout title={title} note="this cannot be undone" aside={aside} onClose={onClose}>
      <p className="my-auto py-6 text-[18px] leading-relaxed text-ink">{message}</p>

      {error && (
        <p role="alert" className="mb-3 text-[13px] font-semibold text-pink-deep italic">
          {error}
        </p>
      )}

      <FormActions>
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          cancel
        </Button>
        <Button onClick={() => void run()} disabled={pending} className="disabled:opacity-60">
          {pending ? 'working…' : confirmLabel}
        </Button>
      </FormActions>
    </DialogLayout>
  );
}
