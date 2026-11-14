import { useCallback, useState } from 'react';
import { validateCoverFile } from '@/lib/covers';
import { trackerApi } from '@/services/trackerApi';

/** Uploads a chosen poster right away and hands back its URL, so a form only ever holds a URL. */
export function useCoverPicker(onUploaded: (url: string) => void) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = useCallback(
    async (file: File | null) => {
      if (!file) return;
      const problem = validateCoverFile(file);
      setError(problem);
      if (problem) return;
      setUploading(true);
      try {
        onUploaded((await trackerApi.uploadCover(file)).url);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'we could not upload that image');
      } finally {
        setUploading(false);
      }
    },
    [onUploaded],
  );

  return { uploading, error, choose };
}
