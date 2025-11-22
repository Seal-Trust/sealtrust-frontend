import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Allowed domains for dataset URLs (security)
const ALLOWED_DOMAINS = [
  'raw.githubusercontent.com',
  'github.com',
  'kaggle.com',
  'huggingface.co',
  'data.world',
  'storage.googleapis.com',
  's3.amazonaws.com',
];

// Maximum file size (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  try {
    // Validate URL format
    const parsedUrl = new URL(url);

    // Security: Check protocol (prevent file://, ftp://, etc.)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS protocols allowed' },
        { status: 403 }
      );
    }

    // Security: Validate against allowlist
    const isAllowed = ALLOWED_DOMAINS.some(domain =>
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: 'Domain not allowed',
          allowed: ALLOWED_DOMAINS,
          provided: parsedUrl.hostname
        },
        { status: 403 }
      );
    }

    // Security: Prevent localhost/private IPs
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^0\.0\.0\.0$/
    ];

    if (privatePatterns.some(pattern => pattern.test(parsedUrl.hostname))) {
      return NextResponse.json(
        { error: 'Private/localhost addresses not allowed' },
        { status: 403 }
      );
    }

    // Fetch from external URL (server-side, bypasses CORS)
    const response = await fetch(url, {
      signal: AbortSignal.timeout(60000), // 60s timeout
      headers: {
        'User-Agent': 'SealTrust/1.0',
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream server error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Check file size before streaming
    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File too large: ${(size / 1024 / 1024).toFixed(2)}MB (max: ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
            size,
            maxSize: MAX_FILE_SIZE
          },
          { status: 413 }
        );
      }
    }

    // Return streaming response with proper CORS headers
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Length': response.headers.get('Content-Length') || '',
        'Content-Disposition': response.headers.get('Content-Disposition') || '',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error) {
    console.error('Proxy error:', error);

    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        return NextResponse.json(
          { error: 'Request timeout after 60 seconds' },
          { status: 504 }
        );
      }

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return NextResponse.json(
          { error: 'Cannot connect to remote server' },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Unknown proxy error' },
      { status: 500 }
    );
  }
}

// Support HEAD requests for size checking
export async function HEAD(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const parsedUrl = new URL(url);

    // Same validation as GET
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return new NextResponse(null, { status: 403 });
    }

    const isAllowed = ALLOWED_DOMAINS.some(domain =>
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return new NextResponse(null, { status: 403 });
    }

    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000) // 10s timeout for HEAD
    });

    return new NextResponse(null, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || '',
        'Content-Length': response.headers.get('Content-Length') || '',
        'Content-Disposition': response.headers.get('Content-Disposition') || '',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch {
    return new NextResponse(null, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
