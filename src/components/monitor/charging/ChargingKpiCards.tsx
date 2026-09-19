import React from 'react';
import { ChargingKpis } from '../../../types/charging';
import {
  Zap,
  BatteryCharging,
  CheckCircle2,
  AlertTriangle,
  FileText,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChargingKpiCardsProps {
  kpis: ChargingKpis;
  onOpenKpiDetail?: (kpiName: string) => void;
}

export const ChargingKpiCards: React.FC<ChargingKpiCardsProps> = ({ kpis, onOpenKpiDetail }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. 实时充电功率 */}
      <div
        id="kpi-charging-power"
        className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden transition-all hover:border-emerald-300"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>实时充电功率</span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            单向负荷吸收
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold font-mono text-slate-900">
            {kpis.activePowerKw.toLocaleString('zh-CN', { minimumFractionDigits: 1 })}
          </span>
          <span className="text-xs font-semibold text-slate-500">kW</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2 mt-1">
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            额定满载 1,440 kW
          </span>
          <span className="text-slate-600 font-mono font-medium">
            负载率 {((kpis.activePowerKw / 1440) * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 2. 今日累计充电量 */}
      <div
        id="kpi-today-kwh"
        className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden transition-all hover:border-blue-300"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span className="font-medium">今日累计充电量</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            00:00 至今
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold font-mono text-slate-900">
            {kpis.todayChargingKwh.toLocaleString('zh-CN', { minimumFractionDigits: 1 })}
          </span>
          <span className="text-xs font-semibold text-slate-500">kWh</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2 mt-1">
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            同比昨日 +14.2%
          </span>
          <span className="text-slate-500 text-[10px]">高精度电表复核</span>
        </div>
      </div>

      {/* 3. 在线率与在线/总桩数 */}
      <div
        id="kpi-online-rate"
        className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden transition-all hover:border-slate-300"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span className="font-medium">在线 / 总桩数</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
            在线率 {kpis.onlineRate}%
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold font-mono text-slate-900">
            {kpis.onlinePiles} <span className="text-slate-400 text-lg font-normal">/</span> {kpis.totalPiles}
          </span>
          <span className="text-xs font-semibold text-slate-500">台</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2 mt-1 font-mono">
          <span className="text-slate-600">空闲 {kpis.idlePiles} 台</span>
          <span className="text-red-600">故障 {kpis.faultPiles} 台</span>
          <span className="text-slate-400">离线 {kpis.offlinePiles} 台</span>
        </div>
      </div>

      {/* 4. 充电中桩数与枪口占用 */}
      <div
        id="kpi-charging-piles"
        className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden transition-all hover:border-emerald-300"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span className="font-medium">充电中桩数</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
            占用率 {((kpis.chargingPiles / kpis.totalPiles) * 100).toFixed(1)}%
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold font-mono text-emerald-700">{kpis.chargingPiles}</span>
          <span className="text-xs font-semibold text-slate-500">台正在充电</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2 mt-1">
          <span className="flex items-center gap-1 text-slate-700">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
            枪口占用: <span className="font-mono font-bold">{kpis.occupiedGuns}</span> / {kpis.totalGuns} 枪
          </span>
          <span className="text-slate-400 text-[10px]">24枪微网集群</span>
        </div>
      </div>

      {/* 5. 今日模拟收入 (区分结算收益与预估收益，引用 currentTariffVersion) */}
      <div
        id="kpi-today-revenue"
        className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden transition-all hover:border-amber-300 group"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <div className="flex items-center gap-1 font-medium">
            <span>今日模拟收益</span>
            <span
              title="待完整同步的订单不计入结算收益，仅供估算"
              className="cursor-help text-slate-400 hover:text-slate-600"
            >
              <HelpCircle className="w-3 h-3" />
            </span>
          </div>
          <Link
            to="/tariffs"
            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 flex items-center gap-1"
          >
            <span>{kpis.referencedTariffVersion} 电价</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>

        <div className="mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-mono font-semibold text-slate-400">结算: ¥</span>
            <span className="text-2xl font-bold font-mono text-slate-900">
              {kpis.todaySettledRevenue.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 font-mono">
            <span>预估总额:</span>
            <span className="font-bold text-amber-700">
              ¥{kpis.todayEstimatedRevenue.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2 mt-1">
          <span className="text-amber-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            待同步预估 {kpis.pendingSyncCount} 笔 (¥{kpis.pendingSyncAmount})
          </span>
          <span className="text-slate-400 text-[10px]">T+1前不入结算</span>
        </div>
      </div>
    </div>
  );
};
