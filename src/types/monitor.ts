import { QualityLevel, DeviceType } from './domain';

// 统一功率符号与流动方向规范
export type PowerSubsystem = 'PV' | 'STORAGE' | 'CHARGING' | 'GRID' | 'LOAD';

export interface PowerConventionRule {
  subsystem: PowerSubsystem;
  name: string;
  positiveMeaning: string; // 正值含义
  negativeMeaning?: string; // 负值含义（针对双向设备）
  isBidirectional: boolean;
  standardUnit: 'kW';
  colorClass: string;
}

// 12 大监测受控运行状态定义
export type MonitorSystemState =
  | 'NORMAL' // 1. 正常运行
  | 'NO_DEVICES' // 2. 无设备
  | 'LOADING' // 3. 数据加载中
  | 'ERROR' // 4. 加载失败
  | 'PARTIAL_MISSING' // 5. 部分数据缺失
  | 'STREAM_INTERRUPTED' // 6. 实时流中断
  | 'FORBIDDEN' // 7. 无权限 (如巡检员访问桌面监控)
  | 'READ_ONLY' // 8. 只读监控模式
  | 'STALE_DATA' // 9. 过期数据 / 心跳停滞
  | 'SUSPICIOUS_ZERO' // 10. 白天零功率可疑
  | 'PARTIAL_OFFLINE' // 11. 逆变器部分离线
  | 'UNMAPPED'; // 12. 测点未映射

// 时间与指标统计口径
export type MetricTimeScope =
  | 'REALTIME' // 实时瞬时值 (kW, %, ℃, A, V)
  | 'TODAY_CUMULATIVE' // 当日累计 (kWh)
  | 'HISTORICAL_INTERVAL'; // 历史区间采样

// 统一监测测点结构
export interface UnifiedMonitorPoint {
  id: string; // 统一测点 ID (如 POINT-PV-PAC)
  deviceId: string; // 统一设备 ID (如 DEV-PV-INV01)
  deviceName: string;
  subsystem: PowerSubsystem;
  pointName: string;
  standardCode: string;
  value: number;
  formattedValue: string;
  unit: string;
  timeScope: MetricTimeScope;
  quality: QualityLevel | 'EXPIRED'; // 正常 | 补录 | 可疑 | 异常 | 过期
  qualitySource?: string; // 数据源 (如阳光电源 Modbus-TCP)
  qualityReason?: string; // 异常/补录原因
  lastUpdated: string;
  powerDirectionNote?: string; // 如 "+放电 / -充电"
  isBidirectional?: boolean;
}

// 统一监测设备结构
export interface UnifiedMonitorDevice {
  id: string; // 统一设备 ID
  siteId: string;
  name: string;
  type: DeviceType;
  subsystem: PowerSubsystem;
  manufacturer: string;
  model: string;
  ratedCapacity: string;
  status: 'NORMAL' | 'ALARM' | 'OFFLINE' | 'SUSPICIOUS' | 'DISABLED';
  lastDataTime: string;
  sourceAdapterId: string;
  sourcePlatform?: string;
  points: UnifiedMonitorPoint[];
  primaryPoint?: UnifiedMonitorPoint;
}

// 趋势采样点
export interface TrendPointSample {
  timestamp: string; // "14:00"
  hour: number;
  pvPowerKw: number; // 光伏发电 (>0)
  storagePowerKw: number; // 储能 (+放 / -充)
  chargingLoadKw: number; // 充电负荷 (>0)
  gridPowerKw: number; // 电网 (+购 / -售)
  isStorageAnomaly?: boolean;
  qualityNote?: string;
}

// 光伏出力与辐照度采样点 (实测历史对照，绝无预测)
export interface PvTrendSample {
  timestamp: string; // "12:00" 或 "12:15"
  hour: number;
  pvPowerKw: number; // 光伏实测功率 (kW)
  irradianceWm2: number; // 水平总辐照度 (W/m²)
  quality: QualityLevel;
  source: string;
  isNightZero?: boolean; // 夜间正常零值停机
  isSuspiciousZero?: boolean; // 白天异常零值
  suspiciousReason?: string;
  isDataMissing?: boolean; // 数据缺失断点 (杜绝虚假插值平滑)
}

// 光伏逆变器明细与关联工况
export interface PvInverterDetail extends UnifiedMonitorDevice {
  currentPowerKw: number; // 当前有功功率 (kW)
  dailyYieldKwh: number; // 今日累计发电量 (kWh)
  temperatureC: number; // 机内 IGBT/模块温度 (℃)
  dcVoltageV?: number; // 直流侧母线输入电压 (V)
  dcCurrentA?: number; // 直流侧母线输入电流 (A)
  efficiencyPercent?: number; // 逆变转换效率 (%)
  linkedAlarms?: Array<{
    id: string;
    title: string;
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
    time: string;
    description: string;
  }>;
}

// 储能充放电与 SOC 实测采样点 (双轴实测，杜绝预测)
export interface StorageTrendSample {
  timestamp: string; // "04:00" 或 "05:15"
  hour: number;
  pcsPowerKw: number | null; // 变流器有功功率 (kW, +放 / -充)，断线缺口为 null
  socPercent: number | null; // 能量状态 (SOC %)，断线缺口为 null
  quality: QualityLevel | 'EXPIRED';
  source: string;
  isDataMissing?: boolean; // 场景 B 在 05:37:12 后真实缺口断点 (杜绝插值平滑伪装)
  missingReason?: string;
  operatingState?: 'CHARGING' | 'DISCHARGING' | 'STANDBY' | 'DISCONNECTED';
}

// 储能 PCS 变流器明细与工况
export interface StoragePcsDetail extends UnifiedMonitorDevice {
  activePowerKw: number; // 当前有功功率 (+放 / -充)
  reactivePowerKvar: number; // 无功功率
  powerFactor: number; // 功率因数
  acVoltageV: number; // 交流侧线电压 (V)
  acCurrentA: number; // 交流侧电流 (A)
  frequencyHz: number; // 电网频率 (Hz)
  igbtTempC: number; // IGBT 桥臂结温 (℃)
  conversionEfficiency: number; // 逆变/整流效率 (%)
  runningMode: 'CHARGING' | 'DISCHARGING' | 'STANDBY' | 'FAULT' | 'OFFLINE';
  dailyChargeKwh: number; // 今日累计充电量 (kWh)
  dailyDischargeKwh: number; // 今日累计放电量 (kWh)
  protectionThresholds: {
    overCurrentA: number; // 过流保护门槛
    overVoltageV: number; // 过压跳闸门槛
    underVoltageV: number; // 欠压跳闸门槛
    overFrequencyHz: number; // 过频保护门槛
    antiIslandingDelayMs: number; // 防孤岛响应时延 (ms)
  };
  linkedAlarms?: Array<{
    id: string;
    title: string;
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
    time: string;
    description: string;
  }>;
}

// 储能电池簇 / BMS 明细
export interface StorageBatteryClusterDetail extends UnifiedMonitorDevice {
  clusterIndex: number; // 1, 2, 3, 4
  ratedCapacityKwh: number; // 250 kWh
  voltageV: number; // 簇总电压 (V)
  currentA: number; // 簇充放电电流 (A, +放 / -充)
  socPercent: number; // 能量状态 SOC (%)
  sohPercent: number; // 健康状态 SOH (%)
  maxCellVoltageV: number; // 最高单体电压 (V)
  maxCellVoltageLocation: string; // 位于电芯编号
  minCellVoltageV: number; // 最低单体电压 (V)
  minCellVoltageLocation: string; // 位于电芯编号
  cellVoltageDeltaMv: number; // 单体压差 (mV)
  maxCellTempC: number; // 最高电芯温度 (℃)
  maxCellTempLocation: string; // 位于温度探头编号
  minCellTempC: number; // 最低电芯温度 (℃)
  minCellTempLocation: string; // 位于温度探头编号
  cellTempDeltaC: number; // 电芯最大温差 (℃)
  insulationResistancePositiveMohm: number; // 正极对地绝缘电阻 (MΩ)
  insulationResistanceNegativeMohm: number; // 负极对地绝缘电阻 (MΩ)
  equalizationStatus: 'IDLE' | 'ACTIVE'; // BMS 均衡状态
  cellCount: number; // 电芯串联数量 (如 240)
  isSuspicious?: boolean;
  suspiciousReason?: string;
  linkedAlarms?: Array<{
    id: string;
    title: string;
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
    time: string;
    description: string;
  }>;
}

// 储能辅助系统 (液冷、消防、专用电表)
export interface StorageAuxiliarySystem {
  liquidCooling: {
    inletTempC: number; // 进水/出机温度
    outletTempC: number; // 回水温度
    deltaTempC: number; // 供回水温差
    pressureMpa: number; // 管路水压
    pumpStatus: 'RUNNING' | 'STANDBY' | 'FAULT';
    chillerStatus: 'COOLING' | 'SELF_CIRCULATION' | 'STANDBY' | 'FAULT';
    flowRateLmin: number; // 流量
    expansionTankLevelPercent: number; // 膨胀水箱液位
    source: string;
    lastUpdated: string;
  };
  fireSafety: {
    controllerStatus: 'MONITORING' | 'ALARM' | 'RELEASED' | 'FAULT';
    aerosolPressureMpa: number; // 灭火气体瓶组压力
    smokeDetectorStatus: 'NORMAL' | 'TRIGGERED';
    tempDetectorStatus: 'NORMAL' | 'TRIGGERED';
    chamberAvgTempC: number; // 舱内环境均温
    coGasPpm: number; // CO 浓度 (热失控初期特征气体)
    h2GasPpm: number; // H2 浓度 (热失控可燃气体)
    pressureReliefValve: 'NORMAL_CLOSED' | 'RELEASED'; // 防爆泄压阀
    eStopStatus: 'NORMAL_CLOSED' | 'TRIPPED'; // 急停回路
    source: string;
    lastUpdated: string;
  };
  smartMeter: {
    id: string;
    name: string;
    voltageA: number;
    voltageB: number;
    voltageC: number;
    currentA: number;
    currentB: number;
    currentC: number;
    activePowerKw: number;
    reactivePowerKvar: number;
    powerFactor: number;
    positiveActiveKwh: number; // 吸收电量 (充)
    reverseActiveKwh: number; // 释放电量 (放)
    frequencyHz: number;
    meterClass: string;
    source: string;
    lastUpdated: string;
  };
}

