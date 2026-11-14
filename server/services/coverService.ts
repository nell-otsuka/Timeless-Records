import { COVER_ID, COVER_TYPES, MAX_COVER_BYTES, type CoverStore } from '../store/coverStore';
import { NotFoundError, ValidationError } from './errors';
import type { UploadedFile } from './ticketService';

export class CoverService {
  constructor(private readonly store: CoverStore) {}

  /** Stores an uploaded poster and returns the URL to use as a movie's or ticket's `coverUrl`. */
  async upload(file: UploadedFile): Promise<{ url: string }> {
    if (!COVER_TYPES[file.contentType]) throw new ValidationError('use a png, jpeg or webp image');
    if (file.bytes.byteLength === 0) throw new ValidationError('that image is empty');
    if (file.bytes.byteLength > MAX_COVER_BYTES) throw new ValidationError('that image is too large (5 MB max)');
    const id = await this.store.save(file.bytes, file.contentType);
    return { url: `/api/covers/${id}` };
  }

  async get(id: string) {
    const cover = COVER_ID.test(id) ? await this.store.read(id) : null;
    if (!cover) throw new NotFoundError('cover not found');
    return cover;
  }
}
