import type { HttpClient } from '../client/http-client.js';
import type {
  MediaUploadOptions,
  MediaUploadResponse,
  MediaUrlResponse,
  MediaDeleteResponse,
} from './types.js';
import { MEDIA_CONSTRAINTS } from './types.js';
import type { ApiResponse, RequestOptions } from '../client/types.js';
import { MediaError, ValidationError } from '../errors/errors.js';

/**
 * Media operations for the WhatsApp Cloud API
 *
 * Provides methods for uploading, retrieving, downloading, and deleting media assets.
 */
export class Media {
  private readonly client: HttpClient;
  private readonly phoneNumberId: string;

  /**
   * Creates a new Media instance
   *
   * @param client - HTTP client for making API requests
   * @param phoneNumberId - WhatsApp phone number ID for uploads
   */
  constructor(client: HttpClient, phoneNumberId: string) {
    this.client = client;
    this.phoneNumberId = phoneNumberId;
  }

  /**
   * Validate media upload options before making a network request
   *
   * @param options - Upload options to validate
   * @throws {MediaError} For validation failures
   * @throws {ValidationError} For missing required fields
   */
  private validateUpload(options: MediaUploadOptions): void {
    const { file, mimeType, category, stickerType } = options;

    // Check file is not empty
    const fileSize =
      file instanceof Buffer
        ? file.byteLength
        : (file as Blob).size;
    if (fileSize === 0) {
      throw new MediaError(
        'File must not be empty (0 bytes)',
        category,
      );
    }

    // For stickers, require stickerType
    if (category === 'sticker') {
      if (!stickerType) {
        throw new ValidationError(
          'stickerType is required when category is "sticker"',
          'stickerType',
        );
      }

      // Validate MIME type against sticker constraints
      const constraint = MEDIA_CONSTRAINTS.sticker[stickerType];
      if (!constraint.mimeTypes.has(mimeType)) {
        throw new MediaError(
          `Unsupported MIME type "${mimeType}" for ${stickerType} sticker. Accepted: ${Array.from(constraint.mimeTypes).join(', ')}`,
          category,
        );
      }

      // Check size limit for sticker subtype
      if (fileSize > constraint.maxSizeBytes) {
        const limitMB = (constraint.maxSizeBytes / 1_048_576).toFixed(2);
        const sizeMB = (fileSize / 1_048_576).toFixed(2);
        throw new MediaError(
          `File size ${sizeMB} MB exceeds limit of ${limitMB} MB for ${stickerType} sticker`,
          category,
        );
      }
    } else {
      // Validate MIME type against category constraints
      const constraint = MEDIA_CONSTRAINTS[category];
      if (!constraint.mimeTypes.has(mimeType)) {
        throw new MediaError(
          `Unsupported MIME type "${mimeType}" for ${category}. Accepted: ${Array.from(constraint.mimeTypes).join(', ')}`,
          category,
        );
      }

      // Check size limit
      if (fileSize > constraint.maxSizeBytes) {
        const limitMB = (constraint.maxSizeBytes / 1_048_576).toFixed(2);
        const sizeMB = (fileSize / 1_048_576).toFixed(2);
        throw new MediaError(
          `File size ${sizeMB} MB exceeds limit of ${limitMB} MB for ${category}`,
          category,
        );
      }
    }
  }

  /**
   * Upload a media file to the platform
   *
   * @param options - Upload options including file content and metadata
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to upload response with media ID
   * @throws {MediaError} For validation failures (empty file, bad MIME, oversized)
   * @throws {ValidationError} For missing required fields
   * @throws {ApiError} For platform rejections
   *
   * @example
   * ```typescript
   * import { readFile } from 'node:fs/promises';
   * const fileBuffer = await readFile('./photo.jpg');
   * const result = await media.upload({
   *   file: fileBuffer,
   *   mimeType: 'image/jpeg',
   *   category: 'image',
   *   filename: 'photo.jpg',
   * });
   * console.log('Media ID:', result.data.id);
   * ```
   */
  async upload(
    options: MediaUploadOptions,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MediaUploadResponse>> {
    // Validate before making network request
    this.validateUpload(options);

    const { file, mimeType, filename } = options;

    // Build FormData
    const formData = new FormData();
    formData.append('messaging_product', 'whatsapp');

    // Convert file to Blob if it's a Buffer
    const blob = file instanceof Buffer
      ? new Blob([file], { type: mimeType })
      : file;

    // Append file with optional filename
    if (filename) {
      formData.append('file', blob, filename);
    } else {
      formData.append('file', blob);
    }

    formData.append('type', mimeType);

    // Upload via HttpClient
    return this.client.upload<MediaUploadResponse>(
      `${this.phoneNumberId}/media`,
      formData,
      requestOptions,
    );
  }

  /**
   * Retrieve the download URL and metadata for a media asset
   *
   * @param mediaId - Platform-assigned media identifier
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to media URL response
   * @throws {ApiError} For platform errors (404 not found, etc.)
   *
   * @example
   * ```typescript
   * const urlResult = await media.getUrl('1234567890');
   * console.log('Download URL:', urlResult.data.url);
   * console.log('MIME type:', urlResult.data.mime_type);
   * console.log('File size:', urlResult.data.file_size);
   * ```
   */
  async getUrl(
    mediaId: string,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MediaUrlResponse>> {
    return this.client.get<MediaUrlResponse>(mediaId, requestOptions);
  }

  /**
   * Download binary content of a media asset from a platform URL
   *
   * @param mediaUrl - Download URL from getUrl() response
   * @param requestOptions - Optional request configuration (supports signal for cancellation)
   * @returns Promise resolving to binary file data
   * @throws {ApiError} For expired/invalid URLs
   *
   * @example
   * ```typescript
   * const urlResult = await media.getUrl('media123');
   * const downloadResult = await media.download(urlResult.data.url);
   * await writeFile('./downloaded.jpg', Buffer.from(downloadResult.data));
   * ```
   */
  async download(
    mediaUrl: string,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<ArrayBuffer>> {
    return this.client.downloadMedia(mediaUrl, requestOptions);
  }

  /**
   * Delete a previously uploaded media asset
   *
   * @param mediaId - Platform-assigned media identifier
   * @param requestOptions - Optional request configuration
   * @returns Promise resolving to deletion confirmation
   * @throws {ApiError} For platform errors (404 not found, 403 unauthorized)
   *
   * @example
   * ```typescript
   * const deleteResult = await media.delete('1234567890');
   * console.log('Deleted:', deleteResult.data.success);
   * ```
   */
  async delete(
    mediaId: string,
    requestOptions?: RequestOptions,
  ): Promise<ApiResponse<MediaDeleteResponse>> {
    return this.client.delete<MediaDeleteResponse>(mediaId, requestOptions);
  }
}
