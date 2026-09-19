import React from 'react';
import { UnifiedMonitorPoint } from '../../types/monitor';
import { MonitorQualityBadge } from './MonitorQualityBadge';
import {
  BatteryCharging,
  Zap,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Layers,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

interface StorageKpiCardsProps {
  kpiPoints: UnifiedMonitorPoint[];
  onOpenKpiDrawer?: (point: UnifiedMonitorPoint) => void;
  isScenarioBExpired?: boolean;
}

export const StorageKpiCards: React.FC<StorageKpiCardsProps> = ({
  kpiPoints,
  onOpenKpiDrawer,
  isScenarioBExpired = false,
}) => {
  // 根据 ID 获取指标
  const socPoint = kpiPoints.find((p) => p.id === 'POINT-BAT-SOC');
  const sohPoint = kpiPoints.find((p) => p.id === 'POINT-BAT-SOH');
  const powerPoint = kpiPoints.find((p) => p.id === 'POINT-BAT-POWER');
  const chargeDayPoint = kpiPoints.find((p) => p.id === 'POINT-STORAGE-CHG-DAY');
  const dischargeDayPoint = kpiPoints.find((p) => p.id === 'POINT-STORAGE-DIS-DAY');
  const capacityPoint = kpiPoints.find((p) => p.id === 'POINT-STORAGE-CAPACITY');

  const powerValue = powerPoint?.value ?? 0;
  const isCharging = powerValue < 0;
  const isDischarging = powerValue > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">储能电站 6 大核心运行指标看板</span>
          <span className="text-[11px] text-slate-500">
            （基于集中式统一测点标准 · 点击单项卡片查看汇总口径）
          </span>
        </div>
        {isScenarioBExpired && (
          <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            EMS 数据已停滞 · 冻结于 05:37:12
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* 1. SOC 荷电状态 (能量状态) */}
        <div
          onClick={() => socPoint && onOpenKpiDrawer?.(socPoint)}
          className={`bg-white rounded-xl border p-3.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
            isScenarioBExpired
              ? 'border-orange-300 bg-orange-50/20 hover:border-orange-400'
              : 'border-slate-200/90 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <BatteryCharging className="w-3.5 h-3.5" />
              </div>
              <span>系统荷电状态 (SOC)</span>
            </div>
            {socPoint && (
              <MonitorQualityBadge
                quality={socPoint.quality}
                source={socPoint.qualitySource}
                reason={socPoint.qualityReason}
                lastUpdated={socPoint.lastUpdated}
                size="sm"
              />
            )}
          </div>

          <div className="my-1">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-black font-mono tracking-tight ${
                  isScenarioBExpired ? 'text-orange-950' : 'text-slate-900'
                }`}
              >
                {socPoint?.formattedValue ?? '--'}
              </span>
              <span className="text-xs font-medium text-slate-500">%</span>
            </div>

            {/* 能量状态标签与进度条 */}
            <div className="mt-2 space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isScenarioBExpired
                      ? 'bg-orange-400'
                      : Number(socPoint?.value ?? 0) > 80
                      ? 'bg-emerald-500'
                      : Number(socPoint?.value ?? 0) < 20
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, Number(socPoint?.value ?? 0)))}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>放电下限 10%</span>
                <span className="font-bold text-slate-700">能量状态 (可放 642kWh)</span>
                <span>充电上限 95%</span>
              </div>
            </div>
          </div>

          {isScenarioBExpired ? (
            <div className="mt-2 pt-2 border-t border-orange-200/70 text-[10px] text-orange-800 flex items-center justify-between">
              <span className="font-bold">数据过期 / 不可确认</span>
              <span className="font-mono text-slate-500">停滞于 05:37</span>
            </div>
          ) : (
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
              <span>可用容量充足</span>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}
        </div>

        {/* 2. SOH 电池健康度 */}
        <div
          onClick={() => sohPoint && onOpenKpiDrawer?.(sohPoint)}
          className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <span>系统健康状态 (SOH)</span>
            </div>
            {sohPoint && (
              <MonitorQualityBadge
                quality={sohPoint.quality}
                source={sohPoint.qualitySource}
                reason={sohPoint.qualityReason}
                lastUpdated={sohPoint.lastUpdated}
                size="sm"
              />
            )}
          </div>

          <div className="my-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900">
                {sohPoint?.formattedValue ?? '--'}
              </span>
              <span className="text-xs font-medium text-slate-500">%</span>
            </div>

            {/* 健康状态标签 */}
            <div className="mt-2 space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(100, Math.max(0, Number(sohPoint?.value ?? 98)))}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>等效循环: 412次</span>
                <span className="text-emerald-700 font-semibold">衰减率 1.4% (优秀)</span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>电芯物理健康度</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 3. PCS 充放电实时功率 (正放负充) */}
        <div
          onClick={() => powerPoint && onOpenKpiDrawer?.(powerPoint)}
          className={`bg-white rounded-xl border p-3.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
            isScenarioBExpired
              ? 'border-orange-300 bg-orange-50/20 hover:border-orange-400'
              : isCharging
              ? 'border-blue-200/90 hover:border-blue-400'
              : isDischarging
              ? 'border-emerald-200/90 hover:border-emerald-400'
              : 'border-slate-200/90 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center ${
                  isCharging
                    ? 'bg-blue-50 text-blue-600'
                    : isDischarging
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span>PCS 实时出力功率</span>
            </div>
            {powerPoint && (
              <MonitorQualityBadge
                quality={powerPoint.quality}
                source={powerPoint.qualitySource}
                reason={powerPoint.qualityReason}
                lastUpdated={powerPoint.lastUpdated}
                size="sm"
              />
            )}
          </div>

          <div className="my-1">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-black font-mono tracking-tight ${
                  isScenarioBExpired
                    ? 'text-orange-950'
                    : isCharging
                    ? 'text-blue-700'
                    : isDischarging
                    ? 'text-emerald-700'
                    : 'text-slate-900'
                }`}
              >
                {powerPoint?.formattedValue ?? '--'}
              </span>
              <span className="text-xs font-medium text-slate-500">kW</span>
            </div>

            {/* 功率符号约定指引 */}
            <div className="mt-2 flex items-center justify-between text-[10px] font-medium">
              <span
                className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  isCharging
                    ? 'bg-blue-100 text-blue-800'
                    : isDischarging
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isCharging && <ArrowDownRight className="w-3 h-3 text-blue-600" />}
                {isDischarging && <ArrowUpRight className="w-3 h-3 text-emerald-600" />}
                {isCharging ? '负值 (-) 充电中' : isDischarging ? '正值 (+) 放电中' : '零值待机'}
              </span>
              <span className="text-slate-500 font-mono">额定 500kW</span>
            </div>
          </div>

          {isScenarioBExpired ? (
            <div className="mt-2 pt-2 border-t border-orange-200/70 text-[10px] text-orange-800 flex items-center justify-between">
              <span className="font-bold">数据过期 / 不可确认</span>
              <span className="font-mono text-slate-500">停滞于 05:37</span>
            </div>
          ) : (
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
              <span>四象限双向出力</span>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}
        </div>

        {/* 4. 今日累计充电量 */}
        <div
          onClick={() => chargeDayPoint && onOpenKpiDrawer?.(chargeDayPoint)}
          className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <ArrowDownRight className="w-3.5 h-3.5" />
              </div>
              <span>今日累计充电量</span>
            </div>
            {chargeDayPoint && (
              <MonitorQualityBadge
                quality={chargeDayPoint.quality}
                source={chargeDayPoint.qualitySource}
                reason={chargeDayPoint.qualityReason}
                lastUpdated={chargeDayPoint.lastUpdated}
                size="sm"
              />
            )}
          </div>

          <div className="my-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900">
                {chargeDayPoint?.formattedValue ?? '--'}
              </span>
              <span className="text-xs font-medium text-slate-500">kWh</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
              <span>低谷谷段蓄能</span>
              <span className="font-mono text-slate-700">累计约 0.42 MWh</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>电表正向有功脉冲</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 5. 今日累计放电量 */}
        <div
          onClick={() => dischargeDayPoint && onOpenKpiDrawer?.(dischargeDayPoint)}
          className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
              <span>今日累计放电量</span>
            </div>
            {dischargeDayPoint && (
              <MonitorQualityBadge
                quality={dischargeDayPoint.quality}
                source={dischargeDayPoint.qualitySource}
                reason={dischargeDayPoint.qualityReason}
                lastUpdated={dischargeDayPoint.lastUpdated}
                size="sm"
              />
            )}
          </div>

          <div className="my-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900">
                {dischargeDayPoint?.formattedValue ?? '--'}
              </span>
              <span className="text-xs font-medium text-slate-500">kWh</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
              <span>尖峰时段顶峰出力</span>
              <span className="font-mono text-slate-700">累计约 0.51 MWh</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>电表反向有功脉冲</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 6. 核准容量与配置 */}
        <div
          onClick={() => capacityPoint && onOpenKpiDrawer?.(capacityPoint)}
          className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span>核准装机规模</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 font-semibold">
              0.5C 液冷
            </span>
          </div>

          <div className="my-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black font-mono tracking-tight text-slate-900">
                500 / 1000
              </span>
              <span className="text-xs font-medium text-slate-500">kW / kWh</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
              <span>持续放电时长</span>
              <span className="font-semibold text-slate-700">2.0 小时 (额定)</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>宁德时代 LFP 预制舱</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
