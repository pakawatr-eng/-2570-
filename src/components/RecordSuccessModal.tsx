import React, { useState } from 'react';
import { AssetLoanRecord } from '../types/asset';
import { 
  encodeSingleRecordShareUrl, 
  generateLineShareUrl, 
  generateNewRecordConfirmationText 
} from '../utils/share';
import { QRCodeDisplay } from './QRCodeDisplay';
import { 
  CheckCircle2, 
  X, 
  Copy, 
  Check, 
  Printer, 
  Share2, 
  MessageCircle, 
  Plus, 
  FileText
} from 'lucide-react';

interface RecordSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AssetLoanRecord | null;
  onPrintSlip: (record: AssetLoanRecord) => void;
  onAddNew: () => void;
}

export const RecordSuccessModal: React.FC<RecordSuccessModalProps> = ({
  isOpen,
  onClose,
  record,
  onPrintSlip,
  onAddNew,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen || !record) return null;

  const returnUrl = encodeSingleRecordShareUrl(record);
  const shareText = generateNewRecordConfirmationText(record, returnUrl);
  const lineUrl = generateLineShareUrl(shareText);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(returnUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Prompt',sans-serif]">
                บันทึกข้อมูลใบยืมพัสดุเรียบร้อยแล้ว
              </h2>
              <p className="text-xs text-emerald-800">
                ข้อมูลถูกเชื่อมโยงและบันทึกเข้าสู่ฐานข้อมูลหลักของผู้ดูแล (pakawat.day@gmail.com) เรียบร้อยแล้ว
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-sm">
          
          {/* Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">เลขที่ใบยืม / ปีงบประมาณ</span>
              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-sm border border-indigo-200/60">
                {record.borrowDocNo}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
              <div>
                <span className="text-slate-500">ผู้ขอยืม:</span>{' '}
                <span className="font-semibold text-slate-800">{record.borrowerName}</span>
              </div>
              <div>
                <span className="text-slate-500">สังกัด:</span>{' '}
                <span className="text-slate-800">{record.borrowerDepartment || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">ครุภัณฑ์:</span>{' '}
                <span className="font-semibold text-slate-800">{record.assetName}</span>
              </div>
              <div>
                <span className="text-slate-500">รหัสครุภัณฑ์:</span>{' '}
                <span className="font-mono text-slate-800">{record.assetCode}</span>
              </div>
              <div>
                <span className="text-slate-500">วันที่ยืม:</span>{' '}
                <span className="text-slate-800">{record.borrowDate}</span>
              </div>
              <div>
                <span className="text-slate-500">กำหนดคืน:</span>{' '}
                <span className="font-semibold text-indigo-600">{record.expectedReturnDate || '-'}</span>
              </div>
            </div>
          </div>

          {/* Section: ส่งข้อมูลให้เจ้าหน้าที่พัสดุ */}
          <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-indigo-950 font-semibold text-xs sm:text-sm font-['Prompt',sans-serif]">
              <Share2 className="w-4 h-4 text-indigo-600" />
              <span>แจ้งเตือนข้อมูลการยืมไปยังผู้ดูแลระบบ (pakawat.day@gmail.com)</span>
            </div>
            
            <p className="text-xs text-indigo-800 leading-relaxed">
              ข้อมูลใบยืมฉบับนี้ถูกเชื่อมโยงเข้าสู่ฐานข้อมูลหลักเรียบร้อยแล้ว ท่านสามารถส่งลิงก์หรือแชร์ทาง LINE เพื่อแจ้งเตือนผู้ดูแลระบบได้ทันที
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* QR Code */}
              <div className="shrink-0">
                <QRCodeDisplay
                  url={returnUrl}
                  size={120}
                  label="สแกนนำเข้าระบบ"
                  subLabel="สำหรับเจ้าหน้าที่สแกน"
                />
              </div>

              {/* Action buttons */}
              <div className="flex-1 space-y-2 w-full">
                <a
                  href={lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#06C755] hover:bg-[#05b34c] rounded-lg transition-colors shadow-2xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>แชร์ไปยัง LINE ของเจ้าหน้าที่</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'คัดลอกลิงก์ส่งงานแล้ว!' : 'คัดลอกลิงก์ส่งงาน'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'คัดลอกข้อความแล้ว!' : 'คัดลอกข้อความสรุป'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onPrintSlip(record);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์ใบยืมพัสดุราชการ</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddNew();
              }}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-indigo-700 hover:text-indigo-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกใบยืมอื่นต่อ</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
            >
              ดูรายการในระบบ
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
