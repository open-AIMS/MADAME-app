import { HttpErrorResponse } from "@angular/common/http";
import { delay, MonoTypeOperatorFunction, of, retry } from "rxjs";

/**
 * Download URL as blob and createObjectURL.
 * Caller is responsible for revokeObjectURL
 * @param url the url to fetch
 * @returns url from createObjectURL
 * @see ReefGuideApiService.toObjectURL
 */
export async function urlToBlobObjectURL(url: string): Promise<string> {
  const resp = await fetch(url);
  const blob = await resp.blob();

  // warn if we're doing this for files > 100mb
  if (blob.size > 100_000_000) {
    console.warn(
      `Blob size=${blob.size} for ${url}, createObjectURL`,
      blob.size
    );
  }

  const objectUrl = URL.createObjectURL(blob);
  console.log(`created ObjectURL ${objectUrl} for blob size=${blob.size}`, url)
  return objectUrl;
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
                    return of(1).pipe(delay(delayTime))
                } else {
                    return of(1);
                }
            }

            throw err;
        }
    })
}
