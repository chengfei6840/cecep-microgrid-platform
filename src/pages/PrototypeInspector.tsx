import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { QualityTag } from '../components/common/QualityTag';
import { VersionBadge } from '../components/common/VersionBadge';
import { SlaTimer } from '../components/common/SlaTimer';
import { AuditTimeline } from '../components/common/AuditTimeline';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DetailDrawer } from '../components/common/DetailDrawer';
import { DisabledActionTooltip } from '../components/common/DisabledActionTooltip';
import {
  Sliders,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Zap,
  Activity,
  DollarSign,
  AlertTriangle,
  Wrench,
  Bot,
  Database,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrototypeInspector: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentRole,
    currentUser,
    switchRole,
    scenario,
    switchScenario,
    resetDemoData,
    site,
    adapters,
    devices,
    points,
    qualityIssues,
    tariffScheme,
    revenueSnapshots,
    recalcBatches,
    alarms,
    agentEvents,
    patrolTasks,
    workOrders,
    auditLogs,
    authorizeTariffVersion,
    resolveQualityIssue,
    verifyAdapter,
    initiateRevenueRecalculation,
    reviewWorkOrder,
  } = useAppStore();

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

  const [activeDrawer, setActiveDrawer] = useState<{
    isOpen: boolean;
    title: string;
    subTitle?: string;
    content: React.ReactNode;
  }>({
    isOpen: false,
    title: '',
    content: null,
  });

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const storageAdapter = adapters.find((a) => a.type === 'STORAGE_EMS');
  const criticalAlarm = alarms.find((a) => a.severity === 'CRITICAL');
  const pendingIssue = qualityIssues.find((q) => q.status === 'PENDING');
  const v2Tariff = tariffScheme.versions.find((v) => v.versionNumber === 'V2.0');
  const todayRev = revenueSnapshots.find((r) => r.calcType === 'ESTIMATE');
  const yesterdayRev = revenueSnapshots.find((r) => r.calcType === 'SETTLEMENT');

  return (
    <div className="space-y-6 pb-12">
      {/* 顶部醒目标题与快捷操作区 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-blue-50 text-[#004287] rounded-lg">
                <Sliders className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                原型基础检查与全域闭环联动控制台
              </h1>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
              当前为一期试点【低碳园区示范站】全域实体联动检查台。在此直观检验“数据接入→质量校验→电价生效→运行监测→告警SLA→Agent决策→巡检整改→收益核算”跨页面共享状态。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  title: '确认重置数据？',
                  description:
                    '将清除 localStorage 中的本地变更，恢复至场景 A 默认初始状态。',
                  action: async () => {
                    resetDemoData();
                    showFeedback('数据已重置为场景 A 初始状态');
                  },
                });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重置数据</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#004287] hover:bg-[#003366] rounded-lg transition-colors shadow-xs"
            >
              <span>进入首页总览</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 交互反馈浮条 */}
        {actionFeedback && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">{actionFeedback}</span>
            </div>
            <span className="text-[11px] text-emerald-600">已实时同步下游页面与审计日志</span>
          </div>
        )}

        {/* 场景与角色快捷切换栏 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
          {/* 场景切换器 */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>场景选择 (ScenarioController)</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                当前: {scenario === 'SCENARIO_A' ? '场景 A' : '场景 B'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  switchScenario('SCENARIO_A');
                  showFeedback('已切换至场景 A：正常运营');
                }}
                className={`p-2.5 rounded-lg border text-left transition-all text-xs ${
                  scenario === 'SCENARIO_A'
                    ? 'bg-blue-50 border-[#004287] text-[#004287] font-bold shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="font-semibold">场景 A: 正常运营</div>
                <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                  五类接口在线，电价 V1.0 生效，昨日收益结算完成
                </div>
              </button>
              <button
                onClick={() => {
                  switchScenario('SCENARIO_B');
                  showFeedback('已切换至场景 B：储能 EMS 异常闭环');
                }}
                className={`p-2.5 rounded-lg border text-left transition-all text-xs ${
                  scenario === 'SCENARIO_B'
                    ? 'bg-amber-50 border-amber-600 text-amber-900 font-bold shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="font-semibold">场景 B: 储能EMS异常闭环</div>
                <div className="text-[11px] font-normal text-amber-700/80 mt-0.5">
                  储能断线超时 → 告警 → Agent建议 → 工单巡检 → 补采 → 收益重算
                </div>
              </button>
            </div>
          </div>

          {/* 角色切换器 */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>操作角色与权限</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                操作人: {currentUser.name} ({currentUser.roleTitle})
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  switchRole('ADMIN');
                  showFeedback('已切换身份为【系统管理员：张宇轩】');
                }}
                className={`p-2 rounded-lg border text-center transition-all text-xs ${
                  currentRole === 'ADMIN'
                    ? 'bg-white border-[#004287] text-[#004287] font-bold shadow-2xs'
                    : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <div className="font-semibold">系统管理员</div>
                <div className="text-[10px] text-slate-400">电价二次授权</div>
              </button>
              <button
                onClick={() => {
                  switchRole('OPERATOR');
                  showFeedback('已切换身份为【运营人员：陈若涵】');
                }}
                className={`p-2 rounded-lg border text-center transition-all text-xs ${
                  currentRole === 'OPERATOR'
                    ? 'bg-white border-[#004287] text-[#004287] font-bold shadow-2xs'
                    : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <div className="font-semibold">运营人员</div>
                <div className="text-[10px] text-slate-400">核算/工单复核</div>
              </button>
              <button
                onClick={() => {
                  switchRole('INSPECTOR');
                  showFeedback('已切换身份为【巡检员：林志强】');
                }}
                className={`p-2 rounded-lg border text-center transition-all text-xs ${
                  currentRole === 'INSPECTOR'
                    ? 'bg-white border-[#004287] text-[#004287] font-bold shadow-2xs'
                    : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <div className="font-semibold">现场巡检员</div>
                <div className="text-[10px] text-slate-400">移动点检与整改</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 核心业务闭环 9 大节点全景看板 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 节点 1: 数据接入与适配器 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-sm font-bold text-slate-900">数据接入适配器</h2>
              </div>
              <button
                onClick={() => navigate('/data/integrations')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>接入管理</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              光伏、储能、充电桩、电表、气象 5 类适配器均使用统一实体关联。
            </p>

            <div className="space-y-2 text-xs">
              {adapters.map((ad) => (
                <div
                  key={ad.id}
                  className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-100"
                >
                  <span className="truncate max-w-[170px] text-slate-700 font-medium">
                    {ad.platformName}
                  </span>
                  <StatusBadge status={ad.status} size="sm" />
                </div>
              ))}
            </div>
          </div>

          {storageAdapter?.status === 'RETRYING' && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: '重新验证储能 EMS 接口握手？',
                    description:
                      '模拟现场网络恢复后，向前置通信机重新发起 Modbus/TCP 鉴权与心跳握手。',
                    action: async () => {
                      const res = await verifyAdapter('ADAPTER-STORAGE-02');
                      showFeedback(res.message);
                    },
                  });
                }}
                className="w-full py-1.5 px-3 bg-blue-50 text-[#004287] border border-blue-200 rounded-md text-xs font-semibold hover:bg-blue-100 transition-colors"
              >
                模拟重新验证储能 EMS 接口
              </button>
            </div>
          )}
        </div>

        {/* 节点 2: 数据质量与补采 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-sm font-bold text-slate-900">数据质量与置信度</h2>
              </div>
              <button
                onClick={() => navigate('/data/quality')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>质量详情</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              质量等级（正常、补录、可疑、异常）直接联动收益核算置信度。
            </p>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">点位映射状态：</span>
                <span className="font-semibold text-emerald-700">100% 映射已校核</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">储能点位当前质量：</span>
                <QualityTag level={points.find((p) => p.id.includes('BAT'))?.currentQuality || 'NORMAL'} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">昨日数据置信度：</span>
                <span
                  className={`font-mono font-bold ${
                    yesterdayRev && yesterdayRev.dataConfidencePercent < 85
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {yesterdayRev?.dataConfidencePercent.toFixed(1)}%
                </span>
              </div>
            </div>

            {pendingIssue && (
              <div className="mt-3 p-2.5 rounded bg-red-50 border border-red-100 text-xs">
                <div className="font-semibold text-red-800">
                  {pendingIssue.targetDevice}：{pendingIssue.dimensionLabel}
                </div>
                <div className="text-[11px] text-red-700 mt-0.5">
                  {pendingIssue.description}
                </div>
              </div>
            )}
          </div>

          {pendingIssue && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: '执行储能历史数据断点补采？',
                    description:
                      '模拟触发历史补采批次，将数据质量由【异常】转为【补录】，提升置信度并解除结算锁定。',
                    action: async () => {
                      const res = await resolveQualityIssue(pendingIssue.id, 'AUTO_BACKFILL');
                      showFeedback(res.message);
                    },
                  });
                }}
                className="w-full py-1.5 px-3 bg-emerald-600 text-white rounded-md text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
              >
                触发历史断点补采回填
              </button>
            </div>
          )}
        </div>

        {/* 节点 3: 电价方案与二次授权 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h2 className="text-sm font-bold text-slate-900">电价生效与二次授权</h2>
              </div>
              <button
                onClick={() => navigate('/tariffs')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>电价管理</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              规则：未审批电价严禁用于核算，电价生效必须由【系统管理员】二次授权。
            </p>

            <div className="space-y-2 text-xs">
              {tariffScheme.versions.map((ver) => (
                <div
                  key={ver.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <VersionBadge
                        version={ver.versionNumber}
                        status={ver.status}
                        isCurrent={ver.versionNumber === tariffScheme.currentVersion}
                      />
                      <StatusBadge status={ver.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      尖峰 {ver.slots[0].price}元 | 谷 {ver.slots[3].price}元
                    </div>
                  </div>
                  {ver.approver && (
                    <span className="text-[10px] text-slate-500 text-right">
                      {ver.approver.slice(0, 3)}已授权
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {v2Tariff && v2Tariff.status === 'PENDING_APPROVAL' && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <DisabledActionTooltip
                disabled={currentRole !== 'ADMIN'}
                reason="业务规则：电价二次授权仅限【系统管理员】角色操作。"
                recoveryStep="请在上方切换身份为【系统管理员】即可批准生效。"
              >
                <button
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: '执行电价版本 V2.0 二次授权？',
                      description:
                        '系统管理员二次核验发改委批复时段无误，授权生效后可用于后续结算重算。',
                      action: async () => {
                        const res = await authorizeTariffVersion(v2Tariff.id);
                        showFeedback(res.message);
                      },
                    });
                  }}
                  className="w-full py-1.5 px-3 bg-[#004287] text-white rounded-md text-xs font-semibold hover:bg-[#003366] transition-colors shadow-xs"
                >
                  系统管理员：执行 V2.0 二次授权
                </button>
              </DisabledActionTooltip>
            </div>
          )}
        </div>
      </div>

      {/* 中部: 告警、Agent Hub 与 现场工单闭环 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 节点 4: 告警与 SLA */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <h2 className="text-sm font-bold text-slate-900">告警处置与 SLA</h2>
              </div>
              <button
                onClick={() => navigate('/alarms')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>告警中心</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              紧急告警 15 分钟确认 / 30 分钟处置；判定误报或忽略必须留存审计理由。
            </p>

            <div className="space-y-2 text-xs">
              {alarms.map((alm) => (
                <div
                  key={alm.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                      {alm.alarmTitle}
                    </span>
                    <StatusBadge status={alm.status} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{alm.deviceName}</span>
                    <SlaTimer
                      deadlineStr={alm.slaDeadlineTime}
                      severity={alm.severity}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 节点 5: Agent Hub 辅助决策 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                  5
                </span>
                <h2 className="text-sm font-bold text-slate-900">Agent 辅助决策</h2>
              </div>
              <button
                onClick={() => navigate('/agent-hub')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>事件协作中心</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              规则：Agent 仅输出分析与建议，严禁自动执行设备动作或自动结算。
            </p>

            <div className="space-y-2 text-xs">
              {agentEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900">{ev.agentName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                      置信度 {ev.confidenceScore}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-snug">
                    {ev.aiSummary}
                  </p>
                  <div className="text-[10px] text-slate-400">
                    建议动作: {ev.suggestedAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 节点 6: 现场工单与复核闭环 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                  6
                </span>
                <h2 className="text-sm font-bold text-slate-900">整改工单与复核</h2>
              </div>
              <button
                onClick={() => navigate('/operations/work-orders')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>工单管理</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              巡检员提交后进入【待复核】，由运营人员确认关闭或退回整改。
            </p>

            <div className="space-y-2 text-xs">
              {workOrders.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-lg">
                  当前无进行中的整改工单
                </div>
              ) : (
                workOrders.map((wo) => (
                  <div
                    key={wo.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                        {wo.title}
                      </span>
                      <StatusBadge status={wo.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      责任人: {wo.assignee} | 来源: {wo.source}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {workOrders.some((w) => w.status === 'PENDING_REVIEW') && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <DisabledActionTooltip
                disabled={currentRole !== 'OPERATOR' && currentRole !== 'ADMIN'}
                reason="工单复核仅限【运营人员】或系统管理员操作。"
                recoveryStep="请切换角色至运营人员执行复核关闭。"
              >
                <button
                  onClick={() => {
                    const target = workOrders.find((w) => w.status === 'PENDING_REVIEW');
                    if (target) {
                      setConfirmDialog({
                        isOpen: true,
                        title: `确认通过并关闭工单 ${target.orderCode}？`,
                        description:
                          '核实验收佐证与现场测温无误，工单正式归档关闭。',
                        action: async () => {
                          const res = await reviewWorkOrder(target.id, true, '现场整改合格，复核通过');
                          showFeedback(res.message);
                        },
                      });
                    }
                  }}
                  className="w-full py-1.5 px-3 bg-emerald-600 text-white rounded-md text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  运营人员：复核通过并关闭工单
                </button>
              </DisabledActionTooltip>
            </div>
          )}
        </div>
      </div>

      {/* 底部: 收益核算对比 (V1/V2) 与 追溯审计流 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 收益中心快照与 V1/V2 对比 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                7
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                收益核算与 V1 / V2 版本追溯
              </h2>
            </div>
            <button
              onClick={() => navigate('/revenue')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>收益中心</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <p className="text-xs text-slate-500 mb-3">
            实时估算与 T+1 日终结算具有不同口径。异常修正后生成 V2 并完整保留 V1。
          </p>

          <div className="space-y-3 text-xs">
            {revenueSnapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{snap.dateKey}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        snap.calcType === 'SETTLEMENT'
                          ? 'bg-blue-100 text-blue-800 font-bold'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {snap.calcType === 'SETTLEMENT' ? 'T+1 结算' : '实时估算'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    综合净收益: ¥{snap.netComprehensiveRevenue.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 font-mono">
                  <div>光伏: +¥{snap.pvRevenue.toFixed(1)}</div>
                  <div>储能: +¥{snap.storageArbitrage.toFixed(1)}</div>
                  <div>充电: +¥{snap.chargingRevenue.toFixed(1)}</div>
                  <div>购电: -¥{snap.gridPurchaseCost.toFixed(1)}</div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>引用电价: {snap.referencedTariffVersion}</span>
                  <span
                    className={
                      snap.dataConfidencePercent < 85 ? 'text-amber-600 font-bold' : ''
                    }
                  >
                    数据置信度: {snap.dataConfidencePercent.toFixed(1)}%
                  </span>
                </div>

                {snap.warningMessage && (
                  <div className="p-1.5 bg-amber-50 text-amber-800 text-[10px] rounded border border-amber-200">
                    ⚠ {snap.warningMessage}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 发起收益重算按钮 */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  title: '确认发起昨日收益 T+1 重算？',
                  description:
                    '基于补采后的有效数据与当前生效电价版本重新核算，生成 V2 记录并保留 V1 对比。',
                  action: async () => {
                    const res = await initiateRevenueRecalculation('储能历史补采回填，执行 V2 重算');
                    showFeedback(res.message);
                  },
                });
              }}
              className="w-full py-2 px-3 bg-blue-700 text-white rounded-md text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
            >
              发起收益核算重算 (生成 V2 并保留 V1)
            </button>
          </div>
        </div>

        {/* 审计日志时间线 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                  8
                </span>
                <h2 className="text-sm font-bold text-slate-900">
                  全流程审计轨迹与 TraceId
                </h2>
              </div>
              <button
                onClick={() => navigate('/admin/audit')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>完整日志</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              记录时间、角色、对象、动作、旧状态、新状态、原因和模拟 traceId。
            </p>

            <div className="max-h-[420px] overflow-y-auto pr-2">
              <AuditTimeline logs={auditLogs} maxDisplay={5} />
            </div>
          </div>
        </div>
      </div>

      {/* 通用确认对话框 */}
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

      {/* 通用详情抽屉 */}
      <DetailDrawer
        isOpen={activeDrawer.isOpen}
        onClose={() => setActiveDrawer((prev) => ({ ...prev, isOpen: false }))}
        title={activeDrawer.title}
        subTitle={activeDrawer.subTitle}
      >
        {activeDrawer.content}
      </DetailDrawer>
    </div>
  );
};
