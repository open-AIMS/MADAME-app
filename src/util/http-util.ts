import { HttpErrorResponse } from '@angular/common/http';
import { delay, MonoTypeOperatorFunction, of, retry } from 'rxjs';

/**
 * Download URL as blob and createObjectURL.
 * Providing fileFormat creates a File instead of a plain Blob.
 * Caller is responsible for revokeObjectURL
 * @param url the url to fetch
 * @param fileFormat - optional file extension (e.g., 'tif', 'tiff') to help with format detection
 * @returns url from createObjectURL
 * @see ReefGuideApiService.toObjectURL
 */
export async function urlToBlobObjectURL(url: string, fileFormat?: string): Promise<string> {
  const resp = await fetch(url);
  const blob = await resp.blob();

  // warn if we're doing this for files > 100mb
  if (blob.size > 100_000_000) {
    console.warn(`Blob size=${blob.size} for ${url}, createObjectURL`, blob.size);
  }

  let objectUrl: string;
  // If fileFormat is provided, create a File object with proper name and MIME type
  if (fileFormat) {
    const extension = fileFormat.startsWith('.') ? fileFormat : `.${fileFormat}`;
    const mimeType = getMimeTypeForExtension(extension);
    const filename = `file${extension}`;

    const file = new File([blob], filename, {
      type: mimeType,
      lastModified: Date.now()
    });
    objectUrl = URL.createObjectURL(file);
  } else {
    objectUrl = URL.createObjectURL(blob);
  }

  console.log(`created ObjectURL ${objectUrl} for blob size=${blob.size}`, url);
  return objectUrl;
}

/**
 * Helper method to get MIME type based on file extension
 */
function getMimeTypeForExtension(extension: string): string {
  const mimeTypes: { [key: string]: string } = {
    '.tif': 'image/tiff',
    '.tiff': 'image/tiff',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.json': 'application/json',
    '.geojson': 'application/geo+json'
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Separate query parameters from the URL.
 * Does nothing to a blob: url.
 * @param url URL to process
 * @returns separated url without params and params object
 */
export function seperateHttpParams(url: string): {
  cleanUrl: string;
  params: Record<string, string>;
} {
  if (url.startsWith('blob:')) {
    return {
      cleanUrl: url,
      params: {}
    };
  }

  const urlObj = new URL(url);
  const params: { [key: string]: string } = {};

  // Convert URLSearchParams to plain object
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  // Clean the URL by removing query parameters
  const cleanUrl = `${urlObj.origin}${urlObj.pathname}${urlObj.hash}`;

  return {
    cleanUrl,
    params
  };
}

/**
 * Whether this HTTP request should be retried.
 * @param err error response
 * @returns true if should retry
 */
function isRetryableHTTPError(err: HttpErrorResponse): boolean {
  return err.status >= 500;
}

/**
 * Retry HTTP 5XX errors.
 * Expects HttpErrorResponse value from HttpClient.
 * @param count how many times to retry (default 1)
 * @param delayTime delay in milliseconds before retrying (default no delay)
 * @returns
 */
export function retryHTTPErrors<T>(count = 1, delayTime = 0): MonoTypeOperatorFunction<T> {
  // retryWhen deprecated, delay is recommended instead.
  return retry({
    count,
    delay: (err, retryCount) => {
      if (err instanceof HttpErrorResponse && isRetryableHTTPError(err)) {
        // must emit a value to trigger retry, value itself has no meaning.
        if (delayTime > 0) {
          return of(1).pipe(delay(delayTime));
        } else {
          return of(1);
        }
      }

      throw err;
    }
  });
}
