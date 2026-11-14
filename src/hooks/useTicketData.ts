import { useCallback, useEffect, useMemo, useState } from 'react';
import { trackerApi } from '@/services/trackerApi';
import type { NewTicket, Ticket } from '@/types/movie';

type Status = 'loading' | 'ready' | 'error';

export interface SaveTicketOptions {
  /** Set to update an existing ticket instead of creating one. */
  id?: string;
  /** A new file to attach (replaces the current one). */
  file?: File | null;
  /** Remove the current file. */
  removeFile?: boolean;
}

/** The ticket was saved but its file could not be attached. Carries the saved ticket so a retry updates it. */
export class FileUploadError extends Error {
  constructor(
    readonly ticket: Ticket,
    reason: string,
  ) {
    super(`your ticket was saved, but its file couldn't be attached: ${reason}`);
  }
}

/** Loads and changes the user's tickets. */
export function useTicketData() {
  const [everything, setEverything] = useState<Ticket[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  const load = useCallback(async () => {
    try {
      setEverything(await trackerApi.getTickets());
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, []);

  useEffect(() => void load(), [load]);

  const saveTicket = useCallback(
    async (input: NewTicket, { id, file, removeFile }: SaveTicketOptions = {}): Promise<Ticket> => {
      let saved = id ? await trackerApi.updateTicket(id, input) : await trackerApi.createTicket(input);
      try {
        if (file) saved = await trackerApi.uploadTicketFile(saved.id, file);
        else if (removeFile && saved.image) saved = await trackerApi.deleteTicketFile(saved.id);
      } catch (error) {
        await load();
        throw new FileUploadError(saved, error instanceof Error ? error.message : 'unknown error');
      }
      await load();
      return saved;
    },
    [load],
  );

  const deleteTicket = useCallback(
    async (id: string) => {
      await trackerApi.deleteTicket(id);
      await load();
    },
    [load],
  );

  // the tickets tab and the clash checks only know what is booked; the planner also has what is still tentative
  const tickets = useMemo(() => everything.filter((t) => t.status === 'booked'), [everything]);
  const planned = useMemo(() => everything.filter((t) => t.status === 'tentative'), [everything]);

  return { tickets, planned, everything, status, reload: load, saveTicket, deleteTicket };
}
