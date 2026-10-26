import { AssetLoanRecord, AssetStatus } from '../types/asset';

/**
 * แปลงสตริงวันที่ (YYYY-MM-DD) เป็น Date Object ในเวลาท้องถิ่นโดยปราศจากปัญหา Timezone UTC Offset
 */
export function parseDateOnly(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * คำนวณจำนวนวันที่เกินกำหนดส่งคืนพัสดุ
 * กำหนดให้หลังวันที่คืนพัสดุ (expectedReturnDate) จะนับเป็นเกินกำหนดส่งคืน (OVERDUE)
 */
export function calculateOverdueDays(expectedReturnDate: string): number {
  const returnDate = parseDateOnly(expectedReturnDate);
  if (!returnDate) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - returnDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * ตรวจสอบว่าพ้นหรือถึงกำหนดส่งคืนแล้วหรือไม่
 */
export function isDueOrOverdue(expectedReturnDate: string): boolean {
  const returnDate = parseDateOnly(expectedReturnDate);
  if (!returnDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today.getTime() >= returnDate.getTime();
}

/**
 * ตรวจสอบว่า "หลัง วันที่คืนพัสดุ" (เลยกำหนดส่งคืน) แล้วหรือไม่
 */
export function isPastExpectedReturnDate(expectedReturnDate: string): boolean {
  const returnDate = parseDateOnly(expectedReturnDate);
  if (!returnDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today.getTime() > returnDate.getTime();
}

/**
 * คำนวณสถานะติดตามพัสดุ/ครุภัณฑ์ตามวันที่คืนพัสดุโดยอัตโนมัติ:
 * 1. หากระบุวันที่ส่งคืนจริง (actualReturnDate) แล้ว -> สถานะคือ 'RETURNED' (ส่งคืนแล้ว)
 * 2. หากยังไม่ได้รับมอบคืน และหลัง "วันที่คืนพัสดุ (กำหนดส่งคืน)" แล้ว -> สถานะจะเปลี่ยนเป็น 'OVERDUE' (เกินกำหนดส่งคืน) โดยอัตโนมัติ
 * 3. หากยังไม่พ้นวันที่คืนพัสดุ -> สถานะคือ 'BORROWED' (กำลังยืม)
 */
export function resolveAssetStatus(
  expectedReturnDate: string,
  actualReturnDate?: string | null
): AssetStatus {
  if (actualReturnDate && actualReturnDate.trim() !== '') {
    return 'RETURNED';
  }
  if (expectedReturnDate && calculateOverdueDays(expectedReturnDate) > 0) {
    return 'OVERDUE';
  }
  return 'BORROWED';
}

/**
 * เรียงลำดับจากน้อยไปหามาก ในช่อง เลขที่ใบยืม/วันที่ จากข้อมูลปัจจุบันเท่านั้น
 * - เปรียบเทียบเลขที่ใบยืม (borrowDocNo) แบบ Natural / Numeric (เช่น 001/2570 -> 002/2570)
 * - หากเลขที่ใบยืมเหมือนกัน ให้เรียงตามวันที่เอกสาร (documentDate) จากน้อยไปหามาก
 */
export function compareBorrowDocNoAndDate(
  a: AssetLoanRecord,
  b: AssetLoanRecord,
  direction: 'asc' | 'desc' = 'asc'
): number {
  const docA = (a.borrowDocNo || '').trim();
  const docB = (b.borrowDocNo || '').trim();

  const docCompare = docA.localeCompare(docB, 'th', { numeric: true, sensitivity: 'base' });
  if (docCompare !== 0) {
    return direction === 'asc' ? docCompare : -docCompare;
  }

  const dateA = (a.documentDate || a.borrowDate || '').trim();
  const dateB = (b.documentDate || b.borrowDate || '').trim();
  const dateCompare = dateA.localeCompare(dateB, 'th', { numeric: true });
  return direction === 'asc' ? dateCompare : -dateCompare;
}

// Format the urgency label
export function getDueStatusLabel(expectedReturnDate: string): {
  label: string;
  isToday: boolean;
  daysOverdue: number;
  badgeClass: string;
} {
  const days = calculateOverdueDays(expectedReturnDate);
  if (days > 0) {
    return {
      label: `เกินกำหนด ${days} วัน`,
      isToday: false,
      daysOverdue: days,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    };
  }

  const returnDate = parseDateOnly(expectedReturnDate);
  if (!returnDate) {
    return {
      label: 'ระบุวันที่คืน',
      isToday: false,
      daysOverdue: 0,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (today.getTime() === returnDate.getTime()) {
    return {
      label: 'ครบกำหนดส่งคืนวันนี้',
      isToday: true,
      daysOverdue: 0,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    };
  }

  return {
    label: 'ยังไม่ถึงกำหนดส่งคืน',
    isToday: false,
    daysOverdue: 0,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}
