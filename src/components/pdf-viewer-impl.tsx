import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Loader2 } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function ClientPdfViewer({ url, width }: { url: string; width: number }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="h-[600px] overflow-y-auto bg-muted/20 p-3">
      {error ? (
        <div className="p-5 text-sm text-destructive">{error}</div>
      ) : (
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={(e) => setError(e.message || "Failed to load PDF")}
          loading={
            <div className="flex h-[560px] items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          }
          error={<div className="p-5 text-sm text-destructive">Failed to load PDF</div>}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div key={i + 1} className="mb-3 flex justify-center">
              <Page pageNumber={i + 1} width={width} renderAnnotationLayer={false} renderTextLayer={false} />
            </div>
          ))}
        </Document>
      )}
    </div>
  );
}
