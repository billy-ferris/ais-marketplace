import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { API_ROUTES } from '@ais/shared';

interface PresignedPostResponse {
  url: string;
  fields: Record<string, string>;
  publicUrl: string;
  key: string;
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);

  async function uploadFile(file: File): Promise<string> {
    setIsUploading(true);
    try {
      const { url, fields, publicUrl } =
        await apiFetch<PresignedPostResponse>(
          `${API_ROUTES.UPLOADS}/presigned-url`,
          {
            method: 'POST',
            body: JSON.stringify({
              fileName: file.name,
              contentType: file.type,
            }),
          },
        );

      // Build multipart form: every signed field FIRST, then the file LAST
      // (R2/S3 POST policy requires the file to be the final part). Do NOT set
      // a Content-Type header — the browser must set the multipart boundary.
      const formData = new FormData();
      for (const [name, value] of Object.entries(fields)) {
        formData.append(name, value);
      }
      formData.append('file', file);

      const uploadRes = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      // WR-02: never return a publicUrl for a failed upload.
      if (!uploadRes.ok) {
        throw new Error(
          `Upload failed: ${uploadRes.status} ${uploadRes.statusText}`,
        );
      }

      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  }

  return { uploadFile, isUploading };
}
