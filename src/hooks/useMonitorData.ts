import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '../store/AppContext';
import {
  PowerSubsystem,
  PowerConventionRule,
  UnifiedMonitorPoint,
  UnifiedMonitorDevice,
  MonitorSystemState,
  TrendPointSample,
  PvInverterDetail,
  PvTrendSample,
} from '../types/monitor';

// 统一功率方向与符号说明常量（全系统共享）
export const UNIFIED_POWER_CONVENTIONS: PowerConventionRule[] = [
  {
    subsystem: 'PV',
    name: '屋顶分布式光伏',
    positiveMeaning: '正值 (+) 表示光伏逆变器交流输出发电中',
    isBidirectional: false,
    standardUnit: 'kW',
    colorClass: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    subsystem: 'STORAGE',
    name: '电化学储能系统 (PCS)',
    positiveMeaning: '正值 (+) 表示储能放电 (向站内/电网供电)',
    negativeMeaning: '负值 (-) 表示储能充电 (吸收低谷电蓄能)',
    isBidirectional: true,
    standardUnit: 'kW',
    colorClass: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    subsystem: 'CHARGING',
    name: '园区充电桩群',
    positiveMeaning: '正值 (+) 表示车辆充电消耗电能负荷',
    isBidirectional: false,
    standardUnit: 'kW',
    colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    subsystem: 'GRID',
    name: '10kV 进线上级电网关口',
    positiveMeaning: '正值 (+) 表示从上级电网购电 (下网受电)',
    negativeMeaning: '负值 (-) 表示站内余电送入电网 (上网反送)',
    isBidirectional: true,
    standardUnit: 'kW',
    colorClass: 'text-purple-600 bg-purple-50 border-purple-200',
  },
];

export function useMonitorData() {
  const {
    site,
    devices: rawDevices,
    points: rawPoints,
    adapters,
    qualityIssues,
    telemetry,
    scenario,
    currentRole,
  } = useAppStore();

  // 刷新周期控制 (默认 15s，不超过 30s；可加速到 5s)
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState<number>(15);
  const [countdown, setCountdown] = useState<number>(15);
  const [isStreamInterrupted, setIsStreamInterrupted] = useState<boolean>(false);
  const [lastDataTimestamp, setLastDataTimestamp] = useState<string>('2026-09-05 06:12:45');
  const [refreshCount, setRefreshCount] = useState<number>(0);

  // 状态模拟演练 (支持显式切换 9 大受控运行状态以供验收)
  const [simulatedStateOverride, setSimulatedStateOverride] = useState<MonitorSystemState | null>(null);

  // 倒计时刷新驱动
  useEffect(() => {
    if (isStreamInterrupted) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // 触发刷新
          setRefreshCount((c) => c + 1);
          // 模拟时间微调前进
          const now = new Date();
          const timeStr = `2026-09-05 ${String(now.getHours()).padStart(2, '0')}:${String(
            now.getMinutes()
          ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
          setLastDataTimestamp(timeStr);
          return refreshIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStreamInterrupted, refreshIntervalSeconds]);

  // 切换流中断状态
  const toggleStreamInterrupted = useCallback(() => {
    setIsStreamInterrupted((prev) => !prev);
  }, []);

  const resumeStream = useCallback(() => {
    setIsStreamInterrupted(false);
    setCountdown(refreshIntervalSeconds);
  }, [refreshIntervalSeconds]);

  // 角色权限判断：巡检员桌面只读受控
  const isInspectorRole = currentRole === 'INSPECTOR';

  // 统一提取并丰富测点数据
  const unifiedPoints: UnifiedMonitorPoint[] = useMemo(() => {
    return [
      // 1. 光伏功率 (瞬时 kW)
      {
        id: 'POINT-PV-PAC',
        deviceId: 'DEV-PV-INV01',
        deviceName: '1# 组串式光伏逆变器',
        subsystem: 'PV',
        pointName: '光伏交流输出有功功率',
        standardCode: 'PV_ACTIVE_POWER_TOTAL',
        value: telemetry.pvActivePowerKw,
        formattedValue: telemetry.pvActivePowerKw.toFixed(1),
        unit: 'kW',
        timeScope: 'REALTIME',
        quality: rawPoints.find((p) => p.id === 'POINT-PV-PAC')?.currentQuality || 'NORMAL',
        qualitySource: '阳光电源 iSolarCloud 接口 (Modbus-TCP)',
        qualityReason: '数据流正常，无越限无补录',
        lastUpdated: lastDataTimestamp,
        powerDirectionNote: '正值 (+) 发电中',
        isBidirectional: false,
      },
      // 2. 储能 PCS 功率 (瞬时 kW, 双向: +放 / -充)
      {
        id: 'POINT-BAT-POWER',
        deviceId: 'DEV-STORAGE-PCS01',
        deviceName: '储能变流升压一体机 (PCS)',
        subsystem: 'STORAGE',
        pointName: '储能变流器充放电功率',
        standardCode: 'PCS_ACTIVE_POWER',
        value: telemetry.storagePowerKw,
        formattedValue: telemetry.storagePowerKw.toFixed(1),
        unit: 'kW',
        timeScope: 'REALTIME',
        // 场景 B 响应：若场景 B 则呈现异常与过期
        quality:
          scenario === 'SCENARIO_B'
            ? 'ANOMALY'
            : rawPoints.find((p) => p.id === 'POINT-BAT-POWER')?.currentQuality || 'NORMAL',
        qualitySource: '时代星云 CATL-Nebula EMS 网关 (IEC 61850)',
        qualityReason:
          scenario === 'SCENARIO_B'
            ? 'TCP/IP 连接建立超时，连续 3 个周期无心跳响应，数据已冻结停滞'
            : '数据流正常，双向有功四象限采样准确',
        lastUpdated: scenario === 'SCENARIO_B' ? '2026-09-05 05:37:12 (陈旧数据)' : lastDataTimestamp,
        powerDirectionNote: telemetry.storagePowerKw >= 0 ? '+ 正值放电' : '- 负值充电',
        isBidirectional: true,
      },
      // 3. 储能 SOC (瞬时 %)
      {
        id: 'POINT-BAT-SOC',
        deviceId: 'DEV-STORAGE-BATT01',
        deviceName: '磷酸铁锂户外电池舱',
        subsystem: 'STORAGE',
        pointName: '电池系统当前荷电状态 (SOC)',
        standardCode: 'BATT_SOC_PERCENT',
        value: telemetry.storageSocPercent,
        formattedValue: telemetry.storageSocPercent.toFixed(1),
        unit: '%',
        timeScope: 'REALTIME',
        quality:
          scenario === 'SCENARIO_B'
            ? 'ANOMALY'
            : rawPoints.find((p) => p.id === 'POINT-BAT-SOC')?.currentQuality || 'NORMAL',
        qualitySource: '时代星云 CATL-Nebula BMS 簇控系统',
        qualityReason:
          scenario === 'SCENARIO_B'
            ? 'BMS 簇控通信离线，停滞在 05:37:12，存在过充过放风险'
            : '单体压差 12mV，电芯最高温 28.5℃ 正常',
        lastUpdated: scenario === 'SCENARIO_B' ? '2026-09-05 05:37:12 (陈旧数据)' : lastDataTimestamp,
        isBidirectional: false,
      },
      // 4. 充电桩群负荷 (瞬时 kW)
      {
        id: 'POINT-CHG-POWER',
        deviceId: 'DEV-CHARGE-FAST01',
        deviceName: '特来电 120kW 双枪直流快充桩群',
        subsystem: 'CHARGING',
        pointName: '充电站群实时总负荷功率',
        standardCode: 'CHARGER_AGGREGATED_LOAD',
        value: telemetry.chargingLoadKw,
        formattedValue: telemetry.chargingLoadKw.toFixed(1),
        unit: 'kW',
        timeScope: 'REALTIME',
        quality: rawPoints.find((p) => p.id === 'POINT-CHG-POWER')?.currentQuality || 'NORMAL',
        qualitySource: '特来电 TELD 智能桩群云端中继 (MQTT/JSON)',
        qualityReason: '在线插枪 6 枪，柔性充电功率调度正常',
        lastUpdated: lastDataTimestamp,
        powerDirectionNote: '正值 (+) 负荷用电',
        isBidirectional: false,
      },
      // 5. 电网关口受电负荷 (瞬时 kW, 双向: +购 / -网)
      {
        id: 'POINT-GRID-LOAD',
        deviceId: 'DEV-GRID-METER01',
        deviceName: '10kV 进线总降变双向关口电能表',
        subsystem: 'GRID',
        pointName: '10kV 进线变压器总关口有功功率',
        standardCode: 'GRID_NET_ACTIVE_POWER',
        value: telemetry.gridPowerKw,
        formattedValue: telemetry.gridPowerKw.toFixed(1),
        unit: 'kW',
        timeScope: 'REALTIME',
        quality: rawPoints.find((p) => p.id === 'POINT-GRID-LOAD')?.currentQuality || 'NORMAL',
        qualitySource: '威胜 10kV 高精度双向电能表 (DL/T 645-2007)',
        qualityReason: '三相电流平衡，0.2S 级关口计量采集正常',
        lastUpdated: lastDataTimestamp,
        powerDirectionNote: telemetry.gridPowerKw >= 0 ? '+ 购电 (下网)' : '- 上网 (反送)',
        isBidirectional: true,
      },
      // 6. 今日累计发电 (今日累计 kWh)
      {
        id: 'POINT-PV-YIELD-DAY',
        deviceId: 'DEV-PV-INV01',
        deviceName: '1# 组串式光伏逆变器',
        subsystem: 'PV',
        pointName: '今日累计光伏发电量',
        standardCode: 'PV_DAILY_YIELD_KWH',
        value: telemetry.pvDailyYieldKwh,
        formattedValue: telemetry.pvDailyYieldKwh.toFixed(1),
        unit: 'kWh',
        timeScope: 'TODAY_CUMULATIVE',
        quality: 'NORMAL',
        qualitySource: '电站能量管理计算引擎积分累计',
        qualityReason: '日内积分连续累计无突变',
        lastUpdated: lastDataTimestamp,
        isBidirectional: false,
      },
      // 7. 今日充电消耗 (今日累计 kWh)
      {
        id: 'POINT-CHG-YIELD-DAY',
        deviceId: 'DEV-CHARGE-FAST01',
        deviceName: '特来电 120kW 双枪直流快充桩群',
        subsystem: 'CHARGING',
        pointName: '今日累计充电消纳电量',
        standardCode: 'CHARGER_DAILY_ENERGY_KWH',
        value: telemetry.chargingDailyKwh,
        formattedValue: telemetry.chargingDailyKwh.toFixed(1),
        unit: 'kWh',
        timeScope: 'TODAY_CUMULATIVE',
        quality: 'NORMAL',
        qualitySource: '特来电 TELD 桩端电表计费归档',
        qualityReason: '有效订单计费累计正常',
        lastUpdated: lastDataTimestamp,
        isBidirectional: false,
      },
    ];
  }, [telemetry, rawPoints, scenario, lastDataTimestamp]);

  // 统一提取设备列表并关联子系统与首要测点
  const unifiedDevices: UnifiedMonitorDevice[] = useMemo(() => {
    return rawDevices.map((d) => {
      let subsystem: PowerSubsystem = 'PV';
      if (d.type === 'INVERTER' || d.type === 'PV_INVERTER') subsystem = 'PV';
      else if (d.type === 'PCS' || d.type === 'BATTERY_CLUSTER' || d.type === 'ENERGY_STORAGE') subsystem = 'STORAGE';
      else if (d.type === 'CHARGER_DC' || d.type === 'CHARGER_AC' || d.type === 'CHARGING_STATION') subsystem = 'CHARGING';
      else if (d.type === 'SMART_METER' || d.type === 'GRID_METER') subsystem = 'GRID';

      const devPoints = unifiedPoints.filter((p) => p.deviceId === d.id);
      const primaryPoint = devPoints[0];

      // 场景 B 联动状态
      const isAlarmInScenarioB = scenario === 'SCENARIO_B' && d.id.includes('STORAGE');

      return {
        ...d,
        subsystem,
        status: isAlarmInScenarioB ? 'ALARM' : d.status,
        lastDataTime:
          isAlarmInScenarioB ? '2026-09-05 05:37:12 (断线停滞)' : lastDataTimestamp,
        points: devPoints,
        primaryPoint,
      };
    });
  }, [rawDevices, unifiedPoints, scenario, lastDataTimestamp]);

  // 设备状态统计
  const deviceStatusSummary = useMemo(() => {
    const total = unifiedDevices.length;
    const normal = unifiedDevices.filter((d) => d.status === 'NORMAL').length;
    const alarm = unifiedDevices.filter((d) => d.status === 'ALARM').length;
    const suspicious = unifiedDevices.filter((d) => d.status === 'SUSPICIOUS' || d.status === 'OFFLINE').length;
    const disabled = unifiedDevices.filter((d) => d.status === 'DISABLED').length;

    return { total, normal, alarm, suspicious, disabled };
  }, [unifiedDevices]);

  // 24 小时实测与运行调度趋势曲线数据 (严格使用实测与真实调度，杜绝虚构 AI 预测)
  const trendSamples: TrendPointSample[] = useMemo(() => {
    return Array.from({ length: 24 }).map((_, hour) => {
      const isSun = hour >= 6 && hour <= 18;
      // 光伏出力峰值在正午
      const pv = isSun ? Math.sin(((hour - 6) / 12) * Math.PI) * 420 : 0;

      // 储能典型两充两放：
      // 谷充 (00:00 - 06:30): 负值充电 ~ -220kW
      // 早峰放 (08:30 - 11:30): 正值放电 ~ +240kW
      // 午间平/深谷补充 (12:00 - 14:00): 负值充电 ~ -150kW
      // 晚尖峰放 (19:00 - 21:00): 正值放电 ~ +320kW
      let storage = 0;
      if (hour >= 0 && hour <= 6) storage = -220;
      else if (hour >= 9 && hour <= 11) storage = 240;
      else if (hour >= 12 && hour <= 13) storage = -150;
      else if (hour >= 19 && hour <= 20) storage = 320;
      else storage = 0;

      // 场景 B 在 05:37 之后储能数据断线停滞
      const isStorageAnomaly = scenario === 'SCENARIO_B' && hour >= 6;
      if (isStorageAnomaly) {
        storage = -180.0; // 停滞在断线前最后帧
      }

      // 充电桩负荷
      const charge = hour >= 7 && hour <= 21 ? 120 + ((hour * 17) % 80) : 35;

      // 电网关口 = 站内净负荷 = 充电负荷 - 光伏 - 储能放电(+为放/-为充)
      const grid = charge - pv - storage;

      return {
        timestamp: `${String(hour).padStart(2, '0')}:00`,
        hour,
        pvPowerKw: Math.max(0, Number(pv.toFixed(1))),
        storagePowerKw: Number(storage.toFixed(1)),
        chargingLoadKw: Number(charge.toFixed(1)),
        gridPowerKw: Number(grid.toFixed(1)),
        isStorageAnomaly,
        qualityNote: isStorageAnomaly ? 'CATL EMS 通信中断，数值停滞' : undefined,
      };
    });
  }, [scenario]);

  // 当前激活状态（受 simulatedStateOverride 覆盖）
  const activeSystemState: MonitorSystemState = useMemo(() => {
    if (simulatedStateOverride) return simulatedStateOverride;
    if (isInspectorRole) return 'FORBIDDEN';
    if (isStreamInterrupted) return 'STREAM_INTERRUPTED';
    if (scenario === 'SCENARIO_B') return 'STALE_DATA'; // 场景 B 包含储能陈旧与异常
    return 'NORMAL';
  }, [simulatedStateOverride, isInspectorRole, isStreamInterrupted, scenario]);

  // =========================================================================
  // 光伏 (PV) 专属统一数据选择器 (严格与主数据源同一口径)
  // =========================================================================
  const pvMonitorData = useMemo(() => {
    const isSuspiciousZeroState = simulatedStateOverride === 'SUSPICIOUS_ZERO';
    const isPartialOfflineState = simulatedStateOverride === 'PARTIAL_OFFLINE';
    const isUnmappedState = simulatedStateOverride === 'UNMAPPED';
    const isMissingState = simulatedStateOverride === 'PARTIAL_MISSING';

    // 1. 实时功率与质量判定
    const basePvPower = isSuspiciousZeroState ? 0.0 : telemetry.pvActivePowerKw;
    const pvPowerQuality: 'NORMAL' | 'SUSPICIOUS' | 'PATCHED' | 'ANOMALY' = isSuspiciousZeroState
      ? 'SUSPICIOUS'
      : isPartialOfflineState
      ? 'PATCHED'
      : 'NORMAL';

    const pvPowerReason = isSuspiciousZeroState
      ? '业务规则触发：白天辐照度 860 W/m² 充足但实测输出功率连续 30 分钟为 0 kW，疑似直流跳闸'
      : isPartialOfflineState
      ? '2# 逆变器通信离线，部分功率由前置规约引擎采用末帧补录'
      : '阳光电源 iSolarCloud Modbus-TCP 规约采集正常，功率与辐照度拟合良好';

    // 2. 顶部 5 大 KPI 卡片 (严格区分瞬时 kW 与累计 kWh / 历史 MWh / 容量 kWp / 利用小时 h)
    const capacityKwp = site.pvCapacityKwp || 1200;
    const dailyYieldKwh = telemetry.pvDailyYieldKwh || 2480.0;
    const totalYieldMwh = 482.6;
    const equivalentHours = Number((dailyYieldKwh / capacityKwp).toFixed(2));

    const kpiPoints: UnifiedMonitorPoint[] = [
      // KPI 1: 实时功率 (瞬时 kW)
      {
        id: 'POINT-PV-PAC',
        deviceId: 'SITE-001',
        deviceName: '示范站光伏总汇流并网柜',
        subsystem: 'PV',
        pointName: '全站光伏实时出力功率',
        standardCode: 'PV_ACTIVE_POWER_TOTAL',
        value: basePvPower,
        formattedValue: basePvPower.toFixed(1),
        unit: 'kW',
        timeScope: 'REALTIME',
        quality: pvPowerQuality,
        qualitySource: '全站逆变器 Modbus 汇流聚合与并网关口实时采样',
        qualityReason: pvPowerReason,
        lastUpdated: lastDataTimestamp,
        powerDirectionNote: '正值 (+) 发电中',
        isBidirectional: false,
      },
      // KPI 2: 今日发电量 (今日累计 kWh)
      {
        id: 'POINT-PV-YIELD-DAY',
        deviceId: 'SITE-001',
        deviceName: '示范站光伏电站总成',
        subsystem: 'PV',
        pointName: '全站今日累计发电量',
        standardCode: 'PV_DAILY_YIELD_KWH',
        value: dailyYieldKwh,
        formattedValue: dailyYieldKwh.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        unit: 'kWh',
        timeScope: 'TODAY_CUMULATIVE',
        quality: 'NORMAL',
        qualitySource: '电站能量管理计算引擎全站 4 台逆变器日内微积分累计',
        qualityReason: '全站 4 台逆变器日内有功电量连续微积分累加，无跳变无越限',
        lastUpdated: lastDataTimestamp,
        isBidirectional: false,
      },
      // KPI 3: 累计发电量 (累计历史 MWh)
      {
        id: 'POINT-PV-YIELD-TOTAL',
        deviceId: 'SITE-001',
        deviceName: '示范站光伏总站',
        subsystem: 'PV',
        pointName: '累计总发电量',
        standardCode: 'PV_TOTAL_LIFETIME_YIELD_MWH',
        value: totalYieldMwh,
        formattedValue: totalYieldMwh.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        unit: 'MWh',
        timeScope: 'HISTORICAL_INTERVAL',
        quality: 'NORMAL',
        qualitySource: '国网供电分公司双向关口结算计量',
        qualityReason: '历史发电全生命周期归档累计数据，经月度结算稽核无差异',
        lastUpdated: '2026-09-04 24:00:00 (日终结算对账)',
        isBidirectional: false,
      },
      // KPI 4: 装机容量 (额定容量 kWp)
      {
        id: 'POINT-PV-CAPACITY',
        deviceId: 'SITE-001',
        deviceName: '低碳园区微电网工程',
        subsystem: 'PV',
        pointName: '光伏装机容量',
        standardCode: 'PV_INSTALLED_CAPACITY_KWP',
        value: capacityKwp,
        formattedValue: capacityKwp.toLocaleString('zh-CN'),
        unit: 'kWp',
        timeScope: 'REALTIME',
        quality: 'NORMAL',
        qualitySource: '示范站资产登记台账 (1.2 MWp)',
        qualityReason: '一期屋顶 640kW + 二期车棚与立面 560kW 核准备案装机',
        lastUpdated: '2026-09-01 00:00:00 (资产核定)',
        isBidirectional: false,
      },
      // KPI 5: 等效利用小时 (今日利用小时 h)
      {
        id: 'POINT-PV-PEAK-HOURS',
        deviceId: 'SITE-001',
        deviceName: '光伏能效综合评估',
        subsystem: 'PV',
        pointName: '今日等效利用小时',
        standardCode: 'PV_EQUIVALENT_PEAK_HOURS',
        value: equivalentHours,
        formattedValue: equivalentHours.toFixed(2),
        unit: 'h',
        timeScope: 'TODAY_CUMULATIVE',
        quality: 'NORMAL',
        qualitySource: '国标 GB/T 50797 光伏发电能效标准计算',
        qualityReason: `计算口径: 今日累计发电量 (${dailyYieldKwh} kWh) / 装机容量 (${capacityKwp} kWp)`,
        lastUpdated: lastDataTimestamp,
        isBidirectional: false,
      },
    ];

    // 3. 逆变器设备明细列表 (含型号、额定功率、当前功率、日发电量、温度、状态、最近数据时间、关联点位和近期告警)
    const inverters: PvInverterDetail[] = [
      {
        id: 'DEV-PV-INV01',
        siteId: 'SITE-001',
        name: '1# 组串式光伏逆变器 (屋顶1期)',
        type: 'INVERTER',
        subsystem: 'PV',
        manufacturer: '阳光电源股份有限公司',
        model: 'SG320HX-PRO',
        ratedCapacity: '320 kW',
        status: isSuspiciousZeroState ? 'SUSPICIOUS' : 'NORMAL',
        currentPowerKw: isSuspiciousZeroState ? 0.0 : Number((basePvPower * 0.52).toFixed(1)),
        dailyYieldKwh: Number((dailyYieldKwh * 0.52).toFixed(1)),
        temperatureC: 48.5,
        dcVoltageV: 715.4,
        dcCurrentA: isSuspiciousZeroState ? 0.0 : 314.8,
        efficiencyPercent: 98.6,
        lastDataTime: lastDataTimestamp,
        sourceAdapterId: 'ADAPTER-PV-01',
        sourcePlatform: '阳光电源 iSolarCloud 智能运维云 (Modbus-TCP)',
        points: [
          {
            id: 'POINT-PV-INV01-PAC',
            deviceId: 'DEV-PV-INV01',
            deviceName: '1# 组串式光伏逆变器',
            subsystem: 'PV',
            pointName: '1# 逆变器交流输出有功功率',
            standardCode: 'PV_INV01_ACTIVE_POWER',
            value: isSuspiciousZeroState ? 0.0 : Number((basePvPower * 0.52).toFixed(1)),
            formattedValue: (isSuspiciousZeroState ? 0.0 : basePvPower * 0.52).toFixed(1),
            unit: 'kW',
            timeScope: 'REALTIME',
            quality: isSuspiciousZeroState ? 'SUSPICIOUS' : 'NORMAL',
            qualitySource: '阳光电源 Modbus-TCP 地址 5016',
            qualityReason: isSuspiciousZeroState ? '有效辐照度下连续 30 分钟为 0 kW' : '三相交流输出平衡',
            lastUpdated: lastDataTimestamp,
            powerDirectionNote: '正值 (+) 发电中',
          },
          {
            id: 'POINT-PV-INV01-YIELD',
            deviceId: 'DEV-PV-INV01',
            deviceName: '1# 组串式光伏逆变器',
            subsystem: 'PV',
            pointName: '1# 逆变器今日累计发电量',
            standardCode: 'PV_INV01_DAILY_YIELD',
            value: Number((dailyYieldKwh * 0.52).toFixed(1)),
            formattedValue: (dailyYieldKwh * 0.52).toFixed(1),
            unit: 'kWh',
            timeScope: 'TODAY_CUMULATIVE',
            quality: 'NORMAL',
            qualitySource: '阳光电源 Modbus-TCP 地址 5002',
            qualityReason: '日内电量累计递增正常',
            lastUpdated: lastDataTimestamp,
          },
          {
            id: 'POINT-PV-INV01-TEMP',
            deviceId: 'DEV-PV-INV01',
            deviceName: '1# 组串式光伏逆变器',
            subsystem: 'PV',
            pointName: '1# 逆变器机内 IGBT 运行温度',
            standardCode: 'PV_INV01_INTERNAL_TEMP',
            value: 48.5,
            formattedValue: '48.5',
            unit: '℃',
            timeScope: 'REALTIME',
            quality: 'NORMAL',
            qualitySource: '内置 PT1000 热敏传感器 (地址 5007)',
            qualityReason: '运行温度在允许工作区间 (20℃ ~ 75℃)',
            lastUpdated: lastDataTimestamp,
          },
          {
            id: 'POINT-PV-INV01-VDC',
            deviceId: 'DEV-PV-INV01',
            deviceName: '1# 组串式光伏逆变器',
            subsystem: 'PV',
            pointName: '1# 逆变器直流母线工作电压',
            standardCode: 'PV_INV01_DC_VOLTAGE',
            value: 715.4,
            formattedValue: '715.4',
            unit: 'V',
            timeScope: 'REALTIME',
            quality: 'NORMAL',
            qualitySource: '阳光电源 Modbus-TCP 地址 5011',
            qualityReason: 'MPPT 电压位于最佳功率跟踪区间 (500V~900V)',
            lastUpdated: lastDataTimestamp,
          },
        ],
        linkedAlarms: isSuspiciousZeroState
          ? [
              {
                id: 'ALM-PV-ZERO-01',
                title: '白天光伏出力异常停滞 (持续 30min 零功率)',
                severity: 'MAJOR',
                time: '2026-09-05 11:30:00',
                description: '水平辐照度为 860 W/m² (有效光照)，但 1# 逆变器有功功率连续输出为 0.0 kW，疑似直流侧熔丝熔断或断路器跳闸。',
              },
            ]
          : [],
      },
      {
        id: 'DEV-PV-INV02',
        siteId: 'SITE-001',
        name: '2# 组串式光伏逆变器 (屋顶2期)',
        type: 'INVERTER',
        subsystem: 'PV',
        manufacturer: '阳光电源股份有限公司',
        model: 'SG320HX-PRO',
        ratedCapacity: '320 kW',
        status: isPartialOfflineState ? 'OFFLINE' : 'NORMAL',
        currentPowerKw: isPartialOfflineState ? 0.0 : Number((basePvPower * 0.48).toFixed(1)),
        dailyYieldKwh: Number((dailyYieldKwh * 0.48).toFixed(1)),
        temperatureC: isPartialOfflineState ? 28.0 : 46.8,
        dcVoltageV: isPartialOfflineState ? 0.0 : 708.2,
        dcCurrentA: isPartialOfflineState ? 0.0 : 293.4,
        efficiencyPercent: isPartialOfflineState ? 0.0 : 98.4,
        lastDataTime: isPartialOfflineState ? '2026-09-05 06:00:15 (心跳超时15min)' : lastDataTimestamp,
        sourceAdapterId: 'ADAPTER-PV-01',
        sourcePlatform: '阳光电源 iSolarCloud 智能运维云 (Modbus-TCP)',
        points: [
          {
            id: 'POINT-PV-INV02-PAC',
            deviceId: 'DEV-PV-INV02',
            deviceName: '2# 组串式光伏逆变器',
            subsystem: 'PV',
            pointName: '2# 逆变器交流输出有功功率',
            standardCode: 'PV_INV02_ACTIVE_POWER',
            value: isPartialOfflineState ? 0.0 : Number((basePvPower * 0.48).toFixed(1)),
            formattedValue: (isPartialOfflineState ? 0.0 : basePvPower * 0.48).toFixed(1),
            unit: 'kW',
            timeScope: 'REALTIME',
            quality: isPartialOfflineState ? 'EXPIRED' : 'NORMAL',
            qualitySource: '阳光电源 Modbus-TCP 地址 5016',
            qualityReason: isPartialOfflineState ? 'RS485 通信链路超时，数据帧停滞' : '数据流采样正常',
            lastUpdated: isPartialOfflineState ? '2026-09-05 06:00:15' : lastDataTimestamp,
            powerDirectionNote: '正值 (+) 发电中',
          },
          {
            id: 'POINT-PV-INV02-YIELD',
            deviceId: 'DEV-PV-INV02',
            deviceName: '2# 组串式光伏逆变器',
            subsystem: 'PV',
            pointName: '2# 逆变器今日累计发电量',
            standardCode: 'PV_INV02_DAILY_YIELD',
            value: Number((dailyYieldKwh * 0.48).toFixed(1)),
            formattedValue: (dailyYieldKwh * 0.48).toFixed(1),
            unit: 'kWh',
            timeScope: 'TODAY_CUMULATIVE',
            quality: 'NORMAL',
            qualitySource: '阳光电源 Modbus-TCP 地址 5002',
            qualityReason: '离线前最后有效累计电量',
            lastUpdated: isPartialOfflineState ? '2026-09-05 06:00:15' : lastDataTimestamp,
          },
          {
            id: 'POINT-PV-INV02-TEMP',
            deviceId: 'DEV-PV-INV02',
            deviceName: '2# 组串式光伏逆变器',
            subsystem: 'PV',
            pointName: '2# 逆变器机内 IGBT 运行温度',
            standardCode: 'PV_INV02_INTERNAL_TEMP',
            value: isPartialOfflineState ? 28.0 : 46.8,
            formattedValue: isPartialOfflineState ? '28.0' : '46.8',
            unit: '℃',
            timeScope: 'REALTIME',
            quality: isPartialOfflineState ? 'EXPIRED' : 'NORMAL',
            qualitySource: '机内温度传感器',
            qualityReason: isPartialOfflineState ? '通信离线停滞' : '正常工况',
            lastUpdated: isPartialOfflineState ? '2026-09-05 06:00:15' : lastDataTimestamp,
          },
        ],
        linkedAlarms: isPartialOfflineState
          ? [
              {
                id: 'ALM-PV-COMM-02',
                title: '2# 光伏逆变器 RS485 通信中断告警',
                severity: 'MINOR',
                time: '2026-09-05 06:02:10',
                description: '数采前置机连续 3 次轮询 2# 逆变器无响应，通信已超时超过 15 分钟。',
              },
            ]
          : [],
      },
      {
        id: 'DEV-PV-INV03',
        siteId: 'SITE-001',
        name: '3# 组串式光伏逆变器 (车棚光伏区)',
        type: 'INVERTER',
        subsystem: 'PV',
        manufacturer: '阳光电源股份有限公司',
        model: 'SG320HX-PRO',
        ratedCapacity: '320 kW',
        status: 'NORMAL',
        currentPowerKw: 0.0, // 备用/二期并入整体
        dailyYieldKwh: 1210.5,
        temperatureC: 45.2,
        dcVoltageV: 710.0,
        dcCurrentA: 0.0,
        efficiencyPercent: 98.5,
        lastDataTime: lastDataTimestamp,
        sourceAdapterId: 'ADAPTER-PV-01',
        sourcePlatform: '阳光电源 iSolarCloud 智能运维云 (Modbus-TCP)',
        points: [
          {
            id: 'POINT-PV-INV03-PAC',
            deviceId: 'DEV-PV-INV03',
            deviceName: '3# 组串式光伏逆变器',
            subsystem: 'PV',
            pointName: '3# 逆变器交流输出功率',
            standardCode: 'PV_INV03_ACTIVE_POWER',
            value: 0.0,
            formattedValue: '0.0',
            unit: 'kW',
            timeScope: 'REALTIME',
            quality: 'NORMAL',
            qualitySource: 'Modbus-TCP',
            qualityReason: '车棚区域并网正常运行待机',
            lastUpdated: lastDataTimestamp,
          },
        ],
        linkedAlarms: [],
      },
      {
        id: 'DEV-PV-INV04',
        siteId: 'SITE-001',
        name: '4# 组串式光伏逆变器 (办公楼南立面)',
        type: 'INVERTER',
        subsystem: 'PV',
        manufacturer: '阳光电源股份有限公司',
        model: 'SG250HX',
        ratedCapacity: '240 kW',
        status: isUnmappedState ? 'SUSPICIOUS' : 'NORMAL',
        currentPowerKw: 0.0,
        dailyYieldKwh: 915.2,
        temperatureC: 44.0,
        dcVoltageV: 695.0,
        dcCurrentA: 0.0,
        efficiencyPercent: 98.2,
        lastDataTime: lastDataTimestamp,
        sourceAdapterId: 'ADAPTER-PV-01',
        sourcePlatform: '阳光电源 iSolarCloud 智能运维云 (Modbus-TCP)',
        points: [
          {
            id: 'POINT-PV-INV04-PAC',
            deviceId: 'DEV-PV-INV04',
            deviceName: '4# 组串式光伏逆变器',
            subsystem: 'PV',
            pointName: '4# 逆变器交流输出功率',
            standardCode: isUnmappedState ? 'UNMAPPED_POINT' : 'PV_INV04_ACTIVE_POWER',
            value: 0.0,
            formattedValue: '0.0',
            unit: 'kW',
            timeScope: 'REALTIME',
            quality: isUnmappedState ? 'SUSPICIOUS' : 'NORMAL',
            qualitySource: 'Modbus-TCP',
            qualityReason: isUnmappedState ? '点位未完成标准指标编码映射绑定' : '南立面组串运行正常',
            lastUpdated: lastDataTimestamp,
          },
        ],
        linkedAlarms: isUnmappedState
          ? [
              {
                id: 'ALM-PV-MAP-04',
                title: '4# 逆变器测点未映射预警',
                severity: 'MINOR',
                time: '2026-09-05 06:10:00',
                description: '该逆变器测点字典存在未映射项，请管理员前往资产字典进行标准绑定。',
              },
            ]
          : [],
      },
    ];

    // 4. 当日光伏实测出力趋势与辐照度对照 (24小时全天实测，杜绝预测)
    const pvTrendSamples: PvTrendSample[] = Array.from({ length: 24 }).map((_, hour) => {
      const isNight = hour < 6 || hour >= 19;
      // 辐照度：白天正弦峰值 880 W/m²，夜间为 0
      const irradiance = isNight ? 0 : Math.sin(((hour - 6) / 12) * Math.PI) * 880;
      // 实测功率：白天随辐照度升高，正午峰值 432.8 kW
      let pvPower = isNight ? 0 : Math.sin(((hour - 6) / 12) * Math.PI) * 432.8;

      // 业务规则演练：白天异常零值 (11:00 辐照度 820 W/m² 时功率为 0)
      const isSuspiciousZeroPoint = isSuspiciousZeroState && hour === 11;
      if (isSuspiciousZeroPoint) {
        pvPower = 0.0;
      }

      // 数据缺失测试：14:00 时段缺失，不得画线平滑插值！
      const isDataMissing = isMissingState && hour === 14;

      let quality: 'NORMAL' | 'SUSPICIOUS' | 'PATCHED' | 'ANOMALY' = 'NORMAL';
      let suspiciousReason: string | undefined = undefined;

      if (isNight) {
        // 业务规则：夜间零功率不是异常！
        quality = 'NORMAL';
      } else if (isSuspiciousZeroPoint) {
        // 业务规则：白天连续 30 分钟为零且辐照度有效时标记可疑并可跳转告警
        quality = 'SUSPICIOUS';
        suspiciousReason = `白天 11:00 辐照度高达 ${irradiance.toFixed(0)} W/m²，但实测功率连续 30 分钟为 0 kW，疑似组串断路器跳闸或直流侧断线`;
      } else if (isDataMissing) {
        quality = 'ANOMALY';
        suspiciousReason = '通信网关丢包，未收到该时刻实测采样帧，杜绝插值补齐';
      }

      return {
        timestamp: `${String(hour).padStart(2, '0')}:00`,
        hour,
        pvPowerKw: isDataMissing ? 0 : Number(pvPower.toFixed(1)),
        irradianceWm2: Number(irradiance.toFixed(0)),
        quality,
        source: isNight
          ? '微气象仪及逆变器夜间正常待机上报 (零辐照/零输出)'
          : '阳光电源 iSolarCloud (Modbus-TCP) · 华控微气象站 (RS485)',
        isNightZero: isNight,
        isSuspiciousZero: isSuspiciousZeroPoint,
        suspiciousReason,
        isDataMissing,
      };
    });

    // 5. 最近 4 小时高频采样 (11:00 到 15:00，15 分钟一个采样点)
    const pvRecent4hSamples: PvTrendSample[] = [
      { timestamp: '11:00', hour: 11, pvPowerKw: isSuspiciousZeroState ? 0.0 : 380.5, irradianceWm2: 780, quality: isSuspiciousZeroState ? 'SUSPICIOUS' : 'NORMAL', source: '阳光电源 Modbus-TCP', isSuspiciousZero: isSuspiciousZeroState, suspiciousReason: isSuspiciousZeroState ? '有效光照下零出力' : undefined },
      { timestamp: '11:15', hour: 11, pvPowerKw: isSuspiciousZeroState ? 0.0 : 395.2, irradianceWm2: 810, quality: isSuspiciousZeroState ? 'SUSPICIOUS' : 'NORMAL', source: '阳光电源 Modbus-TCP', isSuspiciousZero: isSuspiciousZeroState },
      { timestamp: '11:30', hour: 11, pvPowerKw: isSuspiciousZeroState ? 0.0 : 412.0, irradianceWm2: 840, quality: isSuspiciousZeroState ? 'SUSPICIOUS' : 'NORMAL', source: '阳光电源 Modbus-TCP', isSuspiciousZero: isSuspiciousZeroState },
      { timestamp: '11:45', hour: 11, pvPowerKw: isSuspiciousZeroState ? 0.0 : 425.6, irradianceWm2: 865, quality: isSuspiciousZeroState ? 'SUSPICIOUS' : 'NORMAL', source: '阳光电源 Modbus-TCP', isSuspiciousZero: isSuspiciousZeroState },
      { timestamp: '12:00', hour: 12, pvPowerKw: 432.8, irradianceWm2: 880, quality: 'NORMAL', source: '阳光电源 Modbus-TCP' },
      { timestamp: '12:15', hour: 12, pvPowerKw: 430.1, irradianceWm2: 875, quality: 'NORMAL', source: '阳光电源 Modbus-TCP' },
      { timestamp: '12:30', hour: 12, pvPowerKw: 422.4, irradianceWm2: 860, quality: 'NORMAL', source: '阳光电源 Modbus-TCP' },
      { timestamp: '12:45', hour: 12, pvPowerKw: 415.8, irradianceWm2: 845, quality: 'NORMAL', source: '阳光电源 Modbus-TCP' },
      { timestamp: '13:00', hour: 13, pvPowerKw: 405.0, irradianceWm2: 820, quality: 'NORMAL', source: '阳光电源 Modbus-TCP' },
      { timestamp: '13:15', hour: 13, pvPowerKw: 390.2, irradianceWm2: 790, quality: 'NORMAL', source: '阳光电源 Modbus-TCP' },
      { timestamp: '13:30', hour: 13, pvPowerKw: 375.6, irradianceWm2: 760, quality: 'NORMAL', source: '阳光电源 Modbus-TCP' },
      { timestamp: '13:45', hour: 13, pvPowerKw: 358.0, irradianceWm2: 725, quality: 'NORMAL', source: '阳光电源 Modbus-TCP' },
      { timestamp: '14:00', hour: 14, pvPowerKw: isMissingState ? 0 : 340.2, irradianceWm2: 690, quality: isMissingState ? 'ANOMALY' : 'NORMAL', source: '阳光电源 Modbus-TCP', isDataMissing: isMissingState },
      { timestamp: '14:15', hour: 14, pvPowerKw: 320.5, irradianceWm2: 650, quality: 'NORMAL', source: '阳光电源 Modbus-TCP' },
      { timestamp: '14:30', hour: 14, pvPowerKw: 302.8, irradianceWm2: 615, quality: 'NORMAL', source: '阳光电源 Modbus-TCP' },
      { timestamp: '14:45', hour: 14, pvPowerKw: 285.0, irradianceWm2: 580, quality: 'NORMAL', source: '阳光电源 Modbus-TCP' },
      { timestamp: '15:00', hour: 15, pvPowerKw: 268.4, irradianceWm2: 540, quality: 'NORMAL', source: '阳光电源 Modbus-TCP' },
    ];

    // 6. 昨日历史全天实测对比 (00:00 - 23:00)
    const pvYesterdaySamples: PvTrendSample[] = Array.from({ length: 24 }).map((_, hour) => {
      const isNight = hour < 6 || hour >= 19;
      const irradiance = isNight ? 0 : Math.sin(((hour - 6) / 12) * Math.PI) * 850;
      const pvPower = isNight ? 0 : Math.sin(((hour - 6) / 12) * Math.PI) * 420.5;
      return {
        timestamp: `${String(hour).padStart(2, '0')}:00`,
        hour,
        pvPowerKw: Number(pvPower.toFixed(1)),
        irradianceWm2: Number(irradiance.toFixed(0)),
        quality: 'NORMAL' as const,
        source: '昨日历史实测归档对账库',
        isNightZero: isNight,
      };
    });

    return {
      kpiPoints,
      inverters,
      pvTrendSamples,
      pvRecent4hSamples,
      pvYesterdaySamples,
      capacityKwp,
      dailyYieldKwh,
      totalYieldMwh,
      equivalentHours,
      realtimePowerKw: basePvPower,
      solarIrradiationWm2: telemetry.solarIrradiationWm2 || 860,
      ambientTempC: telemetry.ambientTempC || 28.5,
      isSuspiciousZeroState,
      isPartialOfflineState,
      isUnmappedState,
    };
  }, [
    simulatedStateOverride,
    telemetry,
    site,
    lastDataTimestamp,
  ]);

  return {
    site,
    unifiedPoints,
    unifiedDevices,
    deviceStatusSummary,
    trendSamples,
    telemetry,
    scenario,
    currentRole,
    isInspectorRole,
    // 光伏专项同一数据源选择器
    pvMonitorData,
    // 刷新控制器
    countdown,
    refreshIntervalSeconds,
    setRefreshIntervalSeconds,
    isStreamInterrupted,
    toggleStreamInterrupted,
    resumeStream,
    lastDataTimestamp,
    refreshCount,
    // 状态模拟
    activeSystemState,
    simulatedStateOverride,
    setSimulatedStateOverride,
  };
}
