import { Router, type Router as RouterType } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireAuth, requireRole } from '../middleware/auth';

const router: RouterType = Router();

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

// POST /presigned-url - Generate a presigned URL for direct browser upload to R2
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

      const sanitized = sanitizeFileName(fileName);
      const key = `images/${Date.now()}-${sanitized}`;

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
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
