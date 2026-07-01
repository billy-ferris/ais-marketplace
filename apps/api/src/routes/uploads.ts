import { Router, type Router as RouterType } from 'express';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { requireAuth, requireRole } from '../middleware/auth';

const router: RouterType = Router();

/**
 * Server-authoritative allowlist of accepted image MIME types (D-06).
 * Deliberately excludes image/svg+xml (stored-XSS vector) and image/gif.
 */
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Maximum upload size enforced by the presigned POST policy (D-07). */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Sanitize a filename for use in an S3/R2 key.
 * Removes special characters except dots and hyphens, replaces spaces with hyphens.
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// POST /presigned-url - Generate a presigned POST for direct browser upload to R2
router.post(
  '/presigned-url',
  requireAuth(),
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const { fileName, contentType } = req.body;

      if (!fileName || !contentType) {
        res
          .status(400)
          .json({ error: 'fileName and contentType are required' });
        return;
      }

      // D-06: reject anything outside the image allowlist before signing.
      if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
        res.status(400).json({ error: 'Unsupported content type' });
        return;
      }

      const sanitized = sanitizeFileName(fileName);
      const key = `images/${Date.now()}-${sanitized}`;

      // D-07: presigned POST lets the policy cap the upload size (a presigned
      // PUT cannot). content-length-range enforces 1..5 MB at R2 ingest, and
      // eq $Content-Type pins the MIME the client may send.
      const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Conditions: [
          ['content-length-range', 1, MAX_UPLOAD_BYTES],
          ['eq', '$Content-Type', contentType],
        ],
        Fields: { 'Content-Type': contentType },
        Expires: 600, // 10 minutes
      });

      const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

      res.json({ url, fields, publicUrl, key });
    } catch (err) {
      next(err);
    }
  },
);

export { router as uploadRouter };
