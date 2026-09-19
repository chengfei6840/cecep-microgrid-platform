import React, { useState } from 'react';
import {
  X,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Shield,
  Bot,
  Activity,
  FileText,
  Wrench,
  Radio,
  Share2,
  Calendar,
  AlertOctagon,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import { Alarm } from '../../types/domain';
import { StatusBadge } from '../common/StatusBadge';
import { SlaBadge } from './SlaBadge';
import { evaluateAlarmSla } from '../../utils/alarmSla';
import { AlarmActionMode } from './AlarmActionModal';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/AppContext';

interface AlarmDetailDrawerProps {
  alarm: Alarm | null;
  onClose: () => void;
  onOpenAction: (mode: AlarmActionMode) => void;
}

export const AlarmDetailDrawer: React.FC<AlarmDetailDrawerProps> = ({
  alarm,
  onClose,
  onOpenAction,
}) => {
  const navigate = useNavigate();
  const { currentRole } = useAppStore();
  const [copyFeedback, setCopyFeedback] = useState(false);

  if (!alarm) return null;

  const sla = evaluateAlarmSla(alarm);
  const isInspector = currentRole === 'INSPECTOR';
  const isAdmin = currentRole === 'ADMIN';
  const canAdminHandle = !isAdmin || alarm.source === 'INTERFACE';

  const handleCopyTraceId = () => {
    if (alarm.traceId) {
      navigator.clipboard?.writeText(alarm.traceId);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const getSourceLabel = (src: string, isThirdParty?: boolean, thirdPartySource?: string) => {
    switch (src) {
      case 'INTERFACE':
        return isThirdParty ? `接口 · ${thirdPartySource || '第三方云'}` : '接口服务 · 通信前置机';
      case 'DEVICE':
        return isThirdParty ? `设备 · ${thirdPartySource || '第三方网关'}` : '物理设备 · 现场终端';
      case 'DATA_QUALITY':
        return '数据质量 · 连续性校验';
      case 'THRESHOLD':
        return '越限阈值 · 负荷容量';
      default:
        return '监测告警';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div
        id={`alarm-drawer-${alarm.id}`}
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300"
      >
        {/* 顶部标题区 */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
                  alarm.severity === 'CRITICAL'
                    ? 'bg-red-600 text-white'
                    : alarm.severity === 'MAJOR'
                    ? 'bg-amber-500 text-white'
                    : alarm.severity === 'MINOR'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-500 text-white'
                }`}
              >
                {alarm.severity}
              </span>
              <StatusBadge status={alarm.status} size="sm" />
              <span className="text-[11px] text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded font-mono">
                {alarm.alarmCode || alarm.id}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-[#004287] border border-blue-200 font-medium">
                {getSourceLabel(alarm.source, alarm.isThirdParty, alarm.thirdPartySource)}
              </span>
            </div>

            <h2 className="text-base font-bold text-slate-900 leading-snug">
              {alarm.alarmTitle}
            </h2>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>设备：{alarm.deviceName}</span>
              <span>·</span>
              <span>站点：{alarm.siteName || '示范站'}</span>
            </div>
          </div>

          <button
            id="btn-close-alarm-drawer"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 中间滚动内容 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* 1. SLA 履约看板 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Clock className="w-4 h-4 text-[#004287]" />
                <span>SLA 时限履约监控</span>
              </div>
              <SlaBadge alarm={alarm} size="md" showDetails />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">首次触发</span>
                <span className="text-slate-700 font-medium">{alarm.firstOccurrenceTime}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">最近更新</span>
                <span className="text-slate-700 font-medium">{alarm.lastOccurrenceTime || alarm.firstOccurrenceTime}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">阶段目标</span>
                <span className="text-slate-700 font-medium">{sla.stageLabel}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">限时标准</span>
                <span className="text-[#004287] font-medium">
                  {alarm.severity === 'CRITICAL' ? '15m确认/30m处置' : '30m确认/2h处置'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-200/80 leading-relaxed">
              <strong className="text-slate-700 font-semibold">{sla.ruleExplanation}</strong>
              <br />
              当前状态说明：{sla.statusDescription}。未在时限内闭环将记录不可消除的 SLA 逾期标记。
            </p>
          </div>

          {/* 2. 异常证据链 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>现场异常证据链 (Telemetry & Error Trace)</span>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block mb-0.5">测点遥测测量值</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {alarm.evidenceDetails?.telemetryValue || '通信握手超时无返回'}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block mb-0.5">安全触发基线阈值</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {alarm.evidenceDetails?.thresholdValue || '正常心跳 ≤ 15s'}
                  </span>
                </div>
              </div>

              {alarm.evidenceDetails?.code && (
                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200/80 font-mono text-[11px]">
                  <span className="text-slate-500">异常特征码：</span>
                  <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded">
                    {alarm.evidenceDetails.code}
                  </span>
                </div>
              )}

              {alarm.evidenceDetails?.logSnippet && (
                <div className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] leading-relaxed overflow-x-auto shadow-inner">
                  <div className="text-slate-500 text-[10px] mb-1"># 原始通信日志抓包捕获</div>
                  <code>{alarm.evidenceDetails.logSnippet}</code>
                </div>
              )}

              {alarm.evidenceDetails?.impactSummary && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <strong className="font-semibold block mb-0.5">业务影响研判：</strong>
                  {alarm.evidenceDetails.impactSummary}
                </div>
              )}
            </div>
          </div>

          {/* 3. 关联对象与拓扑追踪 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <Share2 className="w-4 h-4 text-[#004287]" />
              <span>关联拓扑与 P03 链路追溯</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-[11px]">
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500">全链路追踪 TraceId：</span>
                {alarm.traceId ? (
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[#004287] bg-blue-50 px-2 py-0.5 rounded font-bold border border-blue-200">
                      {alarm.traceId}
                    </span>
                    <button
                      onClick={handleCopyTraceId}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                      title="复制 TraceId"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copyFeedback && <span className="text-emerald-600 text-[10px]">已复制</span>}
                  </div>
                ) : (
                  <span className="text-slate-400">无关联 traceId</span>
                )}
              </div>

              {alarm.adapterId && (
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500">关联采集适配器：</span>
                  <span className="font-mono text-slate-800 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                    {alarm.adapterId}
                  </span>
                </div>
              )}

              {alarm.pointId && (
                <div className="p-3 flex items-center justify-between">
                  <span className="text-slate-500">关联物理测点 / 标准编码：</span>
                  <span className="font-mono text-slate-800">
                    {alarm.pointId} ({alarm.standardCode || 'STANDARD'})
                  </span>
                </div>
              )}

              {alarm.qualityIssueId && (
                <div className="p-3 flex items-center justify-between bg-amber-50/40">
                  <span className="text-amber-800 font-medium">关联数据质量异常单：</span>
                  <button
                    onClick={() => navigate('/data/quality')}
                    className="inline-flex items-center gap-1 font-mono text-[#004287] hover:underline font-bold"
                  >
                    <span>{alarm.qualityIssueId}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}

              {alarm.linkedTaskCode && (
                <div className="p-3 flex items-center justify-between bg-blue-50/40">
                  <span className="text-blue-800 font-medium">已转派专项巡检任务：</span>
                  <span className="font-mono text-[#004287] font-bold bg-white px-2 py-0.5 rounded border border-blue-200">
                    {alarm.linkedTaskCode}
                  </span>
                </div>
              )}

              {alarm.linkedWorkOrderCode && (
                <div className="p-3 flex items-center justify-between bg-indigo-50/40">
                  <span className="text-indigo-800 font-medium">已转派现场整改工单：</span>
                  <span className="font-mono text-indigo-700 font-bold bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {alarm.linkedWorkOrderCode}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 4. Agent 决策研判建议 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Bot className="w-4 h-4 text-purple-600" />
                <span>Agent 智能研判与处置建议</span>
              </div>
              <button
                onClick={() => navigate('/agent-hub')}
                className="text-[#004287] hover:underline inline-flex items-center gap-1 text-[11px] font-medium"
              >
                <span>前往 Agent 决策中心</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {alarm.agentSuggestion ? (
              <div className="bg-purple-50/60 rounded-xl border border-purple-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                    {alarm.agentAnalysisStatus === 'AWAITING_DECISION'
                      ? '待人工采纳决策'
                      : alarm.agentAnalysisStatus === 'ANALYZED'
                      ? '已完成特征归因'
                      : '研判就绪'}
                  </span>
                  {alarm.agentConfidenceScore && (
                    <span className="text-[11px] font-mono text-purple-900 font-bold">
                      置信度: {alarm.agentConfidenceScore}%
                    </span>
                  )}
                </div>

                <p className="text-purple-950 text-xs leading-relaxed font-medium">
                  {alarm.agentSuggestion}
                </p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-[11px]">
                暂无 Agent 自动研判记录或该级别告警无需 AI 辅助推演。
              </div>
            )}
          </div>

          {/* 5. 审计与处置轨迹时间线 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <Calendar className="w-4 h-4 text-[#004287]" />
              <span>不可篡改审计与流转轨迹</span>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {alarm.timeline && alarm.timeline.length > 0 ? (
                alarm.timeline.map((item, idx) => (
                  <div key={idx} className="relative group">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#004287] ring-4 ring-white" />
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                        <span>{item.time}</span>
                        <span className="font-sans font-medium text-slate-600">{item.operator}</span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs">{item.action}</div>
                      {item.note && (
                        <p className="text-slate-600 text-[11px] leading-relaxed pt-0.5">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="relative group">
                  <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-white" />
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-500 text-[11px]">
                    首次触发: {alarm.firstOccurrenceTime} · 系统守护进程触发记录
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部动作操作栏 */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500">
            {isInspector ? (
              <span className="text-amber-700 font-medium">巡检员在 Web 端只读</span>
            ) : !canAdminHandle ? (
              <span className="text-slate-500">管理员仅限处理接口类告警</span>
            ) : (
              <span>人工决策闭环入口</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 待确认状态的操作 */}
            {alarm.status === 'PENDING_ACK' && (
              <>
                <button
                  id="btn-drawer-ignore"
                  disabled={isInspector || !canAdminHandle}
                  onClick={() => onOpenAction('IGNORE')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium disabled:opacity-40 transition-colors"
                >
                  忽略
                </button>
                <button
                  id="btn-drawer-false-alarm"
                  disabled={isInspector || !canAdminHandle}
                  onClick={() => onOpenAction('FALSE_ALARM')}
                  className="px-3 py-1.5 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-medium disabled:opacity-40 transition-colors"
                >
                  标记误报
                </button>
                <button
                  id="btn-drawer-ack"
                  disabled={isInspector || !canAdminHandle}
                  onClick={() => onOpenAction('ACK')}
                  className="px-4 py-1.5 rounded-lg bg-[#004287] hover:bg-[#003366] text-white text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors"
                >
                  接单确认
                </button>
              </>
            )}

            {/* 处理中状态的操作 */}
            {alarm.status === 'PROCESSING' && (
              <>
                <button
                  id="btn-drawer-to-patrol"
                  disabled={isInspector || !canAdminHandle}
                  onClick={() => onOpenAction('CONVERT_TO_PATROL')}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#004287] hover:bg-blue-100 border border-blue-200 text-xs font-semibold disabled:opacity-40 transition-colors"
                >
                  转专项巡检
                </button>
                <button
                  id="btn-drawer-to-workorder"
                  disabled={isInspector || !canAdminHandle}
                  onClick={() => onOpenAction('CONVERT_TO_WORK_ORDER')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold disabled:opacity-40 transition-colors"
                >
                  转整改工单
                </button>
                <button
                  id="btn-drawer-resolve"
                  disabled={isInspector || !canAdminHandle}
                  onClick={() => onOpenAction('RESOLVE_CLOSE')}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors"
                >
                  办结并关闭
                </button>
              </>
            )}

            {/* 已处理或已关闭状态 */}
            {(alarm.status === 'RESOLVED' ||
              alarm.status === 'CLOSED' ||
              alarm.status === 'FALSE_ALARM' ||
              alarm.status === 'IGNORED') && (
              <span className="text-xs text-slate-500 font-mono">
                已于 {alarm.lastOccurrenceTime || alarm.firstOccurrenceTime} 终结流程
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
