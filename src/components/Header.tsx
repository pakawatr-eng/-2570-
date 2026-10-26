import React from 'react';
import { 
  FileSpreadsheet, 
  Share2, 
  Plus, 
  Layers, 
  Bell
} from 'lucide-react';

interface HeaderProps {
  onAddNew: () => void;
  onExportExcel: () => void;
  onOpenShare: (tab?: 'form' | 'database' | 'files') => void;
  totalCount: number;
  overdueCount?: number;
  onOpenNotificationCenter?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onAddNew,
  onExportExcel,
  onOpenShare,
  totalCount,
  overdueCount = 0,
  onOpenNotificationCenter,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight truncate font-['Prompt',sans-serif]">
                  ทะเบียนคุมใบยืมและคืน
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-medium shrink-0">
                  ครุภัณฑ์ ปี 2570
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate hidden sm:block">
                ระบบบริหารจัดการบันทึกยืม-คืน ตรวจติดตามพัสดุและครุภัณฑ์ราชการ
              </p>
            </div>
          </div>

          {/* Zone 2: Navigation Links / Status Indicator */}
          <div className="hidden lg:flex items-center gap-3 text-sm text-slate-600 font-medium">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>ฐานข้อมูลปี 2570</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums font-semibold text-slate-700">{totalCount} รายการ</span>
            </div>

            {/* In-System Notification Center Button */}
            {overdueCount > 0 && onOpenNotificationCenter && (
              <button
                type="button"
                onClick={onOpenNotificationCenter}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors animate-pulse cursor-pointer"
                title="คลิกเพื่อเปิดศูนย์แจ้งเตือนพัสดุครบกำหนด/เกินกำหนดส่งคืนในระบบ"
              >
                <Bell className="w-3.5 h-3.5 text-rose-600" />
                <span>แจ้งเตือนในระบบ ({overdueCount} รายการ)</span>
              </button>
            )}
          </div>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Mobile Notification Badge */}
            {overdueCount > 0 && onOpenNotificationCenter && (
              <button
                type="button"
                onClick={onOpenNotificationCenter}
                className="lg:hidden p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg relative transition-colors"
                title={`แจ้งเตือนพัสดุครบกำหนด ${overdueCount} รายการ`}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {overdueCount}
                </span>
              </button>
            )}

            <button
              onClick={() => onOpenShare('form')}
              title="แชร์ลิงก์แบบฟอร์มให้ผู้ยืมกรอกข้อมูล เชื่อมโยงเข้าสู่ฐานข้อมูลหลักของผู้ดูแล (pakawat.day@gmail.com)"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-indigo-700 bg-indigo-50/80 border border-indigo-200 rounded-lg hover:bg-indigo-100/70 hover:border-indigo-300 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">แชร์ลิงก์ฟอร์มยืมพัสดุ</span>
              <span className="sm:hidden">แชร์ฟอร์ม</span>
            </button>

            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">ดาวน์โหลด Excel</span>
              <span className="md:hidden">Excel</span>
            </button>

            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-2xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกใบยืมใหม่</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
