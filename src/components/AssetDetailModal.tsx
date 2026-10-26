import React from 'react';
import { AssetLoanRecord, STATUS_META } from '../types/asset';
import { calculateOverdueDays } from '../utils/notifications';
import { 
  X, 
  Printer, 
  Edit3, 
  Calendar, 
  Building2, 
  MapPin, 
  User, 
  Phone, 
  Bell,
  QrCode,
  CheckCircle2,
  Trash2,
  Check,
  FileText,
  Tag,
  Mail
} from 'lucide-react';

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AssetLoanRecord | null;
  onEdit: (record: AssetLoanRecord) => void;
  onPrintSlip: (record: AssetLoanRecord) => void;
  onOpenNotificationModal?: (record: AssetLoanRecord) => void;
  onDeleteRequest: (record: AssetLoanRecord) => void;
  onOpenPdfViewer?: (dataUrl: string, name?: string, size?: number, date?: string, title?: string) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  onEdit,
  onPrintSlip,
  onOpenNotificationModal,
  onDeleteRequest,
  onOpenPdfViewer,
}) => {
  if (!isOpen || !record) return null;

  const statusMeta = STATUS_META[record.status] || STATUS_META.BORROWED;
  const isOverdueOrBorrowed = record.status === 'OVERDUE' || record.status === 'BORROWED';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono tabular-nums text-xs px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                  {record.borrowDocNo}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusMeta.bgClass} ${statusMeta.textClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                  {statusMeta.label}
                </span>
                {record.status === 'OVERDUE' && calculateOverdueDays(record.expectedReturnDate) > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-rose-100 text-rose-800 border border-rose-200 font-mono">
                    เกินกำหนด {calculateOverdueDays(record.expectedReturnDate)} วัน
                  </span>
                )}
                <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                  record.locationScope === 'ภายในจุฬาฯ' 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {record.locationScope || 'ภายในจุฬาฯ'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 mt-1 font-['Prompt',sans-serif]">
                {record.assetName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Barcode & Identifiers Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-500">รหัสครุภัณฑ์ (Asset Code)</div>
              <div className="font-mono font-semibold text-indigo-700 mt-0.5 text-xs sm:text-sm">
                {record.assetCode}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">หมายเลขเครื่อง (S/N)</div>
              <div className="font-mono text-slate-800 mt-0.5 text-xs truncate">
                {record.serialNumber || 'ไม่มี/ไม่ระบุ'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">เลขที่ลงรับพัสดุ</div>
              <div className="font-mono text-slate-800 mt-0.5 text-xs">
                {record.receiptParcelNo || '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">วันที่ลงรับพัสดุ</div>
              <div className="font-mono text-slate-800 mt-0.5 text-xs">
                {record.receiptParcelDate || '-'}
              </div>
            </div>
          </div>

          {/* รายการครุภัณฑ์ทั้งหมด (กรณีมีรายการอื่นเพิ่มเติม) */}
          {record.additionalAssets && record.additionalAssets.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-500" />
                  รายการครุภัณฑ์ทั้งหมดในใบยืมนี้
                </span>
                <span className="font-mono text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  รวม {1 + record.additionalAssets.length} รายการ
                </span>
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {/* รายการที่ 1 (หลัก) */}
                <div className="p-3 bg-indigo-50/40 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold mt-0.5 shrink-0">
                      1
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">{record.assetName}</div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="font-mono text-indigo-700 font-medium">{record.assetCode}</span>
                        {record.serialNumber && <span>· S/N: {record.serialNumber}</span>}
                        {record.room && <span>· ห้อง: {record.room}</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded shrink-0">
                    รายการหลัก
                  </span>
                </div>

                {/* รายการเพิ่มเติม */}
                {record.additionalAssets.map((item, index) => (
                  <div key={item.id} className="p-3 bg-white flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] font-bold mt-0.5 shrink-0">
                        {index + 2}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-800">{item.assetName || '(ไม่ได้ระบุชื่อ)'}</div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="font-mono text-slate-700 font-medium">{item.assetCode || '-'}</span>
                          {item.serialNumber && <span>· S/N: {item.serialNumber}</span>}
                          {item.room && <span>· ห้อง: {item.room}</span>}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 shrink-0">
                      รายการที่ {index + 2}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: กำหนดการยืมและสถานที่ */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              ระยะเวลาการยืม-คืน และขอบเขตสถานที่
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-slate-200 rounded-xl p-4">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">ช่วงเวลาการยืมใช้งาน</div>
                  <div className="font-medium text-slate-800 mt-0.5 font-mono">
                    {record.borrowDate} ถึง {record.expectedReturnDate}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">
                    ขอบเขตสถานที่ยืมไปใช้งาน / ห้อง
                  </div>
                  <div className="font-medium text-slate-800 mt-0.5">
                    {record.locationScope || 'ภายในจุฬาฯ'} (ห้อง: {record.room})
                  </div>
                </div>
              </div>

              {record.purpose && (
                <div className="sm:col-span-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <span className="font-medium text-slate-700">วัตถุประสงค์การใช้งาน: </span>
                  {record.purpose}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: ข้อมูลผู้ยืม & หน่วยงานเจ้าของครุภัณฑ์ */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              ข้อมูลผู้ยืม และหน่วยงานเจ้าของครุภัณฑ์
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-slate-200 rounded-xl p-4">
              <div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> ผู้ขอยืม
                </div>
                <div className="font-medium text-slate-900 mt-1">{record.borrowerName}</div>
                <div className="text-xs text-slate-600 mt-0.5">{record.borrowerDepartment}</div>
                {record.borrowerPhone && (
                  <div className="text-xs text-slate-500 font-mono mt-1.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {record.borrowerPhone}
                  </div>
                )}
                {(record.borrowerEmail || record.recordedByEmail) && (
                  <div className="text-xs text-indigo-700 font-mono mt-1.5 flex items-center gap-1.5 bg-indigo-50/70 px-2 py-1 rounded border border-indigo-100">
                    <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{record.borrowerEmail || record.recordedByEmail}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" /> หน่วยงานเจ้าของครุภัณฑ์
                </div>
                <div className="font-semibold text-indigo-700 mt-1">
                  {record.ownerDepartment || '-'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  ห้องประจำการ: <span className="text-slate-700 font-medium">{record.room}</span>
                </div>

                {record.systemNotifiedAt && (
                  <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        บันทึกการติดตามในระบบล่าสุด: {new Date(record.systemNotifiedAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} น.
                      </span>
                    </div>
                    {record.followUpNotes && (
                      <p className="text-[11px] text-slate-600 pl-5">
                        ผลการติดตาม: {record.followUpNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: การส่งคืนและสภาพพัสดุ (คืนแล้วเสร็จ) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
              การส่งคืนและสภาพพัสดุ (คืนแล้วเสร็จ)
            </h3>
            
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">วันที่คืนพัสดุ (ส่งคืนจริง):</span>
                <span className="font-mono font-medium text-slate-800">
                  {record.actualReturnDate ? record.actualReturnDate : 'ยังไม่ได้ส่งคืน'}
                </span>
              </div>
              {record.returnCondition && (
                <div className="flex items-start justify-between">
                  <span className="text-slate-500">สภาพเมื่อส่งคืน:</span>
                  <span className="text-slate-800 font-medium text-right max-w-xs">{record.returnCondition}</span>
                </div>
              )}
              {record.receiverName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">เจ้าหน้าที่ผู้ตรวจรับมอบคืน:</span>
                  <span className="text-slate-800 font-medium">{record.receiverName}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-500">เอกสารคืนแล้วเสร็จ (.pdf):</span>
                {record.returnPdfFile ? (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700 font-medium truncate max-w-[170px]" title={record.returnPdfName}>
                      {record.returnPdfName || 'เอกสารคืนแล้วเสร็จ.pdf'}
                    </span>
                    {onOpenPdfViewer && (
                      <button
                        onClick={() => onOpenPdfViewer(record.returnPdfFile!, record.returnPdfName, record.returnPdfSize, record.returnPdfUploadedAt, `${record.borrowDocNo} - ${record.assetName}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer"
                        title="คลิกเพื่อเปิดดูเอกสาร PDF"
                      >
                        <FileText className="w-3 h-3 text-rose-600" />
                        <span>เปิดดู PDF</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">ไม่มีไฟล์แนบ (ไม่บังคับ)</span>
                )}
              </div>
              {record.remarks && (
                <div className="pt-2 border-t border-slate-200 text-slate-600">
                  <span className="font-medium text-slate-700">หมายเหตุเพิ่มเติม: </span>
                  {record.remarks}
                </div>
              )}
            </div>
          </div>

          {/* ข้อมูลการบันทึกสถานะล่าสุด (Current Persistence Info) */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>สถานะข้อมูล: <strong>บันทึกเป็นปัจจุบันแล้ว</strong></span>
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              บันทึกล่าสุด: {record.updatedAt ? new Date(record.updatedAt).toLocaleString('th-TH') : new Date().toLocaleString('th-TH')}
            </div>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onDeleteRequest(record);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ลบเอกสารนี้</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {isOverdueOrBorrowed && onOpenNotificationModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenNotificationModal(record);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors shadow-2xs ${
                  record.status === 'OVERDUE'
                    ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-300'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200'
                }`}
                title="เปิดบันทึกติดตามพัสดุในระบบ"
              >
                <Bell className="w-4 h-4" />
                <span>แจ้งเตือน / ติดตามในระบบ</span>
              </button>
            )}

            <button
              onClick={() => onPrintSlip(record)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>พิมพ์ใบยืม-คืน</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
            >
              <Edit3 className="w-4 h-4" />
              <span>แก้ไขข้อมูลนี้</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
