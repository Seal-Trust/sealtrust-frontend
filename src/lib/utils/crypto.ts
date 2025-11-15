import { HashResult } from "../types";

/**
 * Compute SHA256 hash of a file
 */
export async function computeFileHash(file: File): Promise<HashResult> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return {
    hash: hashHex,
    size: file.size,
    format: file.type || getFormatFromFilename(file.name),
  };
}

/**
 * Compute SHA256 hash from URL by fetching content
 */
export async function computeUrlHash(url: string): Promise<HashResult> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch dataset: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  // Try to determine format from headers or URL
  const contentType = response.headers.get("content-type");
  const format = contentType || getFormatFromUrl(url);

  return {
    hash: hashHex,
    size: buffer.byteLength,
    format,
  };
}

/**
 * Convert hex string to byte array (for Move/Rust compatibility)
 */
export function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}

/**
 * Convert byte array to hex string
 */
export function bytesToHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Convert string to byte array (UTF-8)
 */
export function stringToBytes(str: string): number[] {
  return Array.from(new TextEncoder().encode(str));
}

/**
 * Convert byte array to string (UTF-8)
 */
export function bytesToString(bytes: number[]): string {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * Determine file format from filename
 */
function getFormatFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toUpperCase();
  const formatMap: { [key: string]: string } = {
    CSV: "CSV",
    JSON: "JSON",
    PARQUET: "PARQUET",
    TSV: "TSV",
    XML: "XML",
    HDF5: "HDF5",
    H5: "HDF5",
    ZARR: "ZARR",
    AVRO: "AVRO",
  };
  return formatMap[ext || ""] || "UNKNOWN";
}

/**
 * Determine file format from URL
 */
function getFormatFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return getFormatFromFilename(pathname);
  } catch {
    return "UNKNOWN";
  }
}

/**
 * Format hash for display (truncate middle)
 */
export function formatHash(hash: string, maxLength = 16): string {
  if (hash.length <= maxLength) return hash;

  const start = hash.slice(0, maxLength / 2 - 1);
  const end = hash.slice(-(maxLength / 2 - 1));
  return `${start}...${end}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Validate dataset URL
 */
export function isValidDatasetUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Allow common protocols
    return ["http:", "https:", "ipfs:", "ar:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Parse IPFS URL to gateway URL
 */
export function parseIpfsUrl(url: string, gateway: string): string {
  if (url.startsWith("ipfs://")) {
    const cid = url.replace("ipfs://", "");
    return `${gateway}${cid}`;
  }
  return url;
}