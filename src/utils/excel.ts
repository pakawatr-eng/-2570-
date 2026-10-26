import * as XLSX from 'xlsx';
import { AssetLoanRecord, STATUS_META } from '../types/asset';
import { resolveAssetStatus } from './notifications';

export function exportRecordsToExcel(records: AssetLoanRecord[], filename = 'ทะเบียนคุมใบยืมและคืน_ครุภัณฑ์_ปี2570.xlsx') {
  // Convert records to Thai columns
  const dataRows = records.map((r, index) => ({
    'ลำดับ': index + 1,
    'เลขที่ใบยืม': r.borrowDocNo || '-',
    'วันที่เอกสาร': r.documentDate || '-',
    'เลขที่ลงรับพัสดุ': r.receiptParcelNo || '-',
    'วันที่ลงรับพัสดุ': r.receiptParcelDate || '-',
    'ชื่อผู้ยืม': r.borrowerName || '-',
    'หน่วยงานผู้ยืม': r.borrowerDepartment || '-',
    'เบอร์โทรศัพท์ติดต่อ': r.borrowerPhone || '-',
    'ชื่อครุภัณฑ์': r.assetName || '-',
    'รหัสครุภัณฑ์ (Asset Code)': r.assetCode || '-',
    'หมายเลขเครื่อง (Serial Number)': r.serialNumber || '-',
    'ห้อง (ใช้งาน/จัดเก็บ)': r.room || '-',
    'ครุภัณฑ์รายการอื่นเพิ่มเติม': r.additionalAssets && r.additionalAssets.length > 0 
      ? r.additionalAssets.map((a, i) => `${i + 2}) ${a.assetName} [${a.assetCode}${a.serialNumber ? `, SN: ${a.serialNumber}` : ''}${a.room ? `, ห้อง: ${a.room}` : ''}]`).join('; ')
      : '-',
    'วันที่ยืม': r.borrowDate || '-',
    'วันที่กำหนดคืน': r.expectedReturnDate || '-',
    'ขอบเขตสถานที่': r.locationScope || '-',
    'วัตถุประสงค์การใช้งาน': r.purpose || '-',
    'หน่วยงานเจ้าของครุภัณฑ์': r.ownerDepartment || 'หน่วยพัสดุ',
    'สถานะติดตามครุภัณฑ์': STATUS_META[r.status]?.label || r.status,
    'วันที่คืนพัสดุ (ส่งคืนจริง)': r.actualReturnDate || '-',
    'สภาพเมื่อส่งคืน': r.returnCondition || '-',
    'เจ้าหน้าที่ผู้ตรวจรับมอบคืน': r.receiverName || '-',
    'เอกสารคืนแล้วเสร็จ (.pdf)': r.returnPdfName ? `${r.returnPdfName} (แนบแล้ว)` : '-',
    'ประวัติการติดตามในระบบ': r.systemNotifiedAt ? new Date(r.systemNotifiedAt).toLocaleDateString('th-TH') : 'ยังไม่เคยบันทึกติดตาม',
    'ผลการติดตามในระบบ': r.followUpNotes || '-',
    'หมายเหตุ': r.remarks || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Set column widths based on longest string
  const colWidths = Object.keys(dataRows[0] || {}).map((key) => {
    let maxLen = key.length;
    dataRows.forEach((row) => {
      const val = String((row as Record<string, unknown>)[key] || '');
      if (val.length > maxLen) {
        maxLen = val.length;
      }
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
  });

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ทะเบียนคุมใบยืม-คืน 2570');

  // Summary Sheet
  const statusCounts = records.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const insideCount = records.filter(r => r.locationScope === 'ภายในจุฬาฯ').length;
  const outsideCount = records.filter(r => r.locationScope === 'ภายนอกจุฬาฯ').length;

  const summaryRows = [
    { 'ข้อมูลสรุปภาพรวม': 'ทะเบียนคุมใบยืมและคืน (ครุภัณฑ์ ปีงบประมาณ 2570)', 'จำนวน (รายการ)': '' },
    { 'ข้อมูลสรุปภาพรวม': 'รายการยืม-คืนทั้งหมด', 'จำนวน (รายการ)': records.length },
    { 'ข้อมูลสรุปภาพรวม': 'กำลังยืมใช้งาน (On Loan)', 'จำนวน (รายการ)': statusCounts['BORROWED'] || 0 },
    { 'ข้อมูลสรุปภาพรวม': 'ส่งคืนแล้วเรียบร้อย (Returned)', 'จำนวน (รายการ)': statusCounts['RETURNED'] || 0 },
    { 'ข้อมูลสรุปภาพรวม': 'เกินกำหนดส่งคืน (Overdue)', 'จำนวน (รายการ)': statusCounts['OVERDUE'] || 0 },
    { 'ข้อมูลสรุปภาพรวม': 'ยืมใช้งานภายในจุฬาฯ', 'จำนวน (รายการ)': insideCount },
    { 'ข้อมูลสรุปภาพรวม': 'ยืมใช้งานภายนอกจุฬาฯ', 'จำนวน (รายการ)': outsideCount },
    { 'ข้อมูลสรุปภาพรวม': 'หน่วยงานเจ้าของครุภัณฑ์', 'จำนวน (รายการ)': 'หน่วยพัสดุ' },
    { 'ข้อมูลสรุปภาพรวม': 'วันที่ส่งออกข้อมูล', 'จำนวน (รายการ)': new Date().toLocaleDateString('th-TH') },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 45 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'รายงานสรุปภาพรวม');

  XLSX.writeFile(workbook, filename);
}

export function parseExcelToRecords(file: File): Promise<AssetLoanRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        const records: AssetLoanRecord[] = json.map((row, i) => {
          const statusText = String(row['สถานะติดตามครุภัณฑ์'] || '').trim();
          let status: AssetLoanRecord['status'] = 'BORROWED';
          if (statusText.includes('คืนแล้ว')) status = 'RETURNED';
          else if (statusText.includes('เกิน')) status = 'OVERDUE';

          const scopeText = String(row['ขอบเขตสถานที่'] || '');
          const locationScope = scopeText.includes('ภายนอก') ? 'ภายนอกจุฬาฯ' : 'ภายในจุฬาฯ';

          return {
            id: `imported-${Date.now()}-${i}`,
            borrowDocNo: String(row['เลขที่ใบยืม'] || `${String(i + 1).padStart(3, '0')}/2570`),
            documentDate: String(row['วันที่เอกสาร'] || new Date().toISOString().slice(0, 10)),
            receiptParcelNo: String(row['เลขที่ลงรับพัสดุ'] || '-'),
            receiptParcelDate: String(row['วันที่ลงรับพัสดุ'] || '-'),
            borrowerName: String(row['ชื่อผู้ยืม'] || '-'),
            borrowerDepartment: String(row['หน่วยงานผู้ยืม'] || '-'),
            borrowerPhone: String(row['เบอร์โทรศัพท์ติดต่อ'] || row['เบอร์โทรศัพท์'] || ''),
            assetName: String(row['ชื่อครุภัณฑ์'] || '-'),
            assetCode: String(row['รหัสครุภัณฑ์ (Asset Code)'] || row['รหัสครุภัณฑ์'] || '-'),
            serialNumber: String(row['หมายเลขเครื่อง (Serial Number)'] || row['Serial Number'] || ''),
            room: String(row['ห้อง (ใช้งาน/จัดเก็บ)'] || row['ห้อง'] || '-'),
            borrowDate: String(row['วันที่ยืม'] || new Date().toISOString().slice(0, 10)),
            expectedReturnDate: String(row['วันที่กำหนดคืน'] || ''),
            locationScope: locationScope,
            purpose: String(row['วัตถุประสงค์การใช้งาน'] || row['วัตถุประสงค์'] || ''),
            ownerDepartment: String(row['หน่วยงานเจ้าของครุภัณฑ์'] || 'หน่วยพัสดุ'),
            status: resolveAssetStatus(
              String(row['วันที่กำหนดคืน'] || ''),
              String(row['วันที่คืนพัสดุ (ส่งคืนจริง)'] || row['วันที่คืนพัสดุ'] || '')
            ),
            actualReturnDate: String(row['วันที่คืนพัสดุ (ส่งคืนจริง)'] || row['วันที่คืนพัสดุ'] || ''),
            returnCondition: String(row['สภาพเมื่อส่งคืน'] || ''),
            receiverName: String(row['เจ้าหน้าที่ผู้ตรวจรับมอบคืน'] || row['ผู้รับคืน'] || ''),
            systemNotifiedAt: String(row['ประวัติการติดตามในระบบ'] || ''),
            followUpNotes: String(row['ผลการติดตามในระบบ'] || ''),
            remarks: String(row['หมายเหตุ'] || ''),
            additionalAssets: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });

        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
