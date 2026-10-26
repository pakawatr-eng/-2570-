import React, { useState, useMemo } from 'react';
import { AssetLoanRecord, STATUS_META } from '../types/asset';
import { calculateOverdueDays, compareBorrowDocNoAndDate } from '../utils/notifications';
import { 
  Eye, 
  Edit3, 
  CheckSquare, 
  Printer, 
  Trash2, 
  Calendar,
  Building2, 
  FileText,
  FileSpreadsheet,
  MapPin,
  Bell,
  Phone,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Tag,
  Mail
} from 'lucide-react';

interface AssetTableProps {
  records: AssetLoanRecord[];
  onView: (record: AssetLoanRecord) => void;
  onEdit: (record: AssetLoanRecord) => void;
  onQuickReturn: (record: AssetLoanRecord) => void;
  onPrintSlip: (record: AssetLoanRecord) => void;
  onOpenNotificationModal?: (record: AssetLoanRecord) => void;
  onDeleteRequest: (record: AssetLoanRecord) => void;
  onBulkDeleteRequest: (selectedIds: string[]) => void;
  onExportSelectedExcel?: (records: AssetLoanRecord[]) => void;
  onAddNew: () => void;
  onOpenPdfViewer?: (dataUrl: string, name?: string, size?: number, date?: string, title?: string) => void;
}

export type SortColumn = 
  | 'index'               // ลำดับ
  | 'borrowDocNo'         // เลขที่ใบยืม / วันที่
  | 'receiptParcelNo'     // เลขที่ลงรับพัสดุ
  | 'assetInfo'           // ข้อมูลครุภัณฑ์
  | 'borrower'            // ผู้ยืม / สังกัด
  | 'locationScope'       // สถานที่ (ภายใน/ภายนอกจุฬาฯ)
  | 'duration'            // ระยะเวลายืม-คืน
  | 'status'              // สถานะติดตาม
  | 'actualReturnDate';   // วันที่คืนพัสดุ

export const AssetTable: React.FC<AssetTableProps> = ({
  records,
  onView,
  onEdit,
  onQuickReturn,
  onPrintSlip,
  onOpenNotificationModal,
  onDeleteRequest,
  onBulkDeleteRequest,
  onExportSelectedExcel,
  onAddNew,
  onOpenPdfViewer,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortColumn>('borrowDocNo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortColumn) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Helper render sortable column header button
  const renderSortHeader = (field: SortColumn, label: string, className?: string) => {
    const isActive = sortField === field;
    return (
      <button
        type="button"
        onClick={() => handleSort(field)}
        className={`group inline-flex items-center gap-1.5 font-semibold text-left transition-colors focus:outline-none cursor-pointer ${
          isActive ? 'text-indigo-950 font-bold' : 'text-slate-700 hover:text-indigo-600'
        } ${className || ''}`}
        title={`คลิกเพื่อเรียงลำดับ ${label} (${isActive ? (sortDirection === 'asc' ? 'ปัจจุบัน: น้อย→มาก คลิกเพื่อสลับเป็น มาก→น้อย' : 'ปัจจุบัน: มาก→น้อย คลิกเพื่อสลับเป็น น้อย→มาก') : 'คลิกเพื่อเรียงลำดับ'})`}
      >
        <span>{label}</span>
        {isActive ? (
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight border transition-all ${
            sortDirection === 'asc'
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {sortDirection === 'asc' ? (
              <>
                <ArrowUp className="w-2.5 h-2.5 stroke-[2.5]" />
                <span className="text-[10px]">น้อย→มาก</span>
              </>
            ) : (
              <>
                <ArrowDown className="w-2.5 h-2.5 stroke-[2.5]" />
                <span className="text-[10px]">มาก→น้อย</span>
              </>
            )}
          </span>
        ) : (
          <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
        )}
      </button>
    );
  };

  // เรียงลำดับรายการตามคอลัมน์และทิศทาง (น้อย-มาก / มาก-น้อย)
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'index': {
          const idxA = records.findIndex(r => r.id === a.id);
          const idxB = records.findIndex(r => r.id === b.id);
          comparison = idxA - idxB;
          break;
        }

        case 'borrowDocNo': {
          const docA = (a.borrowDocNo || '').trim();
          const docB = (b.borrowDocNo || '').trim();
          comparison = docA.localeCompare(docB, 'th', { numeric: true, sensitivity: 'base' });
          if (comparison === 0) {
            comparison = (a.documentDate || a.borrowDate || '').localeCompare(b.documentDate || b.borrowDate || '');
          }
          break;
        }

        case 'receiptParcelNo': {
          const docA = (a.receiptParcelNo || '').trim();
          const docB = (b.receiptParcelNo || '').trim();
          if (!docA && !docB) comparison = 0;
          else if (!docA || docA === '-') comparison = 1;
          else if (!docB || docB === '-') comparison = -1;
          else {
            comparison = docA.localeCompare(docB, 'th', { numeric: true, sensitivity: 'base' });
            if (comparison === 0) {
              comparison = (a.receiptParcelDate || '').localeCompare(b.receiptParcelDate || '');
            }
          }
          break;
        }

        case 'assetInfo': {
          const nameA = (a.assetName || '').trim();
          const nameB = (b.assetName || '').trim();
          comparison = nameA.localeCompare(nameB, 'th', { numeric: true, sensitivity: 'base' });
          if (comparison === 0) {
            comparison = (a.assetCode || '').localeCompare(b.assetCode || '', 'th', { numeric: true });
          }
          break;
        }

        case 'borrower': {
          const bA = (a.borrowerName || '').trim();
          const bB = (b.borrowerName || '').trim();
          comparison = bA.localeCompare(bB, 'th', { numeric: true, sensitivity: 'base' });
          if (comparison === 0) {
            comparison = (a.borrowerDepartment || '').localeCompare(b.borrowerDepartment || '', 'th');
          }
          break;
        }

        case 'locationScope': {
          const locA = (a.locationScope || '').trim();
          const locB = (b.locationScope || '').trim();
          comparison = locA.localeCompare(locB, 'th');
          if (comparison === 0) {
            comparison = (a.room || '').localeCompare(b.room || '', 'th', { numeric: true });
          }
          break;
        }

        case 'duration': {
          const dateA = a.expectedReturnDate || a.borrowDate || '';
          const dateB = b.expectedReturnDate || b.borrowDate || '';
          comparison = dateA.localeCompare(dateB);
          if (comparison === 0) {
            comparison = (a.borrowDate || '').localeCompare(b.borrowDate || '');
          }
          break;
        }

        case 'status': {
          const statusOrder: Record<string, number> = {
            OVERDUE: 1,
            BORROWED: 2,
            RETURNED: 3,
          };
          const orderA = statusOrder[a.status] || 99;
          const orderB = statusOrder[b.status] || 99;
          comparison = orderA - orderB;
          if (comparison === 0) {
            comparison = (a.expectedReturnDate || '').localeCompare(b.expectedReturnDate || '');
          }
          break;
        }

        case 'actualReturnDate': {
          const retA = a.actualReturnDate || '';
          const retB = b.actualReturnDate || '';
          if (!retA && retB) comparison = 1;
          else if (retA && !retB) comparison = -1;
          else comparison = retA.localeCompare(retB);
          break;
        }

        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [records, sortField, sortDirection]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(sortedRecords.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = sortedRecords.length > 0 && selectedIds.length === sortedRecords.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < sortedRecords.length;

  const selectedRecords = sortedRecords.filter(r => selectedIds.includes(r.id));

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 font-['Prompt',sans-serif]">
          ยังไม่มีข้อมูลในทะเบียน (0 รายการ)
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          ข้อมูลลำดับ 1-10 ถูกลบออกจากระบบเรียบร้อยแล้ว ท่านสามารถกดปุ่ม "บันทึกใบยืมใหม่" เพื่อเริ่มต้นลงทะเบียนรายการครุภัณฑ์ได้ทันที
        </p>
        <div className="mt-4">
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
          >
            ลงทะเบียนใบยืมใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      
      {/* Batch Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 border-b border-indigo-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-mono font-bold text-[11px]">
              {selectedIds.length}
            </span>
            <span className="font-medium text-indigo-950">
              เลือกเอกสาร {selectedIds.length} รายการ จากทั้งหมด {records.length} รายการ
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onExportSelectedExcel && (
              <button
                onClick={() => onExportSelectedExcel(selectedRecords)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-medium text-emerald-700 bg-white border border-emerald-300 rounded-md hover:bg-emerald-50 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>ส่งออกรายการที่เลือก (.xlsx)</span>
              </button>
            )}

            <button
              onClick={() => onBulkDeleteRequest(selectedIds)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ลบเอกสารที่เลือก ({selectedIds.length})</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-medium tracking-tight">
              <th className="py-3 px-3 text-center w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  title="เลือกเอกสารทั้งหมด"
                />
              </th>
              <th className="py-3 px-2 text-center w-12 font-mono">
                {renderSortHeader('index', 'ลำดับ', 'justify-center')}
              </th>
              <th className="py-3 px-3 min-w-[155px]">
                {renderSortHeader('borrowDocNo', 'เลขที่ใบยืม / วันที่')}
              </th>
              <th className="py-3 px-3 min-w-[145px]">
                {renderSortHeader('receiptParcelNo', 'เลขที่ลงรับพัสดุ')}
              </th>
              <th className="py-3 px-3 min-w-[240px]">
                {renderSortHeader('assetInfo', 'ข้อมูลครุภัณฑ์')}
              </th>
              <th className="py-3 px-3 min-w-[180px]">
                {renderSortHeader('borrower', 'ผู้ยืม / สังกัด')}
              </th>
              <th className="py-3 px-3 min-w-[180px]">
                {renderSortHeader('locationScope', 'สถานที่ (ภายใน/ภายนอกจุฬาฯ)')}
              </th>
              <th className="py-3 px-3 min-w-[165px]">
                {renderSortHeader('duration', 'ระยะเวลายืม-คืน')}
              </th>
              <th className="py-3 px-3 min-w-[140px]">
                {renderSortHeader('status', 'สถานะติดตาม')}
              </th>
              <th className="py-3 px-3 min-w-[130px]">
                {renderSortHeader('actualReturnDate', 'วันที่คืนพัสดุ')}
              </th>
              <th className="py-3 px-3 text-center min-w-[250px]">แก้ไข / ติดตามในระบบ / จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRecords.map((item, index) => {
              const statusMeta = STATUS_META[item.status] || STATUS_META.BORROWED;
              const isOverdue = item.status === 'OVERDUE';
              const isBorrowed = item.status === 'BORROWED';
              const isSelected = selectedIds.includes(item.id);

              return (
                <tr 
                  key={item.id}
                  className={`transition-colors group ${isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50/70' : 'hover:bg-slate-50/70'}`}
                >
                  {/* Selection Checkbox */}
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(item.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>

                  {/* ลำดับ */}
                  <td className="py-3 px-2 text-center font-mono tabular-nums text-slate-400">
                    {index + 1}
                  </td>

                  {/* เลขที่ใบยืม & วันที่เอกสาร */}
                  <td className="py-3 px-3">
                    <div className="font-bold font-mono tabular-nums text-indigo-900 group-hover:text-indigo-600 transition-colors">
                      {item.borrowDocNo}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span className="font-mono tabular-nums">{item.documentDate}</span>
                    </div>
                  </td>

                  {/* เลขที่ลงรับพัสดุ & วันที่ลงรับ */}
                  <td className="py-3 px-3">
                    <div className="font-mono tabular-nums text-slate-800 font-medium">
                      {item.receiptParcelNo || '-'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                      ลงรับ: {item.receiptParcelDate || '-'}
                    </div>
                  </td>

                  {/* ข้อมูลครุภัณฑ์ */}
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-900 line-clamp-2">
                      {item.assetName}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-mono tabular-nums text-indigo-700 bg-indigo-50/80 px-1.5 py-0.5 rounded text-[11px] font-medium border border-indigo-100">
                        {item.assetCode}
                      </span>
                      {item.serialNumber && (
                        <span className="font-mono text-[11px] text-slate-400 truncate max-w-[100px]" title={`S/N: ${item.serialNumber}`}>
                          SN: {item.serialNumber}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[200px]">เจ้าของ: <strong className="text-slate-700 font-medium">{item.ownerDepartment || '-'}</strong></span>
                    </div>

                    {item.additionalAssets && item.additionalAssets.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span 
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                          title={`ครุภัณฑ์เพิ่มเติม:\n${item.additionalAssets.map((a, i) => `${i + 2}. ${a.assetName} (${a.assetCode})`).join('\n')}`}
                        >
                          <Tag className="w-2.5 h-2.5 text-indigo-600" />
                          <span>+อีก {item.additionalAssets.length} รายการ</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          (รวม {1 + item.additionalAssets.length} ชิ้น)
                        </span>
                      </div>
                    )}
                  </td>

                  {/* ผู้ยืม / หน่วยงาน / เบอร์โทร */}
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800">
                      {item.borrowerName}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[170px] mt-0.5">
                      {item.borrowerDepartment}
                    </div>
                    {item.borrowerPhone && (
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.borrowerPhone}</span>
                      </div>
                    )}
                    {(item.borrowerEmail || item.recordedByEmail) && (
                      <div 
                        className="text-[10px] text-indigo-700 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100 truncate max-w-[175px] mt-1 flex items-center gap-1 font-mono"
                        title={`อีเมลผู้ยืม/ผู้บันทึก: ${item.borrowerEmail || item.recordedByEmail}`}
                      >
                        <Mail className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{item.borrowerEmail || item.recordedByEmail}</span>
                      </div>
                    )}
                  </td>

                  {/* สถานที่ (ภายใน/ภายนอกจุฬาฯ) & ห้อง */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        item.locationScope === 'ภายนอกจุฬาฯ'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {item.locationScope === 'ภายนอกจุฬาฯ' ? '🚗 ภายนอกจุฬาฯ' : '🏛️ ภายในจุฬาฯ'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 truncate max-w-[160px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>ห้อง: <strong className="text-slate-800">{item.room}</strong></span>
                    </div>
                    {item.purpose && (
                      <div className="text-[10px] text-slate-400 truncate max-w-[160px] mt-0.5" title={item.purpose}>
                        {item.purpose}
                      </div>
                    )}
                  </td>

                  {/* ระยะเวลายืม-คืน */}
                  <td className="py-3 px-3">
                    <div className="text-xs space-y-0.5">
                      <div className="text-slate-600 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">ยืม:</span>
                        <span className="font-mono tabular-nums">{item.borrowDate}</span>
                      </div>
                      <div className={`flex items-center justify-between font-medium ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                        <span className="text-[11px] text-slate-400">กำหนดคืน:</span>
                        <span className="font-mono tabular-nums">{item.expectedReturnDate}</span>
                      </div>
                    </div>
                  </td>

                  {/* สถานะติดตาม */}
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusMeta.bgClass} ${statusMeta.textClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                      {statusMeta.label}
                    </span>
                    {isOverdue && (
                      <div className="text-[10px] text-rose-600 font-medium mt-1 font-mono">
                        {calculateOverdueDays(item.expectedReturnDate) > 0 
                          ? `เกินกำหนด ${calculateOverdueDays(item.expectedReturnDate)} วัน`
                          : 'พ้นกำหนดคืนแล้ว'}
                      </div>
                    )}
                    {item.systemNotifiedAt && (
                      <div className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>บันทึกติดตามแล้ว</span>
                      </div>
                    )}
                  </td>

                  {/* วันที่คืนพัสดุ (คืนแล้วเสร็จ) */}
                  <td className="py-3 px-3 font-mono tabular-nums text-xs">
                    {item.actualReturnDate ? (
                      <div>
                        <span className="text-emerald-700 font-medium">{item.actualReturnDate}</span>
                        {item.receiverName && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[110px]" title={item.receiverName}>
                            ผู้รับ: {item.receiverName}
                          </div>
                        )}
                        {item.returnPdfFile && onOpenPdfViewer && (
                          <button
                            type="button"
                            onClick={() => onOpenPdfViewer(item.returnPdfFile!, item.returnPdfName, item.returnPdfSize, item.returnPdfUploadedAt, `${item.borrowDocNo} - ${item.assetName}`)}
                            className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                            title={`คลิกเปิดดูไฟล์แนบ: ${item.returnPdfName || 'เอกสารคืนแล้วเสร็จ.pdf'}`}
                          >
                            <FileText className="w-3 h-3 text-rose-600 shrink-0" />
                            <span className="truncate max-w-[75px]">{item.returnPdfName ? item.returnPdfName.replace(/\.pdf$/i, '') : 'เอกสารคืน'}</span>
                            <span className="text-[9px] font-bold text-rose-500">.PDF</span>
                          </button>
                        )}
                      </div>
                    ) : isOverdue ? (
                      <div>
                        <span className="text-rose-600 font-medium text-[11px] block">ยังไม่ส่งมอบคืน</span>
                        <span className="text-[10px] text-rose-500/80">(เลยกำหนดคืน)</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">ยังไม่ส่งคืน</span>
                    )}
                  </td>

                  {/* คอลัมน์จัดการ: แก้ไข, ลบ, รับคืน, พิมพ์, แจ้งเตือนระบบ */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      
                      {/* ปุ่มแจ้งเตือนติดตามในระบบ หากเกินกำหนดหรือยังอยู่ระหว่างการยืม */}
                      {(isOverdue || isBorrowed) && onOpenNotificationModal && (
                        <button
                          onClick={() => onOpenNotificationModal(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                            isOverdue 
                              ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200' 
                              : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                          }`}
                          title="เปิดระบบแจ้งเตือนและบันทึกติดตามพัสดุในระบบ"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>แจ้งเตือนระบบ</span>
                        </button>
                      )}

                      {/* ปุ่มแก้ไข */}
                      <button
                        onClick={() => onEdit(item)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-md transition-colors"
                        title="คลิกเพื่อแก้ไขข้อมูลเอกสารนี้"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>แก้ไข</span>
                      </button>

                      {/* ปุ่มลบ */}
                      <button
                        onClick={() => onDeleteRequest(item)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors"
                        title="คลิกเพื่อลบเอกสารใบยืมนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบ</span>
                      </button>

                      {/* ดูรายละเอียด */}
                      <button
                        onClick={() => onView(item)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                        title="ดูรายละเอียดข้อมูลทั้งหมด"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* รับคืนพัสดุ */}
                      {!item.actualReturnDate && (
                        <button
                          onClick={() => onQuickReturn(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                          title="บันทึกรับคืนพัสดุ"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>รับคืน</span>
                        </button>
                      )}

                      {/* พิมพ์ใบยืม-คืน */}
                      <button
                        onClick={() => onPrintSlip(item)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                        title="พิมพ์ใบยืม-คืนทางการ (000/2570)"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
