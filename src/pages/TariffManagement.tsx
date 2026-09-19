import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/AppContext';
import { VersionBadge } from '../components/common/VersionBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DisabledActionTooltip } from '../components/common/DisabledActionTooltip';
import { TariffVersionModal } from '../components/tariffs/TariffVersionModal';
import { TariffDiffViewer } from '../components/tariffs/TariffDiffViewer';
import { TariffApprovalHistory } from '../components/tariffs/TariffApprovalHistory';
import { TariffImpactSection } from '../components/tariffs/TariffImpactSection';
import { validateTariffTimeIntervals } from '../utils/tariffValidation';
import { TariffVersion, TariffTimeInterval } from '../types/domain';
import {
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Edit3,
  Send,
  Trash2,
  XCircle,
  GitCompare,
  Layers,
  History,
  ShieldCheck,
  ShieldAlert,
  Sun,
  Zap,
  Building2,
  FileCheck2,
  FileText,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const TariffManagement: React.FC = () => {
  const {
    tariffScheme,
    tariffSchemes,
    sites,
    site,
    switchSite,
    currentRole,
    currentUser,
    authorizeTariffVersion,
    rejectTariffVersion,
    createTariffDraft,
    updateTariffVersion,
    submitTariffVersion,
    deleteTariffVersion,
    hasPermission,
  } = useAppStore();

  // 当前正在管理配置电价方案的站点 ID
  const [selectedSiteId, setSelectedSiteId] = useState<string>(site.id);

  // 查出当前正在配置的站点的专属电价方案
  const activeScheme = useMemo(() => {
    return tariffSchemes.find((ts) => ts.siteId === selectedSiteId) || tariffScheme;
  }, [tariffSchemes, selectedSiteId, tariffScheme]);

  // 当前选中的站点物理档案
  const currentSelectedSite = useMemo(() => {
    return sites.find((s) => s.id === selectedSiteId) || site;
  }, [sites, selectedSiteId, site]);

  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    activeScheme.currentVersion || activeScheme.versions[0]?.id || ''
  );

  // 当切换站点方案时，自动更新选中的版本号为该站点方案的生效版本
  React.useEffect(() => {
    setSelectedVersionId(activeScheme.currentVersion || activeScheme.versions[0]?.id || '');
  }, [activeScheme.id, activeScheme.currentVersion]);

  const [activeTab, setActiveTab] = useState<
    'SLOTS_24H' | 'ALL_TARIFFS' | 'DIFF' | 'APPROVAL' | 'IMPACT'
  >('SLOTS_24H');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');

  const [feedback, setFeedback] = useState<{ type: 'SUCCESS' | 'ERROR'; message: string } | null>(
    null
  );

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

  const [rejectDialog, setRejectDialog] = useState<{
    isOpen: boolean;
    versionId: string;
    versionNumber: string;
    reason: string;
  }>({
    isOpen: false,
    versionId: '',
    versionNumber: '',
    reason: '',
  });

  const showToast = (type: 'SUCCESS' | 'ERROR', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // 查出当前正在查看的版本 (基于当前选中的站点方案 activeScheme)
  const activeVer: TariffVersion = useMemo(() => {
    return (
      activeScheme.versions.find(
        (v) => v.id === selectedVersionId || v.versionNumber === selectedVersionId
      ) ||
      activeScheme.versions.find((v) => v.versionNumber === activeScheme.currentVersion) ||
      activeScheme.versions[0]
    );
  }, [activeScheme, selectedVersionId]);

  // 基准版本 (通常是当前生效版本，如 V1.0)
  const currentEffectiveVer: TariffVersion = useMemo(() => {
    return (
      activeScheme.versions.find((v) => v.versionNumber === activeScheme.currentVersion) ||
      activeScheme.versions.find((v) => v.status === 'EFFECTIVE') ||
      activeScheme.versions[0]
    );
  }, [activeScheme]);

  // 待审批版本
  const pendingVersion = useMemo(() => {
    return activeScheme.versions.find((v) => v.status === 'PENDING_APPROVAL');
  }, [activeScheme]);

  // 查出当前正在查看版本的 24 小时连续时间段列表（若历史缓存缺失则自动按发改委标准时段提供鲁棒兜底）
  const activeIntervals: TariffTimeInterval[] = useMemo(() => {
    if (activeVer?.timeIntervals && activeVer.timeIntervals.length > 0) {
      return activeVer.timeIntervals;
    }
    // 自动按福建大工业发改委标准 8 段式分时时段兜底
    return [
      { id: 't-def-1', start: '00:00', end: '06:30', label: '低谷', price: activeVer?.slots?.find((s) => s.label === '低谷')?.price ?? 0.326 },
      { id: 't-def-2', start: '06:30', end: '08:30', label: '平段', price: activeVer?.slots?.find((s) => s.label === '平段')?.price ?? 0.685 },
      { id: 't-def-3', start: '08:30', end: '11:30', label: '高峰', price: activeVer?.slots?.find((s) => s.label === '高峰')?.price ?? 1.128 },
      { id: 't-def-4', start: '11:30', end: '14:30', label: '平段', price: activeVer?.slots?.find((s) => s.label === '平段')?.price ?? 0.685 },
      { id: 't-def-5', start: '14:30', end: '19:00', label: '高峰', price: activeVer?.slots?.find((s) => s.label === '高峰')?.price ?? 1.128 },
      { id: 't-def-6', start: '19:00', end: '21:00', label: '尖峰', price: activeVer?.slots?.find((s) => s.label === '尖峰')?.price ?? 1.425 },
      { id: 't-def-7', start: '21:00', end: '23:00', label: '平段', price: activeVer?.slots?.find((s) => s.label === '平段')?.price ?? 0.685 },
      { id: 't-def-8', start: '23:00', end: '24:00', label: '低谷', price: activeVer?.slots?.find((s) => s.label === '低谷')?.price ?? 0.326 },
    ];
  }, [activeVer]);

  // 校验当前活跃版本的 24 小时连续性
  const activeIntervalValidation = useMemo(() => {
    return validateTariffTimeIntervals(activeIntervals);
  }, [activeIntervals]);

  // 职责分离校验：提交者与审批者分离
  const isSubmitterSameAsApprover = useMemo(() => {
    if (!activeVer || activeVer.status !== 'PENDING_APPROVAL') return false;
    return Boolean(activeVer.creator && activeVer.creator.includes(currentUser.name));
  }, [activeVer, currentUser.name]);

  // 颜色映射
  const getSlotColorBadge = (label: string) => {
    switch (label) {
      case '尖峰':
        return 'bg-red-50 text-red-700 border-red-200';
      case '高峰':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case '平段':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case '低谷':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case '深谷':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getSlotColorBar = (label: string) => {
    switch (label) {
      case '尖峰':
        return 'bg-red-500 text-white';
      case '高峰':
        return 'bg-orange-500 text-white';
      case '平段':
        return 'bg-blue-500 text-white';
      case '低谷':
        return 'bg-emerald-500 text-white';
      case '深谷':
        return 'bg-cyan-500 text-white';
      default:
        return 'bg-slate-400 text-white';
    }
  };

  // 保存草稿
  const handleSaveDraft = async (draftData: Partial<TariffVersion>) => {
    if (modalMode === 'CREATE') {
      const res = await createTariffDraft(draftData, activeScheme.id);
      if (res.success) {
        showToast('SUCCESS', res.message);
        if (res.versionId) setSelectedVersionId(res.versionId);
      } else {
        showToast('ERROR', res.message);
      }
    } else {
      const res = await updateTariffVersion(activeVer.id, draftData, activeScheme.id);
      if (res.success) {
        showToast('SUCCESS', res.message);
      } else {
        showToast('ERROR', res.message);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 0. 站点专属电价方案切换卡片 (Site-Specific Tariff Context Bar) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-5 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
                <Building2 className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-white">
                园区站点专属电价配置中心
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-400/20 text-blue-200 border border-blue-400/30 font-medium">
                按站点独立计费隔离
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              不同园区站点具备不同的并网电压等级、光伏装机规模与两部制电价类型。在此切换不同站点的专属电价方案，各站点方案独立编制、独立审批、独立生效，互不干扰。
            </p>
          </div>

          {/* 站点快速切换 Tabs */}
          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 shrink-0 overflow-x-auto">
            {sites.map((s) => {
              const isCurrentSelected = s.id === selectedSiteId;
              const isGlobalActive = s.id === site.id;
              const sScheme = tariffSchemes.find((ts) => ts.siteId === s.id);
              const hasPending = sScheme?.versions.some((v) => v.status === 'PENDING_APPROVAL');

              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSiteId(s.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 relative ${
                    isCurrentSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  <span className="truncate max-w-[120px]">{s.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isCurrentSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {s.code}
                  </span>
                  {hasPending && (
                    <span
                      className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-ping"
                      title="有待二次授权电价版本"
                    />
                  )}
                  {isGlobalActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="当前全局激活监控站点" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 当前选定站点的专属电价配置状态摘要 */}
        <div className="mt-4 pt-3.5 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">当前方案:</span>
              <span className="font-bold text-white">{activeScheme.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">生效基准:</span>
              <span className="font-mono font-bold text-emerald-400">{activeScheme.currentVersion}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">站点参数:</span>
              <span className="font-mono text-slate-200">
                {currentSelectedSite.gridVoltage} · 光伏 {currentSelectedSite.pvCapacityKwp}kWp · 储能 {currentSelectedSite.storageCapacityKwh}kWh
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedSiteId !== site.id ? (
              <button
                onClick={() => {
                  switchSite(selectedSiteId);
                  showToast('SUCCESS', `已同步将全局工作站点切换至【${currentSelectedSite.name}】！`);
                }}
                className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                title="点击将当前配置的站点同步设为全局主工作站点"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>同步设为全局监控站点</span>
              </button>
            ) : (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                全局主控运行中
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 头部导航与操作栏 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-50 text-[#004287]">
              <Receipt className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">{activeScheme.name}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-semibold border border-slate-200">
              {activeScheme.siteId}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            涵盖当地发改委大工业分时购电、光伏上网（固定/阶梯/市场化）、充电桩营运服务费、及两部制基本电费（容量与需量互斥）。
            <span className="font-semibold text-slate-800 ml-1">
              【双人独立审批门禁】：运营人员新建草稿→24小时无重叠无空隙校验→提交审批；系统管理员二次授权生效。历史版本防篡改，永不被覆盖。
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex flex-col items-end mr-1">
            <span className="text-[11px] text-slate-400">核算唯一生效基准</span>
            <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200 font-mono">
              {activeScheme.currentVersion} (已锁定)
            </span>
          </div>

          <DisabledActionTooltip
            disabled={currentRole === 'INSPECTOR' || !hasPermission('tariff_submit')}
            reason={
              !hasPermission('tariff_submit')
                ? '权限策略拦截：当前角色未被授予【电价草稿编制与提交】权限 (tariff_submit)。'
                : '权限受控：巡检员仅有只读权限，无法新建电价方案草稿。'
            }
            recoveryStep="请使用系统管理后台调整角色权限矩阵，或切换至拥有提交权限的角色。"
          >
            <button
              onClick={() => {
                setModalMode('CREATE');
                setIsModalOpen(true);
              }}
              disabled={currentRole === 'INSPECTOR' || !hasPermission('tariff_submit')}
              className="px-3.5 py-2 bg-[#004287] hover:bg-[#003366] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              <span>新建版本草稿</span>
            </button>
          </DisabledActionTooltip>
        </div>
      </div>

      {/* Toast 提示条 */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
            feedback.type === 'SUCCESS'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'SUCCESS' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* 待二次授权预警横幅 (若有待审批版本) */}
      {pendingVersion && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-amber-950 shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  电价版本待二次授权生效：【{pendingVersion.versionNumber}】
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-semibold text-[10px]">
                  等待审核
                </span>
              </div>
              <p className="mt-1 text-amber-900 opacity-90 leading-relaxed">
                编制人: <span className="font-semibold">{pendingVersion.creator}</span> | 提交时间:{' '}
                <span className="font-mono">{pendingVersion.submitTime || '近期'}</span>
                。系统管理员二次授权前，该站点核算仍严格使用基准版本【{activeScheme.currentVersion}
                】。草稿与待审批版本严禁参与计费。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setSelectedVersionId(pendingVersion.id);
                setActiveTab('DIFF');
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-amber-300 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
            >
              <GitCompare className="w-3.5 h-3.5 text-blue-600" />
              查看比对差异
            </button>

            <DisabledActionTooltip
              disabled={currentRole !== 'ADMIN' || !hasPermission('tariff_approve')}
              reason={
                !hasPermission('tariff_approve')
                  ? '权限矩阵拦截：当前角色未被授予【电价二次授权审批生效】权限 (tariff_approve)。'
                  : '权限受控：电价版本生效为高风险操作，仅限【系统管理员】二次授权。'
              }
              recoveryStep="请使用系统顶部控制栏切换至【系统管理员】角色或在权限矩阵中赋权。"
            >
              <button
                disabled={currentRole !== 'ADMIN' || !hasPermission('tariff_approve')}
                onClick={() => {
                  setSelectedVersionId(pendingVersion.id);
                  setConfirmDialog({
                    isOpen: true,
                    title: `系统管理员确认二次授权电价方案 ${pendingVersion.versionNumber}？`,
                    description:
                      `系统将核准该方案为站点【${currentSelectedSite.name}】新计算基准，原生效版本自动转为历史归档，历史结算快照保持不可篡改，并记录不可伪造审计存证。`,
                    action: async () => {
                      const res = await authorizeTariffVersion(pendingVersion.id, activeScheme.id);
                      if (res.success) {
                        showToast('SUCCESS', res.message);
                      } else {
                        showToast('ERROR', res.message);
                      }
                    },
                  });
                }}
                className="px-3.5 py-1.5 bg-[#004287] hover:bg-[#003366] text-white font-semibold rounded-lg transition-colors shadow-2xs disabled:opacity-40 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>管理员：二次授权生效</span>
              </button>
            </DisabledActionTooltip>
          </div>
        </div>
      )}

      {/* 版本列表选择栏 (卡片列表展示) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-semibold text-slate-700">站点专属方案版本历史与草稿列表 ({activeScheme.versions.length} 个版本)</span>
          <span>点击卡片切换选中版本进行详细查看、比对或操作</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activeScheme.versions.map((ver) => {
            const isSelected = activeVer.id === ver.id;
            const isCurrent = ver.versionNumber === activeScheme.currentVersion;
            return (
              <div
                key={ver.id}
                onClick={() => setSelectedVersionId(ver.id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer bg-white space-y-2.5 relative overflow-hidden ${
                  isSelected
                    ? 'border-[#004287] shadow-md ring-2 ring-blue-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Current Badge Banner */}
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-[#004287] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                    生效基准
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <VersionBadge version={ver.versionNumber} status={ver.status} isCurrent={isCurrent} />
                    <StatusBadge status={ver.status} size="sm" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {ver.effectiveDateStart} ~ {ver.effectiveDateEnd}
                  </span>
                </div>

                {/* Slots Price Snippet */}
                <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[11px]">
                  <div className="p-1.5 rounded bg-red-50/80 text-red-700">
                    <div className="text-[9px] text-red-500 font-sans">尖峰</div>
                    <div className="font-bold">¥{ver.slots.find((s) => s.label === '尖峰')?.price ?? '-'}</div>
                  </div>
                  <div className="p-1.5 rounded bg-orange-50/80 text-orange-700">
                    <div className="text-[9px] text-orange-500 font-sans">高峰</div>
                    <div className="font-bold">¥{ver.slots.find((s) => s.label === '高峰')?.price ?? '-'}</div>
                  </div>
                  <div className="p-1.5 rounded bg-blue-50/80 text-blue-700">
                    <div className="text-[9px] text-blue-500 font-sans">平段</div>
                    <div className="font-bold">¥{ver.slots.find((s) => s.label === '平段')?.price ?? '-'}</div>
                  </div>
                  <div className="p-1.5 rounded bg-emerald-50/80 text-emerald-700">
                    <div className="text-[9px] text-emerald-500 font-sans">低谷</div>
                    <div className="font-bold">¥{ver.slots.find((s) => s.label === '低谷')?.price ?? '-'}</div>
                  </div>
                </div>

                {/* Subinfo */}
                <div className="text-[11px] text-slate-500 truncate pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>编制: {ver.creator}</span>
                  <span className="text-slate-400 font-mono">
                    {ver.status === 'EFFECTIVE'
                      ? '已授权'
                      : ver.status === 'PENDING_APPROVAL'
                      ? '待授权'
                      : ver.status === 'REJECTED'
                      ? '已退回'
                      : '草稿'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 选中版本的控制看板 (ActionBar & Details) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Top Control Bar for selected version */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <VersionBadge
              version={activeVer.versionNumber}
              status={activeVer.status}
              isCurrent={activeVer.versionNumber === activeScheme.currentVersion}
            />
            <StatusBadge status={activeVer.status} />
            <div className="text-xs text-slate-500">
              生效期: <span className="font-mono font-semibold text-slate-700">{activeVer.effectiveDateStart}</span> 至{' '}
              <span className="font-mono font-semibold text-slate-700">{activeVer.effectiveDateEnd}</span>
            </div>
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Action 1: Edit Draft (if DRAFT or REJECTED) */}
            {(activeVer.status === 'DRAFT' || activeVer.status === 'REJECTED') && (
              <DisabledActionTooltip
                disabled={currentRole === 'INSPECTOR'}
                reason="权限受控：巡检员无权编辑草稿。"
                recoveryStep="请切换至【运营人员】或【系统管理员】角色。"
              >
                <button
                  disabled={currentRole === 'INSPECTOR'}
                  onClick={() => {
                    setModalMode('EDIT');
                    setIsModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>编辑草稿</span>
                </button>
              </DisabledActionTooltip>
            )}

            {/* Action 2: Submit for Approval (if DRAFT or REJECTED) */}
            {(activeVer.status === 'DRAFT' || activeVer.status === 'REJECTED') && (
              <DisabledActionTooltip
                disabled={currentRole === 'INSPECTOR'}
                reason="权限受控：巡检员无权提交审批。"
                recoveryStep="请切换至【运营人员】角色提交二次授权。"
              >
                <button
                  disabled={currentRole === 'INSPECTOR'}
                  onClick={() => {
                    if (!activeIntervalValidation.isValid) {
                      showToast('ERROR', '时段校验未通过：必须完整覆盖 24 小时且无重叠间隙方可提交审批！');
                      return;
                    }
                    setConfirmDialog({
                      isOpen: true,
                      title: `确认提交方案 ${activeVer.versionNumber} 审批？`,
                      description:
                        '该方案已完成 24 小时覆盖与价格校验。提交后状态转为待二次授权，由系统管理员独立审核核准。',
                      action: async () => {
                        const res = await submitTariffVersion(activeVer.id, activeScheme.id);
                        if (res.success) {
                          showToast('SUCCESS', res.message);
                        } else {
                          showToast('ERROR', res.message);
                        }
                      },
                    });
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#004287] hover:bg-[#003366] text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>提交二次授权审批</span>
                </button>
              </DisabledActionTooltip>
            )}

            {/* Action 3: Admin Approval (if PENDING_APPROVAL) */}
            {activeVer.status === 'PENDING_APPROVAL' && (
              <>
                <DisabledActionTooltip
                  disabled={currentRole !== 'ADMIN' || !hasPermission('tariff_approve') || isSubmitterSameAsApprover}
                  reason={
                    !hasPermission('tariff_approve')
                      ? '权限矩阵拦截：当前角色未被授予【电价二次授权审批生效】权限 (tariff_approve)。'
                      : currentRole !== 'ADMIN'
                      ? '权限不足：只有【系统管理员】有权执行二次授权。'
                      : '职责分离门禁：编制提交人与审批人严禁相同，必须由另一名系统管理员独立复核！'
                  }
                  recoveryStep="请使用系统管理员角色进行独立审批。"
                >
                  <button
                    disabled={currentRole !== 'ADMIN' || !hasPermission('tariff_approve') || isSubmitterSameAsApprover}
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: `系统管理员确认二次授权生效方案 ${activeVer.versionNumber}？`,
                        description:
                          `核验证明文件与发改委时段政策一致。授权生效后将成为站点【${currentSelectedSite.name}】电能量和收益核算唯一基准。历史快照受不可篡改保护。`,
                        action: async () => {
                          const res = await authorizeTariffVersion(activeVer.id, activeScheme.id);
                          if (res.success) {
                            showToast('SUCCESS', res.message);
                          } else {
                            showToast('ERROR', res.message);
                          }
                        },
                      });
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-40"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>批准并二次授权生效</span>
                  </button>
                </DisabledActionTooltip>

                {/* Action 4: Admin Rejection */}
                <DisabledActionTooltip
                  disabled={currentRole !== 'ADMIN'}
                  reason="权限受控：仅系统管理员有权驳回电价申请。"
                  recoveryStep="请切换至【系统管理员】角色后操作。"
                >
                  <button
                    disabled={currentRole !== 'ADMIN'}
                    onClick={() => {
                      setRejectDialog({
                        isOpen: true,
                        versionId: activeVer.id,
                        versionNumber: activeVer.versionNumber,
                        reason: '分时时段与当地发改委最新发文字号存在细微偏差，退回草稿重新核实调整。',
                      });
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg flex items-center gap-1 transition-colors shadow-2xs disabled:opacity-40"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>驳回申请</span>
                  </button>
                </DisabledActionTooltip>
              </>
            )}

            {/* Action 5: Delete Draft (if not EFFECTIVE) */}
            {activeVer.status !== 'EFFECTIVE' && (
              <DisabledActionTooltip
                disabled={currentRole === 'INSPECTOR'}
                reason="权限受控：巡检员无权删除方案版本。"
                recoveryStep="请切换至【运营人员】或【系统管理员】角色。"
              >
                <button
                  disabled={currentRole === 'INSPECTOR'}
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: `确定删除电价方案草稿 ${activeVer.versionNumber}？`,
                      description: '删除后草稿数据与未生效时段将被移除，此操作不可恢复。',
                      action: async () => {
                        const res = await deleteTariffVersion(activeVer.id, activeScheme.id);
                        if (res.success) {
                          showToast('SUCCESS', res.message);
                          setSelectedVersionId(activeScheme.currentVersion);
                        } else {
                          showToast('ERROR', res.message);
                        }
                      },
                    });
                  }}
                  className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors p-1"
                  title="删除未生效草稿"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </DisabledActionTooltip>
            )}

            {/* Action 6: Clone as Draft (if EFFECTIVE) */}
            {activeVer.status === 'EFFECTIVE' && (
              <button
                onClick={() => {
                  setModalMode('CREATE');
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-[#004287] border border-blue-200 rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>基于此版本创建新草稿</span>
              </button>
            )}
          </div>
        </div>

        {/* If Rejected Banner */}
        {activeVer.status === 'REJECTED' && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-xs text-red-900 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <span className="font-bold">方案已被驳回：</span>
              {activeVer.rejectReason || '退回草稿修改'}。请点击【编辑草稿】修正参数后重新提交。
            </span>
          </div>
        )}

        {/* Tab Navigation for Detailed Views */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('SLOTS_24H')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'SLOTS_24H'
                ? 'border-[#004287] text-[#004287] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            24 小时分时时段配置与校验
          </button>
          <button
            onClick={() => setActiveTab('ALL_TARIFFS')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'ALL_TARIFFS'
                ? 'border-[#004287] text-[#004287] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            四类电价综合明细看板
          </button>
          <button
            onClick={() => setActiveTab('DIFF')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'DIFF'
                ? 'border-[#004287] text-[#004287] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            版本比对与参数差异
          </button>
          <button
            onClick={() => setActiveTab('APPROVAL')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'APPROVAL'
                ? 'border-[#004287] text-[#004287] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            二次授权审计记录
          </button>
          <button
            onClick={() => setActiveTab('IMPACT')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'IMPACT'
                ? 'border-[#004287] text-[#004287] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            影响范围与核算隔离
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6">
          {/* TAB 1: 24-HOUR CONTINUITY & SLOTS */}
          {activeTab === 'SLOTS_24H' && (
            <div className="space-y-6">
              {/* Coverage & Continuity Check Card */}
              <div
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs ${
                  activeIntervalValidation.isValid
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  {activeIntervalValidation.isValid ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {activeIntervalValidation.isValid
                        ? '24 小时连续性校验通过：00:00–24:00 完整覆盖，无任何重叠或间隙'
                        : '时段存在异常，尚未完全满足 00:00–24:00 连续性覆盖要求'}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      全天总计 1440 分钟，当前已配置{' '}
                      {(activeIntervalValidation.totalCoveredMinutes / 60).toFixed(1)} 小时 (
                      {(activeIntervalValidation.coverageRatio * 100).toFixed(1)}%)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 font-mono font-bold text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-sans">时段条目数:</span>
                    <span>{activeIntervals.length} 段</span>
                  </div>
                </div>
              </div>

              {/* 24-hour visual proportional stripe */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    24 小时分时时段分布可视化 (尖/峰/平/谷/深谷)
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-red-500" />
                      <span>尖峰</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-orange-500" />
                      <span>高峰</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-blue-500" />
                      <span>平段</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-emerald-500" />
                      <span>低谷</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-cyan-500" />
                      <span>深谷</span>
                    </span>
                  </div>
                </div>

                {/* The visual bar */}
                <div className="h-11 w-full rounded-xl overflow-hidden flex border border-slate-200 bg-slate-100 text-xs font-bold shadow-2xs">
                  {activeIntervals.map((it, idx) => {
                    const sH = parseInt(it.start.split(':')[0], 10);
                    const sM = parseInt(it.start.split(':')[1], 10);
                    const eH = parseInt(it.end.split(':')[0], 10);
                    const eM = parseInt(it.end.split(':')[1], 10);
                    const sMin = sH * 60 + sM;
                    const eMin = eH === 24 ? 1440 : eH * 60 + eM;
                    const widthPct = Math.max(1.5, ((eMin - sMin) / 1440) * 100);

                    return (
                      <div
                        key={it.id || idx}
                        style={{ width: `${widthPct}%` }}
                        className={`h-full flex flex-col items-center justify-center transition-all border-r border-white/20 truncate px-1 ${getSlotColorBar(
                          it.label
                        )}`}
                        title={`${it.start} - ${it.end} [${it.label}] ¥${it.price}/kWh`}
                      >
                        <span className="text-[11px] leading-tight">{it.label}</span>
                        <span className="text-[9px] font-mono opacity-90">¥{it.price}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-0.5">
                  <span>00:00 (低谷启动)</span>
                  <span>06:30 (平段)</span>
                  <span>08:30 (高峰)</span>
                  <span>12:00 (深谷/午间消纳)</span>
                  <span>19:00 (尖峰)</span>
                  <span>24:00</span>
                </div>
              </div>

              {/* Interval detail cards grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 block">各时段区间与执行电价明细</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {activeIntervals.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-bold border ${getSlotColorBadge(
                            it.label
                          )}`}
                        >
                          {it.label}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-900">
                          ¥{it.price.toFixed(3)}/kWh
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-600 flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-slate-400 font-sans">时间区间:</span>
                        <span>
                          {it.start} - {it.end}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL 4 TARIFFS */}
          {activeTab === 'ALL_TARIFFS' && (
            <div className="space-y-6">
              {/* Category 1: TOU Purchase */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
                      <Clock className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-bold text-slate-900">一、分时购电电价 (工商业大工业)</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    发改委核定标准 | 尖/峰/平/谷/深谷 5 级费率
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-3 font-mono text-xs">
                  {activeVer.slots.map((s) => (
                    <div
                      key={s.label}
                      className="p-3 rounded-lg border border-slate-200 bg-white space-y-1"
                    >
                      <div className="flex justify-between items-center font-sans">
                        <span className="font-bold text-slate-700">{s.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">元/kWh</span>
                      </div>
                      <div className="text-lg font-bold text-slate-900">¥{s.price.toFixed(3)}</div>
                      <div className="text-[10px] text-slate-500 truncate" title={s.period}>
                        {s.period}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 2: PV Feed-in */}
              <div className="p-5 border border-amber-200/80 rounded-xl bg-amber-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                      <Sun className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-bold text-amber-950">二、分布式光伏上网电价</span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold font-mono">
                    当前模式:{' '}
                    {activeVer.pvConfig?.mode === 'FIXED'
                      ? '固定上网标杆价'
                      : activeVer.pvConfig?.mode === 'TIERED'
                      ? '阶梯就地消纳价'
                      : '电力市场撮合价'}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-white space-y-2 text-xs">
                  <div className="font-semibold text-slate-800">结算执行细则与价格参数：</div>
                  <div className="font-mono text-slate-700 leading-relaxed">
                    {activeVer.pvConfig?.description || '按福建省脱硫标杆基准价执行结算'}
                  </div>

                  {activeVer.pvConfig?.mode === 'TIERED' && activeVer.pvConfig.tieredConfig && (
                    <div className="grid grid-cols-3 gap-3 pt-2 font-mono">
                      <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block text-[11px] font-sans">分档阈值:</span>
                        <span className="font-bold text-slate-900">
                          {activeVer.pvConfig.tieredConfig.thresholdKwh.toLocaleString()} kWh/月
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200">
                        <span className="text-emerald-700 block text-[11px] font-sans">一档单价:</span>
                        <span className="font-bold text-emerald-800">
                          ¥{activeVer.pvConfig.tieredConfig.tier1Price.toFixed(4)} /kWh
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-amber-50 border border-amber-200">
                        <span className="text-amber-700 block text-[11px] font-sans">二档单价:</span>
                        <span className="font-bold text-amber-800">
                          ¥{activeVer.pvConfig.tieredConfig.tier2Price.toFixed(4)} /kWh
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Category 3: Charging service fee */}
              <div className="p-5 border border-blue-200/80 rounded-xl bg-blue-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
                      <Zap className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-bold text-blue-950">三、直流充电桩营运服务费及电量价</span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold font-mono">
                    服务费: ¥{(activeVer.chargingConfig?.serviceFee ?? 0.4).toFixed(2)} 元/kWh
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-blue-200 bg-white space-y-2">
                    <span className="font-bold text-slate-800">营运服务费固定加价</span>
                    <div className="text-slate-600 leading-relaxed">
                      用户最终充电总支付 = 该时段分时电价 + 营运服务费（¥
                      {(activeVer.chargingConfig?.serviceFee ?? 0.4).toFixed(2)}/kWh）。
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-blue-200 bg-white space-y-2">
                    <span className="font-bold text-slate-800">综合结算价格范围预估</span>
                    <div className="font-mono text-slate-700 space-y-1">
                      <div>
                        尖峰时段总价: ¥
                        {(
                          (activeVer.chargingConfig?.energyPriceTou?.sharp ?? 1.45) +
                          (activeVer.chargingConfig?.serviceFee ?? 0.4)
                        ).toFixed(3)}
                        /kWh
                      </div>
                      <div>
                        低谷时段总价: ¥
                        {(
                          (activeVer.chargingConfig?.energyPriceTou?.valley ?? 0.32) +
                          (activeVer.chargingConfig?.serviceFee ?? 0.4)
                        ).toFixed(3)}
                        /kWh
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category 4: Basic fee (Mutually Exclusive) */}
              <div className="p-5 border border-purple-200/80 rounded-xl bg-purple-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-purple-100 text-purple-800">
                      <Building2 className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-bold text-purple-950">
                      四、基本电费两部制计费 (容量电费 vs 需量电费)
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded bg-purple-200 text-purple-900 font-bold font-mono">
                    两部制互斥生效中: {activeVer.basicFeeConfig?.type === 'CAPACITY' ? '容量电费' : '需量电费'}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-purple-200 bg-white text-xs space-y-2">
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>核定计费方案与月度结算规则：</span>
                  </div>
                  <p className="font-mono text-slate-700 leading-relaxed">
                    {activeVer.basicFeeConfig?.description || '容量电费或需量电费'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIFF */}
          {activeTab === 'DIFF' && (
            <TariffDiffViewer
              baseVersion={currentEffectiveVer}
              targetVersion={activeVer}
            />
          )}

          {/* TAB 4: APPROVAL */}
          {activeTab === 'APPROVAL' && (
            <TariffApprovalHistory version={activeVer} />
          )}

          {/* TAB 5: IMPACT */}
          {activeTab === 'IMPACT' && (
            <TariffImpactSection version={activeVer} />
          )}
        </div>
      </div>

      {/* 新建/编辑草稿弹窗 */}
      <TariffVersionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDraft}
        initialVersion={modalMode === 'EDIT' ? activeVer : null}
        mode={modalMode}
      />

      {/* 确认操作对话框 */}
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

      {/* 驳回意见输入弹窗 */}
      {rejectDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <h3 className="font-bold text-slate-900">驳回电价申请 ({rejectDialog.versionNumber})</h3>
            </div>
            <p className="text-xs text-slate-600">
              请填写明确的审核驳回意见。驳回后版本状态将重置为草稿，驳回记录将归档至审计存证中供编制人整改。
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">审核驳回原因与修改意见</label>
              <textarea
                rows={3}
                value={rejectDialog.reason}
                onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                placeholder="输入驳回依据或需修改的时段参数"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectDialog({ ...rejectDialog, isOpen: false })}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  const res = await rejectTariffVersion(
                    rejectDialog.versionId,
                    rejectDialog.reason,
                    activeScheme.id
                  );
                  setRejectDialog({ ...rejectDialog, isOpen: false });
                  if (res.success) {
                    showToast('SUCCESS', res.message);
                  } else {
                    showToast('ERROR', res.message);
                  }
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-2xs"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
