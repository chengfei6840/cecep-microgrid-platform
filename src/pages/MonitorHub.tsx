import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonitorData } from '../hooks/useMonitorData';
import { useAppStore } from '../store/AppContext';
import { MonitorRoleGuard } from '../components/monitor/MonitorRoleGuard';
import { PowerConventionBanner } from '../components/monitor/PowerConventionBanner';
import { MonitorRefreshIndicator } from '../components/monitor/MonitorRefreshIndicator';
import { MonitorKpiCard } from '../components/monitor/MonitorKpiCard';
import { MonitorTrendChart } from '../components/monitor/MonitorTrendChart';
import { MonitorDeviceStatusSummary } from '../components/monitor/MonitorDeviceStatusSummary';
import { MonitorDeviceTable } from '../components/monitor/MonitorDeviceTable';
import { MonitorDeviceDrawer } from '../components/monitor/MonitorDeviceDrawer';
import { LoadingView, ErrorView, EmptyView, ReadonlyBanner } from '../components/common/StateViews';
import { UnifiedMonitorDevice, MonitorSystemState } from '../types/monitor';
import {
  Activity,
  SunMedium,
  BatteryCharging,
  Zap,
  Gauge,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';

export const MonitorHub: React.FC = () => {
  const navigate = useNavigate();
  const { scenario, switchScenario } = useAppStore();

  const {
    site,
    unifiedPoints,
    unifiedDevices,
    deviceStatusSummary,
    trendSamples,
    // 刷新控制器
    countdown,
    refreshIntervalSeconds,
    setRefreshIntervalSeconds,
    isStreamInterrupted,
    toggleStreamInterrupted,
    resumeStream,
    lastDataTimestamp,
    // 状态模拟
    activeSystemState,
    simulatedStateOverride,
    setSimulatedStateOverride,
  } = useMonitorData();

  // 设备表格状态筛选与选中抽屉
  const [deviceFilter, setDeviceFilter] = useState<string>('ALL');
  const [selectedDevice, setSelectedDevice] = useState<UnifiedMonitorDevice | null>(null);

  // 过滤后的设备列表
  const filteredDevices = useMemo(() => {
    if (activeSystemState === 'NO_DEVICES') return [];
    if (deviceFilter === 'ALL') return unifiedDevices;
    return unifiedDevices.filter((d) => d.status === deviceFilter);
  }, [unifiedDevices, deviceFilter, activeSystemState]);

  // 根据选中的测点快速打开关联设备的抽屉
  const handlePointClick = (deviceId: string) => {
    const dev = unifiedDevices.find((d) => d.id === deviceId);
    if (dev) {
      setSelectedDevice(dev);
    }
  };

  // 9 大受控运行状态模拟条选项
  const stateOptions: Array<{ id: MonitorSystemState | 'SCENARIO_B'; label: string; desc: string }> = [
    { id: 'NORMAL', label: '1. 正常运行 (场景A)', desc: '全站设备与测点完整连续采集' },
    { id: 'SCENARIO_B', label: '2. 储能异常闭环 (场景B)', desc: '储能通信断线停滞，光伏/电网正常' },
    { id: 'STREAM_INTERRUPTED', label: '3. 实时流中断', desc: '推流暂停，时间停止并呈现恢复入口' },
    { id: 'STALE_DATA', label: '4. 过期数据', desc: '超过刷新心跳阈值，标记陈旧停滞' },
    { id: 'PARTIAL_MISSING', label: '5. 部分数据缺失', desc: '局部测点未采集到，置信度降级' },
    { id: 'NO_DEVICES', label: '6. 无设备态', desc: '空状态测试与接入引导' },
    { id: 'LOADING', label: '7. 数据加载中', desc: '骨架屏与载入态动画' },
    { id: 'ERROR', label: '8. 通信失败', desc: '服务或网关异常重试' },
    { id: 'READ_ONLY', label: '9. 只读监控态', desc: '全站受控无控制下发按钮' },
  ];

  const handleStateSelect = (stateId: MonitorSystemState | 'SCENARIO_B') => {
    if (stateId === 'SCENARIO_B') {
      switchScenario('SCENARIO_B');
      setSimulatedStateOverride(null);
    } else if (stateId === 'NORMAL') {
      switchScenario('SCENARIO_A');
      setSimulatedStateOverride(null);
      if (isStreamInterrupted) resumeStream();
    } else if (stateId === 'STREAM_INTERRUPTED') {
      setSimulatedStateOverride('STREAM_INTERRUPTED');
      if (!isStreamInterrupted) toggleStreamInterrupted();
    } else {
      setSimulatedStateOverride(stateId);
    }
  };

  return (
    <MonitorRoleGuard>
      <div className="space-y-6">
        {/* 1. 顶部标头与面包屑 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>微电网实时监测</span>
              <span>/</span>
              <span className="text-slate-900 font-semibold">监测中心总览与交互规范</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#004287] flex items-center justify-center font-bold">
                <Gauge className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                {site.name}·实时监测共享规范总览
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                集中式同构数据源
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              建立后续各子系统监测页（光伏、储能、充电桩、电网负荷）共享的数据选择器、功率符号约定、时间口径与质量状态流转。
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
            lastUpdatedTime={lastDataTimestamp}
            siteCode={site.code}
            siteName={site.name}
          />
        </div>

        {/* 2. 交互状态演练模拟工具栏 (支持验收 9 大监测运行状态) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 flex-wrap">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900">监测规范受控运行状态演练台</span>
              <span className="text-[11px] text-slate-400">
                （点击快速切换并检验全站组件对 9 大状态的自适应处理）
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">当前场景:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] border ${
                  scenario === 'SCENARIO_B'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {scenario === 'SCENARIO_B' ? '场景 B (储能异常)' : '场景 A (正常)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {stateOptions.map((opt) => {
              const isSelected =
                (opt.id === 'SCENARIO_B' && scenario === 'SCENARIO_B' && !simulatedStateOverride) ||
                (opt.id === 'NORMAL' && scenario === 'SCENARIO_A' && !simulatedStateOverride) ||
                simulatedStateOverride === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleStateSelect(opt.id)}
                  title={opt.desc}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-[#004287] text-white border-[#004287] shadow-2xs font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. 状态覆盖处理：如果处于加载中或错误态，按规范展示对应视口 */}
        {activeSystemState === 'LOADING' ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-2xs">
            <LoadingView text="正在从电站集中通信前置网关获取遥测数据流..." />
          </div>
        ) : activeSystemState === 'ERROR' ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-2xs">
            <ErrorView
              title="监测服务通信异常"
              message="与前置数据服务接口握手超时，通信协议解析队列发生阻塞。"
              onRetry={() => setSimulatedStateOverride(null)}
              traceId="ERR-MONITOR-ZZ001-9982"
            />
          </div>
        ) : (
          <>
            {/* 只读状态提示条 */}
            {activeSystemState === 'READ_ONLY' && (
              <ReadonlyBanner message="监测大盘全站处于只读状态，操作权限仅限于工况查看、测点下钻和关联跳转，禁止下发功率控制指令。" />
            )}

            {/* 4. 统一功率符号说明组件 (显式呈现正负物理含义) */}
            <PowerConventionBanner />

            {/* 5. 共享 KPI 卡片网格 (严格区分实时瞬时 kW 与今日累计 kWh) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">核心指标遥测卡片群</h3>
                  <span className="text-[11px] text-slate-400">
                    （同一测点/设备在各视图使用统一定义；点击卡片可唤起设备详情抽屉）
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  共 {unifiedPoints.length} 个基准遥测点
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {unifiedPoints.map((pt) => (
                  <MonitorKpiCard
                    key={pt.id}
                    point={pt}
                    onClickDetail={() => handlePointClick(pt.deviceId)}
                  />
                ))}
              </div>
            </div>

            {/* 6. 实测运行趋势图 (带 0kW 零轴与正负向标注) */}
            <MonitorTrendChart samples={trendSamples} scenario={scenario} />

            {/* 7. 设备状态统计与设备表格 */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">示范站入网监控设备列表</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    展示光伏逆变器、储能 PCS、电池舱、直流充电桩群和电网关口表实时通信与质量状态
                  </p>
                </div>

                <MonitorDeviceStatusSummary
                  counts={deviceStatusSummary}
                  selectedFilter={deviceFilter}
                  onSelectFilter={setDeviceFilter}
                />
              </div>

              {activeSystemState === 'NO_DEVICES' ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8">
                  <EmptyView
                    title="当前无在线监控设备"
                    description="示范站当前通信适配器未接入任何测控设备，可前往数据接入中心配置。"
                    actionText="恢复设备列表"
                    onAction={() => setSimulatedStateOverride(null)}
                  />
                </div>
              ) : (
                <MonitorDeviceTable
                  devices={filteredDevices}
                  onSelectDevice={(dev) => setSelectedDevice(dev)}
                />
              )}
            </div>

            {/* 8. 子系统监测入口索引卡片 (保持各子系统为规范占位页，不提前过载实现) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">后续子系统专用监测页入口</h3>
                <span className="text-xs text-slate-400">
                  （各子系统均基于上述共享规范与集中选择器逐步构建）
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 光伏 */}
                <div
                  onClick={() => navigate('/monitor/pv')}
                  className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <SunMedium className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      MONITOR-PV
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 group-hover:text-amber-700 transition-colors">
                    屋顶光伏发电监测
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    逆变器交流输出、MPPT 效率、支路直流组串电压与当日发电累计曲线。
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 font-medium">
                    <span>进入子系统</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 储能 */}
                <div
                  onClick={() => navigate('/monitor/storage')}
                  className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <BatteryCharging className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      MONITOR-STORAGE
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition-colors">
                    储能系统 (BMS/PCS) 监测
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    500kW/1000kWh 储能电站 SOC、充放电状态、电芯温差与两充两放工况。
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-700 font-medium">
                    <span>进入子系统</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 充电桩 */}
                <div
                  onClick={() => navigate('/monitor/charging')}
                  className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      MONITOR-CHARGING
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                    园区充电桩群监测
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    12台 120kW 直流快充桩群枪位占用、即时充电负荷与有序充电状态。
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-medium">
                    <span>进入子系统</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 电网与气象 */}
                <div
                  onClick={() => navigate('/monitor/grid')}
                  className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      MONITOR-GRID
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 group-hover:text-purple-700 transition-colors">
                    电网负荷与微气象监测
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    10kV 母线关口负荷、主变负载率、辐照度与环境温湿度实测趋势。
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-purple-700 font-medium">
                    <span>进入子系统</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 9. 设备详情只读抽屉 */}
        <MonitorDeviceDrawer
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      </div>
    </MonitorRoleGuard>
  );
};
