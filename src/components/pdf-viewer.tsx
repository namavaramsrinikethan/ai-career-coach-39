import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Loader2 } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Source = File | string | null | undefined;

export function PdfViewer({ source, width = 500, fallback }: { source: Source; width?: number; fallback?: string }) {
  const [file, setFile] = useState<string | { data: Uint8Array } | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setNumPages(null);
    if (!source) {
      setFile(null);
      return;
    }
    if (typeof source === "string") {
      // base64 data URL or raw base64
      const dataUrl = source.startsWith("data:") ? source : `data:application/pdf;base64,${source}`;
      setFile(dataUrl);
      return;
    }
    // File
    const reader = new FileReader();
    reader.onload = (e) => setFile((e.target?.result as string) ?? null);
    reader.onerror = () => setError("Failed to read file");
    reader.readAsDataURL(source);
  }, [source]);

  if (!source) {
    return (
      <div className="flex h-[600px] items-center justify-center p-5 text-sm text-muted-foreground">
        {fallback ?? "No PDF available."}
      </div>
    );
  }

  return (
    <div className="h-[600px] overflow-y-auto bg-muted/20 p-3">
      {error && <div className="p-5 text-sm text-danger">{error}</div>}
      {!file && !error && (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {file && (
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={(e) => setError(e.message || "Failed to load PDF")}
          loading={
            <div className="flex h-[560px] items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          }
          error={<div className="p-5 text-sm text-danger">Failed to load PDF</div>}
        >
          {Array.from({ length: numPages ?? 0 }, (_, i) => (
            <div key={i + 1} className="mb-3 flex justify-center">
              <Page pageNumber={i + 1} width={width} renderAnnotationLayer={false} renderTextLayer={false} />
            </div>
          ))}
        </Document>
      )}
    </div>
  );
}
