import { Router, type Router as RouterType } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireAuth, requireRole } from '../middleware/auth';

const router: RouterType = Router();

/**
 * Server-authoritative allowlist of accepted image MIME types (D-06).
 * Deliberately excludes image/svg+xml (stored-XSS vector) and image/gif.
 */
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Maximum upload size (D-07). Enforced via a signed exact ContentLength on the
 * PutObjectCommand (not a POST policy) — R2 has no presigned POST support, so
 * the signed length pins the exact byte count R2 will accept at ingest.
 */
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

// POST /presigned-url - Generate a presigned PUT URL for direct browser upload to R2
router.post(
  '/presigned-url',
  requireAuth(),
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const { fileName, contentType, fileSize } = req.body;

      if (
        !fileName ||
        !contentType ||
        typeof fileSize !== 'number' ||
        !Number.isFinite(fileSize) ||
        fileSize <= 0
      ) {
        res.status(400).json({
          error: 'fileName, contentType, and fileSize are required',
        });
        return;
      }

      // D-06: reject anything outside the image allowlist before signing.
      if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
        res.status(400).json({ error: 'Unsupported content type' });
        return;
      }

      // D-07: reject an oversized client-declared size before signing. The
      // signed exact ContentLength (below) forces R2 to reject at ingest if the
      // real body differs from the declared size.
      if (fileSize > MAX_UPLOAD_BYTES) {
        res.status(400).json({ error: 'File exceeds the 5 MB limit' });
        return;
      }

      const sanitized = sanitizeFileName(fileName);
      const key = `images/${Date.now()}-${sanitized}`;

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        ContentLength: fileSize,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 600, // 10 minutes
      });

      const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

      res.json({ uploadUrl, publicUrl, key });
    } catch (err) {
      next(err);
    }
  },
);

export { router as uploadRouter };
