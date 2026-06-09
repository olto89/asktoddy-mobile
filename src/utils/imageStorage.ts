import * as FileSystem from 'expo-file-system';
import { logger } from '../services/Logger';

/**
 * Directory for persisted quote photos.
 * Files in documentDirectory survive app restarts and OS cache cleanup.
 */
const PHOTOS_DIR = `${FileSystem.documentDirectory}quote-photos/`;

/**
 * Ensure the quote-photos directory exists.
 */
async function ensurePhotosDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

/**
 * Check if a URI is already persisted in our documentDirectory.
 */
export function isPersistedUri(uri: string): boolean {
  return uri.startsWith(PHOTOS_DIR);
}

/**
 * Persist a temporary image URI to documentDirectory.
 * Returns the permanent URI. If the image is already persisted, returns it as-is.
 */
export async function persistImage(tempUri: string): Promise<string> {
  if (isPersistedUri(tempUri)) {
    return tempUri;
  }

  try {
    await ensurePhotosDir();

    // Generate a unique filename based on timestamp + random suffix
    const ext = tempUri.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const destUri = `${PHOTOS_DIR}${filename}`;

    await FileSystem.copyAsync({ from: tempUri, to: destUri });
    logger.debug(`📸 Persisted image: ${filename}`);
    return destUri;
  } catch (error) {
    logger.warn('Failed to persist image, keeping original URI:', error);
    // Return original URI as fallback — it may still work within this session
    return tempUri;
  }
}

/**
 * Persist multiple images in parallel.
 * Returns array of permanent URIs in the same order.
 */
export async function persistImages(tempUris: string[]): Promise<string[]> {
  return Promise.all(tempUris.map(uri => persistImage(uri)));
}

/**
 * Delete a persisted image file. No-op if file doesn't exist or isn't in our directory.
 */
export async function deletePersistedImage(uri: string): Promise<void> {
  if (!isPersistedUri(uri)) return;

  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      logger.debug(`🗑️ Deleted persisted image: ${uri.split('/').pop()}`);
    }
  } catch (error) {
    logger.warn('Failed to delete persisted image:', error);
  }
}

/**
 * Delete multiple persisted images.
 */
export async function deletePersistedImages(uris: string[]): Promise<void> {
  await Promise.all(uris.map(uri => deletePersistedImage(uri)));
}

/**
 * Check if a persisted image file still exists on disk.
 */
export async function imageExists(uri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Filter out any photo URIs whose files no longer exist on disk.
 * Useful when restoring a draft to avoid showing broken image thumbnails.
 */
export async function filterValidPhotos(uris: string[]): Promise<string[]> {
  const results = await Promise.all(
    uris.map(async uri => ({ uri, exists: await imageExists(uri) }))
  );
  const valid = results.filter(r => r.exists).map(r => r.uri);
  const removed = uris.length - valid.length;
  if (removed > 0) {
    logger.warn(`📸 Removed ${removed} photo(s) with missing files from draft`);
  }
  return valid;
}
