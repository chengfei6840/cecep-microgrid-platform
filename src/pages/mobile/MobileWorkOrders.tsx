import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/AppContext';
import { WorkOrder, WorkOrderStatus } from '../../types/domain';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Wrench,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  RotateCcw,
  ShieldCheck,
  Info,
  ArrowRight,
  FileCheck2,
  Calendar,
  AlertOctagon,
  Sparkles,
  Check,
  Send,
  UploadCloud,
  History,
  ShieldAlert,
} from 'lucide-react';

export const MobileWorkOrders: React.FC = () => {
  const navigate = useNavigate();
  const {
    workOrders,
    acceptWorkOrder,
    submitWorkOrderResolution,
    currentRole,
    alarms,
    patrolTasks,
  } = useAppStore();

  const isReadOnly = currentRole !== 'INSPECTOR';

  // 4组状态切换
  const [activeTab, setActiveTab] = useState<WorkOrderStatus>('PENDING_ACCEPT');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  // 提交整改表单状态
  const [handlingModal, setHandlingModal] = useState<{
    isOpen: boolean;
    order: WorkOrder | null;
    notes: string;
    stepDetails: string;
    hasPhotoPlaceholder: boolean;
    photoPlaceholderName: string;
  }>({
    isOpen: false,
    order: null,
    notes: '',
    stepDetails: '1. 到达现场切断受影响回路线路，挂检修牌；\n2. 紧固接线排端子，使用红外测温确认温度降至 35℃ 正常范围；\n3. 现场合闸送电并就地观察 15 分钟遥测数据无突变。',
    hasPhotoPlaceholder: true,
    photoPlaceholderName: 'IMG_20260908_现场整改后端子紧固与红外测温.jpg',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 分组统计
  const pendingAcceptList = workOrders.filter((w) => w.status === 'PENDING_ACCEPT');
  const inProgressList = workOrders.filter((w) => w.status === 'IN_PROGRESS');
  const pendingReviewList = workOrders.filter((w) => w.status === 'PENDING_REVIEW');
  const closedList = workOrders.filter((w) => w.status === 'CLOSED');

  const displayedOrders =
    activeTab === 'PENDING_ACCEPT'
      ? pendingAcceptList
      : activeTab === 'IN_PROGRESS'
      ? inProgressList
      : activeTab === 'PENDING_REVIEW'
      ? pendingReviewList
      : closedList;

  // 接单处理
  const handleAcceptOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly) {
      setFeedback({ type: 'error', message: '当前为只读预览角色，仅巡检员 (林志强) 可接收工单' });
      return;
    }
    const res = await acceptWorkOrder(orderId);
    if (res.success) {
      setFeedback({ type: 'success', message: '工单已接收，状态更新为【处理中】，请按安全规程就地整改' });
      setActiveTab('IN_PROGRESS');
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'IN_PROGRESS' } : null));
      }
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  // 打开提交整改弹窗
  const openHandlingModal = (order: WorkOrder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isReadOnly) {
      setFeedback({ type: 'error', message: '当前为只读预览角色，仅巡检员 (林志强) 可提交工单处理结果' });
      return;
    }
    setHandlingModal({
      isOpen: true,
      order,
      notes: order.resolutionNotes || '现场已排查完毕，接线端子与测温均已恢复安全阈值以内，现场恢复送电。',
      stepDetails:
        '1. 到达现场切断受影响回路线路，挂检修牌；\n2. 紧固接线排端子，使用红外测温确认温度降至 35℃ 正常范围；\n3. 现场合闸送电并就地观察 15 分钟遥测数据无突变。',
      hasPhotoPlaceholder: true,
      photoPlaceholderName: 'IMG_20260908_现场整改后端子紧固与红外测温.jpg',
    });
  };

  // 确认提交整改复核 (严格门禁校验：无说明不能进入待复核)
  const handleSubmitResolution = async () => {
    if (!handlingModal.order) return;
    if (!handlingModal.notes.trim()) {
      setFeedback({ type: 'error', message: '业务门禁拦截：工单无现场处理说明不能进入待复核状态！' });
      return;
    }

    setIsSubmitting(true);
    const evidenceText = handlingModal.hasPhotoPlaceholder
      ? `${handlingModal.notes.trim()}\n【整改步骤】:\n${handlingModal.stepDetails}\n【现场防伪佐证占位凭证】: ${handlingModal.photoPlaceholderName} (时空水印: 示范站现场 · GPS 校验通过)`
      : `${handlingModal.notes.trim()}\n【整改步骤】:\n${handlingModal.stepDetails}`;

    const res = await submitWorkOrderResolution(handlingModal.order.id, evidenceText);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: '已提交运营人员复核！工单进入【待复核】状态（巡检员无权自行关闭）。',
      });
      setHandlingModal((prev) => ({ ...prev, isOpen: false, order: null }));
      setActiveTab('PENDING_REVIEW');
      if (selectedOrder?.id === handlingModal.order.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'PENDING_REVIEW', resolutionNotes: evidenceText } : null));
      }
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 顶部职责与权限提示 */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">微电网消缺整改终端</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">林志强 (现场负责)</div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
            {pendingAcceptList.length + inProgressList.length} 项需现场处置
          </span>
        </div>

        {/* 权限提示 */}
        <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>消缺闭环铁律：</strong>巡检员负责现场接单与实施，提交后进入
            <strong className="text-amber-950 font-semibold">【待复核】</strong>；
            <span className="text-rose-700 font-semibold">巡检员无权自行关闭工单</span>，须由运营人员在 Web 端复核验收。
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 text-xs rounded-xl flex items-center gap-2 shadow-xs animate-fadeIn border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 四态 Tab 切换 (待接收、处理中、待复核、已关闭) */}
      <div className="grid grid-cols-4 gap-1 bg-slate-200 p-1 rounded-xl text-[11px] font-semibold">
        <button
          onClick={() => setActiveTab('PENDING_ACCEPT')}
          className={`py-1.5 rounded-lg transition-all flex flex-col items-center justify-center ${
            activeTab === 'PENDING_ACCEPT'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>待接收</span>
          <span className="text-[10px] font-mono">({pendingAcceptList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('IN_PROGRESS')}
          className={`py-1.5 rounded-lg transition-all flex flex-col items-center justify-center ${
            activeTab === 'IN_PROGRESS'
              ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
              : 'text-amber-800 hover:bg-amber-100'
          }`}
        >
          <span>处理中</span>
          <span className="text-[10px] font-mono">({inProgressList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PENDING_REVIEW')}
          className={`py-1.5 rounded-lg transition-all flex flex-col items-center justify-center ${
            activeTab === 'PENDING_REVIEW'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-blue-700 hover:bg-blue-100'
          }`}
        >
          <span>待复核</span>
          <span className="text-[10px] font-mono">({pendingReviewList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CLOSED')}
          className={`py-1.5 rounded-lg transition-all flex flex-col items-center justify-center ${
            activeTab === 'CLOSED'
              ? 'bg-emerald-600 text-white shadow-xs font-bold'
              : 'text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          <span>已关闭</span>
          <span className="text-[10px] font-mono">({closedList.length})</span>
        </button>
      </div>

      {/* 工单列表 */}
      <div className="space-y-3">
        {displayedOrders.map((wo) => {
          const hasRejection = Boolean(wo.rejectionReason);

          return (
            <div
              key={wo.id}
              onClick={() => setSelectedOrder(wo)}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2.5 active:scale-[0.99] transition-transform cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                      {wo.orderCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        wo.priority === 'CRITICAL'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : wo.priority === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {wo.priority === 'CRITICAL' ? '紧急整改' : wo.priority === 'HIGH' ? '高优先' : '常规消缺'}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 leading-snug">
                    {wo.title}
                  </h3>
                </div>
                <StatusBadge status={wo.status} size="sm" />
              </div>

              {/* 退回整改醒目标记 */}
              {hasRejection && wo.status !== 'CLOSED' && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-900 space-y-1">
                  <div className="flex items-center gap-1 text-rose-700 font-bold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>运营复核退回整改原因：</span>
                  </div>
                  <div className="text-rose-800 font-medium leading-relaxed">
                    {wo.rejectionReason}
                  </div>
                  <div className="text-[10px] text-rose-600">
                    请按照复核要求重新现场处置并补充佐证后再次提交。
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {wo.issueDescription || wo.description || '现场巡检发现异常，需要就地核实与整改。'}
              </p>

              {/* 历史整改反馈内容 */}
              {wo.resolutionNotes && (
                <div className="p-2 bg-slate-50 text-slate-700 text-[11px] rounded border border-slate-200 space-y-0.5">
                  <span className="font-semibold text-slate-800">已提交现场整改记录: </span>
                  <p className="line-clamp-2 text-slate-600">{wo.resolutionNotes}</p>
                </div>
              )}

              {/* 关键属性条 */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span className="truncate max-w-[160px] text-slate-700">
                  目标: {wo.deviceTarget || '示范站现场设备'}
                </span>
                <span className="text-slate-400">
                  时限: {wo.deadline?.slice(5, 16) || '今日 18:00'}
                </span>
              </div>

              {/* 交互操作栏 */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                {wo.status === 'PENDING_ACCEPT' ? (
                  <button
                    type="button"
                    onClick={(e) => handleAcceptOrder(wo.id, e)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>立即接单</span>
                  </button>
                ) : wo.status === 'IN_PROGRESS' ? (
                  <button
                    type="button"
                    onClick={(e) => openHandlingModal(wo, e)}
                    className="px-3 py-1 bg-[#004287] hover:bg-[#003366] text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{hasRejection ? '重新提交复核' : '填写处理并送审'}</span>
                  </button>
                ) : wo.status === 'PENDING_REVIEW' ? (
                  <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    等待运营人员 (陈若涵) Web 端复核验收
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    运营复核合格 · 工单归档已关闭
                  </span>
                )}

                <div className="text-xs font-semibold text-[#004287] flex items-center gap-0.5">
                  <span>详情</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}

        {displayedOrders.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400 text-xs border border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <div className="font-semibold text-slate-800">该状态下无工单记录</div>
            <p className="text-[11px] text-slate-500">示范站消缺闭环运行良好，可切换其他分组标签查看。</p>
          </div>
        )}
      </div>

      {/* 工单详情抽屉 (Bottom Sheet) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end p-0">
          <div className="bg-white rounded-t-2xl max-h-[88vh] flex flex-col overflow-hidden animate-slideUp">
            {/* 顶栏 */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedOrder.status} size="sm" />
                <span className="text-xs font-mono text-slate-500 font-semibold">
                  {selectedOrder.orderCode}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-xs text-slate-500 font-bold px-2 py-1 rounded bg-slate-200 hover:bg-slate-300"
              >
                关闭
              </button>
            </div>

            {/* 内容滚动区 */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-snug">
                  {selectedOrder.title}
                </h2>
                <div className="mt-1 text-slate-500 flex flex-wrap items-center gap-2 font-mono text-[11px]">
                  <span>责任人: {selectedOrder.assignee}</span>
                  <span>·</span>
                  <span>复核人: {selectedOrder.reviewer || '陈若涵 (运营人员)'}</span>
                  <span>·</span>
                  <span>派单时间: {selectedOrder.createdAt}</span>
                </div>
              </div>

              {/* 退回原因警示 */}
              {selectedOrder.rejectionReason && selectedOrder.status !== 'CLOSED' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>退回整改历史要求 (未通过原因)</span>
                  </div>
                  <div className="text-xs text-rose-900 leading-relaxed font-medium">
                    {selectedOrder.rejectionReason}
                  </div>
                </div>
              )}

              {/* 缺陷问题详情 */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-semibold text-slate-800 text-[11px]">现场问题与缺陷事实描述</div>
                <p className="text-slate-600 leading-relaxed">
                  {selectedOrder.issueDescription || selectedOrder.description}
                </p>
                <div className="text-[11px] text-slate-500 font-mono pt-1">
                  目标设备: {selectedOrder.deviceTarget || '时代星云 500kW PCS 逆变侧回路'}
                </div>
              </div>

              {/* 关联告警与巡检任务信息 */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                <div className="font-bold text-blue-950 text-[11px] flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>业务溯源链路</span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1 font-mono">
                  <div>· 来源方式: {selectedOrder.source === 'ALARM' ? '告警触发自动派单' : selectedOrder.source === 'PATROL_ABNORMALITY' ? '巡检异常上报派单' : '运营人员人工调度派单'}</div>
                  {selectedOrder.sourceAlarmCode && <div>· 溯源告警编号: {selectedOrder.sourceAlarmCode}</div>}
                  {selectedOrder.traceId && <div>· 全局审计 TraceId: {selectedOrder.traceId}</div>}
                </div>
              </div>

              {/* 现场处理记录与防伪证据 */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-semibold text-slate-800 text-[11px] flex items-center justify-between">
                  <span>现场处理记录与防伪证据</span>
                  <span className="text-[10px] text-slate-400">巡检员现场实录</span>
                </div>
                {selectedOrder.resolutionNotes ? (
                  <div className="space-y-2">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line text-[11px] bg-white p-2.5 rounded-lg border border-slate-200">
                      {selectedOrder.resolutionNotes}
                    </p>
                    {/* 照片占位凭证 */}
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-[11px] text-emerald-800">
                      <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold">现场防伪照片凭证已绑定 (模拟相机水印)</div>
                        <div className="text-[10px] text-emerald-700 font-mono">拍摄时间戳: 2026-09-08 · GPS: 示范站配电室</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-[11px] italic py-1">
                    暂未提交现场整改记录。点击下方按钮填写处理步骤与佐证。
                  </div>
                )}
              </div>

              {/* 业务规则提醒 */}
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <div className="font-semibold">巡检员权限边界：</div>
                <div>· 工单提交后进入【待复核】状态，巡检员无权自行将其置为【已关闭】。</div>
                <div>· 运营人员在 Web 管理端复核通过后方可正式归档关闭。</div>
              </div>
            </div>

            {/* 底部固定操作栏 */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
              {selectedOrder.status === 'PENDING_ACCEPT' ? (
                <button
                  type="button"
                  onClick={(e) => handleAcceptOrder(selectedOrder.id, e)}
                  className="flex-1 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs hover:bg-amber-600 flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>接收此整改工单</span>
                </button>
              ) : selectedOrder.status === 'IN_PROGRESS' ? (
                <button
                  type="button"
                  onClick={() => openHandlingModal(selectedOrder)}
                  className="flex-1 py-2.5 bg-[#004287] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#003366] flex items-center justify-center gap-1"
                >
                  <Send className="w-4 h-4" />
                  <span>{selectedOrder.rejectionReason ? '补充佐证重新送审' : '提交处理说明并送审'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
                >
                  返回工单列表
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 填写整改处理结果弹窗 (Modal) */}
      {handlingModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-[390px] rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-slideUp">
            {/* 顶栏 */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#004287]" />
                <span className="font-bold text-sm text-slate-900">提交现场整改佐证</span>
              </div>
              <button
                onClick={() => setHandlingModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                取消
              </button>
            </div>

            {/* 表单内容 */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <div className="text-[11px] text-blue-900 font-semibold">
                  工单: {handlingModal.order?.orderCode}
                </div>
                <div className="text-xs text-slate-800 font-bold">
                  {handlingModal.order?.title}
                </div>
              </div>

              {/* 处理说明 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>现场处理说明 (必填)</span>
                  <span className="text-[10px] text-rose-500">* 无说明不能进入待复核</span>
                </label>
                <textarea
                  value={handlingModal.notes}
                  onChange={(e) => setHandlingModal((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="请输入就地故障排查、零部件检查与处理结果..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#004287] focus:border-transparent"
                />
              </div>

              {/* 处理步骤细化 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">整改执行步骤</label>
                <textarea
                  value={handlingModal.stepDetails}
                  onChange={(e) => setHandlingModal((prev) => ({ ...prev, stepDetails: e.target.value }))}
                  rows={3}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono text-[11px] focus:ring-2 focus:ring-[#004287] focus:border-transparent"
                />
              </div>

              {/* 现场防伪取证占位 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>现场取证占位凭证 (模拟照片水印)</span>
                  <span className="text-[10px] text-emerald-600 font-medium">防伪时空对齐</span>
                </label>

                <div className="p-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-slate-500" />
                    <div className="text-[11px] text-slate-700 font-medium">
                      {handlingModal.photoPlaceholderName}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    模拟移动端现场拍照占位，生成包含【拍摄者: 林志强】、【站点: 示范站】、【精确时间戳】与防篡改校验码。
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setHandlingModal((prev) => ({
                          ...prev,
                          photoPlaceholderName: `IMG_20260908_现场实测_${Math.floor(100 + Math.random() * 900)}.jpg`,
                        }))
                      }
                      className="text-[10px] font-semibold text-[#004287] hover:underline"
                    >
                      重新生成防伪快照编号
                    </button>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-semibold">
                      已就绪
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHandlingModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-1/3 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
              >
                取消
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitResolution}
                className="flex-1 py-2.5 bg-[#004287] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#003366] flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? '正在提交...' : '确认并提交复核'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

