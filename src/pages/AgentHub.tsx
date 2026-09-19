import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Bot,
  AlertTriangle,
  TrendingDown,
  Wrench,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Layers,
  FileText,
  History,
  AlertOctagon,
  Sparkles,
  Link,
  ExternalLink,
  Archive,
  Eye,
  Info,
  Zap,
} from 'lucide-react';
import { AgentEvent, AgentEventStatus, AgentPriority, AgentType } from '../types/domain';

export const AgentHub: React.FC = () => {
  const navigate = useNavigate();
  const {
    agentEvents,
    agentDegradedMode,
    toggleAgentDegradedMode,
    adoptAgentEvent,
    archiveAgentEvent,
    workOrders,
    patrolTasks,
    currentRole,
    currentUser,
  } = useAppStore();

  // 选中事件 ID
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // 筛选与搜索
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 右栏审计轨迹展开/折叠状态
  const [isAuditCollapsed, setIsAuditCollapsed] = useState<boolean>(false);

  // 人工决策操作抽屉/模态状态
  const [decisionActionModal, setDecisionActionModal] = useState<{
    isOpen: boolean;
    eventId: string;
    actionType: 'DISPATCH_PATROL' | 'DISPATCH_ORDER' | 'DEFER' | 'REJECT';
    title: string;
    description: string;
    requiresReason: boolean;
    assignee?: string;
    deadline?: string;
  } | null>(null);

  const [decisionReason, setDecisionReason] = useState<string>('');
  const [customAssignee, setCustomAssignee] = useState<string>('林志强 (巡检员)');
  const [customDeadline, setCustomDeadline] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  // 归档阻断提示或确认弹窗
  const [archiveModal, setArchiveModal] = useState<{
    isOpen: boolean;
    eventId: string;
    note: string;
  } | null>(null);

  // 排序与筛选列表（按风险与收益影响排序：P1 > P2 > P3；同级按未处置在前）
  const filteredEvents = useMemo(() => {
    return agentEvents
      .filter((ev) => {
        if (filterType !== 'ALL' && ev.agentType !== filterType) return false;
        if (filterPriority !== 'ALL' && ev.agentPriority !== filterPriority) return false;
        if (filterStatus !== 'ALL') {
          if (filterStatus === 'PENDING' && ev.status !== 'AWAITING_DECISION' && ev.status !== 'NEW' && ev.status !== 'ANALYZING') {
            return false;
          }
          if (filterStatus === 'DISPATCHED' && ev.status !== 'DISPATCHED_ORDER' && ev.status !== 'DISPATCHED_PATROL' && ev.status !== 'ACCEPTED') {
            return false;
          }
          if (filterStatus === 'ARCHIVED' && ev.status !== 'ARCHIVED') return false;
          if (filterStatus === 'DEFERRED' && ev.status !== 'DEFERRED') return false;
          if (filterStatus === 'REJECTED' && ev.status !== 'REJECTED') return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = ev.title.toLowerCase().includes(q);
          const matchObj = ev.targetObject.toLowerCase().includes(q);
          const matchId = ev.id.toLowerCase().includes(q);
          const matchTrace = ev.traceId.toLowerCase().includes(q);
          return matchTitle || matchObj || matchId || matchTrace;
        }
        return true;
      })
      .sort((a, b) => {
        // 优先级排序 P1 > P2 > P3
        const pOrder: Record<AgentPriority, number> = { P1: 3, P2: 2, P3: 1 };
        const pDiff = (pOrder[b.agentPriority] || 1) - (pOrder[a.agentPriority] || 1);
        if (pDiff !== 0) return pDiff;

        // 待决策状态优先
        const isPendingA = a.status === 'AWAITING_DECISION' || a.status === 'NEW';
        const isPendingB = b.status === 'AWAITING_DECISION' || b.status === 'NEW';
        if (isPendingA && !isPendingB) return -1;
        if (!isPendingA && isPendingB) return 1;

        return 0;
      });
  }, [agentEvents, filterType, filterPriority, filterStatus, searchQuery]);

  // 默认高亮选中第一条
  const activeEvent = useMemo(() => {
    if (selectedEventId) {
      const found = agentEvents.find((e) => e.id === selectedEventId);
      if (found) return found;
    }
    return filteredEvents[0] || agentEvents[0] || null;
  }, [selectedEventId, agentEvents, filteredEvents]);

  // 获取关联的工单与巡检任务信息（用于闭环及阻断校验）
  const linkedWorkOrder = useMemo(() => {
    if (!activeEvent) return null;
    return workOrders.find(
      (wo) =>
        wo.id === activeEvent.linkedWorkOrderId ||
        wo.orderCode === activeEvent.linkedWorkOrderCode ||
        wo.traceId === activeEvent.traceId
    );
  }, [activeEvent, workOrders]);

  const linkedPatrolTask = useMemo(() => {
    if (!activeEvent) return null;
    return patrolTasks.find(
      (pt) =>
        pt.id === activeEvent.linkedTaskId ||
        pt.taskCode === activeEvent.linkedTaskCode ||
        pt.traceId === activeEvent.traceId
    );
  }, [activeEvent, patrolTasks]);

  // 决策提交处理
  const handleConfirmDecision = async () => {
    if (!decisionActionModal) return;
    const { eventId, actionType, requiresReason } = decisionActionModal;
    if (requiresReason && !decisionReason.trim()) {
      setActionError('此操作必须填写决策与审查理由，以留存审计合规凭证。');
      return;
    }

    const res = await adoptAgentEvent(
      eventId,
      actionType,
      decisionReason.trim() || '运营人员人工复核采纳',
      {
        assignee: customAssignee,
        deadline: customDeadline,
      }
    );

    if (res.success) {
      setActionSuccessMsg(res.message);
      setDecisionActionModal(null);
      setDecisionReason('');
      setActionError('');
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } else {
      setActionError(res.message);
    }
  };

  // 归档处理
  const handleConfirmArchive = async () => {
    if (!archiveModal) return;
    const res = await archiveAgentEvent(archiveModal.eventId, archiveModal.note);
    if (res.success) {
      setActionSuccessMsg(res.message);
      setArchiveModal(null);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } else {
      setActionError(res.message);
    }
  };

  // 辅助渲染优先级徽章 (P1 / P2 / P3)
  const renderPriorityBadge = (priority: AgentPriority) => {
    if (priority === 'P1') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
          P1 紧急
        </span>
      );
    }
    if (priority === 'P2') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          P2 关注
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        P3 一般
      </span>
    );
  };

  // 辅助渲染状态徽章
  const renderStatusBadge = (status: AgentEventStatus) => {
    switch (status) {
      case 'NEW':
      case 'ANALYZING':
      case 'AWAITING_DECISION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            待人工决策
          </span>
        );
      case 'DISPATCHED_ORDER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Wrench className="w-3 h-3 text-blue-600" />
            已转整改工单
          </span>
        );
      case 'DISPATCHED_PATROL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Layers className="w-3 h-3 text-indigo-600" />
            已转专项巡检
          </span>
        );
      case 'DEFERRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3 h-3 text-slate-500" />
            已暂缓观察
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            已人工驳回
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            已闭环归档
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  // 渲染 Agent 类别标签
  const renderAgentTypeBadge = (type: AgentType) => {
    switch (type) {
      case 'DATA_INGESTION':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <Database className="w-3 h-3" />
            数据接入 Agent
          </span>
        );
      case 'OPERATIONS_REVENUE':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <TrendingDown className="w-3 h-3" />
            运营收益 Agent
          </span>
        );
      case 'PATROL_MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Wrench className="w-3 h-3" />
            运维巡检 Agent
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 顶部控制栏与标题 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-50 text-[#004287]">
            <Bot className="w-5 h-5" />
          </span>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Agent Hub 事件协作中心
          </h1>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-[#004287] font-semibold border border-blue-200">
            人机协作决策平台
          </span>
        </div>

        {/* 降级模式警示提示横条 */}
        {agentDegradedMode && (
          <div className="mt-3 p-2.5 bg-amber-50/90 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>当前处于 Agent 降级模式：</strong>
                已自动隐藏不可靠的大模型生成内容与推论，保留系统固化的时序规则特征证据与模板摘要。基础监测、告警处置、巡检派单与收益核算流程完全不受影响。
              </span>
            </div>
            <button
              onClick={toggleAgentDegradedMode}
              className="text-xs text-amber-800 hover:text-amber-950 font-semibold underline shrink-0 cursor-pointer"
            >
              恢复正常模式
            </button>
          </div>
        )}

        {/* 成功操作提示 */}
        {actionSuccessMsg && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* 失败操作提示 */}
        {actionError && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError('')}
              className="text-xs text-rose-700 hover:text-rose-950 underline shrink-0 cursor-pointer"
            >
              我知道了
            </button>
          </div>
        )}
      </div>

      {/* 三栏工作台主体结构 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ===================== 左栏：事件卡片流 (按风险与收益影响排序) ===================== */}
        <div className="lg:col-span-4 space-y-3">
          {/* 筛选与搜索工具条 */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索事件标题/对象/ID/批次号..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#004287] focus:border-[#004287]"
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 focus:outline-none"
              >
                <option value="ALL">全部 Agent</option>
                <option value="DATA_INGESTION">数据接入</option>
                <option value="OPERATIONS_REVENUE">运营收益</option>
                <option value="PATROL_MAINTENANCE">运维巡检</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 focus:outline-none"
              >
                <option value="ALL">全部优先级</option>
                <option value="P1">P1 紧急</option>
                <option value="P2">P2 关注</option>
                <option value="P3">P3 一般</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 focus:outline-none"
              >
                <option value="ALL">全部状态</option>
                <option value="PENDING">待决策</option>
                <option value="DISPATCHED">已派发</option>
                <option value="DEFERRED">已暂缓</option>
                <option value="REJECTED">已驳回</option>
                <option value="ARCHIVED">已归档</option>
              </select>
            </div>
          </div>

          {/* 事件列表统计计数 */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
            <span>共 {filteredEvents.length} 项事件</span>
            <span className="text-[11px]">按风险与收益影响排序</span>
          </div>

          {/* 卡片容器 */}
          <div className="space-y-2.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {filteredEvents.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-xs text-slate-500 space-y-2">
                <Bot className="w-8 h-8 text-slate-300 mx-auto" />
                <p>未找到符合条件的 Agent 协作事件</p>
                <button
                  onClick={() => {
                    setFilterType('ALL');
                    setFilterPriority('ALL');
                    setFilterStatus('ALL');
                    setSearchQuery('');
                  }}
                  className="text-blue-600 hover:underline text-xs"
                >
                  重置筛选条件
                </button>
              </div>
            ) : (
              filteredEvents.map((ev) => {
                const isSelected = activeEvent?.id === ev.id;
                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEventId(ev.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left relative ${
                      isSelected
                        ? 'bg-blue-50/50 border-[#004287] shadow-xs ring-1 ring-[#004287]/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    {/* 顶部标签行：优先级 + Agent 类型 + 状态 */}
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {renderPriorityBadge(ev.agentPriority)}
                        {renderAgentTypeBadge(ev.agentType)}
                      </div>
                      {renderStatusBadge(ev.status)}
                    </div>

                    {/* 标题 */}
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">
                      {ev.title}
                    </h3>

                    {/* 对象与触发时间 */}
                    <div className="text-[11px] text-slate-500 space-y-0.5 mb-2">
                      <div className="truncate">
                        <span className="text-slate-400">研判对象：</span>
                        <span className="font-mono text-slate-700">{ev.targetObject}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span>{ev.triggerTime || '2026-09-05 05:42'}</span>
                        <span className="font-mono text-slate-400">ID: {ev.id}</span>
                      </div>
                    </div>

                    {/* 预估收益影响卡片 */}
                    <div className="p-2 rounded bg-slate-50/90 border border-slate-100 text-[11px] flex items-center justify-between gap-2">
                      <span className="text-slate-500 text-[10px]">预估收益影响：</span>
                      <span className={`font-semibold ${
                        ev.revenueImpactEstimate.includes('-')
                          ? 'text-rose-600'
                          : ev.revenueImpactEstimate.includes('+')
                          ? 'text-emerald-600'
                          : 'text-slate-700'
                      }`}>
                        {ev.revenueImpactEstimate}
                      </span>
                    </div>

                    {/* 选中的指示小条 */}
                    {isSelected && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#004287] rounded-l" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ===================== 中栏：选中事件详情、诊断推理与人工决策链路 ===================== */}
        <div className={isAuditCollapsed ? 'lg:col-span-8' : 'lg:col-span-5'}>
          {activeEvent ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-5">
              {/* 事件标题与核心元数据 */}
              <div className="border-b border-slate-100 pb-4 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {renderPriorityBadge(activeEvent.agentPriority)}
                    {renderAgentTypeBadge(activeEvent.agentType)}
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-mono text-slate-500">ID: {activeEvent.id}</span>
                  </div>
                  {renderStatusBadge(activeEvent.status)}
                </div>

                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {activeEvent.title}
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">研判对象</span>
                    <span className="font-semibold text-slate-800 font-mono text-[11px] truncate block">
                      {activeEvent.targetObject}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">触发时间 / SLA 限时</span>
                    <span className="text-slate-700 text-[11px] block">
                      {activeEvent.sla || activeEvent.triggerTime || '2026-09-05 06:12:15'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">全局可追溯流水 (TraceId)</span>
                    <span className="font-mono text-slate-700 text-[11px] truncate block" title={activeEvent.traceId}>
                      {activeEvent.traceId}
                    </span>
                  </div>
                </div>
              </div>

              {/* 规则证据专区 (客观事实规则，永不因降级隐藏) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>客观规则匹配证据 (时序引擎事实)：</span>
                  </div>
                  {activeEvent.ruleMatched && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {activeEvent.ruleMatched}
                    </span>
                  )}
                </div>

                <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200 space-y-1.5">
                  {activeEvent.ruleEvidence.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI 诊断研判与置信度 (降级时隐藏 AI 扩展，转为模板摘要) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Bot className="w-4 h-4 text-purple-600" />
                    <span>
                      {agentDegradedMode ? '规则专家模板摘要 (降级保护)：' : 'Agent 辅助诊断研判 (AI)：'}
                    </span>
                  </div>
                  {!agentDegradedMode && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 text-[11px]">置信度评分:</span>
                      <span className="px-2 py-0.5 rounded-full font-mono font-bold text-xs bg-purple-50 text-purple-700 border border-purple-200">
                        {activeEvent.confidenceScore}%
                      </span>
                    </div>
                  )}
                </div>

                {agentDegradedMode ? (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3 text-xs text-amber-900 space-y-1.5">
                    <div className="font-semibold text-amber-800 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      <span>已启用降级安全保护，不可靠的自生成研判已抑制</span>
                    </div>
                    <p className="leading-relaxed text-amber-950 font-medium">
                      {activeEvent.templateSummary ||
                        '【规则模板】：当前设备命中通信/数据异常规则，触发业务保障机制，建议由运营人员复核证据后安排就地特巡。'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-purple-50/40 border border-purple-100 rounded-lg p-3 text-xs text-slate-800 space-y-2">
                    <p className="leading-relaxed font-sans">{activeEvent.aiSummary}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-purple-100/60">
                      <span>来源：微电网多模态 Agent 研判引擎</span>
                      <span className="text-purple-700 font-medium">
                        提示：置信度供人工审查参考，不得替代审批决策
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 收益与业务影响分析 */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">预估收益与财务影响</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {activeEvent.revenueImpactEstimate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Agent 推荐处置动作</span>
                  <span className="font-semibold text-blue-900 text-xs mt-0.5 block">
                    {activeEvent.suggestedAction}
                  </span>
                </div>
              </div>

              {/* 关联业务闭环入口 (工单/巡检/告警) */}
              {(activeEvent.relatedAlarmCode || activeEvent.linkedWorkOrderId || activeEvent.linkedTaskId || activeEvent.relatedQualityIssueId) && (
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs space-y-2">
                  <div className="font-bold text-blue-950 flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-blue-600" />
                    <span>关联业务对象与链路闭环：</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {activeEvent.relatedAlarmCode && (
                      <button
                        onClick={() => navigate('/alarms')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-200 text-blue-800 rounded hover:bg-blue-50 font-medium"
                      >
                        <span>关联告警: {activeEvent.relatedAlarmCode}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    {activeEvent.linkedWorkOrderId && (
                      <button
                        onClick={() => navigate('/operations/work-orders')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-indigo-200 text-indigo-800 rounded hover:bg-indigo-50 font-medium"
                      >
                        <span>关联工单: {activeEvent.linkedWorkOrderCode || activeEvent.linkedWorkOrderId}</span>
                        <span className={`text-[10px] px-1 py-0.2 rounded ${linkedWorkOrder?.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {linkedWorkOrder?.status === 'CLOSED' ? '已闭环' : '处置中'}
                        </span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    {activeEvent.linkedTaskId && (
                      <button
                        onClick={() => navigate('/operations/patrol-tasks')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-purple-200 text-purple-800 rounded hover:bg-purple-50 font-medium"
                      >
                        <span>关联巡检: {activeEvent.linkedTaskCode || activeEvent.linkedTaskId}</span>
                        <span className={`text-[10px] px-1 py-0.2 rounded ${linkedPatrolTask?.status === 'ARCHIVED' || linkedPatrolTask?.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {linkedPatrolTask?.status === 'ARCHIVED' ? '已归档' : linkedPatrolTask?.status === 'SUBMITTED' ? '已提交' : '执行中'}
                        </span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 人工决策控制区 (严禁自动执行，由人决定下一步) */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>人工决策控制台 (人机协同)：</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    操作人：{currentUser.name} ({currentRole})
                  </span>
                </div>

                {/* 状态为待决策时：支持 采纳转工单、采纳转巡检、暂缓观察、驳回建议 */}
                {activeEvent.status === 'AWAITING_DECISION' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDecisionActionModal({
                          isOpen: true,
                          eventId: activeEvent.id,
                          actionType: 'DISPATCH_ORDER',
                          title: '采纳 Agent 研判并向现场派发整改工单',
                          description:
                            '系统将根据此 Agent 事件的规则依据、研判摘要和关联告警，生成消缺整改工单并派发给现场运维责任人。',
                          requiresReason: false,
                          assignee: '林志强 (巡检员)',
                        });
                        setDecisionReason('经运营审核，告警与研判证据确凿，派发整改工单由现场排查消缺。');
                      }}
                      className="px-3 py-2 bg-[#004287] hover:bg-[#003366] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>采纳转工单</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDecisionActionModal({
                          isOpen: true,
                          eventId: activeEvent.id,
                          actionType: 'DISPATCH_PATROL',
                          title: '采纳 Agent 建议并生成专项特巡任务',
                          description:
                            '将生成一条针对当前对象的专项巡检任务，包含外观检查与通信接线测量项，要求现场巡检员实地核验。',
                          requiresReason: false,
                          assignee: '林志强 (巡检员)',
                        });
                        setDecisionReason('采纳巡检建议，安排现场巡检员复核设备运行状态。');
                      }}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>采纳转巡检</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDecisionActionModal({
                          isOpen: true,
                          eventId: activeEvent.id,
                          actionType: 'DEFER',
                          title: '暂缓当前事件处置并保持观察',
                          description:
                            '判定当前状态无需立即派发现场，暂时保持观察。此操作必须填写暂缓理由并记录于审计轨迹。',
                          requiresReason: true,
                        });
                        setDecisionReason('数据指标波动较小或属于外部偶发抖动，暂缓 1 个采集周期后再次评估。');
                      }}
                      className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>暂缓观察</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDecisionActionModal({
                          isOpen: true,
                          eventId: activeEvent.id,
                          actionType: 'REJECT',
                          title: '驳回或忽略此 Agent 建议',
                          description:
                            '人工判定当前研判结论不符合现场实际（例如已知停电检修或误报）。此操作必须填写驳回理由！',
                          requiresReason: true,
                        });
                        setDecisionReason('经现场电话确认属于计划内停电排查，不属于设备故障，予以驳回。');
                      }}
                      className="px-3 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>驳回建议</span>
                    </button>
                  </div>
                )}

                {/* 已派发工单或巡检：支持归档操作与闭环核验 */}
                {(activeEvent.status === 'DISPATCHED_ORDER' || activeEvent.status === 'DISPATCHED_PATROL' || activeEvent.status === 'DEFERRED' || activeEvent.status === 'REJECTED') && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-600">
                      <span>当前事件状态已流转。若现场整改工单已闭环确认，可正式归档此事件。</span>
                      {linkedWorkOrder && linkedWorkOrder.status !== 'CLOSED' && (
                        <div className="text-[11px] text-amber-700 mt-1 font-medium">
                          ⚠️ 阻断提示：关联工单【{linkedWorkOrder.orderCode}】尚未关闭（当前状态: {linkedWorkOrder.status}），归档将被拦截。
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // 如果有工单未关闭，先弹出提示
                        if (linkedWorkOrder && linkedWorkOrder.status !== 'CLOSED') {
                          setActionError(`阻断归档：关联整改工单【${linkedWorkOrder.orderCode}】处于【${linkedWorkOrder.status}】状态，尚未正式闭环，不可归档！请先在工单中心完成复核与关闭。`);
                          return;
                        }
                        setArchiveModal({
                          isOpen: true,
                          eventId: activeEvent.id,
                          note: '运营人员现场复核整改完成，正式予以归档闭环。',
                        });
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ml-3"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>确认归档</span>
                    </button>
                  </div>
                )}

                {activeEvent.status === 'ARCHIVED' && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>此事件已完成人工决策与现场闭环，正式归档入库。</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-mono">
                      {activeEvent.archiveNote || '已闭环'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
              请从左侧选择一个 Agent 事件以查看详细推理与人工决策面板
            </div>
          )}
        </div>

        {/* ===================== 右栏：操作审计轨迹 (支持折叠) ===================== */}
        <div className={isAuditCollapsed ? 'lg:col-span-12' : 'lg:col-span-3'}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <History className="w-4 h-4 text-slate-600" />
                <span>事件完整审计轨迹</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditCollapsed((prev) => !prev)}
                className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                title={isAuditCollapsed ? '展开审计栏' : '折叠审计栏'}
              >
                {isAuditCollapsed ? (
                  <>
                    <span>展开</span>
                    <ChevronRight className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>折叠</span>
                    <ChevronLeft className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>

            {/* 审计流水内容 */}
            {!isAuditCollapsed && (
              <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                {activeEvent ? (
                  activeEvent.actionHistory && activeEvent.actionHistory.length > 0 ? (
                    <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {activeEvent.actionHistory.map((rec, idx) => (
                        <div key={idx} className="relative text-xs space-y-1">
                          {/* 节点原点 */}
                          <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-1 ring-blue-300" />
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-800">{rec.action}</span>
                            <span className="text-[10px]">{rec.time}</span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            <span className="text-slate-400">操作人：</span>
                            <span className="font-medium text-slate-700">{rec.operator}</span>
                          </div>
                          {rec.note && (
                            <div className="p-2 rounded bg-slate-50 border border-slate-100 text-[11px] text-slate-700 leading-relaxed">
                              {rec.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 py-4 text-center">暂无决策流转历史</div>
                  )
                ) : (
                  <div className="text-xs text-slate-400 py-4 text-center">请先选择事件</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================== 人工决策动作确认弹窗 ===================== */}
      {decisionActionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#004287]" />
                <span>{decisionActionModal.title}</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {decisionActionModal.description}
              </p>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* 派工相关额外配置 */}
              {(decisionActionModal.actionType === 'DISPATCH_ORDER' ||
                decisionActionModal.actionType === 'DISPATCH_PATROL') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      执行责任人
                    </label>
                    <input
                      type="text"
                      value={customAssignee}
                      onChange={(e) => setCustomAssignee(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      时限要求
                    </label>
                    <input
                      type="text"
                      value={customDeadline}
                      onChange={(e) => setCustomDeadline(e.target.value)}
                      placeholder="默认按照 SLA 限时"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {/* 理由填写（暂缓和驳回必须填写） */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  决策与审查理由 {decisionActionModal.requiresReason && <span className="text-rose-500">* (必填)</span>}
                </label>
                <textarea
                  rows={3}
                  value={decisionReason}
                  onChange={(e) => {
                    setDecisionReason(e.target.value);
                    if (actionError) setActionError('');
                  }}
                  placeholder={
                    decisionActionModal.requiresReason
                      ? '请详细填写理由，系统将作为审计事实沉淀...'
                      : '请填写审查说明（可选）...'
                  }
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#004287] focus:outline-none"
                />
              </div>

              {actionError && (
                <div className="p-2 bg-rose-50 text-rose-800 rounded text-[11px] border border-rose-200 flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-500 leading-relaxed">
                提示：您的每一次人工决策都将绑定当前操作人账号（{currentUser.name}）并生成不可篡改的审计日志。
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDecisionActionModal(null);
                  setActionError('');
                }}
                className="px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                className="px-4 py-1.5 bg-[#004287] hover:bg-[#003366] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                确认并提交执行
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== 确认归档弹窗 ===================== */}
      {archiveModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Archive className="w-4 h-4 text-emerald-600" />
                <span>确认归档此 Agent 事件？</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                归档后事件将正式转入历史存档，不可再次流转。系统已自动验证关联工单状态。
              </p>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  归档说明与复核备注
                </label>
                <textarea
                  rows={2}
                  value={archiveModal.note}
                  onChange={(e) =>
                    setArchiveModal((prev) => (prev ? { ...prev, note: e.target.value } : null))
                  }
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setArchiveModal(null)}
                className="px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-200/60 rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
              >
                确认归档
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
