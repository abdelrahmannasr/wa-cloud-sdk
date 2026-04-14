/**
 * Example: Upload and Send Media
 *
 * Demonstrates: How to upload a media file and send it as a message
 *
 * Prerequisites:
 *   - npm install @abdelrahmannasr-wa/cloud-api
 *   - Prepare an image file at ./test-image.jpg (or update the path below)
 *
 * Required environment variables:
 *   - WHATSAPP_ACCESS_TOKEN: Your Meta access token
 *   - WHATSAPP_PHONE_NUMBER_ID: Your phone number ID
 *   - RECIPIENT_PHONE: The recipient's phone number (E.164 format)
 *
 * Run: npx tsx examples/media-upload.ts
 */

import { WhatsApp, MediaError } from '@abdelrahmannasr-wa/cloud-api';
import { readFileSync, existsSync } from 'fs';

async function main() {
  const wa = new WhatsApp({
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  });

  try {
    // Read the image file from disk
    const imagePath = './test-image.jpg';

    if (!existsSync(imagePath)) {
      console.error('Error: test-image.jpg not found. Please create or update the path.');
      return;
    }

    const fileBuffer = readFileSync(imagePath);

    // Upload the media file
    console.log('Uploading media...');
    const uploadResult = await wa.media.upload({
      file: fileBuffer,
      mimeType: 'image/jpeg',
      category: 'image',
      filename: 'test-image.jpg',
    });

    const mediaId = uploadResult.data.id;
    console.log('✓ Media uploaded successfully! ID:', mediaId);

    // Send the image as a message using the media ID
    console.log('Sending image message...');
    const messageResult = await wa.messages.sendImage({
      to: process.env.RECIPIENT_PHONE!,
      media: { id: mediaId },
      caption: 'Check out this image uploaded via the SDK!',
    });

    console.log('✓ Image message sent successfully!');
    console.log('Message ID:', messageResult.data.messages[0].id);
  } catch (error) {
    if (error instanceof MediaError) {
      console.error('Media Error:', error.message);
      console.error('Media Type:', error.mediaType);
      return;
    }

    console.error('Error:', error);
  } finally {
    wa.destroy();
  }
}

main();
