import React, { useState } from 'react';
import { useStorageMonitorData, StorageSimulatedState } from '../hooks/useStorageMonitorData';
import { StorageKpiCards } from '../components/monitor/StorageKpiCard';
import { StorageTrendChart } from '../components/monitor/StorageTrendChart';
import { StorageDeviceHierarchy } from '../components/monitor/StorageDeviceHierarchy';
import { StorageAuxiliaryCards } from '../components/monitor/StorageAuxiliaryCards';
import { StoragePcsDrawer } from '../components/monitor/StoragePcsDrawer';
import { StorageClusterDrawer } from '../components/monitor/StorageClusterDrawer';
import { StorageKpiDrawer } from '../components/monitor/StorageKpiDrawer';
import { MonitorRefreshIndicator } from '../components/monitor/MonitorRefreshIndicator';
import { MonitorRoleGuard } from '../components/monitor/MonitorRoleGuard';
import {
  ReadonlyBanner,
  LoadingView,
  ErrorView,
  EmptyView,
} from '../components/common/StateViews';
import {
  StoragePcsDetail,
  StorageBatteryClusterDetail,
  UnifiedMonitorPoint,
} from '../types/monitor';
import {
  BatteryCharging,
  Zap,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sliders,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Layers,
  Lock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MonitorStorage: React.FC = () => {
  const navigate = useNavigate();
  const {
    site,
    scenario,
    switchScenario,
    countdown,
    refreshIntervalSeconds,
    setRefreshIntervalSeconds,
    isStreamInterrupted,
    toggleStreamInterrupted,
    resumeStream,
    lastDataTimestamp,
    effectiveDataTimestamp,
    emsFrozenTimestamp,
    simulatedState,
    setSimulatedState,
    isEmsInterrupted,
    isSuspiciousBms,
    kpiPoints,
    pcsDetail,
    batteryClusters,
    auxiliarySystems,
    trendSamples24h,
    recent4hSamples,
    yesterdaySamples,
    linkedStorageAlarms,
  } = useStorageMonitorData();

  // 趋势图时间切片
  const [timeRange, setTimeRange] = useState<'TODAY' | 'RECENT_4H' | 'YESTERDAY'>('TODAY');

  // 抽屉状态
  const [selectedPcs, setSelectedPcs] = useState<StoragePcsDetail | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<StorageBatteryClusterDetail | null>(null);
  const [selectedKpiPoint, setSelectedKpiPoint] = useState<UnifiedMonitorPoint | null>(null);

  // 获取当前时间切片对应的采样序列
  const currentTrendSamples =
    timeRange === 'TODAY'
      ? trendSamples24h
      : timeRange === 'RECENT_4H'
      ? recent4hSamples
      : yesterdaySamples;

  // 状态视图判断
  if (simulatedState === 'ERROR') {
    return (
      <MonitorRoleGuard>
        <div className="space-y-6">
          <ErrorView
            message="与时代星云 EMS 本地规约网关建立 Modbus-TCP 连接超时，链路无应答"
            onRetry={() => setSimulatedState(null)}
          />
        </div>
      </MonitorRoleGuard>
    );
  }

  if (simulatedState === 'NO_DEVICES') {
    return (
      <MonitorRoleGuard>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900">储能电站运行监测</h1>
            <button
              onClick={() => setSimulatedState(null)}
              className="text-xs text-blue-600 underline font-semibold"
            >
              恢复正常状态
            </button>
          </div>
          <EmptyView
            title="未检索到接入的储能预制舱或 PCS 设备"
            description="当前微电网拓扑配置中暂未绑定 500kW/1000kWh 储能设备测点，请前往系统配置建立规约映射。"
          />
        </div>
      </MonitorRoleGuard>
    );
  }

  if (simulatedState === 'FORBIDDEN') {
    return (
      <MonitorRoleGuard>
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">访问控制限制：无储能监测权限</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            当前账号未分配【储能系统运维调度监视】专责权限。如需调阅 BMS 簇控微观电气参数，请联系系统管理员申请。
          </p>
          <button
            onClick={() => setSimulatedState(null)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            退出无权限演练
          </button>
        </div>
      </MonitorRoleGuard>
    );
  }

  return (
    <MonitorRoleGuard>
      <div className="space-y-6">
        {/* 1. 顶部标头与面包屑导航 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>微电网实时监测</span>
              <span>/</span>
              <span className="text-slate-900 font-semibold">储能系统 (BMS/PCS) 运行监测</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#004287] flex items-center justify-center font-bold">
                <BatteryCharging className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                {site.name}·500kW/1000kWh 储能电站实时监测
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                LFP 液冷预制舱
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              集中式同构遥测 · 严密监控 SOC/SOH 能量健康指标、PCS 四象限充放电出力、BMS 簇单体压差温差、液冷机组与消防闭锁。
            </p>
          </div>

          {/* 全局模拟刷新控制器 */}
          <MonitorRefreshIndicator
            countdown={countdown}
            refreshIntervalSeconds={refreshIntervalSeconds}
            onSetRefreshInterval={setRefreshIntervalSeconds}
            isStreamInterrupted={isStreamInterrupted}
            onToggleStreamInterrupted={toggleStreamInterrupted}
            onResumeStream={resumeStream}
            lastUpdatedTime={effectiveDataTimestamp}
            siteCode={site.code}
            siteName={site.name}
          />
        </div>

        {/* 2. 只读受控安全警示横幅 */}
        <ReadonlyBanner
          message="当前处于储能运行只读监测工作台。系统严格禁止通过本页面下发远程充放电、削峰填谷手动改写、或电池接触器分合闸控制指令。"
        />

        {/* 3. 统一功率符号与核心语义规范栏 */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold">统一功率符号与业务语义规范：</span>
              <span className="text-amber-800 ml-1">
                储能变流器功率严格采用<strong>正值 (+) 表示向电网放电</strong>、<strong>负值 (-) 表示自电网吸收充电</strong>；
                <strong>SOC (荷电状态)</strong> 专指当前可用能量百分比，<strong>SOH (健康状态)</strong> 专指电池全寿命衰减健康度，严禁混用。
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 font-mono text-[11px] text-amber-800">
            <span>并网形式: 400V 交流低压并网</span>
            <span>·</span>
            <span>充放倍率: 0.5C</span>
          </div>
        </div>

        {/* 4. 8 大受控状态模拟切换演练栏 */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>储能监测工况状态模拟与受控规则演练切换</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">
                当前工况: <strong>{simulatedState || (scenario === 'SCENARIO_B' ? '场景B (EMS断线)' : '正常谷充')}</strong>
              </span>
              {simulatedState && (
                <button
                  type="button"
                  onClick={() => setSimulatedState(null)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 underline font-semibold"
                >
                  恢复环境默认
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { key: null, label: '标准谷充', desc: '正常低谷充电 (-180kW)' },
              { key: 'NORMAL_DISCHARGING', label: '高峰放电', desc: '尖峰放电 (+240kW)' },
              { key: 'STANDBY', label: '平段待机', desc: '待机状态 (0 kW)' },
              { key: 'SUSPICIOUS_BMS', label: '部分 BMS 可疑', desc: '3#簇温差 6.0℃ 可疑' },
              { key: 'EMS_INTERRUPTED', label: 'EMS 通信中断 (场景B)', desc: '05:37 停滞真实断点' },
              { key: 'NO_DEVICES', label: '全部无数据', desc: '测试无设备接入屏' },
              { key: 'ERROR', label: '加载通信失败', desc: '测试重试错误屏' },
              { key: 'FORBIDDEN', label: '访问无权限', desc: '测试权限访问限制' },
            ].map((item) => (
              <button
                key={String(item.key)}
                type="button"
                onClick={() => setSimulatedState(item.key as StorageSimulatedState)}
                className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                  simulatedState === item.key
                    ? 'bg-[#004287] text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{item.label}</span>
              </button>
            ))}

            {/* 场景 A / B 真实环境一键切换 */}
            <button
              type="button"
              onClick={() => {
                setSimulatedState(null);
                switchScenario(scenario === 'SCENARIO_A' ? 'SCENARIO_B' : 'SCENARIO_A');
              }}
              className={`px-2.5 py-1 rounded text-xs transition-colors font-semibold flex items-center gap-1 ${
                scenario === 'SCENARIO_B'
                  ? 'bg-red-700 text-white shadow-2xs'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              <span>{scenario === 'SCENARIO_B' ? '当前环境: 场景B (储能故障)' : '切换到场景B验证'}</span>
            </button>
          </div>
        </div>

        {/* 场景 B 特别预警与真实断点横幅 (可追踪质量与告警) */}
        {isEmsInterrupted && (
          <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-950 shadow-xs">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 animate-bounce" />
              <div>
                <strong className="text-red-900">
                  场景 B 储能 EMS 规约通信已中断 (05:37:12 停滞)：
                </strong>
                <span className="text-red-800 ml-1">
                  时代星云本地通信网关连续 3 个上报周期无心跳，遥测时钟停滞在 <strong>{emsFrozenTimestamp}</strong>。
                  系统严禁沿用最后帧数值伪装实时，折线图已切断并展示真实缺口。
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/data/quality?deviceId=DEV-STORAGE-PCS01')}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-red-100 text-red-800 border border-red-300 font-bold transition-colors inline-flex items-center gap-1"
              >
                <span>追溯数据质量异常</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/alarms?deviceId=DEV-STORAGE-PCS01')}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors inline-flex items-center gap-1 shadow-2xs"
              >
                <span>前往告警中心</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 5. 顶部 6 大核心 KPI 看板 (点击打开全站宏观指标汇总抽屉) */}
        <StorageKpiCards
          kpiPoints={kpiPoints}
          onOpenKpiDrawer={(point) => setSelectedKpiPoint(point)}
          isScenarioBExpired={isEmsInterrupted}
        />

        {/* 6. 中部 SOC 与充放电功率双轴实测趋势图 (真实断点缺口) */}
        <StorageTrendChart
          samples={currentTrendSamples}
          timeRange={timeRange}
          onChangeTimeRange={setTimeRange}
          isScenarioBExpired={isEmsInterrupted}
          emsFrozenTimestamp={emsFrozenTimestamp}
        />

        {/* 7. 设备区域按储能系统→PCS→电池簇/BMS层级展开 */}
        <StorageDeviceHierarchy
          pcsDetail={pcsDetail}
          batteryClusters={batteryClusters}
          onSelectPcs={(pcs) => setSelectedPcs(pcs)}
          onSelectCluster={(clus) => setSelectedCluster(clus)}
          isScenarioBExpired={isEmsInterrupted}
        />

        {/* 8. 右侧或下方展示液冷、消防、电表和近期关联告警 */}
        <StorageAuxiliaryCards
          auxiliary={auxiliarySystems}
          linkedAlarms={linkedStorageAlarms}
          isScenarioBExpired={isEmsInterrupted}
        />

        {/* 9. 抽屉组件 (详情与汇总) */}
        {/* PCS 变流器详情抽屉 */}
        <StoragePcsDrawer
          pcs={selectedPcs}
          onClose={() => setSelectedPcs(null)}
        />

        {/* 电池簇与 BMS 测点抽屉 */}
        <StorageClusterDrawer
          cluster={selectedCluster}
          onClose={() => setSelectedCluster(null)}
        />

        {/* 全站储能 KPI 汇总抽屉 */}
        <StorageKpiDrawer
          point={selectedKpiPoint}
          pcsDetail={pcsDetail}
          batteryClusters={batteryClusters}
          onClose={() => setSelectedKpiPoint(null)}
          isScenarioBExpired={isEmsInterrupted}
        />
      </div>
    </MonitorRoleGuard>
  );
};
