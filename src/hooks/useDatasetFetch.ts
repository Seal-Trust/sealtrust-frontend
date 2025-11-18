import { useState, useCallback, useRef } from 'react';

interface FetchProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseDatasetFetchReturn {
  fetchDataset: (url: string) => Promise<File>;
  loading: boolean;
  progress: FetchProgress | null;
  error: string | null;
  cancel: () => void;
}

/**
 * Hook to fetch datasets from external URLs via Next.js proxy
 * Provides progress tracking and cancellation support
 */
export function useDatasetFetch(): UseDatasetFetchReturn {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<FetchProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setProgress(null);
      setError('Download cancelled');
    }
  }, []);

  const fetchDataset = useCallback(async (url: string): Promise<File> => {
    // Reset state
    setLoading(true);
    setProgress(null);
    setError(null);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Validate URL format
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        throw new Error('Invalid URL format');
      }

      // Only allow HTTP/HTTPS
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are allowed');
      }

      // Use Next.js API proxy to bypass CORS
      const proxyUrl = `/api/fetch-dataset?url=${encodeURIComponent(url)}`;

      // Fetch via proxy
      const response = await fetch(proxyUrl, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Get total size from Content-Length
      const contentLength = response.headers.get('Content-Length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      // Get filename from Content-Disposition or URL
      let filename = 'dataset';
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      } else {
        // Extract filename from URL
        const urlPath = parsedUrl.pathname;
        const urlFilename = urlPath.substring(urlPath.lastIndexOf('/') + 1);
        if (urlFilename) {
          filename = urlFilename;
        }
      }

      // Get content type
      const contentType = response.headers.get('Content-Type') || 'application/octet-stream';

      // Stream response body with progress tracking
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        loaded += value.length;

        // Update progress
        const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
        setProgress({ loaded, total, percentage });
      }

      // Combine chunks into single blob (ensure proper typing)
      const typedChunks = chunks.map(chunk => new Uint8Array(chunk));
      const blob = new Blob(typedChunks, { type: contentType });

      // Convert blob to File
      const file = new File([blob], filename, {
        type: contentType,
        lastModified: Date.now(),
      });

      setLoading(false);
      setProgress({ loaded, total, percentage: 100 });
      abortControllerRef.current = null;

      return file;
    } catch (err) {
      setLoading(false);
      setProgress(null);
      abortControllerRef.current = null;

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          const cancelError = 'Download cancelled';
          setError(cancelError);
          throw new Error(cancelError);
        }
        setError(err.message);
        throw err;
      }

      const unknownError = 'Failed to fetch dataset';
      setError(unknownError);
      throw new Error(unknownError);
    }
  }, []);

  return {
    fetchDataset,
    loading,
    progress,
    error,
    cancel,
  };
}
