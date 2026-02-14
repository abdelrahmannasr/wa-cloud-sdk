import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Media } from '../../src/media/media.js';
import type { HttpClient } from '../../src/client/http-client.js';
import { MediaError, ValidationError, ApiError } from '../../src/errors/errors.js';

const PHONE_NUMBER_ID = '123456';

const MOCK_UPLOAD_RESPONSE = {
  data: { id: 'media123' },
  status: 200,
  headers: new Headers(),
};

function createMockClient(): {
  client: HttpClient;
  uploadSpy: ReturnType<typeof vi.fn>;
  getSpy: ReturnType<typeof vi.fn>;
  downloadMediaSpy: ReturnType<typeof vi.fn>;
  deleteSpy: ReturnType<typeof vi.fn>;
} {
  const uploadSpy = vi.fn().mockResolvedValue(MOCK_UPLOAD_RESPONSE);
  const getSpy = vi.fn();
  const downloadMediaSpy = vi.fn();
  const deleteSpy = vi.fn();

  const client = {
    upload: uploadSpy,
    get: getSpy,
    downloadMedia: downloadMediaSpy,
    delete: deleteSpy,
  } as unknown as HttpClient;

  return { client, uploadSpy, getSpy, downloadMediaSpy, deleteSpy };
}

describe('Media', () => {
  let uploadSpy: ReturnType<typeof vi.fn>;
  let getSpy: ReturnType<typeof vi.fn>;
  let downloadMediaSpy: ReturnType<typeof vi.fn>;
  let deleteSpy: ReturnType<typeof vi.fn>;
  let media: Media;

  beforeEach(() => {
    const mock = createMockClient();
    uploadSpy = mock.uploadSpy;
    getSpy = mock.getSpy;
    downloadMediaSpy = mock.downloadMediaSpy;
    deleteSpy = mock.deleteSpy;
    media = new Media(mock.client, PHONE_NUMBER_ID);
  });

  describe('upload', () => {
    describe('successful uploads', () => {
      it('should upload an image file', async () => {
        const imageBuffer = Buffer.from('fake-image-data');
        const result = await media.upload({
          file: imageBuffer,
          mimeType: 'image/jpeg',
          category: 'image',
          filename: 'test.jpg',
        });

        expect(result.data.id).toBe('media123');
        expect(uploadSpy).toHaveBeenCalledWith(
          `${PHONE_NUMBER_ID}/media`,
          expect.any(FormData),
          undefined,
        );

        // Verify FormData content
        const formData = uploadSpy.mock.calls[0]![1] as FormData;
        expect(formData.get('messaging_product')).toBe('whatsapp');
        expect(formData.get('type')).toBe('image/jpeg');
        expect(formData.get('file')).toBeInstanceOf(Blob);
      });

      it('should upload a video file', async () => {
        const videoBuffer = Buffer.from('fake-video-data');
        await media.upload({
          file: videoBuffer,
          mimeType: 'video/mp4',
          category: 'video',
        });

        expect(uploadSpy).toHaveBeenCalled();
      });

      it('should upload an audio file', async () => {
        const audioBuffer = Buffer.from('fake-audio-data');
        await media.upload({
          file: audioBuffer,
          mimeType: 'audio/aac',
          category: 'audio',
        });

        expect(uploadSpy).toHaveBeenCalled();
      });

      it('should upload a document file', async () => {
        const docBuffer = Buffer.from('fake-doc-data');
        await media.upload({
          file: docBuffer,
          mimeType: 'application/pdf',
          category: 'document',
        });

        expect(uploadSpy).toHaveBeenCalled();
      });

      it('should upload a static sticker', async () => {
        const stickerBuffer = Buffer.from('fake-sticker-data');
        await media.upload({
          file: stickerBuffer,
          mimeType: 'image/webp',
          category: 'sticker',
          stickerType: 'static',
        });

        expect(uploadSpy).toHaveBeenCalled();
      });

      it('should upload an animated sticker', async () => {
        const stickerBuffer = Buffer.from('fake-sticker-data');
        await media.upload({
          file: stickerBuffer,
          mimeType: 'image/webp',
          category: 'sticker',
          stickerType: 'animated',
        });

        expect(uploadSpy).toHaveBeenCalled();
      });

      it('should accept Blob as file input', async () => {
        const blob = new Blob(['fake-image-data'], { type: 'image/png' });
        const result = await media.upload({
          file: blob,
          mimeType: 'image/png',
          category: 'image',
        });

        expect(result.data.id).toBe('media123');
        expect(uploadSpy).toHaveBeenCalled();
      });

      it('should forward requestOptions to client', async () => {
        const imageBuffer = Buffer.from('fake-image-data');
        const requestOptions = { skipRateLimit: true };

        await media.upload(
          {
            file: imageBuffer,
            mimeType: 'image/jpeg',
            category: 'image',
          },
          requestOptions,
        );

        expect(uploadSpy).toHaveBeenCalledWith(
          `${PHONE_NUMBER_ID}/media`,
          expect.any(FormData),
          requestOptions,
        );
      });
    });

    describe('MIME type validation', () => {
      it('should reject unsupported MIME type for image', async () => {
        const buffer = Buffer.from('fake-data');

        await expect(
          media.upload({
            file: buffer,
            mimeType: 'application/exe',
            category: 'image',
          }),
        ).rejects.toThrow(MediaError);

        await expect(
          media.upload({
            file: buffer,
            mimeType: 'application/exe',
            category: 'image',
          }),
        ).rejects.toThrow('Unsupported MIME type "application/exe" for image');

        // Should not make network request
        expect(uploadSpy).not.toHaveBeenCalled();
      });

      it('should reject unsupported MIME type for video', async () => {
        const buffer = Buffer.from('fake-data');

        await expect(
          media.upload({
            file: buffer,
            mimeType: 'image/jpeg',
            category: 'video',
          }),
        ).rejects.toThrow(MediaError);
      });

      it('should reject unsupported MIME type for audio', async () => {
        const buffer = Buffer.from('fake-data');

        await expect(
          media.upload({
            file: buffer,
            mimeType: 'video/mp4',
            category: 'audio',
          }),
        ).rejects.toThrow(MediaError);
      });

      it('should reject unsupported MIME type for document', async () => {
        const buffer = Buffer.from('fake-data');

        await expect(
          media.upload({
            file: buffer,
            mimeType: 'application/exe',
            category: 'document',
          }),
        ).rejects.toThrow(MediaError);
      });

      it('should reject unsupported MIME type for sticker', async () => {
        const buffer = Buffer.from('fake-data');

        await expect(
          media.upload({
            file: buffer,
            mimeType: 'image/jpeg',
            category: 'sticker',
            stickerType: 'static',
          }),
        ).rejects.toThrow(MediaError);
      });
    });

    describe('file size validation', () => {
      it('should reject oversized image (>5MB)', async () => {
        const oversizedBuffer = Buffer.alloc(5_242_881); // 5MB + 1 byte

        await expect(
          media.upload({
            file: oversizedBuffer,
            mimeType: 'image/jpeg',
            category: 'image',
          }),
        ).rejects.toThrow(MediaError);

        await expect(
          media.upload({
            file: oversizedBuffer,
            mimeType: 'image/jpeg',
            category: 'image',
          }),
        ).rejects.toThrow('exceeds limit of 5.00 MB');

        expect(uploadSpy).not.toHaveBeenCalled();
      });

      it('should accept image at exact size limit (5MB)', async () => {
        const exactSizeBuffer = Buffer.alloc(5_242_880); // Exactly 5MB

        await media.upload({
          file: exactSizeBuffer,
          mimeType: 'image/jpeg',
          category: 'image',
        });

        expect(uploadSpy).toHaveBeenCalled();
      });

      it('should reject oversized video (>16MB)', async () => {
        const oversizedBuffer = Buffer.alloc(16_777_217); // 16MB + 1 byte

        await expect(
          media.upload({
            file: oversizedBuffer,
            mimeType: 'video/mp4',
            category: 'video',
          }),
        ).rejects.toThrow('exceeds limit of 16.00 MB');
      });

      it('should reject oversized audio (>16MB)', async () => {
        const oversizedBuffer = Buffer.alloc(16_777_217);

        await expect(
          media.upload({
            file: oversizedBuffer,
            mimeType: 'audio/aac',
            category: 'audio',
          }),
        ).rejects.toThrow('exceeds limit of 16.00 MB');
      });

      it('should reject oversized document (>100MB)', async () => {
        const oversizedBuffer = Buffer.alloc(104_857_601); // 100MB + 1 byte

        await expect(
          media.upload({
            file: oversizedBuffer,
            mimeType: 'application/pdf',
            category: 'document',
          }),
        ).rejects.toThrow('exceeds limit of 100.00 MB');
      });

      it('should reject oversized static sticker (>500KB)', async () => {
        const oversizedBuffer = Buffer.alloc(512_001); // 500KB + 1 byte

        await expect(
          media.upload({
            file: oversizedBuffer,
            mimeType: 'image/webp',
            category: 'sticker',
            stickerType: 'static',
          }),
        ).rejects.toThrow('exceeds limit of 0.49 MB for static sticker');
      });

      it('should reject oversized animated sticker (>1MB)', async () => {
        const oversizedBuffer = Buffer.alloc(1_048_577); // 1MB + 1 byte

        await expect(
          media.upload({
            file: oversizedBuffer,
            mimeType: 'image/webp',
            category: 'sticker',
            stickerType: 'animated',
          }),
        ).rejects.toThrow('exceeds limit of 1.00 MB for animated sticker');
      });
    });

    describe('empty file validation', () => {
      it('should reject empty Buffer (0 bytes)', async () => {
        const emptyBuffer = Buffer.alloc(0);

        await expect(
          media.upload({
            file: emptyBuffer,
            mimeType: 'image/jpeg',
            category: 'image',
          }),
        ).rejects.toThrow(MediaError);

        await expect(
          media.upload({
            file: emptyBuffer,
            mimeType: 'image/jpeg',
            category: 'image',
          }),
        ).rejects.toThrow('File must not be empty (0 bytes)');

        expect(uploadSpy).not.toHaveBeenCalled();
      });

      it('should reject empty Blob (0 bytes)', async () => {
        const emptyBlob = new Blob([], { type: 'image/jpeg' });

        await expect(
          media.upload({
            file: emptyBlob,
            mimeType: 'image/jpeg',
            category: 'image',
          }),
        ).rejects.toThrow('File must not be empty (0 bytes)');
      });
    });

    describe('sticker type validation', () => {
      it('should reject sticker without stickerType', async () => {
        const buffer = Buffer.from('fake-sticker-data');

        await expect(
          media.upload({
            file: buffer,
            mimeType: 'image/webp',
            category: 'sticker',
            stickerType: undefined,
          }),
        ).rejects.toThrow(ValidationError);

        await expect(
          media.upload({
            file: buffer,
            mimeType: 'image/webp',
            category: 'sticker',
            stickerType: undefined,
          }),
        ).rejects.toThrow('stickerType is required when category is "sticker"');

        expect(uploadSpy).not.toHaveBeenCalled();
      });

      it('should apply static size limit when stickerType is "static"', async () => {
        const validStatic = Buffer.alloc(512_000); // Exactly 500KB
        await media.upload({
          file: validStatic,
          mimeType: 'image/webp',
          category: 'sticker',
          stickerType: 'static',
        });

        expect(uploadSpy).toHaveBeenCalled();
        uploadSpy.mockClear();

        const oversizedStatic = Buffer.alloc(512_001);
        await expect(
          media.upload({
            file: oversizedStatic,
            mimeType: 'image/webp',
            category: 'sticker',
            stickerType: 'static',
          }),
        ).rejects.toThrow(MediaError);

        expect(uploadSpy).not.toHaveBeenCalled();
      });

      it('should apply animated size limit when stickerType is "animated"', async () => {
        const validAnimated = Buffer.alloc(1_048_576); // Exactly 1MB
        await media.upload({
          file: validAnimated,
          mimeType: 'image/webp',
          category: 'sticker',
          stickerType: 'animated',
        });

        expect(uploadSpy).toHaveBeenCalled();
        uploadSpy.mockClear();

        const oversizedAnimated = Buffer.alloc(1_048_577);
        await expect(
          media.upload({
            file: oversizedAnimated,
            mimeType: 'image/webp',
            category: 'sticker',
            stickerType: 'animated',
          }),
        ).rejects.toThrow(MediaError);

        expect(uploadSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('getUrl', () => {
    const MOCK_URL_RESPONSE = {
      data: {
        id: 'media123',
        url: 'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=123&ext=abc',
        mime_type: 'image/jpeg',
        sha256: 'abc123def456',
        file_size: 1048576,
        messaging_product: 'whatsapp',
      },
      status: 200,
      headers: new Headers(),
    };

    beforeEach(() => {
      getSpy.mockResolvedValue(MOCK_URL_RESPONSE);
    });

    it('should retrieve media URL and metadata', async () => {
      const result = await media.getUrl('media123');

      expect(result.data.id).toBe('media123');
      expect(result.data.url).toBe(
        'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=123&ext=abc',
      );
      expect(result.data.mime_type).toBe('image/jpeg');
      expect(result.data.file_size).toBe(1048576);

      expect(getSpy).toHaveBeenCalledWith('media123', undefined);
    });

    it('should forward requestOptions to client', async () => {
      const requestOptions = { skipRateLimit: true };
      await media.getUrl('media123', requestOptions);

      expect(getSpy).toHaveBeenCalledWith('media123', requestOptions);
    });

    it('should propagate ApiError for 404 not found', async () => {
      const error = new ApiError('Media not found', 404, 'OAuthException');
      getSpy.mockRejectedValue(error);

      await expect(media.getUrl('invalid-id')).rejects.toThrow(ApiError);
      await expect(media.getUrl('invalid-id')).rejects.toThrow('Media not found');
    });
  });

  describe('download', () => {
    const MOCK_DOWNLOAD_RESPONSE = {
      data: new ArrayBuffer(1024),
      status: 200,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
    };

    beforeEach(() => {
      downloadMediaSpy.mockResolvedValue(MOCK_DOWNLOAD_RESPONSE);
    });

    it('should download media content', async () => {
      const url = 'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=123';
      const result = await media.download(url);

      expect(result.data).toBeInstanceOf(ArrayBuffer);
      expect(result.data.byteLength).toBe(1024);

      expect(downloadMediaSpy).toHaveBeenCalledWith(url, undefined);
    });

    it('should forward requestOptions including signal', async () => {
      const url = 'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=123';
      const controller = new AbortController();
      const requestOptions = { signal: controller.signal };

      await media.download(url, requestOptions);

      expect(downloadMediaSpy).toHaveBeenCalledWith(url, requestOptions);
    });

    it('should propagate ApiError for expired URLs', async () => {
      const error = new ApiError('URL expired', 403, 'OAuthException');
      downloadMediaSpy.mockRejectedValue(error);

      const url = 'https://expired-url.example.com';
      await expect(media.download(url)).rejects.toThrow(ApiError);
      await expect(media.download(url)).rejects.toThrow('URL expired');
    });

    it('should reject non-HTTPS URLs to prevent credential leakage', async () => {
      await expect(media.download('http://insecure-url.example.com/media')).rejects.toThrow(
        MediaError,
      );

      await expect(media.download('http://insecure-url.example.com/media')).rejects.toThrow(
        'Media download URL must use HTTPS',
      );

      expect(downloadMediaSpy).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    const MOCK_DELETE_RESPONSE = {
      data: { success: true },
      status: 200,
      headers: new Headers(),
    };

    beforeEach(() => {
      deleteSpy.mockResolvedValue(MOCK_DELETE_RESPONSE);
    });

    it('should delete media successfully', async () => {
      const result = await media.delete('media123');

      expect(result.data.success).toBe(true);
      expect(deleteSpy).toHaveBeenCalledWith('media123', undefined);
    });

    it('should forward requestOptions to client', async () => {
      const requestOptions = { skipRateLimit: true };
      await media.delete('media123', requestOptions);

      expect(deleteSpy).toHaveBeenCalledWith('media123', requestOptions);
    });

    it('should propagate ApiError for 404 not found', async () => {
      const error = new ApiError('Media not found', 404, 'OAuthException');
      deleteSpy.mockRejectedValue(error);

      await expect(media.delete('invalid-id')).rejects.toThrow(ApiError);
      await expect(media.delete('invalid-id')).rejects.toThrow('Media not found');
    });

    it('should propagate ApiError for 403 unauthorized', async () => {
      const error = new ApiError('Unauthorized to delete media', 403, 'OAuthException');
      deleteSpy.mockRejectedValue(error);

      await expect(media.delete('unauthorized-id')).rejects.toThrow(ApiError);
      await expect(media.delete('unauthorized-id')).rejects.toThrow('Unauthorized to delete media');
    });
  });
});
