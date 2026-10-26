import React, { useState, useRef } from 'react';
import { AssetLoanRecord } from '../types/asset';
import { X, CheckCircle2, FileText, Upload, Trash2, Eye, AlertCircle } from 'lucide-react';

interface QuickReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AssetLoanRecord | null;
  onConfirmReturn: (updatedRecord: AssetLoanRecord) => void;
  onOpenPdfViewer?: (dataUrl: string, name?: string, size?: number, date?: string, title?: string) => void;
}

export const QuickReturnModal: React.FC<QuickReturnModalProps> = ({
  isOpen,
  onClose,
  record,
  onConfirmReturn,
  onOpenPdfViewer,
}) => {
  if (!isOpen || !record) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const [returnDate, setReturnDate] = useState(todayStr);
  const [condition, setCondition] = useState('สภาพสมบูรณ์ พร้อมอุปกรณ์เสริมครบถ้วน');
  const [customNotes, setCustomNotes] = useState('');
  const [receiver, setReceiver] = useState('เจ้าหน้าที่งานพัสดุ');
  const [returnPdfFile, setReturnPdfFile] = useState<string | undefined>(record.returnPdfFile);
  const [returnPdfName, setReturnPdfName] = useState<string | undefined>(record.returnPdfName);
  const [returnPdfSize, setReturnPdfSize] = useState<number | undefined>(record.returnPdfSize);
  const [returnPdfUploadedAt, setReturnPdfUploadedAt] = useState<string | undefined>(record.returnPdfUploadedAt);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFileError('กรุณาเลือกไฟล์รูปแบบ .pdf เท่านั้น');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Limit to 20MB
    if (file.size > 20 * 1024 * 1024) {
      setFileError('ขนาดไฟล์ต้องไม่เกิน 20MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setReturnPdfFile(result);
      setReturnPdfName(file.name);
      setReturnPdfSize(file.size);
      setReturnPdfUploadedAt(new Date().toISOString());
    };
    reader.onerror = () => {
      setFileError('เกิดข้อผิดพลาดในการอ่านไฟล์ PDF');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePdf = () => {
    setReturnPdfFile(undefined);
    setReturnPdfName(undefined);
    setReturnPdfSize(undefined);
    setReturnPdfUploadedAt(undefined);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCondition = customNotes.trim() ? `${condition} (${customNotes.trim()})` : condition;
    const updated: AssetLoanRecord = {
      ...record,
      status: 'RETURNED',
      actualReturnDate: returnDate,
      returnCondition: finalCondition,
      receiverName: receiver,
      returnPdfFile,
      returnPdfName,
      returnPdfSize,
      returnPdfUploadedAt: returnPdfFile ? (returnPdfUploadedAt || new Date().toISOString()) : undefined,
      updatedAt: new Date().toISOString(),
    };
    onConfirmReturn(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 font-['Prompt',sans-serif]">
                บันทึกการส่งคืนพัสดุและครุภัณฑ์
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {record.borrowDocNo} · {record.assetCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-sm max-h-[80vh] overflow-y-auto">
          
          {/* Brief info */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="font-semibold text-slate-800 flex items-center justify-between gap-2">
              <span className="truncate">{record.assetName}</span>
              {record.additionalAssets && record.additionalAssets.length > 0 && (
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 shrink-0">
                  +อีก {record.additionalAssets.length} รายการ
                </span>
              )}
            </div>
            {record.additionalAssets && record.additionalAssets.length > 0 && (
              <div className="text-[11px] text-slate-500 pt-0.5 pb-0.5 truncate">
                ครุภัณฑ์เพิ่มเติม: {record.additionalAssets.map(a => a.assetName).join(', ')}
              </div>
            )}
            <div className="text-slate-500">
              ผู้ยืม: <span className="text-slate-700 font-medium">{record.borrowerName}</span> ({record.borrowerDepartment})
            </div>
            <div className="text-slate-500">
              กำหนดส่งคืนเดิม: <span className="font-mono text-slate-700">{record.expectedReturnDate}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              วันที่คืนพัสดุจริง <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              สภาพพัสดุเมื่อส่งคืน
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="สภาพสมบูรณ์ พร้อมอุปกรณ์เสริมครบถ้วน">สภาพสมบูรณ์ พร้อมอุปกรณ์เสริมครบถ้วน</option>
              <option value="สภาพปกติ ใช้งานได้ดี มีรอยขีดข่วนเล็กน้อย">สภาพปกติ ใช้งานได้ดี มีรอยขีดข่วนเล็กน้อย</option>
              <option value="อุปกรณ์ส่วนควบไม่ครบถ้วน (ส่งคืนบางส่วน)">อุปกรณ์ส่วนควบไม่ครบถ้วน (ส่งคืนบางส่วน)</option>
              <option value="มีรอยชำรุดจากการใช้งาน">มีรอยชำรุดจากการใช้งาน</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              หมายเหตุสภาพพัสดุเพิ่มเติม (ถ้ามี)
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="เช่น อุปกรณ์สายชาร์จครบ, มีคู่มือครบชุด"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              เจ้าหน้าที่ผู้รับมอบคืน <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              placeholder="ระบุชื่อเจ้าหน้าที่ผู้ตรวจรับคืน"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* ช่องแนบไฟล์ .pdf ในส่วนคืนแล้วเสร็จ (ไม่บังคับ) */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-rose-600" />
                <span>แนบไฟล์เอกสารการคืน (.pdf)</span>
                <span className="text-[11px] font-normal text-slate-500">(ไม่บังคับ)</span>
              </label>
              {returnPdfFile && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>แนบไฟล์แล้ว</span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              เช่น ใบส่งมอบคืนพัสดุ, ใบตรวจรับคืน หรือบันทึกข้อความ (ไฟล์ .pdf ไม่เกิน 20MB - ไม่บังคับต้องใส่)
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,application/pdf"
              onChange={handlePdfUpload}
              className="hidden"
              id="quick-return-pdf-input"
            />

            {returnPdfFile ? (
              <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-rose-200 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate max-w-[190px] sm:max-w-[240px]">
                      {returnPdfName || 'เอกสารคืนแล้วเสร็จ.pdf'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {returnPdfSize ? `${(returnPdfSize / 1024).toFixed(1)} KB` : ''} · ไฟล์ PDF พร้อมบันทึก
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onOpenPdfViewer && (
                    <button
                      type="button"
                      onClick={() => onOpenPdfViewer(returnPdfFile, returnPdfName, returnPdfSize, returnPdfUploadedAt, `${record.borrowDocNo} - ${record.assetName}`)}
                      className="px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-50 rounded transition-colors font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูตัวอย่าง</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRemovePdf}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="ลบไฟล์แนบนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="quick-return-pdf-input"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white hover:bg-indigo-50/50 border border-dashed border-slate-300 hover:border-indigo-400 rounded-lg text-xs font-medium text-slate-600 hover:text-indigo-600 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>คลิกเพื่อเลือกไฟล์ .pdf หรือลากไฟล์มาวางที่นี่ (ไม่บังคับ)</span>
                </label>
              </div>
            )}

            {fileError && (
              <div className="flex items-center gap-1.5 text-[11px] text-rose-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกรับคืนเรียบร้อย</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
