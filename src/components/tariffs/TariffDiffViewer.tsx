import React from 'react';
import { TariffVersion } from '../../types/domain';
import { VersionBadge } from '../common/VersionBadge';
import { StatusBadge } from '../common/StatusBadge';
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Clock,
  Sun,
  Zap,
  Building2,
  CheckCircle2,
} from 'lucide-react';

interface TariffDiffViewerProps {
  baseVersion: TariffVersion;
  targetVersion: TariffVersion;
  onClose?: () => void;
}

export const TariffDiffViewer: React.FC<TariffDiffViewerProps> = ({
  baseVersion,
  targetVersion,
  onClose,
}) => {
  const getPriceDiff = (basePrice: number, targetPrice: number) => {
    const diff = targetPrice - basePrice;
    const diffPct = basePrice > 0 ? (diff / basePrice) * 100 : 0;
    return {
      diff,
      diffPct,
      isUp: diff > 0.0001,
      isDown: diff < -0.0001,
      isSame: Math.abs(diff) <= 0.0001,
    };
  };

  const slotLabels = ['尖峰', '高峰', '平段', '低谷', '深谷'] as const;

  const getSlotPrice = (version: TariffVersion, label: string): number => {
    const found = version.slots.find((s) => s.label === label);
    return found ? found.price : 0;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header comparison summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">版本参数比对与影响分析</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-[#004287] font-semibold border border-blue-200">
              差异核对
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            对比已生效基准版本与拟生效/审批中新版本的四类电价参数变动与两部制互斥项
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-slate-500">基准版本:</span>
            <VersionBadge version={baseVersion.versionNumber} status={baseVersion.status} />
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex items-center gap-2 bg-blue-50/60 px-3 py-1.5 rounded-lg border border-blue-200">
            <span className="text-blue-700 font-semibold">比对目标:</span>
            <VersionBadge version={targetVersion.versionNumber} status={targetVersion.status} />
            <StatusBadge status={targetVersion.status} size="sm" />
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">财务收益核算隔离原则：</span>
          <span>
            系统严格保证历史收益数据真实性与可回溯性。新版本生效后，
            <span className="underline font-semibold">仅对生效日之后产生的数据生效</span>
            ；涉及已结算历史日期的追溯修订只能通过【收益重算批次】明确立项，绝不静默覆盖历史快照！
          </span>
        </div>
      </div>

      {/* Module 1: TOU Purchase Comparison */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>1. 分时购电价格对比 (元/kWh)</span>
        </div>
        <div className="grid grid-cols-5 gap-3 text-xs font-mono">
          {slotLabels.map((lbl) => {
            const pBase = getSlotPrice(baseVersion, lbl);
            const pTarget = getSlotPrice(targetVersion, lbl);
            const diffInfo = getPriceDiff(pBase, pTarget);
            return (
              <div
                key={lbl}
                className={`p-3 rounded-xl border ${
                  diffInfo.isUp
                    ? 'border-red-200 bg-red-50/40'
                    : diffInfo.isDown
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                <div className="text-[11px] font-sans font-semibold text-slate-700 mb-1">{lbl}</div>
                <div className="flex items-baseline justify-between text-slate-500 text-[11px]">
                  <span>基准:</span>
                  <span>¥{pBase.toFixed(3)}</span>
                </div>
                <div className="flex items-baseline justify-between font-bold text-slate-900 text-sm mt-0.5">
                  <span>新版:</span>
                  <span>¥{pTarget.toFixed(3)}</span>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-sans">变动:</span>
                  <div className="flex items-center gap-0.5 font-bold">
                    {diffInfo.isUp && (
                      <span className="text-red-600 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-0.5" />+{diffInfo.diff.toFixed(3)} (
                        {diffInfo.diffPct.toFixed(1)}%)
                      </span>
                    )}
                    {diffInfo.isDown && (
                      <span className="text-emerald-600 flex items-center">
                        <TrendingDown className="w-3 h-3 mr-0.5" />
                        {diffInfo.diff.toFixed(3)} ({diffInfo.diffPct.toFixed(1)}%)
                      </span>
                    )}
                    {diffInfo.isSame && (
                      <span className="text-slate-400 flex items-center">
                        <Minus className="w-3 h-3 mr-0.5" />持平
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Module 2: PV Feed-In Mode Comparison */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Sun className="w-4 h-4 text-amber-500" />
          <span>2. 光伏上网与就地消纳结算机制对比</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">{baseVersion.versionNumber} 基准模式</span>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold font-mono text-[10px]">
                {baseVersion.pvConfig?.mode === 'FIXED'
                  ? '固定标杆电价'
                  : baseVersion.pvConfig?.mode === 'TIERED'
                  ? '阶梯消纳电价'
                  : '市场撮合浮动'}
              </span>
            </div>
            <div className="text-slate-600 leading-relaxed font-mono">
              {baseVersion.pvConfig?.description || '按发改委标准基准价执行'}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-blue-950">{targetVersion.versionNumber} 拟任模式</span>
              <span className="px-2 py-0.5 rounded bg-blue-200 text-blue-800 font-semibold font-mono text-[10px]">
                {targetVersion.pvConfig?.mode === 'FIXED'
                  ? '固定标杆电价'
                  : targetVersion.pvConfig?.mode === 'TIERED'
                  ? '阶梯消纳电价'
                  : '市场撮合浮动'}
              </span>
            </div>
            <div className="text-slate-700 leading-relaxed font-mono">
              {targetVersion.pvConfig?.description || '新申报光伏消纳细则'}
            </div>
          </div>
        </div>
      </div>

      {/* Module 3: Charging Service Fee */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span>3. 充电站服务费对比</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
            <span className="text-slate-600 font-sans">
              {baseVersion.versionNumber} 充电服务费:
            </span>
            <span className="font-bold text-slate-800 text-sm">
              ¥{(baseVersion.chargingConfig?.serviceFee ?? 0.4).toFixed(2)} 元/kWh
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex justify-between items-center">
            <span className="text-blue-900 font-sans font-semibold">
              {targetVersion.versionNumber} 充电服务费:
            </span>
            <span className="font-bold text-blue-900 text-sm">
              ¥{(targetVersion.chargingConfig?.serviceFee ?? 0.42).toFixed(2)} 元/kWh
            </span>
          </div>
        </div>
      </div>

      {/* Module 4: Basic Fee (Capacity vs Demand) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Building2 className="w-4 h-4 text-purple-600" />
          <span>4. 基本电费两部制互斥项比对 (容量计费 vs 需量计费)</span>
        </div>
        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 text-xs space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-bold text-slate-700 block mb-1">
                {baseVersion.versionNumber} 基本电费模式:
              </span>
              <div className="font-mono text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                {baseVersion.basicFeeConfig?.description || '容量电费'}
              </div>
            </div>
            <div>
              <span className="font-bold text-purple-900 block mb-1">
                {targetVersion.versionNumber} 基本电费模式:
              </span>
              <div className="font-mono text-purple-950 bg-white p-2.5 rounded-lg border border-purple-300 font-semibold">
                {targetVersion.basicFeeConfig?.description || '需量电费'}
              </div>
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-purple-100 flex items-center justify-between text-[11px]">
            <span className="text-purple-800 font-semibold">两部制互斥核算影响提示：</span>
            <span className="text-slate-600">
              若由容量计费优化为需量计费，配合储能午间/晚间负荷削峰，预计月度可降低基本电费约 ¥16,000。
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
