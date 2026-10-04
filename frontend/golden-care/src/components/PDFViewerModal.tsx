import React, { useEffect, useState } from 'react';
import { FileText, Download, Printer, X, ExternalLink, ShieldCheck } from 'lucide-react';
import jsPDF from 'jspdf';

interface PDFViewerModalProps {
  pdfDoc: jsPDF | null;
  title: string;
  filename: string;
  onClose: () => void;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  pdfDoc,
  title,
  filename,
  onClose,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfDoc) return;
    const blob = pdfDoc.output('blob');
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pdfDoc]);

  const handleDownload = () => {
    if (!pdfDoc) return;
    pdfDoc.save(filename);
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  };

  if (!pdfDoc) return null;

  return (
    <div
      id="pdf-viewer-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6"
    >
      <div
        id="pdf-viewer-modal-container"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Official Document
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pusat Jagaan Warga Emas dan Terapi Fitrah • Document ID: {filename}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="pdf-print-button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors border border-slate-700 cursor-pointer"
              title="Open print dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              id="pdf-download-button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              id="pdf-close-button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Frame Viewer */}
        <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-hidden relative">
          {pdfUrl ? (
            <iframe
              id="pdf-embedded-frame"
              src={`${pdfUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full rounded-xl border border-slate-800 bg-white shadow-inner"
              title="Health Monitoring PDF Report"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Preparing document viewer...
            </div>
          )}
        </div>

        {/* Modal Footer Notice */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>GoldenCare Digitalized Health Record System • Confidential Care Report</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Formally generated for internal review, clinical consult, and JKM documentation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
