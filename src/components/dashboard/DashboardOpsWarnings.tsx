import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/AppContext';
import { DashboardSimState } from './DashboardScopeBar';
import {
  BatteryCharging,
  Gauge,
  Radio,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Info,
  Clock,
  ShieldCheck,
  Server,
} from 'lucide-react';

interface DashboardOpsWarningsProps {
  activeSimState: DashboardSimState;
}

export const DashboardOpsWarnings: React.FC<DashboardOpsWarningsProps> = ({ activeSimState }) => {
  const navigate = useNavigate();
  const { site, devices, adapters, telemetry, scenario, alarms } = useAppStore();

  // 1. 储能 SOC 荷电状态
  const isStorageAlarm =
    scenario === 'SCENARIO_B' ||
    activeSimState === 'FLOW_INTERRUPTED' ||
    activeSimState === 'SETTLEMENT_BLOCKED';

  const storageSoc = telemetry.storageSocPercent;

  // 2. 需量利用率 (基于 1650 kVA / 2000 kVA = 82.5%)
  const demandLoadKva = 1650;
  const transformerCapacityKva = parseFloat(site.transformerCapacity) || 2000;
  const demandUtilizationPercent = (demandLoadKva / transformerCapacityKva) * 100; // 82.5%
  const isDemandOverThreshold = demandUtilizationPercent > 80.0;

  // 3. 智能终端联控率 (提示：联控率只表示通信在线比例，不表示远控能力)
  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === 'NORMAL').length;
  const terminalConnectivityRate = totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 100;

  // 4. 接口同步状态 (5大适配器)
  const totalAdapters = adapters.length;
  const onlineAdapters = adapters.filter((a) => a.status === 'ONLINE').length;
  const retryingAdapters = adapters.filter((a) => a.status === 'RETRYING' || a.status === 'FAILED');
  const hasInterfaceAnomaly = retryingAdapters.length > 0 || scenario === 'SCENARIO_B';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-slate-900">重点运维与风控预警</h2>
        </div>
        <span className="text-[11px] text-slate-400">持续监听变压器容量、通信网关及充放电状态</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 预警 1: 储能 SOC */}
        <div
          onClick={() => navigate('/monitor/storage')}
          className={`rounded-xl border p-4 shadow-xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between ${
            isStorageAlarm
              ? 'bg-red-50/40 border-red-300 hover:border-red-400'
              : 'bg-white border-slate-200 hover:border-blue-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                    isStorageAlarm
                      ? 'bg-red-100 text-red-600 border-red-200'
                      : 'bg-blue-50 text-blue-600 border-blue-200'
                  }`}
                >
                  <BatteryCharging className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition-colors">
                    储能当前荷电状态
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono">BATT_SOC_PERCENT</div>
                </div>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  isStorageAlarm
                    ? 'bg-red-100 text-red-700 border border-red-200 font-bold'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {isStorageAlarm ? '通信中断' : '受控蓄能中'}
              </span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {storageSoc.toFixed(1)}%
                </span>
                <span className="text-[11px] text-slate-500 font-mono">容量: 1000 kWh</span>
              </div>

              {/* 进度条 */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2 border border-slate-200/60">
                <div
                  className={`h-full rounded-full transition-all ${
                    isStorageAlarm ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                  }`}
                  style={{ width: `${storageSoc}%` }}
                />
              </div>
            </div>

            <div className="mt-3 text-[11px] leading-snug">
              {isStorageAlarm ? (
                <p className="text-red-700 font-medium">
                  ⚠️ 现场网关断线 35 分钟，当前为最后缓存值，放电保护已锁定。
                </p>
              ) : (
                <p className="text-slate-500">
                  早谷时段 0.31元/kWh 经济充电中，目标充至 90% 用于早峰套利。
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono">{isStorageAlarm ? '数据停滞' : '正常轮询'}</span>
            <span className="text-blue-600 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              <span>储能电站</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 预警 2: 需量利用率 (超限预警 82.5% > 80.0%) */}
        <div
          onClick={() => navigate('/alarms')}
          className={`rounded-xl border p-4 shadow-xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between ${
            isDemandOverThreshold
              ? 'bg-amber-50/40 border-amber-300 hover:border-amber-400'
              : 'bg-white border-slate-200 hover:border-blue-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                    isDemandOverThreshold
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition-colors">
                    需量利用率
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono">15min 滚动需量</div>
                </div>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  isDemandOverThreshold
                    ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isDemandOverThreshold ? '越限预警' : '负荷安全'}
              </span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline justify-between">
                <span
                  className={`text-2xl font-black font-mono ${
                    isDemandOverThreshold ? 'text-amber-700' : 'text-slate-900'
                  }`}
                >
                  {demandUtilizationPercent.toFixed(1)}%
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {demandLoadKva} / {transformerCapacityKva} kVA
                </span>
              </div>

              {/* 刻度进度条 */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2 relative border border-slate-200/60">
                <div
                  className={`h-full rounded-full transition-all ${
                    isDemandOverThreshold ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${demandUtilizationPercent}%` }}
                />
              </div>
            </div>

            <div className="mt-3 text-[11px] leading-snug">
              {isDemandOverThreshold ? (
                <p className="text-amber-800 font-medium">
                  当前已超 80.0% 安全线 (+2.5%)。快充桩群起充，需警惕容量电费越限惩罚。
                </p>
              ) : (
                <p className="text-slate-500">
                  主变负载率在 80% 安全窗口内，无合同需量违章越限风险。
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono">阈值 ≤ 80.0%</span>
            <span className="text-amber-700 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              <span>处置告警</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 预警 3: 智能终端联控率 (严格遵守：联控率只表示通信在线比例，不表示远控能力) */}
        <div
          onClick={() => navigate('/data/integrations')}
          className={`rounded-xl border p-4 shadow-xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between ${
            terminalConnectivityRate < 100
              ? 'bg-amber-50/40 border-amber-300 hover:border-amber-400'
              : 'bg-white border-slate-200 hover:border-blue-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                    terminalConnectivityRate < 100
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}
                >
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition-colors">
                    智能终端联控率
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono">通信在线比例</div>
                </div>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  terminalConnectivityRate === 100
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200 font-bold'
                }`}
              >
                {terminalConnectivityRate === 100 ? '全量在线' : '局部掉线'}
              </span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline justify-between">
                <span
                  className={`text-2xl font-black font-mono ${
                    terminalConnectivityRate < 100 ? 'text-amber-700' : 'text-slate-900'
                  }`}
                >
                  {terminalConnectivityRate.toFixed(1)}%
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {onlineDevices} / {totalDevices} 终端在线
                </span>
              </div>

              {/* 进度条 */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2 border border-slate-200/60">
                <div
                  className={`h-full rounded-full transition-all ${
                    terminalConnectivityRate === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${terminalConnectivityRate}%` }}
                />
              </div>
            </div>

            {/* 关键要求提示说明：联控率只表示通信在线比例，不表示远控能力 */}
            <div className="mt-2.5 p-1.5 rounded bg-slate-100/80 border border-slate-200/60 text-[10px] text-slate-600 leading-snug">
              <span className="font-bold text-slate-700">口径声明：</span>
              <span>联控率仅统计通信在线与遥测心跳比例，不表示任何远程控制与自动下发能力。</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono">心跳周期: 15s</span>
            <span className="text-blue-600 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              <span>设备拓扑</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 预警 4: 接口同步状态 */}
        <div
          onClick={() => navigate('/data/integrations')}
          className={`rounded-xl border p-4 shadow-xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between ${
            hasInterfaceAnomaly
              ? 'bg-red-50/40 border-red-300 hover:border-red-400'
              : 'bg-white border-slate-200 hover:border-blue-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                    hasInterfaceAnomaly
                      ? 'bg-red-100 text-red-600 border-red-200'
                      : 'bg-blue-50 text-blue-600 border-blue-200'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${hasInterfaceAnomaly ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition-colors">
                    接口同步状态
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono">5 大集成适配器</div>
                </div>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  hasInterfaceAnomaly
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium'
                }`}
              >
                {hasInterfaceAnomaly ? '重试重连中' : '全通道畅通'}
              </span>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline justify-between">
                <span
                  className={`text-2xl font-black font-mono ${
                    hasInterfaceAnomaly ? 'text-red-700' : 'text-slate-900'
                  }`}
                >
                  {onlineAdapters} / {totalAdapters}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {hasInterfaceAnomaly ? '1 个通道异常' : '全部正常同步'}
                </span>
              </div>

              {/* 5 个接口小圆点指示器 */}
              <div className="grid grid-cols-5 gap-1.5 mt-2.5">
                {adapters.map((ad) => (
                  <div
                    key={ad.id}
                    title={`${ad.platformName}: ${ad.status}`}
                    className={`h-2 rounded-full ${
                      ad.status === 'ONLINE'
                        ? 'bg-emerald-500'
                        : ad.status === 'RETRYING'
                        ? 'bg-red-500 animate-pulse'
                        : 'bg-amber-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 text-[11px] leading-snug">
              {hasInterfaceAnomaly ? (
                <p className="text-red-700 font-medium">
                  时代星云储能 EMS 网关连续 3 次超时，Modbus/TCP 连接重置，已触发 Agent Hub 介入。
                </p>
              ) : (
                <p className="text-slate-500">
                  光伏、储能、充电、电网、气象 5 路通道均在轮询周期内正常刷新。
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono">协议: Modbus/MQTT</span>
            <span className="text-blue-600 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              <span>接入治理</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
