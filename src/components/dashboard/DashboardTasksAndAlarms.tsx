import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { SlaTimer } from '../common/SlaTimer';
import { DashboardSimState } from './DashboardScopeBar';
import {
  Sparkles,
  AlertTriangle,
  ClipboardList,
  Wrench,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  FileText,
  User,
  AlertOctagon,
} from 'lucide-react';

interface DashboardTasksAndAlarmsProps {
  activeSimState: DashboardSimState;
}

export const DashboardTasksAndAlarms: React.FC<DashboardTasksAndAlarmsProps> = ({
  activeSimState,
}) => {
  const navigate = useNavigate();
  const { agentEvents, alarms, patrolTasks, workOrders, currentRole } = useAppStore();

  // Tab 状态：支持总览卡片或切换查看
  const [activeTab, setActiveTab] = useState<'AGENT' | 'ALARMS' | 'PATROL' | 'ORDERS'>('AGENT');

  // 如果处于无待办模拟态，将所有列表视为已完成清空
  const isNoTodoState = activeSimState === 'NO_TODO';

  // 1. Agent 待决策列表
  const pendingAgentEvents = isNoTodoState
    ? []
    : agentEvents.filter((e) => e.status === 'AWAITING_DECISION');

  // 2. 紧急告警 (CRITICAL / MAJOR 且未结案)
  const urgentAlarms = isNoTodoState
    ? []
    : alarms.filter(
        (a) =>
          (a.severity === 'CRITICAL' || a.severity === 'MAJOR') &&
          a.status !== 'CLOSED' &&
          a.status !== 'RESOLVED'
      );

  // 3. 待执行巡检 (待开始 或 执行中)
  const pendingPatrolTasks = isNoTodoState
    ? []
    : patrolTasks.filter((t) => t.status === 'PENDING_START' || t.status === 'IN_PROGRESS');

  // 4. 待复核工单 (待接单、处理中、待复核)
  const pendingWorkOrders = isNoTodoState
    ? []
    : workOrders.filter(
        (w) =>
          w.status === 'PENDING_ACCEPT' ||
          w.status === 'IN_PROGRESS' ||
          w.status === 'PENDING_REVIEW'
      );

  const totalPendingCount =
    pendingAgentEvents.length +
    urgentAlarms.length +
    pendingPatrolTasks.length +
    pendingWorkOrders.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 lg:p-5 shadow-xs space-y-4">
      {/* 头部导航与指标汇总徽章 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#004287] flex items-center justify-center border border-blue-200 font-bold text-xs">
            {totalPendingCount}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">运营待办与告警处置中心</h2>
            <p className="text-[11px] text-slate-400">
              覆盖 Agent 人工研判、设备紧急告警、现场巡检与消缺工单闭环
            </p>
          </div>
        </div>

        {/* 4 大分类选项卡标签 */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('AGENT')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'AGENT'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Agent 待决策</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                pendingAgentEvents.length > 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {pendingAgentEvents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALARMS')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'ALARMS'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>紧急告警</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                urgentAlarms.length > 0 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {urgentAlarms.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PATROL')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'PATROL'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
            <span>待执行巡检</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                pendingPatrolTasks.length > 0
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {pendingPatrolTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ORDERS')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'ORDERS'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-600" />
            <span>待复核工单</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                pendingWorkOrders.length > 0
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {pendingWorkOrders.length}
            </span>
          </button>
        </div>
      </div>

      {/* 无待办状态 (NO_TODO 状态) */}
      {totalPendingCount === 0 ? (
        <div className="py-12 px-4 text-center rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            全站无挂起待办事项 · 系统运行健康
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-4">
            当前无等待人工决策的 Agent 建议、无未处置紧急告警、现场巡检已全部收官、整改工单已归档复核。
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/agent-hub')}
              className="px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
            >
              查看 Agent 决策轨迹
            </button>
            <button
              type="button"
              onClick={() => navigate('/operations/records')}
              className="px-3 py-1.5 rounded bg-[#004287] text-white text-xs font-semibold hover:bg-blue-800"
            >
              查看历史点检与巡检记录
            </button>
          </div>
        </div>
      ) : (
        /* 列表展示区域 */
        <div className="space-y-3">
          {/* TAB 1: Agent 待决策事件 */}
          {activeTab === 'AGENT' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500">
                  共 <strong className="text-blue-700">{pendingAgentEvents.length}</strong> 项待人工决策事件（由人做决定，Agent 严禁自动执行）
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/agent-hub')}
                  className="text-xs text-[#004287] hover:underline font-semibold flex items-center gap-1"
                >
                  <span>进入 Agent Hub 事件协作中心</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {pendingAgentEvents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                  当前无待人工决策的 Agent 事件
                </div>
              ) : (
                pendingAgentEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            evt.agentPriority === 'P1'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : evt.agentPriority === 'P2'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {evt.agentPriority}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{evt.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">[{evt.agentName}]</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1 leading-snug">
                        {evt.aiSummary || evt.templateSummary}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-0.5">
                        <span>影响: {evt.revenueImpactEstimate || '评估中'}</span>
                        <span>·</span>
                        <span>置信度: {evt.confidenceScore}%</span>
                        <span>·</span>
                        <span className="text-blue-700 font-medium">SLA: {evt.sla}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => navigate('/agent-hub')}
                        className="px-3 py-1.5 rounded-lg bg-[#004287] hover:bg-[#003366] text-white text-xs font-semibold shadow-xs flex items-center gap-1"
                      >
                        <span>去决策</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: 紧急告警 */}
          {activeTab === 'ALARMS' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500">
                  共 <strong className="text-red-700">{urgentAlarms.length}</strong> 条紧急与重要告警需要核查处置
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/alarms')}
                  className="text-xs text-[#004287] hover:underline font-semibold flex items-center gap-1"
                >
                  <span>进入告警风控中心</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {urgentAlarms.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                  当前无紧急与重要告警
                </div>
              ) : (
                urgentAlarms.map((alm) => (
                  <div
                    key={alm.id}
                    className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            alm.severity === 'CRITICAL' ? 'bg-red-500 animate-ping' : 'bg-amber-500'
                          }`}
                        />
                        <span className="text-xs font-bold text-slate-900">{alm.alarmTitle}</span>
                        <span className="text-[10px] text-slate-400 font-mono">[{alm.alarmCode}]</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-700 font-mono">
                          {alm.deviceName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1 leading-snug">
                        {alm.description || alm.reason}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <SlaTimer deadlineStr={alm.slaDeadlineTime} severity={alm.severity} />
                      <StatusBadge status={alm.status} size="sm" />
                      <button
                        type="button"
                        onClick={() => navigate(`/alarms?search=${encodeURIComponent(alm.alarmCode || '')}`)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold shadow-2xs"
                      >
                        去处置
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: 待执行巡检 */}
          {activeTab === 'PATROL' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500">
                  共 <strong className="text-amber-700">{pendingPatrolTasks.length}</strong> 项日常或特巡任务在途
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/operations/tasks')}
                  className="text-xs text-[#004287] hover:underline font-semibold flex items-center gap-1"
                >
                  <span>进入巡检任务管理</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {pendingPatrolTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                  当前无在途或待执行的巡检任务
                </div>
              ) : (
                pendingPatrolTasks.map((tsk) => (
                  <div
                    key={tsk.id}
                    className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{tsk.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">[{tsk.taskCode}]</span>
                        {tsk.isOffline && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                            离线执行中
                          </span>
                        )}
                        {tsk.hasAbnormality && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200 font-bold">
                            含异常点位
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1 leading-snug">
                        {tsk.description}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-0.5">
                        <span>执行人: {tsk.assignee}</span>
                        <span>·</span>
                        <span>截止: {tsk.planDeadline}</span>
                        <span>·</span>
                        <span>
                          进度: {tsk.checkItems?.filter((c) => c.result !== 'NORMAL').length || 0} 异常 / {tsk.totalItems} 项
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <StatusBadge status={tsk.status} size="sm" />
                      <button
                        type="button"
                        onClick={() => navigate('/operations/tasks')}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold shadow-2xs"
                      >
                        查看明细
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: 待复核工单 */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500">
                  共 <strong className="text-emerald-700">{pendingWorkOrders.length}</strong> 张消缺整改工单正在推进
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/operations/work-orders')}
                  className="text-xs text-[#004287] hover:underline font-semibold flex items-center gap-1"
                >
                  <span>进入消缺工单管理</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {pendingWorkOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                  当前无在途或待复核的工单
                </div>
              ) : (
                pendingWorkOrders.map((wo) => (
                  <div
                    key={wo.id}
                    className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            wo.priority === 'CRITICAL'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {wo.priority}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{wo.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">[{wo.orderCode}]</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1 leading-snug">
                        {wo.issueDescription}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-0.5">
                        <span>责任人: {wo.assignee}</span>
                        <span>·</span>
                        <span>复核人: {wo.reviewer || '待指派'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <StatusBadge status={wo.status} size="sm" />
                      <button
                        type="button"
                        onClick={() => navigate('/operations/work-orders')}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold shadow-2xs"
                      >
                        去复核
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
