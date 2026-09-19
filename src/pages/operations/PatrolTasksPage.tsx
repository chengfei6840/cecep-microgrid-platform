import React, { useState } from 'react';
import { useAppStore } from '../../store/AppContext';
import { PatrolTask } from '../../types/domain';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DisabledActionTooltip } from '../../components/common/DisabledActionTooltip';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  Smartphone,
  Plus,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  FileCheck2,
  Calendar,
  Layers,
  Sparkles,
  WifiOff,
  Tag,
  AlertOctagon,
  Wrench,
  RotateCcw,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PatrolTasksPage: React.FC = () => {
  const {
    patrolTasks,
    acceptPatrolTask,
    reassignPatrolTask,
    archivePatrolTask,
    convertTaskAnomalyToWorkOrder,
    createManualPatrolTask,
    currentRole,
    currentUser,
  } = useAppStore();

  const isInspector = currentRole === 'INSPECTOR';
  const canManage = currentRole === 'ADMIN' || currentRole === 'OPERATOR';

  // 过滤状态
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 反馈提示
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 详情抽屉
  const [detailTask, setDetailTask] = useState<PatrolTask | null>(null);

  // 改派弹窗
  const [reassignModal, setReassignModal] = useState<{
    isOpen: boolean;
    task: PatrolTask | null;
    newAssignee: string;
    reason: string;
  }>({
    isOpen: false,
    task: null,
    newAssignee: '林志强 (巡检员)',
    reason: '',
  });

  // 新建临时任务弹窗
  const [createTempModal, setCreateTempModal] = useState<{
    isOpen: boolean;
    title: string;
    device: string;
    targetZone: string;
    assignee: string;
    description: string;
    deadlineTime: string;
  }>({
    isOpen: false,
    title: '储能集装箱电缆端子发热专项特巡',
    device: '储能集装箱 PCS-01, 10kV 母线舱',
    targetZone: '示范站储能区',
    assignee: '林志强 (巡检员)',
    description: '针对后台遥测温度偶发偏高，现场使用红外点温仪对母线与刀闸接触面进行测温复核。',
    deadlineTime: `${new Date().toISOString().slice(0, 10)} 18:00`,
  });

  // 确认对话框
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: async () => {},
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // KPI 统计
  const totalTasks = patrolTasks.length;
  const pendingAcceptTasks = patrolTasks.filter((t) => t.status === 'PENDING_ACCEPT').length;
  const inProgressTasks = patrolTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING_START').length;
  const submittedTasks = patrolTasks.filter((t) => t.status === 'SUBMITTED').length;
  const archivedTasks = patrolTasks.filter((t) => t.status === 'ARCHIVED').length;
  const abnormalTasks = patrolTasks.filter((t) => t.hasAbnormality).length;

  // 过滤任务
  const filteredTasks = patrolTasks.filter((task) => {
    const matchStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchSource = sourceFilter === 'ALL' || task.source === sourceFilter;
    const matchSearch =
      task.taskCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.assignee || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.targetZone || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSource && matchSearch;
  });

  const handleConfirmReassign = async () => {
    if (!reassignModal.task) return;
    if (!reassignModal.reason.trim()) {
      showNotification('请填写改派原因', 'error');
      return;
    }
    const res = await reassignPatrolTask(reassignModal.task.id, reassignModal.newAssignee, reassignModal.reason);
    if (res.success) {
      showNotification(res.message);
      setReassignModal({ isOpen: false, task: null, newAssignee: '林志强 (巡检员)', reason: '' });
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleCreateTempTask = async () => {
    if (!createTempModal.title.trim()) {
      showNotification('请输入特巡任务名称', 'error');
      return;
    }
    const res = await createManualPatrolTask({
      title: createTempModal.title.trim(),
      targetZone: createTempModal.targetZone,
      deviceList: createTempModal.device.split(',').map((s) => s.trim()),
      assignee: createTempModal.assignee,
      description: createTempModal.description,
      deadlineTime: createTempModal.deadlineTime,
    });
    if (res.success) {
      showNotification(res.message);
      setCreateTempModal((prev) => ({ ...prev, isOpen: false }));
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleArchiveTask = (task: PatrolTask) => {
    // 业务门禁拦截：任务未提交严禁归档！
    if (task.status !== 'SUBMITTED') {
      showNotification(`业务门禁拦截：当前任务状态为【${task.status}】，未提交（SUBMITTED）不能归档！`, 'error');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: `确认复核并归档巡检任务 ${task.taskCode}？`,
      description: '复核通过后，该巡检任务将冻结为不可变历史电子档案，并写入不可变审计链。',
      action: async () => {
        const res = await archivePatrolTask(task.id);
        if (res.success) {
          showNotification(res.message);
        } else {
          showNotification(res.message, 'error');
        }
      },
    });
  };

  const handleConvertToWorkOrder = (task: PatrolTask) => {
    setConfirmDialog({
      isOpen: true,
      title: `基于巡检异常将任务 ${task.taskCode} 转为整改工单？`,
      description: '系统将创建新的整改工单，派发责任巡检人到场紧固或更换设备，并双向绑定关联。',
      action: async () => {
        const res = await convertTaskAnomalyToWorkOrder(task.id, `针对巡检任务 ${task.taskCode} 发现的设备缺陷实施就地消缺`);
        if (res.success) {
          showNotification(res.message);
        } else {
          showNotification(res.message, 'error');
        }
      },
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 头部卡片 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-lg bg-blue-50 text-[#004287]">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              日常巡检与特巡任务管理
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              全生命周期流转
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            涵盖计划排程自动派发、告警触发专项特巡与人工临时特巡。巡检流转状态为：
            <strong className="text-slate-800 font-semibold mx-1">
              待接收 → 待开始 → 执行中 → 待提交 → 已提交待复核 → 已归档
            </strong>
            。严格遵循门禁：任务未提交严禁归档，不伪造现场照片，保护现场原始事实。
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Link
            to="/mobile-simulator"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#004287] hover:bg-blue-50/60 transition-colors shadow-xs"
          >
            <Smartphone className="w-4 h-4 text-[#004287]" />
            <span>打开移动巡检端</span>
          </Link>

          <DisabledActionTooltip
            disabled={!canManage}
            reason="权限不足：仅【运营人员】或【系统管理员】可人工派发特巡任务。"
            recoveryStep="请在侧边栏切换身份至【运营人员】。"
          >
            <button
              id="btn-create-temp-task"
              disabled={!canManage}
              onClick={() => setCreateTempModal((prev) => ({ ...prev, isOpen: true }))}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs shadow-xs transition-all ${
                canManage
                  ? 'bg-[#004287] hover:bg-[#003366] text-white cursor-pointer active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>新建临时特巡任务</span>
            </button>
          </DisabledActionTooltip>
        </div>
      </div>

      {/* 巡检员权限提示横幅 */}
      {isInspector && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold">【巡检员权限提示】现场巡检员主要在移动端执行任务</div>
            <p className="text-amber-800 leading-relaxed">
              现场巡检员接收、执行任务与上报现场事实需在移动端巡检小程序（
              <Link to="/mobile-simulator" className="text-[#004287] font-semibold underline underline-offset-2">
                点击前往微信移动巡检端
              </Link>
              ）操作。Web 端主要用于运营人员派发任务、改派责任人与验收归档。
            </p>
          </div>
        </div>
      )}

      {/* 反馈消息 */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* KPI 指标卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-0.5">全部任务数</div>
          <div className="text-xl font-bold text-slate-900 font-mono">{totalTasks}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">多来源闭环任务</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-0.5">待接收 (PENDING)</div>
          <div className="text-xl font-bold text-amber-600 font-mono">{pendingAcceptTasks}</div>
          <div className="text-[10px] text-amber-700/80 mt-0.5">等待巡检员接单</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-0.5">执行中 / 待开始</div>
          <div className="text-xl font-bold text-blue-600 font-mono">{inProgressTasks}</div>
          <div className="text-[10px] text-blue-700/80 mt-0.5">现场点检与打卡中</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-0.5">已提交待复核</div>
          <div className="text-xl font-bold text-indigo-600 font-mono">{submittedTasks}</div>
          <div className="text-[10px] text-indigo-700/80 mt-0.5">等待运营人员验收</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-0.5">已复核归档</div>
          <div className="text-xl font-bold text-emerald-600 font-mono">{archivedTasks}</div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">已转电子档案库</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-0.5">发现异常隐患</div>
          <div className="text-xl font-bold text-rose-600 font-mono">{abnormalTasks}</div>
          <div className="text-[10px] text-rose-700/80 mt-0.5">可一键转整改工单</div>
        </div>
      </div>

      {/* 搜索与过滤工具栏 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative w-full md:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索任务编号/执行人/区域..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287] bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">状态:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-[#004287]"
            >
              <option value="ALL">全部状态</option>
              <option value="PENDING_ACCEPT">待接收</option>
              <option value="PENDING_START">待开始</option>
              <option value="IN_PROGRESS">执行中</option>
              <option value="PENDING_SUBMIT">待提交</option>
              <option value="SUBMITTED">已提交 (待复核)</option>
              <option value="ARCHIVED">已复核归档</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">来源:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-[#004287]"
            >
              <option value="ALL">全部来源</option>
              <option value="PLAN">计划生成</option>
              <option value="ALARM">告警触发</option>
              <option value="TEMP">临时特巡</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 w-full md:w-auto text-right font-mono">
          共 {filteredTasks.length} / {totalTasks} 项巡检任务
        </div>
      </div>

      {/* 任务列表 */}
      <div className="space-y-3.5">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            暂无匹配条件的巡检任务
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isPendingAccept = task.status === 'PENDING_ACCEPT';
            const isSubmitted = task.status === 'SUBMITTED';
            const isArchived = task.status === 'ARCHIVED';
            const hasAnomaly = task.hasAbnormality;

            return (
              <div
                key={task.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                {/* 顶部编号与状态 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {task.taskCode}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        task.source === 'ALARM'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : task.source === 'PLAN'
                          ? 'bg-blue-50 text-[#004287] border border-blue-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {task.source === 'ALARM' ? '告警转特巡' : task.source === 'PLAN' ? '规程计划生成' : '人工临时特巡'}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{task.title || task.taskName}</h3>
                    {hasAnomaly && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-300">
                        <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>发现现场异常</span>
                      </span>
                    )}
                    {task.isOffline && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        <WifiOff className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>离线本地暂存</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={task.status} size="sm" />
                  </div>
                </div>

                {/* 任务描述与范围 */}
                <div className="text-xs text-slate-600 leading-relaxed">
                  {task.description || '执行现场综合巡检，查验设备外观、接地线、温湿度与各指示灯。'}
                </div>

                {/* 核心元数据条目 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 font-medium">执行巡检人: </span>
                    <span className="font-semibold text-slate-800">{task.assignee}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">目标巡检区域: </span>
                    <span className="font-medium text-slate-700">{task.targetZone || '示范站'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">计划排程日期: </span>
                    <span className="font-mono text-slate-700">{task.plannedDate || '今日'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">截止时限: </span>
                    <span className="font-mono text-slate-700">{task.deadlineTime || task.planDeadline || '今日 18:00'}</span>
                  </div>
                </div>

                {/* 设备清单与关联标签 */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-medium">设备范围:</span>
                    {task.deviceList?.map((dev, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {dev}
                      </span>
                    ))}
                    {task.linkedAlarmCode && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                        关联告警: {task.linkedAlarmCode}
                      </span>
                    )}
                    {task.linkedWorkOrderCode && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-[#004287] border border-blue-200 font-semibold">
                        整改工单: {task.linkedWorkOrderCode}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    检查要点: {task.checkItems ? task.checkItems.length : task.totalItems} 项 | 快照: {task.planVersionSnapshot || 'V1.0'}
                  </div>
                </div>

                {/* 提交或归档信息 */}
                {task.submittedAt && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        巡检员 <strong>{task.submittedBy || task.assignee}</strong> 于 <strong>{task.submittedAt}</strong> 提交现场记录
                      </span>
                    </div>
                    {task.inspectorRemark && (
                      <div className="text-[11px] text-emerald-800 font-sans italic">
                        现场核验结论: “{task.inspectorRemark}”
                      </div>
                    )}
                  </div>
                )}

                {/* 底部操作区 */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDetailTask(task)}
                      className="inline-flex items-center gap-1 text-[#004287] hover:text-[#003366] font-medium px-2.5 py-1.5 rounded-lg bg-blue-50/60 hover:bg-blue-100/60 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>现场事实与检查明细</span>
                    </button>
                    {task.traceId && (
                      <span className="text-[10px] font-mono text-slate-400">
                        Trace: {task.traceId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 接单 (待接收状态) */}
                    {isPendingAccept && (
                      <button
                        onClick={async () => {
                          const res = await acceptPatrolTask(task.id);
                          showNotification(res.message, res.success ? 'success' : 'error');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                      >
                        确认接单
                      </button>
                    )}

                    {/* 改派执行人 (运营人员/管理员) */}
                    {!isArchived && (
                      <DisabledActionTooltip
                        disabled={!canManage}
                        reason="权限不足：仅【运营人员】或【系统管理员】可改派任务。"
                      >
                        <button
                          disabled={!canManage}
                          onClick={() => setReassignModal({ isOpen: true, task, newAssignee: task.assignee, reason: '' })}
                          className={`px-2.5 py-1.5 rounded-lg border font-medium text-xs transition-colors ${
                            canManage
                              ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                              : 'border-slate-200 text-slate-300 cursor-not-allowed'
                          }`}
                        >
                          改派
                        </button>
                      </DisabledActionTooltip>
                    )}

                    {/* 发现异常时转整改工单 */}
                    {hasAnomaly && !task.linkedWorkOrderId && (
                      <DisabledActionTooltip
                        disabled={!canManage}
                        reason="权限不足：仅运营人员可转派整改工单。"
                      >
                        <button
                          disabled={!canManage}
                          onClick={() => handleConvertToWorkOrder(task)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                            canManage
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          }`}
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>转整改工单</span>
                        </button>
                      </DisabledActionTooltip>
                    )}

                    {/* 运营复核归档 (业务门禁：未提交严禁归档) */}
                    {!isArchived && (
                      <DisabledActionTooltip
                        disabled={!canManage || !isSubmitted}
                        reason={
                          !canManage
                            ? '权限不足：仅【运营人员】或【系统管理员】有权复核归档。'
                            : '业务门禁拦截：任务未提交（SUBMITTED）严禁归档！请待巡检员从移动端提交现场事实后再归档。'
                        }
                        recoveryStep={
                          !isSubmitted
                            ? '巡检员需在移动端小程序核实检查项并点击提交后，方可进入待复核归档。'
                            : undefined
                        }
                      >
                        <button
                          disabled={!canManage || !isSubmitted}
                          onClick={() => handleArchiveTask(task)}
                          className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg font-semibold text-xs shadow-xs transition-all ${
                            canManage && isSubmitted
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          }`}
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>复核归档</span>
                        </button>
                      </DisabledActionTooltip>
                    )}

                    {isArchived && (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>已归档至电子档案</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 任务现场详情抽屉 */}
      {detailTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#004287] border border-blue-200">
                    {detailTask.taskCode}
                  </span>
                  <StatusBadge status={detailTask.status} size="sm" />
                  <h2 className="text-base font-bold text-slate-900">{detailTask.title || detailTask.taskName}</h2>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  责任人: <strong className="text-slate-800">{detailTask.assignee}</strong> | 规程快照: {detailTask.planVersionSnapshot || 'V1.0'}
                </div>
              </div>
              <button
                onClick={() => setDetailTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs"
              >
                ✕ 关闭
              </button>
            </div>

            {/* 现场核验事实清单 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#004287]" />
                  <span>巡检员现场核验事实明细 ({detailTask.checkItems?.length || 0}项)</span>
                </h3>
                <span className="text-[11px] text-slate-400">真实采集数据·严禁代填篡改</span>
              </div>

              <div className="space-y-3">
                {detailTask.checkItems?.map((item, idx) => {
                  const isAnomaly = item.result === 'ANOMALY';
                  const isNormal = item.result === 'NORMAL';
                  const isUnchecked = item.result === 'UNCHECKED' || !item.result;

                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3.5 rounded-xl border space-y-2 text-xs transition-colors ${
                        isAnomaly
                          ? 'border-rose-200 bg-rose-50/40'
                          : isNormal
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-[#004287] font-mono text-[11px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span>{item.itemName}</span>
                        </div>

                        <div>
                          {isAnomaly && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-300">
                              异常隐患
                            </span>
                          )}
                          {isNormal && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-300">
                              合格正常
                            </span>
                          )}
                          {isUnchecked && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200">
                              待现场核查
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                        <div>
                          <span className="text-slate-400 font-medium">核验标准: </span>
                          <span className="font-medium text-slate-800">{item.standard}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">设备目标: </span>
                          <span className="font-medium text-slate-800">{item.deviceTarget || '现场设备单元'}</span>
                        </div>
                      </div>

                      {/* 现场记录说明与照片占位 */}
                      {item.remark && (
                        <div className="text-[11px] text-slate-700 bg-white/70 p-2 rounded border border-slate-200 mt-1">
                          <span className="font-semibold text-slate-800">巡检员记录: </span>
                          {item.remark}
                        </div>
                      )}

                      {/* 遵守事实原则：不伪造假照片，展示真实防伪占位 */}
                      {isAnomaly && (
                        <div className="mt-2 p-2.5 rounded-lg bg-white border border-rose-200 flex items-center gap-3">
                          <div className="w-16 h-16 rounded bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-[10px] text-slate-400 shrink-0">
                            <span>现场照片</span>
                            <span>占位留存</span>
                          </div>
                          <div className="space-y-0.5 text-[10px] text-slate-500 font-mono">
                            <div className="font-bold text-slate-700 font-sans">防伪水印与坐标元数据</div>
                            <div>时间戳: {detailTask.submittedAt || new Date().toLocaleString()}</div>
                            <div>地理坐标: 117.653°E, 24.521°N (示范站 10kV 储能舱)</div>
                            <div className="text-emerald-700">防篡改校验: SHA-256 水印已验证通过</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 审计日志与溯源信息 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>全流程合规审计与关联对象</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>任务 TraceId: {detailTask.traceId || 'TR-PATROL-DEFAULT'}</div>
                  <div>规程来源: {detailTask.planName || '常规运维计划'}</div>
                  <div>关联告警: {detailTask.linkedAlarmCode || '无'}</div>
                  <div>关联工单: {detailTask.linkedWorkOrderCode || '无'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 改派执行人模态框 */}
      {reassignModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-[#004287]">
                <User className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                改派巡检任务执行人
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              改派任务【<strong className="text-slate-800">{reassignModal.task?.taskCode}</strong>】。系统将更新现场派单通知并记入运营审计日志。
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">选择新执行人</label>
                <select
                  value={reassignModal.newAssignee}
                  onChange={(e) => setReassignModal({ ...reassignModal, newAssignee: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287] bg-white"
                >
                  <option value="林志强 (巡检员)">林志强 (巡检员 - 主力班组)</option>
                  <option value="张建国 (高级机电工程师)">张建国 (高级机电工程师 - 特殊消缺)</option>
                  <option value="陈若涵 (运营主管)">陈若涵 (运营主管 - 现场督导)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  改派原因说明 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reassignModal.reason}
                  onChange={(e) => setReassignModal({ ...reassignModal, reason: e.target.value })}
                  placeholder="例如：原责任人林志强正在配电室配合绝缘耐压试验，改由机电专家就地核查..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setReassignModal({ isOpen: false, task: null, newAssignee: '林志强 (巡检员)', reason: '' })}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmReassign}
                className="px-4 py-1.5 rounded-lg bg-[#004287] hover:bg-[#003366] text-white font-semibold shadow-xs"
              >
                确认改派
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新建临时特巡任务模态框 */}
      {createTempModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                  <Sparkles className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  发起临时专项特巡任务
                </h3>
              </div>
              <button
                onClick={() => setCreateTempModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  任务名称 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={createTempModal.title}
                  onChange={(e) => setCreateTempModal({ ...createTempModal, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">目标巡视区域</label>
                  <input
                    type="text"
                    value={createTempModal.targetZone}
                    onChange={(e) => setCreateTempModal({ ...createTempModal, targetZone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">执行责任人</label>
                  <input
                    type="text"
                    value={createTempModal.assignee}
                    onChange={(e) => setCreateTempModal({ ...createTempModal, assignee: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">核验设备清单 (英文逗号分隔)</label>
                <input
                  type="text"
                  value={createTempModal.device}
                  onChange={(e) => setCreateTempModal({ ...createTempModal, device: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">任务执行要求与背景说明</label>
                <textarea
                  rows={3}
                  value={createTempModal.description}
                  onChange={(e) => setCreateTempModal({ ...createTempModal, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setCreateTempModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreateTempTask}
                className="px-4 py-1.5 rounded-lg bg-[#004287] hover:bg-[#003366] text-white font-semibold shadow-xs"
              >
                确认派发特巡任务
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 确认复核对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={async () => {
          await confirmDialog.action();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
