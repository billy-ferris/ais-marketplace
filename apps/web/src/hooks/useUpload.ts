import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { API_ROUTES } from '@ais/shared';

interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);

  async function uploadFile(file: File): Promise<string> {
    setIsUploading(true);
    try {
      const { uploadUrl, publicUrl } =
        await apiFetch<PresignedUrlResponse>(
          `${API_ROUTES.UPLOADS}/presigned-url`,
          {
            method: 'POST',
            body: JSON.stringify({
              fileName: file.name,
              contentType: file.type,
            }),
          },
        );

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  }

  return { uploadFile, isUploading };
}
