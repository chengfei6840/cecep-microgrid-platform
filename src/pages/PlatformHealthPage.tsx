import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { HealthSimulationMode } from '../utils/healthDiagnostics';
import { PlatformHealthItem } from '../types/domain';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Cpu,
  Server,
  Database,
  Radio,
  Workflow,
  Bot,
  ShieldCheck,
  Zap,
  Sliders,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  HardDrive,
  Network,
} from 'lucide-react';

export const PlatformHealthPage: React.FC = () => {
  const {
    healthItems,
    healthCheckStatus,
    healthSimMode,
    lastHealthCheckedTime,
    runHealthCheck,
    setHealthSimulationMode,
    agentDegradedMode,
    toggleAgentDegradedMode,
    currentRole,
    scenario,
  } = useAppStore();

  const isAdmin = currentRole === 'ADMIN';
  const isOperator = currentRole === 'OPERATOR';

  const [isProbing, setIsProbing] = useState(false);
  const [probeSuccessNotice, setProbeSuccessNotice] = useState<string | null>(null);

  // 执行手动健康自检探测
  const handleRunHealthCheck = async () => {
    setIsProbing(true);
    await runHealthCheck();
    setIsProbing(false);
    setProbeSuccessNotice(`自检完成！全链路 6 组核心组件健康度与探针延迟已更新 (${new Date().toLocaleTimeString()})`);
    setTimeout(() => setProbeSuccessNotice(null), 4000);
  };

  // 统计指标
  const healthyCount = healthItems.filter((i) => i.status === 'HEALTHY').length;
  const degradedCount = healthItems.filter((i) => i.status === 'DEGRADED').length;
  const errorCount = healthItems.filter((i) => i.status === 'ERROR').length;
  const avgLatency =
    healthItems.length > 0
      ? Math.round(healthItems.reduce((acc, cur) => acc + cur.latencyMs, 0) / healthItems.length)
      : 0;

  // 根据类别分配图标
  const getCategoryIcon = (category: PlatformHealthItem['category']) => {
    switch (category) {
      case 'FRONTEND':
        return <Cpu className="w-5 h-5 text-blue-600" />;
      case 'GATEWAY':
        return <Network className="w-5 h-5 text-indigo-600" />;
      case 'STORAGE':
        return <HardDrive className="w-5 h-5 text-emerald-600" />;
      case 'STREAM':
        return <Radio className="w-5 h-5 text-purple-600" />;
      case 'ADAPTER':
        return <Server className="w-5 h-5 text-amber-600" />;
      case 'AGENT':
        return <Bot className="w-5 h-5 text-cyan-600" />;
      default:
        return <Activity className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div id="platform-health-container" className="space-y-6 pb-12">
      {/* 头部区域 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">平台自身健康诊断与自检监控</h1>
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                  前置探针监测
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {isOperator
                  ? '微电网运营健康摘要：实时监视关键业务服务就绪状态、数据流可信度与调度降级保护。'
                  : '系统微服务与数据链路自检：监视前端渲染、API 网关、本地持久化、实时流管道、五类工业适配器与 Agent 决策健康。'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-run-health-check"
            disabled={isProbing}
            onClick={handleRunHealthCheck}
            className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isProbing ? 'animate-spin' : ''}`} />
            {isProbing ? '正在探测全链路探针...' : '立即全链路自检探测'}
          </button>
        </div>
      </div>

      {probeSuccessNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{probeSuccessNotice}</span>
          </div>
        </div>
      )}

      {/* 运营人员与管理员统一声明：非生产监控免责提示 */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            运行自检环境说明：本页面展示平台核心组件与数据链路的自检仿真探针指标。系统严守高可用设计，Agent 异常只触发降级，不使基础业务停摆。
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 shrink-0 ml-4">
          上次自检: {lastHealthCheckedTime}
        </div>
      </div>

      {/* 健康状态统计指标 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">平台整体健康状态</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span
              className={`text-2xl font-bold ${
                errorCount > 0
                  ? 'text-rose-600'
                  : degradedCount > 0
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {errorCount > 0 ? '存在异常中断' : degradedCount > 0 ? '部分弹性降级' : '全链路健康正常'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {healthyCount} 正常 · {degradedCount} 降级 · {errorCount} 告警
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">基础业务连续性保证</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-blue-600">100.0%</span>
            <span className="text-xs text-slate-500">基础遥测可用</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            SCADA 遥测与人工工单不受 Agent 波动影响
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">探针全链路平均延迟</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-purple-600">{avgLatency}</span>
            <span className="text-xs text-slate-500">ms</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">微服务网关平均响应耗时</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Agent 调度运行机制</span>
            <span className="p-1.5 bg-cyan-50 text-cyan-600 rounded-md">
              <Bot className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span
              className={`text-xl font-bold ${
                agentDegradedMode ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {agentDegradedMode ? '本地专家规则 (降级)' : 'Gemini AI 智能决策'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {agentDegradedMode ? '安全降级中，基础业务无缝维持' : '模型推理正常接入'}
          </p>
        </div>
      </div>

      {/* 核心架构原则卡片：Agent 异常只触发降级，不使基础业务停摆 */}
      <div className="bg-linear-to-r from-blue-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                微电网数字化系统核心高可用设计原则
              </span>
            </div>
            <h2 className="text-lg font-bold">
              Agent 策略建议异常仅触发安全降级，不使基础业务停摆
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              决策辅助 Agent 作为高阶优化模型，与 SCADA 工业底座强物理隔离。当发生网络延迟、模型限流或推理中断时，平台无感切换至预置专家规则（防逆流硬约束、恒功率备用充放策略），严密保护设备电气安全；实时遥测采集、大屏功率流向、分时电价核算、人工消缺工单完全正常运转！
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <div className="text-xs space-y-1 text-center sm:text-left">
              <div className="text-slate-300">当前 Agent 决策状态:</div>
              <div className="font-bold text-sm text-cyan-300">
                {agentDegradedMode ? '已切入规则专家降级模式' : 'Gemini AI 在线正常'}
              </div>
            </div>

            {isAdmin && (
              <button
                id="btn-toggle-agent-degraded-mode"
                onClick={toggleAgentDegradedMode}
                className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {agentDegradedMode ? '恢复 AI 模型在线' : '演练主动降级'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 管理员专属：健康仿真演练控制台 */}
      {isAdmin && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                演练仿真模式注入 (管理员专属)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              用于检验全站链路在不同应激条件下的弹性恢复与降级机制
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <button
              id="sim-mode-auto"
              onClick={() => setHealthSimulationMode('AUTO')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                healthSimMode === 'AUTO'
                  ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-900">自动场景联动模式</span>
                {healthSimMode === 'AUTO' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                根据场景 A (正常) 或场景 B (储能异常) 自动计算探针状态
              </p>
            </button>

            <button
              id="sim-mode-healthy"
              onClick={() => setHealthSimulationMode('ALL_HEALTHY')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                healthSimMode === 'ALL_HEALTHY'
                  ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-900">全量健康仿真</span>
                {healthSimMode === 'ALL_HEALTHY' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                强制 6 大核心模块探针全部处于高可用极速状态 (&lt;20ms)
              </p>
            </button>

            <button
              id="sim-mode-degraded"
              onClick={() => setHealthSimulationMode('PARTIAL_DEGRADED')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                healthSimMode === 'PARTIAL_DEGRADED'
                  ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-900">部分降级仿真</span>
                {healthSimMode === 'PARTIAL_DEGRADED' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                模拟储能通讯中断，Agent 自动切入专家规则模式
              </p>
            </button>

            <button
              id="sim-mode-failed"
              onClick={() => setHealthSimulationMode('ALL_FAILED')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                healthSimMode === 'ALL_FAILED'
                  ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-900">通讯大面积中断仿真</span>
                {healthSimMode === 'ALL_FAILED' && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                模拟工业总线故障，检验端侧离线暂存与安全熔断
              </p>
            </button>
          </div>
        </div>
      )}

      {/* 6 大核心微服务与数据链路卡片列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {healthItems.map((item) => {
          const isHealthy = item.status === 'HEALTHY';
          const isDegraded = item.status === 'DEGRADED';
          const isError = item.status === 'ERROR';

          const cardBorder = isHealthy
            ? 'border-slate-200 hover:border-emerald-300'
            : isDegraded
            ? 'border-amber-300 bg-amber-50/20'
            : 'border-rose-300 bg-rose-50/20';

          return (
            <div
              key={item.id}
              className={`bg-white p-5 rounded-2xl border shadow-xs transition-all flex flex-col justify-between ${cardBorder}`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                      <span className="text-[11px] font-mono text-slate-400">{item.id}</span>
                    </div>
                  </div>

                  <div>
                    {isHealthy && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        健康运行
                      </span>
                    )}
                    {isDegraded && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        受控降级
                      </span>
                    )}
                    {isError && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                        异常中断
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">{item.description}</p>

                {item.abnormalImpact && (
                  <div className="mt-3 p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                    <span className="font-semibold block text-amber-950">降级影响与保护机制：</span>
                    <p className="text-[11px] text-amber-800 leading-relaxed">{item.abnormalImpact}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>探针响应延迟:</span>
                  <span className="font-mono font-bold text-slate-800">{item.latencyMs} ms</span>
                </div>

                <div className="font-mono text-[11px] text-slate-400">
                  自检时间: {item.lastChecked.slice(-8)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
