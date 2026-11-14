import { DialogLayout } from '@/components/ui/DialogLayout';
import { Modal } from '@/components/ui/Modal';
import type { City } from '@/types/movie';
import { CityPickerForm } from './CityPickerForm';

interface CityPickerModalProps {
  open: boolean;
  cities: City[];
  selectedIds: number[];
  onSave: (cityIds: number[]) => Promise<void>;
  onClose: () => void;
}

export function CityPickerModal({ open, cities, selectedIds, onSave, onClose }: CityPickerModalProps) {
  return (
    <Modal open={open} label="your cities" onClose={onClose}>
      <DialogLayout title={{ lead: 'your', accent: 'cities' }} note="where you go to the cinema" onClose={onClose}>
        <CityPickerForm cities={cities} selectedIds={selectedIds} onSave={onSave} onCancel={onClose} />
      </DialogLayout>
    </Modal>
  );
}
