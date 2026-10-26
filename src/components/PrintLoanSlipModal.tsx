import React from 'react';
import { AssetLoanRecord, STATUS_META } from '../types/asset';
import { X, Printer } from 'lucide-react';

interface PrintLoanSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AssetLoanRecord | null;
}

export const PrintLoanSlipModal: React.FC<PrintLoanSlipModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const statusMeta = STATUS_META[record.status] || STATUS_META.BORROWED;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden print:border-none print:shadow-none print:max-w-none">
        
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-slate-800 font-['Prompt',sans-serif]">
              แบบฟอร์มใบยืม-คืนพัสดุและครุภัณฑ์ (ปีงบประมาณ 2570)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์เอกสาร (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-8 sm:p-12 font-['Sarabun',sans-serif] text-slate-900 space-y-6 max-h-[82vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          
          {/* Slip Header */}
          <div className="text-center space-y-1 border-b border-slate-800 pb-4">
            <div className="text-lg sm:text-xl font-bold tracking-tight">
              ใบยืม - คืนพัสดุและครุภัณฑ์
            </div>
            <div className="text-sm font-semibold text-slate-700">
              ทะเบียนคุมครุภัณฑ์ ประจำปีงบประมาณ พ.ศ. 2570
            </div>
            <div className="text-xs text-slate-500 pt-1 flex items-center justify-between">
              <span>เลขที่ใบยืม: <strong className="font-mono font-bold text-slate-900">{record.borrowDocNo}</strong></span>
              <span>เลขที่ลงรับพัสดุ: <strong className="font-mono">{record.receiptParcelNo}</strong> (ลงวันที่ {record.receiptParcelDate})</span>
              <span>วันที่เอกสาร: <strong className="font-mono">{record.documentDate}</strong></span>
            </div>
          </div>

          {/* Borrower Information */}
          <div className="text-sm space-y-2">
            <p className="leading-relaxed">
              ข้าพเจ้า <span className="font-semibold underline underline-offset-4">{record.borrowerName}</span> 
              &nbsp;สังกัด/หน่วยงาน <span className="font-semibold underline underline-offset-4">{record.borrowerDepartment}</span>
              &nbsp;เบอร์โทรศัพท์ติดต่อ <span className="font-mono">{record.borrowerPhone || '-'}</span>
              {(record.borrowerEmail || record.recordedByEmail) && (
                <span>&nbsp;อีเมล <span className="font-mono">{record.borrowerEmail || record.recordedByEmail}</span></span>
              )}
            </p>
            <p className="leading-relaxed">
              มีความประสงค์ขอยืมพัสดุ/ครุภัณฑ์ของ <span className="font-semibold">{record.ownerDepartment || 'หน่วยพัสดุ'}</span> 
              &nbsp;เพื่อนำไปใช้ในการปฏิบัติงาน ({record.locationScope || 'ภายในจุฬาฯ'}) (ห้อง: {record.room})
            </p>
            {record.purpose && (
              <p className="text-xs text-slate-700">
                <strong>วัตถุประสงค์การใช้งาน:</strong> {record.purpose}
              </p>
            )}
            <p className="leading-relaxed">
              กำหนดระยะเวลาการยืม ตั้งแต่วันที่ <span className="font-mono font-semibold">{record.borrowDate}</span> 
              &nbsp;ถึงวันที่ <span className="font-mono font-semibold">{record.expectedReturnDate}</span>
            </p>
          </div>

          {/* Items Table */}
          <div className="border border-slate-800 rounded-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-800 font-semibold text-slate-800">
                  <th className="py-2 px-3 text-center border-r border-slate-800 w-12">ลำดับ</th>
                  <th className="py-2 px-3 border-r border-slate-800">รายการครุภัณฑ์</th>
                  <th className="py-2 px-3 border-r border-slate-800">หมายเลข/รหัสครุภัณฑ์ (Asset Code)</th>
                  <th className="py-2 px-3 border-r border-slate-800">หมายเลขเครื่อง (Serial Number)</th>
                  <th className="py-2 px-3 text-center w-20">จำนวน</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="py-2 px-3 text-center border-r border-slate-800 font-mono">1</td>
                  <td className="py-2 px-3 border-r border-slate-800 font-medium">
                    {record.assetName}
                    {record.remarks && <div className="text-[11px] text-slate-600 mt-0.5">({record.remarks})</div>}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-800 font-mono">{record.assetCode}</td>
                  <td className="py-2 px-3 border-r border-slate-800 font-mono">{record.serialNumber || '-'}</td>
                  <td className="py-2 px-3 text-center font-mono">1 รายการ</td>
                </tr>
                {record.additionalAssets && record.additionalAssets.map((add, idx) => (
                  <tr key={add.id} className="border-b border-slate-300">
                    <td className="py-2 px-3 text-center border-r border-slate-800 font-mono">{idx + 2}</td>
                    <td className="py-2 px-3 border-r border-slate-800 font-medium">
                      {add.assetName}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-800 font-mono">{add.assetCode}</td>
                    <td className="py-2 px-3 border-r border-slate-800 font-mono">{add.serialNumber || '-'}</td>
                    <td className="py-2 px-3 text-center font-mono">1 รายการ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Terms & Conditions */}
          <div className="text-xs text-slate-600 space-y-1 bg-slate-50/50 p-3 rounded border border-dashed border-slate-300">
            <div className="font-semibold text-slate-800">เงื่อนไขและข้อผูกพันในการยืมพัสดุ:</div>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>ผู้ยืมจะต้องดูแลรักษาพัสดุและครุภัณฑ์ให้อยู่ในสภาพเรียบร้อยพร้อมใช้งานอยู่เสมอ</li>
              <li>หากเกิดการสูญหาย ชำรุด หรือเสียหายอันเนื่องมาจากความประมาทเลินเล่อ ผู้ยืมยินยอมชดใช้หรือซ่อมแซมให้อยู่ในสภาพเดิม</li>
              <li>เมื่อเสร็จสิ้นภารกิจหรือครบกำหนดเวลา ผู้ยืมจะนำส่งคืนพัสดุแก่หน่วยพัสดุในสภาพเรียบร้อยทันที</li>
            </ol>
          </div>

          {/* Signatures Area (Borrowing Phase) */}
          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="text-center space-y-6">
              <div className="text-xs font-semibold text-slate-700">ผู้ขอยืมพัสดุ</div>
              <div className="border-b border-dotted border-slate-400 w-48 mx-auto mt-8"></div>
              <div className="text-xs">
                <div>({record.borrowerName})</div>
                <div className="text-slate-500 mt-1">วันที่ ......./......./.......</div>
              </div>
            </div>

            <div className="text-center space-y-6">
              <div className="text-xs font-semibold text-slate-700">ผู้อนุมัติ / เจ้าหน้าที่หน่วยพัสดุ</div>
              <div className="border-b border-dotted border-slate-400 w-48 mx-auto mt-8"></div>
              <div className="text-xs">
                <div>(......................................................)</div>
                <div className="text-slate-500 mt-1">วันที่ ......./......./.......</div>
              </div>
            </div>
          </div>

          {/* Section: Return Phase (เมื่อส่งคืน) */}
          <div className="border-t-2 border-slate-800 pt-4 space-y-4">
            <div className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span>บันทึกการส่งคืนพัสดุ (ส่งคืนแก่หน่วยพัสดุ)</span>
              <span className="text-xs font-normal text-slate-500">
                สถานะปัจจุบัน: <strong className="text-slate-800">{statusMeta.label}</strong>
              </span>
            </div>

            <div className="text-xs space-y-1">
              <p>
                วันที่ส่งคืนพัสดุจริง: <span className="font-mono font-medium underline">{record.actualReturnDate || '.............................................'}</span>
                &nbsp;&nbsp;สภาพเมื่อส่งคืน: <span className="font-medium underline">{record.returnCondition || '......................................................................'}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="text-center space-y-6">
                <div className="text-xs font-semibold text-slate-700">ผู้ส่งคืนพัสดุ</div>
                <div className="border-b border-dotted border-slate-400 w-48 mx-auto mt-8"></div>
                <div className="text-xs">
                  <div>(......................................................)</div>
                  <div className="text-slate-500 mt-1">วันที่ ......./......./.......</div>
                </div>
              </div>

              <div className="text-center space-y-6">
                <div className="text-xs font-semibold text-slate-700">ผู้รับคืน / เจ้าหน้าที่หน่วยพัสดุ</div>
                <div className="border-b border-dotted border-slate-400 w-48 mx-auto mt-8"></div>
                <div className="text-xs">
                  <div>({record.receiverName || '......................................................'})</div>
                  <div className="text-slate-500 mt-1">วันที่ ......./......./.......</div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
