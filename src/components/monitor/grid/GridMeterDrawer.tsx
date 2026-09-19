import React from 'react';
import { GridKpiData } from '../../../types/grid';
import {
  X,
  Activity,
  Zap,
  Gauge,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Radio,
  FileText,
  Lock,
  Layers,
  CheckCircle2,
  Sliders,
  ExternalLink,
} from 'lucide-react';

interface GridMeterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  gridKpi: GridKpiData;
}

export const GridMeterDrawer: React.FC<GridMeterDrawerProps> = ({
  isOpen,
  onClose,
  gridKpi,
}) => {
  if (!isOpen) return null;

  const isOffline = gridKpi.gridPowerKw === null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* 抽屉头部 */}
          <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">
                    10kV 进线关口双向电能表工况
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      isOffline
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isOffline ? '通信中断' : '0.2S级 正常在线'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  表号：WSD-645-ZZ01 · 威胜 DSSD331-MB
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 抽屉内容滚动区 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 只读警示条 */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>受供电局铅封与网级三级安全防护，仅供实时参数只读遥测</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">只读不可控</span>
            </div>

            {/* 1. 核心电参数三相实时测量 */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-purple-600" />
                10kV 高压进线三相实时电参数
              </h4>

              <div className="grid grid-cols-3 gap-3">
                {/* A相 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold mb-1">
                    A 相线电压 / 电流
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {gridKpi.threePhaseVoltage.va.toLocaleString()} V
                  </div>
                  <div className="font-mono text-xs text-slate-600 mt-0.5">
                    {gridKpi.threePhaseCurrent.ia} A
                  </div>
                </div>

                {/* B相 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold mb-1">
                    B 相线电压 / 电流
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {gridKpi.threePhaseVoltage.vb.toLocaleString()} V
                  </div>
                  <div className="font-mono text-xs text-slate-600 mt-0.5">
                    {gridKpi.threePhaseCurrent.ib} A
                  </div>
                </div>

                {/* C相 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold mb-1">
                    C 相线电压 / 电流
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {gridKpi.threePhaseVoltage.vc.toLocaleString()} V
                  </div>
                  <div className="font-mono text-xs text-slate-600 mt-0.5">
                    {gridKpi.threePhaseCurrent.ic} A
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500">网侧频率 (f):</span>
                  <span className="font-mono font-bold text-slate-900">
                    {gridKpi.gridFrequencyHz.toFixed(2)} Hz
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500">无功功率 (Q):</span>
                  <span className="font-mono font-bold text-slate-900">
                    {gridKpi.reactivePowerKvar.toFixed(1)} kvar
                  </span>
                </div>
              </div>
            </div>

            {/* 2. 需量核算与合同标准 */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-blue-600" />
                需量计量与合同电费核算基准
              </h4>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">合同申报最大需量:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {gridKpi.contractDemandKw} kW
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">当前实测最大需量 (15min):</span>
                  <span className="font-mono font-bold text-blue-600">
                    {gridKpi.currentDemandKw} kW
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">需量利用率:</span>
                  <span
                    className={`font-mono font-bold ${
                      gridKpi.isDemandNearLimit ? 'text-amber-600' : 'text-slate-900'
                    }`}
                  >
                    {gridKpi.demandUtilizationPercent}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">基本电费单价:</span>
                  <span className="font-mono text-slate-700">
                    38.00 元 / kW·月 (按最大需量计收)
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                  按照福建省电网大工业两部制电价规程：实际需量在申报值 105% 以内按实际值结算；超过 105% 部分加收 100% 基本电费。
                </div>
              </div>
            </div>

            {/* 3. 表计通信与采集规约 */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-indigo-600" />
                表计通信与硬件参数
              </h4>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">采集规约:</span>
                  <span className="font-mono text-slate-800">DL/T 645-2007 扩展规约</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">物理接口:</span>
                  <span className="font-mono text-slate-800">RS485-A/B 屏蔽双绞线直连</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">互感器变比 (PT/CT):</span>
                  <span className="font-mono text-slate-800">PT: 10kV / 100V · CT: 150A / 5A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">综合变比倍率:</span>
                  <span className="font-mono font-bold text-slate-900">3,000 倍</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">最近有效更新时标:</span>
                  <span className="font-mono text-slate-600">{gridKpi.lastUpdated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">数据质量评价:</span>
                  <span className="font-mono text-slate-800">
                    {gridKpi.meterQuality} ({gridKpi.meterQualityReason})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 抽屉底部 */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-mono">
              国网供电公司计量铅封验证合规
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
