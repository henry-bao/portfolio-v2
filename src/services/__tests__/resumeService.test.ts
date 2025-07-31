import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the appwrite modules
vi.mock('../appwrite', () => {
  return {
    databases: {
      listDocuments: vi.fn(),
      createDocument: vi.fn(),
      updateDocument: vi.fn(),
      getDocument: vi.fn(),
      deleteDocument: vi.fn(),
    },
    storage: {
      createFile: vi.fn(),
      deleteFile: vi.fn(),
    },
    DATABASE_ID: 'test-db-id',
    STORAGE_FILE_BUCKET_ID: 'test-bucket-id',
    COLLECTION_RESUME_ID: 'test-resume-collection-id',
    ID: {
      unique: vi.fn().mockReturnValue('unique-id'),
    },
    Query: {
      orderDesc: (field) => `{"method":"orderDesc","attribute":"${field}"}`,
      equal: (field, value) => `{"method":"equal","attribute":"${field}","values":[${value}]}`,
      limit: (value) => `{"method":"limit","values":[${value}]}`,
    },
  };
});

import { databases, storage, DATABASE_ID, STORAGE_FILE_BUCKET_ID, COLLECTION_RESUME_ID, Query } from '../appwrite';
import { 
  getResumeVersions, 
  getActiveResumeVersion, 
  addResumeVersion,
  setResumeAsActive
} from '../resumeService';

describe('resumeService', () => {
  const mockResumeVersions = [
    {
      $id: 'resume-1',
      fileId: 'file-1',
      fileName: 'resume1.pdf',
      uploadDate: '2023-01-01T00:00:00.000Z',
      isActive: true,
      description: 'First resume',
    },
    {
      $id: 'resume-2',
      fileId: 'file-2',
      fileName: 'resume2.pdf',
      uploadDate: '2023-02-01T00:00:00.000Z',
      isActive: false,
      description: 'Second resume',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getResumeVersions', () => {
    it('should return resume versions sorted by upload date', async () => {
      (databases.listDocuments as any).mockResolvedValue({
        documents: mockResumeVersions,
      });

      const result = await getResumeVersions();

      expect(databases.listDocuments).toHaveBeenCalledWith(
        DATABASE_ID,
        COLLECTION_RESUME_ID,
        [Query.orderDesc('uploadDate')]
      );
      expect(result).toEqual(mockResumeVersions);
    });

    it('should return empty array when an error occurs', async () => {
      (databases.listDocuments as any).mockRejectedValue(new Error('Test error'));

      const result = await getResumeVersions();

      expect(databases.listDocuments).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('getActiveResumeVersion', () => {
    it('should return the active resume version', async () => {
      const activeResume = mockResumeVersions[0];
      (databases.listDocuments as any).mockResolvedValue({
        documents: [activeResume],
      });

      const result = await getActiveResumeVersion();

      expect(databases.listDocuments).toHaveBeenCalledWith(
        DATABASE_ID,
        COLLECTION_RESUME_ID,
        [Query.equal('isActive', true), Query.limit(1)]
      );
      expect(result).toEqual(activeResume);
    });

    it('should return null when no active resume is found', async () => {
      (databases.listDocuments as any).mockResolvedValue({
        documents: [],
      });

      const result = await getActiveResumeVersion();

      expect(databases.listDocuments).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when an error occurs', async () => {
      (databases.listDocuments as any).mockRejectedValue(new Error('Test error'));

      const result = await getActiveResumeVersion();

      expect(databases.listDocuments).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});