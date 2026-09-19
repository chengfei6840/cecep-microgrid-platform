import React from 'react';
import { UnifiedMonitorPoint } from '../../types/monitor';
import { MonitorQualityBadge } from './MonitorQualityBadge';
import {
  SunMedium,
  BatteryCharging,
  Zap,
  Activity,
  Gauge,
  Clock,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface MonitorKpiCardProps {
  point: UnifiedMonitorPoint;
  onClickDetail?: () => void;
  className?: string;
}

export const MonitorKpiCard: React.FC<MonitorKpiCardProps> = ({
  point,
  onClickDetail,
  className = '',
}) => {
  const getSubsystemIcon = () => {
    switch (point.subsystem) {
      case 'PV':
        return <SunMedium className="w-4 h-4 text-amber-500" />;
      case 'STORAGE':
        return <BatteryCharging className="w-4 h-4 text-blue-500" />;
      case 'CHARGING':
        return <Zap className="w-4 h-4 text-emerald-500" />;
      case 'GRID':
        return <Activity className="w-4 h-4 text-purple-500" />;
      default:
        return <Gauge className="w-4 h-4 text-slate-500" />;
    }
  };

  const isAnomalous = point.quality === 'ANOMALY' || point.quality === 'EXPIRED';
  const isSuspicious = point.quality === 'SUSPICIOUS';

  return (
    <div
      onClick={onClickDetail}
      className={`bg-white rounded-xl border p-4 shadow-2xs transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
        isAnomalous
          ? 'border-red-300 bg-red-50/10 hover:border-red-400 ring-1 ring-red-200/50'
          : isSuspicious
          ? 'border-amber-300 bg-amber-50/10 hover:border-amber-400'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
      } ${className}`}
    >
      {/* 顶部：子系统、测点名称与数据质量徽标 */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              {getSubsystemIcon()}
            </div>
            <div className="truncate">
              <h4 className="font-bold text-xs text-slate-900 truncate" title={point.pointName}>
                {point.pointName}
              </h4>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <span title="测点ID">{point.id}</span>
                <span>·</span>
                <span title="设备ID">{point.deviceId}</span>
              </div>
            </div>
          </div>

          <MonitorQualityBadge
            quality={point.quality}
            source={point.qualitySource}
            reason={point.qualityReason}
            lastUpdated={point.lastUpdated}
            size="sm"
          />
        </div>

        {/* 数值与单位展现：严禁 kW 与 kWh 混用 */}
        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span
              className={`text-2xl font-black font-mono tracking-tight ${
                isAnomalous
                  ? 'text-red-600'
                  : point.value < 0
                  ? 'text-blue-600'
                  : 'text-slate-900'
              }`}
            >
              {point.formattedValue}
            </span>
            <span className="text-xs font-bold font-mono text-slate-600">{point.unit}</span>

            {/* 双向功率流动方向显式说明 */}
            {point.powerDirectionNote && (
              <span
                className={`text-[11px] font-medium px-1.5 py-0.5 rounded border ${
                  point.value < 0
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {point.powerDirectionNote}
              </span>
            )}
          </div>

          {/* 时间口径标签 */}
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
              point.timeScope === 'REALTIME'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {point.timeScope === 'REALTIME' ? '瞬时实时值' : '今日累计值'}
          </span>
        </div>
      </div>

      {/* 底部信息栏：质量提示或最后更新时间 */}
      <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate font-mono">{point.lastUpdated}</span>
        </div>

        <div className="flex items-center gap-1 text-[#004287] font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <span>设备与测点抽屉</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>

      {/* 异常警示条 (若质量异常或过期) */}
      {isAnomalous && (
        <div className="mt-2 p-2 rounded bg-red-50 text-red-700 text-[11px] leading-relaxed border border-red-200 flex items-start gap-1.5">
          <span className="font-bold shrink-0">[断线告警]</span>
          <span className="line-clamp-2">{point.qualityReason}</span>
        </div>
      )}
    </div>
  );
};
