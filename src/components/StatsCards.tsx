import React from 'react';
import { AssetLoanRecord } from '../types/asset';
import { Clock, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface StatsCardsProps {
  records: AssetLoanRecord[];
  activeFilter: string;
  onFilterChange: (status: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  records,
  activeFilter,
  onFilterChange,
}) => {
  const total = records.length;
  const borrowed = records.filter(r => r.status === 'BORROWED').length;
  const overdue = records.filter(r => r.status === 'OVERDUE').length;
  const returned = records.filter(r => r.status === 'RETURNED').length;

  const cards = [
    {
      id: 'ALL',
      title: 'ทะเบียนทั้งหมด',
      count: total,
      sub: 'ปีงบประมาณ 2570',
      icon: Layers,
      colorClass: 'text-slate-900',
      activeBorder: 'border-slate-800 bg-white ring-1 ring-slate-800/20',
      inactiveBorder: 'border-slate-200 bg-white hover:border-slate-300',
    },
    {
      id: 'BORROWED',
      title: 'กำลังยืมใช้งาน',
      count: borrowed,
      sub: 'อยู่ระหว่างปฏิบัติงาน',
      icon: Clock,
      colorClass: 'text-amber-600',
      activeBorder: 'border-amber-500 bg-amber-50/20 ring-1 ring-amber-500/20',
      inactiveBorder: 'border-slate-200 bg-white hover:border-amber-300',
    },
    {
      id: 'OVERDUE',
      title: 'เกินกำหนดส่งคืน',
      count: overdue,
      sub: 'ต้องเร่งรัดติดตาม',
      icon: AlertTriangle,
      colorClass: 'text-rose-600',
      activeBorder: 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-500/20',
      inactiveBorder: 'border-slate-200 bg-white hover:border-rose-300',
    },
    {
      id: 'RETURNED',
      title: 'คืนแล้วเสร็จ',
      count: returned,
      sub: 'ตรวจสอบรับเข้าคลัง',
      icon: CheckCircle2,
      colorClass: 'text-emerald-600',
      activeBorder: 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/20',
      inactiveBorder: 'border-slate-200 bg-white hover:border-emerald-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onFilterChange(card.id)}
            className={`text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-150 cursor-pointer shadow-2xs ${
              isActive ? card.activeBorder : card.inactiveBorder
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">
                {card.title}
              </span>
              <Icon className={`w-4 h-4 ${card.colorClass}`} />
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-semibold font-mono tabular-nums tracking-tight ${card.colorClass}`}>
                {card.count}
              </span>
              <span className="text-xs text-slate-400">รายการ</span>
            </div>

            <p className="text-[11px] text-slate-400 mt-1 truncate">
              {card.sub}
            </p>
          </button>
        );
      })}
    </div>
  );
};
