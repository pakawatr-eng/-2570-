import React from 'react';
import { AssetLoanRecord } from '../types/asset';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  record: AssetLoanRecord | null;
  count?: number; // for bulk delete
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  record,
  count,
}) => {
  if (!isOpen) return null;

  const isBulk = typeof count === 'number' && count > 1;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 font-['Prompt',sans-serif]">
                {isBulk ? `ยืนยันการลบเอกสาร ${count} รายการ` : 'ยืนยันการลบเอกสารใบยืม'}
              </h2>
              <p className="text-xs text-rose-700/80">
                การดำเนินการนี้ไม่สามารถเรียกคืนได้
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-sm">
          {isBulk ? (
            <div className="text-slate-600">
              คุณกำลังจะลบเอกสารใบยืมและคืนครุภัณฑ์ที่เลือกทั้งหมด <strong className="text-slate-900 font-mono font-bold">{count}</strong> รายการ ออกจากระบบทะเบียนคุม
            </div>
          ) : record ? (
            <div className="space-y-3">
              <p className="text-slate-600">
                คุณแน่ใจหรือไม่ว่าต้องการลบเอกสารใบยืมนี้ออกจากระบบ?
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">เลขที่ใบยืม:</span>
                  <span className="font-mono font-bold text-slate-900">{record.borrowDocNo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ชื่อครุภัณฑ์:</span>
                  <span className="font-medium text-slate-800 line-clamp-1">{record.assetName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">รหัสครุภัณฑ์:</span>
                  <span className="font-mono text-slate-700">{record.assetCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ผู้ยืม:</span>
                  <span className="text-slate-700 font-medium">{record.borrowerName}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-600">คุณต้องการลบเอกสารนี้หรือไม่?</p>
          )}

          <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200 text-xs text-rose-800">
            ⚠️ ข้อมูลที่ถูกลบจะถูกนำออกจากทะเบียนคุมปี 2570 และฐานข้อมูลในเครื่องทันที
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg transition-colors shadow-2xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>ยืนยันการลบเอกสาร</span>
          </button>
        </div>

      </div>
    </div>
  );
};
