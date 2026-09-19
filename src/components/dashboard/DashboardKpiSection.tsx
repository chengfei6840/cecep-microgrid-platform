import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/AppContext';
import { QualityTag } from '../common/QualityTag';
import { DashboardTimeScope, DashboardSimState } from './DashboardScopeBar';
import {
  SunMedium,
  Zap,
  Activity,
  DollarSign,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';

interface DashboardKpiSectionProps {
  timeScope: DashboardTimeScope;
  activeSimState: DashboardSimState;
}

export const DashboardKpiSection: React.FC<DashboardKpiSectionProps> = ({
  timeScope,
  activeSimState,
}) => {
  const navigate = useNavigate();
  const { telemetry, revenueSnapshots, scenario, qualityIssues } = useAppStore();

  const todayRev = revenueSnapshots.find((r) => r.calcType === 'ESTIMATE');
  const yesterdayRev = revenueSnapshots.find((r) => r.calcType === 'SETTLEMENT');

  // 口径标签
  const scopeLabel =
    timeScope === 'DAY'
      ? '今日实测累计 (00:00 - 当前)'
      : timeScope === 'MONTH'
      ? '本月累计 (2026-09-01 至今)'
      : '本年累计 (2026 全年核算)';

  // 1. 光伏发电量 (瞬时功率保持当前实际实时值，不随口径切换！)
  const pvGenKwh =
    timeScope === 'DAY'
      ? telemetry.pvDailyYieldKwh
      : timeScope === 'MONTH'
      ? telemetry.pvDailyYieldKwh * 26 + 180
      : telemetry.pvDailyYieldKwh * 312 + 2400;

  // 光伏质量状态判定 (若有数据质量突变或模拟部分缺失，标记为可疑)
  const pvHasQualityIssue =
    activeSimState === 'PARTIAL_MISSING' ||
    qualityIssues.some(
      (qi) => qi.targetPoint?.includes('光伏') || qi.targetDevice?.includes('光伏') || qi.id.includes('PV')
    );
  const pvQualityLevel = pvHasQualityIssue ? 'SUSPICIOUS' : 'NORMAL';

  // 2. 充电量 (瞬时充电负荷保持当前实时值，不随口径切换！)
  const chargingKwh =
    timeScope === 'DAY'
      ? telemetry.chargingDailyKwh
      : timeScope === 'MONTH'
      ? telemetry.chargingDailyKwh * 26
      : telemetry.chargingDailyKwh * 312;

  // 3. 关口电网购电量 (瞬时下网功率保持当前实时值，不随口径切换！)
  const gridPurchaseKwh =
    timeScope === 'DAY'
      ? 4280.0
      : timeScope === 'MONTH'
      ? 112450.0
      : 1358900.0;

  // 4. 综合收益 (必须显示“估算”或“结算”；质量异常在首页传播，不得用正常绿卡掩盖)
  const isRevenueRisk =
    scenario === 'SCENARIO_B' ||
    activeSimState === 'SETTLEMENT_BLOCKED' ||
    revenueSnapshots.some((r) => r.qualityFlag === 'RISK_WARNING');

  const rawNetRevenue =
    timeScope === 'DAY'
      ? todayRev ? todayRev.netComprehensiveRevenue : 545.7
      : timeScope === 'MONTH'
      ? yesterdayRev ? yesterdayRev.netComprehensiveRevenue * 28.5 : 56544.0
      : yesterdayRev ? yesterdayRev.netComprehensiveRevenue * 342.0 : 678528.0;

  const confidenceScore = isRevenueRisk
    ? (yesterdayRev?.dataConfidencePercent ?? 71.4)
    : (todayRev?.dataConfidencePercent ?? 99.2);

  const revenueTypeLabel =
    timeScope === 'DAY'
      ? '实时滚动估算'
      : timeScope === 'MONTH'
      ? '月度累计 (含结算与滚动估算)'
      : '年度累计已结算归档';

  const revenueTypeCategory = timeScope === 'DAY' ? 'ESTIMATE' : 'SETTLEMENT';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>核心运营能源与收益指标 (KPI)</span>
          <span className="text-[11px] font-normal text-slate-500 font-mono">
            [瞬时功率保持当前实时实测，电量与收益随口径【{timeScope === 'DAY' ? '今日' : timeScope === 'MONTH' ? '本月' : '本年'}】聚合]
          </span>
        </h2>
        <span className="text-xs text-slate-400">点击卡片直达业务明细</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: 光伏发电量 */}
        <div
          onClick={() => navigate('/monitor/pv')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <SunMedium className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition-colors">
                    屋顶分布式光伏
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono">PV-SG320HX-PRO</div>
                </div>
              </div>
              <QualityTag level={pvQualityLevel} />
            </div>

            {/* 主累计指标 */}
            <div className="mt-2">
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>发电量（{timeScope === 'DAY' ? '今日实测' : timeScope === 'MONTH' ? '本月累计' : '本年累计'}）</span>
                <span className="text-[10px] font-mono text-slate-400">口径: {timeScope}</span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-0.5 tracking-tight">
                {timeScope === 'DAY' ? (
                  <>
                    {pvGenKwh.toFixed(1)} <span className="text-xs font-normal text-slate-500">kWh</span>
                  </>
                ) : (
                  <>
                    {(pvGenKwh / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-500">MWh</span>
                    <span className="text-[10px] font-mono text-slate-400 ml-1">({pvGenKwh.toFixed(0)} kWh)</span>
                  </>
                )}
              </div>
            </div>

            {/* 瞬时实测功率：严格保持当前值，不随累计口径切换 */}
            <div className="mt-3 p-2 rounded-lg bg-amber-50/70 border border-amber-100 flex items-center justify-between text-xs">
              <span className="text-amber-800 font-medium">瞬时有功出力:</span>
              <span className="font-mono font-bold text-amber-900">
                +{telemetry.pvActivePowerKw.toFixed(1)} kW
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              <span>刚刚 06:12:30</span>
            </span>
            <span className="text-blue-600 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              <span>光伏监测</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 2: 充电量 */}
        <div
          onClick={() => navigate('/monitor/charging')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition-colors">
                    园区充电桩群
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono">120kW 直流快充</div>
                </div>
              </div>
              <QualityTag level="NORMAL" />
            </div>

            {/* 主累计指标 */}
            <div className="mt-2">
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>充电消纳量（{timeScope === 'DAY' ? '今日实测' : timeScope === 'MONTH' ? '本月累计' : '本年累计'}）</span>
                <span className="text-[10px] font-mono text-slate-400">口径: {timeScope}</span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-0.5 tracking-tight">
                {timeScope === 'DAY' ? (
                  <>
                    {chargingKwh.toFixed(1)} <span className="text-xs font-normal text-slate-500">kWh</span>
                  </>
                ) : (
                  <>
                    {(chargingKwh / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-500">MWh</span>
                    <span className="text-[10px] font-mono text-slate-400 ml-1">({chargingKwh.toFixed(0)} kWh)</span>
                  </>
                )}
              </div>
            </div>

            {/* 瞬时实测负荷：严格保持当前值，不随累计口径切换 */}
            <div className="mt-3 p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs">
              <span className="text-emerald-800 font-medium">瞬时充电负荷:</span>
              <span className="font-mono font-bold text-emerald-900">
                +{telemetry.chargingLoadKw.toFixed(1)} kW
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              <span>1分钟前 06:11:58</span>
            </span>
            <span className="text-blue-600 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              <span>充电监测</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 3: 关口电网购电量 */}
        <div
          onClick={() => navigate('/monitor/grid')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition-colors">
                    关口电网购电量
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono">10kV 进线总表</div>
                </div>
              </div>
              <QualityTag level="NORMAL" />
            </div>

            {/* 主累计指标 */}
            <div className="mt-2">
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>下网购电量（{timeScope === 'DAY' ? '今日实测' : timeScope === 'MONTH' ? '本月累计' : '本年累计'}）</span>
                <span className="text-[10px] font-mono text-slate-400">口径: {timeScope}</span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-0.5 tracking-tight">
                {timeScope === 'DAY' ? (
                  <>
                    {gridPurchaseKwh.toFixed(1)} <span className="text-xs font-normal text-slate-500">kWh</span>
                  </>
                ) : (
                  <>
                    {(gridPurchaseKwh / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-500">MWh</span>
                    <span className="text-[10px] font-mono text-slate-400 ml-1">({gridPurchaseKwh.toFixed(0)} kWh)</span>
                  </>
                )}
              </div>
            </div>

            {/* 瞬时下网受电功率：严格保持当前值，不随累计口径切换 */}
            <div className="mt-3 p-2 rounded-lg bg-purple-50/70 border border-purple-100 flex items-center justify-between text-xs">
              <span className="text-purple-800 font-medium">瞬时下网受电:</span>
              <span className="font-mono font-bold text-purple-900">
                +{telemetry.gridPowerKw.toFixed(1)} kW
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              <span>3分钟前 06:10:00</span>
            </span>
            <span className="text-blue-600 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              <span>电网平衡</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 4: 综合收益 (必须显示估算或结算；质量异常在首页传播，不得用正常绿卡掩盖) */}
        <div
          onClick={() => navigate('/revenue')}
          className={`rounded-xl border p-4 shadow-xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between ${
            isRevenueRisk
              ? 'bg-red-50/40 border-red-300 hover:border-red-500'
              : 'bg-white border-slate-200 hover:border-blue-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                    isRevenueRisk
                      ? 'bg-red-100 text-red-700 border-red-300'
                      : 'bg-blue-50 text-[#004287] border-blue-200'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition-colors">
                    微电网综合净收益
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        revenueTypeCategory === 'ESTIMATE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {timeScope === 'DAY' ? '【估算】' : '【结算】'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {todayRev?.referencedTariffVersion || 'V1.0'}
                    </span>
                  </div>
                </div>
              </div>

              {isRevenueRisk ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-300 flex items-center gap-1 animate-pulse">
                  <AlertOctagon className="w-3 h-3 text-red-600" />
                  <span>风险预警</span>
                </span>
              ) : (
                <QualityTag level="NORMAL" />
              )}
            </div>

            {/* 收益主金额 */}
            <div className="mt-2">
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>{revenueTypeLabel}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  置信度: {confidenceScore.toFixed(1)}%
                </span>
              </div>
              <div
                className={`text-2xl font-black font-mono mt-0.5 tracking-tight ${
                  isRevenueRisk ? 'text-red-700' : 'text-emerald-600'
                }`}
              >
                ¥{rawNetRevenue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* 异常传播提示 或 正常细分构成 */}
            {isRevenueRisk ? (
              <div className="mt-3 p-2 rounded-lg bg-red-100/70 border border-red-200 text-xs text-red-800">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>收益不可直接结算 (置信度低于 95%)</span>
                </div>
                <p className="text-[10px] text-red-700 mt-0.5 leading-snug">
                  储能 EMS 遥测中断导致昨日结算挂起，包含推算值，需补采后重算。
                </p>
              </div>
            ) : (
              <div className="mt-3 p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
                <span>光伏+¥{todayRev?.pvRevenue.toFixed(0) || '1421'}</span>
                <span>储能+¥{todayRev?.storageArbitrage.toFixed(0) || '680'}</span>
                <span>充电+¥{todayRev?.chargingRevenue.toFixed(0) || '852'}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              <span>{isRevenueRisk ? '日终结算中断' : '每15分钟滚动估算'}</span>
            </span>
            <span
              className={`font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform ${
                isRevenueRisk ? 'text-red-600 font-bold' : 'text-blue-600'
              }`}
            >
              <span>{isRevenueRisk ? '去收益中心核查' : '收益核算'}</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
