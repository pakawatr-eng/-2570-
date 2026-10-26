import React from 'react';
import { Search, X, Filter, MapPin } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  selectedDept: string;
  onSelectedDeptChange: (dept: string) => void;
  locationScopeFilter: string;
  onLocationScopeFilterChange: (scope: string) => void;
  departments: string[];
  totalResults: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedDept,
  onSelectedDeptChange,
  locationScopeFilter,
  onLocationScopeFilterChange,
  departments,
  totalResults,
}) => {
  const hasActiveFilters = 
    searchQuery !== '' || 
    statusFilter !== 'ALL' || 
    selectedDept !== 'ALL' ||
    locationScopeFilter !== 'ALL';

  const resetFilters = () => {
    onSearchChange('');
    onStatusFilterChange('ALL');
    onSelectedDeptChange('ALL');
    onLocationScopeFilterChange('ALL');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 mb-4 shadow-2xs space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อครุภัณฑ์, รหัสครุภัณฑ์, ชื่อผู้ยืม, หน่วยงาน, เลขที่ใบยืม (เช่น 001/2570), เลขที่ลงรับ..."
            className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Location Scope Filter */}
          <div className="flex items-center gap-1.5 min-w-[150px]">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={locationScopeFilter}
              onChange={(e) => onLocationScopeFilterChange(e.target.value)}
              className="w-full text-xs sm:text-sm py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">สถานที่ทั้งหมด</option>
              <option value="ภายในจุฬาฯ">🏛️ ภายในจุฬาฯ</option>
              <option value="ภายนอกจุฬาฯ">🚗 ภายนอกจุฬาฯ</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 min-w-[180px]">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedDept}
              onChange={(e) => onSelectedDeptChange(e.target.value)}
              className="w-full text-xs sm:text-sm py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">หน่วยงานผู้ยืมทั้งหมด</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-2.5 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Segmented Filter Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {[
            { id: 'ALL', label: 'ทั้งหมด' },
            { id: 'BORROWED', label: 'กำลังยืม' },
            { id: 'OVERDUE', label: 'เกินกำหนด' },
            { id: 'RETURNED', label: 'ส่งคืนแล้ว' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-slate-500">
          พบ <span className="font-mono tabular-nums font-semibold text-slate-800">{totalResults}</span> รายการ
        </div>
      </div>
    </div>
  );
};
