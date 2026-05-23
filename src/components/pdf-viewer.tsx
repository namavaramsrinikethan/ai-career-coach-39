import { lazy, Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Source = File | Blob | string | null | undefined;

const ClientPdfViewer = lazy(() => import("./pdf-viewer-impl"));



export function PdfViewer({ source, width = 500, fallback }: { source: Source; width?: number; fallback?: string }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!source) {
      setObjectUrl(null);
      return;
    }
    if (typeof source === "string") {
      // base64 or data URL → convert to blob URL for stable rendering
      try {
        const clean = source.replace(/^data:.*;base64,/, "").trim();
        const binary = atob(clean);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch {
        setObjectUrl(null);
        return;
      }
    }
    const url = URL.createObjectURL(source);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [source]);

  if (!source) {
    return (
      <div className="flex h-[600px] items-center justify-center p-5 text-sm text-muted-foreground">
        {fallback ?? "No PDF available."}
      </div>
    );
  }

  const loader = (
    <div className="flex h-[600px] items-center justify-center bg-muted/20 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );

  if (!mounted || !objectUrl) return loader;

  return (
    <Suspense fallback={loader}>
      <ClientPdfViewer url={objectUrl} width={width} />
    </Suspense>
  );
}
