import { useState } from "react";
import type { DoctorDocument } from "../../doctor/types/doctor.types";
import { ExternalLink, FileText, Eye, X } from "lucide-react";

interface AdminDocumentModalProps {
  profileId: string;
  doctorName: string;
  documents: DoctorDocument[];
  isOpen: boolean;
  onClose: () => void;
}

export function AdminDocumentModal({
  profileId,
  doctorName,
  documents,
  isOpen,
  onClose,
}: AdminDocumentModalProps) {
  const [activePreviewDoc, setActivePreviewDoc] = useState<DoctorDocument | null>(null);

  if (!isOpen) return null;

  const getDocumentViewUrl = (doc: DoctorDocument) => {
    return `/api/admin/doctors/${encodeURIComponent(profileId)}/documents/${encodeURIComponent(doc.documentType)}/view`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              KYC Credentials — {doctorName}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect medical licenses, qualification degrees, and identity verification proofs.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {documents.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-12 bg-slate-50 rounded-2xl border border-dashed">
              No verification documents have been uploaded by this doctor yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => {
                const viewUrl = getDocumentViewUrl(doc);
                const isPdf = doc.mimeType.includes("pdf") || doc.fileName.toLowerCase().endsWith(".pdf");
                const isImage = doc.mimeType.startsWith("image/") || doc.fileName.match(/\.(png|jpg|jpeg|webp)$/i);

                return (
                  <div
                    key={doc.id}
                    className="flex flex-col justify-between p-5 border border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition shadow-sm space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-slate-900 capitalize">
                          {doc.documentType.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold uppercase">
                          {isPdf ? "PDF" : isImage ? "IMAGE" : "DOCUMENT"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.fileName}</span>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => setActivePreviewDoc(doc)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <a
                        href={viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open File</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* In-Modal Document Viewer */}
          {activePreviewDoc && (
            <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 shadow-lg animate-in fade-in duration-150">
              <div className="flex items-center justify-between p-3 bg-slate-800 text-white text-xs font-semibold px-4">
                <span className="truncate max-w-md">Previewing: {activePreviewDoc.fileName}</span>
                <div className="flex items-center gap-3">
                  <a
                    href={getDocumentViewUrl(activePreviewDoc)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-300 hover:text-white flex items-center gap-1"
                  >
                    <span>Open in new tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => setActivePreviewDoc(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-100 flex items-center justify-center min-h-[380px] max-h-[520px] overflow-auto">
                {activePreviewDoc.mimeType.startsWith("image/") ||
                activePreviewDoc.fileName.match(/\.(png|jpg|jpeg|webp)$/i) ? (
                  <img
                    src={getDocumentViewUrl(activePreviewDoc)}
                    alt={activePreviewDoc.fileName}
                    className="max-h-[480px] max-w-full rounded-xl object-contain shadow-md"
                  />
                ) : (
                  <iframe
                    src={getDocumentViewUrl(activePreviewDoc)}
                    title={activePreviewDoc.fileName}
                    className="w-full h-[480px] rounded-xl border border-slate-200 bg-white"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end bg-slate-50/80">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
