import * as FileSystem from 'expo-file-system';
import {
  persistImage,
  persistImages,
  deletePersistedImage,
  deletePersistedImages,
  isPersistedUri,
  imageExists,
  filterValidPhotos,
} from '../imageStorage';

const PHOTOS_DIR = `${FileSystem.documentDirectory}quote-photos/`;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('isPersistedUri', () => {
  it('returns true for URIs in the quote-photos directory', () => {
    expect(isPersistedUri(`${PHOTOS_DIR}photo_123.jpg`)).toBe(true);
  });

  it('returns false for temporary cache URIs', () => {
    expect(isPersistedUri('file:///tmp/ImagePicker/abc123.jpg')).toBe(false);
  });

  it('returns false for gallery URIs', () => {
    expect(isPersistedUri('ph://asset-abc-123')).toBe(false);
  });
});

describe('persistImage', () => {
  it('copies a temporary image to documentDirectory', async () => {
    const tempUri = 'file:///tmp/ImagePicker/photo.jpg';
    const result = await persistImage(tempUri);

    expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(PHOTOS_DIR);
    expect(FileSystem.copyAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        from: tempUri,
        to: expect.stringContaining(PHOTOS_DIR),
      })
    );
    expect(result).toContain(PHOTOS_DIR);
    expect(result).toMatch(/\.jpg$/);
  });

  it('preserves the file extension', async () => {
    const pngUri = 'file:///tmp/ImagePicker/photo.png';
    const result = await persistImage(pngUri);
    expect(result).toMatch(/\.png$/);
  });

  it('returns the same URI if already persisted', async () => {
    const persistedUri = `${PHOTOS_DIR}photo_existing.jpg`;
    const result = await persistImage(persistedUri);

    expect(result).toBe(persistedUri);
    expect(FileSystem.copyAsync).not.toHaveBeenCalled();
  });

  it('creates the photos directory if it does not exist', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });

    await persistImage('file:///tmp/photo.jpg');

    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(PHOTOS_DIR, {
      intermediates: true,
    });
  });

  it('does not create directory if it already exists', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });

    await persistImage('file:///tmp/photo.jpg');

    expect(FileSystem.makeDirectoryAsync).not.toHaveBeenCalled();
  });

  it('returns original URI on copy failure', async () => {
    (FileSystem.copyAsync as jest.Mock).mockRejectedValueOnce(new Error('disk full'));
    const tempUri = 'file:///tmp/photo.jpg';

    const result = await persistImage(tempUri);

    expect(result).toBe(tempUri);
  });
});

describe('persistImages', () => {
  it('persists multiple images in parallel', async () => {
    const uris = ['file:///tmp/photo1.jpg', 'file:///tmp/photo2.png', 'file:///tmp/photo3.jpg'];

    const results = await persistImages(uris);

    expect(results).toHaveLength(3);
    expect(FileSystem.copyAsync).toHaveBeenCalledTimes(3);
    results.forEach(uri => expect(uri).toContain(PHOTOS_DIR));
  });

  it('returns empty array for empty input', async () => {
    const results = await persistImages([]);
    expect(results).toEqual([]);
  });
});

describe('deletePersistedImage', () => {
  it('deletes a persisted image file', async () => {
    const uri = `${PHOTOS_DIR}photo_123.jpg`;
    await deletePersistedImage(uri);

    expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(uri);
    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(uri, { idempotent: true });
  });

  it('does nothing for non-persisted URIs', async () => {
    await deletePersistedImage('file:///tmp/photo.jpg');
    expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
  });

  it('does nothing if file does not exist', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });
    const uri = `${PHOTOS_DIR}photo_gone.jpg`;

    await deletePersistedImage(uri);

    expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
  });

  it('handles delete errors gracefully', async () => {
    (FileSystem.deleteAsync as jest.Mock).mockRejectedValueOnce(new Error('permission denied'));
    const uri = `${PHOTOS_DIR}photo_123.jpg`;

    // Should not throw
    await deletePersistedImage(uri);
  });
});

describe('deletePersistedImages', () => {
  it('deletes multiple images', async () => {
    const uris = [`${PHOTOS_DIR}photo1.jpg`, `${PHOTOS_DIR}photo2.jpg`];

    await deletePersistedImages(uris);

    expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(2);
  });
});

describe('imageExists', () => {
  it('returns true when file exists', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
    expect(await imageExists(`${PHOTOS_DIR}photo.jpg`)).toBe(true);
  });

  it('returns false when file does not exist', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });
    expect(await imageExists(`${PHOTOS_DIR}photo.jpg`)).toBe(false);
  });

  it('returns false on error', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    expect(await imageExists(`${PHOTOS_DIR}photo.jpg`)).toBe(false);
  });
});

describe('filterValidPhotos', () => {
  it('keeps photos that exist on disk', async () => {
    (FileSystem.getInfoAsync as jest.Mock)
      .mockResolvedValueOnce({ exists: true })
      .mockResolvedValueOnce({ exists: true });

    const result = await filterValidPhotos(['uri1', 'uri2']);
    expect(result).toEqual(['uri1', 'uri2']);
  });

  it('removes photos whose files are missing', async () => {
    (FileSystem.getInfoAsync as jest.Mock)
      .mockResolvedValueOnce({ exists: true })
      .mockResolvedValueOnce({ exists: false })
      .mockResolvedValueOnce({ exists: true });

    const result = await filterValidPhotos(['uri1', 'uri2', 'uri3']);
    expect(result).toEqual(['uri1', 'uri3']);
  });

  it('returns empty array when all files are missing', async () => {
    (FileSystem.getInfoAsync as jest.Mock)
      .mockResolvedValueOnce({ exists: false })
      .mockResolvedValueOnce({ exists: false });

    const result = await filterValidPhotos(['uri1', 'uri2']);
    expect(result).toEqual([]);
  });

  it('returns empty array for empty input', async () => {
    const result = await filterValidPhotos([]);
    expect(result).toEqual([]);
  });
});
