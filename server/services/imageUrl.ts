/** A cover can be any http(s) image, or one uploaded to this server (`/api/covers/<id>`). */
export const isImageUrl = (value: string): boolean => /^(https?:\/\/\S+|\/api\/covers\/[a-f0-9]{64})$/.test(value);
