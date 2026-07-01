import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { API_ROUTES } from '@ais/shared';

interface PutPresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);

  async function uploadFile(file: File): Promise<string> {
    setIsUploading(true);
    try {
      const { uploadUrl, publicUrl } = await apiFetch<PutPresignResponse>(
        `${API_ROUTES.UPLOADS}/presigned-url`,
        {
          method: 'POST',
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
          }),
        },
      );

      // Upload the raw file body via presigned PUT. The signed ContentType must
      // match file.type, so set the header explicitly (no multipart boundary).
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
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
