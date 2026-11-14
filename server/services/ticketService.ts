import { randomUUID } from 'node:crypto';
import type { Ticket } from '../../shared/types';
import { IMAGE_TYPES, MAX_IMAGE_BYTES, type TicketImageStore } from '../store/ticketImageStore';
import type { TrackerRepository } from '../store/trackerRepository';
import { NotFoundError, ValidationError } from './errors';
import { parseNewTicket } from './ticketValidation';

export interface UploadedFile {
  bytes: Uint8Array;
  contentType: string;
}

export class TicketService {
  constructor(
    private readonly repo: TrackerRepository,
    private readonly images: TicketImageStore,
  ) {}

  async list(): Promise<Ticket[]> {
    return [...(await this.repo.listTickets())].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  async create(input: unknown): Promise<Ticket> {
    const ticket: Ticket = { ...parseNewTicket(input), id: randomUUID(), createdAt: new Date().toISOString() };
    await this.repo.saveTicket(ticket);
    return ticket;
  }

  /** Replaces the editable fields; the id, creation date and uploaded file are kept. */
  async update(id: string, input: unknown): Promise<Ticket> {
    const existing = await this.require(id);
    const updated: Ticket = { ...parseNewTicket(input), id, createdAt: existing.createdAt, image: existing.image };
    await this.repo.saveTicket(updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.require(id);
    await this.repo.deleteTicket(id);
    await this.images.remove(id);
  }

  async setImage(id: string, file: UploadedFile): Promise<Ticket> {
    const existing = await this.require(id);
    if (!IMAGE_TYPES[file.contentType]) throw new ValidationError('use a png, jpeg, webp or pdf file');
    if (file.bytes.byteLength === 0) throw new ValidationError('that file is empty');
    if (file.bytes.byteLength > MAX_IMAGE_BYTES) throw new ValidationError('that file is too large (8 MB max)');

    await this.images.save(id, file.bytes, file.contentType);
    const updated: Ticket = { ...existing, image: { contentType: file.contentType, version: (existing.image?.version ?? 0) + 1 } };
    await this.repo.saveTicket(updated);
    return updated;
  }

  async removeImage(id: string): Promise<Ticket> {
    const { image: _removed, ...rest } = await this.require(id);
    await this.images.remove(id);
    await this.repo.saveTicket(rest);
    return rest;
  }

  async getImage(id: string) {
    await this.require(id);
    const image = await this.images.read(id);
    if (!image) throw new NotFoundError('this ticket has no file');
    return image;
  }

  private async require(id: string): Promise<Ticket> {
    const ticket = await this.repo.getTicket(id);
    if (!ticket) throw new NotFoundError('ticket not found');
    return ticket;
  }
}
