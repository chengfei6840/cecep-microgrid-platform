import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGridMonitorData } from '../hooks/useGridMonitorData';
import { GridKpiCards } from '../components/monitor/grid/GridKpiCards';
import { RealtimeEnergyFlowDiagram } from '../components/monitor/grid/RealtimeEnergyFlowDiagram';
import { WeatherObservationCard } from '../components/monitor/grid/WeatherObservationCard';
import { GridTrendChart } from '../components/monitor/grid/GridTrendChart';
import { GridMeterDrawer } from '../components/monitor/grid/GridMeterDrawer';
import { PowerConventionBanner } from '../components/monitor/PowerConventionBanner';
import { MonitorRefreshIndicator } from '../components/monitor/MonitorRefreshIndicator';
import { MonitorRoleGuard } from '../components/monitor/MonitorRoleGuard';
import {
  ReadonlyBanner,
  LoadingView,
  ErrorView,
  EmptyView,
} from '../components/common/StateViews';
import { GridSimulatedState } from '../types/grid';
import {
  Activity,
  Zap,
  CloudSun,
  Layers,
  Sliders,
  AlertTriangle,
  Lock,
  Info,
  ShieldCheck,
  CheckCircle2,
  Columns,
  Sparkles,
} from 'lucide-react';

export const MonitorGrid: React.FC = () => {
  const navigate = useNavigate();
  const {
    site,
    countdown,
    refreshIntervalSeconds,
    setRefreshIntervalSeconds,
    isStreamInterrupted,
    toggleStreamInterrupted,
    resumeStream,
    lastDataTimestamp,
    isInspectorRole,
    // 状态模拟
    simulatedState,
    setSimulatedState,
    isGridMeterOffline,
    isWeatherMissing,
    isPartialAnomaly,
    // 数据模型
    gridKpi,
    weather,
    flowNodes,
    flowEdges,
    powerBalance,
    trendSamples24h,
  } = useGridMonitorData();

  // 主操作区视图切换：能流与电网 (默认) vs 微气象环境 vs 全景综合
  const [activeTab, setActiveTab] = useState<'FLOW_GRID' | 'WEATHER' | 'ALL'>('FLOW_GRID');

  // 电网关口表计详情抽屉开关
  const [isMeterDrawerOpen, setIsMeterDrawerOpen] = useState(false);

  // 1. 无权限状态处理
  if (simulatedState === 'FORBIDDEN') {
    return (
      <div className="p-6">
        <MonitorRoleGuard>
          <div className="p-4 text-center">无权访问</div>
        </MonitorRoleGuard>
      </div>
    );
  }

  // 2. 加载中状态处理
  if (simulatedState === 'LOADING') {
    return (
      <div className="p-6">
        <LoadingView text="正在通过 DL/T 645-2007 规约读取 10kV 进线关口双向电能表及微气象实测点位..." />
      </div>
    );
  }

  // 3. 错误状态处理
  if (simulatedState === 'ERROR') {
    return (
      <div className="p-6">
        <ErrorView
          message="10kV 变压器进线关口表网络通信超时，数据流中断"
          onRetry={() => setSimulatedState('NORMAL')}
        />
      </div>
    );
  }

  return (
    <MonitorRoleGuard>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
        {/* 顶部只读提示 (运营人员查看，严禁任何远程控制) */}
        <ReadonlyBanner
          message="电网负荷、气象与实时能流监测（只读模式）：本页面展示 10kV 并网关口实时功率、微电网五节点动态能流、合同需量及气象实测数据。系统处于安全受控运行，不提供任何远程控制或负荷调控按钮。"
        />

        {/* 页面主标题区与操作栏 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    电网负荷、气象与实时能流监测
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-purple-100/70 text-purple-800 border border-purple-200">
                    P05 核心能流
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    示范站 10kV 关口
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  站点：综合能源示范站 · 10kV 进线变压器 2000 kVA · 实时功率平衡推导 · 严谨实测无预测
                </p>
              </div>
            </div>
          </div>

          {/* 顶部控制组：刷新控制 + 模拟演练场景切换 */}
          <div className="flex flex-wrap items-center gap-3">
            {/* 刷新指示器 */}
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

          {/* 11 大受控场景模拟切换器 (验收演练) */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs">
            <Sliders className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <select
              id="grid-scenario-select"
              value={simulatedState}
              onChange={(e) => setSimulatedState(e.target.value as GridSimulatedState)}
              className="bg-transparent font-medium text-slate-700 py-1 pr-6 pl-1 focus:outline-none cursor-pointer text-xs"
            >
              <option value="NORMAL">工况 1: 正常运行 (网源荷储协同)</option>
              <option value="SELF_CONSUMPTION">工况 2: 自发自用 (光荷平衡电网近零)</option>
              <option value="FEED_IN_SURPLUS">工况 3: 余电上网 (光伏富余反送负功率)</option>
              <option value="STORAGE_CHARGING">工况 4: 储能充电 (吸收谷电蓄能)</option>
              <option value="STORAGE_DISCHARGING">工况 5: 储能放电 (高峰放电支持负荷)</option>
              <option value="WEATHER_MISSING">工况 6: 气象数据缺失 (传感器通信丢包)</option>
              <option value="GRID_METER_OFFLINE">工况 7: 关口表通信中断 (连线断开)</option>
              <option value="PARTIAL_ANOMALY">工况 8: 部分质量异常 (需量逼近/力率低)</option>
              <option value="LOADING">工况 9: 数据加载中</option>
              <option value="ERROR">工况 10: 接口通信失败</option>
              <option value="FORBIDDEN">工况 11: 无权限受控提示</option>
            </select>
          </div>
        </div>
      </div>

      {/* 功率约定规则横幅 */}
      <PowerConventionBanner compact={false} />

      {/* 核心 KPI 卡片网格 (包含购售电、站内总负荷、需量、合同利用率、功率因数、今日电量，以及需量处置建议) */}
      <GridKpiCards
        gridKpi={gridKpi}
        onOpenMeterDrawer={() => setIsMeterDrawerOpen(true)}
      />

      {/* 主操作区分区导航页签 (保持一个清晰的主操作区) */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('FLOW_GRID')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'FLOW_GRID'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            实时能流拓扑与实测趋势 (主操作区)
          </button>
          <button
            onClick={() => setActiveTab('WEATHER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'WEATHER'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CloudSun className="w-3.5 h-3.5" />
            微气象站现场实测观测
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            全景纵览
          </button>
        </div>

        <div className="text-xs text-slate-500 hidden sm:block">
          关口协议：<span className="font-mono font-medium text-slate-700">DL/T 645-2007 (RS485)</span>
        </div>
      </div>

      {/* 分区 1: 实时能流拓扑 + 功率平衡核算 + 24小时实测趋势 */}
      {(activeTab === 'FLOW_GRID' || activeTab === 'ALL') && (
        <div className="space-y-5">
          {/* 实时能流拓扑图 (5 节点由实时数据推导，连线方向/速率自适应，断网断开，支持跳转专项监测) */}
          <RealtimeEnergyFlowDiagram
            nodes={flowNodes}
            edges={flowEdges}
            powerBalance={powerBalance}
            isGridMeterOffline={isGridMeterOffline}
            onOpenGridDetail={() => setIsMeterDrawerOpen(true)}
          />

          {/* 24 小时实测功率趋势图 (同轴/分图，严禁 AI 预测) */}
          <GridTrendChart
            samples={trendSamples24h}
            isGridMeterOffline={isGridMeterOffline}
          />
        </div>
      )}

      {/* 分区 2: 微气象站现场实测观测区 */}
      {(activeTab === 'WEATHER' || activeTab === 'ALL') && (
        <div className="space-y-5">
          <WeatherObservationCard weather={weather} />
        </div>
      )}

      {/* 电网关口表计详情抽屉 */}
      <GridMeterDrawer
        isOpen={isMeterDrawerOpen}
        onClose={() => setIsMeterDrawerOpen(false)}
        gridKpi={gridKpi}
      />
      </div>
    </MonitorRoleGuard>
  );
};
