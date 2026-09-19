import React from 'react';
import {
  AlertOctagon,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { Alarm } from '../../types/domain';
import { evaluateAlarmSla } from '../../utils/alarmSla';

interface AlarmKpiCardsProps {
  alarms: Alarm[];
  activeFilterStatus: string;
  activeFilterSeverity: string;
  activeFilterSla: string;
  onSelectFilter: (type: 'status' | 'severity' | 'sla', value: string) => void;
}

export const AlarmKpiCards: React.FC<AlarmKpiCardsProps> = ({
  alarms,
  activeFilterStatus,
  activeFilterSeverity,
  activeFilterSla,
  onSelectFilter,
}) => {
  const totalCount = alarms.length;
  const criticalAlarms = alarms.filter(
    (a) => a.severity === 'CRITICAL' && a.status !== 'CLOSED' && a.status !== 'IGNORED' && a.status !== 'FALSE_ALARM'
  );
  const pendingAckCount = alarms.filter((a) => a.status === 'PENDING_ACK').length;
  const processingCount = alarms.filter((a) => a.status === 'PROCESSING').length;

  // SLA 超时与临期计算
  const overdueCount = alarms.filter((a) => {
    if (a.status === 'CLOSED' || a.status === 'RESOLVED' || a.status === 'IGNORED' || a.status === 'FALSE_ALARM') {
      return false;
    }
    const sla = evaluateAlarmSla(a);
    return sla.isOverdue;
  }).length;

  const resolvedAndClosedCount = alarms.filter(
    (a) => a.status === 'RESOLVED' || a.status === 'CLOSED'
  ).length;

  const cards = [
    {
      id: 'kpi-total',
      title: '告警总数',
      value: totalCount,
      subText: `活动告警: ${totalCount - resolvedAndClosedCount} 项`,
      icon: ShieldAlert,
      iconBg: 'bg-slate-100 text-slate-700',
      isActive: activeFilterStatus === 'ALL' && activeFilterSeverity === 'ALL' && activeFilterSla === 'ALL',
      onClick: () => {
        onSelectFilter('status', 'ALL');
        onSelectFilter('severity', 'ALL');
        onSelectFilter('sla', 'ALL');
      },
    },
    {
      id: 'kpi-critical',
      title: '紧急告警 (CRITICAL)',
      value: criticalAlarms.length,
      subText: '15m 确认 / 30m 处置',
      icon: AlertOctagon,
      iconBg: 'bg-red-100 text-red-600',
      badge: criticalAlarms.length > 0 ? '重点监控' : undefined,
      isActive: activeFilterSeverity === 'CRITICAL',
      onClick: () => {
        onSelectFilter('severity', activeFilterSeverity === 'CRITICAL' ? 'ALL' : 'CRITICAL');
      },
    },
    {
      id: 'kpi-pending-ack',
      title: '待人工确认',
      value: pendingAckCount,
      subText: '需接单或标记误报',
      icon: Clock,
      iconBg: 'bg-amber-100 text-amber-700',
      badge: pendingAckCount > 0 ? '需响应' : undefined,
      isActive: activeFilterStatus === 'PENDING_ACK',
      onClick: () => {
        onSelectFilter('status', activeFilterStatus === 'PENDING_ACK' ? 'ALL' : 'PENDING_ACK');
      },
    },
    {
      id: 'kpi-processing',
      title: '处置流转中',
      value: processingCount,
      subText: '已转巡检/工单处置',
      icon: RefreshCw,
      iconBg: 'bg-blue-100 text-blue-700',
      isActive: activeFilterStatus === 'PROCESSING',
      onClick: () => {
        onSelectFilter('status', activeFilterStatus === 'PROCESSING' ? 'ALL' : 'PROCESSING');
      },
    },
    {
      id: 'kpi-sla-overdue',
      title: 'SLA 超时告警',
      value: overdueCount,
      subText: '超时未确认或未闭环',
      icon: AlertTriangle,
      iconBg: 'bg-rose-100 text-rose-700',
      badge: overdueCount > 0 ? '已超时' : undefined,
      isDanger: overdueCount > 0,
      isActive: activeFilterSla === 'OVERDUE',
      onClick: () => {
        onSelectFilter('sla', activeFilterSla === 'OVERDUE' ? 'ALL' : 'OVERDUE');
      },
    },
    {
      id: 'kpi-closed',
      title: '已办结 / 关闭',
      value: resolvedAndClosedCount,
      subText: `闭环率: ${totalCount > 0 ? Math.round((resolvedAndClosedCount / totalCount) * 100) : 0}%`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100 text-emerald-700',
      isActive: activeFilterStatus === 'CLOSED' || activeFilterStatus === 'RESOLVED',
      onClick: () => {
        onSelectFilter('status', activeFilterStatus === 'CLOSED' ? 'ALL' : 'CLOSED');
      },
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            id={card.id}
            onClick={card.onClick}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none relative ${
              card.isActive
                ? 'bg-blue-50/50 border-[#004287] ring-2 ring-[#004287]/20 shadow-xs'
                : card.isDanger
                ? 'bg-rose-50/30 border-rose-200 hover:border-rose-300'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs text-slate-500 font-medium truncate">
                {card.title}
              </span>
              <span className={`p-1.5 rounded-lg ${card.iconBg}`}>
                <Icon className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold font-mono ${
                  card.isDanger
                    ? 'text-rose-600'
                    : card.id === 'kpi-critical' && card.value > 0
                    ? 'text-red-600'
                    : 'text-slate-900'
                }`}
              >
                {card.value}
              </span>
              {card.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    card.isDanger
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {card.badge}
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-400 mt-1 truncate">
              {card.subText}
            </div>
          </div>
        );
      })}
    </div>
  );
};
