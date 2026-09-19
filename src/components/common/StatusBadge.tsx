import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  CircleDot,
  FileCheck2,
} from 'lucide-react';

export type StatusBadgeType =
  | 'ONLINE'
  | 'OFFLINE'
  | 'WARNING'
  | 'RETRYING'
  | 'FAILED'
  | 'NORMAL'
  | 'ALARM'
  | 'SUSPICIOUS'
  | 'PENDING_ACK'
  | 'PROCESSING'
  | 'RESOLVED'
  | 'CLOSED'
  | 'EFFECTIVE'
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'REJECTED'
  | 'EXPIRED'
  | 'IN_PROGRESS'
  | 'PENDING_REVIEW'
  | 'SUBMITTED';

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customLabel,
  size = 'md',
}) => {
  const getStyle = () => {
    switch (status) {
      case 'ONLINE':
      case 'NORMAL':
      case 'RESOLVED':
      case 'EFFECTIVE':
      case 'CLOSED':
      case 'SUBMITTED':
      case 'ACTIVE':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          defaultLabel:
            status === 'EFFECTIVE'
              ? '已生效'
              : status === 'CLOSED'
              ? '已关闭'
              : status === 'ACTIVE'
              ? '启用运行'
              : status === 'SUBMITTED'
              ? '已提交'
              : '正常/在线',
        };
      case 'ARCHIVED':
        return {
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          dot: 'bg-teal-500',
          icon: FileCheck2,
          defaultLabel: '已复核归档',
        };
      case 'PAUSED':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
          icon: CircleDot,
          defaultLabel: '已暂停',
        };
      case 'CANCELLED':
        return {
          bg: 'bg-rose-50 text-rose-600 border-rose-200 line-through',
          dot: 'bg-rose-400',
          icon: XCircle,
          defaultLabel: '已作废',
        };
      case 'PENDING_SUBMIT':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500 animate-pulse',
          icon: Clock,
          defaultLabel: '待提交',
        };
      case 'RETRYING':
      case 'PROCESSING':
      case 'IN_PROGRESS':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500 animate-pulse',
          icon: RefreshCw,
          defaultLabel: status === 'RETRYING' ? '重试中' : '处理中',
        };
      case 'PENDING_ACK':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500 animate-pulse',
          icon: Clock,
          defaultLabel: '待确认',
        };
      case 'FALSE_ALARM':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-400',
          icon: FileCheck2,
          defaultLabel: '已标记误报',
        };
      case 'IGNORED':
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          dot: 'bg-slate-400',
          icon: CircleDot,
          defaultLabel: '已忽略',
        };
      case 'PENDING_APPROVAL':
      case 'PENDING_REVIEW':
      case 'PENDING_START':
      case 'PENDING_ACCEPT':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          icon: Clock,
          defaultLabel: status === 'PENDING_APPROVAL' ? '待二次授权' : status === 'PENDING_REVIEW' ? '待复核' : '待处理',
        };
      case 'WARNING':
      case 'SUSPICIOUS':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
          defaultLabel: '注意/可疑',
        };
      case 'FAILED':
      case 'ALARM':
      case 'REJECTED':
      case 'CRITICAL':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-500 animate-ping',
          icon: XCircle,
          defaultLabel: status === 'REJECTED' ? '已驳回' : '故障/紧急',
        };
      case 'DRAFT':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          icon: FileCheck2,
          defaultLabel: '草稿',
        };
      case 'EXPIRED':
        return {
          bg: 'bg-slate-100 text-slate-500 border-slate-300',
          dot: 'bg-slate-400',
          icon: Clock,
          defaultLabel: '已过期/历史',
        };
      case 'OFFLINE':
      default:
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          dot: 'bg-slate-400',
          icon: CircleDot,
          defaultLabel: '离线/未配置',
        };
    }
  };

  const config = getStyle();
  const Icon = config.icon;
  const label = customLabel || config.defaultLabel;

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border whitespace-nowrap ${config.bg} ${sizeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
};
