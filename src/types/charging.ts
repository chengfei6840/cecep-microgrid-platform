export type ChargerGunStatus = 'IDLE' | 'CHARGING' | 'FAULT' | 'OFFLINE';

export interface ChargerGun {
  gunCode: 'A' | 'B';
  gunId: string;
  status: ChargerGunStatus;
  currentPowerKw: number;
  voltageV: number;
  currentA: number;
  socPercent: number | null;
  chargingDurationMinutes: number | null;
  chargedEnergyKwh: number | null;
  gunTempC: number;
  currentOrderId?: string;
}

export type ChargerPileStatus = 'IDLE' | 'CHARGING' | 'FAULT' | 'OFFLINE';
export type ChargerPileType = 'DC_FAST_120' | 'DC_SUPER_180' | 'AC_SLOW_7';

export interface ChargerPile {
  id: string; // e.g. "DEV-CHG-01"
  pileCode: string; // e.g. "CHG-01"
  name: string; // e.g. "1# 120kW 双枪直流快充桩"
  type: ChargerPileType;
  typeLabel: string;
  ratedPowerKw: number;
  status: ChargerPileStatus;
  currentPowerKw: number;
  todayEnergyKwh: number;
  lastHeartbeat: string;
  associatedPlatform: string; // e.g. "星星充电运营平台 (协议对接)"
  ipAddress: string;
  guns: ChargerGun[];
  insulationResistanceMohm: number;
  ambientTempC: number;
  linkedAlarmId?: string;
  linkedAlarmTitle?: string;
}

export type ChargingOrderIntegrity = 'COMPLETED' | 'PENDING_SYNC' | 'FIELD_MISSING';
export type ChargingDataSource = 'PLATFORM_SYNC' | 'OFFLINE_BACKFILL' | 'SIMULATED_FEED';

export interface ChargingTimeSlotItem {
  slotLabel: '尖峰' | '高峰' | '平段' | '低谷' | '深谷';
  period: string;
  unitPrice: number; // 元/kWh
  energyKwh: number; // kWh
  amount: number; // 元
}

export interface ChargingOrder {
  orderId: string;
  pileId: string;
  pileCode: string;
  gunCode: '枪A' | '枪B';
  plateNumber: string;
  vehicleModel: string;
  vinMasked: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalEnergyKwh: number;
  timeSlotBreakdown: ChargingTimeSlotItem[];
  baseEnergyFee: number;
  serviceFeeUnitPrice: number;
  serviceFeeAmount: number;
  totalAmount: number;
  integrityStatus: ChargingOrderIntegrity;
  integrityNote?: string;
  isSettled: boolean; // T+1 前未完整拉取的订单为 false，不计入结算收益，只可进入估算
  dataSource: ChargingDataSource;
  dataSourceLabel: string;
  tariffVersionReferenced: string;
}

export interface ChargingTrendSample {
  timestamp: string;
  hour: number;
  chargingLoadKw: number;
  occupiedGuns: number;
  slotLabel: '尖峰' | '高峰' | '平段' | '低谷' | '深谷';
  slotPrice: number;
}

export interface ChargingKpis {
  activePowerKw: number;
  todayChargingKwh: number;
  totalPiles: number;
  onlinePiles: number;
  chargingPiles: number;
  idlePiles: number;
  faultPiles: number;
  offlinePiles: number;
  onlineRate: number; // %
  occupiedGuns: number;
  totalGuns: number;
  todaySettledRevenue: number; // 结算收益：仅统计 COMPLETED
  todayEstimatedRevenue: number; // 估算收益：含 PENDING_SYNC
  pendingSyncCount: number;
  pendingSyncAmount: number;
  referencedTariffVersion: string;
}

export type ChargingSimulatedState =
  | 'NORMAL'
  | 'ORDER_PENDING_SYNC'
  | 'ORDER_FIELD_MISSING'
  | 'ERROR'
  | 'NO_DEVICES'
  | 'FORBIDDEN';
