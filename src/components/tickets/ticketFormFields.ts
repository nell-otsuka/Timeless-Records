import type { FieldSpan } from '@/components/ui/formGrid';
import type { TicketDraft } from '@/types/movie';

export interface TicketFieldConfig {
  name: keyof Pick<TicketDraft, 'title' | 'cinemaName' | 'startsAt' | 'room' | 'seats' | 'places' | 'endsTime'>;
  label: string;
  type?: 'text' | 'datetime-local' | 'time';
  placeholder?: string;
  required?: boolean;
  inputMode?: 'numeric';
  /** Suggest values from the watch list or from known cinemas. */
  suggestions?: 'movies' | 'cinemas';
  span?: FieldSpan;
}

export const TICKET_FORM_FIELDS: TicketFieldConfig[] = [
  { name: 'title', label: 'movie', placeholder: 'e.g. blade runner', required: true, suggestions: 'movies', span: 3 },
  { name: 'cinemaName', label: 'cinema', placeholder: 'e.g. pathé docks 76', required: true, suggestions: 'cinemas', span: 3 },
  { name: 'startsAt', label: 'date and time', type: 'datetime-local', required: true, span: 2 },
  { name: 'room', label: 'room', placeholder: 'e.g. salle 4', span: 2 },
  { name: 'seats', label: 'seats', placeholder: 'e.g. a9, a10', span: 2 },
  { name: 'places', label: 'places', placeholder: 'e.g. 2', inputMode: 'numeric', span: 2 },
  { name: 'endsTime', label: 'ends at', type: 'time', span: 2 },
];
