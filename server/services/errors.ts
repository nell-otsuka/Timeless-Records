/** Errors the HTTP layer maps to status codes (see server/app.ts). */
export class ValidationError extends Error {}
export class ConflictError extends Error {}
export class UpstreamError extends Error {}
export class NotFoundError extends Error {}
