import { DownloadResponse } from '../api/web-api.types';

/*
Misc utilities for working with data from our API.

These may be simple, but help to track where we're doing certain operations
and make it easier to update these places in the future.
 */

/**
 * Get the first file from job results.
 */
export function getFirstFileFromResults(jobResults: DownloadResponse) {
  const fileUrls = Object.values(jobResults.files);
  if (fileUrls.length === 0) {
    throw new Error(`Job id=${jobResults.job.id} results has no files`);
  } else if (fileUrls.length > 1) {
    console.warn(`Job id=${jobResults.job.id} results has multiple files`);
  }

  return fileUrls[0];
}
