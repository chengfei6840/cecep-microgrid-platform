import React from 'react';
import { ShieldCheck, AlertOctagon, AlertTriangle, PowerOff, Layers } from 'lucide-react';

interface DeviceStatusCounts {
  total: number;
  normal: number;
  alarm: number;
  suspicious: number;
  disabled: number;
}

interface MonitorDeviceStatusSummaryProps {
  counts: DeviceStatusCounts;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  className?: string;
}

export const MonitorDeviceStatusSummary: React.FC<MonitorDeviceStatusSummaryProps> = ({
  counts,
  selectedFilter,
  onSelectFilter,
  className = '',
}) => {
  const filterItems = [
    {
      id: 'ALL',
      label: '全部设备',
      count: counts.total,
      icon: Layers,
      colorClass: 'text-slate-700',
      activeClass: 'bg-white text-slate-900 shadow-2xs font-bold border-slate-300',
    },
    {
      id: 'NORMAL',
      label: '正常运行',
      count: counts.normal,
      icon: ShieldCheck,
      colorClass: 'text-emerald-600',
      activeClass: 'bg-emerald-50 text-emerald-800 shadow-2xs font-bold border-emerald-300',
    },
    {
      id: 'ALARM',
      label: '告警中',
      count: counts.alarm,
      icon: AlertOctagon,
      colorClass: 'text-red-600',
      activeClass: 'bg-red-50 text-red-800 shadow-2xs font-bold border-red-300',
    },
    {
      id: 'SUSPICIOUS',
      label: '可疑/离线',
      count: counts.suspicious,
      icon: AlertTriangle,
      colorClass: 'text-amber-600',
      activeClass: 'bg-amber-50 text-amber-800 shadow-2xs font-bold border-amber-300',
    },
  ];

  return (
    <div
      className={`bg-slate-100/70 p-1 rounded-xl border border-slate-200/80 flex flex-wrap items-center gap-1.5 ${className}`}
    >
      {filterItems.map((item) => {
        const Icon = item.icon;
        const isActive = selectedFilter === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectFilter(item.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
              isActive
                ? item.activeClass
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${item.colorClass}`} />
            <span>{item.label}</span>
            <span
              className={`font-mono font-bold px-1.5 py-0.2 rounded-full text-[11px] ${
                item.count > 0 && item.id === 'ALARM'
                  ? 'bg-red-200 text-red-900'
                  : 'bg-slate-200/70 text-slate-700'
              }`}
            >
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
