import { QualityLevel } from './domain';

export type RevenueBreakdownCategory =
  | 'PV_SELF'
  | 'PV_GRID'
  | 'STORAGE_DISCHARGE'
  | 'STORAGE_CHARGE'
  | 'CHARGING_ENERGY'
  | 'CHARGING_SERVICE'
  | 'GRID_PURCHASE'
  | 'CAPACITY_BASE';

export interface RevenueBreakdownItem {
  id: string;
  category: RevenueBreakdownCategory;
  categoryLabel: string;
  componentGroup: 'PV' | 'STORAGE' | 'CHARGING' | 'GRID' | 'BASE';
  timeslotLabel: string;
  energyKwh: number;
  unitPrice: number;
  pricingMode: string;
  amount: number; // 正值为收益，负值为支出
  quality: QualityLevel;
  confidencePercent: number;
  referencedTariffVersion: string;
  formulaText: string;
  dataSource: string;
  syncStatus: 'SYNCED' | 'PENDING_SYNC';
  qualityReason?: string;
  qualityIssueId?: string;
}

export interface RevenueKpiSummary {
  pvSelfRevenue: number;
  pvFeedInRevenue: number;
  pvTotalRevenue: number;
  storageDischargeRevenue: number;
  storageChargeCost: number;
  storageArbitrage: number;
  chargingEnergyRevenue: number;
  chargingServiceRevenue: number;
  chargingTotalRevenue: number;
  gridPurchaseCost: number;
  capacityBaseFee: number;
  netComprehensiveRevenue: number;
  dataConfidencePercent: number;
  referencedTariffVersion: string;
}

export interface RevenueTimeslotTrendItem {
  timeslot: string;
  label: string;
  pvRevenue: number;
  storageArbitrage: number;
  chargingRevenue: number;
  gridPurchaseCost: number;
  netRevenue: number;
}

export interface SettlementGateStatus {
  canSettle: boolean;
  hasEffectiveTariff: boolean;
  effectiveTariffVersion?: string;
  hasPendingSyncOrders: boolean;
  pendingSyncOrderCount: number;
  dataQualityStatus: 'NORMAL' | 'SUSPICIOUS' | 'ANOMALY';
  dataConfidencePercent: number;
  affectedScope?: string;
  blockReasons: string[];
  warnings: string[];
}

export interface RevenueAuditTimelineItem {
  step: number;
  title: string;
  time: string;
  operator: string;
  status: 'DONE' | 'CURRENT' | 'PENDING' | 'FAILED';
  detail: string;
}
