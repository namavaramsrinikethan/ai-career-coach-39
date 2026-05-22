// In-memory + sessionStorage cache for PDFs so the results page can render
// previews without bloating localStorage history.
type Entry = { originalFile?: File; modifiedBlob?: Blob };
const cache = new Map<string, Entry>();

const keyOriginal = (id: string) => `apr_pdf_original_${id}`;
const keyModified = (id: string) => `apr_pdf_modified_${id}`;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function setPdfCache(id: string, entry: Entry) {
  cache.set(id, { ...(cache.get(id) ?? {}), ...entry });
  if (typeof window === "undefined") return;
  // Persist to sessionStorage so a page reload on /results/$id still works.
  try {
    if (entry.originalFile) {
      blobToBase64(entry.originalFile).then((dataUrl) => {
        try { sessionStorage.setItem(keyOriginal(id), dataUrl); } catch { /* quota */ }
      }).catch(() => {});
    }
    if (entry.modifiedBlob) {
      blobToBase64(entry.modifiedBlob).then((dataUrl) => {
        try { sessionStorage.setItem(keyModified(id), dataUrl); } catch { /* quota */ }
      }).catch(() => {});
    }
  } catch { /* ignore */ }
}

export function getPdfCache(id: string): Entry | undefined {
  const mem = cache.get(id);
  if (mem && (mem.originalFile || mem.modifiedBlob)) return mem;
  if (typeof window === "undefined") return mem;
  const entry: Entry = { ...mem };
  try {
    const orig = sessionStorage.getItem(keyOriginal(id));
    if (orig) {
      const blob = base64ToPdfBlob(orig);
      if (blob) entry.originalFile = new File([blob], "original.pdf", { type: "application/pdf" });
    }
    const mod = sessionStorage.getItem(keyModified(id));
    if (mod) {
      const blob = base64ToPdfBlob(mod);
      if (blob) entry.modifiedBlob = blob;
    }
  } catch { /* ignore */ }
  if (entry.originalFile || entry.modifiedBlob) {
    cache.set(id, entry);
    return entry;
  }
  return mem;
}

export function getModifiedPdfDataUrl(id: string): string | null {
  if (typeof window === "undefined") return null;
  try { return sessionStorage.getItem(keyModified(id)); } catch { return null; }
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
