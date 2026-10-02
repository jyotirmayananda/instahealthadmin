'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Sparkles,
  Download,
} from 'lucide-react';

interface UploadLabReportModalProps {
  bookingId: string;
  patientName: string;
  tests: string;
  existingReportUrl?: string;
  existingFileName?: string;
  onClose: () => void;
  onUpload: (reportUrl: string, fileName: string) => void;
}

// Minimal valid base64 PDF sample for testing / instant mock release
const SAMPLE_NABL_PDF =
  'data:application/pdf;base64,JVBERi0xLjMKJcTl8uXrp/OgCjEgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDIgMCBSID4+CmVuZG9iagoyIDAgb2JqCjw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbMyAwIFJdIC9Db3VudCAxID4+CmVuZG9iagozIDAgb2JqCjw8IC9UeXBlIC9QYWdlIC9QYXJlbnQgMiAwIFIgL01lZGlhQm94IFswIDAgNjEyIDc5Ml0gL0NvbnRlbnRzIDQgMCBSID4+CmVuZG9iago0IDAgb2JqCjw8IC9MZW5ndGggOTggPj4Kc3RyZWFtCkJUCi9GMSAyNCBUZgoxMDAgNzAwIFRkCihNZWRjbyBOQUJMIFZlcmlmaWVkIERpYWdub3N0aWMgUmVwb3J0KSBUagowIC00MCBUZAooUGF0aWVudCBSZXBvcnQgUmVsZWFzZWQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE4IDAwMDAwIG4gCjAwMDAwMDAwNjkgMDAwMDAgbiAKMDAwMDAwMDEyMiAwMDAwMCBuIAowMDAwMDAwMjIxIDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgNSA+PgpzdGFydHhyZWYKMzcwCiUlRU9GCg==';

export default function UploadLabReportModal({
  bookingId,
  patientName,
  tests,
  existingReportUrl,
  existingFileName,
  onClose,
  onUpload,
}: UploadLabReportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<string>(existingReportUrl || '');
  const [fileName, setFileName] = useState<string>(
    existingFileName || `${bookingId}_${patientName.replace(/\s+/g, '_')}_Diagnostic_Report.pdf`
  );
  const [fileSize, setFileSize] = useState<string>(existingReportUrl ? '240 KB' : '');
  const [isDragOver, setIsDragOver] = useState(false);
  const [pathologistName, setPathologistName] = useState('Dr. Sandhya V. Kulkarni, MD (Pathology)');
  const [labName, setLabName] = useState('InstaHealth NABL Central Reference Lab (CAP #8921029)');
  const [clinicalRemark, setClinicalRemark] = useState('All clinical parameters verified and cross-checked.');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize(`${(selectedFile.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUseSample = () => {
    setDataUrl(SAMPLE_NABL_PDF);
    setFileName(`${bookingId}_Verified_NABL_Report.pdf`);
    setFileSize('185.4 KB');
  };

  const handleConfirm = () => {
    if (!dataUrl) return;
    onUpload(dataUrl, fileName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-modal overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs">
              <Upload size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Upload Official Lab Report
                </h2>
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  {bookingId}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Release digital PDF test report for{' '}
                <strong className="text-slate-800">{patientName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition shadow-xs"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Booking Summary Box */}
          <div className="bg-teal-50/40 p-3.5 rounded-2xl border border-teal-100/80 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Diagnostic Tests Ordered:</span>
              <span className="text-[10px] font-bold uppercase text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                Verified NABL Desk
              </span>
            </div>
            <p className="text-xs font-semibold text-teal-900">{tests}</p>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
              isDragOver
                ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
                : dataUrl
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-slate-200 hover:border-teal-400 hover:bg-slate-50/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf,image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {dataUrl ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <FileCheck size={26} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 truncate max-w-sm">{fileName}</h4>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                    Ready for release • {fileSize || 'Standard PDF Document'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 shadow-xs mt-1"
                >
                  Change File
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
                  <Upload size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to browse or drag and drop official PDF report
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Accepts NABL verified PDF reports or scanned clinical lab sheets (up to 10MB)
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Quick Helper Button to inject sample verified PDF */}
          {!dataUrl && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleUseSample}
                className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles size={13} className="text-teal-600" />
                <span>Use Sample Verified NABL Report</span>
              </button>
            </div>
          )}

          {/* Pathologist & Lab Details */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Accredited Reference Laboratory
              </label>
              <input
                type="text"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                placeholder="e.g. InstaHealth NABL Central Reference Lab"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Verifying Pathologist Name &amp; Degree
              </label>
              <input
                type="text"
                value={pathologistName}
                onChange={(e) => setPathologistName(e.target.value)}
                placeholder="e.g. Dr. Sandhya V. Kulkarni, MD (Pathology)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Pathologist Clinical Remarks
              </label>
              <input
                type="text"
                value={clinicalRemark}
                onChange={(e) => setClinicalRemark(e.target.value)}
                placeholder="e.g. All parameters verified and within biological reference ranges."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          {/* Customer Visibility Notice */}
          <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
            <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold text-emerald-950">Instant Customer Access:</strong> Once
              confirmed, this PDF report is instantly published to {patientName}&apos;s account in
              the Medco Patient App, enabling immediate in-app viewing and high-resolution PDF download.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!dataUrl}
            onClick={handleConfirm}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
              dataUrl
                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 size={15} />
            <span>Confirm &amp; Release Report to Customer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
