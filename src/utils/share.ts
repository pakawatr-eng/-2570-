import { AssetLoanRecord } from '../types/asset';

// 1. สร้างลิงก์แบบฟอร์มเพื่อให้ผู้ใช้งานท่านอื่น (ผู้ขอยืม/เจ้าหน้าที่) เข้ามากรอกบันทึกใบยืมได้โดยตรง
export function getBorrowFormUrl(): string {
  try {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('action', 'new-borrow');
    return url.toString();
  } catch (e) {
    console.error('Failed to get borrow form url', e);
    return window.location.href;
  }
}

// 2. เข้ารหัสรายการทั้งหมดเพื่อส่งต่อฐานข้อมูล (Handover / Backup)
export function encodeRecordsToShareUrl(records: AssetLoanRecord[]): string {
  try {
    const jsonStr = JSON.stringify(records);
    const encoded = btoa(encodeURIComponent(jsonStr));
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('data', encoded);
    return url.toString();
  } catch (e) {
    console.error('Failed to encode records', e);
    return window.location.href;
  }
}

// 3. ถอดรหัสฐานข้อมูลจาก URL search params
export function decodeRecordsFromShareUrl(): AssetLoanRecord[] | null {
  try {
    const url = new URL(window.location.href);
    const data = url.searchParams.get('data');
    if (!data) return null;
    const jsonStr = decodeURIComponent(atob(data));
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as AssetLoanRecord[];
    }
  } catch (e) {
    console.error('Failed to decode share url data', e);
  }
  return null;
}

// 4. เข้ารหัสรายการเดียว เพื่อให้ผู้ใช้งานส่งข้อมูลใบยืมที่เพิ่งบันทึกกลับมาให้เจ้าหน้าที่พัสดุ
export function encodeSingleRecordShareUrl(record: AssetLoanRecord): string {
  try {
    const jsonStr = JSON.stringify(record);
    const encoded = btoa(encodeURIComponent(jsonStr));
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('appendRecord', encoded);
    return url.toString();
  } catch (e) {
    console.error('Failed to encode single record', e);
    return window.location.href;
  }
}

// 5. ถอดรหัสรายการเดี่ยวจาก URL search params เมื่อเจ้าหน้าที่เปิดลิงก์ที่ผู้ใช้ส่งกลับมา
export function decodeSingleRecordFromUrl(): AssetLoanRecord | null {
  try {
    const url = new URL(window.location.href);
    const data = url.searchParams.get('appendRecord');
    if (!data) return null;
    const jsonStr = decodeURIComponent(atob(data));
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object' && parsed.borrowDocNo) {
      return parsed as AssetLoanRecord;
    }
  } catch (e) {
    console.error('Failed to decode single record url', e);
  }
  return null;
}

// 6. ตรวจสอบว่าเปิดด้วยลิงก์ขอยืมพัสดุหรือไม่ (?action=new-borrow หรือ ?action=new)
export function isBorrowFormActionInUrl(): boolean {
  try {
    const url = new URL(window.location.href);
    const action = url.searchParams.get('action');
    return action === 'new-borrow' || action === 'new';
  } catch {
    return false;
  }
}

// 7. ล้าง query parameter ออกจากเบราว์เซอร์อย่างปลอดภัยหลังจากนำเข้า/บันทึกแล้ว
// เพื่อไม่ให้การกดรีเฟรชหน้า (F5) ไปเขียนทับข้อมูลใหม่ที่ผู้ใช้เพิ่งบันทึกลงไป
export function cleanUrlParams(): void {
  try {
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  } catch (e) {
    console.error('Failed to clean url params', e);
  }
}

// 8. สร้างลิงก์สำหรับส่งต่อผ่าน LINE โดยตรง
export function generateLineShareUrl(text: string): string {
  return `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
}

// 9. ข้อความเชิญชวนส่งให้ผู้ใช้งานท่านอื่นกรอกบันทึกใบยืม
export function generateBorrowFormInviteText(formUrl: string): string {
  return `📋 แบบฟอร์มบันทึกขอยืมพัสดุและครุภัณฑ์ (ปี 2570)\n` +
    `หน่วยพัสดุ จุฬาลงกรณ์มหาวิทยาลัย (ผู้ดูแลระบบ: pakawat.day@gmail.com)\n` +
    `-------------------------------------------\n` +
    `ขอเชิญท่านเข้ากรอกและบันทึกข้อมูลการยืมพัสดุผ่านระบบออนไลน์ได้ที่ลิงก์นี้:\n` +
    `${formUrl}\n\n` +
    `✨ ข้อมูลที่ท่านกรอกจะถูกเชื่อมโยงและบันทึกส่งตรงเข้าสู่ฐานข้อมูลหลักของผู้ดูแล (pakawat.day@gmail.com) โดยอัตโนมัติ`;
}

// 10. ข้อความสำหรับผู้ใช้ส่งข้อมูลที่เพิ่งบันทึกกลับมาให้เจ้าหน้าที่พัสดุ
export function generateNewRecordConfirmationText(record: AssetLoanRecord, returnUrl: string): string {
  return `📄 แจ้งการบันทึกข้อมูลขอยืมพัสดุ/ครุภัณฑ์ (ปี 2570)\n` +
    `เชื่อมโยงเข้าฐานข้อมูลหลักของผู้ดูแล: pakawat.day@gmail.com\n` +
    `เลขที่ใบยืม: ${record.borrowDocNo}\n` +
    `ผู้ยืม: ${record.borrowerName} (${record.borrowerDepartment || '-'})\n` +
    `ครุภัณฑ์: ${record.assetName} [${record.assetCode}]\n` +
    `กำหนดส่งคืน: ${record.expectedReturnDate || '-'}\n` +
    `สถานที่ใช้งาน: ${record.room ? 'ห้อง ' + record.room : record.locationScope}\n` +
    `-------------------------------------------\n` +
    `ตรวจสอบรายการในระบบทะเบียนคุม:\n` +
    `${returnUrl}`;
}

// Export JSON file for backup / handoff
export function exportRecordsToJsonFile(records: AssetLoanRecord[], filename = 'ทะเบียนคุมใบยืมคืน_2570_สำรองข้อมูล.json') {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Generate formatted Thai text summary for instant messenger/email handover
export function generateHandoverText(records: AssetLoanRecord[]): string {
  const activeLoans = records.filter(r => r.status === 'BORROWED' || r.status === 'OVERDUE');
  const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  let text = `📋 รายงานสรุปส่งต่องาน ทะเบียนคุมใบยืมและคืน (ครุภัณฑ์ ปี 2570)\n`;
  text += `ประจำวันที่: ${dateStr}\n`;
  text += `-------------------------------------------\n`;
  text += `จำนวนรายการทั้งหมดในระบบ: ${records.length} รายการ\n`;
  text += `ครุภัณฑ์ที่อยู่ระหว่างการยืม: ${activeLoans.length} รายการ\n\n`;
  
  text += `รายการที่ต้องติดตามเร่งด่วน/คงค้าง:\n`;
  activeLoans.forEach((r, idx) => {
    text += `${idx + 1}. [${r.borrowDocNo}] ${r.assetName} (${r.assetCode})\n`;
    text += `   - ผู้ยืม: ${r.borrowerName} (${r.borrowerDepartment})\n`;
    text += `   - กำหนดคืน: ${r.expectedReturnDate} | ห้อง: ${r.room}\n`;
    text += `   - สถานะ: ${r.status === 'OVERDUE' ? '⚠️ เกินกำหนดคืน' : 'กำลังใช้งาน'}\n`;
  });

  text += `-------------------------------------------\n`;
  text += `ระบบทะเบียนคุมใบยืมและคืนครุภัณฑ์ ปี 2570`;
  return text;
}
