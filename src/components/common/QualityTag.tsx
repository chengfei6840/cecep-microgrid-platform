import React from 'react';
import { QualityLevel } from '../../types/domain';
import { ShieldCheck, FileInput, AlertCircle, AlertOctagon } from 'lucide-react';

interface QualityTagProps {
  level?: QualityLevel | string;
  showDesc?: boolean;
}

export const QualityTag: React.FC<QualityTagProps> = ({ level = 'NORMAL', showDesc = false }) => {
  const getConfig = () => {
    switch (level) {
      case 'NORMAL':
      case 'INFO':
        return {
          label: '正常',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: ShieldCheck,
          desc: '数据完整连续，无缺失越限，置信度 100%',
        };
      case 'PATCHED':
        return {
          label: '补录',
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: FileInput,
          desc: '历史断点已规程补采回填，满足结算要求',
        };
      case 'SUSPICIOUS':
      case 'WARN':
        return {
          label: '可疑',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: AlertCircle,
          desc: '数值发生突变或偏离物理限值，置信度降低',
        };
      case 'ANOMALY':
      case 'CRITICAL':
        return {
          label: '异常',
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: AlertOctagon,
          desc: '连续周期缺失或失真，收益核算进入风控锁定',
        };
      default:
        return {
          label: '正常',
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: ShieldCheck,
          desc: '数据质量状态已监控',
        };
    }
  };

  const { label, bg, icon: Icon, desc } = getConfig();

  return (
    <span
      title={desc}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${bg}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      {showDesc && <span className="text-[11px] opacity-80 hidden sm:inline">({desc})</span>}
    </span>
  );
};
