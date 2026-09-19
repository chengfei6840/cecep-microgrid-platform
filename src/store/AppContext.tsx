/**
 * 中节能低碳园区微电网数字化平台 - 集中式状态容器
 * 严格遵循规范：
 * - 禁止在页面组件内部复制站点、KPI、告警、收益或设备常量
 * - localStorage 持久化与一键重置
 * - 场景 A (正常运营) 与 场景 B (储能 EMS 异常闭环) 平滑切换
 * - 审计日志全流程自动记录 (traceId、角色、旧状态、新状态、原因)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserRole,
  User,
  Site,
  SiteTelemetry,
  IntegrationAdapter,
  Device,
  Point,
  Metric,
  DataQualityIssue,
  TariffScheme,
  TariffVersion,
  RevenueSnapshot,
  RecalculationBatch,
  Alarm,
  AgentEvent,
  PatrolPlan,
  PatrolTask,
  PatrolRecord,
  WorkOrder,
  AuditLog,
  ReportItem,
  ReportType,
  PlatformHealthItem,
} from '../types/domain';
import {
  MOCK_SITE,
  MOCK_SITES,
  MOCK_USERS,
  MOCK_TARIFF_SCHEME,
  MOCK_TARIFF_SCHEMES,
  MOCK_REPORTS,
  MOCK_PATROL_PLANS,
  MOCK_PATROL_RECORDS,
  DEFAULT_ROLE_PERMISSIONS,
  getScenarioAState,
  getScenarioBState,
} from './scenarioData';
import { MockService, MockResultMode } from '../services/mockService';
import { calculatePlatformHealth, HealthSimulationMode } from '../utils/healthDiagnostics';

const STORAGE_KEY = 'cecep_microgrid_state_v2';
const SESSION_AUTH_KEY = 'cecep_microgrid_session_auth';

export type ScenarioType = 'SCENARIO_A' | 'SCENARIO_B';

export interface AppContextType {
  // 基础会话与全局状态控制
  isAuthenticated: boolean;
  login: (role: UserRole) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isSessionExpired: boolean;
  simulateSessionExpiry: () => void;
  dismissSessionExpiry: () => void;
  currentRole: UserRole;
  currentUser: User;
  switchRole: (role: UserRole) => void;
  scenario: ScenarioType;
  switchScenario: (type: ScenarioType) => void;
  resetDemoData: () => void;
  mockMode: MockResultMode;
  setMockMode: (mode: MockResultMode) => void;

  // 核心领域实体
  site: Site;
  telemetry: SiteTelemetry;
  adapters: IntegrationAdapter[];
  devices: Device[];
  points: Point[];
  qualityIssues: DataQualityIssue[];
  tariffScheme: TariffScheme;
  tariffSchemes: TariffScheme[];
  revenueSnapshots: RevenueSnapshot[];
  recalcBatches: RecalculationBatch[];
  alarms: Alarm[];
  agentEvents: AgentEvent[];
  patrolPlans: PatrolPlan[];
  patrolTasks: PatrolTask[];
  patrolRecords: PatrolRecord[];
  workOrders: WorkOrder[];
  auditLogs: AuditLog[];
  reports: ReportItem[];
  metrics: Metric[];
  sites: Site[];

  // 业务动作与状态机触发器
  updateSite: (siteData: Partial<Site>) => void;
  addSite: (siteData: Omit<Site, 'id'>) => string;
  switchSite: (siteId: string) => void;
  deleteSite: (siteId: string) => void;
  updateTariffScheme: (schemeId: string, updates: Partial<TariffScheme>) => void;
  updateDevice: (deviceId: string, data: Partial<Device>) => void;
  updatePoint: (pointId: string, data: Partial<Point>) => void;
  disablePoint: (pointId: string) => void;
  disableDevice: (deviceId: string) => void;
  updateMetric: (metricId: string, data: Partial<Metric>) => void;
  addDevice: (deviceData: Omit<Device, 'id'>) => string;
  deleteDevice: (deviceId: string) => void;
  addPoint: (pointData: Omit<Point, 'id'>) => string;
  deletePoint: (pointId: string) => void;
  addMetric: (metricData: Omit<Metric, 'id'>) => string;
  deleteMetric: (metricId: string) => void;
  batchImportPoints: (importedPoints: Partial<Point>[]) => { success: boolean; errors: string[]; importedCount: number };
  addAuditLog: (entry: {
    targetObject: string;
    action: string;
    oldState: string;
    newState: string;
    reason: string;
    role?: UserRole;
    operatorName?: string;
    result?: 'SUCCESS' | 'REJECTED' | 'BLOCKED';
    sourcePage?: string;
    relatedVersion?: string;
    traceId?: string;
  }) => string;

  // 1. 电价状态机 (支持按站点 Scheme 隔离操作)
  authorizeTariffVersion: (versionId: string, targetSchemeId?: string) => Promise<{ success: boolean; message: string }>;
  rejectTariffVersion: (versionId: string, reason: string, targetSchemeId?: string) => Promise<{ success: boolean; message: string }>;
  createTariffDraft: (draftData?: Partial<TariffVersion>, targetSchemeId?: string) => Promise<{ success: boolean; message: string; versionId?: string }>;
  updateTariffVersion: (versionId: string, updates: Partial<TariffVersion>, targetSchemeId?: string) => Promise<{ success: boolean; message: string }>;
  submitTariffVersion: (versionId: string, targetSchemeId?: string) => Promise<{ success: boolean; message: string }>;
  deleteTariffVersion: (versionId: string, targetSchemeId?: string) => Promise<{ success: boolean; message: string }>;

  // 2. 适配器与数据接入状态机
  verifyAdapter: (adapterId: string) => Promise<{ success: boolean; message: string }>;
  retryAdapter: (adapterId: string) => Promise<{ success: boolean; message: string }>;
  syncAdapter: (adapterId: string) => Promise<{ success: boolean; message: string; traceId: string }>;

  // 3. 数据质量与补采
  resolveQualityIssue: (issueId: string, resolutionMode: 'AUTO_BACKFILL' | 'MANUAL_INTERVENTION') => Promise<{ success: boolean; message: string }>;

  // 4. 告警处置与工单派发
  ackAlarm: (alarmId: string, note?: string) => Promise<{ success: boolean; message: string }>;
  closeAlarm: (alarmId: string, actionTaken: string) => Promise<{ success: boolean; message: string }>;
  acknowledgeAlarm: (alarmId: string, note?: string) => Promise<{ success: boolean; message: string }>;
  resolveAlarm: (alarmId: string, actionTaken: string) => Promise<{ success: boolean; message: string }>;
  ignoreAlarm: (alarmId: string, type: 'IGNORED' | 'FALSE_ALARM', reason: string) => Promise<{ success: boolean; message: string }>;
  createWorkOrderFromAlarm: (alarmId: string, assignee: string, deadlineTime?: string, requirements?: string) => Promise<{ success: boolean; message: string; orderCode?: string }>;
  createPatrolTaskFromAlarm: (alarmId: string, assignee: string, deadlineTime?: string, route?: string) => Promise<{ success: boolean; message: string; taskCode?: string }>;

  // 5. Agent 决策流转
  agentDegradedMode: boolean;
  toggleAgentDegradedMode: () => void;
  adoptAgentEvent: (
    eventId: string,
    actionType: 'DISPATCH_PATROL' | 'DISPATCH_ORDER' | 'DEFER' | 'REJECT',
    note: string,
    extra?: { assignee?: string; deadline?: string }
  ) => Promise<{ success: boolean; message: string; taskId?: string; orderId?: string }>;
  archiveAgentEvent: (eventId: string, note?: string) => Promise<{ success: boolean; message: string }>;
  handleAgentDecision: (eventId: string, decision: 'ACCEPTED' | 'REJECTED') => Promise<{ success: boolean; message: string }>;

  // 6. 巡检计划编排与排程
  createPatrolPlan: (plan: Omit<PatrolPlan, 'id'>) => Promise<{ success: boolean; message: string; planId?: string }>;
  updatePatrolPlan: (planId: string, updates: Partial<PatrolPlan>) => Promise<{ success: boolean; message: string }>;
  togglePatrolPlanStatus: (planId: string) => Promise<{ success: boolean; message: string }>;
  cancelPatrolPlan: (planId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  generateTaskFromPlan: (planId: string) => Promise<{ success: boolean; message: string; taskCode?: string }>;

  // 7. 巡检任务执行、改派与离线同步
  createManualPatrolTask: (taskData: Partial<PatrolTask>) => Promise<{ success: boolean; message: string; taskCode?: string }>;
  acceptPatrolTask: (taskId: string) => Promise<{ success: boolean; message: string }>;
  reassignPatrolTask: (taskId: string, newAssignee: string, reason: string) => Promise<{ success: boolean; message: string }>;
  archivePatrolTask: (taskId: string) => Promise<{ success: boolean; message: string }>;
  convertTaskAnomalyToWorkOrder: (taskId: string, requirements?: string) => Promise<{ success: boolean; message: string; orderCode?: string }>;
  toggleTaskOffline: (taskId: string) => void;
  updateTaskProgress: (taskId: string, completedItems: number, hasAbnormal: boolean) => void;
  submitTask: (taskId: string) => Promise<{ success: boolean; message: string }>;
  executePatrolTask: (taskId: string, checkedItems?: any, remark?: string) => Promise<{ success: boolean; message: string }>;
  submitPatrolTask: (taskId: string, data?: any) => Promise<{ success: boolean; message: string }>;
  syncOfflineTask: (taskId: string) => Promise<{ success: boolean; message: string }>;

  // 8. 整改工单全流程与运营复核
  createWorkOrder: (orderData: Partial<WorkOrder>) => Promise<{ success: boolean; message: string; orderCode?: string }>;
  acceptWorkOrder: (orderId: string) => Promise<{ success: boolean; message: string }>;
  reassignWorkOrder: (orderId: string, newAssignee: string, reason: string) => Promise<{ success: boolean; message: string }>;
  submitWorkOrderResolution: (orderId: string, evidence: string) => Promise<{ success: boolean; message: string }>;
  reviewWorkOrder: (orderId: string, approved: boolean, note: string) => Promise<{ success: boolean; message: string }>;

  // 9. 收益重算与 V1/V2 归档
  initiateRevenueRecalculation: (reason: string) => Promise<{ success: boolean; message: string }>;

  // 10. 报表中心任务与生命周期管理
  addReport: (report: ReportItem) => void;
  deleteReport: (reportId: string) => void;
  generateReportItem: (params: {
    type: ReportType;
    period: string;
    title?: string;
    isFormalSettlement?: boolean;
    customNotes?: string;
  }) => Promise<{
    success: boolean;
    message: string;
    report?: ReportItem;
    blocked?: boolean;
    recoveryAdvice?: string;
  }>;

  // 11. 用户管理、角色权限矩阵与平台健康
  users: User[];
  rolePermissions: Record<UserRole, string[]>;
  healthItems: PlatformHealthItem[];
  healthCheckStatus: 'IDLE' | 'CHECKING';
  healthSimMode: HealthSimulationMode;
  lastHealthCheckedTime: string;

  addUser: (userData: Partial<User>) => Promise<{ success: boolean; message: string; user?: User }>;
  toggleUserStatus: (userId: string) => Promise<{
    success: boolean;
    message: string;
    blocked?: boolean;
    pendingTasks?: PatrolTask[];
    pendingOrders?: WorkOrder[];
    availableReassignees?: User[];
  }>;
  reassignUserTasksAndDeactivate: (
    userId: string,
    newAssigneeId: string,
    reason: string
  ) => Promise<{ success: boolean; message: string }>;
  resetUserPassword: (userId: string) => Promise<{ success: boolean; tempPasswordToken: string; message: string }>;

  updateRolePermission: (
    role: UserRole,
    permKey: string,
    enable: boolean
  ) => Promise<{ success: boolean; message?: string; conflict?: boolean; conflictReason?: string }>;
  hasPermission: (permKey: string, checkRole?: UserRole) => boolean;

  runHealthCheck: () => Promise<void>;
  setHealthSimulationMode: (mode: HealthSimulationMode) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. 初始化持久化状态
  const loadInitialState = () => {
    try {
      try {
        localStorage.removeItem('cecep_microgrid_state_v1');
        localStorage.removeItem('zz_dashboard_time_scope');
      } catch (e) {}

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const sanitized = saved
          .replace(/漳州/g, '')
          .replace(/漳/g, '')
          .replace(/ZZ-CECEP-001/g, 'CECEP-001')
          .replace(/ZZ-/g, '');
        const parsed = JSON.parse(sanitized);
        if (parsed.site) {
          parsed.site.name = (parsed.site.name || '低碳园区示范站').replace(/漳州/g, '').replace(/漳/g, '');
          parsed.site.code = (parsed.site.code || 'CECEP-001').replace(/ZZ-/g, '');
        }
        if (Array.isArray(parsed.sites)) {
          parsed.sites.forEach((s: any) => {
            if (s.name) s.name = s.name.replace(/漳州/g, '').replace(/漳/g, '');
            if (s.code) s.code = s.code.replace(/ZZ-/g, '');
          });
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved state from localStorage:', e);
    }
    return null;
  };

  const initialSaved = loadInitialState();

  const [scenario, setScenario] = useState<ScenarioType>(initialSaved?.scenario || 'SCENARIO_A');
  const [currentRole, setCurrentRole] = useState<UserRole>(initialSaved?.currentRole || 'OPERATOR');
  const [mockMode, setMockModeState] = useState<MockResultMode>(initialSaved?.mockMode || 'SUCCESS');

  // 认证与用户会话管理
  const initialAuth = () => {
    try {
      const sessionVal = localStorage.getItem(SESSION_AUTH_KEY);
      if (sessionVal !== null) {
        return sessionVal === 'true';
      }
    } catch (e) {}
    return Boolean(initialSaved?.isAuthenticated);
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuth);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);

  // 初始数据载入
  const baseSeed = initialSaved?.scenario === 'SCENARIO_B' ? getScenarioBState() : getScenarioAState();

  const sanitizeSite = (s: Site): Site => ({
    ...s,
    name: (s.name || '低碳园区示范站').replace(/漳州/g, '').replace(/漳/g, ''),
    code: (s.code || 'CECEP-001').replace(/ZZ-/g, ''),
  });

  // 多站点初始载入：合并历史保存站点与系统默认多站点，确保三站齐全
  const rawSites: Site[] = (() => {
    const saved = initialSaved?.sites || (initialSaved?.site ? [initialSaved.site] : []);
    const merged = [...saved];
    MOCK_SITES.forEach((ms) => {
      if (!merged.some((s) => s.id === ms.id)) {
        merged.push(ms);
      }
    });
    return merged.length > 0 ? merged : MOCK_SITES;
  })();

  const [sites, setSites] = useState<Site[]>(rawSites.map(sanitizeSite));
  const [site, setSiteState] = useState<Site>(() => {
    const target = initialSaved?.site ? sanitizeSite(initialSaved.site) : sites[0] || MOCK_SITE;
    return target;
  });

  const setSite = (newSite: Site | ((prev: Site) => Site)) => {
    setSiteState((prev) => {
      const resolved = typeof newSite === 'function' ? newSite(prev) : newSite;
      return sanitizeSite(resolved);
    });
  };

  const [adapters, setAdapters] = useState<IntegrationAdapter[]>(initialSaved?.adapters || baseSeed.adapters);
  const [devices, setDevices] = useState<Device[]>(initialSaved?.devices || baseSeed.devices);
  const [points, setPoints] = useState<Point[]>(initialSaved?.points || baseSeed.points);
  const [qualityIssues, setQualityIssues] = useState<DataQualityIssue[]>(initialSaved?.qualityIssues || baseSeed.qualityIssues);

  // 多站点专属电价方案初始载入
  const [tariffSchemes, setTariffSchemes] = useState<TariffScheme[]>(() => {
    const savedSchemes: TariffScheme[] = initialSaved?.tariffSchemes || (initialSaved?.tariffScheme ? [initialSaved.tariffScheme] : []);
    const mergedSchemes = [...savedSchemes];
    MOCK_TARIFF_SCHEMES.forEach((ms) => {
      const idx = mergedSchemes.findIndex((s) => s.id === ms.id || s.siteId === ms.siteId);
      if (idx === -1) {
        mergedSchemes.push(ms);
      }
    });
    return mergedSchemes.length > 0 ? mergedSchemes : MOCK_TARIFF_SCHEMES;
  });

  // 当前激活站点的电价方案
  const [tariffScheme, setTariffSchemeState] = useState<TariffScheme>(() => {
    const found = tariffSchemes.find((ts) => ts.siteId === site.id) || tariffSchemes[0] || MOCK_TARIFF_SCHEME;
    return found;
  });

  // 更新当前方案同时保持 tariffSchemes 同步
  const setTariffScheme = (newScheme: TariffScheme | ((prev: TariffScheme) => TariffScheme)) => {
    setTariffSchemeState((prev) => {
      const resolved = typeof newScheme === 'function' ? newScheme(prev) : newScheme;
      setTariffSchemes((all) => {
        const index = all.findIndex((s) => s.id === resolved.id || s.siteId === resolved.siteId);
        if (index >= 0) {
          const updated = [...all];
          updated[index] = resolved;
          return updated;
        }
        return [...all, resolved];
      });
      return resolved;
    });
  };

  // 站点属性或配置方案更新
  const updateTariffScheme = (schemeId: string, updates: Partial<TariffScheme>) => {
    setTariffSchemes((prev) =>
      prev.map((s) => (s.id === schemeId ? { ...s, ...updates } : s))
    );
    setTariffSchemeState((prev) => (prev.id === schemeId ? { ...prev, ...updates } : prev));
  };
  const [revenueSnapshots, setRevenueSnapshots] = useState<RevenueSnapshot[]>(initialSaved?.revenueSnapshots || baseSeed.revenueSnapshots);
  const [recalcBatches, setRecalcBatches] = useState<RecalculationBatch[]>(initialSaved?.recalcBatches || baseSeed.recalcBatches);
  const [alarms, setAlarms] = useState<Alarm[]>(initialSaved?.alarms || baseSeed.alarms);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>(initialSaved?.agentEvents || baseSeed.agentEvents);
  const [agentDegradedMode, setAgentDegradedMode] = useState<boolean>(
    initialSaved?.agentDegradedMode !== undefined ? initialSaved.agentDegradedMode : false
  );
  const toggleAgentDegradedMode = () => {
    setAgentDegradedMode((prev) => {
      const next = !prev;
      addAuditLog({
        targetObject: 'Agent Hub 引擎状态',
        action: next ? '开启 Agent 降级模式' : '恢复 Agent 正常模式',
        oldState: prev ? 'DEGRADED' : 'NORMAL',
        newState: next ? 'DEGRADED' : 'NORMAL',
        reason: next
          ? '手动触发降级模式：保留规则证据与模板摘要，隐藏 AI 扩展研判'
          : '恢复正常运行：恢复大模型辅助诊断摘要与置信度推理',
      });
      return next;
    });
  };
  const [patrolPlans, setPatrolPlans] = useState<PatrolPlan[]>(initialSaved?.patrolPlans || baseSeed.patrolPlans || MOCK_PATROL_PLANS);
  const [patrolTasks, setPatrolTasks] = useState<PatrolTask[]>(initialSaved?.patrolTasks || baseSeed.patrolTasks);
  const [patrolRecords, setPatrolRecords] = useState<PatrolRecord[]>(initialSaved?.patrolRecords || baseSeed.patrolRecords || MOCK_PATROL_RECORDS);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialSaved?.workOrders || baseSeed.workOrders);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialSaved?.auditLogs || baseSeed.auditLogs);
  const sanitizeReportItem = (r: any): ReportItem => {
    return {
      ...r,
      id: r.id || `RPT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      reportCode: r.reportCode || `RPT-${r.id || Date.now()}`,
      title: r.title || '示范站综合运营报表',
      type: r.type || 'DAILY_OPERATION',
      period: r.period || '2026-09-04',
      generatedTime: r.generatedTime || '2026-09-05 01:15:00',
      author: r.author || '陈若涵 (运营主管)',
      status: r.status || 'COMPLETED',
      summary: r.summary || '全站微电网能效与经济数据核算正常。',
      fileSize: r.fileSize || '1.45 MB',
      siteId: r.siteId || 'SITE-001',
      siteName: r.siteName || '低碳园区示范站',
      version: r.version || 'V1.0',
      tariffVersion: r.tariffVersion || 'V1.0',
      revenueType: r.revenueType || 'SETTLEMENT',
      isSettlementFormal: Boolean(r.isSettlementFormal),
      hasRiskWarning: Boolean(r.hasRiskWarning),
      dataConfidencePercent:
        typeof r.dataConfidencePercent === 'number'
          ? r.dataConfidencePercent
          : 99.2,
      qualityLevel: r.qualityLevel || 'NORMAL',
      traceId: r.traceId || `TR-RPT-${Date.now()}`,
      payload: r.payload || {},
      versions: Array.isArray(r.versions) && r.versions.length > 0 ? r.versions : [
        {
          version: r.version || 'V1.0',
          generatedTime: r.generatedTime || '2026-09-05 01:15:00',
          author: r.author || '陈若涵 (运营主管)',
          tariffVersion: r.tariffVersion || 'V1.0',
          dataConfidencePercent: typeof r.dataConfidencePercent === 'number' ? r.dataConfidencePercent : 99.2,
          qualityFlag: r.qualityLevel || 'NORMAL',
          changeReason: '首次归档',
          fileSize: r.fileSize || '1.45 MB',
          traceId: r.traceId || `TR-RPT-${Date.now()}`,
        }
      ],
    };
  };

  const [reports, setReports] = useState<ReportItem[]>(() => {
    if (Array.isArray(initialSaved?.reports) && initialSaved.reports.length > 0) {
      return initialSaved.reports.map(sanitizeReportItem);
    }
    return MOCK_REPORTS.map(sanitizeReportItem);
  });

  // 系统用户列表状态
  const [users, setUsers] = useState<User[]>(initialSaved?.users || MOCK_USERS);

  // 角色权限矩阵状态 (支持调整菜单与按钮权限)
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, string[]>>(
    initialSaved?.rolePermissions || DEFAULT_ROLE_PERMISSIONS
  );

  // 平台健康诊断仿真模式与状态
  const [healthSimMode, setHealthSimMode] = useState<HealthSimulationMode>(
    initialSaved?.healthSimMode || 'AUTO'
  );
  const [healthCheckStatus, setHealthCheckStatus] = useState<'IDLE' | 'CHECKING'>('IDLE');
  const [lastHealthCheckedTime, setLastHealthCheckedTime] = useState<string>(
    initialSaved?.lastHealthCheckedTime || '2026-09-05 06:00:00'
  );

  const DEFAULT_METRICS: Metric[] = [
    {
      id: 'METRIC-01',
      siteId: 'SITE-001',
      name: '光伏总有功功率',
      code: 'PV_ACTIVE_POWER',
      calculationLogic: 'SUM(inverter.active_power) * 1.0',
      aggregationPeriod: 'REALTIME',
      unit: 'kW',
      allowedQualityGrade: ['NORMAL', 'PATCHED'],
      downstreamUsage: ['光伏发电监测卡', '实时收益核算', '综合日报表'],
      status: 'ACTIVE',
    },
    {
      id: 'METRIC-02',
      siteId: 'SITE-001',
      name: '储能系统综合SOC',
      code: 'ESS_SOC_AVG',
      calculationLogic: 'AVG(battery_cluster.soc)',
      aggregationPeriod: '5MIN',
      unit: '%',
      allowedQualityGrade: ['NORMAL'],
      downstreamUsage: ['储能系统监测卡', '峰谷套利收益评估', '调度优化策略'],
      status: 'ACTIVE',
    },
    {
      id: 'METRIC-03',
      siteId: 'SITE-001',
      name: '园区充电桩群总负荷',
      code: 'EV_TOTAL_LOAD',
      calculationLogic: 'SUM(charger.power_active)',
      aggregationPeriod: 'REALTIME',
      unit: 'kW',
      allowedQualityGrade: ['NORMAL', 'PATCHED'],
      downstreamUsage: ['充电桩群监测卡', '有序充电控制策略', '电网负荷与气象卡'],
      status: 'ACTIVE',
    },
    {
      id: 'METRIC-04',
      siteId: 'SITE-001',
      name: '10kV网侧关口总有功功率',
      code: 'GRID_ACTIVE_POWER',
      calculationLogic: 'smart_meter.active_power_total',
      aggregationPeriod: 'REALTIME',
      unit: 'kW',
      allowedQualityGrade: ['NORMAL'],
      downstreamUsage: ['电网负荷与气象卡', '主变负载率评估', '总收益对账表'],
      status: 'ACTIVE',
    },
  ];

  const [metrics, setMetrics] = useState<Metric[]>(initialSaved?.metrics || DEFAULT_METRICS);

  const updateSite = (siteData: Partial<Site>) => {
    // @ts-ignore
    const updated = { ...site, ...siteData, updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }) };
    setSite(updated);
    setSites((prev) => prev.map((s) => (s.id === site.id ? updated : s)));
    addAuditLog({
      targetObject: `站点档案 (${site.id})`,
      action: '修改站点基础档案',
      oldState: JSON.stringify(site),
      newState: JSON.stringify(updated),
      reason: '管理员更新站点物理档案',
    });
  };

  const addSite = (siteData: Omit<Site, 'id'>) => {
    const newId = `SITE-${Date.now()}`;
    const newSite: Site = {
      ...siteData,
      id: newId,
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    };
    setSites((prev) => [...prev, newSite]);
    setSite(newSite);
    addAuditLog({
      targetObject: `园区站点 (${newId})`,
      action: '新增试点站点',
      oldState: '无',
      newState: JSON.stringify(newSite),
      reason: '管理员新增多能互补低碳园区试点站点',
    });
    return newId;
  };

  const switchSite = (siteId: string) => {
    const target = sites.find((s) => s.id === siteId);
    if (target) {
      setSite(target);
      // 联动切换该站点对应的电价方案
      const targetScheme = tariffSchemes.find((ts) => ts.siteId === siteId);
      if (targetScheme) {
        setTariffScheme(targetScheme);
      }
      addAuditLog({
        targetObject: `园区站点 (${siteId} - ${target.name})`,
        action: '切换当前激活站点',
        oldState: site.id,
        newState: siteId,
        reason: `用户切换当前工作站点上下文至【${target.name}】，联动加载站点专属电价方案【${targetScheme?.name || '默认方案'}】`,
      });
    }
  };

  const deleteSite = (siteId: string) => {
    if (sites.length <= 1) {
      alert('必须保留至少一个试点站点！');
      return;
    }
    const target = sites.find((s) => s.id === siteId);
    const remaining = sites.filter((s) => s.id !== siteId);
    setSites(remaining);
    if (site.id === siteId) {
      setSite(remaining[0]);
    }
    addAuditLog({
      targetObject: `园区站点 (${siteId})`,
      action: '删除试点站点',
      oldState: JSON.stringify(target || {}),
      newState: '已删除',
      reason: '管理员物理删除多能互补试点站点',
    });
  };

  const updateDevice = (deviceId: string, data: Partial<Device>) => {
    setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, ...data } : d)));
    addAuditLog({
      targetObject: `设备档案 (${deviceId})`,
      action: '更新设备配置',
      oldState: JSON.stringify(devices.find((d) => d.id === deviceId)),
      newState: JSON.stringify(data),
      reason: '管理员更新设备参数与来源平台映射',
    });
  };

  const updatePoint = (pointId: string, data: Partial<Point>) => {
    setPoints((prev) => prev.map((p) => (p.id === pointId ? { ...p, ...data, lastUpdated: new Date().toLocaleString('zh-CN', { hour12: false }) } : p)));
    addAuditLog({
      targetObject: `点位测点 (${pointId})`,
      action: '更新测点映射与量程',
      oldState: JSON.stringify(points.find((p) => p.id === pointId)),
      newState: JSON.stringify(data),
      reason: '管理员更新测点字典及第三方字段映射',
    });
  };

  const disablePoint = (pointId: string) => {
    setPoints((prev) => prev.map((p) => (p.id === pointId ? { ...p, status: 'DISABLED', mappingStatus: 'UNMAPPED' } : p)));
    addAuditLog({
      targetObject: `点位测点 (${pointId})`,
      action: '停用测点 (逻辑删除)',
      oldState: 'ACTIVE / MAPPED',
      newState: 'DISABLED / UNMAPPED',
      reason: '管理员停用测点，提示下游监测与收益置信度更新',
    });
  };

  const disableDevice = (deviceId: string) => {
    setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, status: 'DISABLED' } : d)));
    addAuditLog({
      targetObject: `设备档案 (${deviceId})`,
      action: '停用设备资产',
      oldState: 'NORMAL / ALARM',
      newState: 'DISABLED',
      reason: '管理员停用设备资产，相关点位自动置为未就绪',
    });
  };

  const updateMetric = (metricId: string, data: Partial<Metric>) => {
    setMetrics((prev) => prev.map((m) => (m.id === metricId ? { ...m, ...data } : m)));
    addAuditLog({
      targetObject: `指标字典 (${metricId})`,
      action: '修改指标计算口径',
      oldState: JSON.stringify(metrics.find((m) => m.id === metricId)),
      newState: JSON.stringify(data),
      reason: '管理员更新标准指标口径，影响下游监测卡与收益字段',
    });
  };

  const batchImportPoints = (importedPoints: Partial<Point>[]) => {
    const errors: string[] = [];
    const existingCodes = new Set(points.map((p) => p.standardCode));
    const validDeviceIds = new Set(devices.map((d) => d.id));

    let importedCount = 0;
    const newPointsList = [...points];

    importedPoints.forEach((ip, idx) => {
      if (!ip.standardCode) {
        errors.push(`第 ${idx + 1} 行: 缺少标准编码 (standardCode)`);
        return;
      }
      if (existingCodes.has(ip.standardCode)) {
        errors.push(`第 ${idx + 1} 行: 标准编码 "${ip.standardCode}" 重复已存在`);
        return;
      }
      if (!ip.deviceId || !validDeviceIds.has(ip.deviceId)) {
        errors.push(`第 ${idx + 1} 行: 关联设备 "${ip.deviceId || '空'}" 不存在或无效`);
        return;
      }
      if (!ip.unit || !['kW', 'kWh', 'V', 'A', '℃', '%', 'kW·h', 'kW/h'].includes(ip.unit)) {
        errors.push(`第 ${idx + 1} 行: 未知或非法单位 "${ip.unit}"`);
        return;
      }

      existingCodes.add(ip.standardCode);
      newPointsList.push({
        id: `PT-IMP-${Date.now()}-${idx}`,
        deviceId: ip.deviceId,
        pointName: ip.pointName || '批量导入测点',
        standardCode: ip.standardCode,
        thirdPartyField: ip.thirdPartyField || 'modbus.tag_' + idx,
        unit: ip.unit,
        dataType: ip.dataType || 'FLOAT',
        lowerLimit: ip.lowerLimit ?? 0,
        upperLimit: ip.upperLimit ?? 1000,
        mappingStatus: 'MAPPED',
        currentQuality: 'NORMAL',
        currentValue: 100.0,
        lastUpdated: new Date().toLocaleString('zh-CN', { hour12: false }),
        status: 'ACTIVE',
      });
      importedCount++;
    });

    if (errors.length === 0 && importedCount > 0) {
      setPoints(newPointsList);
      addAuditLog({
        targetObject: '测点字典批量导入',
        action: '批量导入测点',
        oldState: `共 ${points.length} 个点位`,
        newState: `成功导入 ${importedCount} 个点位`,
        reason: '管理员通过批量导入模板导入测点',
      });
      return { success: true, errors: [], importedCount };
    }
    return { success: false, errors, importedCount: 0 };
  };
  const addDevice = (deviceData: Omit<Device, 'id'>) => {
    const newId = `DEV-${Date.now()}`;
    const newDev: Device = { ...deviceData, id: newId };
    setDevices((prev) => [...prev, newDev]);
    addAuditLog({
      targetObject: `设备档案 (${newId})`,
      action: '新增设备资产',
      oldState: '无',
      newState: JSON.stringify(newDev),
      reason: '管理员新增物理设备',
    });
    return newId;
  };

  const deleteDevice = (deviceId: string) => {
    const target = devices.find((d) => d.id === deviceId);
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    setPoints((prev) => prev.filter((p) => p.deviceId !== deviceId));
    addAuditLog({
      targetObject: `设备档案 (${deviceId})`,
      action: '物理删除设备及下辖测点',
      oldState: JSON.stringify(target || {}),
      newState: '已删除',
      reason: '管理员物理删除设备及关联测点字典',
    });
  };

  const addPoint = (pointData: Omit<Point, 'id'>) => {
    const newId = `PT-${Date.now()}`;
    const newPt: Point = { ...pointData, id: newId, lastUpdated: new Date().toLocaleString('zh-CN', { hour12: false }) };
    setPoints((prev) => [...prev, newPt]);
    addAuditLog({
      targetObject: `测点字典 (${newId})`,
      action: '新增测点',
      oldState: '无',
      newState: JSON.stringify(newPt),
      reason: '管理员新增测点字典映射',
    });
    return newId;
  };

  const deletePoint = (pointId: string) => {
    const target = points.find((p) => p.id === pointId);
    setPoints((prev) => prev.filter((p) => p.id !== pointId));
    addAuditLog({
      targetObject: `测点字典 (${pointId})`,
      action: '物理删除测点',
      oldState: JSON.stringify(target || {}),
      newState: '已删除',
      reason: '管理员物理删除测点字典',
    });
  };

  const addMetric = (metricData: Omit<Metric, 'id'>) => {
    const newId = `METRIC-${Date.now()}`;
    const newMet: Metric = { ...metricData, id: newId };
    setMetrics((prev) => [...prev, newMet]);
    addAuditLog({
      targetObject: `指标字典 (${newId})`,
      action: '新增标准指标',
      oldState: '无',
      newState: JSON.stringify(newMet),
      reason: '管理员新增标准计算指标',
    });
    return newId;
  };

  const deleteMetric = (metricId: string) => {
    const target = metrics.find((m) => m.id === metricId);
    setMetrics((prev) => prev.filter((m) => m.id !== metricId));
    addAuditLog({
      targetObject: `指标字典 (${metricId})`,
      action: '物理删除标准指标',
      oldState: JSON.stringify(target || {}),
      newState: '已删除',
      reason: '管理员物理删除标准指标',
    });
  };

  const currentUser =
    users.find((u) => u.role === currentRole && u.status === 'ACTIVE') ||
    users.find((u) => u.role === currentRole) ||
    MOCK_USERS[1];

  // 平台微服务、适配器与数据链路健康状态集合
  const healthItems: PlatformHealthItem[] = useMemo(() => {
    return calculatePlatformHealth(scenario, agentDegradedMode, healthSimMode, lastHealthCheckedTime);
  }, [scenario, agentDegradedMode, healthSimMode, lastHealthCheckedTime]);

  // 站点实时指标与遥测聚合
  const telemetry: SiteTelemetry = useMemo(() => {
    if (scenario === 'SCENARIO_B') {
      return {
        pvActivePowerKw: 418.5,
        pvDailyYieldKwh: 2350.0,
        pvDailyGenKwh: 2350.0,
        storageSocPercent: 42.1,
        storagePowerKw: 0.0, // EMS通信中断或重试中，暂停削峰放电
        chargingLoadKw: 156.0,
        chargingDailyKwh: 890.0,
        gridPowerKw: 610.0,
        ambientTempC: 29.0,
        solarIrradiationWm2: 850,
      };
    }
    return {
      pvActivePowerKw: 432.8,
      pvDailyYieldKwh: 2480.0,
      pvDailyGenKwh: 2480.0,
      storageSocPercent: 78.5,
      storagePowerKw: -120.0, // 削峰放电中
      chargingLoadKw: 165.0,
      chargingDailyKwh: 920.0,
      gridPowerKw: 465.0,
      ambientTempC: 28.5,
      solarIrradiationWm2: 860,
    };
  }, [scenario]);

  const setMockMode = (mode: MockResultMode) => {
    setMockModeState(mode);
    MockService.setMode(mode);
  };

  // 持久化同步到 localStorage
  useEffect(() => {
    try {
      const stateToSave = {
        scenario,
        currentRole,
        mockMode,
        isAuthenticated,
        site,
        sites,
        adapters,
        devices,
        points,
        qualityIssues,
        tariffScheme,
        tariffSchemes,
        revenueSnapshots,
        recalcBatches,
        alarms,
        agentEvents,
        patrolPlans,
        patrolTasks,
        patrolRecords,
        workOrders,
        auditLogs,
        reports,
        metrics,
        users,
        rolePermissions,
        healthSimMode,
        lastHealthCheckedTime,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Error saving state to localStorage', e);
    }
  }, [
    scenario,
    currentRole,
    mockMode,
    isAuthenticated,
    site,
    sites,
    adapters,
    devices,
    points,
    qualityIssues,
    tariffScheme,
    tariffSchemes,
    revenueSnapshots,
    recalcBatches,
    alarms,
    agentEvents,
    patrolPlans,
    patrolTasks,
    patrolRecords,
    workOrders,
    auditLogs,
    reports,
    users,
    rolePermissions,
    healthSimMode,
    lastHealthCheckedTime,
  ]);

  // 审计日志追加器 (不可变日志，只追加不删除)
  const addAuditLog = useCallback(
    (entry: {
      targetObject: string;
      action: string;
      oldState: string;
      newState: string;
      reason: string;
      role?: UserRole;
      operatorName?: string;
      result?: 'SUCCESS' | 'REJECTED' | 'BLOCKED';
      sourcePage?: string;
      relatedVersion?: string;
      traceId?: string;
    }) => {
      const traceId = entry.traceId || MockService.generateTraceId('TR-AUDIT');
      const newLog: AuditLog = {
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
        role: entry.role || currentRole,
        operatorName: entry.operatorName || currentUser.name,
        targetObject: entry.targetObject,
        action: entry.action,
        oldState: entry.oldState,
        newState: entry.newState,
        reason: entry.reason,
        traceId,
        result: entry.result || 'SUCCESS',
        sourcePage: entry.sourcePage,
        relatedVersion: entry.relatedVersion,
      };
      setAuditLogs((prev) => [newLog, ...prev]);
      return traceId;
    },
    [currentRole, currentUser.name]
  );

  // 登录鉴权 (快捷账号)
  const login = async (role: UserRole): Promise<{ success: boolean; message?: string }> => {
    setIsAuthenticated(true);
    setIsSessionExpired(false);
    setCurrentRole(role);
    try {
      localStorage.setItem(SESSION_AUTH_KEY, 'true');
    } catch (e) {}

    const targetUser = MOCK_USERS.find((u) => u.role === role) || MOCK_USERS[0];
    addAuditLog({
      targetObject: '用户身份鉴权',
      action: '登录系统',
      oldState: '离线/未认证',
      newState: `${targetUser.roleTitle} (${targetUser.name}) 在线`,
      reason: '通过账号快捷授权登入',
      role,
      operatorName: targetUser.name,
    });
    return { success: true };
  };

  // 退出登录 (清理会话但不删除本地业务数据)
  const logout = () => {
    setIsAuthenticated(false);
    setIsSessionExpired(false);
    try {
      localStorage.setItem(SESSION_AUTH_KEY, 'false');
    } catch (e) {}

    addAuditLog({
      targetObject: '用户身份鉴权',
      action: '退出登录',
      oldState: `${currentUser.roleTitle} (${currentUser.name})`,
      newState: '已登出',
      reason: '用户主动退出登录会话，保留本地业务数据',
      role: currentRole,
      operatorName: currentUser.name,
    });
  };

  // 模拟会话过期
  const simulateSessionExpiry = () => {
    setIsSessionExpired(true);
  };

  // 确认或关闭会话过期提示
  const dismissSessionExpiry = () => {
    setIsSessionExpired(false);
    setIsAuthenticated(false);
    try {
      localStorage.setItem(SESSION_AUTH_KEY, 'false');
    } catch (e) {}
  };

  // 切换操作角色
  const switchRole = useCallback(
    (role: UserRole) => {
      setCurrentRole(role);
      addAuditLog({
        targetObject: '用户控制台会话',
        action: '切换操作角色',
        oldState: currentRole,
        newState: role,
        reason: '切换操作人身份以验证对应角色权限与工作流',
        role,
      });
    },
    [currentRole, addAuditLog]
  );

  // 切换运行场景
  const switchScenario = useCallback(
    (type: ScenarioType) => {
      setScenario(type);
      const newState = type === 'SCENARIO_B' ? getScenarioBState() : getScenarioAState();
      setAdapters(newState.adapters);
      setDevices(newState.devices);
      setPoints(newState.points);
      setQualityIssues(newState.qualityIssues);
      setRevenueSnapshots(newState.revenueSnapshots);
      setRecalcBatches(newState.recalcBatches);
      setAlarms(newState.alarms);
      setAgentEvents(newState.agentEvents);
      setPatrolPlans(newState.patrolPlans || MOCK_PATROL_PLANS);
      setPatrolTasks(newState.patrolTasks);
      setPatrolRecords(newState.patrolRecords || MOCK_PATROL_RECORDS);
      setWorkOrders(newState.workOrders);
      setAuditLogs((prev) => [
        {
          id: `LOG-SCENARIO-${Date.now()}`,
          timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
          role: currentRole,
          operatorName: currentUser.name,
          targetObject: '全局场景控制器',
          action: '切换业务场景',
          oldState: scenario,
          newState: type,
          reason:
            type === 'SCENARIO_B'
              ? '切换至场景 B【储能 EMS 异常闭环】：模拟断线告警→Agent决策→工单巡检→离线同步→历史补采→收益重算'
              : '切换至场景 A【正常运营】：各数据源在线，电价 V1.0 生效，昨日收益结算完成',
          traceId: MockService.generateTraceId('TR-SCENARIO'),
        },
        ...prev,
      ]);
    },
    [currentRole, currentUser.name, scenario]
  );

  // 重置运行数据
  const resetDemoData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    const initial = getScenarioAState();
    setScenario('SCENARIO_A');
    setCurrentRole('OPERATOR');
    setMockModeState('SUCCESS');
    MockService.setMode('SUCCESS');
    setAdapters(initial.adapters);
    setDevices(initial.devices);
    setPoints(initial.points);
    setQualityIssues(initial.qualityIssues);
    setSites(MOCK_SITES);
    setSite(MOCK_SITES[0]);
    setTariffSchemes(MOCK_TARIFF_SCHEMES);
    setTariffScheme(MOCK_TARIFF_SCHEMES[0]);
    setRevenueSnapshots(initial.revenueSnapshots);
    setRecalcBatches([]);
    setAlarms(initial.alarms);
    setAgentEvents(initial.agentEvents);
    setPatrolPlans(initial.patrolPlans || MOCK_PATROL_PLANS);
    setPatrolTasks(initial.patrolTasks);
    setPatrolRecords(initial.patrolRecords || MOCK_PATROL_RECORDS);
    setWorkOrders(initial.workOrders);
    setAuditLogs(initial.auditLogs);
    setReports(MOCK_REPORTS.map(sanitizeReportItem));
    setUsers(MOCK_USERS);
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    setHealthSimMode('AUTO');
    setLastHealthCheckedTime('2026-09-05 06:00:00');
  }, []);

  // 权限判断函数 (支持菜单与按钮级细粒度控制)
  const hasPermission = useCallback(
    (permKey: string, checkRole?: UserRole): boolean => {
      const targetRole = checkRole || currentRole;
      const perms = rolePermissions[targetRole] || [];
      return perms.includes(permKey);
    },
    [currentRole, rolePermissions]
  );

  // 角色权限矩阵动态更新 (带两票制三权分立互斥校验与审计跟踪)
  const updateRolePermission = async (
    role: UserRole,
    permKey: string,
    enable: boolean
  ): Promise<{ success: boolean; message?: string; conflict?: boolean; conflictReason?: string }> => {
    // 互斥校验：两票制三权分立
    // 同一角色严禁同时拥有【电价草稿编制与提交(tariff_submit)】与【电价二次授权审批(tariff_approve)】
    const currentPerms = rolePermissions[role] || [];
    if (enable) {
      if (permKey === 'tariff_approve' && currentPerms.includes('tariff_submit')) {
        return {
          success: false,
          conflict: true,
          conflictReason:
            '违反内部控制两票制三权分立原则：同一角色严禁同时拥有【电价草稿编制】与【电价二次授权审批】权限！必须由编制人与审批人岗位独立制衡。',
        };
      }
      if (permKey === 'tariff_submit' && currentPerms.includes('tariff_approve')) {
        return {
          success: false,
          conflict: true,
          conflictReason:
            '违反内部控制两票制三权分立原则：同一角色严禁同时拥有【电价草稿编制】与【电价二次授权审批】权限！必须由编制人与审批人岗位独立制衡。',
        };
      }
    }

    const updatedPerms = enable
      ? Array.from(new Set([...currentPerms, permKey]))
      : currentPerms.filter((p) => p !== permKey);

    setRolePermissions((prev) => ({
      ...prev,
      [role]: updatedPerms,
    }));

    addAuditLog({
      targetObject: `角色权限矩阵 [${role === 'ADMIN' ? '系统管理员' : role === 'OPERATOR' ? '运营主管' : '巡检员'}]`,
      action: enable ? '授予操作权限' : '收回操作权限',
      oldState: currentPerms.includes(permKey) ? '已赋权' : '未赋权',
      newState: enable ? '已赋权' : '未赋权',
      result: 'SUCCESS',
      sourcePage: '/admin/roles',
      reason: `管理员调整角色权限项: ${permKey} -> ${enable ? '启用' : '禁用'}`,
    });

    return {
      success: true,
      message: `已成功${enable ? '授予' : '收回'}角色【${
        role === 'ADMIN' ? '系统管理员' : role === 'OPERATOR' ? '运营主管' : '巡检员'
      }】权限 [${permKey}]`,
    };
  };

  // 新增用户
  const addUser = async (userData: Partial<User>) => {
    if (!userData.name || !userData.username || !userData.role) {
      return { success: false, message: '请填写完整的姓名、账号和角色' };
    }
    const role = userData.role;
    const roleTitle = role === 'ADMIN' ? '系统管理员' : role === 'OPERATOR' ? '微电网运营主管' : '现场特种运维巡检员';
    const newUser: User = {
      id: `USR-${role.slice(0, 4)}-${Date.now().toString().slice(-4)}`,
      username: userData.username.trim(),
      name: userData.name.trim(),
      role,
      roleTitle,
      status: 'ACTIVE',
      department: userData.department || '中节能数字化中心 / 示范站运维组',
      phone: userData.phone || '138-****-9201',
      email: userData.email || `${userData.username.trim().toLowerCase()}@cecep.cn`,
      wechat: userData.wechat || `wx_${userData.username.trim().toLowerCase()}`,
      lastLoginTime: '未登录',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers((prev) => [newUser, ...prev]);
    addAuditLog({
      targetObject: `用户账号: ${newUser.name} (${newUser.username})`,
      action: '新增人员',
      oldState: 'NONE',
      newState: 'ACTIVE',
      result: 'SUCCESS',
      sourcePage: '/admin/users',
      reason: `管理员新增用户，分配角色【${roleTitle}】`,
    });

    return { success: true, message: `用户【${newUser.name}】已成功创建`, user: newUser };
  };

  // 启停用户账号 (停用前门禁：若有名下未完成任务或工单，严禁直接停用)
  const toggleUserStatus = async (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, message: '未找到指定用户' };
    }

    if (targetUser.status === 'ACTIVE') {
      // 停用前检查未闭环任务
      const pendingTasks = patrolTasks.filter(
        (t) => t.assignee === targetUser.name && t.status !== 'ARCHIVED' && t.status !== 'SUBMITTED'
      );
      const pendingOrders = workOrders.filter(
        (w) => w.assignee === targetUser.name && w.status !== 'CLOSED'
      );

      if (pendingTasks.length > 0 || pendingOrders.length > 0) {
        const availableReassignees = users.filter(
          (u) => u.id !== userId && u.status === 'ACTIVE' && (targetUser.role === 'INSPECTOR' ? u.role === 'INSPECTOR' : true)
        );
        return {
          success: false,
          blocked: true,
          message: `安全门禁拦截：用户【${targetUser.name}】名下尚有 ${pendingTasks.length} 项未完成巡检任务与 ${pendingOrders.length} 项待办工单未闭环！根据安全生产制度，严禁直接停用，必须先改派任务执行人。`,
          pendingTasks,
          pendingOrders,
          availableReassignees,
        };
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'DISABLED' as const } : u))
      );
      addAuditLog({
        targetObject: `用户账号: ${targetUser.name} (${targetUser.username})`,
        action: '停用用户账号',
        oldState: 'ACTIVE',
        newState: 'DISABLED',
        result: 'SUCCESS',
        sourcePage: '/admin/users',
        reason: '管理员停用用户账号，已核实无进行中待办任务',
      });
      return { success: true, message: `用户【${targetUser.name}】已停用` };
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'ACTIVE' as const } : u))
      );
      addAuditLog({
        targetObject: `用户账号: ${targetUser.name} (${targetUser.username})`,
        action: '启用用户账号',
        oldState: 'DISABLED',
        newState: 'ACTIVE',
        result: 'SUCCESS',
        sourcePage: '/admin/users',
        reason: '管理员恢复用户可用状态',
      });
      return { success: true, message: `用户【${targetUser.name}】已恢复启用` };
    }
  };

  // 批量改派未完成任务并停用原人员
  const reassignUserTasksAndDeactivate = async (
    userId: string,
    newAssigneeId: string,
    reason: string
  ) => {
    const targetUser = users.find((u) => u.id === userId);
    const newAssignee = users.find((u) => u.id === newAssigneeId);
    if (!targetUser || !newAssignee) {
      return { success: false, message: '原执行人或改派目标人员不存在' };
    }

    // 1. 改派巡检任务
    setPatrolTasks((prev) =>
      prev.map((t) =>
        t.assignee === targetUser.name && t.status !== 'ARCHIVED' && t.status !== 'SUBMITTED'
          ? { ...t, assignee: newAssignee.name }
          : t
      )
    );

    // 2. 改派工单
    setWorkOrders((prev) =>
      prev.map((w) =>
        w.assignee === targetUser.name && w.status !== 'CLOSED'
          ? { ...w, assignee: newAssignee.name }
          : w
      )
    );

    // 3. 停用原账号
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'DISABLED' as const } : u))
    );

    // 记录改派交接审计
    addAuditLog({
      targetObject: `巡检任务与消缺工单执行人`,
      action: '未完成任务交接改派',
      oldState: targetUser.name,
      newState: newAssignee.name,
      result: 'SUCCESS',
      sourcePage: '/admin/users',
      reason: `停用人员前安全改派：${reason || '原人员停用，全部进行中任务无缝移交备班人员'}`,
    });

    // 记录停用审计
    addAuditLog({
      targetObject: `用户账号: ${targetUser.name} (${targetUser.username})`,
      action: '停用用户账号',
      oldState: 'ACTIVE',
      newState: 'DISABLED',
      result: 'SUCCESS',
      sourcePage: '/admin/users',
      reason: '完成名下所有待办任务交接后，正式置为停用状态',
    });

    return {
      success: true,
      message: `已将【${targetUser.name}】名下全部待办改派给【${newAssignee.name}】，并已停用原账号`,
    };
  };

  // 重置登录密码 (不显示明文真实密码，发放一次性安全凭证令牌)
  const resetUserPassword = async (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, tempPasswordToken: '', message: '用户不存在' };
    }
    const tempToken = `CECEP-AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
    addAuditLog({
      targetObject: `用户凭据: ${targetUser.name} (${targetUser.username})`,
      action: '重置登录口令',
      oldState: 'ACTIVE_CREDENTIAL',
      newState: 'TEMP_TOKEN_ISSUED',
      result: 'SUCCESS',
      sourcePage: '/admin/users',
      reason: '管理员重置登录口令，签发安全一次性临时凭证',
    });
    return {
      success: true,
      tempPasswordToken: tempToken,
      message: `已为【${targetUser.name}】生成一次性临时登录凭证：${tempToken}`,
    };
  };

  // 平台健康检查触发
  const runHealthCheck = async () => {
    setHealthCheckStatus('CHECKING');
    await new Promise((r) => setTimeout(r, 700));
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    setLastHealthCheckedTime(nowStr);
    setHealthCheckStatus('IDLE');
    addAuditLog({
      targetObject: '全链路平台健康诊断',
      action: '执行全站健康自检',
      oldState: 'CHECKING',
      newState: 'HEALTHY',
      result: 'SUCCESS',
      sourcePage: '/admin/health',
      reason: '管理员主动触发前端、模拟网关、LocalStorage、实时流、工业适配器与Agent链路全面自检',
    });
  };

  // 切换健康仿真模式
  const setHealthSimulationMode = (mode: HealthSimulationMode) => {
    setHealthSimMode(mode);
    addAuditLog({
      targetObject: '平台监控仿真模式',
      action: '切换健康仿真模式',
      oldState: healthSimMode,
      newState: mode,
      result: 'SUCCESS',
      sourcePage: '/admin/health',
      reason: `切换系统健康仿真状态为: ${mode}`,
    });
  };

  // 1. 电价二次授权审批与草稿工作流 (支持按站点方案隔离)
  const getTargetScheme = (targetSchemeId?: string): TariffScheme => {
    if (targetSchemeId) {
      const found = tariffSchemes.find((ts) => ts.id === targetSchemeId);
      if (found) return found;
    }
    return tariffScheme;
  };

  const updateSchemeInList = (updatedScheme: TariffScheme) => {
    setTariffSchemes((prev) =>
      prev.map((s) => (s.id === updatedScheme.id ? updatedScheme : s))
    );
    if (tariffScheme.id === updatedScheme.id) {
      setTariffSchemeState(updatedScheme);
    }
  };

  const authorizeTariffVersion = async (versionId: string, targetSchemeId?: string) => {
    if (currentRole !== 'ADMIN') {
      return {
        success: false,
        message: '权限不足：电价版本生效必须由【系统管理员】执行二次授权，请切换角色。',
      };
    }

    const currentTarget = getTargetScheme(targetSchemeId);
    const targetVer = currentTarget.versions.find((v) => v.id === versionId);
    if (!targetVer) {
      return { success: false, message: '未找到指定的电价版本。' };
    }

    if (targetVer.status !== 'PENDING_APPROVAL') {
      return {
        success: false,
        message: '合规门禁：只有处于【待二次授权】状态的电价版本才能被批准生效。草稿与驳回版本严禁直接生效。',
      };
    }

    // 职责分离门禁：提交者与审批者分离
    if (targetVer.creator && targetVer.creator.includes(currentUser.name)) {
      return {
        success: false,
        message: '职责分离门禁：审批人不能与编制人相同，系统管理员严禁自编自批，必须保留独立二次授权！',
      };
    }

    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    const authRecord = {
      id: `APR-${Date.now().toString().slice(-4)}`,
      versionNumber: targetVer.versionNumber,
      action: 'AUTHORIZE' as const,
      actionName: '系统管理员二次授权生效',
      operatorName: currentUser.name,
      role: currentRole,
      timestamp: nowStr,
      notes: '系统管理员二次复核分时电价时段连续覆盖、光伏模式、两部制互斥及价格标准无误，正式核准生效',
    };

    const updatedVersions = currentTarget.versions.map((v) => {
      if (v.id === versionId) {
        return {
          ...v,
          status: 'EFFECTIVE' as const,
          approver: `${currentUser.name} (系统管理员二次授权)`,
          approvalTime: nowStr,
          authorizedAt: nowStr,
          approvalRecords: [...(v.approvalRecords || []), authRecord],
        };
      }
      // 旧生效版本转为历史归档 (EXPIRED)，历史快照不受修改，永不覆盖
      if (v.status === 'EFFECTIVE') {
        return {
          ...v,
          status: 'EXPIRED' as const,
        };
      }
      return v;
    });

    const target = updatedVersions.find((v) => v.id === versionId);
    const newScheme: TariffScheme = {
      ...currentTarget,
      currentVersion: target ? target.versionNumber : currentTarget.currentVersion,
      versions: updatedVersions,
    };

    updateSchemeInList(newScheme);

    addAuditLog({
      targetObject: `站点 [${currentTarget.siteId}] 电价版本 (${targetVer.versionNumber})`,
      action: '电价生效二次授权',
      oldState: 'PENDING_APPROVAL',
      newState: 'EFFECTIVE',
      reason: `系统管理员完成二人二次复核，核准站点【${currentTarget.siteId}】方案作为综合计费与收益核算唯一基准`,
    });

    return { success: true, message: `电价方案【${targetVer.versionNumber}】已成功通过二次授权并生效！` };
  };

  const rejectTariffVersion = async (versionId: string, reason: string, targetSchemeId?: string) => {
    if (currentRole !== 'ADMIN') {
      return { success: false, message: '权限不足：只有系统管理员可执行驳回操作。' };
    }
    const currentTarget = getTargetScheme(targetSchemeId);
    const targetVer = currentTarget.versions.find((v) => v.id === versionId);
    if (!targetVer) {
      return { success: false, message: '未找到指定的电价版本。' };
    }

    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    const rejectRecord = {
      id: `APR-${Date.now().toString().slice(-4)}`,
      versionNumber: targetVer.versionNumber,
      action: 'REJECT' as const,
      actionName: '系统管理员驳回申请',
      operatorName: currentUser.name,
      role: currentRole,
      timestamp: nowStr,
      notes: reason || '时段划分或价格参数不符合最新核定标准，退回草稿重新修订',
    };

    const newScheme: TariffScheme = {
      ...currentTarget,
      versions: currentTarget.versions.map((v) =>
        v.id === versionId
          ? {
              ...v,
              status: 'REJECTED' as const,
              rejectReason: reason,
              approvalRecords: [...(v.approvalRecords || []), rejectRecord],
            }
          : v
      ),
    };

    updateSchemeInList(newScheme);

    addAuditLog({
      targetObject: `站点 [${currentTarget.siteId}] 电价版本 (${targetVer.versionNumber})`,
      action: '驳回电价申请',
      oldState: targetVer.status,
      newState: 'REJECTED',
      reason: reason || '填报时段或价格不符合核定标准，退回草稿修改',
    });

    return { success: true, message: `已驳回电价版本【${targetVer.versionNumber}】，驳回原因已保留至审批流。` };
  };

  const createTariffDraft = async (draftData?: Partial<TariffVersion>, targetSchemeId?: string) => {
    if (currentRole !== 'OPERATOR' && currentRole !== 'ADMIN') {
      return { success: false, message: '权限不足：巡检员无权创建电价草稿。' };
    }
    const currentTarget = getTargetScheme(targetSchemeId);
    const nextVerNum = `V${(currentTarget.versions.length + 1).toFixed(1)}`;
    const newId = `VER-TARIFF-${Date.now().toString().slice(-4)}`;
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });

    const newRecord = {
      id: `APR-${Date.now().toString().slice(-4)}`,
      versionNumber: draftData?.versionNumber || nextVerNum,
      action: 'CREATE_DRAFT' as const,
      actionName: '新建电价草稿',
      operatorName: currentUser.name,
      role: currentRole,
      timestamp: nowStr,
      notes: draftData?.notes || `新建站点【${currentTarget.siteId}】分时电价与微电网计费拟订方案`,
    };

    const newVersion: TariffVersion = {
      id: newId,
      schemeId: currentTarget.id,
      versionNumber: draftData?.versionNumber || nextVerNum,
      effectiveDateStart: draftData?.effectiveDateStart || '2026-10-01',
      effectiveDateEnd: draftData?.effectiveDateEnd || '2026-12-31',
      slots: draftData?.slots || [
        { label: '尖峰', period: '19:00 - 21:00', price: 1.500 },
        { label: '高峰', period: '08:30 - 11:30, 14:30 - 19:00', price: 1.180 },
        { label: '平段', period: '06:30 - 08:30, 11:30 - 14:30, 21:00 - 23:00', price: 0.700 },
        { label: '低谷', period: '23:00 - 次日06:30', price: 0.310 },
        { label: '深谷', period: '12:00 - 14:00', price: 0.200 },
      ],
      timeIntervals: draftData?.timeIntervals || [
        { id: 'nt-1', start: '00:00', end: '06:30', label: '低谷', price: 0.310 },
        { id: 'nt-2', start: '06:30', end: '08:30', label: '平段', price: 0.700 },
        { id: 'nt-3', start: '08:30', end: '11:30', label: '高峰', price: 1.180 },
        { id: 'nt-4', start: '11:30', end: '12:00', label: '平段', price: 0.700 },
        { id: 'nt-5', start: '12:00', end: '14:00', label: '深谷', price: 0.200 },
        { id: 'nt-6', start: '14:00', end: '14:30', label: '平段', price: 0.700 },
        { id: 'nt-7', start: '14:30', end: '19:00', label: '高峰', price: 1.180 },
        { id: 'nt-8', start: '19:00', end: '21:00', label: '尖峰', price: 1.500 },
        { id: 'nt-9', start: '21:00', end: '23:00', label: '平段', price: 0.700 },
        { id: 'nt-10', start: '23:00', end: '24:00', label: '低谷', price: 0.310 },
      ],
      serviceFeeOrBaseFee: draftData?.serviceFeeOrBaseFee || '充电桩服务费: 0.45元/kWh | 容量电费: 32.00元/kVA/月',
      status: 'DRAFT',
      creator: `${currentUser.name} (${currentRole === 'ADMIN' ? '系统管理员' : '运营人员'})`,
      notes: draftData?.notes || '新分时电价时段拟定草稿',
      pvConfig: draftData?.pvConfig || {
        mode: 'TIERED',
        tieredConfig: { thresholdKwh: 500000, tier1Price: 0.4200, tier2Price: 0.3800 },
        description: '拟定采用阶梯电价模式激励光伏发电就地消纳',
      },
      chargingConfig: draftData?.chargingConfig || {
        serviceFee: 0.45,
        energyPriceTou: { sharp: 1.500, peak: 1.180, flat: 0.700, valley: 0.310, deepValley: 0.200 },
      },
      basicFeeConfig: draftData?.basicFeeConfig || {
        type: 'CAPACITY',
        capacityUnitPrice: 32.0,
        transformerCapacityKva: 2000,
        description: '选用【容量电费】：装见容量 2000 kVA × 32.00 元/kVA/月；需量电费未启用。',
      },
      approvalRecords: [newRecord],
    };

    const newScheme: TariffScheme = {
      ...currentTarget,
      versions: [...currentTarget.versions, newVersion],
    };

    updateSchemeInList(newScheme);

    addAuditLog({
      targetObject: `站点 [${currentTarget.siteId}] 电价版本 (${newVersion.versionNumber})`,
      action: '新建电价草稿',
      oldState: '无',
      newState: 'DRAFT',
      reason: `运营人员录入站点【${currentTarget.siteId}】新分时时段与价格参数草稿`,
    });

    return { success: true, message: `电价草稿【${newVersion.versionNumber}】创建成功！`, versionId: newId };
  };

  const updateTariffVersion = async (versionId: string, updates: Partial<TariffVersion>, targetSchemeId?: string) => {
    const currentTarget = getTargetScheme(targetSchemeId);
    const target = currentTarget.versions.find((v) => v.id === versionId);
    if (target?.status === 'EFFECTIVE') {
      return { success: false, message: '合规门禁：已生效的基准电价版本具有审计防篡改性，严禁直接修改！' };
    }
    const newScheme: TariffScheme = {
      ...currentTarget,
      versions: currentTarget.versions.map((v) => (v.id === versionId ? { ...v, ...updates } : v)),
    };
    updateSchemeInList(newScheme);
    return { success: true, message: '电价版本内容已更新保存！' };
  };

  const submitTariffVersion = async (versionId: string, targetSchemeId?: string) => {
    if (currentRole !== 'OPERATOR' && currentRole !== 'ADMIN') {
      return { success: false, message: '权限不足：巡检员无权提交审批。' };
    }
    const currentTarget = getTargetScheme(targetSchemeId);
    const target = currentTarget.versions.find((v) => v.id === versionId);
    if (!target) {
      return { success: false, message: '未找到指定的电价版本。' };
    }
    if (target.status !== 'DRAFT' && target.status !== 'REJECTED') {
      return { success: false, message: '只有草稿或被驳回的版本可以提交审批。' };
    }

    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    const newRecord = {
      id: `APR-${Date.now().toString().slice(-4)}`,
      versionNumber: target.versionNumber,
      action: 'SUBMIT' as const,
      actionName: '提交二次授权审批',
      operatorName: currentUser.name,
      role: currentRole,
      timestamp: nowStr,
      notes: '完成 24 小时全覆盖无重叠校验及四类电价配置，提交二次审批',
    };

    const newScheme: TariffScheme = {
      ...currentTarget,
      versions: currentTarget.versions.map((v) =>
        v.id === versionId
          ? {
              ...v,
              status: 'PENDING_APPROVAL' as const,
              submitTime: nowStr,
              rejectReason: undefined,
              approvalRecords: [...(v.approvalRecords || []), newRecord],
            }
          : v
      ),
    };

    updateSchemeInList(newScheme);

    addAuditLog({
      targetObject: `站点 [${currentTarget.siteId}] 电价版本 (${target.versionNumber})`,
      action: '提交电价二次授权审批',
      oldState: target.status,
      newState: 'PENDING_APPROVAL',
      reason: `运营人员完成站点【${currentTarget.siteId}】时段与价格校验，提交系统管理员审批`,
    });

    return { success: true, message: `电价方案【${target.versionNumber}】已提交审批，等待系统管理员二次授权！` };
  };

  const deleteTariffVersion = async (versionId: string, targetSchemeId?: string) => {
    const currentTarget = getTargetScheme(targetSchemeId);
    const target = currentTarget.versions.find((v) => v.id === versionId);
    if (target?.status === 'EFFECTIVE') {
      return { success: false, message: '合规门禁：已生效的基准电价版本严禁删除！' };
    }
    const newScheme: TariffScheme = {
      ...currentTarget,
      versions: currentTarget.versions.filter((v) => v.id !== versionId),
    };
    updateSchemeInList(newScheme);
    addAuditLog({
      targetObject: `站点 [${currentTarget.siteId}] 电价版本 (${target?.versionNumber || versionId})`,
      action: '删除未生效电价版本',
      oldState: target?.status || 'DRAFT',
      newState: 'DELETED',
      reason: '废弃未生效的拟订草稿或已驳回历史版本',
    });
    return { success: true, message: '电价版本已删除。' };
  };

  // 2. 适配器验证与重试
  const verifyAdapter = async (adapterId: string) => {
    setAdapters((prev) =>
      prev.map((ad) => (ad.id === adapterId ? { ...ad, status: 'VERIFYING' } : ad))
    );
    await new Promise((r) => setTimeout(r, 600));

    setAdapters((prev) =>
      prev.map((ad) =>
        ad.id === adapterId
          ? {
              ...ad,
              status: 'ONLINE',
              consecutiveFailures: 0,
              lastSyncTime: '刚刚 (验证通过)',
              errorDetail: undefined,
            }
          : ad
      )
    );

    addAuditLog({
      targetObject: `数据接入适配器 (${adapterId})`,
      action: '重新验证协议握手',
      oldState: 'FAILED/RETRYING',
      newState: 'ONLINE',
      reason: '现场交换机端口恢复，重新发起 Modbus/TCP 鉴权与点位同步成功',
    });

    return { success: true, message: '适配器连接验证成功，已恢复在线状态！' };
  };

  const retryAdapter = async (adapterId: string) => {
    return verifyAdapter(adapterId);
  };

  const syncAdapter = async (adapterId: string) => {
    const traceId = MockService.generateTraceId('TR-SYNC');
    setAdapters((prev) =>
      prev.map((ad) => (ad.id === adapterId ? { ...ad, status: 'VERIFYING' } : ad))
    );
    await new Promise((r) => setTimeout(r, 800));
    const isError = scenario === 'SCENARIO_B' && adapterId === 'ADAPTER-ESS-02';

    if (isError) {
      setAdapters((prev) =>
        prev.map((ad) =>
          ad.id === adapterId
            ? {
                ...ad,
                status: 'RETRYING',
                consecutiveFailures: ad.consecutiveFailures + 1,
                errorMessage: 'ACK超时 (指数退避 32s 后重试)',
              }
            : ad
        )
      );
      addAuditLog({
        targetObject: `数据接入适配器 (${adapterId})`,
        action: '发起主动同步 (失败/指数退避)',
        oldState: 'RETRYING',
        newState: 'RETRYING (退避 32s)',
        reason: `储能 EMS 接口响应超时，触发指数退避机制，TraceID: ${traceId}`,
      });
      return { success: false, message: `同步请求超时，已触发指数退避重试 (TraceID: ${traceId})`, traceId };
    } else {
      setAdapters((prev) =>
        prev.map((ad) =>
          ad.id === adapterId
            ? {
                ...ad,
                status: 'ONLINE',
                consecutiveFailures: 0,
                lastSyncTime: new Date().toLocaleString('zh-CN', { hour12: false }),
                errorMessage: undefined,
              }
            : ad
        )
      );
      addAuditLog({
        targetObject: `数据接入适配器 (${adapterId})`,
        action: '发起主动同步 (成功)',
        oldState: 'ONLINE',
        newState: 'ONLINE (同步成功)',
        reason: `适配器数据同步成功，刷新遥测与点位映射，TraceID: ${traceId}`,
      });
      return { success: true, message: `同步成功！已更新最新遥测数据包 (TraceID: ${traceId})`, traceId };
    }
  };

  // 3. 数据质量问题处置
  const resolveQualityIssue = async (
    issueId: string,
    resolutionMode: 'AUTO_BACKFILL' | 'MANUAL_INTERVENTION'
  ) => {
    const traceId = MockService.generateTraceId('TR-BACKFILL');
    setQualityIssues((prev) =>
      prev.map((qi) =>
        qi.id === issueId
          ? {
              ...qi,
              status: 'RESOLVED',
              resolutionMode,
              backfillBatchId: traceId,
            }
          : qi
      )
    );

    // 点位质量恢复为 PATCHED (补录)
    setPoints((prev) =>
      prev.map((pt) =>
        pt.currentQuality === 'ANOMALY' ? { ...pt, currentQuality: 'PATCHED' } : pt
      )
    );

    // 提高置信度
    setRevenueSnapshots((prev) =>
      prev.map((snap) => ({
        ...snap,
        dataConfidencePercent: Math.min(99.0, snap.dataConfidencePercent + 22.0),
        qualityFlag: 'RECALCULATED',
        warningMessage: undefined,
      }))
    );

    addAuditLog({
      targetObject: `数据质量异常项 (${issueId})`,
      action: resolutionMode === 'AUTO_BACKFILL' ? '发起历史断点补采' : '人工核验导入',
      oldState: 'PENDING',
      newState: 'RESOLVED',
      reason: `执行断点批次 (${traceId}) 回填，数据质量恢复为【补录】，解除结算阻塞`,
    });

    return { success: true, message: `历史补采成功完成，数据标记为【补录】并解除风控锁定！` };
  };

  // 4. 告警处置
  const checkAlarmRolePermission = (alarm?: Alarm): { allowed: boolean; message?: string } => {
    if (currentRole === 'INSPECTOR') {
      return {
        allowed: false,
        message: '权限限制：巡检员在 Web 端为只读视图，请在移动端巡检任务中心查看并执行分配的任务。',
      };
    }
    if (currentRole === 'ADMIN') {
      if (alarm && alarm.source !== 'INTERFACE') {
        return {
          allowed: false,
          message: '权限边界：系统管理员仅限处置【接口服务】类告警，设备/数据质量/阈值告警请切换至运营人员角色处置。',
        };
      }
    }
    return { allowed: true };
  };

  const ackAlarm = async (alarmId: string, note?: string) => {
    const targetAlarm = alarms.find((a) => a.id === alarmId);
    const perm = checkAlarmRolePermission(targetAlarm);
    if (!perm.allowed) {
      return { success: false, message: perm.message || '无权限处置' };
    }

    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    setAlarms((prev) =>
      prev.map((alm) =>
        alm.id === alarmId
          ? {
              ...alm,
              status: 'PROCESSING',
              handledBy: currentUser.name,
              timeline: [
                ...(alm.timeline || []),
                {
                  time: nowStr,
                  operator: currentUser.name,
                  action: '接单确认',
                  note: note || '运营人员已在 SLA 限时内确认告警并转入处置阶段',
                },
              ],
            }
          : alm
      )
    );
    addAuditLog({
      targetObject: `告警 (${targetAlarm?.alarmCode || alarmId})`,
      action: '确认告警',
      oldState: 'PENDING_ACK',
      newState: 'PROCESSING',
      reason: note || '运营人员已在 SLA 限时内确认告警并跟进处置',
    });
    return { success: true, message: '告警已接单确认，SLA 转入处置阶段！' };
  };

  const closeAlarm = async (alarmId: string, actionTaken: string) => {
    const targetAlarm = alarms.find((a) => a.id === alarmId);
    const perm = checkAlarmRolePermission(targetAlarm);
    if (!perm.allowed) {
      return { success: false, message: perm.message || '无权限处置' };
    }

    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    setAlarms((prev) =>
      prev.map((alm) =>
        alm.id === alarmId
          ? {
              ...alm,
              status: 'CLOSED',
              actionTaken,
              handledBy: currentUser.name,
              timeline: [
                ...(alm.timeline || []),
                {
                  time: nowStr,
                  operator: currentUser.name,
                  action: '办结归档',
                  note: actionTaken || '现场排查整改完成，遥测恢复正常，予以归档关闭',
                },
              ],
            }
          : alm
      )
    );
    addAuditLog({
      targetObject: `告警 (${targetAlarm?.alarmCode || alarmId})`,
      action: '处置完成并关闭',
      oldState: targetAlarm?.status || 'PROCESSING',
      newState: 'CLOSED',
      reason: actionTaken || '现场排查整改完成，设备遥测恢复正常',
    });
    return { success: true, message: '告警已正式归档关闭！' };
  };

  const resolveAlarm = async (alarmId: string, actionTaken: string) => {
    const targetAlarm = alarms.find((a) => a.id === alarmId);
    const perm = checkAlarmRolePermission(targetAlarm);
    if (!perm.allowed) {
      return { success: false, message: perm.message || '无权限处置' };
    }

    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    setAlarms((prev) =>
      prev.map((alm) =>
        alm.id === alarmId
          ? {
              ...alm,
              status: 'RESOLVED',
              actionTaken,
              handledBy: currentUser.name,
              timeline: [
                ...(alm.timeline || []),
                {
                  time: nowStr,
                  operator: currentUser.name,
                  action: '完成处置',
                  note: actionTaken || '现场处置动作完成，待复核确认',
                },
              ],
            }
          : alm
      )
    );
    addAuditLog({
      targetObject: `告警 (${targetAlarm?.alarmCode || alarmId})`,
      action: '完成处置',
      oldState: targetAlarm?.status || 'PROCESSING',
      newState: 'RESOLVED',
      reason: actionTaken || '现场整改处置完成',
    });
    return { success: true, message: '告警已处置完成！' };
  };

  const ignoreAlarm = async (alarmId: string, type: 'IGNORED' | 'FALSE_ALARM', reason: string) => {
    const targetAlarm = alarms.find((a) => a.id === alarmId);
    const perm = checkAlarmRolePermission(targetAlarm);
    if (!perm.allowed) {
      return { success: false, message: perm.message || '无权限处置' };
    }

    if (!reason || reason.trim().length === 0) {
      return { success: false, message: '业务门禁：忽略或判定误报必须详细填写审计理由！' };
    }

    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    setAlarms((prev) =>
      prev.map((alm) =>
        alm.id === alarmId
          ? {
              ...alm,
              status: type,
              ignoreReason: reason.trim(),
              handledBy: currentUser.name,
              timeline: [
                ...(alm.timeline || []),
                {
                  time: nowStr,
                  operator: currentUser.name,
                  action: type === 'FALSE_ALARM' ? '标记误报' : '人工忽略',
                  note: reason.trim(),
                },
              ],
            }
          : alm
      )
    );
    addAuditLog({
      targetObject: `告警 (${targetAlarm?.alarmCode || alarmId})`,
      action: type === 'FALSE_ALARM' ? '判定误报' : '人工忽略',
      oldState: targetAlarm?.status || 'PENDING_ACK',
      newState: type,
      reason: reason.trim(),
    });
    return { success: true, message: `告警已记录为【${type === 'FALSE_ALARM' ? '误报' : '忽略'}】！` };
  };

  const createWorkOrderFromAlarm = async (
    alarmId: string,
    assignee: string,
    deadlineTime?: string,
    requirements?: string
  ) => {
    const targetAlarm = alarms.find((a) => a.id === alarmId);
    const perm = checkAlarmRolePermission(targetAlarm);
    if (!perm.allowed) {
      return { success: false, message: perm.message || '无权限派发工单' };
    }

    const orderCode = `WO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder: WorkOrder = {
      id: `WO-${Date.now()}`,
      orderCode,
      title: `针对告警 [${targetAlarm?.alarmTitle || '设备异常'}] 现场紧急整改`,
      source: 'ALARM',
      sourceId: alarmId,
      priority: targetAlarm?.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      assignee: assignee || '林志强 (巡检员)',
      status: 'PENDING_ACCEPT',
      issueDescription:
        requirements || targetAlarm?.reason || targetAlarm?.description || '告警触发，需现场核实接线与工作状态',
      reviewer: '陈若涵 (运营人员)',
      deadline: deadlineTime || new Date(Date.now() + 4 * 3600 * 1000).toLocaleString('zh-CN', { hour12: false }),
    };

    setWorkOrders((prev) => [newOrder, ...prev]);

    // 状态流转：告警进入“处理中”，关联工单编号，不得直接关闭
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    setAlarms((prev) =>
      prev.map((alm) =>
        alm.id === alarmId
          ? {
              ...alm,
              status: 'PROCESSING',
              handledBy: currentUser.name,
              linkedWorkOrderId: newOrder.id,
              linkedWorkOrderCode: orderCode,
              actionTaken: `已转派整改工单: ${orderCode}`,
              timeline: [
                ...(alm.timeline || []),
                {
                  time: nowStr,
                  operator: currentUser.name,
                  action: '转整改工单',
                  note: `生成整改工单 ${orderCode}，指定执行人: ${assignee || '林志强 (巡检员)'}`,
                },
              ],
            }
          : alm
      )
    );

    addAuditLog({
      targetObject: `工单 (${orderCode})`,
      action: '由告警派发整改工单',
      oldState: 'ALARM_PENDING',
      newState: 'PENDING_ACCEPT',
      reason: `告警 ${targetAlarm?.alarmCode || alarmId} 派发现场整改任务，由 ${assignee || '林志强'} 承接`,
    });
    return { success: true, message: `整改工单 ${orderCode} 已派发至现场！告警转入处理中。`, orderCode };
  };

  const createPatrolTaskFromAlarm = async (
    alarmId: string,
    assignee: string,
    deadlineTime?: string,
    route?: string
  ) => {
    const targetAlarm = alarms.find((a) => a.id === alarmId);
    const perm = checkAlarmRolePermission(targetAlarm);
    if (!perm.allowed) {
      return { success: false, message: perm.message || '无权限派发巡检任务' };
    }

    const taskCode = `PT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const taskId = `TASK-${Date.now()}`;
    const newTask: PatrolTask = {
      id: taskId,
      planId: 'PLAN-SPECIAL-ALARM',
      taskCode,
      taskName: `针对告警 [${targetAlarm?.alarmTitle || '设备异常'}] 现场专项核查`,
      title: `针对告警 [${targetAlarm?.alarmTitle || '设备异常'}] 现场专项核查`,
      assignee: assignee || '林志强 (巡检员)',
      targetZone: targetAlarm?.deviceName || '示范站站内',
      deviceList: [targetAlarm?.deviceName || '异常设备'],
      plannedDate: new Date().toISOString().slice(0, 10),
      deadlineTime: deadlineTime || new Date(Date.now() + 2 * 3600 * 1000).toLocaleString('zh-CN', { hour12: false }),
      status: 'PENDING_ACCEPT',
      isOffline: false,
      totalItems: 3,
      hasAbnormality: true,
      linkedAlarmId: alarmId,
      description: `针对告警 [${targetAlarm?.alarmCode || alarmId}] 现场专项巡检：${route || '检查通讯线缆、接线端子与供电指示灯'}`,
    };

    setPatrolTasks((prev) => [newTask, ...prev]);

    // 状态流转：告警进入“处理中”，关联巡检任务编号，不得直接关闭
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    setAlarms((prev) =>
      prev.map((alm) =>
        alm.id === alarmId
          ? {
              ...alm,
              status: 'PROCESSING',
              handledBy: currentUser.name,
              linkedTaskId: taskId,
              linkedTaskCode: taskCode,
              actionTaken: `已转派专项巡检: ${taskCode}`,
              timeline: [
                ...(alm.timeline || []),
                {
                  time: nowStr,
                  operator: currentUser.name,
                  action: '转巡检任务',
                  note: `生成巡检任务 ${taskCode}，执行人: ${assignee || '林志强 (巡检员)'}`,
                },
              ],
            }
          : alm
      )
    );

    addAuditLog({
      targetObject: `巡检任务 (${taskCode})`,
      action: '由告警派发专项巡检',
      oldState: 'ALARM_PENDING',
      newState: 'PENDING_ACCEPT',
      reason: `告警 ${targetAlarm?.alarmCode || alarmId} 派发专项核查任务，由 ${assignee || '林志强'} 承接`,
    });
    return { success: true, message: `专项巡检任务 ${taskCode} 已派发至现场！告警转入处理中。`, taskCode };
  };

  // 5. Agent 决策流转
  const adoptAgentEvent = async (
    eventId: string,
    actionType: 'DISPATCH_PATROL' | 'DISPATCH_ORDER' | 'DEFER' | 'REJECT',
    note: string,
    extra?: { assignee?: string; deadline?: string }
  ) => {
    const targetEvent = agentEvents.find((ev) => ev.id === eventId);
    if (!targetEvent) return { success: false, message: '未找到指定 Agent 事件' };

    let nextStatus: AgentEvent['status'] = 'AWAITING_DECISION';
    let createdTaskId: string | undefined = undefined;
    let createdTaskCode: string | undefined = undefined;
    let createdOrderId: string | undefined = undefined;
    let createdOrderCode: string | undefined = undefined;

    const dateStr = new Date().toISOString().slice(0, 10);
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });

    if (actionType === 'DISPATCH_ORDER') {
      nextStatus = 'DISPATCHED_ORDER';
      createdOrderCode = `WO-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
      createdOrderId = `WO-${Date.now()}`;
      const newOrder: WorkOrder = {
        id: createdOrderId,
        orderCode: createdOrderCode,
        title: `【Agent研判整改】${targetEvent.title}`,
        source: 'ALARM',
        sourceId: targetEvent.id,
        priority: targetEvent.agentPriority === 'P1' ? 'CRITICAL' : targetEvent.agentPriority === 'P2' ? 'HIGH' : 'MEDIUM',
        assignee: extra?.assignee || '林志强 (巡检员)',
        status: 'PENDING_ACCEPT',
        issueDescription: `${targetEvent.aiSummary}\n\n规则依据：\n${targetEvent.ruleEvidence.join('\n')}\n\n处置要求：${note}`,
        deadline: extra?.deadline || targetEvent.sla || new Date(Date.now() + 4 * 3600 * 1000).toLocaleString('zh-CN', { hour12: false }),
        reviewer: currentUser.name,
        createdAt: nowStr,
        traceId: targetEvent.traceId,
      };
      setWorkOrders((prev) => [newOrder, ...prev]);
      addAuditLog({
        targetObject: `整改工单 (${createdOrderCode})`,
        action: '由 Agent 辅助决策派发整改工单',
        oldState: '无',
        newState: 'PENDING_ACCEPT',
        reason: `采纳 Agent 事件 ${targetEvent.id} 研判结论，派发整改工单给 ${newOrder.assignee}。审查说明：${note}`,
      });
    } else if (actionType === 'DISPATCH_PATROL') {
      nextStatus = 'DISPATCHED_PATROL';
      createdTaskCode = `PT-AGENT-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
      createdTaskId = `TASK-${Date.now()}`;
      const newTask: PatrolTask = {
        id: createdTaskId,
        taskCode: createdTaskCode,
        title: `【Agent专项巡检】${targetEvent.title}`,
        taskName: `【Agent专项巡检】${targetEvent.title}`,
        source: 'TEMP',
        deviceList: [targetEvent.targetObject],
        targetZone: '示范站核心控制区',
        assignee: extra?.assignee || '林志强 (巡检员)',
        plannedDate: dateStr,
        planDeadline: extra?.deadline || targetEvent.sla || `${dateStr} 18:00`,
        deadlineTime: extra?.deadline || targetEvent.sla || `${dateStr} 18:00`,
        description: `${targetEvent.aiSummary}\n巡检核验要点：${note}`,
        status: 'PENDING_ACCEPT',
        isOffline: false,
        totalItems: 2,
        hasAbnormality: false,
        checkItems: [
          {
            id: 'CI-AG1',
            itemName: `${targetEvent.targetObject} 就地外观与指示灯检查`,
            method: '目视检查并核验接线',
            standard: '指示灯正常，无异常告警鸣响，端子无发热异味',
            result: 'UNCHECKED',
          },
          {
            id: 'CI-AG2',
            itemName: '就地通信线缆与网络跳线连接核查',
            method: '物理紧固并测量电压/通断',
            standard: '网络指示灯闪烁正常，Modbus/TCP 或 RS485 链路连通',
            result: 'UNCHECKED',
          },
        ],
        traceId: targetEvent.traceId,
      };
      setPatrolTasks((prev) => [newTask, ...prev]);
      addAuditLog({
        targetObject: `巡检任务 (${createdTaskCode})`,
        action: '由 Agent 辅助决策派发巡检任务',
        oldState: '无',
        newState: 'PENDING_ACCEPT',
        reason: `采纳 Agent 事件 ${targetEvent.id} 建议，向 ${newTask.assignee} 派发专项特巡任务。审查说明：${note}`,
      });
    } else if (actionType === 'DEFER') {
      nextStatus = 'DEFERRED';
    } else if (actionType === 'REJECT') {
      nextStatus = 'REJECTED';
    }

    setAgentEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              status: nextStatus,
              deferReason: actionType === 'DEFER' ? note : ev.deferReason,
              rejectReason: actionType === 'REJECT' ? note : ev.rejectReason,
              linkedTaskId: createdTaskId || ev.linkedTaskId,
              linkedTaskCode: createdTaskCode || ev.linkedTaskCode,
              linkedWorkOrderId: createdOrderId || ev.linkedWorkOrderId,
              linkedWorkOrderCode: createdOrderCode || ev.linkedWorkOrderCode,
              actionHistory: [
                ...ev.actionHistory,
                {
                  time: nowStr,
                  operator: currentUser.name,
                  action:
                    actionType === 'DISPATCH_ORDER'
                      ? `转整改工单 (${createdOrderCode})`
                      : actionType === 'DISPATCH_PATROL'
                      ? `转专项巡检 (${createdTaskCode})`
                      : actionType === 'DEFER'
                      ? '暂缓观察'
                      : '驳回建议',
                  note,
                },
              ],
            }
          : ev
      )
    );

    addAuditLog({
      targetObject: `Agent 事件 (${eventId} - ${targetEvent.title})`,
      action: `人工决策: ${actionType}`,
      oldState: targetEvent.status,
      newState: nextStatus,
      reason: note || '运营人员人工审查 Agent 规则证据与建议后采纳执行',
    });

    return {
      success: true,
      message:
        actionType === 'DISPATCH_ORDER'
          ? `已成功采纳并生成整改工单【${createdOrderCode}】！`
          : actionType === 'DISPATCH_PATROL'
          ? `已成功采纳并生成专项巡检【${createdTaskCode}】！`
          : actionType === 'DEFER'
          ? '已记录暂缓观察理由，事件进入暂缓状态。'
          : '已驳回当前 Agent 建议并完整记录审计依据。',
      taskId: createdTaskId,
      orderId: createdOrderId,
    };
  };

  const archiveAgentEvent = async (eventId: string, note?: string) => {
    const targetEvent = agentEvents.find((ev) => ev.id === eventId);
    if (!targetEvent) return { success: false, message: '未找到指定 Agent 事件' };

    // 校验：关联工单未关闭时不能归档
    if (targetEvent.linkedWorkOrderId) {
      const linkedOrder = workOrders.find(
        (wo) => wo.id === targetEvent.linkedWorkOrderId || wo.orderCode === targetEvent.linkedWorkOrderCode
      );
      if (linkedOrder && linkedOrder.status !== 'CLOSED') {
        return {
          success: false,
          message: `阻断归档：关联的整改工单【${linkedOrder.orderCode}】处于【${linkedOrder.status}】状态，尚未正式闭环，不可归档！`,
        };
      }
    }

    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    const archiveReason = note || '人工核验关联巡检与工单已闭环，正式予以归档';

    setAgentEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              status: 'ARCHIVED',
              archiveNote: archiveReason,
              actionHistory: [
                ...ev.actionHistory,
                {
                  time: nowStr,
                  operator: currentUser.name,
                  action: '人工确认归档',
                  note: archiveReason,
                },
              ],
            }
          : ev
      )
    );

    addAuditLog({
      targetObject: `Agent 事件 (${eventId})`,
      action: '归档事件',
      oldState: targetEvent.status,
      newState: 'ARCHIVED',
      reason: archiveReason,
    });

    return { success: true, message: `事件【${eventId}】已成功归档！` };
  };

  // 6. 巡检计划编排与排程
  const createPatrolPlan = async (planData: Omit<PatrolPlan, 'id'>) => {
    if (currentRole !== 'ADMIN' && currentRole !== 'OPERATOR') {
      return { success: false, message: '权限不足：仅系统管理员或运营人员可编排巡检计划。' };
    }
    const planCode = planData.planCode || `PLAN-2026-${planData.cycle?.[0] || 'D'}${Math.floor(100 + Math.random() * 900)}`;
    const newPlan: PatrolPlan = {
      ...planData,
      id: `PLAN-${Date.now()}`,
      planCode,
      templateItemsCount: planData.templateItems?.length || 0,
      status: planData.status || 'ACTIVE',
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      version: planData.version || 'V1.0',
    };
    setPatrolPlans((prev) => [newPlan, ...prev]);
    addAuditLog({
      targetObject: `巡检计划 (${newPlan.planName})`,
      action: '新建巡检计划',
      oldState: '无',
      newState: `已创建 [${newPlan.status}]，周期: ${newPlan.cycle}`,
      reason: `编排微电网巡视规程，涵盖 ${newPlan.deviceScope.length} 类设备，${newPlan.templateItemsCount} 项检查要点`,
    });
    return { success: true, message: `巡检计划【${newPlan.planName}】已成功创建！`, planId: newPlan.id };
  };

  const updatePatrolPlan = async (planId: string, updates: Partial<PatrolPlan>) => {
    if (currentRole !== 'ADMIN' && currentRole !== 'OPERATOR') {
      return { success: false, message: '权限不足：仅系统管理员或运营人员可编辑巡检计划。' };
    }
    const oldPlan = patrolPlans.find((p) => p.id === planId);
    if (!oldPlan) return { success: false, message: '未找到指定巡检计划' };
    if (oldPlan.status === 'CANCELLED') {
      return { success: false, message: '已作废的巡检计划不可修改！' };
    }
    // 递增微版本号，保证：修改计划只影响未来任务，不能覆盖已生成任务
    const currentVerNum = parseFloat((oldPlan.version || 'V1.0').replace('V', '')) || 1.0;
    const nextVersion = `V${(currentVerNum + 0.1).toFixed(1)}`;
    setPatrolPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? {
              ...p,
              ...updates,
              version: nextVersion,
              templateItemsCount: updates.templateItems ? updates.templateItems.length : p.templateItemsCount,
              updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
            }
          : p
      )
    );
    addAuditLog({
      targetObject: `巡检计划 (${oldPlan.planName})`,
      action: '修改巡检计划',
      oldState: `版本 ${oldPlan.version || 'V1.0'}`,
      newState: `更新至版本 ${nextVersion} (仅生效于未来任务)`,
      reason: updates.description || '运营优化巡检检查项与执行路线规程',
    });
    return {
      success: true,
      message: `巡检计划已升级至 ${nextVersion}！提示：修改仅对未来任务生效，历史及进行中任务已锁定基线快照。`,
    };
  };

  const togglePatrolPlanStatus = async (planId: string) => {
    if (currentRole !== 'ADMIN' && currentRole !== 'OPERATOR') {
      return { success: false, message: '权限不足：仅系统管理员或运营人员可启停计划。' };
    }
    const plan = patrolPlans.find((p) => p.id === planId);
    if (!plan) return { success: false, message: '未找到指定计划' };
    if (plan.status === 'CANCELLED') {
      return { success: false, message: '已作废的计划不可重新启停！' };
    }
    const nextStatus = plan.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setPatrolPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, status: nextStatus, updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }) } : p))
    );
    addAuditLog({
      targetObject: `巡检计划 (${plan.planName})`,
      action: nextStatus === 'ACTIVE' ? '启用巡检计划' : '暂停巡检计划',
      oldState: plan.status,
      newState: nextStatus,
      reason: nextStatus === 'ACTIVE' ? '恢复计划排程，按排程周期自动生成任务' : '临时维护停用，暂停自动派发巡检任务',
    });
    return { success: true, message: `计划状态已更新为【${nextStatus === 'ACTIVE' ? '启用运行' : '暂停排程'}】！` };
  };

  const cancelPatrolPlan = async (planId: string, reason: string) => {
    if (currentRole !== 'ADMIN') {
      return { success: false, message: '权限不足：作废巡检计划属于高敏操作，仅【系统管理员】有权执行。' };
    }
    if (!reason || reason.trim().length === 0) {
      return { success: false, message: '作废计划必须填写具体的业务原因。' };
    }
    const plan = patrolPlans.find((p) => p.id === planId);
    if (!plan) return { success: false, message: '未找到指定计划' };
    setPatrolPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, status: 'CANCELLED', updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }) } : p))
    );
    addAuditLog({
      targetObject: `巡检计划 (${plan.planName})`,
      action: '作废计划规程',
      oldState: plan.status,
      newState: 'CANCELLED (已作废)',
      reason: reason.trim(),
    });
    return { success: true, message: `巡检计划【${plan.planName}】已置为作废状态，保留全量历史审计。` };
  };

  const generateTaskFromPlan = async (planId: string) => {
    const plan = patrolPlans.find((p) => p.id === planId);
    if (!plan) return { success: false, message: '未找到对应巡检计划' };
    if (plan.status !== 'ACTIVE') {
      return { success: false, message: '该计划当前处于非运行状态（已暂停或已作废），无法生成新任务！' };
    }
    const dateStr = new Date().toISOString().slice(0, 10);
    const taskCode = `PATROL-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const taskId = `TASK-${Date.now()}`;
    const newTask: PatrolTask = {
      id: taskId,
      planId: plan.id,
      planName: plan.planName,
      planVersionSnapshot: plan.version || 'V1.0',
      taskCode,
      title: `${plan.planName} - ${dateStr} 派发`,
      taskName: plan.planName,
      source: 'PLAN',
      deviceList: plan.deviceScope,
      targetZone: plan.route.split('→')[0]?.trim() || '示范站全站',
      assignee: plan.responsiblePerson || '林志强 (巡检员)',
      plannedDate: dateStr,
      planDeadline: `${dateStr} 18:00`,
      deadlineTime: `${dateStr} 18:00`,
      description: plan.description || `依照规程【${plan.planName}】执行现场巡视，检查路线：${plan.route}`,
      status: 'PENDING_ACCEPT',
      isOffline: false,
      totalItems: plan.templateItems?.length || 4,
      hasAbnormality: false,
      checkItems: (plan.templateItems || []).map((ti) => ({
        id: ti.id,
        itemName: ti.itemName,
        method: ti.method,
        standard: ti.standard,
        deviceTarget: ti.deviceTarget,
        result: 'UNCHECKED' as const,
      })),
      traceId: MockService.generateTraceId('TR-PATROL-GEN'),
    };
    setPatrolTasks((prev) => [newTask, ...prev]);
    setPatrolPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, lastGeneratedAt: new Date().toLocaleString('zh-CN', { hour12: false }) } : p))
    );
    addAuditLog({
      targetObject: `巡检任务 (${taskCode})`,
      action: '按计划规程生成巡检任务',
      oldState: '待排程',
      newState: 'PENDING_ACCEPT',
      reason: `根据计划【${plan.planName} (${plan.version || 'V1.0'})】生成今日巡检任务，派发责任人: ${newTask.assignee}`,
    });
    return { success: true, message: `任务 ${taskCode} 已成功生成并派发至【待接收】！`, taskCode };
  };

  // 7. 巡检任务管理与流转
  const createManualPatrolTask = async (taskData: Partial<PatrolTask>) => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const taskCode = `PT-TEMP-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const taskId = `TASK-${Date.now()}`;
    const newTask: PatrolTask = {
      id: taskId,
      taskCode,
      title: taskData.title || `微电网临时专项特巡任务`,
      taskName: taskData.title || `微电网临时专项特巡任务`,
      source: 'TEMP',
      deviceList: taskData.deviceList || ['示范站核心设备群'],
      targetZone: taskData.targetZone || '示范站全站',
      assignee: taskData.assignee || '林志强 (巡检员)',
      plannedDate: taskData.plannedDate || dateStr,
      planDeadline: taskData.deadlineTime || `${dateStr} 20:00`,
      deadlineTime: taskData.deadlineTime || `${dateStr} 20:00`,
      description: taskData.description || '现场临时专项核查设备状态与电气连接',
      status: 'PENDING_ACCEPT',
      isOffline: false,
      totalItems: taskData.checkItems?.length || 2,
      hasAbnormality: false,
      checkItems: taskData.checkItems || [
        { id: 'CI-T1', itemName: '现场设备运行指示灯与显示屏', method: '目视检查', standard: '常绿无红色故障码', result: 'UNCHECKED' },
        { id: 'CI-T2', itemName: '电缆连接与接地防雷扁铁', method: '紧固检查', standard: '接线牢靠无松动发热', result: 'UNCHECKED' },
      ],
      traceId: MockService.generateTraceId('TR-TASK-TEMP'),
    };
    setPatrolTasks((prev) => [newTask, ...prev]);
    addAuditLog({
      targetObject: `巡检任务 (${taskCode})`,
      action: '创建临时特巡任务',
      oldState: '无',
      newState: 'PENDING_ACCEPT',
      reason: taskData.description || '人工临时发起专项现场核验任务',
    });
    return { success: true, message: `临时特巡任务 ${taskCode} 已派发至【待接收】！`, taskCode };
  };

  const acceptPatrolTask = async (taskId: string) => {
    const task = patrolTasks.find((t) => t.id === taskId);
    if (!task) return { success: false, message: '未找到指定任务' };
    if (task.status !== 'PENDING_ACCEPT') {
      return { success: false, message: '仅【待接收】状态的任务可执行接收操作。' };
    }
    setPatrolTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'PENDING_START' } : t))
    );
    addAuditLog({
      targetObject: `巡检任务 (${task.taskCode})`,
      action: '现场巡检员接单',
      oldState: 'PENDING_ACCEPT',
      newState: 'PENDING_START',
      reason: `执行人【${task.assignee}】已确认接收任务，准备前往现场`,
    });
    return { success: true, message: `任务 ${task.taskCode} 已被接收，进入【待开始】状态！` };
  };

  const reassignPatrolTask = async (taskId: string, newAssignee: string, reason: string) => {
    if (currentRole !== 'OPERATOR' && currentRole !== 'ADMIN') {
      return { success: false, message: '权限不足：仅运营人员或系统管理员可改派巡检任务。' };
    }
    if (!newAssignee) return { success: false, message: '请选择新的执行人' };
    if (!reason || reason.trim().length === 0) return { success: false, message: '改派任务必须填写改派原因' };
    const task = patrolTasks.find((t) => t.id === taskId);
    if (!task) return { success: false, message: '未找到指定任务' };
    const oldAssignee = task.assignee;
    setPatrolTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assignee: newAssignee } : t))
    );
    addAuditLog({
      targetObject: `巡检任务 (${task.taskCode})`,
      action: '改派执行人',
      oldState: `执行人: ${oldAssignee}`,
      newState: `执行人: ${newAssignee}`,
      reason: reason.trim(),
    });
    return { success: true, message: `巡检任务 ${task.taskCode} 已改派至【${newAssignee}】！` };
  };

  // 业务门禁：任务未提交不能归档！
  const archivePatrolTask = async (taskId: string) => {
    if (currentRole !== 'OPERATOR' && currentRole !== 'ADMIN') {
      return { success: false, message: '权限不足：仅运营人员或系统管理员有权复核归档巡检任务。' };
    }
    const task = patrolTasks.find((t) => t.id === taskId);
    if (!task) return { success: false, message: '未找到指定任务' };
    // 门禁拦截：未提交严禁归档
    if (task.status !== 'SUBMITTED') {
      return {
        success: false,
        message: `业务门禁拦截：当前任务状态为【${task.status}】，未提交（SUBMITTED）严禁归档！请待巡检员从移动端提交现场事实后再归档。`,
      };
    }
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    // 1. 更新任务状态为 ARCHIVED
    setPatrolTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'ARCHIVED',
              archivedAt: nowStr,
              archivedBy: currentUser.name,
            }
          : t
      )
    );
    // 2. 生成不可变巡检历史记录快照 PatrolRecord
    const recordCode = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newRecord: PatrolRecord = {
      id: `REC-${Date.now()}`,
      recordCode,
      taskId: task.id,
      taskCode: task.taskCode,
      taskTitle: task.title || task.taskName || '微电网巡视任务',
      taskSource: task.source || 'PLAN',
      planId: task.planId,
      planName: task.planName,
      planVersionSnapshot: task.planVersionSnapshot || '执行时规程快照 V1.0',
      submitter: task.assignee,
      submittedTime: task.submittedAt || nowStr,
      archivedTime: nowStr,
      archivedBy: currentUser.name,
      syncStatus: task.isOffline ? 'LOCAL_OFFLINE_QUEUED' : 'SYNCED',
      devices: task.deviceList,
      items: (task.checkItems || []).map((ci, idx) => ({
        id: `RCI-${Date.now()}-${idx}`,
        deviceName: ci.deviceTarget || task.deviceList[idx % task.deviceList.length] || '微电网设备',
        itemTitle: ci.itemName,
        standard: ci.standard,
        result: ci.result === 'ANOMALY' ? 'ABNORMAL' : 'NORMAL',
        remark: ci.remark || (ci.result === 'ANOMALY' ? '现场发现参数异常或接触阻滞' : '就地核查正常'),
        hasPhotoPlaceholder: ci.result === 'ANOMALY',
        photoMeta:
          ci.result === 'ANOMALY'
            ? {
                timestamp: nowStr,
                coordinate: '117.65°E, 24.52°N',
                locationName: '示范站 10kV 储能与配电区',
              }
            : undefined,
      })),
      abnormalCount: task.hasAbnormality ? 1 : 0,
      abnormalSummary: task.hasAbnormality ? '现场检查存在异常项，已记录并归档备查' : '全项核验正常',
      linkedAlarmCode: task.linkedAlarmCode,
      linkedWorkOrderCode: task.linkedWorkOrderCode,
      traceId: task.traceId || MockService.generateTraceId('TR-REC'),
      inspectorRemark: task.inspectorRemark || '巡检员现场核验完成，记录完整无篡改。',
      status: 'ARCHIVED',
    };
    setPatrolRecords((prev) => [newRecord, ...prev]);
    addAuditLog({
      targetObject: `巡检任务 (${task.taskCode})`,
      action: '运营复核归档',
      oldState: 'SUBMITTED',
      newState: 'ARCHIVED',
      reason: `运营人员【${currentUser.name}】复核现场点检记录并归档，生成不可变电子档案 ${recordCode}`,
    });
    return { success: true, message: `任务 ${task.taskCode} 已复核归档！生成不可变电子档案：${recordCode}` };
  };

  const convertTaskAnomalyToWorkOrder = async (taskId: string, requirements?: string) => {
    if (currentRole !== 'OPERATOR' && currentRole !== 'ADMIN') {
      return { success: false, message: '权限不足：仅运营人员或系统管理员可转派整改工单。' };
    }
    const task = patrolTasks.find((t) => t.id === taskId);
    if (!task) return { success: false, message: '未找到指定任务' };
    const orderCode = `WO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder: WorkOrder = {
      id: `WO-${Date.now()}`,
      orderCode,
      title: `针对巡检异常 [${task.taskCode}] 现场整改`,
      source: 'PATROL_ABNORMALITY',
      sourceId: task.id,
      sourceTaskCode: task.taskCode,
      priority: 'HIGH',
      assignee: task.assignee || '林志强 (巡检员)',
      status: 'PENDING_ACCEPT',
      issueDescription: requirements || task.description || '现场巡检发现隐患，需现场排查紧固与复测',
      deadline: new Date(Date.now() + 4 * 3600 * 1000).toLocaleString('zh-CN', { hour12: false }),
      reviewer: '陈若涵 (运营人员)',
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      traceId: task.traceId,
    };
    setWorkOrders((prev) => [newOrder, ...prev]);
    // 双向关联
    setPatrolTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, linkedWorkOrderId: newOrder.id, linkedWorkOrderCode: orderCode } : t))
    );
    addAuditLog({
      targetObject: `整改工单 (${orderCode})`,
      action: '由巡检异常转整改工单',
      oldState: `巡检任务 ${task.taskCode}`,
      newState: 'PENDING_ACCEPT',
      reason: `巡检任务 ${task.taskCode} 发现隐患，生成整改工单由 ${newOrder.assignee} 处置`,
    });
    return { success: true, message: `整改工单 ${orderCode} 已派发至现场！`, orderCode };
  };

  const toggleTaskOffline = (taskId: string) => {
    setPatrolTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isOffline: !t.isOffline } : t))
    );
  };

  const updateTaskProgress = (taskId: string, completedItems: number, hasAbnormal: boolean) => {
    setPatrolTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: completedItems >= t.totalItems ? 'PENDING_SUBMIT' : 'IN_PROGRESS',
              offlineItemsCompleted: completedItems,
              hasAbnormality: hasAbnormal,
            }
          : t
      )
    );
  };

  const submitTask = async (taskId: string) => {
    const task = patrolTasks.find((t) => t.id === taskId);
    if (task?.isOffline) {
      return {
        success: false,
        message: '当前处于离线暂存状态，记录保存在本地缓存中，待恢复网络后点击【同步上报】。',
      };
    }
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    setPatrolTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'SUBMITTED',
              submittedAt: nowStr,
              submittedBy: currentUser.name,
            }
          : t
      )
    );
    addAuditLog({
      targetObject: `巡检任务 (${taskId})`,
      action: '提交现场巡检记录',
      oldState: 'IN_PROGRESS',
      newState: 'SUBMITTED',
      reason: '巡检员完成现场各项检查并提交，包含隐患照片占位与设备读数',
    });
    return { success: true, message: '巡检记录已成功提交至平台待复核！' };
  };

  const syncOfflineTask = async (taskId: string) => {
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    setPatrolTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              isOffline: false,
              status: 'SUBMITTED',
              submittedAt: nowStr,
              submittedBy: currentUser.name,
            }
          : t
      )
    );
    addAuditLog({
      targetObject: `巡检任务 (${taskId})`,
      action: '离线记录同步上云',
      oldState: 'OFFLINE_LOCAL',
      newState: 'SUBMITTED',
      reason: '现场恢复网络，离线暂存的检查项、温湿度与故障描述已完整同步',
    });
    return { success: true, message: '离线记录同步成功，已合并至中心数据库！' };
  };

  // 8. 整改工单全流程与运营复核
  const createWorkOrder = async (orderData: Partial<WorkOrder>) => {
    if (currentRole !== 'OPERATOR' && currentRole !== 'ADMIN') {
      return { success: false, message: '权限不足：仅运营人员或系统管理员可创建整改工单。' };
    }
    const orderCode = `WO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder: WorkOrder = {
      id: `WO-${Date.now()}`,
      orderCode,
      title: orderData.title || '微电网现场缺陷与隐患整改',
      source: orderData.source || 'MANUAL',
      sourceId: orderData.sourceId,
      priority: orderData.priority || 'MEDIUM',
      assignee: orderData.assignee || '林志强 (巡检员)',
      status: 'PENDING_ACCEPT',
      issueDescription: orderData.issueDescription || '现场设备参数波动或通信异常，需就地处置',
      deadline: orderData.deadline || new Date(Date.now() + 8 * 3600 * 1000).toLocaleString('zh-CN', { hour12: false }),
      reviewer: '陈若涵 (运营人员)',
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      traceId: MockService.generateTraceId('TR-WO-MANUAL'),
    };
    setWorkOrders((prev) => [newOrder, ...prev]);
    addAuditLog({
      targetObject: `整改工单 (${orderCode})`,
      action: '创建整改工单',
      oldState: '无',
      newState: 'PENDING_ACCEPT',
      reason: newOrder.issueDescription,
    });
    return { success: true, message: `整改工单 ${orderCode} 已派发至现场！`, orderCode };
  };

  const acceptWorkOrder = async (orderId: string) => {
    const wo = workOrders.find((w) => w.id === orderId);
    if (!wo) return { success: false, message: '未找到指定工单' };
    if (wo.status !== 'PENDING_ACCEPT') {
      return { success: false, message: '仅【待接收】状态的工单可接单' };
    }
    setWorkOrders((prev) =>
      prev.map((w) => (w.id === orderId ? { ...w, status: 'IN_PROGRESS' } : w))
    );
    addAuditLog({
      targetObject: `整改工单 (${wo.orderCode})`,
      action: '现场责任人接单处理',
      oldState: 'PENDING_ACCEPT',
      newState: 'IN_PROGRESS',
      reason: `责任人【${wo.assignee}】已确认接单，准备现场排查与维修整改`,
    });
    return { success: true, message: `工单 ${wo.orderCode} 已接收，进入【处理中】状态！` };
  };

  const reassignWorkOrder = async (orderId: string, newAssignee: string, reason: string) => {
    if (currentRole !== 'OPERATOR' && currentRole !== 'ADMIN') {
      return { success: false, message: '权限不足：仅运营人员或系统管理员可改派工单。' };
    }
    if (!newAssignee) return { success: false, message: '请选择新的责任人' };
    if (!reason || reason.trim().length === 0) return { success: false, message: '改派工单必须填写改派原因' };
    const wo = workOrders.find((w) => w.id === orderId);
    if (!wo) return { success: false, message: '未找到指定工单' };
    const oldAssignee = wo.assignee;
    setWorkOrders((prev) =>
      prev.map((w) => (w.id === orderId ? { ...w, assignee: newAssignee } : w))
    );
    addAuditLog({
      targetObject: `整改工单 (${wo.orderCode})`,
      action: '改派工单责任人',
      oldState: `责任人: ${oldAssignee}`,
      newState: `责任人: ${newAssignee}`,
      reason: reason.trim(),
    });
    return { success: true, message: `工单 ${wo.orderCode} 已改派至【${newAssignee}】！` };
  };

  const submitWorkOrderResolution = async (orderId: string, evidence: string) => {
    if (!evidence || evidence.trim().length === 0) {
      return {
        success: false,
        message: '业务门禁：工单提交待复核必须填写处理过程说明与现场佐证（照片占位）。无处理说明和佐证不能进入待复核。',
      };
    }

    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    setWorkOrders((prev) =>
      prev.map((wo) =>
        wo.id === orderId
          ? {
              ...wo,
              status: 'PENDING_REVIEW',
              handlingEvidence: evidence,
              handledTime: nowStr,
              handlingHistory: [
                ...(wo.handlingHistory || []),
                {
                  time: nowStr,
                  operator: currentUser.name,
                  action: '现场整改完成，提交运营复核',
                  evidence,
                  note: '巡检员提交完成不等于工单关闭，等待运营人员验收复核。',
                },
              ],
            }
          : wo
      )
    );

    addAuditLog({
      targetObject: `整改工单 (${orderId})`,
      action: '现场处理完成，提交复核',
      oldState: 'IN_PROGRESS',
      newState: 'PENDING_REVIEW',
      reason: evidence,
    });

    return {
      success: true,
      message: '工单整改事实已提交！已进入【待复核】状态，等待运营人员验收关闭。',
    };
  };

  const reviewWorkOrder = async (orderId: string, approved: boolean, note: string) => {
    if (currentRole !== 'OPERATOR' && currentRole !== 'ADMIN') {
      return {
        success: false,
        message: '权限不足：工单复核关闭需由【运营人员】确认，巡检员无权自审关闭。',
      };
    }

    if (!approved && (!note || note.trim().length === 0)) {
      return { success: false, message: '退回整改必须填写明确的退回原因，以指导现场二次排查。' };
    }

    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id === orderId) {
          if (approved) {
            return {
              ...wo,
              status: 'CLOSED' as const,
              reviewer: currentUser.name,
              reviewedTime: nowStr,
              rejectionReason: undefined,
            };
          } else {
            // 退回整改：保留前次反馈与退回历史，工单回到 IN_PROGRESS
            return {
              ...wo,
              status: 'IN_PROGRESS' as const,
              rejectionReason: note,
              rejectionHistory: [
                ...(wo.rejectionHistory || []),
                {
                  time: nowStr,
                  reviewer: currentUser.name,
                  reason: note,
                },
              ],
            };
          }
        }
        return wo;
      })
    );

    addAuditLog({
      targetObject: `整改工单 (${orderId})`,
      action: approved ? '运营复核通过关闭' : '运营复核不合格退回',
      oldState: 'PENDING_REVIEW',
      newState: approved ? 'CLOSED' : 'IN_PROGRESS',
      reason: note || (approved ? '现场整改证据确凿，设备通信与参数恢复，予以闭环' : '退回重新处理'),
    });

    return {
      success: true,
      message: approved
        ? '工单已正式复核通过并归档关闭！全生命周期已闭环。'
        : '工单已退回现场整改人员，保留前次历史记录，待现场重新处置。',
    };
  };

  // 8. 收益重算与 V1 / V2
  const initiateRevenueRecalculation = async (reason: string) => {
    if (currentRole === 'INSPECTOR') {
      return {
        success: false,
        message: '权限不足：巡检员无权发起财务收益重算。',
      };
    }

    const traceId = MockService.generateTraceId('TR-RECALC');
    const v1Snapshot = revenueSnapshots.find((s) => s.calcType === 'SETTLEMENT') || revenueSnapshots[1];

    const v1Net = v1Snapshot ? v1Snapshot.netComprehensiveRevenue : 1984.0;
    // 补采修复后真实收益微调差异额 +286.5 元
    const variance = 286.5;
    const v2Net = v1Net + variance;

    const newBatch: RecalculationBatch = {
      id: `BATCH-${Date.now()}`,
      reason: reason || '储能历史遥测补采完成，启动 T+1 收益核算 V2 重算',
      dateRange: '昨日 2026-09-04 全天',
      originalVersion: 'V1.0',
      targetVersion: 'V2.0 (重算生效)',
      status: 'COMPLETED',
      initiator: currentUser.name,
      initiateTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      completeTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      varianceAmount: variance,
      v1NetRevenue: v1Net,
      v2NetRevenue: v2Net,
      traceId,
    };

    setRecalcBatches((prev) => [newBatch, ...prev]);

    // 更新收益快照，创建 V2 记录并保留 V1
    const v2Snapshot: RevenueSnapshot = {
      id: 'REV-YEST-SETTLEMENT-V2',
      siteId: 'SITE-001',
      dateKey: '昨日 (2026-09-04 V2 修正重算)',
      calcType: 'SETTLEMENT',
      pvRevenue: 3840.0,
      storageArbitrage: 1936.5, // 补录充放电后的真实套利
      chargingRevenue: 2480.0,
      gridPurchaseCost: 4904.0,
      capacityBaseFee: 1066.0,
      netComprehensiveRevenue: v2Net,
      dataConfidencePercent: 99.5,
      referencedTariffVersion: tariffScheme.currentVersion,
      qualityFlag: 'RECALCULATED',
      lastCalcTime: `${new Date().toLocaleString('zh-CN', { hour12: false })} (重算批次 ${traceId})`,
    };

    setRevenueSnapshots((prev) => [v2Snapshot, ...prev]);

    addAuditLog({
      targetObject: '收益核算引擎',
      action: '发起 T+1 收益重算 (生成 V2)',
      oldState: 'V1.0 (置信度预警)',
      newState: 'V2.0 (置信度 99.5%)',
      reason: `由于历史数据补采完成，重新核算收益差异 +${variance} 元，保留 V1 与批次号 ${traceId}`,
    });

    return { success: true, message: `收益 V2 重算完成！收益差异额 +${variance} 元，已归档保留 V1 对比！` };
  };

  // 辅助别名方法，确保各页面无缝调用
  const handleAgentDecision = useCallback(
    async (eventId: string, decision: 'ACCEPTED' | 'REJECTED') => {
      if (decision === 'ACCEPTED') {
        return adoptAgentEvent(
          eventId,
          'DISPATCH_ORDER',
          '已由运营主管人工审核确认，采纳 Agent 研判并向现场派发工单'
        );
      } else {
        return adoptAgentEvent(eventId, 'REJECT', '人工判定不采纳当前建议');
      }
    },
    [adoptAgentEvent]
  );

  const executePatrolTask = useCallback(
    async (taskId: string, checkedItems?: any, remark?: string) => {
      const task = patrolTasks.find((t) => t.id === taskId);
      if (task?.isOffline) {
        return {
          success: false,
          message: '当前处于离线暂存状态，记录保存在本地缓存中，待恢复网络后点击【同步上报】。',
        };
      }
      const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
      const hasAbnormal = checkedItems ? checkedItems.some((i: any) => i.result === 'ANOMALY' || i.result === 'ABNORMAL') : false;
      setPatrolTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            return {
              ...t,
              status: 'SUBMITTED',
              submittedAt: nowStr,
              submittedBy: currentUser.name,
              checkItems: checkedItems || t.checkItems,
              hasAbnormality: hasAbnormal,
              inspectorRemark: remark || t.inspectorRemark,
            };
          }
          return t;
        })
      );
      addAuditLog({
        targetObject: `巡检任务 (${taskId})`,
        action: '现场核验并提交巡检记录',
        oldState: 'IN_PROGRESS',
        newState: 'SUBMITTED',
        reason: remark || '巡检员完成现场各设备点检并提交现场事实（照片占位与测量结果）',
      });
      return { success: true, message: '巡检记录已成功提交至平台待复核！' };
    },
    [patrolTasks, currentUser.name, addAuditLog]
  );

  const submitPatrolTask = useCallback(
    async (taskId: string, data?: any) => {
      if (data?.checkItems) {
        return executePatrolTask(taskId, data.checkItems, data.remark);
      }
      return submitTask(taskId);
    },
    [executePatrolTask, submitTask]
  );

  // 10. 报表生成与生命周期管理
  const addReport = useCallback(
    (newReport: ReportItem) => {
      setReports((prev) => [newReport, ...prev]);
      addAuditLog({
        targetObject: `报表中心 (${newReport.reportCode})`,
        action: '生成/归档运营报表',
        oldState: '无',
        newState: `${newReport.title} [${newReport.version}]`,
        reason: '运营人员手动生成或归档业务报表',
      });
    },
    [addAuditLog]
  );

  const deleteReport = useCallback(
    (reportId: string) => {
      const target = reports.find((r) => r.id === reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      addAuditLog({
        targetObject: `报表中心 (${reportId})`,
        action: '删除报表记录',
        oldState: JSON.stringify(target || {}),
        newState: '已删除',
        reason: '运营人员删除报表记录',
      });
    },
    [reports, addAuditLog]
  );

  const generateReportItem = useCallback(
    async (params: {
      type: ReportType;
      period: string;
      title?: string;
      isFormalSettlement?: boolean;
      customNotes?: string;
    }): Promise<{
      success: boolean;
      message: string;
      report?: ReportItem;
      blocked?: boolean;
      recoveryAdvice?: string;
    }> => {
      const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
      const traceId = `TR-RPT-${Date.now()}`;
      const reportId = `RPT-${Date.now()}`;

      // 门禁规则 1：收益结算报表 (REVENUE_SETTLEMENT)
      if (params.type === 'REVENUE_SETTLEMENT') {
        const v2Snapshot = revenueSnapshots.find((s) => s.id === 'REV-YEST-SETTLEMENT-V2');
        const v1Snapshot = revenueSnapshots.find((s) => s.id === 'REV-YEST-SETTLEMENT-V1') || revenueSnapshots[0];
        
        // 门禁：正式结算报表必须依赖已完成 T+1 结算，且置信度 >= 95.0%
        if (params.isFormalSettlement) {
          const targetSnapshot = v2Snapshot || v1Snapshot;
          if (!v2Snapshot && targetSnapshot && targetSnapshot.dataConfidencePercent < 95.0) {
            return {
              success: false,
              blocked: true,
              message: `【正式结算门禁拦截】所选结算周期数据置信度为 ${targetSnapshot.dataConfidencePercent}%，低于 95.0% 财务正式对账门禁，无法生成正式结算报表。`,
              recoveryAdvice: '恢复路径：当前周期存在储能通信中断等数据缺失。请前往【数据质量】核验补采插补，并在【运营收益】中心发起“收益 V2 修正重算”，待生成 V2 且置信度达标后即可生成正式结算报表；或者取消“标记为正式结算报表”，生成带风险提示的测算日报草稿。',
            };
          }
        }
      }

      // 门禁规则 2：数据质量异常时的运营日报
      const hasCriticalQualityIssue = qualityIssues.some(
        (q) => (q.level === 'CRITICAL' || q.status === 'PENDING') && q.status !== 'RESOLVED'
      );

      let reportCode = '';
      let defaultTitle = '';
      let summary = '';
      let version = 'V1.0';
      let revenueSnapshotId = '';
      let revenueSnapshotVersion = 'V1';
      let tariffVersion = tariffScheme.currentVersion;
      let revenueType: 'ESTIMATE' | 'SETTLEMENT' = 'SETTLEMENT';
      let isSettlementFormal = Boolean(params.isFormalSettlement);
      let hasRiskWarning = false;
      let riskDescription = '';
      let dataConfidencePercent = 99.2;
      let qualityLevel: 'NORMAL' | 'SUSPICIOUS' | 'ANOMALY' | 'PATCHED' = 'NORMAL';
      let payload: any = {};

      if (params.type === 'DAILY_OPERATION') {
        reportCode = `RPT-DAILY-${params.period.replace(/[^0-9]/g, '') || Date.now()}`;
        defaultTitle = `低碳园区微电网日度综合运营报表 (${params.period})`;
        
        if (hasCriticalQualityIssue || scenario === 'SCENARIO_B') {
          hasRiskWarning = true;
          isSettlementFormal = false;
          revenueType = 'ESTIMATE';
          dataConfidencePercent = 71.4;
          qualityLevel = 'ANOMALY';
          riskDescription = '储能 EMS 通信链路中断，昨日套利存在 3 个采集周期数据缺失，收益数据仅供测算参考，不得用于正式财务对账。';
          summary = `全站光伏发电 2,350 kWh，充电桩消纳 890 kWh，关口购电 1,480 kWh。因储能 EMS 出现通信中断，削峰放电数据受损，昨日综合收益估算为 1,984.00 元（置信度 71.4%），包含 1 起未闭环通信告警。`;
        } else {
          summary = `全站光伏发电 ${telemetry.pvDailyGenKwh.toFixed(1)} kWh，充电桩消纳 ${telemetry.chargingDailyKwh.toFixed(1)} kWh，关口购电 1,420 kWh，综合收益 1,984.00 元。设备可用率 99.6%，系统运行平稳。`;
        }

        payload = {
          pvGenerationKwh: telemetry.pvDailyGenKwh,
          chargingKwh: telemetry.chargingDailyKwh,
          gridPurchaseKwh: 1420.0,
          gridFeedInKwh: 188.5,
          storageChargeKwh: scenario === 'SCENARIO_B' ? 450.0 : 650.0,
          storageDischargeKwh: scenario === 'SCENARIO_B' ? 320.0 : 580.0,
          pvRevenue: 3840.0,
          storageArbitrage: scenario === 'SCENARIO_B' ? 1650.0 : 1936.5,
          chargingRevenue: 2480.0,
          gridPurchaseCost: 4920.0,
          capacityBaseFee: 1066.0,
          netComprehensiveRevenue: scenario === 'SCENARIO_B' ? 1984.0 : 2270.5,
          totalAlarms: alarms.length,
          criticalAlarms: alarms.filter((a) => a.severity === 'CRITICAL' && a.status !== 'CLOSED').length,
          deviceAvailabilityRate: 99.6,
          detailsList: [
            { time: '00:00~06:00', item: '谷段储能充电与基础受电', value: 650, unit: 'kWh', status: '正常' },
            { time: '08:00~11:00', item: '光伏并网大发与削峰', value: 980, unit: 'kWh', status: '正常' },
            { time: '11:00~14:00', item: '园区充电桩群集中消纳', value: 1120, unit: 'kWh', status: '正常' },
            { time: '17:00~21:00', item: '晚高峰削峰放电', value: 380, unit: 'kWh', status: hasRiskWarning ? '遥测缺失' : '正常' },
          ],
        };
      } else if (params.type === 'MONTHLY_SUMMARY' || params.type === 'MONTHLY_SETTLEMENT') {
        reportCode = `RPT-MONTHLY-${params.period.replace(/[^0-9]/g, '') || '202609'}`;
        defaultTitle = `示范站 ${params.period} 能效与综合收益月度报表`;
        dataConfidencePercent = 99.4;
        summary = `全月微电网累计光伏发电 74,400 kWh，储能累计套利放电 17,400 kWh，充电桩群服务充电 27,600 kWh，月度综合净收益 59,520.00 元。月内清洗插补 2 次，平均数据置信度 99.4%。`;
        payload = {
          pvGenerationKwh: 74400.0,
          chargingKwh: 27600.0,
          gridPurchaseKwh: 42600.0,
          storageChargeKwh: 19500.0,
          storageDischargeKwh: 17400.0,
          pvRevenue: 115200.0,
          storageArbitrage: 49500.0,
          chargingRevenue: 74400.0,
          gridPurchaseCost: 147600.0,
          capacityBaseFee: 31980.0,
          netComprehensiveRevenue: 59520.0,
          totalAlarms: alarms.length,
          deviceAvailabilityRate: 99.8,
          qualityIssueCount: 2,
          patchedPointsCount: 18,
          detailsList: [
            { time: '第1周', item: '周度能效与收益', value: 13240.0, unit: '元', status: '正常' },
            { time: '第2周', item: '周度能效与收益', value: 14120.0, unit: '元', status: '正常' },
            { time: '第3周', item: '周度能效与收益', value: 16210.0, unit: '元', status: '正常' },
            { time: '第4周', item: '周度能效与收益', value: 15950.0, unit: '元', status: '正常' },
          ],
        };
      } else if (params.type === 'REVENUE_SETTLEMENT') {
        const v2Snapshot = revenueSnapshots.find((s) => s.id === 'REV-YEST-SETTLEMENT-V2');
        if (v2Snapshot) {
          version = 'V2.0';
          revenueSnapshotId = 'REV-YEST-SETTLEMENT-V2';
          revenueSnapshotVersion = 'V2';
          reportCode = `RPT-REV-${params.period.replace(/[^0-9]/g, '')}-V2`;
          defaultTitle = `示范站 T+1 收益结算报表 (${params.period} 修正重算版 V2.0)`;
          dataConfidencePercent = 99.5;
          qualityLevel = 'PATCHED';
          isSettlementFormal = true;
          summary = `【正式结算报表】基于历史断线补采插补数据与 ${tariffVersion} 电价重新核算，净收益由 1,984.00 元修正为 2,270.50 元 (+286.50 元)。数据置信度 99.5%，已通过正式结算门禁，归档保留原版 V1 对比。`;
          payload = {
            pvRevenue: v2Snapshot.pvRevenue,
            storageArbitrage: v2Snapshot.storageArbitrage,
            chargingRevenue: v2Snapshot.chargingRevenue,
            gridPurchaseCost: v2Snapshot.gridPurchaseCost,
            capacityBaseFee: v2Snapshot.capacityBaseFee,
            netComprehensiveRevenue: v2Snapshot.netComprehensiveRevenue,
            dataConfidencePercent: 99.5,
            recalcBatchTraceId: v2Snapshot.lastCalcTime,
            detailsList: [
              { time: params.period, item: '屋顶光伏余电上网及自用收益', value: '+3,840.00', unit: '元', status: '正常' },
              { time: params.period, item: '电化学储能削峰填谷套利 (补全重算)', value: '+1,936.50', unit: '元', status: '已修正重算', note: '补录断线 3 周期' },
              { time: params.period, item: '充电服务费与代收电费', value: '+2,480.00', unit: '元', status: '正常' },
              { time: params.period, item: '关口电网购电费用支出', value: '-4,920.00', unit: '元', status: '正常' },
              { time: params.period, item: '变压器需量基本电费分摊', value: '-1,066.00', unit: '元', status: '正常' },
            ],
          };
        } else {
          version = 'V1.0';
          revenueSnapshotId = 'REV-YEST-SETTLEMENT-V1';
          revenueSnapshotVersion = 'V1';
          reportCode = `RPT-REV-${params.period.replace(/[^0-9]/g, '')}-V1`;
          defaultTitle = `示范站 T+1 收益结算报表 (${params.period} 原始核算 V1.0)`;
          
          if (scenario === 'SCENARIO_B') {
            hasRiskWarning = true;
            isSettlementFormal = false;
            revenueType = 'ESTIMATE';
            dataConfidencePercent = 71.4;
            qualityLevel = 'ANOMALY';
            riskDescription = '储能 EMS 通信前置断线导致套利收益少计，置信度 71.4% < 95.0% 门禁，当前仅作为测算底稿。';
            summary = `【数据质量风险提示】因储能 EMS 通信断线，数据置信度 71.4%，净收益估算为 1,984.00 元。正式财务结算已阻断，待通信消缺与 V2 重算。`;
          } else {
            summary = `【结算报表】T+1 收益核算完成，全站昨日综合净收益 1,984.00 元，数据置信度 99.2%，符合正式结算门禁。`;
          }

          payload = {
            pvRevenue: 3840.0,
            storageArbitrage: 1650.0,
            chargingRevenue: 2480.0,
            gridPurchaseCost: 4920.0,
            capacityBaseFee: 1066.0,
            netComprehensiveRevenue: 1984.0,
            dataConfidencePercent,
            recalcBatchTraceId: '无 (原始初核)',
            detailsList: [
              { time: params.period, item: '屋顶光伏余电上网及自用收益', value: '+3,840.00', unit: '元', status: '正常' },
              { time: params.period, item: '电化学储能削峰填谷套利', value: '+1,650.00', unit: '元', status: hasRiskWarning ? '少计' : '正常' },
              { time: params.period, item: '充电服务费与代收电费', value: '+2,480.00', unit: '元', status: '正常' },
              { time: params.period, item: '关口电网购电费用支出', value: '-4,920.00', unit: '元', status: '正常' },
              { time: params.period, item: '变压器需量基本电费分摊', value: '-1,066.00', unit: '元', status: '正常' },
            ],
          };
        }
      } else if (params.type === 'PATROL_MAINTENANCE') {
        reportCode = `RPT-PATROL-${Date.now().toString().slice(-6)}`;
        defaultTitle = `示范站现场运维巡检与隐患整改报表 (${params.period})`;
        dataConfidencePercent = 100.0;
        summary = `周期内执行例行巡检与专项点检任务 ${patrolTasks.length} 项，巡检完成率 100%，发现设备异常 ${workOrders.length} 起，工单闭环率 100%，设备运行可用率 99.7%。`;
        payload = {
          patrolPlansCount: patrolPlans.length,
          patrolTasksCount: patrolTasks.length,
          patrolCompletionRate: 100.0,
          patrolAbnormalCount: workOrders.length,
          workOrdersCount: workOrders.length,
          closedWorkOrdersCount: workOrders.filter((w) => w.status === 'CLOSED').length,
          totalAlarms: alarms.length,
          deviceAvailabilityRate: 99.7,
          detailsList: patrolRecords.map((r) => ({
            time: r.submittedTime,
            item: r.taskTitle || '例行点检',
            value: `${r.items.length}项点检 / ${r.abnormalCount || 0}项异常`,
            unit: '点检记录',
            status: r.abnormalCount ? '已现场处置' : '合格',
            note: r.abnormalSummary || r.inspectorRemark,
          })),
        };
      }

      const newReport: ReportItem = {
        id: reportId,
        reportCode,
        title: params.title || defaultTitle,
        type: params.type,
        period: params.period,
        generatedTime: nowStr,
        author: currentUser.name,
        status: 'COMPLETED',
        summary: params.customNotes ? `${params.customNotes} | ${summary}` : summary,
        fileSize: '1.42 MB (CSV/PDF)',
        siteId: site.id,
        siteName: site.name,
        version,
        tariffVersion,
        tariffSchemeId: tariffScheme.id,
        revenueSnapshotId,
        revenueSnapshotVersion,
        revenueType,
        isSettlementFormal,
        hasRiskWarning,
        riskDescription,
        dataConfidencePercent,
        qualityLevel,
        traceId,
        payload,
        versions: [
          {
            version,
            generatedTime: nowStr,
            author: currentUser.name,
            tariffVersion,
            revenueSnapshotVersion,
            revenueSnapshotId,
            dataConfidencePercent,
            qualityFlag: qualityLevel,
            changeReason: '用户在报表中心发起生成任务',
            fileSize: '1.42 MB',
            traceId,
          },
        ],
      };

      setReports((prev) => [newReport, ...prev]);
      addAuditLog({
        targetObject: `报表中心 (${newReport.reportCode})`,
        action: '生成运营分析报表',
        oldState: '无',
        newState: `${newReport.title} [${version}]`,
        reason: `运营人员发起 ${newReport.type} 类型报表生成，周期 ${params.period}`,
      });

      return {
        success: true,
        message: `报表《${newReport.title}》已成功生成并归档！版本：${version}`,
        report: newReport,
      };
    },
    [
      revenueSnapshots,
      qualityIssues,
      scenario,
      telemetry,
      alarms,
      patrolPlans,
      patrolTasks,
      patrolRecords,
      workOrders,
      tariffScheme,
      currentUser.name,
      site.id,
      site.name,
      addAuditLog,
    ]
  );

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        isSessionExpired,
        simulateSessionExpiry,
        dismissSessionExpiry,
        currentRole,
        currentUser,
        switchRole,
        scenario,
        switchScenario,
        resetDemoData,
        mockMode,
        setMockMode,
        site,
        telemetry,
        adapters,
        devices,
        points,
        qualityIssues,
        tariffScheme,
        tariffSchemes,
        revenueSnapshots,
        recalcBatches,
        alarms,
        agentEvents,
        patrolPlans,
        patrolTasks,
        patrolRecords,
        workOrders,
        auditLogs,
        reports,
        metrics,
        sites,
        updateSite,
        addSite,
        switchSite,
        deleteSite,
        updateTariffScheme,
        updateDevice,
        updatePoint,
        disablePoint,
        disableDevice,
        updateMetric,
        addDevice,
        deleteDevice,
        addPoint,
        deletePoint,
        addMetric,
        deleteMetric,
        batchImportPoints,
        addAuditLog,
        authorizeTariffVersion,
        rejectTariffVersion,
        createTariffDraft,
        updateTariffVersion,
        submitTariffVersion,
        deleteTariffVersion,
        verifyAdapter,
        retryAdapter,
        syncAdapter,
        resolveQualityIssue,
        ackAlarm,
        closeAlarm,
        acknowledgeAlarm: ackAlarm,
        resolveAlarm: closeAlarm,
        ignoreAlarm,
        createWorkOrderFromAlarm,
        createPatrolTaskFromAlarm,
        agentDegradedMode,
        toggleAgentDegradedMode,
        adoptAgentEvent,
        archiveAgentEvent,
        handleAgentDecision,
        createPatrolPlan,
        updatePatrolPlan,
        togglePatrolPlanStatus,
        cancelPatrolPlan,
        generateTaskFromPlan,
        createManualPatrolTask,
        acceptPatrolTask,
        reassignPatrolTask,
        archivePatrolTask,
        convertTaskAnomalyToWorkOrder,
        toggleTaskOffline,
        updateTaskProgress,
        submitTask,
        executePatrolTask,
        submitPatrolTask,
        syncOfflineTask,
        createWorkOrder,
        acceptWorkOrder,
        reassignWorkOrder,
        submitWorkOrderResolution,
        reviewWorkOrder,
        initiateRevenueRecalculation,
        addReport,
        deleteReport,
        generateReportItem,
        users,
        rolePermissions,
        healthItems,
        healthCheckStatus,
        healthSimMode,
        lastHealthCheckedTime,
        addUser,
        toggleUserStatus,
        reassignUserTasksAndDeactivate,
        resetUserPassword,
        updateRolePermission,
        hasPermission,
        runHealthCheck,
        setHealthSimulationMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
