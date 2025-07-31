import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFileUrl, getFilePreviewUrl, getFileDownloadUrl } from '../fileProxy';
import { storage, STORAGE_FILE_BUCKET_ID } from '../appwrite';

// Mock the appwrite storage module
vi.mock('../appwrite', () => {
  return {
    storage: {
      getFileView: vi.fn(),
      getFilePreview: vi.fn(),
      getFileDownload: vi.fn(),
    },
    STORAGE_FILE_BUCKET_ID: 'test-bucket-id',
  };
});

describe('fileProxy service', () => {
  const mockFileId = 'test-file-id';
  const mockUrl = 'https://example.com/file';
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    (storage.getFileView as any).mockReturnValue(mockUrl);
    (storage.getFilePreview as any).mockReturnValue(mockUrl);
    (storage.getFileDownload as any).mockReturnValue(mockUrl);
  });

  describe('getFileUrl', () => {
    it('should return the file URL from Appwrite storage', () => {
      const result = getFileUrl(mockFileId);
      
      expect(storage.getFileView).toHaveBeenCalledWith(STORAGE_FILE_BUCKET_ID, mockFileId);
      expect(result).toBe(mockUrl);
    });

    it('should return empty string when an error occurs', () => {
      (storage.getFileView as any).mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const result = getFileUrl(mockFileId);
      
      expect(storage.getFileView).toHaveBeenCalledWith(STORAGE_FILE_BUCKET_ID, mockFileId);
      expect(result).toBe('');
    });
  });

  describe('getFilePreviewUrl', () => {
    it('should return the file preview URL without dimensions', () => {
      const result = getFilePreviewUrl(mockFileId);
      
      expect(storage.getFilePreview).toHaveBeenCalledWith(STORAGE_FILE_BUCKET_ID, mockFileId, undefined, undefined);
      expect(result).toBe(mockUrl);
    });

    it('should return the file preview URL with dimensions', () => {
      const width = 100;
      const height = 200;
      
      const result = getFilePreviewUrl(mockFileId, width, height);
      
      expect(storage.getFilePreview).toHaveBeenCalledWith(STORAGE_FILE_BUCKET_ID, mockFileId, width, height);
      expect(result).toBe(mockUrl);
    });

    it('should return empty string when an error occurs', () => {
      (storage.getFilePreview as any).mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const result = getFilePreviewUrl(mockFileId);
      
      expect(storage.getFilePreview).toHaveBeenCalledWith(STORAGE_FILE_BUCKET_ID, mockFileId, undefined, undefined);
      expect(result).toBe('');
    });
  });

  describe('getFileDownloadUrl', () => {
    it('should return the file download URL from Appwrite storage', () => {
      const result = getFileDownloadUrl(mockFileId);
      
      expect(storage.getFileDownload).toHaveBeenCalledWith(STORAGE_FILE_BUCKET_ID, mockFileId);
      expect(result).toBe(mockUrl);
    });

    it('should return empty string when an error occurs', () => {
      (storage.getFileDownload as any).mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const result = getFileDownloadUrl(mockFileId);
      
      expect(storage.getFileDownload).toHaveBeenCalledWith(STORAGE_FILE_BUCKET_ID, mockFileId);
      expect(result).toBe('');
    });
  });
});