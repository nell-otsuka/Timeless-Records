import { Modal } from '@/components/ui/Modal';
import type { NewMovie } from '@/types/movie';
import { AddMovieForm } from './AddMovieForm';

interface AddMovieModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (movie: NewMovie) => Promise<void>;
}

export function AddMovieModal({ open, onClose, onSubmit }: AddMovieModalProps) {
  return (
    <Modal open={open} label="add a movie" onClose={onClose}>
      <AddMovieForm onSubmit={onSubmit} onClose={onClose} />
    </Modal>
  );
}
