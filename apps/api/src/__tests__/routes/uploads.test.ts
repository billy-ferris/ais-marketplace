import { describe, it, expect } from 'vitest';

describe('Upload Routes', () => {
  describe('POST /api/uploads/presigned-url', () => {
    it.todo('should return uploadUrl, publicUrl, and key');
    it.todo('should generate unique key with timestamp prefix');
    it.todo('should use correct contentType in PutObjectCommand');
    it.todo('should require admin role');
    it.todo('should reject request without fileName or contentType');
  });
});
