import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Shield,
  Bot,
  Copy,
  Wrench,
  Ban,
  ClipboardList,
} from 'lucide-react';
import { Alarm } from '../../types/domain';
import { StatusBadge } from '../common/StatusBadge';
import { SlaBadge } from './SlaBadge';
import { AlarmActionMode } from './AlarmActionModal';
import { useAppStore } from '../../store/AppContext';
import { useNavigate } from 'react-router-dom';

interface AlarmTableProps {
  alarms: Alarm[];
  onSelectAlarm: (alarm: Alarm) => void;
  onOpenAction: (alarm: Alarm, mode: AlarmActionMode) => void;
}

export const AlarmTable: React.FC<AlarmTableProps> = ({
  alarms,
  onSelectAlarm,
  onOpenAction,
}) => {
  const navigate = useNavigate();
  const { currentRole } = useAppStore();
  const isInspector = currentRole === 'INSPECTOR';
  const isAdmin = currentRole === 'ADMIN';

  if (alarms.length === 0) {
    return (
      <div
        id="alarm-table-empty"
        className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 shadow-xs"
      >
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">未发现符合筛选条件的告警</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          当前筛选条件下无活动或历史告警。您可以清空筛选器或重置查询关键字。
        </p>
      </div>
    );
  }

  const getSourceBadge = (alarm: Alarm) => {
    switch (alarm.source) {
      case 'INTERFACE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-blue-50 text-[#004287] border border-blue-200 font-medium">
            <span>接口服务</span>
            {alarm.isThirdParty && <span className="text-[10px] opacity-75">(第三方)</span>}
          </span>
        );
      case 'DEVICE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            <span>物理设备</span>
            {alarm.isThirdParty && <span className="text-[10px] opacity-75">(第三方)</span>}
          </span>
        );
      case 'DATA_QUALITY':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            <span>数据质量</span>
          </span>
        );
      case 'THRESHOLD':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
            <span>越限阈值</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
            <span>系统监测</span>
          </span>
        );
    }
  };

  const getSeverityPill = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span className="text-xs font-bold text-red-600 font-mono">CRITICAL</span>
          </div>
        );
      case 'MAJOR':
        return (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs font-bold text-amber-600 font-mono">MAJOR</span>
          </div>
        );
      case 'MINOR':
        return (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-bold text-blue-600 font-mono">MINOR</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-xs font-bold text-slate-500 font-mono">WARNING</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold select-none text-[11px]">
              <th className="py-3 px-4">等级 / 编号</th>
              <th className="py-3 px-4">告警现象与描述</th>
              <th className="py-3 px-4">来源与测点对象</th>
              <th className="py-3 px-4">SLA 履约计时 (时效规则)</th>
              <th className="py-3 px-4">状态</th>
              <th className="py-3 px-4">TraceId / 质量关联</th>
              <th className="py-3 px-4 text-right">处置动作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {alarms.map((alarm) => {
              const isCritical = alarm.severity === 'CRITICAL';
              const canAdminHandle = !isAdmin || alarm.source === 'INTERFACE';

              return (
                <tr
                  key={alarm.id}
                  id={`alarm-row-${alarm.id}`}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isCritical && alarm.status === 'PROCESSING'
                      ? 'bg-red-50/20'
                      : alarm.status === 'PENDING_ACK'
                      ? 'bg-amber-50/15'
                      : ''
                  }`}
                >
                  {/* 等级与编号 */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="space-y-1">
                      {getSeverityPill(alarm.severity)}
                      <span className="text-[11px] font-mono text-slate-500 block">
                        {alarm.alarmCode || alarm.id}
                      </span>
                    </div>
                  </td>

                  {/* 描述与触发时间 */}
                  <td className="py-3.5 px-4 align-top max-w-sm">
                    <div className="space-y-1">
                      <div
                        onClick={() => onSelectAlarm(alarm)}
                        className="font-bold text-slate-900 hover:text-[#004287] cursor-pointer line-clamp-1 leading-snug"
                        title={alarm.alarmTitle}
                      >
                        {alarm.alarmTitle}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {alarm.description || alarm.reason}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-0.5">
                        <span>首次: {alarm.firstOccurrenceTime}</span>
                        {alarm.handledBy && (
                          <>
                            <span>·</span>
                            <span className="font-sans text-slate-600">经手: {alarm.handledBy}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 来源与对象 */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="space-y-1">
                      <div>{getSourceBadge(alarm)}</div>
                      <div className="text-[11px] font-medium text-slate-800 line-clamp-1">
                        {alarm.deviceName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 line-clamp-1">
                        {alarm.adapterId ? `适配器: ${alarm.adapterId}` : alarm.pointId ? `测点: ${alarm.pointId}` : '现场总线'}
                      </div>
                    </div>
                  </td>

                  {/* SLA 计时 */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="space-y-1">
                      <SlaBadge alarm={alarm} size="sm" />
                      <div className="text-[10px] text-slate-400 font-mono">
                        截止: {alarm.slaDeadlineTime.split(' ')[1] || alarm.slaDeadlineTime}
                      </div>
                    </div>
                  </td>

                  {/* 状态 */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="space-y-1">
                      <StatusBadge status={alarm.status} size="sm" />
                      {alarm.linkedTaskCode && (
                        <span className="block text-[10px] text-blue-600 font-mono">
                          巡检: {alarm.linkedTaskCode}
                        </span>
                      )}
                      {alarm.linkedWorkOrderCode && (
                        <span className="block text-[10px] text-indigo-600 font-mono">
                          工单: {alarm.linkedWorkOrderCode}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* TraceId 与质量 */}
                  <td className="py-3.5 px-4 align-top font-mono text-[11px]">
                    <div className="space-y-1">
                      {alarm.traceId ? (
                        <span
                          className="inline-block text-[#004287] bg-blue-50 px-1.5 py-0.5 rounded text-[10px] border border-blue-100 truncate max-w-[140px]"
                          title={alarm.traceId}
                        >
                          {alarm.traceId}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px]">-</span>
                      )}

                      {alarm.qualityIssueId && (
                        <button
                          onClick={() => navigate('/data/quality')}
                          className="flex items-center gap-1 text-[10px] text-amber-700 hover:underline"
                        >
                          <span>{alarm.qualityIssueId}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}

                      {alarm.agentSuggestion && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1 rounded bg-purple-50 text-purple-700">
                          <Bot className="w-2.5 h-2.5" />
                          <span>Agent 建议</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 处置操作 */}
                  <td className="py-3.5 px-4 align-top text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        id={`btn-view-${alarm.id}`}
                        onClick={() => onSelectAlarm(alarm)}
                        className="px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-[11px] transition-colors"
                      >
                        详情
                      </button>

                      {/* 待确认阶段快捷动作 */}
                      {alarm.status === 'PENDING_ACK' && (
                        <>
                          <button
                            id={`btn-ack-${alarm.id}`}
                            disabled={isInspector || !canAdminHandle}
                            onClick={() => onOpenAction(alarm, 'ACK')}
                            className="px-2.5 py-1 rounded bg-[#004287] hover:bg-[#003366] text-white font-semibold text-[11px] transition-all disabled:opacity-40"
                          >
                            接单
                          </button>
                        </>
                      )}

                      {/* 处理中阶段快捷动作 */}
                      {alarm.status === 'PROCESSING' && (
                        <>
                          <button
                            id={`btn-dispatch-order-${alarm.id}`}
                            disabled={isInspector || !canAdminHandle}
                            onClick={() => onOpenAction(alarm, 'CONVERT_TO_WORK_ORDER')}
                            className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-medium text-[11px] disabled:opacity-40"
                            title="派发现场整改工单"
                          >
                            转工单
                          </button>
                          <button
                            id={`btn-resolve-${alarm.id}`}
                            disabled={isInspector || !canAdminHandle}
                            onClick={() => onOpenAction(alarm, 'RESOLVE_CLOSE')}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] disabled:opacity-40"
                          >
                            闭环
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
