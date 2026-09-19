import React from 'react';
import { AuditLog } from '../../types/domain';
import { History, Shield, ArrowRight, Hash, Clock, UserCheck } from 'lucide-react';

interface AuditTimelineProps {
  logs: AuditLog[];
  maxDisplay?: number;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs, maxDisplay = 10 }) => {
  const displayLogs = logs.slice(0, maxDisplay);

  if (displayLogs.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-sm">
        暂无审计操作日志
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {displayLogs.map((log) => (
        <div key={log.id} className="relative group">
          {/* Node dot */}
          <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          </div>

          {/* Content card */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm">{log.action}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                  {log.targetObject}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>{log.timestamp}</span>
              </div>
            </div>

            {/* State Transition */}
            <div className="flex items-center gap-2 text-xs py-1 px-2 my-1.5 bg-slate-50 rounded border border-slate-100 font-mono">
              <span className="text-slate-500 line-through">{log.oldState}</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="font-medium text-blue-700">{log.newState}</span>
            </div>

            {/* Reason */}
            <p className="text-xs text-slate-600 leading-relaxed mb-2">
              <span className="text-slate-400">操作原因 / 依据：</span>
              {log.reason}
            </p>

            {/* Meta footer: Operator & traceId */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-3 h-3 text-slate-400" />
                <span>
                  {log.operatorName} ({log.role === 'ADMIN' ? '系统管理员' : log.role === 'OPERATOR' ? '运营人员' : '巡检员'})
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                <Hash className="w-3 h-3" />
                <span title="追溯 Trace ID">{log.traceId}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
