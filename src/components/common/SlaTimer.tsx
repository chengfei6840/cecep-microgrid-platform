import React from 'react';
import { Timer, AlertTriangle } from 'lucide-react';

interface SlaTimerProps {
  deadlineStr: string;
  isOverdue?: boolean;
  severity?: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING';
}

export const SlaTimer: React.FC<SlaTimerProps> = ({
  deadlineStr,
  isOverdue = false,
  severity = 'CRITICAL',
}) => {
  const isEmergency = severity === 'CRITICAL';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border ${
        isOverdue
          ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
          : isEmergency
          ? 'bg-orange-50 text-orange-700 border-orange-200'
          : 'bg-slate-50 text-slate-600 border-slate-200'
      }`}
    >
      {isOverdue ? (
        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
      ) : (
        <Timer className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      )}
      <span>SLA: {deadlineStr}</span>
      {isOverdue && <span className="font-bold text-red-600">[已逾期]</span>}
    </div>
  );
};
