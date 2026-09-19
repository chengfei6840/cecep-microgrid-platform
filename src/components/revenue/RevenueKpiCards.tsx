import React from 'react';
import { RevenueKpiSummary } from '../../types/revenue';
import {
  SunMedium,
  Zap,
  BatteryCharging,
  DollarSign,
  TrendingUp,
  Activity,
  Receipt,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';

interface RevenueKpiCardsProps {
  kpis: RevenueKpiSummary;
  caliber: 'ESTIMATE' | 'SETTLEMENT';
  onDrilldown: (category: string) => void;
  onJumpToTariff: () => void;
}

export const RevenueKpiCards: React.FC<RevenueKpiCardsProps> = ({
  kpis,
  caliber,
  onDrilldown,
  onJumpToTariff,
}) => {
  const isConfidenceLow = kpis.dataConfidencePercent < 85;

  return (
    <div className="space-y-3">
      {/* 公式合规说明条 */}
      <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-800">
            公式配置提示：
          </span>
          <span>
            核算公式已配置，实际财务结算以双方月末最终盖章对账单为准。
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-slate-500">
            引用基准电价:
            <button
              onClick={onJumpToTariff}
              className="ml-1 font-mono font-bold text-blue-700 hover:underline inline-flex items-center gap-0.5"
            >
              {kpis.referencedTariffVersion}
              <ArrowRight className="w-3 h-3" />
            </button>
          </span>
          <span className="text-[11px] text-slate-500">
            数据置信度:
            <span
              className={`ml-1 font-mono font-bold ${
                isConfidenceLow ? 'text-amber-600' : 'text-emerald-700'
              }`}
            >
              {kpis.dataConfidencePercent.toFixed(1)}%
            </span>
          </span>
        </div>
      </div>

      {/* 7 大 KPI 网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. 光伏自发自用收益 */}
        <div
          onClick={() => onDrilldown('PV_SELF')}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">1. 光伏自发自用收益</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
              电费替代
            </span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-600 flex items-baseline gap-1">
            <span>+¥{kpis.pvSelfRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="truncate">自用电量 × 分时购电价</span>
            <span className="text-amber-600 group-hover:translate-x-0.5 transition-transform text-[11px] font-semibold">
              明细 →
            </span>
          </div>
        </div>

        {/* 2. 光伏余电上网收益 */}
        <div
          onClick={() => onDrilldown('PV_GRID')}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">2. 光伏余电上网收益</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
              标杆结算
            </span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-600 flex items-baseline gap-1">
            <span>+¥{kpis.pvFeedInRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="truncate">上网电量 × 上网价 (0.393元)</span>
            <span className="text-amber-600 group-hover:translate-x-0.5 transition-transform text-[11px] font-semibold">
              明细 →
            </span>
          </div>
        </div>

        {/* 3. 储能峰谷套利 */}
        <div
          onClick={() => onDrilldown('STORAGE_ARBITRAGE')}
          className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group ${
            isConfidenceLow
              ? 'border-amber-300 bg-amber-50/20'
              : 'border-slate-200/90 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">3. 储能峰谷套利收益</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                isConfidenceLow
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              {isConfidenceLow ? '数据可疑' : '两充两放'}
            </span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-600 flex items-baseline gap-1">
            <span>+¥{kpis.storageArbitrage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="truncate">放电收益 - 充电成本</span>
            <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform text-[11px] font-semibold">
              明细 →
            </span>
          </div>
        </div>

        {/* 4. 充电桩运营收入 */}
        <div
          onClick={() => onDrilldown('CHARGING_REVENUE')}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">4. 充电桩综合收入</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
              电费+服务费
            </span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-600 flex items-baseline gap-1">
            <span>+¥{kpis.chargingTotalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="truncate">电量 × 顺加价 + 服务费</span>
            <span className="text-emerald-600 group-hover:translate-x-0.5 transition-transform text-[11px] font-semibold">
              明细 →
            </span>
          </div>
        </div>

        {/* 5. 电网购电成本支出 */}
        <div
          onClick={() => onDrilldown('GRID_PURCHASE')}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-rose-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">5. 电网购电成本支出</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 text-[10px] font-semibold border border-rose-200">
              运营成本
            </span>
          </div>
          <div className="text-xl font-black font-mono text-rose-600 flex items-baseline gap-1">
            <span>-¥{kpis.gridPurchaseCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="truncate">10kV 进线净购电费用</span>
            <span className="text-rose-600 group-hover:translate-x-0.5 transition-transform text-[11px] font-semibold">
              明细 →
            </span>
          </div>
        </div>

        {/* 6. 基本电费分摊 */}
        <div
          onClick={() => onDrilldown('CAPACITY_BASE')}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-purple-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">6. 变压器/需量基本电费</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 text-[10px] font-semibold border border-purple-200">
              固定摊销
            </span>
          </div>
          <div className="text-xl font-black font-mono text-rose-600 flex items-baseline gap-1">
            <span>-¥{kpis.capacityBaseFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="truncate">需量电费 38元/kW 日摊</span>
            <span className="text-purple-600 group-hover:translate-x-0.5 transition-transform text-[11px] font-semibold">
              明细 →
            </span>
          </div>
        </div>

        {/* 7. 综合运营净收益 (两列跨度高亮大卡) */}
        <div
          onClick={() => onDrilldown('ALL')}
          className="sm:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <span className="font-bold flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              7. 微电网综合运营净收益 (综合收益)
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
              {caliber === 'SETTLEMENT' ? 'T+1 终审净额' : '实时滚动估算'}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1">
            ¥{kpis.netComprehensiveRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between pt-2 border-t border-slate-700/60">
            <span className="text-[11px] text-slate-300">
              = 光伏({(kpis.pvTotalRevenue).toFixed(0)}) + 储能({kpis.storageArbitrage.toFixed(0)}) + 充电({kpis.chargingTotalRevenue.toFixed(0)}) - 购电({kpis.gridPurchaseCost.toFixed(0)}) - 基本费({kpis.capacityBaseFee.toFixed(0)})
            </span>
            <span className="text-emerald-400 text-xs font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              <span>穿透核算</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
