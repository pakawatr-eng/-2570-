/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AssetLoanRecord, AssetStatus, LocationScope } from './types/asset';
import { INITIAL_ASSET_RECORDS } from './data/initialData';
import { exportRecordsToExcel } from './utils/excel';
import { 
  decodeRecordsFromShareUrl, 
  decodeSingleRecordFromUrl, 
  isBorrowFormActionInUrl, 
  cleanUrlParams 
} from './utils/share';
import { 
  calculateOverdueDays, 
  isDueOrOverdue, 
  resolveAssetStatus,
  compareBorrowDocNoAndDate
} from './utils/notifications';

import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { FilterBar } from './components/FilterBar';
import { AssetTable } from './components/AssetTable';
import { AssetFormModal } from './components/AssetFormModal';
import { AssetDetailModal } from './components/AssetDetailModal';
import { QuickReturnModal } from './components/QuickReturnModal';
import { PrintLoanSlipModal } from './components/PrintLoanSlipModal';
import { ShareTransferModal } from './components/ShareTransferModal';
import { RecordSuccessModal } from './components/RecordSuccessModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { OverdueAlertBanner } from './components/OverdueAlertBanner';
import { SystemNotificationModal } from './components/SystemNotificationModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { Share2, Link, Database } from 'lucide-react';
import { 
  getInitialLocalRecords, 
  loadRecordsFromServer, 
  persistRecords, 
  submitSingleRecord,
  deleteRecordsFromServer,
  formatSaveTime, 
  STORAGE_KEY,
  LAST_SAVED_TIME_KEY, 
  sanitizeRecord 
} from './services/recordStorage';

export default function App() {
  // State for all records
  const [records, setRecords] = useState<AssetLoanRecord[]>(() => {
    // 1. Check if URL contains shared data payload
    const sharedData = decodeRecordsFromShareUrl();
    if (sharedData && sharedData.length > 0) {
      return sharedData.map(sanitizeRecord);
    }

    // 2. Load from local cached records
    return getInitialLocalRecords();
  });

  // Save status states (แสดงสถานะการบันทึกข้อมูลให้เป็นปัจจุบัน)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => {
    const saved = localStorage.getItem(LAST_SAVED_TIME_KEY);
    return formatSaveTime(saved);
  });



  // Sync กับ Server API เมื่อเริ่มต้น และ Polling ทุก 8 วินาที เพื่อดึงข้อมูลใหม่ที่ผู้ใช้งานคนอื่นกรอกผ่านลิงก์แชร์
  useEffect(() => {
    const syncData = () => {
      loadRecordsFromServer().then((serverRecords) => {
        if (serverRecords !== null) {
          setRecords((prev) => {
            // หาก Server ยังไม่มีข้อมูล แต่ในเครื่องผู้ใช้มีข้อมูลที่บันทึกไว้ ให้ส่งข้อมูลปัจจุบันขึ้น Server ทันที
            if (serverRecords.length === 0 && prev.length > 0) {
              persistRecords(prev).catch(() => {});
              return prev;
            }

            // ตรวจสอบว่ามีรายการใหม่เข้ามาหรือไม่ (เฉพาะเมื่อ server มีข้อมูล)
            if (serverRecords.length > 0 && JSON.stringify(prev) !== JSON.stringify(serverRecords)) {
              if (serverRecords.length > prev.length) {
                const diffCount = serverRecords.length - prev.length;
                showToast(`🔔 มีข้อมูลใบยืมใหม่บันทึกเข้าสู่ฐานข้อมูลหลัก ${diffCount} รายการ`);
              }
              return serverRecords;
            }
            return prev;
          });
          const storedTime = localStorage.getItem(LAST_SAVED_TIME_KEY);
          if (storedTime) {
            setLastSavedTime(formatSaveTime(storedTime));
          }
        }
      });
    };

    // 1. Initial sync
    syncData();

    // 2. Periodic polling every 4 seconds
    const interval = setInterval(syncData, 4000);

    // 3. Sync on window focus
    window.addEventListener('focus', syncData);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', syncData);
    };
  }, []);

  // ซิงค์สถานะติดตามอัตโนมัติตามวันที่คืนพัสดุเมื่อเปิดแอปพลิเคชัน (หลังวันที่กำหนดคืน สถานะเป็น OVERDUE ทันที)
  useEffect(() => {
    setRecords((prev) => {
      let hasChanges = false;
      const updated = prev.map((r) => {
        const correctStatus = resolveAssetStatus(r.expectedReturnDate, r.actualReturnDate);
        if (r.status !== correctStatus) {
          hasChanges = true;
          return { ...r, status: correctStatus };
        }
        return r;
      });
      if (hasChanges) {
        persistRecords(updated).catch(() => {});
      }
      return hasChanges ? updated : prev;
    });
  }, []);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [locationScopeFilter, setLocationScopeFilter] = useState('ALL');

  // Modals visibility
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AssetLoanRecord | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AssetLoanRecord | null>(null);

  const [isQuickReturnOpen, setIsQuickReturnOpen] = useState(false);
  const [quickReturnTarget, setQuickReturnTarget] = useState<AssetLoanRecord | null>(null);

  const [isPrintSlipOpen, setIsPrintSlipOpen] = useState(false);
  const [printTarget, setPrintTarget] = useState<AssetLoanRecord | null>(null);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareInitialTab, setShareInitialTab] = useState<'form' | 'database' | 'files'>('form');

  // Success Confirmation Modal after recording a loan (with share-back options)
  const [lastSavedRecord, setLastSavedRecord] = useState<AssetLoanRecord | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // In-System Notification Modal
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Delete confirmation modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetRecord, setDeleteTargetRecord] = useState<AssetLoanRecord | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);

  // PDF Viewer Modal State
  const [pdfViewerState, setPdfViewerState] = useState<{
    isOpen: boolean;
    dataUrl: string;
    fileName?: string;
    fileSize?: number;
    uploadedAt?: string;
    docTitle?: string;
  }>({
    isOpen: false,
    dataUrl: '',
  });

  const handleOpenPdfViewer = (
    dataUrl: string,
    fileName?: string,
    fileSize?: number,
    uploadedAt?: string,
    docTitle?: string
  ) => {
    setPdfViewerState({
      isOpen: true,
      dataUrl,
      fileName,
      fileSize,
      uploadedAt,
      docTitle,
    });
  };

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ตรวจสอบและประมวลผลกรณีเปิดผ่านลิงก์ที่ผู้ใช้งานคนอื่นส่งมา
  useEffect(() => {
    // 1. กรณีเจ้าหน้าที่เปิดลิงก์ที่ผู้ใช้ส่งกลับมาหลังกรอกบันทึกใบยืม (?appendRecord=...)
    const single = decodeSingleRecordFromUrl();
    if (single) {
      const sanitized = sanitizeRecord(single);
      setRecords((prev) => {
        const exists = prev.some((r) => r.id === sanitized.id || r.borrowDocNo === sanitized.borrowDocNo);
        if (exists) {
          return prev.map((r) => (r.id === sanitized.id || r.borrowDocNo === sanitized.borrowDocNo ? sanitized : r));
        }
        return [sanitized, ...prev];
      });
      showToast(`📥 บันทึกรายการใหม่จากผู้ขอยืมเรียบร้อย: ${sanitized.borrowDocNo} (${sanitized.borrowerName})`);
      cleanUrlParams();
      return;
    }

    // 2. กรณีเปิดด้วยลิงก์ฐานข้อมูลที่ส่งต่อมา (?data=...)
    const sharedData = decodeRecordsFromShareUrl();
    if (sharedData && sharedData.length > 0) {
      cleanUrlParams();
      showToast(`📥 โหลดและบันทึกฐานข้อมูลจากผู้ใช้งานอื่นแล้ว (${sharedData.length} รายการ) พร้อมบันทึกต่อได้ทันที`);
      return;
    }

    // 3. กรณีผู้ใช้เปิดลิงก์สำหรับกรอกแบบฟอร์มใบยืมพัสดุ (?action=new-borrow)
    if (isBorrowFormActionInUrl()) {
      cleanUrlParams();
      setIsFormOpen(true);
      setEditingRecord(null);
      showToast('📝 ยินดีต้อนรับ! กรุณากรอกแบบฟอร์มขอยืมพัสดุและกดปุ่ม "บันทึกข้อมูล"');
    }
  }, []);

  // Compute items that have reached return date or are overdue but not returned
  const dueOrOverdueRecords = useMemo(() => {
    return records.filter((r) => {
      if (r.status === 'RETURNED' || r.actualReturnDate) return false;
      if (r.status === 'OVERDUE') return true;
      return isDueOrOverdue(r.expectedReturnDate);
    });
  }, [records]);

  // Check if any overdue items are still labeled BORROWED
  const hasUnsyncedOverdue = useMemo(() => {
    return records.some(
      (r) => r.status === 'BORROWED' && calculateOverdueDays(r.expectedReturnDate) > 0 && !r.actualReturnDate
    );
  }, [records]);

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.borrowerDepartment) set.add(r.borrowerDepartment);
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    const list = records.filter((item) => {
      // 1. Status Filter
      if (statusFilter === 'OVERDUE') {
        const isOverdueFlag = item.status === 'OVERDUE';
        const isPastDue = calculateOverdueDays(item.expectedReturnDate) > 0 && !item.actualReturnDate && item.status !== 'RETURNED';
        if (!isOverdueFlag && !isPastDue) return false;
      } else if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // 2. Department Filter
      if (selectedDept !== 'ALL') {
        if (item.borrowerDepartment !== selectedDept) {
          return false;
        }
      }

      // 3. Location Scope Filter (ภายในจุฬาฯ / ภายนอกจุฬาฯ)
      if (locationScopeFilter !== 'ALL') {
        if (item.locationScope !== locationScopeFilter) {
          return false;
        }
      }

      // 4. Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchAdditional = item.additionalAssets?.some(
          a => a.assetName.toLowerCase().includes(query) ||
               a.assetCode.toLowerCase().includes(query) ||
               (a.serialNumber && a.serialNumber.toLowerCase().includes(query)) ||
               (a.room && a.room.toLowerCase().includes(query))
        );
        const match =
          item.assetName.toLowerCase().includes(query) ||
          item.assetCode.toLowerCase().includes(query) ||
          (item.serialNumber && item.serialNumber.toLowerCase().includes(query)) ||
          item.borrowDocNo.toLowerCase().includes(query) ||
          item.borrowerName.toLowerCase().includes(query) ||
          item.borrowerDepartment.toLowerCase().includes(query) ||
          (item.borrowerPhone && item.borrowerPhone.toLowerCase().includes(query)) ||
          (item.receiptParcelNo && item.receiptParcelNo.toLowerCase().includes(query)) ||
          item.room.toLowerCase().includes(query) ||
          (item.locationScope && item.locationScope.toLowerCase().includes(query)) ||
          (item.purpose && item.purpose.toLowerCase().includes(query)) ||
          (item.ownerDepartment && item.ownerDepartment.toLowerCase().includes(query)) ||
          matchAdditional;
        if (!match) return false;
      }

      return true;
    });

    // 2. เรียงลำดับจากน้อยไปหามาก ในช่อง เลขที่ใบยืม/วันที่ จากข้อมูลปัจจุบันเท่านั้น
    return [...list].sort((a, b) => compareBorrowDocNoAndDate(a, b, 'asc'));
  }, [records, statusFilter, selectedDept, locationScopeFilter, searchQuery]);

  // Actions: Add & Edit
  const handleAddNew = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const handleEdit = (record: AssetLoanRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleView = (record: AssetLoanRecord) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
  };

  const handleQuickReturnClick = (record: AssetLoanRecord) => {
    setQuickReturnTarget(record);
    setIsQuickReturnOpen(true);
  };

  const handlePrintSlipClick = (record: AssetLoanRecord) => {
    setPrintTarget(record);
    setIsPrintSlipOpen(true);
  };

  const handleSaveFollowUp = (recordId: string, notes: string) => {
    const nowIso = new Date().toISOString();
    setRecords((prev) => {
      const nextList = prev.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            systemNotifiedAt: nowIso,
            followUpNotes: notes,
            updatedAt: nowIso,
          };
        }
        return r;
      });
      setSaveStatus('saving');
      persistRecords(nextList).then((res) => {
        setSaveStatus('saved');
        setLastSavedTime(formatSaveTime(res.savedAt));
      });
      return nextList;
    });
    showToast('✅ บันทึกผลการติดตามพัสดุให้เป็นปัจจุบันเรียบร้อยแล้ว');
  };

  const handleAutoSyncOverdueStatus = () => {
    let count = 0;
    const nowIso = new Date().toISOString();
    setRecords((prev) => {
      const nextList = prev.map((r) => {
        if (r.status === 'BORROWED' && calculateOverdueDays(r.expectedReturnDate) > 0 && !r.actualReturnDate) {
          count++;
          return {
            ...r,
            status: 'OVERDUE' as AssetStatus,
            updatedAt: nowIso,
          };
        }
        return r;
      });
      if (count > 0) {
        setSaveStatus('saving');
        persistRecords(nextList).then((res) => {
          setSaveStatus('saved');
          setLastSavedTime(formatSaveTime(res.savedAt));
        });
      }
      return nextList;
    });
    if (count > 0) {
      showToast(`ปรับปรุงสถานะเป็น "เกินกำหนดส่งคืน" จำนวน ${count} รายการ เรียบร้อยแล้ว`);
    } else {
      showToast('สถานะครุภัณฑ์ทั้งหมดเป็นปัจจุบันแล้ว');
    }
  };

  const handleSaveRecord = (savedRecord: AssetLoanRecord) => {
    const nowIso = new Date().toISOString();
    const finalRecord: AssetLoanRecord = {
      ...savedRecord,
      status: resolveAssetStatus(savedRecord.expectedReturnDate, savedRecord.actualReturnDate),
      updatedAt: nowIso,
    };

    setRecords((prev) => {
      const exists = prev.some((r) => r.id === finalRecord.id);
      let nextList: AssetLoanRecord[];
      if (exists) {
        nextList = prev.map((r) => (r.id === finalRecord.id ? finalRecord : r));
        showToast(`✅ บันทึกการแก้ไขข้อมูล "${finalRecord.borrowDocNo}" ให้เป็นปัจจุบันเรียบร้อยแล้ว`);
      } else {
        finalRecord.createdAt = finalRecord.createdAt || nowIso;
        nextList = [finalRecord, ...prev];
        showToast(`✅ ลงทะเบียนใบยืมใหม่ "${finalRecord.borrowDocNo}" และบันทึกเป็นปัจจุบันสำเร็จ`);
        // แสดงหน้าต่างบันทึกสำเร็จ พร้อมตัวเลือกส่งลิงก์และพิมพ์ใบยืม เฉพาะกรณีเพิ่มใหม่
        setLastSavedRecord(finalRecord);
        setIsSuccessModalOpen(true);
      }

      setSaveStatus('saving');
      submitSingleRecord(finalRecord).catch(() => {});
      persistRecords(nextList).then((res) => {
        setSaveStatus('saved');
        setLastSavedTime(formatSaveTime(res.savedAt));
      }).catch(() => {
        setSaveStatus('saved');
      });

      return nextList;
    });
  };

  // Delete Handlers
  const handleDeleteRequest = (record: AssetLoanRecord) => {
    setDeleteTargetRecord(record);
    setBulkDeleteIds([]);
    setIsDeleteModalOpen(true);
  };

  const handleBulkDeleteRequest = (selectedIds: string[]) => {
    setBulkDeleteIds(selectedIds);
    setDeleteTargetRecord(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    const idsToDelete = bulkDeleteIds.length > 0 ? [...bulkDeleteIds] : (deleteTargetRecord ? [deleteTargetRecord.id] : []);
    if (idsToDelete.length > 0) {
      deleteRecordsFromServer(idsToDelete).catch(() => {});
    }

    setRecords((prev) => {
      let nextList: AssetLoanRecord[];
      if (bulkDeleteIds.length > 0) {
        nextList = prev.filter((r) => !bulkDeleteIds.includes(r.id));
        showToast(`ลบเอกสารที่เลือกทั้งหมด ${bulkDeleteIds.length} รายการ และบันทึกข้อมูลเรียบร้อย`);
        setBulkDeleteIds([]);
      } else if (deleteTargetRecord) {
        nextList = prev.filter((r) => r.id !== deleteTargetRecord.id);
        showToast(`ลบเอกสารใบยืม "${deleteTargetRecord.borrowDocNo}" และบันทึกข้อมูลเรียบร้อย`);
        setDeleteTargetRecord(null);
      } else {
        return prev;
      }

      setSaveStatus('saved');
      return nextList;
    });
  };

  const handleConfirmReturn = (updatedRecord: AssetLoanRecord) => {
    const nowIso = new Date().toISOString();
    const finalRecord: AssetLoanRecord = {
      ...updatedRecord,
      status: resolveAssetStatus(updatedRecord.expectedReturnDate, updatedRecord.actualReturnDate),
      updatedAt: nowIso,
    };

    setRecords((prev) => {
      const nextList = prev.map((r) => (r.id === finalRecord.id ? finalRecord : r));
      setSaveStatus('saving');
      persistRecords(nextList).then((res) => {
        setSaveStatus('saved');
        setLastSavedTime(formatSaveTime(res.savedAt));
      });
      return nextList;
    });

    showToast(`✅ บันทึกรับคืนครุภัณฑ์ "${finalRecord.assetName}" ให้เป็นปัจจุบันสำเร็จ`);
  };

  const handleExportExcel = (customRecords?: AssetLoanRecord[]) => {
    const listToExport = customRecords || (filteredRecords.length > 0 ? filteredRecords : records);
    exportRecordsToExcel(
      listToExport,
      `ทะเบียนคุมใบยืมคืน_ครุภัณฑ์_ปี2570_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    showToast(`ส่งออกไฟล์ Excel (${listToExport.length} รายการ) สำเร็จ`);
  };

  const handleImportRecords = (newRecords: AssetLoanRecord[], mode: 'replace' | 'append') => {
    const sanitized = newRecords.map(sanitizeRecord);
    setRecords((prev) => {
      const nextList = mode === 'replace' ? sanitized : [...sanitized, ...prev];
      setSaveStatus('saving');
      persistRecords(nextList).then((res) => {
        setSaveStatus('saved');
        setLastSavedTime(formatSaveTime(res.savedAt));
      });
      return nextList;
    });
    showToast(`ถ่ายโอนและนำเข้าข้อมูล ${sanitized.length} รายการ และบันทึกเป็นปัจจุบันสำเร็จ`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Sarabun',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        onAddNew={handleAddNew}
        onExportExcel={() => handleExportExcel()}
        onOpenShare={(tab) => {
          setShareInitialTab(tab || 'form');
          setIsShareOpen(true);
        }}
        totalCount={records.length}
        overdueCount={dueOrOverdueRecords.length}
        onOpenNotificationCenter={() => setIsNotificationModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Page Title & Context Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>หน่วยงานเจ้าของครุภัณฑ์: <strong className="text-slate-700 font-semibold">หน่วยพัสดุ</strong></span>
              <span aria-hidden="true">·</span>
              <span>ปีงบประมาณ พ.ศ. 2570</span>
              <span aria-hidden="true">·</span>
              <span>การปฏิบัติงานภายใน/ภายนอกจุฬาฯ</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Prompt',sans-serif]">
              ทะเบียนคุมใบยืมและคืนครุภัณฑ์
            </h2>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>รูปแบบเลขที่เอกสาร: <strong className="font-mono text-indigo-700">000/2570</strong></span>
          </div>
        </div>

        {/* Quick Collaboration & Multi-User Sharing Banner */}
        <div className="mb-6 bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-indigo-50/50 border border-indigo-200/80 rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Share2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 font-['Prompt',sans-serif]">
                ส่งให้ผู้ใช้งานคนอื่นกรอกใบยืม หรือส่งต่อฐานข้อมูลให้เจ้าหน้าที่
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-600">
                สร้างลิงก์และ QR Code ให้ผู้ขอยืมกรอกข้อมูลผ่านมือถือ หรือส่งต่อข้อมูลทะเบียนคุมให้เจ้าหน้าที่ท่านอื่นบันทึกต่อได้ทันที
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShareInitialTab('form');
                setIsShareOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Link className="w-3.5 h-3.5" />
              <span>ส่งลิงก์ให้ผู้ใช้กรอก</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShareInitialTab('database');
                setIsShareOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>ส่งต่อฐานข้อมูล</span>
            </button>
          </div>
        </div>

        {/* In-System Overdue Alert Banner */}
        <OverdueAlertBanner
          overdueRecords={dueOrOverdueRecords}
          onOpenNotificationCenter={() => setIsNotificationModalOpen(true)}
          onFilterOverdueOnly={() => setStatusFilter('OVERDUE')}
          onAutoSyncOverdueStatus={handleAutoSyncOverdueStatus}
          hasUnsyncedOverdue={hasUnsyncedOverdue}
        />

        {/* Executive Stats Cards */}
        <StatsCards
          records={records}
          activeFilter={statusFilter}
          onFilterChange={(status) => setStatusFilter(status)}
        />

        {/* Search & Filters */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          selectedDept={selectedDept}
          onSelectedDeptChange={setSelectedDept}
          locationScopeFilter={locationScopeFilter}
          onLocationScopeFilterChange={setLocationScopeFilter}
          departments={departments}
          totalResults={filteredRecords.length}
        />

        {/* Data Table */}
        <AssetTable
          records={filteredRecords}
          onView={handleView}
          onEdit={handleEdit}
          onQuickReturn={handleQuickReturnClick}
          onPrintSlip={handlePrintSlipClick}
          onOpenNotificationModal={(rec) => setIsNotificationModalOpen(true)}
          onDeleteRequest={handleDeleteRequest}
          onBulkDeleteRequest={handleBulkDeleteRequest}
          onExportSelectedExcel={handleExportExcel}
          onAddNew={handleAddNew}
          onOpenPdfViewer={handleOpenPdfViewer}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/70 py-4 mt-8 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            ระบบทะเบียนคุมใบยืมและคืน (ครุภัณฑ์ ปี 2570) · เจ้าของครุภัณฑ์: หน่วยพัสดุ จุฬาลงกรณ์มหาวิทยาลัย
          </div>
          <div className="flex items-center gap-3">
            <span>ส่งออก Excel (.xlsx)</span>
            <span aria-hidden="true">·</span>
            <span>ศูนย์แจ้งเตือนและติดตามในระบบ</span>
            <span aria-hidden="true">·</span>
            <span>แบบฟอร์ม 000/2570</span>
            <span aria-hidden="true">·</span>
            <span>ถ่ายโอนข้อมูลข้ามเครื่อง</span>
          </div>
        </div>
      </footer>

      {/* Modal: Form for Add & Edit */}
      <AssetFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveRecord}
        onDeleteRequest={handleDeleteRequest}
        initialData={editingRecord}
        onOpenPdfViewer={handleOpenPdfViewer}
      />

      {/* Modal: View Details */}
      <AssetDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        record={selectedRecord}
        onEdit={handleEdit}
        onPrintSlip={handlePrintSlipClick}
        onOpenNotificationModal={(rec) => setIsNotificationModalOpen(true)}
        onDeleteRequest={handleDeleteRequest}
        onOpenPdfViewer={handleOpenPdfViewer}
      />

      {/* Modal: Quick Return */}
      <QuickReturnModal
        isOpen={isQuickReturnOpen}
        onClose={() => setIsQuickReturnOpen(false)}
        record={quickReturnTarget}
        onConfirmReturn={handleConfirmReturn}
        onOpenPdfViewer={handleOpenPdfViewer}
      />

      {/* Modal: PDF Document Viewer */}
      <PdfViewerModal
        isOpen={pdfViewerState.isOpen}
        onClose={() => setPdfViewerState(prev => ({ ...prev, isOpen: false }))}
        pdfDataUrl={pdfViewerState.dataUrl}
        fileName={pdfViewerState.fileName}
        fileSize={pdfViewerState.fileSize}
        uploadedAt={pdfViewerState.uploadedAt}
        docTitle={pdfViewerState.docTitle}
      />

      {/* Modal: Print Official Slip */}
      <PrintLoanSlipModal
        isOpen={isPrintSlipOpen}
        onClose={() => setIsPrintSlipOpen(false)}
        record={printTarget}
      />

      {/* Modal: In-System Notification & Tracking Center */}
      <SystemNotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        dueRecords={dueOrOverdueRecords}
        onQuickReturn={(rec) => {
          setIsNotificationModalOpen(false);
          handleQuickReturnClick(rec);
        }}
        onViewRecord={(rec) => {
          setIsNotificationModalOpen(false);
          handleView(rec);
        }}
        onSaveFollowUp={handleSaveFollowUp}
      />

      {/* Modal: Share, Backup, Import/Export */}
      <ShareTransferModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        records={records}
        onImportRecords={handleImportRecords}
        onExportExcel={() => handleExportExcel()}
        initialTab={shareInitialTab}
      />

      {/* Modal: Record Saved Successfully */}
      <RecordSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        record={lastSavedRecord}
        onPrintSlip={(rec) => handlePrintSlipClick(rec)}
        onAddNew={handleAddNew}
      />

      {/* Modal: Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        record={deleteTargetRecord}
        count={bulkDeleteIds.length}
      />

    </div>
  );
}
