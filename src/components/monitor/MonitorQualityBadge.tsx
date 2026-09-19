import React, { useState } from 'react';
import { QualityLevel } from '../../types/domain';
import { ShieldCheck, FileInput, AlertCircle, AlertOctagon, Clock, HelpCircle, X } from 'lucide-react';

interface MonitorQualityBadgeProps {
  quality: QualityLevel | 'EXPIRED' | string;
  source?: string;
  reason?: string;
  lastUpdated?: string;
  size?: 'sm' | 'md';
  interactive?: boolean;
}

export const MonitorQualityBadge: React.FC<MonitorQualityBadgeProps> = ({
  quality = 'NORMAL',
  source,
  reason,
  lastUpdated,
  size = 'sm',
  interactive = true,
}) => {
  const [showPopover, setShowPopover] = useState(false);

  const getBadgeConfig = () => {
    switch (quality) {
      case 'NORMAL':
        return {
          label: '正常',
          bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: ShieldCheck,
          defaultDesc: '数据采集完整连续，校验规则全部通过',
          dotColor: 'bg-emerald-500',
        };
      case 'PATCHED':
        return {
          label: '补录',
          bgClass: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: FileInput,
          defaultDesc: '历史断点通过规则自动补采插值回填，满足结算要求',
          dotColor: 'bg-sky-500',
        };
      case 'SUSPICIOUS':
        return {
          label: '可疑',
          bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: AlertCircle,
          defaultDesc: '数值偏离动态门槛或物理限值，置信度降低',
          dotColor: 'bg-amber-500',
        };
      case 'ANOMALY':
        return {
          label: '异常',
          bgClass: 'bg-red-50 text-red-700 border-red-200',
          icon: AlertOctagon,
          defaultDesc: '连续多周期缺失、越限或断线，收益计算已风控锁定',
          dotColor: 'bg-red-500',
        };
      case 'EXPIRED':
        return {
          label: '过期停滞',
          bgClass: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: Clock,
          defaultDesc: '超过最大心跳周期未更新，数据已冻结停滞',
          dotColor: 'bg-orange-500',
        };
      default:
        return {
          label: '未定义',
          bgClass: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: HelpCircle,
          defaultDesc: '质量状态评估中',
          dotColor: 'bg-slate-400',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;
  const isNonNormal = quality !== 'NORMAL';

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          setShowPopover(!showPopover);
        }}
        className={`inline-flex items-center gap-1 rounded font-medium border transition-colors ${
          size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
        } ${config.bgClass} ${interactive ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
        title={`${config.label}：${reason || config.defaultDesc}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
        <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>{config.label}</span>
        {isNonNormal && interactive && (
          <span className="text-[10px] opacity-70 underline ml-0.5">详情</span>
        )}
      </button>

      {/* 弹出式质量溯源与说明浮窗 */}
      {showPopover && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 left-0 mt-1.5 w-72 p-3 bg-white rounded-xl shadow-lg border border-slate-200 text-left text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
              <span>数据质量溯源与说明</span>
            </div>
            <button
              onClick={() => setShowPopover(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="py-2.5 space-y-2">
            <div>
              <span className="text-[10px] text-slate-400 block">判定等级</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                {config.label}
                <span className="text-[10px] text-slate-500 font-normal">
                  ({quality})
                </span>
              </span>
            </div>

            {source && (
              <div>
                <span className="text-[10px] text-slate-400 block">数据来源 / 协议</span>
                <span className="font-mono text-[11px] text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 block mt-0.5">
                  {source}
                </span>
              </div>
            )}

            <div>
              <span className="text-[10px] text-slate-400 block">质量说明 / 异常原因</span>
              <p className="text-slate-700 text-[11px] leading-relaxed mt-0.5 bg-slate-50/70 p-1.5 rounded border border-slate-100">
                {reason || config.defaultDesc}
              </p>
            </div>

            {lastUpdated && (
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                <span>更新时刻:</span>
                <span className="font-mono text-slate-600">{lastUpdated}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
