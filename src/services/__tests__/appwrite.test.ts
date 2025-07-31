import { describe, it, expect } from 'vitest';
import { validateFileType, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from '../appwrite';

describe('appwrite service utilities', () => {
  describe('validateFileType', () => {
    it('should return true for allowed image types', () => {
      ALLOWED_IMAGE_TYPES.forEach(type => {
        const file = new File(['test content'], 'test.jpg', { type });
        expect(validateFileType(file, ALLOWED_IMAGE_TYPES)).toBe(true);
      });
    });

    it('should return true for allowed document types', () => {
      ALLOWED_DOCUMENT_TYPES.forEach(type => {
        const file = new File(['test content'], 'test.pdf', { type });
        expect(validateFileType(file, ALLOWED_DOCUMENT_TYPES)).toBe(true);
      });
    });

    it('should return false for disallowed types', () => {
      const disallowedTypes = ['text/plain', 'application/javascript', 'text/html'];
      
      disallowedTypes.forEach(type => {
        const file = new File(['test content'], 'test.txt', { type });
        expect(validateFileType(file, ALLOWED_IMAGE_TYPES)).toBe(false);
        expect(validateFileType(file, ALLOWED_DOCUMENT_TYPES)).toBe(false);
      });
    });

    it('should return false when file type is empty', () => {
      const file = new File(['test content'], 'test.unknown', { type: '' });
      expect(validateFileType(file, ALLOWED_IMAGE_TYPES)).toBe(false);
    });

    it('should handle custom allowed types array', () => {
      const customAllowedTypes = ['text/plain', 'text/csv'];
      
      // Should return true for allowed types
      const textFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      expect(validateFileType(textFile, customAllowedTypes)).toBe(true);
      
      // Should return false for disallowed types
      const imageFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      expect(validateFileType(imageFile, customAllowedTypes)).toBe(false);
    });
  });
});