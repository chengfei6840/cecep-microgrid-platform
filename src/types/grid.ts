import { QualityLevel } from './domain';

// 电网与能流监测系统模拟工况状态
export type GridSimulatedState =
  | 'NORMAL' // 正常运行 (网源荷储协同，自发自用兼顾电网)
  | 'SELF_CONSUMPTION' // 自发自用 (光储与负荷平衡，电网净交换接近 0)
  | 'FEED_IN_SURPLUS' // 余电上网 (光伏出力旺盛，富余电能反送 10kV 电网)
  | 'STORAGE_CHARGING' // 储能充电 (吸收低谷电/富余光电蓄能，储能呈现负功率)
  | 'STORAGE_DISCHARGING' // 储能放电 (高峰放电支撑负荷，储能呈现正功率)
  | 'WEATHER_MISSING' // 气象数据缺失 (传感器通信丢包，对比实测零值)
  | 'GRID_METER_OFFLINE' // 关口表中断 (DL/T 645 通信超时中断，电网连线断开)
  | 'PARTIAL_ANOMALY' // 部分质量异常 (功率因数可疑偏低，需量接近阈值预警)
  | 'LOADING' // 数据加载中
  | 'ERROR' // 加载失败
  | 'FORBIDDEN'; // 无权限 (巡检员访问受控)

// 电网 KPI 核心指标
export interface GridKpiData {
  gridPowerKw: number | null; // 实时购/售电功率 (+购 / -售，断开为 null)
  gridDirection: 'PURCHASE' | 'FEED_IN' | 'ZERO' | 'DISCONNECTED';
  gridDirectionLabel: string;
  totalStationLoadKw: number; // 站内总负荷 = 充电负荷 + 基础厂用负荷
  chargingLoadKw: number; // 充电桩群负荷 (与 P08 同源)
  baseStationLoadKw: number; // 站内综合基础负荷 (办公楼/空调/照明/辅助动力)
  currentDemandKw: number; // 当前实测需量 (15min 滑窗实测最大有功)
  contractDemandKw: number; // 合同申报需量 (如 800 kW)
  demandUtilizationPercent: number; // 需量利用率 (%)
  isDemandNearLimit: boolean; // 需量接近或超过警戒线 (>= 80%)
  demandWarningMessage?: string; // 需量预警与处置建议说明
  powerFactor: number; // 功率因数 (cosφ, 正常 0.95~0.99)
  powerFactorQuality: QualityLevel;
  reactivePowerKvar: number; // 无功功率
  gridFrequencyHz: number; // 频率 (50.00 Hz)
  threePhaseVoltage: {
    va: number; // A相线电压 (V)
    vb: number;
    vc: number;
  };
  threePhaseCurrent: {
    ia: number; // A相电流 (A)
    ib: number;
    ic: number;
  };
  todayPurchaseKwh: number; // 今日累计购电量
  todayFeedInKwh: number; // 今日累计上网电量
  meterQuality: QualityLevel | 'EXPIRED';
  meterSource: string;
  meterQualityReason?: string;
  lastUpdated: string;
}

// 气象实测点位结构 (严格区分零值与缺失)
export interface WeatherItemValue {
  value: number | null; // null 表示缺失，0 表示实测零值
  unit: string;
  isNightZero?: boolean; // 是否属于夜间正常零值 (如辐照度 0 W/m²)
  isMissing?: boolean; // 是否传感器通信缺失
  missingReason?: string;
  quality: QualityLevel;
  sensor: string;
  lastUpdated: string;
  rangeNote?: string;
}

export interface WeatherObservationData {
  totalIrradiance: WeatherItemValue; // 水平总辐射 (W/m²)
  ambientTemp: WeatherItemValue; // 环境温度 (℃)
  moduleTemp: WeatherItemValue; // 组件背板温度 (℃)
  relativeHumidity: WeatherItemValue; // 相对湿度 (%)
  windSpeed: WeatherItemValue; // 风速 (m/s)
  windDirection: {
    deg: number | null; // 角度 0-360
    compass: string; // "东南风", "东偏南 (ESE)"
    isMissing?: boolean;
    missingReason?: string;
    quality: QualityLevel;
    sensor: string;
    lastUpdated: string;
  };
  dailyAccumulatedIrradiationMj: WeatherItemValue; // 今日累计日照曝辐量 (MJ/m²)
  stationStatus: 'ONLINE' | 'OFFLINE' | 'PARTIAL_ANOMALY';
  stationDeviceName: string;
  lastUpdated: string;
}

// 能流图节点定义 (光伏、电网、储能、负荷、充电桩五节点)
export type FlowNodeType = 'PV' | 'GRID' | 'STORAGE' | 'LOAD' | 'CHARGING';

export interface EnergyFlowNode {
  id: FlowNodeType;
  name: string;
  subTitle: string;
  ratedCapacityText: string;
  powerKw: number | null; // 当前功率值 (kW)，null 为断开
  isBidirectional: boolean;
  directionText: string;
  status: 'NORMAL' | 'OFFLINE' | 'ALARM' | 'STANDBY';
  quality: QualityLevel | 'EXPIRED';
  qualityReason?: string;
  sourceSystem: string;
  protocol: string;
  targetRoute?: string; // 点击跳转对应监测页 (如 /monitor/pv)
  lastUpdated: string;
}

// 能流图连线定义
export interface EnergyFlowEdge {
  id: string;
  fromNode: FlowNodeType | 'BUS';
  toNode: FlowNodeType | 'BUS';
  activePowerKw: number; // 绝对值大小
  isReversed: boolean; // 是否反向流动
  isDisconnected: boolean;
  disconnectReason?: string;
  colorScheme: 'amber' | 'purple' | 'blue' | 'emerald' | 'cyan';
  strokeSpeedSec: number; // 流动动画周期 (秒，功率越大流动越快)
  sourceLabel: string;
  targetLabel: string;
}

// 功率平衡校验摘要
export interface PowerBalanceSummary {
  generationKw: number; // 电源侧进线 (光伏 + 储能放电 + 电网购电)
  consumptionKw: number; // 负荷侧出线 (充电桩 + 站内基础负荷 + 储能充电 + 电网反送)
  imbalanceDeltaKw: number; // 测量差异 (进线 - 出线)
  imbalancePercent: number; // 不平衡率 (%)
  isDemonstrationNote: string; // 允许小幅测量差异说明
  balanceStatus: 'PERFECT' | 'WITHIN_TOLERANCE' | 'DISCONNECTED_METER';
}

// 趋势采样点 (实测趋势分图/同轴对比)
export interface GridTrendSample {
  timestamp: string; // "14:00"
  hour: number;
  gridPowerKw: number | null; // 电网 (+购 / -售)
  totalLoadKw: number; // 站内总负荷
  pvPowerKw: number; // 光伏出力
  chargingLoadKw: number; // 充电负荷
  storagePowerKw: number | null; // 储能 (+放 / -充)
  isGridMissing?: boolean;
  quality: QualityLevel;
  qualityNote?: string;
}
