import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/AppContext';
import { DashboardSimState } from './DashboardScopeBar';
import {
  SunMedium,
  BatteryCharging,
  Zap,
  Activity,
  Building,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Maximize2,
} from 'lucide-react';

interface DashboardEnergyFlowProps {
  activeSimState: DashboardSimState;
}

export const DashboardEnergyFlow: React.FC<DashboardEnergyFlowProps> = ({ activeSimState }) => {
  const navigate = useNavigate();
  const { site, telemetry, scenario } = useAppStore();
  const [showP09Rules, setShowP09Rules] = useState(false);

  // 储能通信异常或流中断状态
  const isStorageInterrupted =
    scenario === 'SCENARIO_B' ||
    activeSimState === 'FLOW_INTERRUPTED' ||
    activeSimState === 'SETTLEMENT_BLOCKED';

  // 基础功率计算
  const pvPower = telemetry.pvActivePowerKw; // 248.6 kW
  const gridPower = telemetry.gridPowerKw; // 564.2 kW (正购负送)
  const storagePower = telemetry.storagePowerKw; // -180.0 kW (负充正放)
  const chargingLoad = telemetry.chargingLoadKw; // 142.5 kW

  // 园区基础动力与照明负荷 (基于基尔霍夫功率平衡：∑P_供 = ∑P_消)
  // P_grid + P_pv + P_storage = P_charging + P_load
  // => P_load = P_grid + P_pv + P_storage - P_charging
  const campusLoad = Math.max(0, gridPower + pvPower + storagePower - chargingLoad);

  const totalInput = gridPower + pvPower + (storagePower > 0 ? storagePower : 0);
  const totalOutput = chargingLoad + campusLoad + (storagePower < 0 ? Math.abs(storagePower) : 0);
  const isBalanced = Math.abs(totalInput - totalOutput) < 1.0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 lg:p-5 shadow-xs space-y-4">
      {/* 头部标题与控制栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
          <h2 className="text-sm font-bold text-slate-900">
            示范站 · 实时微电网能量流动拓扑 (10kV 交流公共母线)
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded font-semibold font-mono bg-blue-50 text-[#004287] border border-blue-200">
            遵循 P09 / IEEE 1547 统一功率方向约定
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowP09Rules(!showP09Rules)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>{showP09Rules ? '收起方向说明' : 'P09 符号约定'}</span>
            {showP09Rules ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={() => navigate('/monitor')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[#004287] font-semibold transition-colors"
          >
            <span>微电网全景监测</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* P09 符号与功率方向展开解释面板 */}
      {showP09Rules && (
        <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs text-slate-700 space-y-1.5 animate-fadeIn">
          <div className="font-bold text-blue-900 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>P09 / IEEE 1547 功率流动与正负符号说明（全站同构）：</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] pt-1">
            <div className="p-2 rounded bg-white border border-blue-100">
              <span className="font-bold text-amber-700">1. 光伏 (PV)：</span>
              <span className="text-slate-600">正值 (+) 表示光伏逆变器交流输出发电中 (流入母线)。</span>
            </div>
            <div className="p-2 rounded bg-white border border-blue-100">
              <span className="font-bold text-purple-700">2. 关口电网 (Grid)：</span>
              <span className="text-slate-600">正值 (+) 表示从电网购电 (下网受电)；负值 (-) 为余电上网反送。</span>
            </div>
            <div className="p-2 rounded bg-white border border-blue-100">
              <span className="font-bold text-blue-700">3. 储能 (Storage)：</span>
              <span className="text-slate-600">正值 (+) 为削峰放电；负值 (-) 为低谷充电吸纳母线电能。</span>
            </div>
            <div className="p-2 rounded bg-white border border-blue-100">
              <span className="font-bold text-emerald-700">4. 充电与园区负荷：</span>
              <span className="text-slate-600">正值 (+) 表示车辆充电桩与建筑设施消纳母线电能。</span>
            </div>
          </div>
        </div>
      )}

      {/* 5 节点能流拓扑可视化画板 */}
      <div className="relative bg-slate-900 rounded-xl p-5 lg:p-6 overflow-hidden text-white shadow-inner">
        {/* 背景轻微网格与装饰 */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d_1px,transparent_1px),linear-gradient(to_bottom,#1f293d_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />

        {/* 顶部中央提示 */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-300 mb-6">
          <div className="flex items-center gap-2 font-mono">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">
              交流母线额定: 10 kV / 50 Hz
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
              变压器负载率: {((gridPower / (parseFloat(site.transformerCapacity) || 2000)) * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>基尔霍夫动态平衡: ∑供入 {totalInput.toFixed(1)} kW = ∑消耗 {totalOutput.toFixed(1)} kW</span>
          </div>
        </div>

        {/* 上方供能侧 2 节点：光伏 (左)、电网 (右) */}
        <div className="grid grid-cols-2 gap-4 lg:gap-8 relative z-10 mb-4">
          {/* 节点 1: 光伏发电 */}
          <div
            onClick={() => navigate('/monitor/pv')}
            className="bg-slate-800/90 hover:bg-slate-800 border border-amber-500/50 hover:border-amber-400 p-3.5 rounded-xl cursor-pointer transition-all group flex flex-col justify-between shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <SunMedium className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300 group-hover:text-amber-200">屋顶分布式光伏</div>
                  <div className="text-[10px] text-slate-400 font-mono">装机 1200 kWp</div>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700">
                出流供入
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-[11px] text-slate-400">实时发电功率</span>
              <span className="text-xl font-mono font-bold text-amber-400">
                +{pvPower.toFixed(1)} <span className="text-xs text-slate-400">kW</span>
              </span>
            </div>
            <div className="mt-2 text-[10px] text-amber-300/80 flex items-center justify-between font-mono">
              <span>↓ 向母线馈送电能</span>
              <span className="text-slate-400 group-hover:text-cyan-300 transition-colors">查看细分逆变器 →</span>
            </div>
          </div>

          {/* 节点 2: 关口电网 */}
          <div
            onClick={() => navigate('/monitor/grid')}
            className="bg-slate-800/90 hover:bg-slate-800 border border-purple-500/50 hover:border-purple-400 p-3.5 rounded-xl cursor-pointer transition-all group flex flex-col justify-between shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-300 group-hover:text-purple-200">10kV 上级电网关口</div>
                  <div className="text-[10px] text-slate-400 font-mono">主变 2000 kVA</div>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-700">
                {gridPower >= 0 ? '下网购电' : '余电上网'}
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-[11px] text-slate-400">关口受电功率</span>
              <span className="text-xl font-mono font-bold text-purple-400">
                +{gridPower.toFixed(1)} <span className="text-xs text-slate-400">kW</span>
              </span>
            </div>
            <div className="mt-2 text-[10px] text-purple-300/80 flex items-center justify-between font-mono">
              <span>↓ 变电站向母线供入</span>
              <span className="text-slate-400 group-hover:text-cyan-300 transition-colors">需量监控与电能质量 →</span>
            </div>
          </div>
        </div>

        {/* 中央核心：10kV 交流公共母线 (动态发光流动条) */}
        <div className="relative z-10 my-6 py-2">
          {/* 母线主体发光条 */}
          <div className="w-full h-4 bg-gradient-to-r from-amber-500 via-cyan-400 to-emerald-400 rounded-full shadow-[0_0_20px_rgba(0,180,255,0.7)] relative flex items-center justify-center">
            {/* 流动脉冲动画点 */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="w-20 h-full bg-white/60 blur-xs rounded-full animate-[flow_2s_linear_infinite]" />
            </div>
            <span className="text-[11px] font-bold font-mono text-slate-900 tracking-wider uppercase px-3 py-0.5 rounded bg-cyan-100 shadow-sm border border-cyan-300 z-10">
              10kV 交流公共母线 (站内微网功率交换中枢)
            </span>
          </div>

          {/* 母线状态说明 */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1.5 px-2">
            <span>供电侧注入: {(pvPower + gridPower).toFixed(1)} kW</span>
            <span>当前母线频率: 50.02 Hz · 功率因数: 0.98</span>
            <span>负荷侧消纳: {totalOutput.toFixed(1)} kW</span>
          </div>
        </div>

        {/* 下方消纳与储能 3 节点：储能 (左)、充电桩群 (中)、园区基础负荷 (右) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 mt-4">
          {/* 节点 3: 储能系统 (PCS + 电池) */}
          <div
            onClick={() => navigate('/monitor/storage')}
            className={`bg-slate-800/90 hover:bg-slate-800 border p-3.5 rounded-xl cursor-pointer transition-all group flex flex-col justify-between shadow-lg ${
              isStorageInterrupted
                ? 'border-red-500/80 bg-red-950/20 hover:border-red-400'
                : 'border-blue-500/50 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                    isStorageInterrupted
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  }`}
                >
                  <BatteryCharging className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-blue-300 group-hover:text-blue-200">电化学储能 (PCS)</div>
                  <div className="text-[10px] text-slate-400 font-mono">500kW / 1000kWh</div>
                </div>
              </div>
              {isStorageInterrupted ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 animate-pulse">
                  通信中断重试
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700">
                  {storagePower < 0 ? '低谷吸能充电' : '削峰放电中'}
                </span>
              )}
            </div>

            <div className="mt-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-slate-400">充放电功率</span>
                <span
                  className={`text-xl font-mono font-bold ${
                    isStorageInterrupted ? 'text-red-400' : 'text-blue-400'
                  }`}
                >
                  {storagePower.toFixed(1)} <span className="text-xs text-slate-400">kW</span>
                </span>
              </div>
              {/* SOC 进度条 */}
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                  <span>当前 SOC 荷电状态</span>
                  <span className="text-cyan-300 font-bold">{telemetry.storageSocPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isStorageInterrupted ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                    }`}
                    style={{ width: `${telemetry.storageSocPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-blue-300/80 flex items-center justify-between font-mono">
              <span>{isStorageInterrupted ? '⚠️ 遥测断流 35m' : '↑ 从母线充电蓄能'}</span>
              <span className="text-slate-400 group-hover:text-cyan-300 transition-colors">储能监测 →</span>
            </div>
          </div>

          {/* 节点 4: 充电桩群 */}
          <div
            onClick={() => navigate('/monitor/charging')}
            className="bg-slate-800/90 hover:bg-slate-800 border border-emerald-500/50 hover:border-emerald-400 p-3.5 rounded-xl cursor-pointer transition-all group flex flex-col justify-between shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">园区充电桩群</div>
                  <div className="text-[10px] text-slate-400 font-mono">12台双枪快充</div>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                负荷消纳
              </span>
            </div>

            <div className="mt-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-slate-400">实时聚合负荷</span>
                <span className="text-xl font-mono font-bold text-emerald-400">
                  +{chargingLoad.toFixed(1)} <span className="text-xs text-slate-400">kW</span>
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>占用桩位: 4 枪充电中</span>
                <span className="text-emerald-300 font-semibold">服务费: 0.40元/kWh</span>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-emerald-300/80 flex items-center justify-between font-mono">
              <span>↑ 从母线消耗电能</span>
              <span className="text-slate-400 group-hover:text-cyan-300 transition-colors">充电监控 →</span>
            </div>
          </div>

          {/* 节点 5: 园区基础负荷 */}
          <div
            onClick={() => navigate('/monitor/grid')}
            className="bg-slate-800/90 hover:bg-slate-800 border border-cyan-500/50 hover:border-cyan-400 p-3.5 rounded-xl cursor-pointer transition-all group flex flex-col justify-between shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200">园区基础用电负荷</div>
                  <div className="text-[10px] text-slate-400 font-mono">办公/空调/动力</div>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                站内用电
              </span>
            </div>

            <div className="mt-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-slate-400">基础用电功率</span>
                <span className="text-xl font-mono font-bold text-cyan-300">
                  +{campusLoad.toFixed(1)} <span className="text-xs text-slate-400">kW</span>
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>绿电消纳率: 35.6%</span>
                <span className="text-cyan-300 font-semibold">自发自用优先</span>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-cyan-300/80 flex items-center justify-between font-mono">
              <span>↑ 从母线消耗电能</span>
              <span className="text-slate-400 group-hover:text-cyan-300 transition-colors">负荷明细 →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
