import React from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alarm } from '../../types/domain';
import { evaluateAlarmSla, SlaCalculationResult } from '../../utils/alarmSla';

interface SlaBadgeProps {
  alarm: Alarm;
  size?: 'sm' | 'md';
  showDetails?: boolean;
}

export const SlaBadge: React.FC<SlaBadgeProps> = ({
  alarm,
  size = 'sm',
  showDetails = false,
}) => {
  const sla: SlaCalculationResult = evaluateAlarmSla(alarm);

  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = <Clock className="w-3.5 h-3.5 shrink-0 text-slate-500" />;

  if (sla.stage === 'COMPLETED') {
    bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    icon = <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />;
  } else if (sla.stage === 'TERMINATED') {
    bgClass = 'bg-slate-100 text-slate-500 border-slate-200';
    icon = <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />;
  } else if (sla.isOverdue) {
    bgClass = 'bg-red-50 text-red-700 border-red-300 font-semibold ring-1 ring-red-200 animate-pulse';
    icon = <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />;
  } else if (sla.isExpiringSoon) {
    bgClass = 'bg-amber-50 text-amber-800 border-amber-300 font-medium';
    icon = <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />;
  } else {
    bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
    icon = <Clock className="w-3.5 h-3.5 shrink-0 text-blue-600" />;
  }

  const isCritical = alarm.severity === 'CRITICAL';
  const stagePrefix = sla.stage === 'CONFIRM' ? '确认限时' : sla.stage === 'HANDLE' ? '处置限时' : 'SLA';

  return (
    <div
      id={`sla-badge-${alarm.id}`}
      title={`${sla.ruleExplanation} · 截止时间: ${sla.deadlineText}`}
      className={`inline-flex items-center gap-1.5 rounded border font-mono transition-colors ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${bgClass}`}
    >
      {icon}
      <span className="font-sans font-medium text-[11px] opacity-85">
        [{stagePrefix} {isCritical ? (sla.stage === 'CONFIRM' ? '15m' : '30m') : (sla.stage === 'CONFIRM' ? '30m' : '2h')}]
      </span>
      <span className="font-bold">{sla.formattedDuration}</span>
      {sla.isOverdue && (
        <span className="text-[10px] bg-red-600 text-white px-1 rounded uppercase tracking-wider font-bold">
          逾期
        </span>
      )}
      {showDetails && (
        <span className="text-slate-400 font-sans text-[11px] ml-1">
          (至 {sla.deadlineText})
        </span>
      )}
    </div>
  );
};
