import React, { useState } from 'react';
import { AssetLoanRecord } from '../types/asset';
import { calculateOverdueDays, getDueStatusLabel } from '../utils/notifications';
import { 
  X, 
  Bell, 
  Check, 
  Clock, 
  AlertTriangle, 
  Phone, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  FileText, 
  ChevronRight,
  MessageSquare,
  Eye,
  RotateCcw
} from 'lucide-react';

interface SystemNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dueRecords: AssetLoanRecord[];
  onQuickReturn: (record: AssetLoanRecord) => void;
  onViewRecord: (record: AssetLoanRecord) => void;
  onSaveFollowUp: (recordId: string, notes: string) => void;
}

const PRESET_FOLLOW_UP_NOTES = [
  'โทรศัพท์ประสานงานผู้ยืมแล้ว นัดหมายนำส่งคืนในสัปดาห์นี้',
  'แจ้งเตือนผู้ยืมผ่านหัวหน้าฝ่าย/ภาควิชาเรียบร้อยแล้ว',
  'ผู้ยืมแจ้งว่าอยู่ระหว่างใช้งานภาคสนาม จะนำส่งคืนทันทีที่เสร็จสิ้น',
  'ประสานงานขอให้จัดทำบันทึกข้อความขอขยายเวลาการยืมตามระเบียบ',
  'ตรวจสอบพบผู้ยืมเตรียมนำมาส่งมอบคืน ณ หน่วยพัสดุ',
];

export const SystemNotificationModal: React.FC<SystemNotificationModalProps> = ({
  isOpen,
  onClose,
  dueRecords,
  onQuickReturn,
  onViewRecord,
  onSaveFollowUp,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'OVERDUE' | 'TODAY'>('ALL');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [followUpInput, setFollowUpInput] = useState('');
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredList = dueRecords.filter((rec) => {
    const days = calculateOverdueDays(rec.expectedReturnDate);
    if (filterType === 'OVERDUE') return days > 0;
    if (filterType === 'TODAY') {
      const today = new Date().toISOString().slice(0, 10);
      return rec.expectedReturnDate === today;
    }
    return true;
  });

  const handleOpenFollowUpBox = (record: AssetLoanRecord) => {
    setSelectedRecordId(record.id);
    setFollowUpInput(record.followUpNotes || '');
  };

  const handleSaveFollowUpNote = (recordId: string) => {
    if (!followUpInput.trim()) return;
    onSaveFollowUp(recordId, followUpInput.trim());
    setSavedSuccessId(recordId);
    setSelectedRecordId(null);
    setTimeout(() => setSavedSuccessId(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-amber-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Prompt',sans-serif]">
                  ศูนย์แจ้งเตือนพัสดุครบกำหนดและเกินกำหนดส่งคืน (ผ่านระบบ)
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200">
                  รอรับมอบคืน {dueRecords.length} รายการ
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                รายการพัสดุและครุภัณฑ์ที่ครบกำหนดระยะเวลาการยืมแล้วแต่ยังไม่ได้รับมอบคืน ณ หน่วยพัสดุ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Sub-header */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-lg text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({dueRecords.length})
            </button>
            <button
              onClick={() => setFilterType('OVERDUE')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'OVERDUE'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เกินกำหนดส่งคืน ({dueRecords.filter(r => calculateOverdueDays(r.expectedReturnDate) > 0).length})
            </button>
            <button
              onClick={() => setFilterType('TODAY')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'TODAY'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ครบกำหนดวันนี้ ({dueRecords.filter(r => r.expectedReturnDate === new Date().toISOString().slice(0, 10)).length})
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            แสดง {filteredList.length} จากทั้งหมด {dueRecords.length} รายการ
          </div>
        </div>

        {/* Body: List of Due/Overdue Records */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-700">ไม่มีรายการที่ต้องติดตามในหมวดหมู่นี้</p>
              <p className="text-xs text-slate-500 mt-1">พัสดุและครุภัณฑ์ได้รับการส่งมอบคืนเรียบร้อยแล้ว</p>
            </div>
          ) : (
            filteredList.map((item) => {
              const dueInfo = getDueStatusLabel(item.expectedReturnDate);
              const isSelected = selectedRecordId === item.id;
              const isSaved = savedSuccessId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all shadow-2xs space-y-3"
                >
                  {/* Top Bar of Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                        {item.borrowDocNo}
                      </span>
                      <h3 className="font-semibold text-sm sm:text-base text-slate-900">
                        {item.assetName}
                      </h3>
                    </div>

                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border self-start sm:self-auto ${dueInfo.badgeClass}`}>
                      {dueInfo.label}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block mb-0.5">รหัสครุภัณฑ์ & ห้อง:</span>
                      <span className="font-mono font-medium text-slate-800">{item.assetCode}</span>
                      <span className="text-slate-500 ml-1">({item.room})</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">ผู้ยืม & สังกัด:</span>
                      <strong className="text-slate-900">{item.borrowerName}</strong>
                      <div className="text-slate-500 truncate">{item.borrowerDepartment}</div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">กำหนดส่งคืน & ติดต่อ:</span>
                      <span className="font-mono font-bold text-rose-700">{item.expectedReturnDate}</span>
                      {item.borrowerPhone && (
                        <div className="text-slate-600 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{item.borrowerPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Follow-up Note Display */}
                  {item.systemNotifiedAt && (
                    <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 p-2.5 rounded-lg flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-semibold text-emerald-800">
                            บันทึกการติดตามในระบบล่าสุด ({new Date(item.systemNotifiedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.):
                          </span>
                          <p className="mt-0.5 text-slate-700">
                            {item.followUpNotes || 'เจ้าหน้าที่ได้บันทึกแจ้งเตือนและติดตามในระบบเรียบร้อย'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenFollowUpBox(item)}
                        className="text-[11px] text-emerald-700 hover:text-emerald-900 underline shrink-0 font-medium"
                      >
                        แก้ไขบันทึก
                      </button>
                    </div>
                  )}

                  {isSaved && (
                    <div className="text-xs bg-emerald-50 text-emerald-700 p-2 rounded-lg border border-emerald-200 flex items-center gap-1 font-medium animate-in fade-in">
                      <Check className="w-3.5 h-3.5" /> บันทึกการติดตามในระบบเรียบร้อยแล้ว
                    </div>
                  )}

                  {/* Expandable Follow-up Input Box */}
                  {isSelected && (
                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                          <span>บันทึกผลการแจ้งเตือน / ติดตามพัสดุในระบบ</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setSelectedRecordId(null)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Presets */}
                      <div className="flex flex-wrap gap-1">
                        {PRESET_FOLLOW_UP_NOTES.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFollowUpInput(preset)}
                            className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 hover:bg-amber-100/50 text-slate-700 transition-colors"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={followUpInput}
                          onChange={(e) => setFollowUpInput(e.target.value)}
                          placeholder="พิมพ์ข้อความผลการติดตาม เช่น โทรแจ้งเตือนแล้ว, ผู้ยืมจะนำส่งคืนวันที่..."
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveFollowUpNote(item.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
                        >
                          บันทึกในระบบ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions for this Card */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="text-[11px] text-slate-400">
                      สถานที่ใช้งาน: <span className="text-slate-600 font-medium">{item.locationScope}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onViewRecord(item);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>ดูข้อมูล</span>
                      </button>

                      {!isSelected && (
                        <button
                          type="button"
                          onClick={() => handleOpenFollowUpBox(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors"
                          title="บันทึกผลการติดตามหรือแจ้งเตือนในระบบ"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                          <span>บันทึกติดตาม</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onQuickReturn(item);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>บันทึกรับคืนพัสดุ</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            ระบบตรวจสอบรายการครบกำหนดและแจ้งเตือนอัตโนมัติตามปฏิทินงานพัสดุ
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
