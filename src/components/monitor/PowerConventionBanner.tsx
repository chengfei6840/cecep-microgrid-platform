import React, { useState } from 'react';
import { UNIFIED_POWER_CONVENTIONS } from '../../hooks/useMonitorData';
import { Info, ChevronDown, ChevronUp, SunMedium, BatteryCharging, Zap, Activity } from 'lucide-react';

interface PowerConventionBannerProps {
  compact?: boolean;
  className?: string;
}

export const PowerConventionBanner: React.FC<PowerConventionBannerProps> = ({
  compact = false,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(!compact);

  const getSubsystemIcon = (subsystem: string) => {
    switch (subsystem) {
      case 'PV':
        return <SunMedium className="w-4 h-4 text-amber-500" />;
      case 'STORAGE':
        return <BatteryCharging className="w-4 h-4 text-blue-500" />;
      case 'CHARGING':
        return <Zap className="w-4 h-4 text-emerald-500" />;
      case 'GRID':
        return <Activity className="w-4 h-4 text-purple-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all ${className}`}
    >
      {/* 头部标题与收起/展开控制 */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 tracking-tight">
                微电网功率符号与流动方向统一约定
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-100/70 text-blue-800 border border-blue-200">
                IEEE 1547 / 全域同构标准
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              全站监测页面统一遵循：光伏发电与负荷为正；储能正放负充；电网正购负送。
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-md hover:bg-slate-200/60 transition-colors"
        >
          <span>{expanded ? '收起说明' : '展开规则'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 规则条目卡片 */}
      {expanded && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white">
          {UNIFIED_POWER_CONVENTIONS.map((rule) => (
            <div
              key={rule.subsystem}
              className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/40 flex flex-col justify-between space-y-2 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  {getSubsystemIcon(rule.subsystem)}
                  <span>{rule.name}</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                  {rule.standardUnit}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-1.5 text-slate-700 font-medium">
                  <span className="font-mono font-bold text-emerald-600 shrink-0">[+]</span>
                  <span className="text-[11px] leading-relaxed">{rule.positiveMeaning}</span>
                </div>
                {rule.negativeMeaning ? (
                  <div className="flex items-start gap-1.5 text-slate-700 font-medium">
                    <span className="font-mono font-bold text-blue-600 shrink-0">[-]</span>
                    <span className="text-[11px] leading-relaxed">{rule.negativeMeaning}</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 pl-4">单向功率流动，无负值</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
