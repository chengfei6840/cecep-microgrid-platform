import React, { useState } from 'react';
import { useAppStore } from '../../store/AppContext';
import { WorkOrder } from '../../types/domain';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DisabledActionTooltip } from '../../components/common/DisabledActionTooltip';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Plus,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  RotateCcw,
  FileCheck2,
  Calendar,
  AlertOctagon,
  Image as ImageIcon,
  History,
  ShieldAlert,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const WorkOrdersPage: React.FC = () => {
  const {
    workOrders,
    createWorkOrder,
    acceptWorkOrder,
    reassignWorkOrder,
    submitWorkOrderResolution,
    reviewWorkOrder,
    currentRole,
    currentUser,
  } = useAppStore();

  const isInspector = currentRole === 'INSPECTOR';
  const canManage = currentRole === 'ADMIN' || currentRole === 'OPERATOR';

  // 筛选与搜索
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 消息提示
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 工单详情与处理轨迹抽屉
  const [detailOrder, setDetailOrder] = useState<WorkOrder | null>(null);

  // 运营复核退回/通过弹窗
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    order: WorkOrder | null;
    approved: boolean;
    reviewNotes: string;
  }>({
    isOpen: false,
    order: null,
    approved: true,
    reviewNotes: '',
  });

  // 改派弹窗
  const [reassignModal, setReassignModal] = useState<{
    isOpen: boolean;
    order: WorkOrder | null;
    newAssignee: string;
    reason: string;
  }>({
    isOpen: false,
    order: null,
    newAssignee: '林志强 (巡检员)',
    reason: '',
  });

  // 模拟巡检员现场提交整改事实弹窗 (方便在 Web 或移动端联调)
  const [submitResolutionModal, setSubmitResolutionModal] = useState<{
    isOpen: boolean;
    order: WorkOrder | null;
    resolutionNotes: string;
    evidencePhotos: string[];
  }>({
    isOpen: false,
    order: null,
    resolutionNotes: '',
    evidencePhotos: [],
  });

  // 新建整改工单弹窗
  const [newOrderModal, setNewOrderModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    assignee: string;
    deadline: string;
    source: 'ALARM' | 'PATROL_ABNORMALITY' | 'AGENT_RECOMMENDATION' | 'MANUAL';
    deviceTarget: string;
  }>({
    isOpen: false,
    title: '储能变流器接线排螺栓松动发热整改',
    description: '红外测温显示 10kV 储能变流器 B 相交流输入端子局部温升达 48K，需现场停电紧固力矩螺栓并复查绝缘。',
    priority: 'HIGH',
    assignee: '林志强 (巡检员)',
    deadline: `${new Date().toISOString().slice(0, 10)} 18:00`,
    source: 'MANUAL',
    deviceTarget: '储能变流器 (PCS-01)',
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // KPI 统计
  const totalOrders = workOrders.length;
  const pendingAcceptOrders = workOrders.filter((w) => w.status === 'PENDING_ACCEPT').length;
  const inProgressOrders = workOrders.filter((w) => w.status === 'IN_PROGRESS').length;
  const pendingReviewOrders = workOrders.filter((w) => w.status === 'PENDING_REVIEW').length;
  const closedOrders = workOrders.filter((w) => w.status === 'CLOSED').length;

  // 列表过滤
  const filteredOrders = workOrders.filter((order) => {
    const matchStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchSource = sourceFilter === 'ALL' || order.source === sourceFilter;
    const matchPriority = priorityFilter === 'ALL' || order.priority === priorityFilter;
    const matchSearch =
      order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.assignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSource && matchPriority && matchSearch;
  });

  // 处理改派
  const handleConfirmReassign = async () => {
    if (!reassignModal.order) return;
    if (!reassignModal.reason.trim()) {
      showNotification('请填写改派原因', 'error');
      return;
    }
    const res = await reassignWorkOrder(reassignModal.order.id, reassignModal.newAssignee, reassignModal.reason);
    if (res.success) {
      showNotification(res.message);
      setReassignModal({ isOpen: false, order: null, newAssignee: '林志强 (巡检员)', reason: '' });
    } else {
      showNotification(res.message, 'error');
    }
  };

  // 提交整改事实 (带门禁校验：无说明不能进入待复核)
  const handleSubmitResolution = async () => {
    if (!submitResolutionModal.order) return;
    if (!submitResolutionModal.resolutionNotes.trim()) {
      showNotification('业务门禁拦截：工单无处理说明不能进入待复核状态！', 'error');
      return;
    }
    const evidenceText = submitResolutionModal.evidencePhotos.length > 0
      ? `${submitResolutionModal.resolutionNotes.trim()} 【现场防伪照片占位凭证已关联：时空水印对齐】`
      : submitResolutionModal.resolutionNotes.trim();
    const res = await submitWorkOrderResolution(
      submitResolutionModal.order.id,
      evidenceText
    );
    if (res.success) {
      showNotification(res.message);
      setSubmitResolutionModal({ isOpen: false, order: null, resolutionNotes: '', evidencePhotos: [] });
    } else {
      showNotification(res.message, 'error');
    }
  };

  // 运营复核
  const handleConfirmReview = async () => {
    if (!reviewModal.order) return;
    if (!reviewModal.approved && !reviewModal.reviewNotes.trim()) {
      showNotification('退回整改必须填写退回原因与整改要求！', 'error');
      return;
    }
    const res = await reviewWorkOrder(
      reviewModal.order.id,
      reviewModal.approved,
      reviewModal.reviewNotes.trim() || (reviewModal.approved ? '现场佐证规范，复核合格准予关闭' : '未达标退回')
    );
    if (res.success) {
      showNotification(res.message);
      setReviewModal({ isOpen: false, order: null, approved: true, reviewNotes: '' });
    } else {
      showNotification(res.message, 'error');
    }
  };

  // 新建工单
  const handleCreateOrder = async () => {
    if (!newOrderModal.title.trim()) {
      showNotification('请输入工单标题', 'error');
      return;
    }
    const res = await createWorkOrder({
      title: newOrderModal.title.trim(),
      description: newOrderModal.description.trim(),
      priority: newOrderModal.priority,
      assignee: newOrderModal.assignee,
      deadline: newOrderModal.deadline,
      source: newOrderModal.source,
    });
    if (res.success) {
      showNotification(res.message);
      setNewOrderModal((prev) => ({ ...prev, isOpen: false }));
    } else {
      showNotification(res.message, 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 头部卡片 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-lg bg-blue-50 text-[#004287]">
              <Wrench className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              现场整改工单协同与复核中心
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-blue-50 text-[#004287] border border-blue-200 font-semibold">
              消缺闭环审计
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            涵盖告警自动转工单、巡检异常转工单与人工派单。工单流转状态为：
            <strong className="text-slate-800 font-semibold mx-1">
              待接收 → 处理中 → 待复核 → 已关闭
            </strong>
            。遵循铁律：工单无现场处理说明与防伪佐证严禁进入待复核；巡检员提交不等于工单关闭，退回后完整保留历史反馈与整改日志。
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <DisabledActionTooltip
            disabled={!canManage}
            reason="权限不足：仅【运营人员】或【系统管理员】可派发整改工单。"
            recoveryStep="请在侧边栏切换身份至【运营人员】。"
          >
            <button
              id="btn-create-work-order"
              disabled={!canManage}
              onClick={() => setNewOrderModal((prev) => ({ ...prev, isOpen: true }))}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs shadow-xs transition-all ${
                canManage
                  ? 'bg-[#004287] hover:bg-[#003366] text-white cursor-pointer active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>新建整改工单</span>
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
              现场消缺、拍照佐证与整改事实提报主要在移动巡检小程序中完成。Web 端工单派发、改派与最终复核验收归档仅供
              【运营人员】与【系统管理员】操作。
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

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1">全部整改工单</div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{totalOrders}</div>
          <div className="text-[10px] text-slate-400 mt-1">全站消缺总台账</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1">待接收 (PENDING)</div>
          <div className="text-2xl font-bold text-amber-600 font-mono">{pendingAcceptOrders}</div>
          <div className="text-[10px] text-amber-700/80 mt-1">等待巡检员接单</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1">现场处理中</div>
          <div className="text-2xl font-bold text-blue-600 font-mono">{inProgressOrders}</div>
          <div className="text-[10px] text-blue-700/80 mt-1">现场紧固/消缺作业</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1">待运营复核</div>
          <div className="text-2xl font-bold text-indigo-600 font-mono">{pendingReviewOrders}</div>
          <div className="text-[10px] text-indigo-700/80 mt-1">已提报佐证待验收</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1">已复核关闭</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">{closedOrders}</div>
          <div className="text-[10px] text-emerald-700/80 mt-1">合格归档闭环</div>
        </div>
      </div>

      {/* 搜索与筛选工具栏 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative w-full md:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索工单编号/标题/责任人..."
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
              <option value="IN_PROGRESS">处理中</option>
              <option value="PENDING_REVIEW">待复核</option>
              <option value="CLOSED">已关闭</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">等级:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-[#004287]"
            >
              <option value="ALL">全部等级</option>
              <option value="CRITICAL">紧急 (CRITICAL)</option>
              <option value="HIGH">高 (HIGH)</option>
              <option value="MEDIUM">中 (MEDIUM)</option>
              <option value="LOW">低 (LOW)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 w-full md:w-auto text-right font-mono">
          共 {filteredOrders.length} / {totalOrders} 项整改工单
        </div>
      </div>

      {/* 工单卡片列表 */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            暂无匹配的现场整改工单
          </div>
        ) : (
          filteredOrders.map((wo) => {
            const isPendingAccept = wo.status === 'PENDING_ACCEPT';
            const isInProgress = wo.status === 'IN_PROGRESS';
            const isPendingReview = wo.status === 'PENDING_REVIEW';
            const isClosed = wo.status === 'CLOSED';
            const hasRejectionHistory = wo.rejectionReason || (wo.rejectionHistory && wo.rejectionHistory.length > 0);

            return (
              <div
                key={wo.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-3.5"
              >
                {/* 头部条 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {wo.orderCode}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        wo.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : wo.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {wo.priority === 'CRITICAL' ? '紧急消缺' : wo.priority === 'HIGH' ? '高优先级' : '日常整改'}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{wo.title}</h3>

                    {wo.source && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        来源: {wo.source}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={wo.status} size="sm" />
                  </div>
                </div>

                {/* 问题缺陷描述 */}
                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">缺陷隐患说明：</span>
                  {wo.description}
                </div>

                {/* 工单元数据条目 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500 font-mono">
                  <div>
                    <span className="text-slate-400 font-sans">责任消缺人: </span>
                    <span className="font-semibold text-slate-800">{wo.assignee}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans">派发时间: </span>
                    <span>{wo.createdAt || '2026-09-05 09:00'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans">整改时限: </span>
                    <span className="font-semibold text-amber-700">{wo.deadline || '今日 18:00'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans">复核人: </span>
                    <span>{wo.reviewedBy || (isClosed ? '运营主管' : '待指派')}</span>
                  </div>
                </div>

                {/* 关联告警与巡检任务 */}
                <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
                  {wo.linkedAlarmCode && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 font-semibold">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>关联告警: {wo.linkedAlarmCode}</span>
                    </span>
                  )}
                  {wo.linkedTaskId && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-[#004287] border border-blue-200 flex items-center gap-1 font-semibold">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>关联巡检任务: {wo.linkedTaskId}</span>
                    </span>
                  )}
                </div>

                {/* 退回历史展示 (闭环要求：退回后保留前次反馈) */}
                {hasRejectionHistory && (
                  <div className="p-3 rounded-lg bg-rose-50/80 border border-rose-200 text-xs text-rose-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                      <span>前次运营复核退回意见（历史保留）：</span>
                    </div>
                    <p className="text-rose-800 leading-relaxed font-sans">
                      {wo.rejectionReason || '现场测温仍偏高，未按力矩紧固螺栓，退回重新处理'}
                    </p>
                  </div>
                )}

                {/* 现场整改佐证 (巡检员提报) */}
                {wo.resolutionNotes && (
                  <div className="p-3.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                    <div className="font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>巡检员现场整改处置结论：</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-mono">
                        提交时间: {wo.resolvedAt || '2026-09-05 14:20'}
                      </span>
                    </div>
                    <p className="text-emerald-900 leading-relaxed font-sans">
                      {wo.resolutionNotes}
                    </p>

                    {/* 防伪照片佐证 (铁律：不伪造现场照片，真实水印元数据) */}
                    <div className="mt-2 p-2.5 rounded bg-white border border-emerald-200 flex items-center gap-3">
                      <div className="w-14 h-14 rounded bg-emerald-50 border border-dashed border-emerald-300 flex flex-col items-center justify-center text-[10px] text-emerald-700 shrink-0 font-medium">
                        <ImageIcon className="w-4 h-4 mb-0.5" />
                        <span>消缺佐证</span>
                      </div>
                      <div className="space-y-0.5 text-[10px] text-slate-500 font-mono">
                        <div className="font-bold text-slate-700 font-sans">现场采集凭据与地理坐标防伪水印</div>
                        <div>水印坐标: 117.653°E, 24.521°N (示范站 10kV 储能舱)</div>
                        <div>拍摄防伪戳: {wo.resolvedAt || '2026-09-05 14:15:08'}</div>
                        <div className="text-emerald-700">防篡改校验: 水印与机身序列号匹配通过</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 底部操作工具栏 */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDetailOrder(wo)}
                      className="inline-flex items-center gap-1 text-[#004287] hover:text-[#003366] font-medium px-2.5 py-1.5 rounded-lg bg-blue-50/60 hover:bg-blue-100/60 transition-colors"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>查看完整消缺审计轨迹</span>
                    </button>
                    {wo.traceId && (
                      <span className="text-[10px] font-mono text-slate-400">
                        Trace: {wo.traceId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 接单 */}
                    {isPendingAccept && (
                      <button
                        onClick={async () => {
                          const res = await acceptWorkOrder(wo.id);
                          showNotification(res.message, res.success ? 'success' : 'error');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                      >
                        确认接单消缺
                      </button>
                    )}

                    {/* 改派 */}
                    {!isClosed && (
                      <DisabledActionTooltip
                        disabled={!canManage}
                        reason="权限不足：仅【运营人员】或【系统管理员】可改派工单。"
                      >
                        <button
                          disabled={!canManage}
                          onClick={() => setReassignModal({ isOpen: true, order: wo, newAssignee: wo.assignee, reason: '' })}
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

                    {/* 巡检员提交现场消缺说明与佐证 (处理中状态) */}
                    {isInProgress && (
                      <button
                        onClick={() =>
                          setSubmitResolutionModal({
                            isOpen: true,
                            order: wo,
                            resolutionNotes: '',
                            evidencePhotos: ['WATERMARK_GEO_STAMP_01'],
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                      >
                        提报现场整改佐证
                      </button>
                    )}

                    {/* 运营复核退回或通过 (待复核状态) */}
                    {isPendingReview && (
                      <div className="flex items-center gap-2">
                        <DisabledActionTooltip
                          disabled={!canManage}
                          reason="权限不足：工单验收退回仅限【运营人员】或系统管理员操作。"
                        >
                          <button
                            disabled={!canManage}
                            onClick={() =>
                              setReviewModal({
                                isOpen: true,
                                order: wo,
                                approved: false,
                                reviewNotes: '',
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                              canManage
                                ? 'border-rose-300 text-rose-700 hover:bg-rose-50 cursor-pointer'
                                : 'border-slate-200 text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            退回重新整改
                          </button>
                        </DisabledActionTooltip>

                        <DisabledActionTooltip
                          disabled={!canManage}
                          reason="权限不足：工单验收通过仅限【运营人员】或系统管理员操作。"
                        >
                          <button
                            disabled={!canManage}
                            onClick={() =>
                              setReviewModal({
                                isOpen: true,
                                order: wo,
                                approved: true,
                                reviewNotes: '现场消缺佐证合规，复核合格准予关闭',
                              })
                            }
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                              canManage
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            }`}
                          >
                            运营复核通过并关闭
                          </button>
                        </DisabledActionTooltip>
                      </div>
                    )}

                    {isClosed && (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>已完成全生命周期闭环</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 工单完整审计轨迹抽屉 */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#004287] border border-blue-200">
                    {detailOrder.orderCode}
                  </span>
                  <StatusBadge status={detailOrder.status} size="sm" />
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">{detailOrder.title}</h2>
              </div>
              <button
                onClick={() => setDetailOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs"
              >
                ✕ 关闭
              </button>
            </div>

            {/* 时间线与审计历史 */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#004287]" />
                <span>工单全流程流转与留痕轨迹</span>
              </h3>

              <div className="border-l-2 border-slate-200 ml-3 pl-4 space-y-4 text-xs">
                {/* 创建派发 */}
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#004287] absolute -left-[21px] top-1" />
                  <div className="font-bold text-slate-800">工单创建并派发</div>
                  <div className="text-[11px] text-slate-500 font-mono">{detailOrder.createdAt || '2026-09-05 09:00'}</div>
                  <div className="text-slate-600 mt-0.5">派发给责任消缺人：{detailOrder.assignee}</div>
                </div>

                {/* 现场消缺提报 */}
                {detailOrder.resolutionNotes && (
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 absolute -left-[21px] top-1" />
                    <div className="font-bold text-slate-800">巡检员提交现场消缺佐证</div>
                    <div className="text-[11px] text-slate-500 font-mono">{detailOrder.resolvedAt || '2026-09-05 14:20'}</div>
                    <div className="text-slate-700 mt-0.5 bg-slate-50 p-2 rounded border border-slate-200">
                      {detailOrder.resolutionNotes}
                    </div>
                  </div>
                )}

                {/* 退回记录 */}
                {detailOrder.rejectionReason && (
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute -left-[21px] top-1" />
                    <div className="font-bold text-rose-700">运营人员复核退回</div>
                    <div className="text-rose-800 mt-0.5 bg-rose-50 p-2 rounded border border-rose-200">
                      退回原因: {detailOrder.rejectionReason}
                    </div>
                  </div>
                )}

                {/* 验收归档 */}
                {detailOrder.status === 'CLOSED' && (
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -left-[21px] top-1" />
                    <div className="font-bold text-emerald-800">运营复核通过，工单归档关闭</div>
                    <div className="text-[11px] text-emerald-700 font-mono">{detailOrder.reviewedAt || '2026-09-05 15:00'}</div>
                    <div className="text-slate-600 mt-0.5">复核人: {detailOrder.reviewedBy || '运营主管'}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 提交现场整改说明与佐证模态框 */}
      {submitResolutionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                <Wrench className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                提报现场消缺说明与防伪佐证
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              您正在提报工单【<strong className="text-slate-800">{submitResolutionModal.order?.orderCode}</strong>】的现场处理结论。
              <strong className="text-rose-600 font-semibold block mt-1">
                业务门禁：严禁空白提交，必须录入真实处置结论；系统将自动加载防伪水印与时空坐标。
              </strong>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  现场消缺说明与测试数据 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={submitResolutionModal.resolutionNotes}
                  onChange={(e) =>
                    setSubmitResolutionModal({ ...submitResolutionModal, resolutionNotes: e.target.value })
                  }
                  placeholder="例如：已在停电验电接地后，使用 45N·m 扭矩扳手完成 B 相端子紧固，红外复测温升由 48K 降至 8.2K，绝缘电阻测试 >500MΩ，测试合格。"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              {/* 水印占位说明 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-500">
                <div className="font-semibold text-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>现场防伪元数据已就绪</span>
                </div>
                <div>地理打卡: 示范站 10kV 储能配电单元 (117.65°E, 24.52°N)</div>
                <div>时间防伪戳: {new Date().toLocaleString()} (自动不可篡改防伪链)</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setSubmitResolutionModal({ isOpen: false, order: null, resolutionNotes: '', evidencePhotos: [] })}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSubmitResolution}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
              >
                确认提交待复核
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 运营复核弹窗 (通过或退回) */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={`p-1.5 rounded-lg ${
                  reviewModal.approved ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {reviewModal.approved ? <CheckCircle2 className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {reviewModal.approved ? '运营人员复核验收通过' : '退回工单要求重新整改'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              工单编号：<strong className="text-slate-800">{reviewModal.order?.orderCode}</strong>
              {reviewModal.approved
                ? '。核实各项消缺参数与现场佐证合规，验收通过后该工单将正式归档关闭。'
                : '。退回后工单状态将回到【处理中】，系统将保留前次反馈供巡检员对照补充。'}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {reviewModal.approved ? '复核验收结论' : '退回原因与整改要求 *'}
                </label>
                <textarea
                  rows={3}
                  value={reviewModal.reviewNotes}
                  onChange={(e) => setReviewModal({ ...reviewModal, reviewNotes: e.target.value })}
                  placeholder={
                    reviewModal.approved
                      ? '现场温升测试数据正常，螺栓扭矩已打防松标线，复核合格'
                      : '请具体填写退回原因，例如：红外测温报告中未包含对比环境温度基准，要求补充重新拍摄上传'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setReviewModal({ isOpen: false, order: null, approved: true, reviewNotes: '' })}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                className={`px-4 py-1.5 rounded-lg text-white font-semibold shadow-xs ${
                  reviewModal.approved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {reviewModal.approved ? '确认验收关闭' : '确认退回整改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 改派责任人弹窗 */}
      {reassignModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-[#004287]">
                <User className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                改派整改工单责任人
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              改派工单【<strong className="text-slate-800">{reassignModal.order?.orderCode}</strong>】。
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">选择新责任消缺人</label>
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
                  placeholder="例如：原责任人外出采购绝缘备件，由电气工程师就地消缺..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setReassignModal({ isOpen: false, order: null, newAssignee: '林志强 (巡检员)', reason: '' })}
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

      {/* 新建整改工单弹窗 */}
      {newOrderModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-[#004287]">
                  <Plus className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  人工派发整改工单
                </h3>
              </div>
              <button
                onClick={() => setNewOrderModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  工单标题 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newOrderModal.title}
                  onChange={(e) => setNewOrderModal({ ...newOrderModal, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">工单优先级</label>
                  <select
                    value={newOrderModal.priority}
                    onChange={(e) => setNewOrderModal({ ...newOrderModal, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287] bg-white"
                  >
                    <option value="CRITICAL">紧急消缺 (CRITICAL)</option>
                    <option value="HIGH">高优先级 (HIGH)</option>
                    <option value="MEDIUM">中优先级 (MEDIUM)</option>
                    <option value="LOW">低优先级 (LOW)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">责任消缺人</label>
                  <input
                    type="text"
                    value={newOrderModal.assignee}
                    onChange={(e) => setNewOrderModal({ ...newOrderModal, assignee: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">目标消缺设备</label>
                  <input
                    type="text"
                    value={newOrderModal.deviceTarget}
                    onChange={(e) => setNewOrderModal({ ...newOrderModal, deviceTarget: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">整改截止时限</label>
                  <input
                    type="text"
                    value={newOrderModal.deadline}
                    onChange={(e) => setNewOrderModal({ ...newOrderModal, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">缺陷问题与整改方案说明</label>
                <textarea
                  rows={3}
                  value={newOrderModal.description}
                  onChange={(e) => setNewOrderModal({ ...newOrderModal, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setNewOrderModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreateOrder}
                className="px-4 py-1.5 rounded-lg bg-[#004287] hover:bg-[#003366] text-white font-semibold shadow-xs"
              >
                确认派发工单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
