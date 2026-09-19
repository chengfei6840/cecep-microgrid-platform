import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EnergyFlowNode,
  EnergyFlowEdge,
  PowerBalanceSummary,
  FlowNodeType,
} from '../../../types/grid';
import {
  SunMedium,
  Activity,
  BatteryCharging,
  Zap,
  Building2,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  Info,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Radio,
  Clock,
  Sliders,
  Layers,
} from 'lucide-react';

interface RealtimeEnergyFlowDiagramProps {
  nodes: EnergyFlowNode[];
  edges: EnergyFlowEdge[];
  powerBalance: PowerBalanceSummary;
  isGridMeterOffline?: boolean;
  onOpenGridDetail?: () => void;
}

export const RealtimeEnergyFlowDiagram: React.FC<RealtimeEnergyFlowDiagramProps> = ({
  nodes,
  edges,
  powerBalance,
  isGridMeterOffline = false,
  onOpenGridDetail,
}) => {
  const navigate = useNavigate();

  // 悬停节点显示元数据详情 (数据源、质量、更新时间)
  const [hoveredNodeId, setHoveredNodeId] = useState<FlowNodeType | null>(null);

  // 节点字典
  const nodeMap = React.useMemo(() => {
    const map = new Map<FlowNodeType, EnergyFlowNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const pvNode = nodeMap.get('PV');
  const gridNode = nodeMap.get('GRID');
  const storageNode = nodeMap.get('STORAGE');
  const chargingNode = nodeMap.get('CHARGING');
  const loadNode = nodeMap.get('LOAD');

  // 获取边字典
  const edgeMap = React.useMemo(() => {
    const map = new Map<string, EnergyFlowEdge>();
    edges.forEach((e) => map.set(e.id, e));
    return map;
  }, [edges]);

  const pvEdge = edgeMap.get('EDGE-PV-BUS');
  const gridEdge = edgeMap.get('EDGE-GRID-BUS') || edgeMap.get('EDGE-BUS-GRID');
  const storageEdge = edgeMap.get('EDGE-STORAGE-BUS') || edgeMap.get('EDGE-BUS-STORAGE');
  const chargingEdge = edgeMap.get('EDGE-BUS-CHARGING');
  const loadEdge = edgeMap.get('EDGE-BUS-LOAD');

  // 节点点击跳转对应页面
  const handleNodeClick = (node: EnergyFlowNode | undefined) => {
    if (!node) return;
    if (node.targetRoute) {
      navigate(node.targetRoute);
    } else if (node.id === 'GRID' && onOpenGridDetail) {
      onOpenGridDetail();
    }
  };

  // 节点悬停浮层内容
  const activeHoveredNode = hoveredNodeId ? nodeMap.get(hoveredNodeId) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* 头部标题区 */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                示范站微电网实时能流拓扑图
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                实时动态推导
              </span>
              <span className="text-[11px] text-slate-400">
                (悬停查看元数据质量 · 点击跳转分项监测)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>光伏</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
            <span>电网</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span>储能</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>充电</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span>
            <span>负荷</span>
          </div>
        </div>
      </div>

      {/* 核心拓扑画布区域 */}
      <div className="p-6 bg-slate-900 text-slate-100 relative overflow-hidden select-none">
        {/* 背景微网格网纹 */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* 悬停浮层 Tooltip (置于右上角或固定浮动卡片) */}
        {activeHoveredNode && (
          <div className="absolute top-4 right-4 z-30 w-72 bg-slate-800/95 border border-slate-700/80 rounded-xl p-3.5 shadow-xl backdrop-blur-sm text-xs transition-all animate-fadeIn">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
              <span className="font-bold text-white flex items-center gap-1.5">
                {activeHoveredNode.name}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                  activeHoveredNode.quality === 'NORMAL'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                质量: {activeHoveredNode.quality}
              </span>
            </div>

            <div className="space-y-1.5 text-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">实时测点值:</span>
                <span className="font-mono font-bold text-white">
                  {activeHoveredNode.powerKw !== null
                    ? `${Math.abs(activeHoveredNode.powerKw).toFixed(1)} kW`
                    : '-- (通信离线)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">流动状态:</span>
                <span className="font-medium text-slate-200">
                  {activeHoveredNode.directionText}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">数据源平台:</span>
                <span className="text-slate-200 truncate max-w-[150px]">
                  {activeHoveredNode.sourceSystem}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">采集通信规约:</span>
                <span className="font-mono text-slate-200">
                  {activeHoveredNode.protocol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">时间标戳:</span>
                <span className="font-mono text-slate-400">
                  {activeHoveredNode.lastUpdated}
                </span>
              </div>
              {activeHoveredNode.qualityReason && (
                <div className="pt-1.5 text-[10px] text-slate-400 border-t border-slate-700/60 leading-tight">
                  {activeHoveredNode.qualityReason}
                </div>
              )}
            </div>

            {activeHoveredNode.targetRoute && (
              <div className="mt-2.5 pt-2 border-t border-slate-700/80 flex items-center justify-between text-indigo-400 text-[11px] font-medium">
                <span>点击节点深入专项监测</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            )}
          </div>
        )}

        {/* 节点布局网格 */}
        <div className="max-w-4xl mx-auto py-4">
          {/* 上排节点：光伏 (左) + 10kV电网 (右) */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            {/* 1. 光伏节点 */}
            <div
              id="flow-node-pv"
              onMouseEnter={() => setHoveredNodeId('PV')}
              onMouseLeave={() => setHoveredNodeId(null)}
              onClick={() => handleNodeClick(pvNode)}
              className="bg-slate-800/90 hover:bg-slate-800 border-2 border-amber-500/60 hover:border-amber-400 rounded-2xl p-4 cursor-pointer transition-all shadow-lg hover:shadow-amber-500/10 group relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <SunMedium className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      屋顶分布式光伏
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
                    </h4>
                    <p className="text-[11px] text-slate-400">1.2 MWp 逆变器群</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  单向发电 (+)
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black font-mono text-amber-400">
                    {pvNode?.powerKw?.toFixed(1) ?? '0.0'}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">kW</span>
                </div>
                <span className="text-xs text-amber-300/80 font-medium">
                  今日累计 3,842.6 kWh
                </span>
              </div>
            </div>

            {/* 2. 电网关口节点 */}
            <div
              id="flow-node-grid"
              onMouseEnter={() => setHoveredNodeId('GRID')}
              onMouseLeave={() => setHoveredNodeId(null)}
              onClick={() => handleNodeClick(gridNode)}
              className={`bg-slate-800/90 hover:bg-slate-800 border-2 rounded-2xl p-4 cursor-pointer transition-all shadow-lg group relative ${
                isGridMeterOffline
                  ? 'border-rose-500/70 hover:border-rose-400 bg-rose-950/20'
                  : 'border-purple-500/60 hover:border-purple-400 hover:shadow-purple-500/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
                      isGridMeterOffline
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      10kV 上级电网关口
                      <span className="text-[10px] text-purple-400 bg-purple-950 px-1 rounded">
                        查看表计
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">2000 kVA 主变总降</p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                    isGridMeterOffline
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : gridNode?.powerKw !== null && gridNode!.powerKw! > 0
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {isGridMeterOffline
                    ? '通信断开'
                    : gridNode?.powerKw !== null && gridNode!.powerKw! > 0
                    ? '下网购电 (+)'
                    : '余电上网 (-)'}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-3xl font-black font-mono ${
                      isGridMeterOffline
                        ? 'text-rose-400'
                        : gridNode?.powerKw !== null && gridNode!.powerKw! > 0
                        ? 'text-purple-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {isGridMeterOffline
                      ? '--'
                      : Math.abs(gridNode?.powerKw ?? 0).toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">kW</span>
                </div>
                <span className="text-xs text-slate-400">
                  {isGridMeterOffline
                    ? 'DL/T 645 规约超时'
                    : gridNode?.powerKw !== null && gridNode!.powerKw! > 0
                    ? '购电受电负荷'
                    : '绿电反送并网'}
                </span>
              </div>
            </div>
          </div>

          {/* 中间层：能流通道与 10kV/400V 交流母线中枢 */}
          <div className="relative my-4">
            {/* 交流母线中枢横梁 */}
            <div
              id="flow-bus-bar"
              className="bg-slate-800 border-2 border-indigo-500/80 rounded-xl px-6 py-3 shadow-xl relative z-10 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span>
                <div>
                  <div className="text-sm font-black tracking-wide text-indigo-300">
                    示范站微电网 10kV / 0.4kV 交流并网母线 (AC BUS)
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    电压等级 10.02 kV · 频率 50.02 Hz · 功率四象限动态平衡中枢
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">电源侧进线</div>
                  <div className="text-emerald-400 font-bold">
                    +{powerBalance.generationKw} kW
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">负荷侧出线</div>
                  <div className="text-amber-400 font-bold">
                    -{powerBalance.consumptionKw} kW
                  </div>
                </div>
                <div className="pl-3 border-l border-slate-700 text-right">
                  <div className="text-[10px] text-slate-400">测量微差</div>
                  <div className="text-slate-300 font-bold">
                    {powerBalance.imbalanceDeltaKw >= 0 ? '+' : ''}
                    {powerBalance.imbalanceDeltaKw} kW
                  </div>
                </div>
              </div>
            </div>

            {/* 上下流动动态指示指示器 */}
            <div className="grid grid-cols-2 gap-8 my-2 px-8">
              {/* 光伏 -> 母线 指示 */}
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-amber-400">
                <ArrowDown className="w-4 h-4 animate-bounce" />
                <span>光伏供电注入 +{pvNode?.powerKw?.toFixed(1)} kW</span>
              </div>

              {/* 电网 <-> 母线 指示 */}
              <div className="flex items-center justify-center gap-2 text-xs font-mono">
                {isGridMeterOffline ? (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    关口表通信断开 (连线断开，严禁虚假插值补平)
                  </span>
                ) : gridNode?.powerKw !== null && gridNode!.powerKw! > 0 ? (
                  <span className="text-purple-400 flex items-center gap-1.5">
                    <ArrowDown className="w-4 h-4 animate-bounce" />
                    电网购电下网 +{gridNode!.powerKw!.toFixed(1)} kW
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <ArrowUp className="w-4 h-4 animate-bounce" />
                    余电反送上网 -{Math.abs(gridNode?.powerKw ?? 0).toFixed(1)} kW
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 下排节点：储能 (左) + 充电桩群 (中) + 综合基础负荷 (右) */}
          <div className="grid grid-cols-3 gap-5 mt-4">
            {/* 3. 储能系统节点 */}
            <div
              id="flow-node-storage"
              onMouseEnter={() => setHoveredNodeId('STORAGE')}
              onMouseLeave={() => setHoveredNodeId(null)}
              onClick={() => handleNodeClick(storageNode)}
              className="bg-slate-800/90 hover:bg-slate-800 border-2 border-blue-500/60 hover:border-blue-400 rounded-2xl p-3.5 cursor-pointer transition-all shadow-lg hover:shadow-blue-500/10 group relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BatteryCharging className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1">
                      储能变流器 (PCS)
                      <ExternalLink className="w-2.5 h-2.5 text-slate-500 group-hover:text-blue-400" />
                    </h4>
                    <p className="text-[10px] text-slate-400">500kW/1000kWh</p>
                  </div>
                </div>

                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                    storageNode?.powerKw !== null && storageNode!.powerKw! > 0
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : storageNode?.powerKw !== null && storageNode!.powerKw! < 0
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {storageNode?.directionText}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-black font-mono ${
                      storageNode?.powerKw !== null && storageNode!.powerKw! > 0
                        ? 'text-amber-400'
                        : storageNode?.powerKw !== null && storageNode!.powerKw! < 0
                        ? 'text-blue-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {storageNode?.powerKw !== null && storageNode!.powerKw! > 0 ? '+' : ''}
                    {storageNode?.powerKw?.toFixed(1) ?? '0.0'}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">kW</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {storageNode?.powerKw !== null && storageNode!.powerKw! > 0
                    ? '放电向母线供电'
                    : storageNode?.powerKw !== null && storageNode!.powerKw! < 0
                    ? '低谷吸收充电'
                    : '待机待命'}
                </span>
              </div>
            </div>

            {/* 4. 充电桩群节点 */}
            <div
              id="flow-node-charging"
              onMouseEnter={() => setHoveredNodeId('CHARGING')}
              onMouseLeave={() => setHoveredNodeId(null)}
              onClick={() => handleNodeClick(chargingNode)}
              className="bg-slate-800/90 hover:bg-slate-800 border-2 border-emerald-500/60 hover:border-emerald-400 rounded-2xl p-3.5 cursor-pointer transition-all shadow-lg hover:shadow-emerald-500/10 group relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1">
                      园区充电桩群
                      <ExternalLink className="w-2.5 h-2.5 text-slate-500 group-hover:text-emerald-400" />
                    </h4>
                    <p className="text-[10px] text-slate-400">12 台双枪快充</p>
                  </div>
                </div>

                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  单向用电 (+)
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    {chargingNode?.powerKw?.toFixed(1) ?? '0.0'}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">kW</span>
                </div>
                <span className="text-[11px] text-slate-400">与 P08 页面同源</span>
              </div>
            </div>

            {/* 5. 站内基础负荷节点 */}
            <div
              id="flow-node-load"
              onMouseEnter={() => setHoveredNodeId('LOAD')}
              onMouseLeave={() => setHoveredNodeId(null)}
              className="bg-slate-800/90 hover:bg-slate-800 border-2 border-cyan-500/60 hover:border-cyan-400 rounded-2xl p-3.5 transition-all shadow-lg group relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">站内基础负荷</h4>
                    <p className="text-[10px] text-slate-400">办公 / 空调 / 照明</p>
                  </div>
                </div>

                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                  动力受电 (+)
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-cyan-400">
                    {loadNode?.powerKw?.toFixed(1) ?? '0.0'}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">kW</span>
                </div>
                <span className="text-[11px] text-slate-400">动力分表监测</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部：功率平衡核算面板 (严格执行业务规则：展示小幅非同期测量误差，严禁在电表断线时自动补平) */}
      <div className="p-4 bg-slate-50 border-t border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900">
                  微网瞬时功率平衡核算准则 (∑P_进 = ∑P_出 ± 测量容差)
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-100 text-blue-800">
                  {powerBalance.balanceStatus === 'DISCONNECTED_METER'
                    ? '网侧断线无法核算'
                    : '实测容差合规 (0.28%)'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {powerBalance.isDemonstrationNote}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono bg-white px-4 py-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 text-[10px] block">总进线 (电源)</span>
              <span className="font-bold text-emerald-600">
                {powerBalance.generationKw} kW
              </span>
            </div>
            <div className="text-slate-300 font-sans">=</div>
            <div>
              <span className="text-slate-400 text-[10px] block">总出线 (负荷)</span>
              <span className="font-bold text-amber-600">
                {powerBalance.consumptionKw} kW
              </span>
            </div>
            <div className="text-slate-300 font-sans">+</div>
            <div>
              <span className="text-slate-400 text-[10px] block">测量微差 (Δ)</span>
              <span className="font-bold text-slate-700">
                {powerBalance.imbalanceDeltaKw} kW
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
