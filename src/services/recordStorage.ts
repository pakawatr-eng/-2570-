/**
 * บริการจัดเก็บและซิงค์ข้อมูลทะเบียนครุภัณฑ์ (Data Persistence & Sync Service)
 * รองรับการบันทึกข้อมูลให้เป็นปัจจุบันทันทีหลังแก้ไขหรือเพิ่มข้อมูลใหม่
 * โดยบันทึกคู่ขนานทั้งใน LocalStorage (Client cache) และ Server API (/api/records)
 */

import { AssetLoanRecord } from '../types/asset';
import { INITIAL_ASSET_RECORDS } from '../data/initialData';
import { resolveAssetStatus } from '../utils/notifications';

export const STORAGE_KEY = 'asset_loan_records_2570_current_v15';
export const LAST_SAVED_TIME_KEY = 'asset_loan_last_saved_time_v15';

export function sanitizeRecord(r: any): AssetLoanRecord {
  const status = resolveAssetStatus(r.expectedReturnDate, r.actualReturnDate);
  return {
    ...r,
    status,
    systemNotifiedAt: r.systemNotifiedAt || r.lastNotifiedAt || '',
    followUpNotes: r.followUpNotes || '',
    returnPdfFile: r.returnPdfFile || undefined,
    returnPdfName: r.returnPdfName || undefined,
    returnPdfSize: r.returnPdfSize || undefined,
    returnPdfUploadedAt: r.returnPdfUploadedAt || undefined,
    additionalAssets: Array.isArray(r.additionalAssets) ? r.additionalAssets : [],
    borrowerEmail: r.borrowerEmail || '',
    recordedByEmail: r.recordedByEmail || '',
    createdAt: r.createdAt || new Date().toISOString(),
    updatedAt: r.updatedAt || new Date().toISOString(),
  };
}

export interface SaveResult {
  success: boolean;
  savedAt: string;
  source: 'server' | 'local';
}

/**
 * ดึงข้อมูลตั้งต้นจาก LocalStorage หรือ Initial Data
 */
export function getInitialLocalRecords(): AssetLoanRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map(sanitizeRecord);
      }
    }
  } catch (e) {
    console.error('Failed to load local cached records:', e);
  }
  return INITIAL_ASSET_RECORDS.map(sanitizeRecord);
}

/**
 * โหลดข้อมูลล่าสุดจาก Server API
 */
export async function loadRecordsFromServer(): Promise<AssetLoanRecord[] | null> {
  try {
    const res = await fetch('/api/records', {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.records)) {
        if (data.records.length > 0) {
          const sanitized = data.records.map(sanitizeRecord);
          // Sync to local cache
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
            if (data.savedAt) {
              localStorage.setItem(LAST_SAVED_TIME_KEY, data.savedAt);
            }
          } catch {
            // ignore storage quota error
          }
          return sanitized;
        } else {
          // กรณี Server ยังเป็นค่าว่าง แต่ในเครื่องผู้ใช้มีข้อมูลที่บันทึกไว้ ให้ใช้ข้อมูลปัจจุบันของผู้ใช้และอัพเดทขึ้นเซิร์ฟเวอร์
          const local = getInitialLocalRecords();
          if (local.length > 0) {
            persistRecords(local).catch(() => {});
            return local;
          }
          return [];
        }
      }
    }
  } catch (err) {
    // API not reachable or offline; gracefully fallback
    console.warn('Backend /api/records not available, using client storage:', err);
  }
  return null;
}

/**
 * บันทึกข้อมูลให้เป็นปัจจุบันทันทีหลังแก้ไขหรือเพิ่มข้อมูล
 * อัพเดททั้ง LocalStorage และส่งบันทึกลง Server API
 */
export async function persistRecords(records: AssetLoanRecord[]): Promise<SaveResult> {
  const nowIso = new Date().toISOString();
  const sanitized = records.map(sanitizeRecord);

  // 1. บันทึกลง LocalStorage ทันที
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    localStorage.setItem(LAST_SAVED_TIME_KEY, nowIso);
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }

  // 2. บันทึกลง Server API
  try {
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: sanitized,
        savedAt: nowIso,
      }),
    });

    if (res.ok) {
      const result = await res.json();
      return {
        success: true,
        savedAt: result.savedAt || nowIso,
        source: 'server',
      };
    }
  } catch (err) {
    console.warn('Failed to persist to server, cached locally:', err);
  }

  return {
    success: true,
    savedAt: nowIso,
    source: 'local',
  };
}

/**
 * บันทึกหรืออัปเดตใบยืม 1 รายการโดยตรงเข้าสู่ฐานข้อมูลหลักของ Server
 * ป้องกันการเขียนทับรายการอื่นเมื่อมีผู้ใช้งานหลายคนส่งข้อมูลพร้อมกัน
 */
export async function submitSingleRecord(record: AssetLoanRecord): Promise<SaveResult> {
  const nowIso = new Date().toISOString();
  const sanitized = sanitizeRecord(record);

  // 1. บันทึกสำรองลง LocalStorage ทันที
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: AssetLoanRecord[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(r => r.id === sanitized.id || (sanitized.borrowDocNo && r.borrowDocNo === sanitized.borrowDocNo));
    if (idx >= 0) {
      list[idx] = sanitized;
    } else {
      list.unshift(sanitized);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    localStorage.setItem(LAST_SAVED_TIME_KEY, nowIso);
  } catch (e) {
    console.error('Failed to save record to localStorage:', e);
  }

  // 2. ส่งตรงเข้าฐานข้อมูลหลักบน Server API
  try {
    const res = await fetch('/api/records/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        record: sanitized,
      }),
    });

    if (res.ok) {
      const result = await res.json();
      return {
        success: true,
        savedAt: result.savedAt || nowIso,
        source: 'server',
      };
    }
  } catch (err) {
    console.warn('Failed to submit single record to server API:', err);
  }

  return {
    success: true,
    savedAt: nowIso,
    source: 'local',
  };
}

/**
 * ลบรายการที่ระบุออกจากฐานข้อมูล Server เพื่อให้ผู้ใช้งานทุกคนเห็นผลการลบพร้อมกัน
 */
export async function deleteRecordsFromServer(ids: string[]): Promise<boolean> {
  try {
    const res = await fetch('/api/records/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to delete records from server:', err);
    return false;
  }
}

/**
 * ฟอร์แมตเวลาบันทึกล่าสุดให้อ่านเข้าใจง่าย
 */
export function formatSaveTime(isoString?: string | null): string {
  if (!isoString) {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;
  }
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'เมื่อสักครู่';
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')} น.`;
  } catch {
    return 'เมื่อสักครู่';
  }
}
