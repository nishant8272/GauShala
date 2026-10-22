import React, { useState, useRef } from "react";
import { doctorApi } from "../api/doctor.api";
import type { DocType, DoctorDocument } from "../types/doctor.types";

interface KycDocumentUploadCardProps {
  docType: DocType;
  label: string;
  description: string;
  uploadedDoc?: DoctorDocument;
  onRefresh: () => void;
}

export function KycDocumentUploadCard({
  docType,
  label,
  description,
  uploadedDoc,
  onRefresh,
}: KycDocumentUploadCardProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          await doctorApi.uploadDocument(docType, {
            fileName: file.name,
            mimeType: file.type,
            fileBase64: base64,
          });
          onRefresh();
        } catch (err: any) {
          setError(err.message || "Failed to upload file");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "Failed to read file");
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await doctorApi.deleteDocument(docType);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to remove document");
    }
  };

  return (
    <div className={`p-4 rounded-xl border transition ${uploadedDoc ? "bg-emerald-50/40 border-emerald-200" : "bg-white border-slate-200"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-900">{label}</span>
            {uploadedDoc ? (
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                ✓ Uploaded
              </span>
            ) : (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                Required
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{description}</p>
          {uploadedDoc && (
            <p className="text-xs text-slate-600 font-mono">
              📄 {uploadedDoc.fileName}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition ${uploadedDoc ? "bg-slate-100 hover:bg-slate-200 text-slate-700" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
          >
            {uploading ? "Uploading..." : uploadedDoc ? "Replace File" : "Choose File"}
          </button>

          {uploadedDoc && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg text-xs"
              title="Delete Document"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-rose-600 mt-2 font-medium">{error}</p>}
    </div>
  );
}
