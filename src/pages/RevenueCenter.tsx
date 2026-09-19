import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/AppContext';
import { RevenueCaliberHeader } from '../components/revenue/RevenueCaliberHeader';
import { RevenueKpiCards } from '../components/revenue/RevenueKpiCards';
import { RevenueTrendCompositionChart } from '../components/revenue/RevenueTrendCompositionChart';
import { RevenueCalculationTable } from '../components/revenue/RevenueCalculationTable';
import { RevenueRecalculationPanel } from '../components/revenue/RevenueRecalculationPanel';
import { RevenueDrilldownModal } from '../components/revenue/RevenueDrilldownModal';
import { RevenueRecalculateDialog } from '../components/revenue/RevenueRecalculateDialog';
import {
  evaluateSettlementGates,
  generateRevenueBreakdownItems,
  aggregateRevenueKpis,
  generateTimeslotTrendData,
  REVENUE_FORMULA_CONFIG,
} from '../utils/revenueRules';
import { RevenueBreakdownItem } from '../types/revenue';
import {
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  FileText,
  History,
  Layers,
  Sparkles,
  AlertOctagon,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const RevenueCenter: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentRole,
    currentUser,
    switchRole,
    scenario,
    tariffScheme,
    revenueSnapshots,
    recalcBatches,
    initiateRevenueRecalculation,
    hasPermission,
  } = useAppStore();

  // 1. 口径与日期筛选状态
  const [caliber, setCaliber] = useState<'ESTIMATE' | 'SETTLEMENT'>('SETTLEMENT');
  const [dateFilterType, setDateFilterType] = useState<'DATE' | 'MONTH' | 'YEAR'>('DATE');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-04');

  // 2. 页面主视图页签
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BATCHES' | 'RULES'>('OVERVIEW');

  // 3. 弹窗与交互状态
  const [drilldownItem, setDrilldownItem] = useState<RevenueBreakdownItem | null>(null);
  const [isRecalcDialogOpen, setIsRecalcDialogOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 4. 模拟测试开关（用于检验结算门禁完整逻辑）
  const [simulatePendingOrders, setSimulatePendingOrders] = useState<boolean>(false);

  // 判断是否已有 V2 重算版本生成
  const isRecalculatedV2 = useMemo(() => {
    return (
      revenueSnapshots.some((s) => s.id.includes('V2') || s.qualityFlag === 'RECALCULATED') ||
      recalcBatches.length > 0
    );
  }, [revenueSnapshots, recalcBatches]);

  // 5. 门禁评估
  const gateStatus = useMemo(() => {
    return evaluateSettlementGates(
      tariffScheme,
      scenario,
      simulatePendingOrders,
      isRecalculatedV2
    );
  }, [tariffScheme, scenario, simulatePendingOrders, isRecalculatedV2]);

  // 6. 生成细分计算项
  const effectiveTariffVer = tariffScheme.currentVersion || 'V1.0';
  const breakdownItems = useMemo(() => {
    return generateRevenueBreakdownItems({
      caliber,
      scenario,
      tariffVersion: effectiveTariffVer,
      isV2: isRecalculatedV2,
      hasPendingOrders: simulatePendingOrders,
    });
  }, [caliber, scenario, effectiveTariffVer, isRecalculatedV2, simulatePendingOrders]);

  // 7. 汇总 7 大 KPI
  const kpiSummary = useMemo(() => {
    return aggregateRevenueKpis(
      breakdownItems,
      effectiveTariffVer,
      gateStatus.dataConfidencePercent
    );
  }, [breakdownItems, effectiveTariffVer, gateStatus.dataConfidencePercent]);

  // 8. 走势数据
  const trendData = useMemo(() => {
    return generateTimeslotTrendData(caliber);
  }, [caliber]);

  // 巡检员权限门禁
  if (currentRole === 'INSPECTOR') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-12 shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">
            访问权限受限 (403 Unauthorized)
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            当前身份为【现场巡检员 - 林志强】，无权查阅微电网财务对账与结算收益核心数据。
            财务收益核算仅对【运营人员】及【系统管理员】开放。
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => switchRole('OPERATOR')}
            className="px-4 py-2 bg-[#004287] hover:bg-[#003366] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>切换至运营人员身份</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            返回首页大屏
          </button>
        </div>
      </div>
    );
  }

  // 处理发起重算入口（带按钮级权限矩阵检查）
  const handleOpenRecalculate = () => {
    if (!hasPermission('revenue_recalc')) {
      setToastMessage('权限策略拦截：当前角色未被授予【收益重算与版本归档】权限 (revenue_recalc)。');
      return;
    }
    setIsRecalcDialogOpen(true);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* 1. 顶部口径切换与控制区 */}
      <RevenueCaliberHeader
        caliber={caliber}
        onCaliberChange={setCaliber}
        dateFilterType={dateFilterType}
        onDateFilterTypeChange={setDateFilterType}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        gateStatus={gateStatus}
        currentRole={currentRole}
        onOpenRecalculateDialog={handleOpenRecalculate}
        isRecalculatedV2={isRecalculatedV2}
        onJumpToQuality={() => navigate('/data/quality')}
      />

      {/* 2. 交互 Feedback Toast */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. 页面模块二级页签 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'OVERVIEW'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>收益总览与穿透核算</span>
          </button>

          <button
            onClick={() => setActiveTab('BATCHES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'BATCHES'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>重算批次与版本对账</span>
            {recalcBatches.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-mono">
                {recalcBatches.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('RULES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'RULES'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>计算规则与公式配置</span>
          </button>
        </div>

        {/* 辅助门禁控制 */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="text-[11px] font-medium">门禁测试项:</span>
          <label className="flex items-center gap-1.5 cursor-pointer select-none bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1 rounded-lg transition-colors">
            <input
              type="checkbox"
              checked={simulatePendingOrders}
              onChange={(e) => setSimulatePendingOrders(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0 cursor-pointer"
            />
            <span className="text-[11px] font-semibold text-slate-700">
              模拟充电未完成同步 (订单挂起)
            </span>
          </label>
        </div>
      </div>

      {/* 4. Tab 1：收益总览与穿透核算 */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-5">
          {/* 7 大 KPI 核心卡 */}
          <RevenueKpiCards
            kpis={kpiSummary}
            caliber={caliber}
            onDrilldown={(category) => {
              if (category === 'ALL') {
                setDrilldownItem(breakdownItems[0]);
              } else {
                const target = breakdownItems.find((i) => i.category === category) || breakdownItems[0];
                setDrilldownItem(target);
              }
            }}
            onJumpToTariff={() => navigate('/tariffs')}
          />

          {/* 趋势与构成图 */}
          <RevenueTrendCompositionChart
            kpis={kpiSummary}
            trendData={trendData}
            caliber={caliber}
          />

          {/* 计算明细表 */}
          <RevenueCalculationTable
            items={breakdownItems}
            onSelectRow={(item) => setDrilldownItem(item)}
            caliber={caliber}
          />
        </div>
      )}

      {/* 5. Tab 2：重算批次页签 */}
      {activeTab === 'BATCHES' && (
        <RevenueRecalculationPanel
          batches={recalcBatches}
          onOpenRecalculateDialog={handleOpenRecalculate}
          canInitiate={hasPermission('revenue_recalc')}
        />
      )}

      {/* 6. Tab 3：计算规则与公式配置 */}
      {activeTab === 'RULES' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                微电网四项收益与综合运营核算业务规则字典
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                集中配置与说明平台各子模块公式推导逻辑。
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              {REVENUE_FORMULA_CONFIG.disclaimer}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REVENUE_FORMULA_CONFIG.rules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{rule.name}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                    {rule.code}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 font-mono text-xs font-bold text-blue-950">
                  {rule.formula}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-950 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>结算门禁与置信度审计安全策略</span>
            </h4>
            <ul className="space-y-1 text-[11px] text-blue-900/80 list-disc pl-4">
              <li>
                <strong>无生效电价禁止结算：</strong>当系统无生效状态（EFFECTIVE）的电价版本时，日终结算通道被阻断，不可进行财务封账。
              </li>
              <li>
                <strong>订单未同步安全拦截：</strong>特来电或第三方充电运营商订单数据未完成流水对账前，冻结充电收益核算。
              </li>
              <li>
                <strong>数据质量置信度降级告警：</strong>当关键测点（如储能 PCS 变流器或双向关口表）发生通信断点时，置信度下浮；低于 85% 预警阈值时提示财务不可用风险，待补采后重算。
              </li>
              <li>
                <strong>多版本留存与不可覆盖原则：</strong>每次重算均生成不可篡改的新版本（V2.0），原版本（V1.0）及批次差异永久留存，可供审计复核。
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* 7. 钻取详情 Modal */}
      <RevenueDrilldownModal
        item={drilldownItem}
        onClose={() => setDrilldownItem(null)}
        caliber={caliber}
      />

      {/* 8. 发起重算对话框 (带二次确认) */}
      <RevenueRecalculateDialog
        isOpen={isRecalcDialogOpen}
        onClose={() => setIsRecalcDialogOpen(false)}
        onConfirm={async (reason) => {
          const res = await initiateRevenueRecalculation(reason);
          setToastMessage(res.message);
          return res;
        }}
        currentV1Net={kpiSummary.netComprehensiveRevenue}
      />
    </div>
  );
};
