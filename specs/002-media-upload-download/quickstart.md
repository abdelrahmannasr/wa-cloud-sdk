# Quickstart: Media Upload, Download, and Management

**Branch**: `002-media-upload-download` | **Date**: 2026-02-14 | **Plan**: [plan.md](./plan.md)

## Prerequisites

- Node.js 18 or later
- `@abdelrahmannasr-wa/cloud-api` SDK installed
- Valid WhatsApp Cloud API access token and phone number ID

---

## Upload a Media File

```typescript
import { HttpClient, Media } from '@abdelrahmannasr-wa/cloud-api';
import { readFile } from 'node:fs/promises';

const client = new HttpClient({
  accessToken: 'YOUR_ACCESS_TOKEN',
  phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
});

const media = new Media(client, 'YOUR_PHONE_NUMBER_ID');

// Read file from disk
const fileBuffer = await readFile('./photo.jpg');

// Upload with validation
const uploadResult = await media.upload({
  file: fileBuffer,
  mimeType: 'image/jpeg',
  category: 'image',
  filename: 'photo.jpg',
});

console.log('Media ID:', uploadResult.data.id);
// → Media ID: 1234567890
```

---

## Retrieve a Media URL

```typescript
// Get the download URL for a media asset
const urlResult = await media.getUrl('1234567890');

console.log('Download URL:', urlResult.data.url);
console.log('MIME type:', urlResult.data.mime_type);
console.log('File size:', urlResult.data.file_size);
```

---

## Download Media Content

```typescript
import { writeFile } from 'node:fs/promises';

// Download binary content from the URL
const downloadResult = await media.download(urlResult.data.url);

// Save to disk
await writeFile('./downloaded-photo.jpg', Buffer.from(downloadResult.data));
```

---

## Delete Media

```typescript
// Remove a previously uploaded media asset
const deleteResult = await media.delete('1234567890');

console.log('Deleted:', deleteResult.data.success);
// → Deleted: true
```

---

## Full Inbound Media Workflow

When you receive an inbound media message via webhooks, the payload contains a media ID — not the file itself. Here's how to retrieve and download it:

```typescript
import { HttpClient, Media, createWebhookHandler } from '@abdelrahmannasr-wa/cloud-api';
import { writeFile } from 'node:fs/promises';

const client = new HttpClient({
  accessToken: 'YOUR_ACCESS_TOKEN',
  phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
});

const media = new Media(client, 'YOUR_PHONE_NUMBER_ID');

const handler = createWebhookHandler(
  { appSecret: 'YOUR_APP_SECRET', verifyToken: 'YOUR_VERIFY_TOKEN' },
  {
    onMessage: async (event) => {
      if (event.type === 'image' && event.image) {
        // Step 1: Get the download URL
        const urlResult = await media.getUrl(event.image.id);

        // Step 2: Download the binary content
        const downloadResult = await media.download(urlResult.data.url);

        // Step 3: Save to disk
        await writeFile(`./received-${event.image.id}.jpg`, Buffer.from(downloadResult.data));
      }
    },
  },
);
```

---

## Upload a Sticker

Stickers require specifying the subtype (static or animated) to apply the correct size limit:

```typescript
const stickerBuffer = await readFile('./sticker.webp');

// Static sticker (max 500 KB)
const staticResult = await media.upload({
  file: stickerBuffer,
  mimeType: 'image/webp',
  category: 'sticker',
  stickerType: 'static',
});

// Animated sticker (max 1 MB)
const animatedResult = await media.upload({
  file: animatedStickerBuffer,
  mimeType: 'image/webp',
  category: 'sticker',
  stickerType: 'animated',
});
```

---

## Error Handling

```typescript
import { MediaError, ValidationError, ApiError } from '@abdelrahmannasr-wa/cloud-api';

try {
  await media.upload({
    file: oversizedBuffer,
    mimeType: 'image/jpeg',
    category: 'image',
  });
} catch (error) {
  if (error instanceof MediaError) {
    // Client-side validation: wrong MIME, oversized, empty file
    console.error('Media validation failed:', error.message);
    console.error('Media type:', error.mediaType); // e.g., 'image'
  } else if (error instanceof ValidationError) {
    // Missing required field (e.g., stickerType for stickers)
    console.error('Validation error:', error.message);
  } else if (error instanceof ApiError) {
    // Platform rejected the request
    console.error('API error:', error.statusCode, error.message);
  }
}
```

---

## Cancelling a Download

```typescript
const controller = new AbortController();

// Start download with cancellation signal
const downloadPromise = media.download(urlResult.data.url, {
  signal: controller.signal,
});

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  const result = await downloadPromise;
} catch (error) {
  // AbortError if cancelled
}
```
