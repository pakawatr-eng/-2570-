export type AssetStatus = 
  | 'BORROWED'     // กำลังยืม (On Loan)
  | 'RETURNED'     // ส่งคืนแล้ว (Returned)
  | 'OVERDUE';     // เกินกำหนดส่งคืน (Overdue)

export type LocationScope = 'ภายในจุฬาฯ' | 'ภายนอกจุฬาฯ';

export interface AdditionalAssetItem {
  id: string;
  assetName: string;          // ชื่อครุภัณฑ์
  assetCode: string;          // รหัสครุภัณฑ์ (Asset Code)
  serialNumber?: string;      // หมายเลขเครื่อง (Serial Number)
  room?: string;              // ห้อง
}

export interface AssetLoanRecord {
  id: string; // Unique internal ID
  
  // 1. เลขที่ & วันที่เอกสาร
  borrowDocNo: string;        // เลขที่ใบยืม (เช่น "001/2570")
  documentDate: string;       // วันที่เอกสาร (YYYY-MM-DD)
  
  // 2. เลขที่ลงรับพัสดุ (มีฟีเจอร์ เลขที่ และ วันที่)
  receiptParcelNo: string;    // เลขที่ลงรับพัสดุ (เช่น "พส.69/1245")
  receiptParcelDate: string;  // วันที่ลงรับพัสดุ
  
  // 3. ข้อมูลผู้ยืม
  borrowerName: string;       // ชื่อผู้ยืม
  borrowerDepartment: string; // หน่วยงานผู้ยืม
  borrowerPhone: string;      // เบอร์โทรศัพท์ติดต่อ
  borrowerEmail?: string;     // อีเมลผู้ยืม/ผู้ใช้งาน (เช่น user@gmail.com หรือ chula.ac.th)
  recordedByEmail?: string;   // อีเมลของผู้บันทึกข้อมูลเข้าระบบ
  
  // 4. ข้อมูลครุภัณฑ์
  assetName: string;          // ชื่อครุภัณฑ์ (รายการหลักที่ 1)
  assetCode: string;          // รหัสครุภัณฑ์ (Asset Code เช่น 7440-001-0012/70)
  serialNumber: string;       // หมายเลขเครื่อง (Serial Number)
  room: string;               // ห้อง (ห้องใช้งาน/ห้องจัดเก็บ)
  ownerDepartment: string;    // หน่วยงานเจ้าของครุภัณฑ์ (ค่าตั้งต้น: "หน่วยพัสดุ")
  additionalAssets?: AdditionalAssetItem[]; // ครุภัณฑ์รายการอื่นเพิ่มเติม (ไม่บังคับ)
  
  // 5. ระยะเวลาการยืม-คืน
  borrowDate: string;         // วันที่ยืม
  expectedReturnDate: string; // วันที่กำหนดคืน
  
  // 6. สถานที่ยืมไปใช้งาน (ขอบเขต & วัตถุประสงค์)
  locationScope: LocationScope; // ภายในจุฬาฯ / ภายนอกจุฬาฯ
  purpose: string;            // วัตถุประสงค์การใช้งาน
  
  // 7. สถานะติดตามครุภัณฑ์
  status: AssetStatus;        // สถานะติดตามครุภัณฑ์: BORROWED | RETURNED | OVERDUE
  
  // 8. วันที่คืนพัสดุ & ข้อมูลการส่งคืน (คืนแล้วเสร็จ)
  actualReturnDate: string;   // วันที่ส่งคืนจริง
  returnCondition: string;    // สภาพเมื่อส่งคืน
  receiverName: string;       // เจ้าหน้าที่ผู้ตรวจรับมอบคืน
  returnPdfFile?: string;     // แนบไฟล์ .pdf เมื่อคืนแล้วเสร็จ (ไม่บังคับ)
  returnPdfName?: string;     // ชื่อไฟล์ .pdf
  returnPdfSize?: number;     // ขนาดไฟล์ .pdf (bytes)
  returnPdfUploadedAt?: string; // วันที่และเวลาที่แนบไฟล์ (ISO String)
  
  // 9. การแจ้งเตือนและติดตามผ่านระบบ
  systemNotifiedAt?: string;  // วันที่และเวลาที่บันทึกแจ้งเตือน/ติดตามในระบบล่าสุด
  followUpNotes?: string;     // บันทึกผลการติดตามในระบบ (เช่น ติดต่อผู้ยืมแล้ว, อยู่ระหว่างนำส่งคืน)
  
  // หมายเหตุ
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_META: Record<AssetStatus, { label: string; textClass: string; bgClass: string; dotClass: string }> = {
  BORROWED: {
    label: 'กำลังยืม',
    textClass: 'text-amber-700 dark:text-amber-300',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    dotClass: 'bg-amber-500',
  },
  RETURNED: {
    label: 'ส่งคืนแล้ว',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  OVERDUE: {
    label: 'เกินกำหนดส่งคืน',
    textClass: 'text-rose-700 dark:text-rose-300',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
    dotClass: 'bg-rose-500',
  },
};
