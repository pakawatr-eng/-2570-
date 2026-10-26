import React, { useState, useEffect, useRef } from 'react';
import { AssetLoanRecord, AssetStatus, LocationScope, AdditionalAssetItem } from '../types/asset';
import { resolveAssetStatus } from '../utils/notifications';
import { 
  X, 
  Save, 
  FileText, 
  Calendar, 
  Building, 
  Tag, 
  MapPin, 
  CheckCircle, 
  Trash2,
  AlertCircle,
  Upload,
  Eye,
  Plus,
  PlusCircle
} from 'lucide-react';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: AssetLoanRecord) => void;
  onDeleteRequest?: (record: AssetLoanRecord) => void;
  initialData?: AssetLoanRecord | null;
  onOpenPdfViewer?: (dataUrl: string, name?: string, size?: number, date?: string, title?: string) => void;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDeleteRequest,
  initialData,
  onOpenPdfViewer,
}) => {
  const isEdit = !!initialData;
  const todayStr = new Date().toISOString().slice(0, 10);

  const [formData, setFormData] = useState<Partial<AssetLoanRecord>>({
    borrowDocNo: '',
    documentDate: todayStr,
    receiptParcelNo: '',
    receiptParcelDate: todayStr,
    borrowerName: '',
    borrowerDepartment: '',
    borrowerPhone: '',
    borrowerEmail: '',
    recordedByEmail: '',
    assetName: '',
    assetCode: '',
    serialNumber: '',
    room: '',
    ownerDepartment: '',
    borrowDate: todayStr,
    expectedReturnDate: '',
    locationScope: 'ภายในจุฬาฯ',
    purpose: '',
    status: 'BORROWED',
    actualReturnDate: '',
    returnCondition: '',
    receiverName: '',
    remarks: '',
  });

  const [activeTab, setActiveTab] = useState<'loan' | 'asset' | 'return'>('loan');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [additionalAssets, setAdditionalAssets] = useState<AdditionalAssetItem[]>([]);

  useEffect(() => {
    setErrorMessage(null);
    setFileError(null);
    if (initialData) {
      setFormData({
        ...initialData,
        borrowerEmail: initialData.borrowerEmail || '',
        recordedByEmail: initialData.recordedByEmail || '',
        ownerDepartment: initialData.ownerDepartment || '',
        locationScope: initialData.locationScope || 'ภายในจุฬาฯ',
        returnPdfFile: initialData.returnPdfFile,
        returnPdfName: initialData.returnPdfName,
        returnPdfSize: initialData.returnPdfSize,
        returnPdfUploadedAt: initialData.returnPdfUploadedAt,
      });
      setAdditionalAssets(initialData.additionalAssets ? [...initialData.additionalAssets] : []);
    } else {
      setFormData({
        borrowDocNo: '',
        documentDate: todayStr,
        receiptParcelNo: '',
        receiptParcelDate: todayStr,
        borrowerName: '',
        borrowerDepartment: '',
        borrowerPhone: '',
        borrowerEmail: '',
        recordedByEmail: '',
        assetName: '',
        assetCode: '',
        serialNumber: '',
        room: '',
        ownerDepartment: '',
        borrowDate: todayStr,
        expectedReturnDate: '',
        locationScope: 'ภายในจุฬาฯ',
        purpose: '',
        status: 'BORROWED',
        actualReturnDate: '',
        returnCondition: '',
        receiverName: '',
        returnPdfFile: undefined,
        returnPdfName: undefined,
        returnPdfSize: undefined,
        returnPdfUploadedAt: undefined,
        remarks: '',
      });
      setAdditionalAssets([]);
    }
  }, [initialData, isOpen, todayStr]);

  if (!isOpen) return null;

  const handleAddAdditionalAsset = () => {
    const newItem: AdditionalAssetItem = {
      id: `add-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      assetName: '',
      assetCode: '',
      serialNumber: '',
      room: formData.room || '',
    };
    setAdditionalAssets(prev => [...prev, newItem]);
  };

  const handleUpdateAdditionalAsset = (id: string, field: keyof AdditionalAssetItem, value: string) => {
    setAdditionalAssets(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveAdditionalAsset = (id: string) => {
    setAdditionalAssets(prev => prev.filter(item => item.id !== id));
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFileError('กรุณาเลือกไฟล์รูปแบบ .pdf เท่านั้น');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setFileError('ขนาดไฟล์ต้องไม่เกิน 20MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormData(prev => ({
        ...prev,
        returnPdfFile: result,
        returnPdfName: file.name,
        returnPdfSize: file.size,
        returnPdfUploadedAt: new Date().toISOString(),
      }));
    };
    reader.onerror = () => {
      setFileError('เกิดข้อผิดพลาดในการอ่านไฟล์ PDF');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePdf = () => {
    setFormData(prev => ({
      ...prev,
      returnPdfFile: undefined,
      returnPdfName: undefined,
      returnPdfSize: undefined,
      returnPdfUploadedAt: undefined,
    }));
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = (field: keyof AssetLoanRecord, value: string) => {
    setErrorMessage(null);
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // กำหนดให้สถานะติดตามเปลี่ยนไปตามวันที่คืนพัสดุ:
      // 1. เมื่อเปลี่ยนวันที่กำหนดคืน (expectedReturnDate)
      if (field === 'expectedReturnDate') {
        if (!updated.actualReturnDate) {
          updated.status = resolveAssetStatus(value, '');
        }
      }

      // 2. เมื่อเปลี่ยนวันที่คืนพัสดุจริง (actualReturnDate)
      if (field === 'actualReturnDate') {
        if (value && value.trim() !== '') {
          updated.status = 'RETURNED';
        } else {
          updated.status = resolveAssetStatus(updated.expectedReturnDate || '', '');
        }
      }

      // 3. เมื่อผู้ใช้เลือกสถานะโดยตรง
      if (field === 'status') {
        if (value === 'RETURNED' && !updated.actualReturnDate) {
          updated.actualReturnDate = todayStr;
        } else if (value !== 'RETURNED' && updated.actualReturnDate) {
          updated.actualReturnDate = '';
        }
      }

      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.borrowDocNo?.trim()) {
      setErrorMessage('กรุณาระบุเลขที่ใบยืม (เช่น 001/2570)');
      setActiveTab('loan');
      return;
    }
    if (!formData.borrowerName?.trim()) {
      setErrorMessage('กรุณาระบุชื่อผู้ยืม');
      setActiveTab('loan');
      return;
    }
    if (!formData.assetName?.trim()) {
      setErrorMessage('กรุณาระบุชื่อครุภัณฑ์');
      setActiveTab('asset');
      return;
    }
    if (!formData.assetCode?.trim()) {
      setErrorMessage('กรุณาระบุรหัสครุภัณฑ์');
      setActiveTab('asset');
      return;
    }

    // คำนวณสถานะติดตามอัตโนมัติตามวันที่คืนพัสดุ (หลังวันที่กำหนดคืน สถานะเป็น OVERDUE ทันที)
    const finalStatus: AssetStatus = resolveAssetStatus(
      formData.expectedReturnDate || '',
      formData.actualReturnDate || ''
    );

    const validAdditionalAssets = additionalAssets
      .filter(item => item.assetName.trim() !== '' || item.assetCode.trim() !== '')
      .map(item => ({
        id: item.id,
        assetName: item.assetName.trim(),
        assetCode: item.assetCode.trim(),
        serialNumber: item.serialNumber?.trim() || '',
        room: item.room?.trim() || '',
      }));

    const finalRecord: AssetLoanRecord = {
      id: initialData?.id || `asset-rec-${Date.now()}`,
      borrowDocNo: formData.borrowDocNo.trim(),
      documentDate: formData.documentDate || todayStr,
      receiptParcelNo: formData.receiptParcelNo || '-',
      receiptParcelDate: formData.receiptParcelDate || todayStr,
      borrowerName: formData.borrowerName.trim(),
      borrowerDepartment: formData.borrowerDepartment || '',
      borrowerPhone: formData.borrowerPhone || '',
      borrowerEmail: formData.borrowerEmail?.trim() || undefined,
      recordedByEmail: formData.recordedByEmail?.trim() || formData.borrowerEmail?.trim() || undefined,
      assetName: formData.assetName.trim(),
      assetCode: formData.assetCode.trim(),
      serialNumber: formData.serialNumber || '',
      room: formData.room || '',
      ownerDepartment: formData.ownerDepartment?.trim() || '',
      additionalAssets: validAdditionalAssets,
      borrowDate: formData.borrowDate || todayStr,
      expectedReturnDate: formData.expectedReturnDate || '',
      locationScope: (formData.locationScope as LocationScope) || 'ภายในจุฬาฯ',
      purpose: formData.purpose || '',
      status: finalStatus,
      actualReturnDate: formData.actualReturnDate || '',
      returnCondition: formData.returnCondition || '',
      receiverName: formData.receiverName || '',
      returnPdfFile: formData.returnPdfFile,
      returnPdfName: formData.returnPdfName,
      returnPdfSize: formData.returnPdfSize,
      returnPdfUploadedAt: formData.returnPdfFile ? (formData.returnPdfUploadedAt || new Date().toISOString()) : undefined,
      systemNotifiedAt: initialData?.systemNotifiedAt || '',
      followUpNotes: initialData?.followUpNotes || '',
      remarks: formData.remarks || '',
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(finalRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isEdit ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 font-['Prompt',sans-serif]">
                  {isEdit ? 'แก้ไขข้อมูลใบยืมและคืนครุภัณฑ์' : 'ลงทะเบียนใบยืมครุภัณฑ์ใหม่ (ปี 2570)'}
                </h2>
                {isEdit && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-medium">
                    {initialData?.borrowDocNo}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                โครงสร้างฐานข้อมูลครุภัณฑ์ ปี 2570
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connection to Admin Database Badge */}
        <div className="px-6 py-2 bg-indigo-50/70 border-b border-indigo-100/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-indigo-950 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>เชื่อมโยงฐานข้อมูลหลักของผู้ดูแล: <strong className="font-mono text-indigo-700">pakawat.day@gmail.com</strong></span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">หน่วยพัสดุ จุฬาลงกรณ์มหาวิทยาลัย</span>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-2 sm:gap-4 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('loan')}
            className={`py-3 px-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'loan'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>1. เลขที่ & ข้อมูลผู้ยืม</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('asset')}
            className={`py-3 px-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'asset'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>2. ข้อมูลครุภัณฑ์ & สถานที่</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('return')}
            className={`py-3 px-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'return'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>3. สถานะติดตาม & คืนแล้วเสร็จ</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: เลขที่ & ข้อมูลผู้ยืม */}
          {activeTab === 'loan' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  เลขที่เอกสาร และ เลขที่ลงรับพัสดุ
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เลขที่ใบยืม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.borrowDocNo || ''}
                    onChange={(e) => handleChange('borrowDocNo', e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    วันที่เอกสาร <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.documentDate || ''}
                    onChange={(e) => handleChange('documentDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เลขที่ลงรับพัสดุ
                  </label>
                  <input
                    type="text"
                    value={formData.receiptParcelNo || ''}
                    onChange={(e) => handleChange('receiptParcelNo', e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    วันที่ลงรับพัสดุ
                  </label>
                  <input
                    type="date"
                    value={formData.receiptParcelDate || ''}
                    onChange={(e) => handleChange('receiptParcelDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="border-b border-slate-100 pb-2 pt-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  ข้อมูลผู้ยืม และ อีเมลผู้บันทึก
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ชื่อผู้ยืม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.borrowerName || ''}
                    onChange={(e) => handleChange('borrowerName', e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    หน่วยงานผู้ยืม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.borrowerDepartment || ''}
                    onChange={(e) => handleChange('borrowerDepartment', e.target.value)}
                    placeholder="เช่น คณะวิศวกรรมศาสตร์"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เบอร์โทรศัพท์ติดต่อ
                  </label>
                  <input
                    type="text"
                    value={formData.borrowerPhone || ''}
                    onChange={(e) => handleChange('borrowerPhone', e.target.value)}
                    placeholder="เช่น 081-456-7890"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                    <span>อีเมลผู้ยืม / ผู้บันทึก</span>
                    <span className="text-[10px] text-indigo-600 font-medium">บันทึกลงระบบส่วนกลาง</span>
                  </label>
                  <input
                    type="email"
                    value={formData.borrowerEmail || ''}
                    onChange={(e) => handleChange('borrowerEmail', e.target.value)}
                    placeholder="เช่น user@gmail.com หรือ chula.ac.th"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="border-b border-slate-100 pb-2 pt-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  ระยะเวลาการยืม-คืน
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    วันที่ยืม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.borrowDate || ''}
                    onChange={(e) => handleChange('borrowDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    วันที่กำหนดคืน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expectedReturnDate || ''}
                    onChange={(e) => handleChange('expectedReturnDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ข้อมูลครุภัณฑ์ & สถานที่ */}
          {activeTab === 'asset' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  ข้อมูลครุภัณฑ์
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ชื่อครุภัณฑ์ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.assetName || ''}
                    onChange={(e) => handleChange('assetName', e.target.value)}
                    placeholder="เช่น เครื่องคอมพิวเตอร์ประมวลผลกราฟิกระดับสูง"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    รหัสครุภัณฑ์ (Asset Code) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.assetCode || ''}
                    onChange={(e) => handleChange('assetCode', e.target.value)}
                    placeholder="เช่น 7440-001-0012/70"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    หมายเลขเครื่อง (Serial Number)
                  </label>
                  <input
                    type="text"
                    value={formData.serialNumber || ''}
                    onChange={(e) => handleChange('serialNumber', e.target.value)}
                    placeholder="เช่น SN-WS7004128"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ห้อง (ห้องใช้งาน/ห้องจัดเก็บ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.room || ''}
                    onChange={(e) => handleChange('room', e.target.value)}
                    placeholder="เช่น ห้องปฏิบัติการ AI ชั้น 8 / ห้อง 308"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    หน่วยงานเจ้าของครุภัณฑ์ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ownerDepartment || ''}
                    onChange={(e) => handleChange('ownerDepartment', e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* รายการครุภัณฑ์อื่นเพิ่มเติม (ไม่บังคับ) */}
              <div className="border-t border-slate-200/80 pt-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-indigo-600" />
                      <span>ครุภัณฑ์รายการอื่นเพิ่มเติม</span>
                      <span className="text-[11px] font-normal text-slate-500">(ไม่บังคับ)</span>
                      {additionalAssets.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono text-[11px] font-semibold">
                          +{additionalAssets.length} รายการ
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      หากในใบยืมฉบับนี้มีการยืมครุภัณฑ์มากกว่า 1 ชิ้น สามารถกดเพิ่มรายการอื่นได้ตามต้องการ (ไม่บังคับ)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAdditionalAsset}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-2xs shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มครุภัณฑ์รายการอื่น (ไม่บังคับ)</span>
                  </button>
                </div>

                {/* Additional Assets Cards */}
                {additionalAssets.length > 0 && (
                  <div className="space-y-3 pt-1">
                    {additionalAssets.map((item, index) => (
                      <div 
                        key={item.id} 
                        className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="text-xs font-semibold text-indigo-950 flex items-center gap-1.5">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold">
                              {index + 2}
                            </span>
                            <span>ครุภัณฑ์รายการที่ {index + 2} (เพิ่มเติม)</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveAdditionalAsset(item.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบรายการครุภัณฑ์นี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบรายการที่ {index + 2}</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              ชื่อครุภัณฑ์ (รายการที่ {index + 2})
                            </label>
                            <input
                              type="text"
                              value={item.assetName}
                              onChange={(e) => handleUpdateAdditionalAsset(item.id, 'assetName', e.target.value)}
                              placeholder="เช่น จอภาพมอนิเตอร์ 27 นิ้ว หรือ เมาส์ปากกา"
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              รหัสครุภัณฑ์ (Asset Code)
                            </label>
                            <input
                              type="text"
                              value={item.assetCode}
                              onChange={(e) => handleUpdateAdditionalAsset(item.id, 'assetCode', e.target.value)}
                              placeholder="เช่น 7440-002-0045/70"
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              หมายเลขเครื่อง (Serial Number)
                            </label>
                            <input
                              type="text"
                              value={item.serialNumber || ''}
                              onChange={(e) => handleUpdateAdditionalAsset(item.id, 'serialNumber', e.target.value)}
                              placeholder="เช่น SN-MON27019"
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-medium text-slate-700 mb-1">
                              ห้อง (ห้องใช้งาน/จัดเก็บ)
                            </label>
                            <input
                              type="text"
                              value={item.room || ''}
                              onChange={(e) => handleUpdateAdditionalAsset(item.id, 'room', e.target.value)}
                              placeholder="เช่น ห้องปฏิบัติการ AI ชั้น 8"
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-b border-slate-100 pb-2 pt-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  สถานที่ยืมไปใช้งาน (ขอบเขตสถานที่ & วัตถุประสงค์)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ขอบเขตสถานที่ยืมไปใช้งาน <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-3 max-w-md">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs font-medium transition-colors ${
                      formData.locationScope === 'ภายในจุฬาฯ' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}>
                      <input
                        type="radio"
                        name="locationScope"
                        checked={formData.locationScope === 'ภายในจุฬาฯ'}
                        onChange={() => handleChange('locationScope', 'ภายในจุฬาฯ')}
                        className="hidden"
                      />
                      <span>🏛️ ภายในจุฬาฯ</span>
                    </label>

                    <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs font-medium transition-colors ${
                      formData.locationScope === 'ภายนอกจุฬาฯ' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}>
                      <input
                        type="radio"
                        name="locationScope"
                        checked={formData.locationScope === 'ภายนอกจุฬาฯ'}
                        onChange={() => handleChange('locationScope', 'ภายนอกจุฬาฯ')}
                        className="hidden"
                      />
                      <span>🚗 ภายนอกจุฬาฯ</span>
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    วัตถุประสงค์การใช้งาน
                  </label>
                  <input
                    type="text"
                    value={formData.purpose || ''}
                    onChange={(e) => handleChange('purpose', e.target.value)}
                    placeholder="เช่น ใช้สำหรับงานประชุมวิชาการ หรืองานนำเสนอผลงานวิจัย"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    หมายเหตุ / อุปกรณ์ส่วนควบ
                  </label>
                  <textarea
                    rows={2}
                    value={formData.remarks || ''}
                    onChange={(e) => handleChange('remarks', e.target.value)}
                    placeholder="เช่น ติดสติ๊กเกอร์บาร์โค้ดของหน่วยพัสดุเรียบร้อย, ตรวจเช็กอุปกรณ์เสริมครบ"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: สถานะติดตาม & การคืน */}
          {activeTab === 'return' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                  สถานะติดตามครุภัณฑ์ และ วันที่คืนพัสดุ
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    สถานะติดตามครุภัณฑ์ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.status || 'BORROWED'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="BORROWED">กำลังยืม (On Loan)</option>
                    <option value="RETURNED">ส่งคืนแล้ว (Returned)</option>
                    <option value="OVERDUE">เกินกำหนดส่งคืน (Overdue)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    วันที่คืนพัสดุ (ส่งคืนจริง)
                  </label>
                  <input
                    type="date"
                    value={formData.actualReturnDate || ''}
                    onChange={(e) => handleChange('actualReturnDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* กล่องแสดงผลการคำนวณสถานะอัตโนมัติตามวันที่คืนพัสดุ */}
                <div className="sm:col-span-2">
                  <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
                    formData.status === 'OVERDUE'
                      ? 'bg-rose-50/90 border-rose-200 text-rose-800'
                      : formData.status === 'RETURNED'
                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50/90 border-amber-200 text-amber-800'
                  }`}>
                    <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                      formData.status === 'OVERDUE' ? 'text-rose-600' : formData.status === 'RETURNED' ? 'text-emerald-600' : 'text-amber-600'
                    }`} />
                    <div className="space-y-0.5">
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>สถานะระบบ:</span>
                        <span className="underline decoration-current font-bold">
                          {formData.status === 'OVERDUE' ? 'เกินกำหนดส่งคืน (Overdue)' : formData.status === 'RETURNED' ? 'ส่งคืนแล้ว (Returned)' : 'กำลังยืม (On Loan)'}
                        </span>
                      </div>
                      <div className="text-[11px] leading-relaxed">
                        {formData.status === 'OVERDUE' && 'ระบบตรวจพบว่าวันที่ปัจจุบันเลย "วันที่คืนพัสดุ (กำหนดส่งคืน)" แล้ว จึงกำหนดสถานะเป็น "เกินกำหนดส่งคืน" โดยอัตโนมัติ'}
                        {formData.status === 'RETURNED' && 'มีการบันทึกวันที่ส่งคืนพัสดุเรียบร้อยแล้ว ระบบกำหนดสถานะเป็น "ส่งคืนแล้ว"'}
                        {formData.status === 'BORROWED' && 'อยู่ระหว่างกำหนดระยะเวลายืมพัสดุ (เมื่อพ้นวันที่กำหนดคืน สถานะจะเปลี่ยนเป็น "เกินกำหนดส่งคืน" โดยอัตโนมัติ)'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    สภาพเมื่อส่งคืน
                  </label>
                  <input
                    type="text"
                    value={formData.returnCondition || ''}
                    onChange={(e) => handleChange('returnCondition', e.target.value)}
                    placeholder="เช่น สภาพสมบูรณ์ พร้อมอุปกรณ์เสริมครบถ้วน"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เจ้าหน้าที่ผู้ตรวจรับมอบคืน
                  </label>
                  <input
                    type="text"
                    value={formData.receiverName || ''}
                    onChange={(e) => handleChange('receiverName', e.target.value)}
                    placeholder="เช่น นางสาวสุมิตรา มั่นคง (เจ้าหน้าที่หน่วยพัสดุ)"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* ช่องแนบไฟล์ .pdf ในส่วนคืนแล้วเสร็จ (ไม่บังคับ) */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-rose-600" />
                        <span>แนบไฟล์เอกสารการคืน (.pdf)</span>
                        <span className="text-[11px] font-normal text-slate-500">(ไม่บังคับ)</span>
                      </label>
                      {formData.returnPdfFile && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>แนบไฟล์เรียบร้อย</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      สามารถแนบไฟล์เอกสารหลักฐานการส่งคืนแล้วเสร็จ เช่น ใบส่งมอบคืนพัสดุ, ใบตรวจรับคืน หรือบันทึกข้อความ (รูปแบบไฟล์ .pdf ไม่เกิน 20MB - ไม่บังคับต้องใส่)
                    </p>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf,application/pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                      id="asset-form-return-pdf"
                    />

                    {formData.returnPdfFile ? (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-rose-200 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate max-w-[220px] sm:max-w-[340px]">
                              {formData.returnPdfName || 'เอกสารคืนแล้วเสร็จ.pdf'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formData.returnPdfSize ? `${(formData.returnPdfSize / 1024).toFixed(1)} KB` : ''} · ไฟล์ PDF พร้อมบันทึก
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onOpenPdfViewer && (
                            <button
                              type="button"
                              onClick={() => onOpenPdfViewer(formData.returnPdfFile!, formData.returnPdfName, formData.returnPdfSize, formData.returnPdfUploadedAt, `${formData.borrowDocNo || 'เอกสาร'} - ${formData.assetName || ''}`)}
                              className="px-2.5 py-1 text-xs text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>ดูตัวอย่าง</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleRemovePdf}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบไฟล์แนบนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label
                          htmlFor="asset-form-return-pdf"
                          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white hover:bg-indigo-50/50 border border-dashed border-slate-300 hover:border-indigo-400 rounded-lg text-xs font-medium text-slate-600 hover:text-indigo-600 cursor-pointer transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-400" />
                          <span>คลิกเพื่อเลือกไฟล์ .pdf หรือลากไฟล์มาวางที่นี่ (ไม่บังคับ)</span>
                        </label>
                      </div>
                    )}

                    {fileError && (
                      <div className="flex items-center gap-1.5 text-[11px] text-rose-600">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fileError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              {isEdit && initialData && onDeleteRequest && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDeleteRequest(initialData);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบเอกสารนี้</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isEdit ? 'บันทึกการแก้ไขให้เป็นปัจจุบัน' : 'บันทึกข้อมูลใบยืมใหม่'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
