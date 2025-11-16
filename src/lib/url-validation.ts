/**
 * URL Validation Utilities for Dataset URLs
 * Matches security policies from /api/fetch-dataset route
 */

// Allowed domains for dataset URLs (must match API route)
export const ALLOWED_DOMAINS = [
  'raw.githubusercontent.com',
  'github.com',
  'kaggle.com',
  'huggingface.co',
  'data.world',
  'storage.googleapis.com',
  's3.amazonaws.com',
] as const;

// Private IP patterns (SSRF prevention)
const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^0\.0\.0\.0$/,
];

export interface URLValidationResult {
  isValid: boolean;
  error?: string;
  url?: URL;
}

/**
 * Validate dataset URL format and security
 */
export function validateDatasetURL(urlString: string): URLValidationResult {
  // Check if URL is provided
  if (!urlString || !urlString.trim()) {
    return {
      isValid: false,
      error: 'URL is required',
    };
  }

  // Parse URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlString.trim());
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }

  // Check protocol (only HTTP/HTTPS)
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return {
      isValid: false,
      error: 'Only HTTP and HTTPS protocols are allowed',
    };
  }

  // Check domain allowlist
  const isAllowedDomain = ALLOWED_DOMAINS.some(
    domain =>
      parsedUrl.hostname === domain ||
      parsedUrl.hostname.endsWith(`.${domain}`)
  );

  if (!isAllowedDomain) {
    return {
      isValid: false,
      error: `Domain not allowed. Allowed domains: ${ALLOWED_DOMAINS.join(', ')}`,
    };
  }

  // Check for private/localhost addresses (SSRF prevention)
  const isPrivateIP = PRIVATE_IP_PATTERNS.some(pattern =>
    pattern.test(parsedUrl.hostname)
  );

  if (isPrivateIP) {
    return {
      isValid: false,
      error: 'Private and localhost addresses are not allowed',
    };
  }

  // All checks passed
  return {
    isValid: true,
    url: parsedUrl,
  };
}

/**
 * Extract filename from URL
 */
export function extractFilenameFromURL(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    return filename || 'dataset';
  } catch {
    return 'dataset';
  }
}

/**
 * Detect file format from URL
 */
export function detectFormatFromURL(url: string): string {
  const filename = extractFilenameFromURL(url);
  const extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();

  const formatMap: Record<string, string> = {
    csv: 'CSV',
    json: 'JSON',
    jsonl: 'JSONL',
    parquet: 'Parquet',
    txt: 'Text',
    tsv: 'TSV',
    xml: 'XML',
    yaml: 'YAML',
    yml: 'YAML',
  };

  return formatMap[extension] || 'Unknown';
}

/**
 * Check if URL points to a supported dataset format
 */
export function isSupportedFormat(url: string): boolean {
  const format = detectFormatFromURL(url);
  return format !== 'Unknown';
}

/**
 * Get user-friendly error message for validation errors
 */
export function getValidationErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    'Invalid URL format': 'Please enter a valid URL starting with http:// or https://',
    'URL is required': 'Please enter a dataset URL',
    'Only HTTP and HTTPS protocols are allowed': 'Only HTTP and HTTPS URLs are supported',
    'Private and localhost addresses are not allowed': 'Local and private network addresses cannot be used',
  };

  // Check for domain not allowed error
  if (error.startsWith('Domain not allowed')) {
    return `This domain is not on the allowlist. Supported sources: GitHub, Kaggle, HuggingFace, Data.world, Google Cloud Storage, and AWS S3.`;
  }

  return errorMessages[error] || error;
}
