import React, { useState } from 'react';
import { useAppStore } from '../../store/AppContext';
import { PatrolPlan, PatrolPlanCycle } from '../../types/domain';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DisabledActionTooltip } from '../../components/common/DisabledActionTooltip';
import {
  ClipboardList,
  Plus,
  Play,
  Pause,
  Trash2,
  Calendar,
  Layers,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  Eye,
  Edit3,
  ShieldAlert,
  Info,
  ChevronRight,
  User,
} from 'lucide-react';

export const PatrolPlansPage: React.FC = () => {
  const {
    patrolPlans,
    createPatrolPlan,
    updatePatrolPlan,
    togglePatrolPlanStatus,
    cancelPatrolPlan,
    generateTaskFromPlan,
    currentRole,
    currentUser,
  } = useAppStore();

  const isInspector = currentRole === 'INSPECTOR';
  const isAdmin = currentRole === 'ADMIN';
  const canManage = currentRole === 'ADMIN' || currentRole === 'OPERATOR';

  // 筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [cycleFilter, setCycleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // 反馈提示
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 查看检查项规程抽屉
  const [viewingPlan, setViewingPlan] = useState<PatrolPlan | null>(null);

  // 作废弹窗状态
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; plan: PatrolPlan | null; reason: string }>({
    isOpen: false,
    plan: null,
    reason: '',
  });

  // 编辑/新建计划模态框
  const [planModal, setPlanModal] = useState<{
    isOpen: boolean;
    mode: 'CREATE' | 'EDIT';
    planId?: string;
    planName: string;
    cycle: PatrolPlanCycle;
    route: string;
    deviceScope: string[];
    responsiblePerson: string;
    startDate: string;
    endDate: string;
    description: string;
    templateItems: Array<{ id: string; itemName: string; method: string; standard: string; deviceTarget?: string }>;
  }>({
    isOpen: false,
    mode: 'CREATE',
    planName: '',
    cycle: 'DAILY',
    route: '10kV 配电室 → 储能集装箱 PCS → 光伏逆变升压区 → 充电桩群',
    deviceScope: ['储能变流器 (PCS-01)', '磷酸铁锂电池簇群', '集中式逆变器 (INV-01)'],
    responsiblePerson: '林志强 (巡检员)',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '2026-12-31',
    description: '常规巡视站点电气绝缘、环境温湿度、接线端子与仪表指示',
    templateItems: [
      { id: 'TI-01', itemName: '储能电池舱温湿度及消防气体指示', method: '就地观察与仪表读数', standard: '温度 18-28℃，湿度 ≤65%RH，压力指针在绿区', deviceTarget: '储能集装箱' },
      { id: 'TI-02', itemName: '逆变器及变压器运行声响与异味', method: '耳听鼻嗅', standard: '声音平稳均匀，无剧烈蜂鸣或焦糊异味', deviceTarget: '光伏逆变器' },
      { id: 'TI-03', itemName: '电气电缆接线端子接触面温升', method: '红外点温计测量', standard: '接线端子温度与环境温升 ≤30K，无变色发热', deviceTarget: '10kV 配电室' },
      { id: 'TI-04', itemName: '充电桩充电枪锁止机构与急停开关', method: '机械卡位与目视', standard: '急停常闭正常弹起，枪头无物理变形烧蚀', deviceTarget: '充电桩群' },
    ],
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // 统计数据
  const totalPlans = patrolPlans.length;
  const activePlans = patrolPlans.filter((p) => p.status === 'ACTIVE').length;
  const pausedPlans = patrolPlans.filter((p) => p.status === 'PAUSED').length;
  const cancelledPlans = patrolPlans.filter((p) => p.status === 'CANCELLED').length;

  // 过滤后的计划列表
  const filteredPlans = patrolPlans.filter((plan) => {
    const matchSearch =
      plan.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.planCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.responsiblePerson.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCycle = cycleFilter === 'ALL' || plan.cycle === cycleFilter;
    const matchStatus = statusFilter === 'ALL' || plan.status === statusFilter;
    return matchSearch && matchCycle && matchStatus;
  });

  const openCreateModal = () => {
    setPlanModal({
      isOpen: true,
      mode: 'CREATE',
      planName: '',
      cycle: 'DAILY',
      route: '10kV 配电室 → 储能集装箱 PCS → 光伏逆变升压区 → 充电桩群',
      deviceScope: ['储能变流器 (PCS-01)', '磷酸铁锂电池簇群', '集中式逆变器 (INV-01)'],
      responsiblePerson: '林志强 (巡检员)',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '2026-12-31',
      description: '定期全站电气连接与防雷绝缘综合检查规程',
      templateItems: [
        { id: 'TI-01', itemName: '储能电池舱温湿度及消防气体指示', method: '就地观察与仪表读数', standard: '温度 18-28℃，湿度 ≤65%RH，压力指针在绿区', deviceTarget: '储能集装箱' },
        { id: 'TI-02', itemName: '逆变器及变压器运行声响与异味', method: '耳听鼻嗅', standard: '声音平稳均匀，无剧烈蜂鸣或焦糊异味', deviceTarget: '光伏逆变器' },
        { id: 'TI-03', itemName: '电气电缆接线端子接触面温升', method: '红外点温计测量', standard: '接线端子温度与环境温升 ≤30K，无变色发热', deviceTarget: '10kV 配电室' },
        { id: 'TI-04', itemName: '充电桩充电枪锁止机构与急停开关', method: '机械卡位与目视', standard: '急停常闭正常弹起，枪头无物理变形烧蚀', deviceTarget: '充电桩群' },
      ],
    });
  };

  const openEditModal = (plan: PatrolPlan) => {
    setPlanModal({
      isOpen: true,
      mode: 'EDIT',
      planId: plan.id,
      planName: plan.planName,
      cycle: plan.cycle,
      route: plan.route,
      deviceScope: [...plan.deviceScope],
      responsiblePerson: plan.responsiblePerson,
      startDate: plan.startDate,
      endDate: plan.endDate,
      description: plan.description || '',
      templateItems: plan.templateItems ? [...plan.templateItems] : [],
    });
  };

  const handleSavePlan = async () => {
    if (!planModal.planName.trim()) {
      showNotification('请输入巡检计划名称', 'error');
      return;
    }
    if (!planModal.route.trim()) {
      showNotification('请输入巡视路线', 'error');
      return;
    }

    if (planModal.mode === 'CREATE') {
      const res = await createPatrolPlan({
        planName: planModal.planName.trim(),
        cycle: planModal.cycle,
        route: planModal.route.trim(),
        deviceScope: planModal.deviceScope,
        templateItems: planModal.templateItems,
        responsiblePerson: planModal.responsiblePerson,
        startDate: planModal.startDate,
        endDate: planModal.endDate,
        status: 'ACTIVE',
        description: planModal.description,
        version: 'V1.0',
      });
      if (res.success) {
        showNotification(res.message);
        setPlanModal((prev) => ({ ...prev, isOpen: false }));
      } else {
        showNotification(res.message, 'error');
      }
    } else if (planModal.planId) {
      const res = await updatePatrolPlan(planModal.planId, {
        planName: planModal.planName.trim(),
        cycle: planModal.cycle,
        route: planModal.route.trim(),
        deviceScope: planModal.deviceScope,
        templateItems: planModal.templateItems,
        responsiblePerson: planModal.responsiblePerson,
        startDate: planModal.startDate,
        endDate: planModal.endDate,
        description: planModal.description,
      });
      if (res.success) {
        showNotification(res.message);
        setPlanModal((prev) => ({ ...prev, isOpen: false }));
      } else {
        showNotification(res.message, 'error');
      }
    }
  };

  const handleGenerateTask = async (plan: PatrolPlan) => {
    const res = await generateTaskFromPlan(plan.id);
    if (res.success) {
      showNotification(res.message);
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleToggleStatus = async (plan: PatrolPlan) => {
    const res = await togglePatrolPlanStatus(plan.id);
    if (res.success) {
      showNotification(res.message);
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.plan) return;
    if (!cancelModal.reason.trim()) {
      showNotification('请填写作废原因', 'error');
      return;
    }
    const res = await cancelPatrolPlan(cancelModal.plan.id, cancelModal.reason);
    if (res.success) {
      showNotification(res.message);
      setCancelModal({ isOpen: false, plan: null, reason: '' });
    } else {
      showNotification(res.message, 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 顶部标题与面包屑卡片 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-lg bg-blue-50 text-[#004287]">
              <ClipboardList className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              站点巡检计划与规程编排
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-blue-50 text-[#004287] border border-blue-200 font-semibold">
              规程基线快照驱动
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            面向示范站编排日常点检、红外测温与月度专项规程。配置检查周期、设备清单与核验要点模板；启用后按周期排程自动生成巡检任务。
            <strong className="text-slate-800 font-semibold ml-1">
              修改计划仅影响未来任务，历史与执行中任务已固化基线快照。
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <DisabledActionTooltip
            disabled={!canManage}
            reason="权限不足：仅【系统管理员】或【运营人员】可编排巡检规程计划。"
            recoveryStep="请在左侧侧边栏切换身份至【运营人员】或【系统管理员】。"
          >
            <button
              id="btn-create-patrol-plan"
              disabled={!canManage}
              onClick={openCreateModal}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs shadow-xs transition-all ${
                canManage
                  ? 'bg-[#004287] hover:bg-[#003366] text-white cursor-pointer active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>新建巡检计划</span>
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
              巡检计划由系统管理员与运营人员统一维护。您可在本页面查阅全站巡视规程基线与检查要点；若需执行已派发的现场任务，请前往
              <a href="/mobile-simulator" className="text-[#004287] font-semibold underline underline-offset-2 ml-1 mr-1">
                移动端巡检工作台
              </a>
              进行现场扫码打卡、录入读数与上报事实。
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
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* KPI 指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1">全部规程计划</div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{totalPlans}</div>
          <div className="text-[11px] text-slate-400 mt-1">涵盖全站 4 类重要运行资产</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1">启用排程中</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">{activePlans}</div>
          <div className="text-[11px] text-emerald-700/80 mt-1">按周期排程自动派发</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1">已暂停排程</div>
          <div className="text-2xl font-bold text-amber-600 font-mono">{pausedPlans}</div>
          <div className="text-[11px] text-slate-400 mt-1">处于维护期或人工暂停</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1">已作废规程</div>
          <div className="text-2xl font-bold text-slate-400 font-mono">{cancelledPlans}</div>
          <div className="text-[11px] text-slate-400 mt-1">保留完整历史审计轨迹</div>
        </div>
      </div>

      {/* 搜索与过滤工具栏 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索计划名称/编号/责任人..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287] bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-xs">
            <span className="text-slate-400 font-medium">周期:</span>
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-[#004287]"
            >
              <option value="ALL">全部周期</option>
              <option value="DAILY">每日巡检</option>
              <option value="WEEKLY">每周特巡</option>
              <option value="MONTHLY">月度专项</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-xs">
            <span className="text-slate-400 font-medium">状态:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-[#004287]"
            >
              <option value="ALL">全部状态</option>
              <option value="ACTIVE">启用中</option>
              <option value="PAUSED">已暂停</option>
              <option value="CANCELLED">已作废</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 w-full md:w-auto text-right">
          显示 {filteredPlans.length} / {totalPlans} 条巡检计划
        </div>
      </div>

      {/* 计划列表卡片 */}
      <div className="space-y-4">
        {filteredPlans.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            未检索到符合条件的巡检计划规程
          </div>
        ) : (
          filteredPlans.map((plan) => {
            const isCancelled = plan.status === 'CANCELLED';
            const isPaused = plan.status === 'PAUSED';
            const isActive = plan.status === 'ACTIVE';

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition-all space-y-4 ${
                  isCancelled
                    ? 'border-slate-200 bg-slate-50/40 opacity-75'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* 计划头部 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {plan.planCode}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900">{plan.planName}</h2>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-[#004287] font-semibold border border-blue-200">
                      规程快照: {plan.version || 'V1.0'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                      {plan.cycle === 'DAILY' ? '每日巡检' : plan.cycle === 'WEEKLY' ? '每周特巡' : '月度专项'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={plan.status} size="sm" />
                  </div>
                </div>

                {/* 规程核心参数 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium mb-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#004287]" />
                      <span>巡视路线与区域</span>
                    </div>
                    <div className="font-medium text-slate-800 break-words">{plan.route}</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400 font-medium mb-0.5 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-[#004287]" />
                      <span>覆盖设备范围 ({plan.deviceScope.length} 类)</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {plan.deviceScope.map((dev, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200"
                        >
                          {dev}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400 font-medium mb-0.5 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#004287]" />
                      <span>责任人与生效时效</span>
                    </div>
                    <div className="text-slate-800 font-medium">
                      责任人: <span className="text-[#004287] font-semibold">{plan.responsiblePerson}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      有效周期: {plan.startDate} ~ {plan.endDate}
                    </div>
                  </div>
                </div>

                {/* 描述与最新生成记录 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{plan.description || '按规程实施红外测温与设备运行参数就地抄录。'}</span>
                  </div>
                  {plan.lastGeneratedAt && (
                    <div className="text-[11px] font-mono text-slate-400 shrink-0">
                      最近任务生成: {plan.lastGeneratedAt}
                    </div>
                  )}
                </div>

                {/* 底部操作工具栏 */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingPlan(plan)}
                      className="inline-flex items-center gap-1 text-xs text-[#004287] hover:text-[#003366] font-medium px-2.5 py-1.5 rounded-lg bg-blue-50/60 hover:bg-blue-100/60 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>查看检查项规程 ({plan.templateItems?.length || 0}项)</span>
                    </button>
                    <span className="text-[11px] text-slate-400">
                      创建时间: {plan.createdAt || '2026-09-01'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 按计划生成任务 */}
                    <DisabledActionTooltip
                      disabled={!canManage || !isActive}
                      reason={
                        !canManage
                          ? '权限不足：仅【运营人员】或【系统管理员】可从计划派发任务。'
                          : '该计划当前处于暂停或作废状态，无法生成新任务。'
                      }
                      recoveryStep={
                        !canManage
                          ? '请在侧边栏切换身份至【运营人员】或【系统管理员】。'
                          : '请先点击【启用】计划以恢复自动任务生成排程。'
                      }
                    >
                      <button
                        disabled={!canManage || !isActive}
                        onClick={() => handleGenerateTask(plan)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                          canManage && isActive
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>按计划生成任务</span>
                      </button>
                    </DisabledActionTooltip>

                    {/* 编辑计划规程 */}
                    <DisabledActionTooltip
                      disabled={!canManage || isCancelled}
                      reason={
                        !canManage
                          ? '权限不足：仅【系统管理员】或【运营人员】可修改计划规程。'
                          : '已作废计划无法编辑。'
                      }
                    >
                      <button
                        disabled={!canManage || isCancelled}
                        onClick={() => openEditModal(plan)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          canManage && !isCancelled
                            ? 'border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer'
                            : 'border-slate-200 text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>编辑规程</span>
                      </button>
                    </DisabledActionTooltip>

                    {/* 暂停 / 启用 */}
                    {!isCancelled && (
                      <DisabledActionTooltip
                        disabled={!canManage}
                        reason="权限不足：仅系统管理员或运营人员可启停巡检计划。"
                      >
                        <button
                          disabled={!canManage}
                          onClick={() => handleToggleStatus(plan)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                            isActive
                              ? 'border-amber-200 text-amber-700 hover:bg-amber-50 bg-amber-50/30'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-emerald-50/30'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>暂停排程</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>恢复启用</span>
                            </>
                          )}
                        </button>
                      </DisabledActionTooltip>
                    )}

                    {/* 作废计划 (系统管理员专属) */}
                    {!isCancelled && (
                      <DisabledActionTooltip
                        disabled={!isAdmin}
                        reason="权限不足：作废巡检计划属于高敏操作，仅【系统管理员】有权执行。"
                        recoveryStep="请切换角色至【系统管理员】后执行作废。"
                      >
                        <button
                          disabled={!isAdmin}
                          onClick={() => setCancelModal({ isOpen: true, plan, reason: '' })}
                          className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isAdmin
                              ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                              : 'text-slate-300 border border-slate-100 cursor-not-allowed'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>作废</span>
                        </button>
                      </DisabledActionTooltip>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 规程检查要点抽屉 */}
      {viewingPlan && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#004287] border border-blue-200">
                    {viewingPlan.planCode}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">{viewingPlan.planName}</h2>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  当前规程版本: <span className="font-semibold text-slate-800">{viewingPlan.version || 'V1.0'}</span> | 责任人: {viewingPlan.responsiblePerson}
                </div>
              </div>
              <button
                onClick={() => setViewingPlan(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs"
              >
                ✕ 关闭
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#004287]" />
                <span>固化检查要点模板 ({viewingPlan.templateItems?.length || 0}项)</span>
              </div>

              <div className="space-y-3">
                {viewingPlan.templateItems?.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-[#004287] font-mono text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{item.itemName}</span>
                      </div>
                      {item.deviceTarget && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 shrink-0">
                          {item.deviceTarget}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <div>
                        <span className="text-slate-400 font-medium">核验方法: </span>
                        <span className="font-medium text-slate-800">{item.method}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">合格评判标准: </span>
                        <span className="font-medium text-emerald-800">{item.standard}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-[#004287] space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>基线快照防篡改原则</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  当根据该计划生成任务时，上述检查项要点将作为任务执行基线快照被复制冻结。即便后续运营人员对计划模板进行升级（如 V1.0 → V1.1），此前已生成任务仍严格依据历史基线执行。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新建/编辑计划规程模态框 */}
      {planModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-[#004287]">
                  <ClipboardList className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {planModal.mode === 'CREATE' ? '新建巡检计划规程' : '编辑巡检计划规程'}
                </h3>
              </div>
              <button
                onClick={() => setPlanModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            {planModal.mode === 'EDIT' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>版本隔离提示：</strong>修改计划将产生新版本（如 V1.1），修改仅对未来任务生效，不能覆盖已生成的历史或执行中任务。
                </span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  计划规程名称 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={planModal.planName}
                  onChange={(e) => setPlanModal({ ...planModal, planName: e.target.value })}
                  placeholder="例如：示范站 10kV 储能配电区日常全项巡检"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">巡检周期</label>
                  <select
                    value={planModal.cycle}
                    onChange={(e) => setPlanModal({ ...planModal, cycle: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287] bg-white"
                  >
                    <option value="DAILY">每日巡检 (DAILY)</option>
                    <option value="WEEKLY">每周特巡 (WEEKLY)</option>
                    <option value="MONTHLY">月度专项 (MONTHLY)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">责任巡检人</label>
                  <input
                    type="text"
                    value={planModal.responsiblePerson}
                    onChange={(e) => setPlanModal({ ...planModal, responsiblePerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  巡视路线与打卡点位 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={planModal.route}
                  onChange={(e) => setPlanModal({ ...planModal, route: e.target.value })}
                  placeholder="例如：10kV 配电室 → 储能集装箱 PCS → 光伏逆变升压区 → 充电桩群"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">开始生效日期</label>
                  <input
                    type="date"
                    value={planModal.startDate}
                    onChange={(e) => setPlanModal({ ...planModal, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">结束截止日期</label>
                  <input
                    type="date"
                    value={planModal.endDate}
                    onChange={(e) => setPlanModal({ ...planModal, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">规程说明与安全交底</label>
                <textarea
                  rows={2}
                  value={planModal.description}
                  onChange={(e) => setPlanModal({ ...planModal, description: e.target.value })}
                  placeholder="执行巡视人员需穿戴绝缘劳保手套与绝缘工器具，严禁打开带电舱门..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#004287]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">
                  检查项模板清单 ({planModal.templateItems.length} 项)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {planModal.templateItems.map((item, idx) => (
                    <div key={item.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-[#004287] bg-blue-100 px-1 rounded">{idx + 1}</span>
                          <span>{item.itemName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.method} | <span className="text-emerald-700">{item.standard}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setPlanModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSavePlan}
                className="px-5 py-2 rounded-lg bg-[#004287] hover:bg-[#003366] text-white font-semibold shadow-xs"
              >
                {planModal.mode === 'CREATE' ? '确认创建计划' : '保存规程升级'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 作废计划模态框 (系统管理员) */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                作废巡检计划规程
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              您正在作废规程【<strong className="text-slate-800">{cancelModal.plan?.planName}</strong>】。
              作废后该规程将停止自动排程生成任务，但系统将保留不可篡改的历史审计记录。
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                作废原因说明 <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={cancelModal.reason}
                onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                placeholder="例如：示范站储能系统扩容改造完成，已升级由新规程覆盖并归档..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setCancelModal({ isOpen: false, plan: null, reason: '' })}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
              >
                确认作废规程
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
