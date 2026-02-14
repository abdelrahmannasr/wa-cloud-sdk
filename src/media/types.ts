/**
 * Media category types for the WhatsApp Cloud API
 * @packageDocumentation
 */

/**
 * Media category type for upload validation
 *
 * Determines MIME type validation and size limits during upload.
 *
 * @example
 * ```typescript
 * const category: MediaCategory = 'image';
 * await media.upload({
 *   file: imageBuffer,
 *   mimeType: 'image/jpeg',
 *   category: category,
 * });
 * ```
 */
export type MediaCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker';

/**
 * Sticker subtype for determining size limits
 *
 * Static stickers have a 500KB limit, animated stickers have a 1MB limit.
 *
 * @example
 * ```typescript
 * await media.upload({
 *   file: stickerBuffer,
 *   mimeType: 'image/webp',
 *   category: 'sticker',
 *   stickerType: 'static', // Required for stickers
 * });
 * ```
 */
export type StickerSubtype = 'static' | 'animated';

/**
 * Validation constraint for a media category
 *
 * Defines the accepted MIME types and maximum file size for a category.
 *
 * @example
 * ```typescript
 * const imageConstraint: MediaConstraint = MEDIA_CONSTRAINTS.image;
 * console.log(imageConstraint.maxSizeBytes); // 5242880 (5 MB)
 * console.log(imageConstraint.mimeTypes.has('image/jpeg')); // true
 * ```
 */
export interface MediaConstraint {
  /** Accepted MIME types for this category */
  readonly mimeTypes: ReadonlySet<string>;
  /** Maximum file size in bytes */
  readonly maxSizeBytes: number;
}

/**
 * Media constraints per category
 *
 * Defines MIME type allow-lists and size limits for each media category.
 * For stickers, access constraints via MEDIA_CONSTRAINTS.sticker[stickerType].
 *
 * @example
 * ```typescript
 * import { MEDIA_CONSTRAINTS } from '@abdelrahmannasr-wa/cloud-api';
 *
 * // Check if a MIME type is supported for images
 * const isJpegSupported = MEDIA_CONSTRAINTS.image.mimeTypes.has('image/jpeg'); // true
 *
 * // Get maximum file size for videos
 * const maxVideoSize = MEDIA_CONSTRAINTS.video.maxSizeBytes; // 16777216 (16 MB)
 *
 * // Access sticker constraints by subtype
 * const staticStickerLimit = MEDIA_CONSTRAINTS.sticker.static.maxSizeBytes; // 512000 (500 KB)
 * const animatedStickerLimit = MEDIA_CONSTRAINTS.sticker.animated.maxSizeBytes; // 1048576 (1 MB)
 * ```
 */
export const MEDIA_CONSTRAINTS = {
  image: {
    mimeTypes: new Set(['image/jpeg', 'image/png']),
    maxSizeBytes: 5_242_880, // 5 MB
  },
  video: {
    mimeTypes: new Set(['video/mp4', 'video/3gpp']),
    maxSizeBytes: 16_777_216, // 16 MB
  },
  audio: {
    mimeTypes: new Set([
      'audio/aac',
      'audio/mp4',
      'audio/mpeg',
      'audio/amr',
      'audio/ogg',
    ]),
    maxSizeBytes: 16_777_216, // 16 MB
  },
  document: {
    mimeTypes: new Set([
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation',
    ]),
    maxSizeBytes: 104_857_600, // 100 MB
  },
  sticker: {
    static: {
      mimeTypes: new Set(['image/webp']),
      maxSizeBytes: 512_000, // 500 KB
    },
    animated: {
      mimeTypes: new Set(['image/webp']),
      maxSizeBytes: 1_048_576, // 1 MB
    },
  },
} as const;

/**
 * Options for uploading media
 *
 * Specifies the file content, MIME type, and category for validation.
 * For stickers, stickerType is required to determine size limits.
 *
 * @example
 * ```typescript
 * import { readFile } from 'node:fs/promises';
 *
 * // Upload an image
 * const imageBuffer = await readFile('./photo.jpg');
 * await media.upload({
 *   file: imageBuffer,
 *   mimeType: 'image/jpeg',
 *   category: 'image',
 *   filename: 'photo.jpg',
 * });
 *
 * // Upload a static sticker
 * const stickerBuffer = await readFile('./sticker.webp');
 * await media.upload({
 *   file: stickerBuffer,
 *   mimeType: 'image/webp',
 *   category: 'sticker',
 *   stickerType: 'static', // Required for stickers
 * });
 * ```
 */
export interface MediaUploadOptions {
  /** File content as Buffer or Blob */
  readonly file: Buffer | Blob;
  /** MIME type of the file (e.g., 'image/jpeg') */
  readonly mimeType: string;
  /** Media category for validation */
  readonly category: MediaCategory;
  /** Optional filename hint for the platform */
  readonly filename?: string;
  /** Required for sticker category: 'static' or 'animated' */
  readonly stickerType?: StickerSubtype;
}

/**
 * Platform response after successful media upload
 *
 * Contains the platform-assigned media identifier that can be used in messages
 * or for URL retrieval, download, and deletion operations.
 *
 * @example
 * ```typescript
 * const result = await media.upload({
 *   file: imageBuffer,
 *   mimeType: 'image/jpeg',
 *   category: 'image',
 * });
 * console.log('Uploaded media ID:', result.data.id);
 *
 * // Use the media ID in a message
 * await messages.sendImage({
 *   to: '1234567890',
 *   mediaId: result.data.id,
 * });
 * ```
 */
export interface MediaUploadResponse {
  /** Platform-assigned media identifier */
  readonly id: string;
}

/**
 * Platform response when retrieving a media asset's download URL
 *
 * Provides metadata and a temporary, authenticated download URL for the media.
 * The URL expires after a short period (typically 5 minutes).
 *
 * @example
 * ```typescript
 * const urlResult = await media.getUrl('media123');
 * console.log('Download URL:', urlResult.data.url);
 * console.log('MIME type:', urlResult.data.mime_type);
 * console.log('File size:', urlResult.data.file_size, 'bytes');
 * console.log('SHA-256:', urlResult.data.sha256);
 *
 * // Download the actual content
 * const downloadResult = await media.download(urlResult.data.url);
 * ```
 */
export interface MediaUrlResponse {
  /** The media identifier */
  readonly id: string;
  /** Temporary, authenticated download URL */
  readonly url: string;
  /** Content type of the media asset */
  readonly mime_type: string;
  /** SHA-256 hash of the media content */
  readonly sha256: string;
  /** File size in bytes */
  readonly file_size: number;
  /** Always "whatsapp" */
  readonly messaging_product: string;
}

/**
 * Platform response after successful media deletion
 *
 * Confirms that the media asset was deleted from the platform.
 *
 * @example
 * ```typescript
 * const deleteResult = await media.delete('media123');
 * console.log('Deleted:', deleteResult.data.success); // true
 * ```
 */
export interface MediaDeleteResponse {
  /** True if deletion succeeded */
  readonly success: boolean;
}
