// In-memory cache to pass the original uploaded File and the modified PDF Blob
// from /new to /results/$id without losing the File reference through storage.
type Entry = { originalFile?: File; modifiedBlob?: Blob };
const cache = new Map<string, Entry>();

export function setPdfCache(id: string, entry: Entry) {
  cache.set(id, { ...(cache.get(id) ?? {}), ...entry });
}

export function getPdfCache(id: string): Entry | undefined {
  return cache.get(id);
}

export function base64ToPdfBlob(b64: string): Blob | null {
  try {
    const clean = b64.replace(/^data:.*;base64,/, "").trim();
    if (!clean) return null;
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: "application/pdf" });
  } catch {
    return null;
  }
}
