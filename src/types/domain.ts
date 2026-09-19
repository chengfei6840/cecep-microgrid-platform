/**
 * 中节能低碳园区微电网数字化平台 - 核心领域模型与状态定义
 * 一期试点站点：低碳园区示范站
 */

export type UserRole = 'ADMIN' | 'OPERATOR' | 'INSPECTOR';

export type ScenarioType = 'SCENARIO_A' | 'SCENARIO_B';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  phone: string;
  avatar?: string;
  status?: 'ACTIVE' | 'DISABLED';
  email?: string;
  wechat?: string;
  lastLoginTime?: string;
  createdAt?: string;
}

export interface Permission {
  code: string;
  name: string;
  module: string;
  description: string;
}

export interface Role {
  id: UserRole;
  name: string;
  description: string;
  defaultLandingRoute: string;
  permissions: string[];
}

export interface Site {
  id: string;
  name: string;
  code: string;
  location: string;
  address?: string;
  pvCapacity: string; // e.g. "1.2 MWp"
  pvCapacityKwp?: number; // e.g. 1200
  storageCapacity: string; // e.g. "500 kW / 1000 kWh"
  storageCapacityKwh?: number; // e.g. 1000
  chargerCount: number; // e.g. 12 台双枪快充
  status: 'ONLINE' | 'WARNING' | 'OFFLINE';
  gridVoltage: string; // e.g. "10 kV"
  transformerCapacity: string; // e.g. "2000 kVA"
  commissioningDate: string; // e.g. "2025-08-18"
  updatedAt?: string;
}

export type AdapterType = 'PV_INVERTER' | 'STORAGE_EMS' | 'CHARGING_PLATFORM' | 'GRID_METER' | 'WEATHER_STATION';
export type AdapterStatus = 'UNCONFIGURED' | 'VERIFYING' | 'ONLINE' | 'RETRYING' | 'FAILED';

export interface IntegrationAdapter {
  id: string;
  type: AdapterType;
  platformName: string;
  protocol: string; // e.g. "Modbus-TCP", "MQTT", "REST API"
  authType: 'API_KEY' | 'TOKEN_BEARER' | 'CERTIFICATE' | 'SIMULATED_MOCK';
  syncMode: 'REALTIME_PUSH' | 'INTERVAL_POLL_1M' | 'INTERVAL_POLL_5M';
  status: AdapterStatus;
  lastSyncTime: string;
  consecutiveFailures: number;
  errorDetail?: string;
  endpoint?: string;
  credentialsMasked?: string;
  syncFrequencySec?: number;
  errorMessage?: string;
}

export interface SyncJob {
  id: string;
  adapterId: string;
  type: 'SCHEDULED' | 'MANUAL_RETRY' | 'HISTORICAL_BACKFILL';
  startTime: string;
  endTime?: string;
  progress: number; // 0 - 100
  result: 'RUNNING' | 'SUCCESS' | 'FAILED';
  failedReason?: string;
  retryCount: number;
  traceId: string;
}

export type DeviceType =
  | 'INVERTER'
  | 'PCS'
  | 'BATTERY_CLUSTER'
  | 'CHARGER_DC'
  | 'CHARGER_AC'
  | 'SMART_METER'
  | 'WEATHER_STATION'
  | 'PV_INVERTER'
  | 'ENERGY_STORAGE'
  | 'CHARGING_STATION'
  | 'GRID_METER';

export interface Device {
  id: string;
  siteId: string;
  name: string;
  type: DeviceType;
  manufacturer: string;
  model: string;
  ratedCapacity: string;
  sourceAdapterId: string;
  sourcePlatform?: string;
  status: 'NORMAL' | 'ALARM' | 'OFFLINE' | 'SUSPICIOUS' | 'DISABLED';
  lastDataTime: string;
}

export type QualityLevel = 'NORMAL' | 'PATCHED' | 'SUSPICIOUS' | 'ANOMALY';

export interface Point {
  id: string;
  deviceId: string;
  pointName: string;
  standardCode: string;
  thirdPartyField: string;
  unit: string;
  dataType: 'FLOAT' | 'INT' | 'BOOLEAN' | 'ENUM';
  lowerLimit?: number;
  upperLimit?: number;
  mappingStatus: 'MAPPED' | 'PENDING' | 'UNMAPPED';
  currentValue?: number | string;
  currentQuality: QualityLevel;
  lastUpdated: string;
  qualityRules?: string[];
  status?: 'ACTIVE' | 'DISABLED';
}

export interface Metric {
  id: string;
  siteId: string;
  name: string;
  code: string;
  calculationLogic: string;
  aggregationPeriod: 'REALTIME' | '5MIN' | 'HOURLY' | 'DAILY' | 'MONTHLY';
  unit: string;
  allowedQualityGrade: string[];
  downstreamUsage: string[];
  status: 'ACTIVE' | 'DISABLED';
}

export interface TelemetryRecord {
  id: string;
  siteId: string;
  deviceId: string;
  pointId: string;
  timestamp: string;
  value: number;
  quality: QualityLevel;
  sourceBatch: string;
}

export interface SiteTelemetry {
  pvActivePowerKw: number;
  pvDailyYieldKwh: number;
  pvDailyGenKwh: number;
  storageSocPercent: number;
  storagePowerKw: number;
  chargingLoadKw: number;
  chargingDailyKwh: number;
  gridPowerKw: number;
  ambientTempC: number;
  solarIrradiationWm2: number;
}

export type QualityIssueDimension = 'CONTINUITY' | 'RANGE_LIMIT' | 'MUTATION_SPIKE' | 'TIMEOUT';
export type QualityIssueStatus = 'PENDING' | 'BACKFILLING' | 'MANUAL_IMPORTING' | 'VERIFYING' | 'RESOLVED';

export interface DataQualityIssue {
  id: string;
  dimension: QualityIssueDimension;
  dimensionLabel: string;
  level: 'CRITICAL' | 'WARN' | 'INFO';
  targetDevice: string;
  targetPoint: string;
  discoveredTime: string;
  status: QualityIssueStatus;
  resolutionMode?: 'AUTO_BACKFILL' | 'MANUAL_INTERVENTION' | 'RULE_OVERRIDE';
  backfillBatchId?: string;
  description: string;
  impactScore: string; // e.g. "影响昨日收益置信度 (-18%)"
}

export type TariffType = 'TOU_GRID_PURCHASE' | 'PV_FEED_IN' | 'CHARGING_SERVICE' | 'CAPACITY_BASE';

export interface TariffTimeSlot {
  label: '尖峰' | '高峰' | '平段' | '低谷' | '深谷';
  period: string; // e.g. "19:00 - 21:00"
  price: number; // 元/kWh
  type?: string;
}

export type TariffVersionStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'EFFECTIVE' | 'REJECTED' | 'EXPIRED';

export interface TariffTimeInterval {
  id: string;
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
  label: '尖峰' | '高峰' | '平段' | '低谷' | '深谷';
  price: number; // 元/kWh
}

export interface PvFeedInConfig {
  mode: 'FIXED' | 'TIERED' | 'MARKET';
  fixedPrice?: number;
  tieredConfig?: {
    thresholdKwh: number;
    tier1Price: number;
    tier2Price: number;
  };
  marketConfig?: {
    basePrice: number;
    floatingSpread: number;
  };
  description?: string;
}

export interface ChargingTariffConfig {
  serviceFee: number; // 元/kWh
  energyPriceTou: {
    sharp: number;
    peak: number;
    flat: number;
    valley: number;
    deepValley: number;
  };
}

export interface BasicFeeConfig {
  type: 'CAPACITY' | 'DEMAND'; // 容量电费 或 需量电费
  capacityUnitPrice?: number; // 元/kVA/月
  demandUnitPrice?: number; // 元/kW/月
  declaredDemandKw?: number;
  transformerCapacityKva?: number;
  description?: string;
}

export interface TariffApprovalRecord {
  id: string;
  versionNumber: string;
  action: 'CREATE_DRAFT' | 'SUBMIT' | 'AUTHORIZE' | 'REJECT';
  actionName: string;
  operatorName: string;
  role: UserRole;
  timestamp: string;
  notes?: string;
}

export interface TariffVersion {
  id: string;
  schemeId: string;
  versionNumber: string; // e.g. "V1.0", "V2.0"
  effectiveDateStart: string;
  effectiveDateEnd: string;
  effectiveDate?: string;
  authorizedAt?: string;
  slots: TariffTimeSlot[];
  timeIntervals?: TariffTimeInterval[];
  serviceFeeOrBaseFee: string; // e.g. "服务费: 0.35元/kWh" 或 "基本电费: 32元/kVA/月"
  status: TariffVersionStatus;
  creator: string;
  approver?: string;
  approvalTime?: string;
  submitTime?: string;
  rejectReason?: string;
  notes: string;
  pvConfig?: PvFeedInConfig;
  chargingConfig?: ChargingTariffConfig;
  basicFeeConfig?: BasicFeeConfig;
  approvalRecords?: TariffApprovalRecord[];
}

export interface TariffScheme {
  id: string;
  siteId: string;
  name: string;
  type: TariffType;
  status: 'ACTIVE' | 'UPDATING';
  currentVersion: string;
  versions: TariffVersion[];
}

export type RevenueSnapshotType = 'ESTIMATE' | 'SETTLEMENT';

export interface RevenueSnapshot {
  id: string;
  siteId: string;
  dateKey: string; // "今日" 或 "昨日(T+1)"
  calcType: RevenueSnapshotType; // 实时估算 vs T+1日终结算
  pvRevenue: number; // 光伏发电自用及上网收益 (元)
  storageArbitrage: number; // 储能峰谷套利收益 (元)
  chargingRevenue: number; // 充电服务综合收入 (元)
  gridPurchaseCost: number; // 购电支出成本 (元)
  capacityBaseFee: number; // 需量/变压器基本电费分摊 (元)
  netComprehensiveRevenue: number; // 综合收益 (元)
  dataConfidencePercent: number; // 置信度 (98%, 异常时降为 72%)
  referencedTariffVersion: string; // e.g. "V1.0"
  qualityFlag: 'NORMAL' | 'RISK_WARNING' | 'RECALCULATED';
  warningMessage?: string;
  lastCalcTime: string;
}

export interface RecalculationBatch {
  id: string;
  reason: string;
  dateRange: string;
  originalVersion: string;
  targetVersion: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'AWAITING_CONFIRM';
  initiator: string;
  initiateTime: string;
  completeTime?: string;
  varianceAmount: number; // 收益差异额 (元)
  v1NetRevenue: number;
  v2NetRevenue: number;
  traceId: string;
}

export type AlarmSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING';
export type AlarmStatus = 'PENDING_ACK' | 'PROCESSING' | 'RESOLVED' | 'CLOSED' | 'FALSE_ALARM' | 'IGNORED';
export type AlarmSource = 'DEVICE' | 'INTERFACE' | 'DATA_QUALITY' | 'THRESHOLD' | 'EMS' | 'SECURITY';

export interface AlarmTimelineItem {
  time: string;
  operator: string;
  action: string;
  note?: string;
}

export interface AlarmEvidence {
  code?: string;
  telemetryValue?: string;
  thresholdValue?: string;
  logSnippet?: string;
  impactSummary?: string;
  waveformUrl?: string;
}

export interface Alarm {
  id: string;
  alarmCode?: string;
  source: AlarmSource;
  isThirdParty?: boolean;
  thirdPartySource?: string;
  severity: AlarmSeverity;
  siteId?: string;
  siteName?: string;
  deviceId?: string;
  deviceName: string;
  adapterId?: string;
  pointId?: string;
  standardCode?: string;
  alarmTitle: string;
  description?: string;
  triggeredAt?: string;
  firstOccurrenceTime: string;
  lastOccurrenceTime?: string;
  slaDeadlineTime: string; // 紧急15分确认/30分处置; 一般30分确认/2小时处置
  slaConfirmDeadline?: string;
  slaHandleDeadline?: string;
  status: AlarmStatus;
  reason: string;
  traceId?: string;
  qualityLevel?: QualityLevel;
  qualityIssueId?: string;
  agentEventId?: string;
  agentAnalysisStatus?: 'ANALYZED' | 'ANALYZING' | 'NOT_AVAILABLE' | 'AWAITING_DECISION';
  agentSuggestion?: string;
  agentConfidenceScore?: number;
  handledBy?: string;
  actionTaken?: string;
  ignoreReason?: string;
  isOverdue?: boolean;
  linkedTaskId?: string;
  linkedTaskCode?: string;
  linkedWorkOrderId?: string;
  linkedWorkOrderCode?: string;
  evidenceDetails?: AlarmEvidence;
  timeline?: AlarmTimelineItem[];
}

export type AgentType = 'DATA_INGESTION' | 'OPERATIONS_REVENUE' | 'PATROL_MAINTENANCE';
export type AgentPriority = 'P1' | 'P2' | 'P3';
export type AgentEventStatus =
  | 'NEW'
  | 'ANALYZING'
  | 'AWAITING_DECISION'
  | 'DEFERRED'
  | 'REJECTED'
  | 'DISPATCHED_PATROL'
  | 'DISPATCHED_ORDER'
  | 'ARCHIVED'
  | 'ACCEPTED';

export interface AgentEventActionRecord {
  time: string;
  operator: string;
  action: string;
  note: string;
}

export interface AgentEvent {
  id: string;
  agentPriority: AgentPriority; // P1 / P2 / P3 (Agent事件优先级，不得与告警紧急/一般混成一个字段)
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'; // 兼容旧字段
  title: string;
  agentType: AgentType;
  agentName: string;
  targetObject: string;
  ruleEvidence: string[];
  ruleMatched?: string;
  triggerTime?: string;
  sla?: string;
  status: AgentEventStatus;
  traceId: string;
  sourcePage: string; // 来源页面: 数据接入 / 运营收益 / 实时告警 / 巡检工单
  degradedStatus: boolean; // 是否处于 Agent 降级状态
  aiSummary: string;
  templateSummary?: string; // 降级时的规则模板摘要
  confidenceScore: number; // e.g. 92
  revenueImpactEstimate: string; // 预估收益影响
  suggestedAction: string;
  relatedAlarmCode?: string;
  relatedAdapterId?: string;
  relatedQualityIssueId?: string;
  relatedTariffVersion?: string;
  linkedTaskId?: string;
  linkedTaskCode?: string;
  linkedWorkOrderId?: string;
  linkedWorkOrderCode?: string;
  deferReason?: string;
  rejectReason?: string;
  archiveNote?: string;
  actionHistory: AgentEventActionRecord[];
}

export interface PatrolPlanItemTemplate {
  id: string;
  itemName: string;
  method: string;
  standard: string;
  deviceTarget?: string;
}

export type PatrolPlanCycle = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPECIAL';

export interface PatrolPlan {
  id: string;
  planCode?: string;
  planName: string;
  cycle: PatrolPlanCycle;
  route: string;
  deviceScope: string[];
  templateItemsCount?: number;
  templateItems?: PatrolPlanItemTemplate[];
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  responsiblePerson?: string;
  startDate?: string;
  endDate?: string;
  version?: string;
  description?: string;
  lastGeneratedAt?: string;
  nextRunTime?: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export type PatrolTaskStatus =
  | 'PENDING_ACCEPT'
  | 'PENDING_START'
  | 'IN_PROGRESS'
  | 'PENDING_SUBMIT'
  | 'SUBMITTED'
  | 'ARCHIVED';

export type PatrolTaskSource = 'PLAN' | 'ALARM' | 'TEMP' | 'MANUAL';

export interface PatrolTaskCheckItem {
  id: string;
  itemName: string;
  method: string;
  standard: string;
  result: 'NORMAL' | 'ANOMALY' | 'UNCHECKED';
  deviceTarget?: string;
  remark?: string;
}

export interface PatrolTask {
  id: string;
  planId?: string;
  planName?: string;
  planVersionSnapshot?: string;
  taskCode: string;
  title?: string;
  taskName?: string;
  source?: PatrolTaskSource;
  sourceId?: string;
  targetZone?: string;
  deadlineTime?: string;
  description?: string;
  planDeadline?: string;
  assignee: string;
  deviceList: string[];
  plannedDate: string;
  status: PatrolTaskStatus;
  isOffline: boolean; // 是否处于离线暂存状态
  offlineItemsCompleted?: number;
  totalItems: number;
  hasAbnormality: boolean;
  linkedAlarmId?: string;
  linkedAlarmCode?: string;
  linkedWorkOrderId?: string;
  linkedWorkOrderCode?: string;
  traceId?: string;
  checkItems?: PatrolTaskCheckItem[];
  checklist?: Array<{
    id: string;
    name?: string;
    itemName?: string;
    itemTitle?: string;
    standard?: string;
    result?: string;
    status?: string;
    isChecked?: boolean;
  }>;
  submittedAt?: string;
  submittedBy?: string;
  archivedAt?: string;
  archivedBy?: string;
  inspectorRemark?: string;
  hasPhotoPlaceholder?: boolean;
  photoPlaceholderNote?: string;
}

export interface PatrolRecordItem {
  id: string;
  deviceName: string;
  itemTitle: string;
  standard: string;
  result: 'NORMAL' | 'ABNORMAL' | 'NOT_CHECKED';
  remark?: string;
  hasPhotoPlaceholder: boolean;
  photoUrl?: string;
  photoMeta?: {
    timestamp: string;
    coordinate: string;
    locationName: string;
  };
}

export interface PatrolRecord {
  id: string;
  recordCode?: string;
  taskId: string;
  taskCode?: string;
  taskTitle?: string;
  taskSource?: PatrolTaskSource;
  planId?: string;
  planName?: string;
  planVersionSnapshot?: string; // 执行时的版本快照
  submitter: string;
  submittedTime: string;
  archivedTime?: string;
  archivedBy?: string;
  syncStatus: 'SYNCED' | 'LOCAL_OFFLINE_QUEUED';
  devices?: string[];
  items: PatrolRecordItem[];
  abnormalCount?: number;
  abnormalSummary?: string;
  linkedAlarmCode?: string;
  linkedWorkOrderCode?: string;
  traceId?: string;
  inspectorRemark?: string;
  status?: 'SUBMITTED' | 'ARCHIVED';
}

export type WorkOrderStatus = 'PENDING_ACCEPT' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'CLOSED';

export interface WorkOrderHandlingRecord {
  time: string;
  operator: string;
  action: string;
  evidence?: string;
  note?: string;
}

export interface WorkOrderRejectionRecord {
  time: string;
  reviewer: string;
  reason: string;
}

export interface WorkOrder {
  id: string;
  orderCode: string;
  title: string;
  description?: string;
  createdAt?: string;
  deadline?: string;
  resolutionNotes?: string;
  source: 'ALARM' | 'PATROL_ABNORMALITY' | 'AGENT_RECOMMENDATION' | 'MANUAL';
  sourceId?: string;
  sourceAlarmCode?: string;
  sourceTaskCode?: string;
  linkedAlarmCode?: string;
  linkedTaskId?: string;
  traceId?: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assignee: string; // 巡检/维护人
  status: WorkOrderStatus;
  issueDescription: string;
  handlingEvidence?: string; // 处理说明与照片占位
  handledTime?: string;
  resolvedAt?: string;
  reviewer?: string; // 运营人员
  reviewedBy?: string;
  reviewedTime?: string;
  reviewedAt?: string;
  rejectionReason?: string; // 退回整改原因
  rejectionHistory?: WorkOrderRejectionRecord[]; // 完整退回历史
  handlingHistory?: WorkOrderHandlingRecord[]; // 完整处置记录
  deviceTarget?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  role: UserRole;
  operatorName: string;
  targetObject: string;
  action: string;
  oldState: string;
  newState: string;
  reason: string;
  traceId: string;
  result?: 'SUCCESS' | 'REJECTED' | 'BLOCKED' | 'FAILED';
  sourcePage?: string;
  relatedVersion?: string;
}

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'ERROR' | 'CHECKING';

export interface PlatformHealthItem {
  id: string;
  category: 'FRONTEND' | 'GATEWAY' | 'STORAGE' | 'STREAM' | 'ADAPTER' | 'AGENT';
  name: string;
  subType?: string;
  status: HealthStatus;
  latencyMs: number;
  lastChecked: string;
  description: string;
  abnormalImpact?: string;
  details?: Record<string, any>;
}

export type ReportType =
  | 'DAILY_OPERATION'      // 日报：发电、充放电、充电量、购售电、收益、告警、设备运行率
  | 'MONTHLY_SUMMARY'       // 月报：按月汇总上述指标和数据质量说明
  | 'MONTHLY_SETTLEMENT'    // 兼容历史月度结算类型
  | 'REVENUE_SETTLEMENT'    // 收益报表：明确引用估算或结算、TariffVersion 和 RevenueSnapshot 版本
  | 'PATROL_MAINTENANCE'    // 巡检报表：完成率、异常数、工单数和记录明细
  | 'QUALITY_AUDIT';        // 质量审计周报

export type ReportStatus =
  | 'COMPLETED'
  | 'GENERATING'
  | 'FAILED'
  | 'ARCHIVED'
  | 'DRAFT'
  | 'OUTDATED';

export interface ReportVersionRecord {
  version: string; // e.g. "V1.0", "V2.0"
  generatedTime: string;
  author: string;
  tariffVersion: string;
  revenueSnapshotVersion?: string;
  revenueSnapshotId?: string;
  dataConfidencePercent: number;
  qualityFlag: string;
  changeReason: string;
  fileSize: string;
  traceId?: string;
}

export interface ReportItem {
  id: string;
  reportCode: string;
  title: string;
  type: ReportType;
  period: string; // e.g. "2026-09-04", "2026-08", "2026-09-01 ~ 2026-09-04"
  generatedTime: string;
  author: string;
  status: ReportStatus;
  summary: string;
  fileSize: string;
  siteId?: string;
  siteName?: string;
  version: string; // e.g. "V1.0", "V2.0"
  // 核心版本与口径关联
  tariffVersion?: string;
  tariffSchemeId?: string;
  revenueSnapshotId?: string;
  revenueSnapshotVersion?: 'V1' | 'V2' | string;
  revenueType?: 'ESTIMATE' | 'SETTLEMENT'; // 【估算】或【结算】
  isSettlementFormal?: boolean; // 是否标记为正式结算报表（门禁：置信度必须>=95%且已完成T+1）
  hasRiskWarning?: boolean; // 是否包含质量风险
  riskDescription?: string; // 风险说明
  dataConfidencePercent?: number; // 数据置信度
  qualityLevel?: 'NORMAL' | 'SUSPICIOUS' | 'ANOMALY' | 'PATCHED';
  traceId?: string;
  // 聚合数据快照（与首页与收益中心同源）
  payload?: {
    // 电量指标 (kWh)
    pvGenerationKwh?: number;
    pvSelfConsumptionKwh?: number;
    chargingKwh?: number;
    gridPurchaseKwh?: number;
    gridFeedInKwh?: number;
    storageChargeKwh?: number;
    storageDischargeKwh?: number;
    storageLossKwh?: number;
    // 收益指标 (元)
    pvRevenue?: number;
    storageArbitrage?: number;
    chargingRevenue?: number;
    gridPurchaseCost?: number;
    capacityBaseFee?: number;
    netComprehensiveRevenue?: number;
    // 运维指标
    totalAlarms?: number;
    criticalAlarms?: number;
    deviceAvailabilityRate?: number; // e.g. 99.4%
    // 巡检专用指标
    patrolPlansCount?: number;
    patrolTasksCount?: number;
    patrolCompletionRate?: number; // e.g. 100%
    patrolAbnormalCount?: number;
    workOrdersCount?: number;
    closedWorkOrdersCount?: number;
    // 质量说明
    qualityIssueCount?: number;
    patchedPointsCount?: number;
    dataConfidencePercent?: number;
    recalcBatchTraceId?: string;
    detailsList?: Array<{
      time: string;
      item: string;
      value: string | number;
      unit: string;
      status: string;
      note?: string;
    }>;
  };
  // 版本演进轨迹
  versions?: ReportVersionRecord[];
  outdatedReason?: string;
}

