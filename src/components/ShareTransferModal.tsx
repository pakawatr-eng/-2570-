import React, { useState, useRef } from 'react';
import { AssetLoanRecord } from '../types/asset';
import { 
  getBorrowFormUrl,
  encodeRecordsToShareUrl, 
  exportRecordsToJsonFile, 
  generateHandoverText,
  generateBorrowFormInviteText,
  generateLineShareUrl
} from '../utils/share';
import { parseExcelToRecords } from '../utils/excel';
import { QRCodeDisplay } from './QRCodeDisplay';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  MessageSquare,
  Link,
  ShieldCheck,
  Send,
  Database,
  FileText,
  Smartphone,
  ExternalLink
} from 'lucide-react';

interface ShareTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AssetLoanRecord[];
  onImportRecords: (newRecords: AssetLoanRecord[], mode: 'replace' | 'append') => void;
  onExportExcel: () => void;
  initialTab?: 'form' | 'database' | 'files';
}

export const ShareTransferModal: React.FC<ShareTransferModalProps> = ({
  isOpen,
  onClose,
  records,
  onImportRecords,
  onExportExcel,
  initialTab = 'form',
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'database' | 'files'>(initialTab);
  const [copiedFormLink, setCopiedFormLink] = useState(false);
  const [copiedFormText, setCopiedFormText] = useState(false);
  const [copiedDbLink, setCopiedDbLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const borrowFormUrl = getBorrowFormUrl();
  const formInviteText = generateBorrowFormInviteText(borrowFormUrl);
  const formLineShareUrl = generateLineShareUrl(formInviteText);

  const dbShareUrl = encodeRecordsToShareUrl(records);
  const handoverText = generateHandoverText(records);
  const dbLineShareUrl = generateLineShareUrl(
    `📋 ฐานข้อมูลระบบทะเบียนคุมใบยืมและคืนครุภัณฑ์ (${records.length} รายการ)\nคลิกเพื่อเปิดและบันทึกข้อมูลต่อ:\n${dbShareUrl}`
  );

  const handleCopyFormLink = async () => {
    try {
      await navigator.clipboard.writeText(borrowFormUrl);
      setCopiedFormLink(true);
      setTimeout(() => setCopiedFormLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyFormText = async () => {
    try {
      await navigator.clipboard.writeText(formInviteText);
      setCopiedFormText(true);
      setTimeout(() => setCopiedFormText(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyDbLink = async () => {
    try {
      await navigator.clipboard.writeText(dbShareUrl);
      setCopiedDbLink(true);
      setTimeout(() => setCopiedDbLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(handoverText);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          onImportRecords(json as AssetLoanRecord[], 'replace');
          setImportNotice(`นำเข้าข้อมูลสำเร็จ ${json.length} รายการ ข้อมูลถูกบันทึกลงเครื่องแล้ว`);
          setTimeout(() => {
            setImportNotice(null);
            onClose();
          }, 1800);
        } else {
          setImportNotice('รูปแบบไฟล์ JSON ไม่ถูกต้อง กรุณาเลือกไฟล์สำรองที่ถูกต้อง');
        }
      } catch (err) {
        setImportNotice('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON: ' + String(err));
      }
    };
    reader.readAsText(file);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await parseExcelToRecords(file);
      if (imported.length > 0) {
        onImportRecords(imported, 'replace');
        setImportNotice(`นำเข้าข้อมูลจาก Excel สำเร็จ ${imported.length} รายการ ข้อมูลถูกบันทึกลงเครื่องแล้ว`);
        setTimeout(() => {
          setImportNotice(null);
          onClose();
        }, 1800);
      } else {
        setImportNotice('ไม่พบข้อมูลรายการในไฟล์ Excel');
      }
    } catch (err) {
      setImportNotice('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel: ' + String(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 font-['Prompt',sans-serif]">
                แชร์ลิงก์แบบฟอร์มให้ผู้ใช้งานอื่นกรอกข้อมูล
              </h2>
              <p className="text-xs text-slate-500">
                ข้อมูลที่กรอกจะเชื่อมโยงเข้าสู่ฐานข้อมูลหลักของผู้ดูแล (pakawat.day@gmail.com) โดยอัตโนมัติ
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

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2 gap-2 overflow-x-auto text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-3.5 py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'form'
                ? 'border-indigo-600 text-indigo-700 font-semibold bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4 text-indigo-600" />
            <span>1. ส่งให้ผู้ใช้กรอกใบยืม (ฟอร์ม)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-3.5 py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'database'
                ? 'border-indigo-600 text-indigo-700 font-semibold bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-indigo-600" />
            <span>2. ส่งต่อฐานข้อมูลให้เจ้าหน้าที่</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 px-3.5 py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'files'
                ? 'border-indigo-600 text-indigo-700 font-semibold bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>3. ถ่ายโอนไฟล์ Excel / JSON</span>
          </button>
        </div>

        {importNotice && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{importNotice}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto text-sm">
          
          {/* TAB 1: ส่งให้ผู้ใช้กรอกใบยืม */}
          {activeTab === 'form' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-gradient-to-r from-indigo-50 to-emerald-50/60 border border-indigo-200/80 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <h3 className="font-semibold text-slate-900 font-['Prompt',sans-serif] text-sm">
                        ลิงก์แบบฟอร์มบันทึกขอยืมพัสดุ (เชื่อมฐานข้อมูลหลักของผู้ดูแล)
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        เชื่อมต่อฐานข้อมูลหลักแล้ว
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      เมื่อผู้ใช้งานหรือผู้ขอยืมเปิดลิงก์นี้และกด <strong>"บันทึกข้อมูล"</strong> ข้อมูลจะถูกเชื่อมโยงและส่งตรงเข้าสู่ฐานข้อมูลหลักของผู้ดูแล (<strong className="text-indigo-800 font-mono">pakawat.day@gmail.com</strong>) ทันทีแบบเรียลไทม์
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-indigo-100/70 text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                      <span>🛡️ ผู้ดูแลฐานข้อมูล: <strong className="text-slate-700 font-mono">pakawat.day@gmail.com</strong></span>
                      <span>·</span>
                      <span>หน่วยงาน: <strong>หน่วยพัสดุ จุฬาลงกรณ์มหาวิทยาลัย</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* URL & Quick Actions */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>ลิงก์สำหรับเข้ากรอกแบบฟอร์ม:</span>
                  <span className="text-[11px] text-indigo-600 font-normal">เปิดได้ทุกเบราว์เซอร์</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={borrowFormUrl}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700 select-all truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyFormLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shrink-0 shadow-2xs cursor-pointer"
                  >
                    {copiedFormLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedFormLink ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
                  </button>
                </div>
              </div>

              {/* QR Code and LINE Share Side-by-Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="flex flex-col items-center justify-center">
                  <QRCodeDisplay
                    url={borrowFormUrl}
                    size={150}
                    label="QR Code สำหรับสแกนกรอกใบยืม"
                    subLabel="ใช้มือถือสแกนเพื่อเปิดแบบฟอร์มทันที"
                  />
                </div>

                <div className="space-y-3 flex flex-col justify-center">
                  <div className="text-xs font-medium text-slate-700">ส่งต่ออย่างรวดเร็วผ่านช่องทาง:</div>
                  
                  <a
                    href={formLineShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-white bg-[#06C755] hover:bg-[#05b34c] rounded-xl transition-colors shadow-2xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>ส่งเข้าแชท LINE ทันที</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyFormText}
                    className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300/60 rounded-xl transition-colors cursor-pointer"
                  >
                    {copiedFormText ? <Check className="w-4 h-4 text-emerald-600" /> : <FileText className="w-4 h-4 text-slate-600" />}
                    <span>{copiedFormText ? 'คัดลอกข้อความแล้ว!' : 'คัดลอกข้อความเชิญชวนส่งในแชท'}</span>
                  </button>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500">
                    💡 <strong>คำแนะนำ:</strong> เมื่อผู้ยืมกรอกและบันทึกข้อมูลแล้ว ระบบจะออกใบยืมพัสดุและมีปุ่มให้ผู้ยืมส่งข้อมูลกลับมายังเจ้าหน้าที่ได้อย่างสะดวก
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ส่งต่อฐานข้อมูลให้เจ้าหน้าที่ */}
          {activeTab === 'database' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 font-['Prompt',sans-serif] text-sm">
                      ส่งต่อฐานข้อมูลทะเบียนคุมทั้งหมด ({records.length} รายการ)
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      ส่งลิงก์ฐานข้อมูลนี้ให้เจ้าหน้าที่พัสดุท่านอื่นรับช่วงต่อ เมื่อผู้รับเปิดลิงก์ ระบบจะบันทึกข้อมูลทั้งหมดลงในเครื่องของผู้รับ และสามารถบันทึกเพิ่ม แก้ไข หรือบันทึกการส่งคืนต่อได้ทันที
                    </p>
                  </div>
                </div>
              </div>

              {/* Database Link */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>ลิงก์ส่งต่อฐานข้อมูลทั้งหมด (บรรจุข้อมูล {records.length} รายการ):</span>
                  <span className="text-[11px] text-slate-400">บันทึกลงในเครื่องผู้รับอัตโนมัติ</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={dbShareUrl}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700 select-all truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyDbLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shrink-0 shadow-2xs cursor-pointer"
                  >
                    {copiedDbLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedDbLink ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
                  </button>
                </div>
              </div>

              {/* QR Code and Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="flex flex-col items-center justify-center">
                  <QRCodeDisplay
                    url={dbShareUrl}
                    size={150}
                    label="QR Code ส่งต่อฐานข้อมูล"
                    subLabel="เจ้าหน้าที่สแกนเพื่อรับช่วงงานต่อ"
                  />
                </div>

                <div className="space-y-3 flex flex-col justify-center">
                  <a
                    href={dbLineShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-white bg-[#06C755] hover:bg-[#05b34c] rounded-xl transition-colors shadow-2xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>แชร์ฐานข้อมูลผ่าน LINE</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>

                  <button
                    type="button"
                    onClick={() => exportRecordsToJsonFile(records)}
                    className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    <span>ดาวน์โหลดไฟล์สำรอง (.json)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ถ่ายโอนไฟล์ (Excel & JSON) */}
          {activeTab === 'files' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Excel Box */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs sm:text-sm">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>ไฟล์ Excel (.xlsx)</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    ดาวน์โหลดหรือนำเข้าตารางทะเบียนคุมเพื่อเปิดใช้งานกับโปรแกรม Microsoft Excel
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onExportExcel}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100/70 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลด</span>
                    </button>
                    <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>นำเข้า Excel</span>
                      <input
                        ref={excelInputRef}
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleExcelUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* JSON Box */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs sm:text-sm">
                    <Download className="w-4 h-4 text-indigo-600" />
                    <span>ไฟล์ข้อมูลระบบ (.json)</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    สำรองข้อมูลครบทุกฟิลด์เพื่อเก็บสำรองข้อมูล หรือส่งต่อให้เครื่องอื่นนำเข้า
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => exportRecordsToJsonFile(records)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100/70 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>สำรองข้อมูล</span>
                    </button>
                    <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>กู้คืนข้อมูล</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleJsonUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>


              </div>

              {/* Handover Text */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 text-xs sm:text-sm">
                    <MessageSquare className="w-4 h-4 text-slate-600" />
                    <span>รายงานสรุปข้อความสำหรับส่งต่อทางแชท / อีเมล</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSummary ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}</span>
                  </button>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {handoverText}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
