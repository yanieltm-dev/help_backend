export const MEDIA_UPLOAD_STRATEGY = {
  DIRECT: 'direct',
  PRESIGNED: 'presigned',
} as const;

export type MediaUploadStrategy =
  (typeof MEDIA_UPLOAD_STRATEGY)[keyof typeof MEDIA_UPLOAD_STRATEGY];
