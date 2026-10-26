import React from 'react';
import { AssetLoanRecord } from '../types/asset';
import { calculateOverdueDays } from '../utils/notifications';
import { Bell, Sparkles, CheckCircle2 } from 'lucide-react';

interface OverdueAlertBannerProps {
  overdueRecords: AssetLoanRecord[];
  onOpenNotificationCenter: () => void;
  onFilterOverdueOnly: () => void;
  onAutoSyncOverdueStatus?: () => void;
  hasUnsyncedOverdue?: boolean;
}

export const OverdueAlertBanner: React.FC<OverdueAlertBannerProps> = ({
  overdueRecords,
  onOpenNotificationCenter,
  onFilterOverdueOnly,
  onAutoSyncOverdueStatus,
  hasUnsyncedOverdue = false,
}) => {
  if (overdueRecords.length === 0) return null;

  return (
    <div className="mb-6 bg-gradient-to-r from-rose-50 via-rose-50/80 to-amber-50/70 border border-rose-200/90 rounded-2xl p-4 sm:p-5 text-rose-950 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Side: Notice & Details */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100/90 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base font-['Prompt',sans-serif] text-rose-900">
                ระบบตรวจพบครุภัณฑ์ครบกำหนดและเกินกำหนดส่งคืน {overdueRecords.length} รายการ
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-800 font-mono font-bold">
                รอส่งคืน
              </span>
            </div>
            
            <p className="text-xs text-rose-800 leading-relaxed">
              มีพัสดุและครุภัณฑ์ที่ครบกำหนดระยะเวลาการยืมแล้วแต่ยังไม่ได้รับมอบคืน ท่านสามารถเปิดศูนย์แจ้งเตือนผ่านระบบเพื่อบันทึกการติดตามพัสดุหรือบันทึกรับคืนได้ทันที
            </p>

            {/* Overdue Chips Preview */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
              {overdueRecords.slice(0, 4).map((rec) => {
                const days = calculateOverdueDays(rec.expectedReturnDate);
                return (
                  <button
                    key={rec.id}
                    onClick={onOpenNotificationCenter}
                    className="inline-flex items-center gap-1.5 text-xs bg-white/90 hover:bg-white text-slate-800 px-2.5 py-1 rounded-lg border border-rose-200/80 shadow-2xs hover:border-rose-400 transition-colors cursor-pointer group"
                    title="คลิกเพื่อดูการแจ้งเตือนในระบบ"
                  >
                    <span className="font-mono font-bold text-rose-600 text-[11px]">{rec.borrowDocNo}</span>
                    <span className="text-slate-600 truncate max-w-[130px]">{rec.borrowerName}</span>
                    {days > 0 ? (
                      <span className="font-mono text-[10px] text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded font-bold">
                        +{days}วัน
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-bold">
                        วันนี้
                      </span>
                    )}
                  </button>
                );
              })}
              {overdueRecords.length > 4 && (
                <span className="text-xs text-rose-700 font-medium self-center pl-1">
                  และอีก {overdueRecords.length - 4} รายการ
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
          {hasUnsyncedOverdue && onAutoSyncOverdueStatus && (
            <button
              onClick={onAutoSyncOverdueStatus}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-800 bg-amber-100 hover:bg-amber-200/80 border border-amber-300 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
              title="ปรับปรุงสถานะรายการที่เกินกำหนดจาก 'กำลังยืม' ให้เป็น 'เกินกำหนดส่งคืน' ทั้งหมดอัตโนมัติ"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>ปรับสถานะเป็น 'เกินกำหนด'</span>
            </button>
          )}

          <button
            onClick={onFilterOverdueOnly}
            className="px-3.5 py-2 text-xs font-medium text-rose-800 bg-white border border-rose-300 rounded-lg hover:bg-rose-100/60 transition-colors shadow-2xs whitespace-nowrap"
          >
            แสดงเฉพาะรายการเกินกำหนด
          </button>

          <button
            onClick={onOpenNotificationCenter}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>เปิดศูนย์แจ้งเตือนระบบ ({overdueRecords.length})</span>
          </button>
        </div>

      </div>
    </div>
  );
};
