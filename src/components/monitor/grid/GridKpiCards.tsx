import React from 'react';
import { GridKpiData } from '../../../types/grid';
import {
  Activity,
  Zap,
  Gauge,
  ShieldCheck,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  HelpCircle,
  Clock,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';

interface GridKpiCardsProps {
  gridKpi: GridKpiData;
  onOpenMeterDrawer?: () => void;
}

export const GridKpiCards: React.FC<GridKpiCardsProps> = ({
  gridKpi,
  onOpenMeterDrawer,
}) => {
  const isPurchase = gridKpi.gridPowerKw !== null && gridKpi.gridPowerKw > 0;
  const isFeedIn = gridKpi.gridPowerKw !== null && gridKpi.gridPowerKw < 0;
  const isOffline = gridKpi.gridPowerKw === null;

  return (
    <div className="space-y-4">
      {/* 需量超限/接近限制处置告警提示条 (严格遵守：仅提供预警与处置建议，绝不提供控制按钮) */}
      {gridKpi.isDemandNearLimit && (
        <div
          id="grid-demand-warning-banner"
          className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3.5"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-amber-900">
                合同需量越限预警提示 (运行建议)
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-200/60 text-amber-800">
                需量利用率 {gridKpi.demandUtilizationPercent}% (警戒值 ≥ 80%)
              </span>
            </div>
            <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
              {gridKpi.demandWarningMessage}
            </p>
            <div className="mt-2.5 flex items-center gap-4 text-[11px] text-amber-700/80">
              <span>当前需量: <strong>{gridKpi.currentDemandKw} kW</strong></span>
              <span>合同申报需量: <strong>{gridKpi.contractDemandKw} kW</strong></span>
              <span>核算政策: 超出申报需量 105% 部分按 2 倍核收基本电费</span>
            </div>
          </div>
        </div>
      )}

      {/* 6 大核心 KPI 网格卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: 购/售电功率 */}
        <div
          id="kpi-grid-power"
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-600" />
              关口购/售电功率
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                isOffline
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : isPurchase
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : isFeedIn
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {gridKpi.gridDirectionLabel}
            </span>
          </div>

          <div className="my-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900">
                {isOffline
                  ? '--'
                  : Math.abs(gridKpi.gridPowerKw!).toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-slate-400">kW</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              {isOffline ? (
                <span className="text-rose-600">关口电能表失联</span>
              ) : isPurchase ? (
                <>
                  <ArrowDownLeft className="w-3 h-3 text-purple-600 inline" />
                  从 10kV 上级电网购电 (下网受电)
                </>
              ) : isFeedIn ? (
                <>
                  <ArrowUpRight className="w-3 h-3 text-emerald-600 inline" />
                  微网余电反送上级电网 (反送上网)
                </>
              ) : (
                '近零功率动态微平衡'
              )}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>规约: DL/T 645-2007</span>
            {onOpenMeterDrawer && (
              <button
                onClick={onOpenMeterDrawer}
                className="text-purple-600 hover:text-purple-700 font-medium hover:underline"
              >
                表计工况
              </button>
            )}
          </div>
        </div>

        {/* KPI 2: 站内总负荷 */}
        <div
          id="kpi-station-load"
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              站内用电总负荷
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700">
              单向受电
            </span>
          </div>

          <div className="my-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900">
                {gridKpi.totalStationLoadKw.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-slate-400">kW</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
              <div className="flex justify-between">
                <span>充电桩负荷 (P08):</span>
                <span className="font-mono font-medium text-slate-700">
                  {gridKpi.chargingLoadKw.toFixed(1)} kW
                </span>
              </div>
              <div className="flex justify-between">
                <span>办公与辅动负荷:</span>
                <span className="font-mono font-medium text-slate-700">
                  {gridKpi.baseStationLoadKw.toFixed(1)} kW
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>实测采样 15s</span>
            <span className="text-emerald-600 font-medium">数据同源</span>
          </div>
        </div>

        {/* KPI 3: 当前实测需量 */}
        <div
          id="kpi-current-demand"
          className={`bg-white rounded-xl border p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between ${
            gridKpi.isDemandNearLimit
              ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400/30'
              : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-600" />
              当前实测需量 (15min)
            </span>
            {gridKpi.isDemandNearLimit && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                接近限额
              </span>
            )}
          </div>

          <div className="my-2.5">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-black font-mono tracking-tight ${
                  gridKpi.isDemandNearLimit ? 'text-amber-700' : 'text-slate-900'
                }`}
              >
                {gridKpi.currentDemandKw.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-slate-400">kW</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              滑窗 15 分钟最大有功功率测量
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>窗口: 15min 滑移</span>
            <span className="font-mono text-slate-600">P_max 监测</span>
          </div>
        </div>

        {/* KPI 4: 合同需量与利用率 */}
        <div
          id="kpi-contract-demand"
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              合同需量与利用率
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {gridKpi.contractDemandKw} kW
            </span>
          </div>

          <div className="my-2.5">
            <div className="flex items-baseline justify-between">
              <span
                className={`text-2xl font-black font-mono tracking-tight ${
                  gridKpi.isDemandNearLimit ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {gridKpi.demandUtilizationPercent}%
              </span>
              <span className="text-[11px] text-slate-500">
                剩余可用 {(gridKpi.contractDemandKw - gridKpi.currentDemandKw).toFixed(1)} kW
              </span>
            </div>

            {/* 利用率进度条 */}
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  gridKpi.demandUtilizationPercent >= 90
                    ? 'bg-rose-500'
                    : gridKpi.demandUtilizationPercent >= 80
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, gridKpi.demandUtilizationPercent)}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>基准: 福建电网合同</span>
            <span className="text-slate-500">警戒线: 80%</span>
          </div>
        </div>

        {/* KPI 5: 功率因数 */}
        <div
          id="kpi-power-factor"
          className={`bg-white rounded-xl border p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between ${
            gridKpi.powerFactorQuality !== 'NORMAL'
              ? 'border-amber-400 bg-amber-50/20'
              : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              功率因数 (cosφ)
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                gridKpi.powerFactor >= 0.90
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {gridKpi.powerFactor >= 0.90 ? '优良达标' : '偏低可疑'}
            </span>
          </div>

          <div className="my-2.5">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-black font-mono tracking-tight ${
                  gridKpi.powerFactor >= 0.90 ? 'text-slate-900' : 'text-amber-700'
                }`}
              >
                {gridKpi.powerFactor.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-slate-400">cosφ</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              无功功率 {gridKpi.reactivePowerKvar.toFixed(1)} kvar · 频率 {gridKpi.gridFrequencyHz} Hz
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>电网考核线: ≥ 0.90</span>
            <span className={gridKpi.powerFactor >= 0.9 ? 'text-teal-600' : 'text-amber-600'}>
              {gridKpi.powerFactor >= 0.9 ? '力率奖罚免征' : '力率调整增收'}
            </span>
          </div>
        </div>

        {/* KPI 6: 今日累计交互电量 */}
        <div
          id="kpi-grid-energy"
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-600" />
              今日累计电网交互
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700">
              双向累计
            </span>
          </div>

          <div className="my-2 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <ArrowDownLeft className="w-3 h-3 text-purple-600" /> 累计购电量:
              </span>
              <span className="font-mono font-bold text-slate-900">
                {gridKpi.todayPurchaseKwh.toFixed(1)}{' '}
                <span className="text-[10px] text-slate-400 font-normal">kWh</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-emerald-600" /> 累计反送量:
              </span>
              <span className="font-mono font-bold text-slate-900">
                {gridKpi.todayFeedInKwh.toFixed(1)}{' '}
                <span className="text-[10px] text-slate-400 font-normal">kWh</span>
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>净送出: {(gridKpi.todayFeedInKwh - gridKpi.todayPurchaseKwh).toFixed(1)} kWh</span>
            <span className="text-slate-500">T日实时累计</span>
          </div>
        </div>
      </div>
    </div>
  );
};
