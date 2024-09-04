/**
 * Download URL as blob and createObjectURL.
 * Caller is responsible for revokeObjectURL
 * @param url
 * @returns url from createObjectURL
 */
export async function urlToBlobObjectURL(url: string): Promise<string> {
  const resp = await fetch(url);
  const blob = await resp.blob();

  // warn if we're doing this for files > 100mb
  if (blob.size > 100_000_000) {
    console.warn(`Blob size=${blob.size} for ${url}, createObjectURL`, blob.size);
  }

  return URL.createObjectURL(blob);
}
