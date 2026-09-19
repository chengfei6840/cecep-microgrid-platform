import { PlatformHealthItem, ScenarioType } from '../types/domain';

export type HealthSimulationMode = 'AUTO' | 'ALL_HEALTHY' | 'PARTIAL_DEGRADED' | 'ALL_FAILED';

export function calculatePlatformHealth(
  scenario: ScenarioType,
  agentDegradedMode: boolean,
  healthSimMode: HealthSimulationMode,
  lastCheckedTime: string
): PlatformHealthItem[] {
  // 1. 全部模拟服务失败模式
  if (healthSimMode === 'ALL_FAILED') {
    return [
      {
        id: 'HLT-FE',
        name: '前端 Web Client 运行环境 (React 18 + Vite)',
        category: 'FRONTEND',
        status: 'ERROR',
        latencyMs: 2450,
        lastChecked: lastCheckedTime,
        description: '页面主线程异常挂起，资源跨域或网络拒绝连接。',
        abnormalImpact: '前端界面交互迟钝，路由拦截器可能出现非预期回退。',
      },
      {
        id: 'HLT-GW',
        name: '统一模拟 API 网关 (Mock Ingress Engine)',
        category: 'GATEWAY',
        status: 'ERROR',
        latencyMs: 5000,
        lastChecked: lastCheckedTime,
        description: '网关模拟服务不可达 (504 Gateway Timeout)，心跳探测失败。',
        abnormalImpact: '全站业务数据请求被挂起，无法获取实时遥测。',
      },
      {
        id: 'HLT-STG',
        name: 'LocalStorage 客户端状态持久化存储',
        category: 'STORAGE',
        status: 'DEGRADED',
        latencyMs: 120,
        lastChecked: lastCheckedTime,
        description: '存储配额检测告警，I/O 写入延迟陡增。',
        abnormalImpact: '本地操作无法正常写入持久化层，刷新后部分变更可能丢失。',
      },
      {
        id: 'HLT-STRM',
        name: '实时功率流与指标推送管道 (SSE / Mock Stream)',
        category: 'STREAM',
        status: 'ERROR',
        latencyMs: 3800,
        lastChecked: lastCheckedTime,
        description: '长连接通道意外重置 (Connection Reset by Peer)。',
        abnormalImpact: '大屏与单站监控功率曲线停止更新，呈现数据冻结。',
      },
      {
        id: 'HLT-ADP',
        name: '工业物联五类物理适配器总线 (Modbus/MQTT/104/61850)',
        category: 'ADAPTER',
        status: 'ERROR',
        latencyMs: 5000,
        lastChecked: lastCheckedTime,
        description: '全站工业总线硬件通讯不可达，前置机网关掉电。',
        abnormalImpact: '逆变器、变流器、箱变及充电桩数据全部停采。',
      },
      {
        id: 'HLT-AGT',
        name: '策略辅助决策 Agent (Gemini / Decision Agent)',
        category: 'AGENT',
        status: 'ERROR',
        latencyMs: 5000,
        lastChecked: lastCheckedTime,
        description: 'Agent 推理服务完全不可用 (Service Unavailable)。',
        abnormalImpact: '【安全隔离保护】Agent 异常只触发降级，不使基础业务停摆。系统已切入本地规则兜底。',
      },
    ];
  }

  // 2. 全量健康模式
  if (healthSimMode === 'ALL_HEALTHY') {
    return [
      {
        id: 'HLT-FE',
        name: '前端 Web Client 运行环境 (React 18 + Vite)',
        category: 'FRONTEND',
        status: 'HEALTHY',
        latencyMs: 2,
        lastChecked: lastCheckedTime,
        description: '单页路由与状态机运行正常，虚拟 DOM 渲染耗时 < 5ms，无未捕获异常。',
      },
      {
        id: 'HLT-GW',
        name: '统一模拟 API 网关 (Mock Ingress Engine)',
        category: 'GATEWAY',
        status: 'HEALTHY',
        latencyMs: 15,
        lastChecked: lastCheckedTime,
        description: '模拟网关服务可用率 100%，请求分发延迟正常，响应头安全合规。',
      },
      {
        id: 'HLT-STG',
        name: 'LocalStorage 客户端状态持久化存储',
        category: 'STORAGE',
        status: 'HEALTHY',
        latencyMs: 1,
        lastChecked: lastCheckedTime,
        description: '配额占用 236 KB / 5120 KB (4.6%)，CRC32 一致性校验通过，无溢出风险。',
      },
      {
        id: 'HLT-STRM',
        name: '实时功率流与指标推送管道 (SSE / Mock Stream)',
        category: 'STREAM',
        status: 'HEALTHY',
        latencyMs: 8,
        lastChecked: lastCheckedTime,
        description: '全双工实时流推送正常，心跳周期 1000ms，帧丢失率 0.00%。',
      },
      {
        id: 'HLT-ADP',
        name: '工业物联五类物理适配器总线 (Modbus/MQTT/104/61850)',
        category: 'ADAPTER',
        status: 'HEALTHY',
        latencyMs: 18,
        lastChecked: lastCheckedTime,
        description: '5 类适配器（光伏 MQTT、储能 Modbus、箱变 61850、充电桩 104、气象 485）通讯全绿。',
      },
      {
        id: 'HLT-AGT',
        name: '策略辅助决策 Agent (Gemini / Decision Agent)',
        category: 'AGENT',
        status: 'HEALTHY',
        latencyMs: 142,
        lastChecked: lastCheckedTime,
        description: 'AI 策略建议模型响应延迟 < 200ms，推理上下文正常，事件置信度达标。',
      },
    ];
  }

  // 3. 自动联动 / 部分降级模式
  const isStorageCommFailing = scenario === 'SCENARIO_B' || healthSimMode === 'PARTIAL_DEGRADED';
  const isAgentDegraded = agentDegradedMode || healthSimMode === 'PARTIAL_DEGRADED';

  return [
    {
      id: 'HLT-FE',
      name: '前端 Web Client 运行环境 (React 18 + Vite)',
      category: 'FRONTEND',
      status: 'HEALTHY',
      latencyMs: 3,
      lastChecked: lastCheckedTime,
      description: '单页路由守卫与 UI 渲染正常，内存占用 38MB，无死循环或内存泄露。',
    },
    {
      id: 'HLT-GW',
      name: '统一模拟 API 网关 (Mock Ingress Engine)',
      category: 'GATEWAY',
      status: 'HEALTHY',
      latencyMs: 14,
      lastChecked: lastCheckedTime,
      description: '模拟 API 路由分发就绪，拦截器正常记录 TraceId 审计链路。',
    },
    {
      id: 'HLT-STG',
      name: 'LocalStorage 客户端状态持久化存储',
      category: 'STORAGE',
      status: 'HEALTHY',
      latencyMs: 2,
      lastChecked: lastCheckedTime,
      description: '配额占用 248 KB / 5120 KB (4.8%)，无读写阻塞。',
    },
    {
      id: 'HLT-STRM',
      name: '实时功率流与指标推送管道 (SSE / Mock Stream)',
      category: 'STREAM',
      status: 'HEALTHY',
      latencyMs: 11,
      lastChecked: lastCheckedTime,
      description: '模拟实时推送管道在线，光储充母线 1s 周期流向帧保持活跃。',
    },
    {
      id: 'HLT-ADP',
      name: '工业物联五类物理适配器总线 (Modbus/MQTT/104/61850)',
      category: 'ADAPTER',
      status: isStorageCommFailing ? 'DEGRADED' : 'HEALTHY',
      latencyMs: isStorageCommFailing ? 1850 : 22,
      lastChecked: lastCheckedTime,
      description: isStorageCommFailing
        ? '5 类适配器中 4 类正常，1 类异常：时代星云储能 EMS (Modbus/TCP) 连续 3 次超时断连。'
        : '5 类物理适配器全部处于健康同步中（光伏逆变器、储能系统、箱变高压、充电桩群、微气象仪）。',
      abnormalImpact: isStorageCommFailing
        ? '储能充放电实时数据中断，触发一级通信告警与特巡整改工单，昨日收益结算置信度下浮至 71.4%。'
        : undefined,
    },
    {
      id: 'HLT-AGT',
      name: '策略辅助决策 Agent (Gemini / Decision Agent)',
      category: 'AGENT',
      status: isAgentDegraded ? 'DEGRADED' : 'HEALTHY',
      latencyMs: isAgentDegraded ? 85 : 156,
      lastChecked: lastCheckedTime,
      description: isAgentDegraded
        ? 'Agent 服务当前处于【规则专家安全降级模式】（主动切换或熔断触发）。'
        : 'Agent 推理通道正常，实时监听告警事件并生成可信闭环处置建议。',
      abnormalImpact: isAgentDegraded
        ? '【安全隔离保护】Agent 异常只触发降级，不使基础业务停摆。系统已切入本地专家规则，SCADA 实时遥测、分时电价核算、人工工单处理完全正常运行。'
        : undefined,
    },
  ];
}
