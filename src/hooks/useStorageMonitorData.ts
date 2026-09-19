import { useState, useMemo } from 'react';
import { useAppStore } from '../store/AppContext';
import { useMonitorData } from './useMonitorData';
import {
  StorageTrendSample,
  StoragePcsDetail,
  StorageBatteryClusterDetail,
  StorageAuxiliarySystem,
  UnifiedMonitorPoint,
} from '../types/monitor';

export type StorageSimulatedState =
  | 'NORMAL_CHARGING' // 正常谷电充电 (当前默认)
  | 'NORMAL_DISCHARGING' // 正常高峰放电
  | 'STANDBY' // 正常待机
  | 'SUSPICIOUS_BMS' // 3# 簇电芯温差偏大可疑
  | 'EMS_INTERRUPTED' // EMS 断线中断 (等同于场景 B)
  | 'NO_DEVICES' // 无设备
  | 'ERROR' // 加载失败
  | 'FORBIDDEN'; // 无权限

export function useStorageMonitorData() {
  const {
    site,
    scenario,
    switchScenario,
    alarms,
    qualityIssues,
    currentUser,
    currentRole,
  } = useAppStore();

  const {
    countdown,
    refreshIntervalSeconds,
    setRefreshIntervalSeconds,
    isStreamInterrupted,
    toggleStreamInterrupted,
    resumeStream,
    lastDataTimestamp,
    isInspectorRole,
  } = useMonitorData();

  // 本地演练状态覆盖 (支持切换 8 大受控状态)
  const [simulatedState, setSimulatedState] = useState<StorageSimulatedState | null>(null);

  // 判断是否处于场景 B 或 EMS 真实断线状态
  const isEmsInterrupted =
    simulatedState === 'EMS_INTERRUPTED' || scenario === 'SCENARIO_B' || isStreamInterrupted;

  // 判断是否模拟部分 BMS 可疑
  const isSuspiciousBms = simulatedState === 'SUSPICIOUS_BMS';

  // 判断工况模式 (放电 / 待机 / 充电)
  const operatingMode = useMemo(() => {
    if (simulatedState === 'NORMAL_DISCHARGING') return 'DISCHARGING';
    if (simulatedState === 'STANDBY') return 'STANDBY';
    if (isEmsInterrupted) return 'FAULT';
    return 'CHARGING';
  }, [simulatedState, isEmsInterrupted]);

  // 储能核心参数根据模式联动
  const activePowerKw = useMemo(() => {
    if (isEmsInterrupted) return -180.0; // 场景 B 停滞在 05:37:12 断线前最后帧
    if (operatingMode === 'DISCHARGING') return 240.0; // 高峰放电 +240 kW
    if (operatingMode === 'STANDBY') return 0.0; // 待机 0 kW
    return -180.0; // 谷电充电 -180 kW
  }, [isEmsInterrupted, operatingMode]);

  const socPercent = useMemo(() => {
    if (isEmsInterrupted) return 74.2; // 停滞在 05:37:12
    if (operatingMode === 'DISCHARGING') return 52.8;
    if (operatingMode === 'STANDBY') return 85.0;
    return 74.2;
  }, [isEmsInterrupted, operatingMode]);

  const sohPercent = 98.6; // 电池系统全生命周期健康度

  const dailyChargeKwh = operatingMode === 'STANDBY' ? 380.0 : 420.5;
  const dailyDischargeKwh = operatingMode === 'DISCHARGING' ? 680.0 : 512.0;

  // 场景 B 停滞时间戳
  const emsFrozenTimestamp = '2026-09-05 05:37:12';
  const effectiveDataTimestamp = isEmsInterrupted ? `${emsFrozenTimestamp} (停滞过期)` : lastDataTimestamp;

  // 1. 顶部 6 大核心 KPI 点位 (统一数据口径)
  const kpiPoints: UnifiedMonitorPoint[] = useMemo(() => {
    return [
      // KPI 1: 能量状态 (SOC %)
      {
        id: 'POINT-BAT-SOC',
        deviceId: 'DEV-STORAGE-SYS01',
        deviceName: '示范站 500kW/1000kWh 储能预制舱',
        subsystem: 'STORAGE',
        pointName: '电池系统荷电状态 (SOC)',
        standardCode: 'BATT_SOC_PERCENT',
        value: socPercent,
        formattedValue: isEmsInterrupted ? '74.2' : socPercent.toFixed(1),
        unit: '%',
        timeScope: 'REALTIME',
        quality: isEmsInterrupted ? 'EXPIRED' : 'NORMAL',
        qualitySource: '时代星云 CATL-Nebula EMS 电池簇控 (IEC 61850)',
        qualityReason: isEmsInterrupted
          ? 'TCP/IP 连接建立超时，连续 3 个周期无心跳响应，数据已冻结停滞，禁止作为实时控制依据'
          : '簇控通信良好，单体电芯最高压差 13mV，温度均衡无过充过放',
        lastUpdated: effectiveDataTimestamp,
        isBidirectional: false,
      },
      // KPI 2: 健康状态 (SOH %)
      {
        id: 'POINT-BAT-SOH',
        deviceId: 'DEV-STORAGE-SYS01',
        deviceName: '示范站 500kW/1000kWh 储能预制舱',
        subsystem: 'STORAGE',
        pointName: '电池系统健康状态 (SOH)',
        standardCode: 'BATT_SOH_PERCENT',
        value: sohPercent,
        formattedValue: sohPercent.toFixed(1),
        unit: '%',
        timeScope: 'REALTIME',
        quality: 'NORMAL',
        qualitySource: '时代星云 BMS 容量衰减寿命衰减评估算法库',
        qualityReason: '累计完整等效充放电循环 412 次，容量衰减率 1.4% 符合 10 年质保曲线',
        lastUpdated: effectiveDataTimestamp,
        isBidirectional: false,
      },
      // KPI 3: PCS 实时充放电功率 (kW, 双向)
      {
        id: 'POINT-BAT-POWER',
        deviceId: 'DEV-STORAGE-PCS01',
        deviceName: '时代星云 500kW 变流升压一体机 (PCS)',
        subsystem: 'STORAGE',
        pointName: 'PCS 变流器实时出力功率',
        standardCode: 'PCS_ACTIVE_POWER',
        value: activePowerKw,
        formattedValue: activePowerKw.toFixed(1),
        unit: 'kW',
        timeScope: 'REALTIME',
        quality: isEmsInterrupted ? 'EXPIRED' : 'NORMAL',
        qualitySource: '时代星云 PCS 交流测控 Modbus-TCP 四象限采样',
        qualityReason: isEmsInterrupted
          ? 'EMS 通信中断，停滞在断线前最后帧 -180.0kW，当前实际物理状态不可确认'
          : activePowerKw < 0
          ? '负值 (-) 表示吸收电能充电中，低谷蓄能正常'
          : activePowerKw > 0
          ? '正值 (+) 表示输出电能放电中，顶峰支撑正常'
          : '零值待机状态',
        lastUpdated: effectiveDataTimestamp,
        powerDirectionNote: activePowerKw >= 0 ? '+ 正值放电' : '- 负值充电',
        isBidirectional: true,
      },
      // KPI 4: 今日累计充电量 (kWh)
      {
        id: 'POINT-STORAGE-CHG-DAY',
        deviceId: 'DEV-STORAGE-METER01',
        deviceName: '储能交流侧专用高精度双向电能表',
        subsystem: 'STORAGE',
        pointName: '今日累计吸收充电量',
        standardCode: 'STORAGE_DAILY_CHARGE_KWH',
        value: dailyChargeKwh,
        formattedValue: dailyChargeKwh.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        unit: 'kWh',
        timeScope: 'TODAY_CUMULATIVE',
        quality: isEmsInterrupted ? 'SUSPICIOUS' : 'NORMAL',
        qualitySource: '0.5S 级智能电表正向有功电量寄存器',
        qualityReason: isEmsInterrupted
          ? '05:37 之后由于 EMS 链路丢失，电表计费脉冲无法实时归档，结算已锁定待补录'
          : '正向电量日内微积分无异常跳变，与充电订单一致',
        lastUpdated: effectiveDataTimestamp,
        isBidirectional: false,
      },
      // KPI 5: 今日累计放电量 (kWh)
      {
        id: 'POINT-STORAGE-DIS-DAY',
        deviceId: 'DEV-STORAGE-METER01',
        deviceName: '储能交流侧专用高精度双向电能表',
        subsystem: 'STORAGE',
        pointName: '今日累计释放放电量',
        standardCode: 'STORAGE_DAILY_DISCHARGE_KWH',
        value: dailyDischargeKwh,
        formattedValue: dailyDischargeKwh.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        unit: 'kWh',
        timeScope: 'TODAY_CUMULATIVE',
        quality: isEmsInterrupted ? 'SUSPICIOUS' : 'NORMAL',
        qualitySource: '0.5S 级智能电表反向有功电量寄存器',
        qualityReason: isEmsInterrupted
          ? '反向有功脉冲未收到最新确认，需现场核对电表底度'
          : '反向电量微积分累加平稳，放电套利计量正常',
        lastUpdated: effectiveDataTimestamp,
        isBidirectional: false,
      },
      // KPI 6: 储能核准容量 (500 kW / 1000 kWh)
      {
        id: 'POINT-STORAGE-CAPACITY',
        deviceId: 'DEV-STORAGE-SYS01',
        deviceName: '示范站 500kW/1000kWh 储能预制舱',
        subsystem: 'STORAGE',
        pointName: '储能系统额定装机规模',
        standardCode: 'STORAGE_RATED_CAPACITY',
        value: 500,
        formattedValue: '500 / 1000',
        unit: 'kW / kWh',
        timeScope: 'REALTIME',
        quality: 'NORMAL',
        qualitySource: '电网接入批复文件与铭牌台账',
        qualityReason: '1套 500kW PCS 变流升压舱 + 1套 1000kWh 磷酸铁锂液冷电池舱',
        lastUpdated: effectiveDataTimestamp,
        isBidirectional: false,
      },
    ];
  }, [socPercent, sohPercent, activePowerKw, dailyChargeKwh, dailyDischargeKwh, isEmsInterrupted, effectiveDataTimestamp]);

  // 2. 储能 PCS 变流器设备明细
  const pcsDetail: StoragePcsDetail = useMemo(() => {
    return {
      id: 'DEV-STORAGE-PCS01',
      siteId: site.id,
      name: '时代星云 500kW 储能变流升压一体机 (PCS)',
      type: 'PCS',
      subsystem: 'STORAGE',
      manufacturer: '时代星云 (CATL-Nebula)',
      model: 'NEB-500K-HV',
      ratedCapacity: '500 kW',
      status: isEmsInterrupted ? 'ALARM' : operatingMode === 'STANDBY' ? 'NORMAL' : 'NORMAL',
      lastDataTime: effectiveDataTimestamp,
      sourceAdapterId: 'ADAPTER-STORAGE-02',
      sourcePlatform: '时代星云 CATL-Nebula EMS 本地通信网关 (IEC 61850)',
      activePowerKw,
      reactivePowerKvar: 2.1,
      powerFactor: 0.999,
      acVoltageV: 400.5,
      acCurrentA: isEmsInterrupted ? 0.0 : Math.abs(activePowerKw) > 0 ? 260.4 : 0.0,
      frequencyHz: 50.02,
      igbtTempC: isEmsInterrupted ? 48.5 : 46.2,
      conversionEfficiency: 98.4,
      runningMode: isEmsInterrupted ? 'FAULT' : operatingMode,
      dailyChargeKwh,
      dailyDischargeKwh,
      protectionThresholds: {
        overCurrentA: 350.0, // 交流侧过流跳闸
        overVoltageV: 460.0, // 交流过压跳闸
        underVoltageV: 340.0, // 交流欠压跳闸
        overFrequencyHz: 50.5, // 过频解列
        antiIslandingDelayMs: 200, // 防孤岛脱网时延
      },
      points: kpiPoints.filter((p) => p.deviceId === 'DEV-STORAGE-PCS01'),
      primaryPoint: kpiPoints.find((p) => p.id === 'POINT-BAT-POWER'),
      linkedAlarms: isEmsInterrupted
        ? [
            {
              id: 'ALM-STORAGE-COMM-01',
              title: '储能 EMS 连续 3 个采集周期无心跳响应 (紧急通信中断)',
              severity: 'CRITICAL',
              time: '2026-09-05 05:37:12',
              description: '前置交换机本地端口指示灯疑似异常，导致与中心平台链路中断，调度策略暂停。',
            },
          ]
        : [],
    };
  }, [site.id, isEmsInterrupted, operatingMode, activePowerKw, dailyChargeKwh, dailyDischargeKwh, kpiPoints, effectiveDataTimestamp]);

  // 3. 储能 4 个电池簇明细 (BMS 簇控)
  const batteryClusters: StorageBatteryClusterDetail[] = useMemo(() => {
    return [
      {
        id: 'DEV-STORAGE-CLUS01',
        siteId: site.id,
        name: '1# 电池簇 (Rack-01)',
        type: 'BATTERY_CLUSTER',
        subsystem: 'STORAGE',
        manufacturer: '宁德时代 (CATL)',
        model: 'EnerOne 280Ah LFP',
        ratedCapacity: '250 kWh',
        status: isEmsInterrupted ? 'ALARM' : 'NORMAL',
        lastDataTime: effectiveDataTimestamp,
        sourceAdapterId: 'ADAPTER-STORAGE-02',
        sourcePlatform: 'CATL 高压箱簇控 BMS (CAN/Modbus)',
        clusterIndex: 1,
        ratedCapacityKwh: 250,
        voltageV: 748.5,
        currentA: isEmsInterrupted ? 0.0 : activePowerKw < 0 ? -60.2 : activePowerKw > 0 ? 80.1 : 0.0,
        socPercent: 74.5,
        sohPercent: 98.8,
        maxCellVoltageV: 3.255,
        maxCellVoltageLocation: 'Module-02 Cell #42',
        minCellVoltageV: 3.242,
        minCellVoltageLocation: 'Module-08 Cell #108',
        cellVoltageDeltaMv: 13,
        maxCellTempC: 28.6,
        maxCellTempLocation: 'Module-05 Temp #88',
        minCellTempC: 26.2,
        minCellTempLocation: 'Module-01 Temp #12',
        cellTempDeltaC: 2.4,
        insulationResistancePositiveMohm: 18.5,
        insulationResistanceNegativeMohm: 19.1,
        equalizationStatus: 'IDLE',
        cellCount: 240,
        points: [],
      },
      {
        id: 'DEV-STORAGE-CLUS02',
        siteId: site.id,
        name: '2# 电池簇 (Rack-02)',
        type: 'BATTERY_CLUSTER',
        subsystem: 'STORAGE',
        manufacturer: '宁德时代 (CATL)',
        model: 'EnerOne 280Ah LFP',
        ratedCapacity: '250 kWh',
        status: isEmsInterrupted ? 'ALARM' : 'NORMAL',
        lastDataTime: effectiveDataTimestamp,
        sourceAdapterId: 'ADAPTER-STORAGE-02',
        sourcePlatform: 'CATL 高压箱簇控 BMS (CAN/Modbus)',
        clusterIndex: 2,
        ratedCapacityKwh: 250,
        voltageV: 748.2,
        currentA: isEmsInterrupted ? 0.0 : activePowerKw < 0 ? -60.1 : activePowerKw > 0 ? 79.9 : 0.0,
        socPercent: 74.2,
        sohPercent: 98.5,
        maxCellVoltageV: 3.256,
        maxCellVoltageLocation: 'Module-01 Cell #15',
        minCellVoltageV: 3.241,
        minCellVoltageLocation: 'Module-06 Cell #76',
        cellVoltageDeltaMv: 15,
        maxCellTempC: 29.1,
        maxCellTempLocation: 'Module-04 Temp #62',
        minCellTempC: 26.4,
        minCellTempLocation: 'Module-01 Temp #08',
        cellTempDeltaC: 2.7,
        insulationResistancePositiveMohm: 19.2,
        insulationResistanceNegativeMohm: 18.8,
        equalizationStatus: 'IDLE',
        cellCount: 240,
        points: [],
      },
      {
        id: 'DEV-STORAGE-CLUS03',
        siteId: site.id,
        name: '3# 电池簇 (Rack-03)',
        type: 'BATTERY_CLUSTER',
        subsystem: 'STORAGE',
        manufacturer: '宁德时代 (CATL)',
        model: 'EnerOne 280Ah LFP',
        ratedCapacity: '250 kWh',
        status: isEmsInterrupted ? 'ALARM' : isSuspiciousBms ? 'SUSPICIOUS' : 'NORMAL',
        lastDataTime: effectiveDataTimestamp,
        sourceAdapterId: 'ADAPTER-STORAGE-02',
        sourcePlatform: 'CATL 高压箱簇控 BMS (CAN/Modbus)',
        clusterIndex: 3,
        ratedCapacityKwh: 250,
        voltageV: 748.0,
        currentA: isEmsInterrupted ? 0.0 : activePowerKw < 0 ? -60.0 : activePowerKw > 0 ? 80.0 : 0.0,
        socPercent: 73.9,
        sohPercent: 98.4,
        maxCellVoltageV: 3.258,
        maxCellVoltageLocation: 'Module-03 Cell #34',
        minCellVoltageV: 3.238,
        minCellVoltageLocation: 'Module-07 Cell #92',
        cellVoltageDeltaMv: isSuspiciousBms ? 28 : 20,
        maxCellTempC: isSuspiciousBms ? 32.5 : 29.8,
        maxCellTempLocation: 'Module-07 Temp #112',
        minCellTempC: 26.5,
        minCellTempLocation: 'Module-02 Temp #24',
        cellTempDeltaC: isSuspiciousBms ? 6.0 : 3.3, // 超过 5℃ 门槛即触发温差预警
        insulationResistancePositiveMohm: 17.8,
        insulationResistanceNegativeMohm: 18.2,
        equalizationStatus: isSuspiciousBms ? 'ACTIVE' : 'IDLE',
        cellCount: 240,
        isSuspicious: isSuspiciousBms,
        suspiciousReason: isSuspiciousBms
          ? '3# 电池簇电芯最大温差高达 6.0℃ (探头#112 为 32.5℃)，偏离均温门槛，已触发被动均衡与风控可疑标牌'
          : undefined,
        points: [],
        linkedAlarms: isSuspiciousBms
          ? [
              {
                id: 'ALM-BMS-TEMP-03',
                title: '3# 电池簇电芯温差偏大预警 (ΔT=6.0℃)',
                severity: 'MINOR',
                time: '2026-09-05 06:05:00',
                description: '检测到 3# 簇 Module-07 探头温升偏快，建议检查就地液冷分流阀开度。',
              },
            ]
          : [],
      },
      {
        id: 'DEV-STORAGE-CLUS04',
        siteId: site.id,
        name: '4# 电池簇 (Rack-04)',
        type: 'BATTERY_CLUSTER',
        subsystem: 'STORAGE',
        manufacturer: '宁德时代 (CATL)',
        model: 'EnerOne 280Ah LFP',
        ratedCapacity: '250 kWh',
        status: isEmsInterrupted ? 'ALARM' : 'NORMAL',
        lastDataTime: effectiveDataTimestamp,
        sourceAdapterId: 'ADAPTER-STORAGE-02',
        sourcePlatform: 'CATL 高压箱簇控 BMS (CAN/Modbus)',
        clusterIndex: 4,
        ratedCapacityKwh: 250,
        voltageV: 748.1,
        currentA: isEmsInterrupted ? 0.0 : activePowerKw < 0 ? -60.3 : activePowerKw > 0 ? 80.0 : 0.0,
        socPercent: 74.2,
        sohPercent: 98.7,
        maxCellVoltageV: 3.255,
        maxCellVoltageLocation: 'Module-02 Cell #28',
        minCellVoltageV: 3.242,
        minCellVoltageLocation: 'Module-05 Cell #70',
        cellVoltageDeltaMv: 13,
        maxCellTempC: 28.8,
        maxCellTempLocation: 'Module-03 Temp #48',
        minCellTempC: 26.3,
        minCellTempLocation: 'Module-01 Temp #02',
        cellTempDeltaC: 2.5,
        insulationResistancePositiveMohm: 18.9,
        insulationResistanceNegativeMohm: 19.0,
        equalizationStatus: 'IDLE',
        cellCount: 240,
        points: [],
      },
    ];
  }, [site.id, isEmsInterrupted, isSuspiciousBms, activePowerKw, effectiveDataTimestamp]);

  // 4. 辅助系统 (液冷、消防、智能电表)
  const auxiliarySystems: StorageAuxiliarySystem = useMemo(() => {
    return {
      liquidCooling: {
        inletTempC: 19.2,
        outletTempC: 23.8,
        deltaTempC: 4.6,
        pressureMpa: 0.28,
        pumpStatus: isEmsInterrupted ? 'STANDBY' : 'RUNNING',
        chillerStatus: isEmsInterrupted ? 'STANDBY' : 'COOLING',
        flowRateLmin: 48.5,
        expansionTankLevelPercent: 82,
        source: '时代星云液冷机组温控 PLC (Modbus-RTU)',
        lastUpdated: effectiveDataTimestamp,
      },
      fireSafety: {
        controllerStatus: isEmsInterrupted ? 'MONITORING' : 'MONITORING',
        aerosolPressureMpa: 2.5,
        smokeDetectorStatus: 'NORMAL',
        tempDetectorStatus: 'NORMAL',
        chamberAvgTempC: 24.5,
        coGasPpm: 0,
        h2GasPpm: 0,
        pressureReliefValve: 'NORMAL_CLOSED',
        eStopStatus: 'NORMAL_CLOSED',
        source: '海湾七氟丙烷气体灭火控制器 (干接点/RS485)',
        lastUpdated: effectiveDataTimestamp,
      },
      smartMeter: {
        id: 'DEV-STORAGE-METER01',
        name: '储能交流侧专用高精度双向电能表',
        voltageA: 231.5,
        voltageB: 230.8,
        voltageC: 231.2,
        currentA: 260.4,
        currentB: 259.8,
        currentC: 260.1,
        activePowerKw,
        reactivePowerKvar: 2.1,
        powerFactor: 0.999,
        positiveActiveKwh: 412.5, // 累计充电
        reverseActiveKwh: 508.2, // 累计放电
        frequencyHz: 50.01,
        meterClass: '0.5S 级智能电表 (DL/T 645-2007)',
        source: '威胜 10kV 储能专用计量表 (DL/T 645-2007)',
        lastUpdated: effectiveDataTimestamp,
      },
    };
  }, [isEmsInterrupted, activePowerKw, effectiveDataTimestamp]);

  // 5. 24 小时实测曲线 (处理场景 B 真实缺口)
  const trendSamples24h: StorageTrendSample[] = useMemo(() => {
    return Array.from({ length: 24 }).map((_, hour) => {
      // 场景 B 核心事实：05:37 发生通信中断。因此 06:00 起的实测点位真实缺失，不能连线插值！
      const isBrokenInScenarioB = isEmsInterrupted && hour >= 6;

      let power: number | null = 0;
      let soc: number | null = 70;
      let state: 'CHARGING' | 'DISCHARGING' | 'STANDBY' | 'DISCONNECTED' = 'STANDBY';

      if (isBrokenInScenarioB) {
        power = null;
        soc = null;
        state = 'DISCONNECTED';
      } else {
        // 谷段充电 (00:00 - 06:30)
        if (hour >= 0 && hour <= 5) {
          power = -180.0 - (hour % 3) * 15;
          soc = 25 + hour * 10;
          state = 'CHARGING';
        }
        // 平段待机 (06:30 - 08:30)
        else if (hour >= 6 && hour <= 8) {
          power = 0;
          soc = 85;
          state = 'STANDBY';
        }
        // 早高峰放电 (08:30 - 11:30)
        else if (hour >= 9 && hour <= 11) {
          power = 240.0 + (hour % 2) * 20;
          soc = 85 - (hour - 8) * 18;
          state = 'DISCHARGING';
        }
        // 午间谷补充 (11:30 - 14:30)
        else if (hour >= 12 && hour <= 13) {
          power = -150.0;
          soc = 35 + (hour - 11) * 15;
          state = 'CHARGING';
        }
        // 平段待机 (14:30 - 19:00)
        else if (hour >= 14 && hour <= 18) {
          power = 0;
          soc = 65;
          state = 'STANDBY';
        }
        // 晚尖峰放电 (19:00 - 21:00)
        else if (hour >= 19 && hour <= 20) {
          power = 320.0;
          soc = 65 - (hour - 18) * 22;
          state = 'DISCHARGING';
        }
        // 夜间待机并转入谷充
        else {
          power = hour === 23 ? -180.0 : 0;
          soc = 25;
          state = hour === 23 ? 'CHARGING' : 'STANDBY';
        }
      }

      return {
        timestamp: `${String(hour).padStart(2, '0')}:00`,
        hour,
        pcsPowerKw: power !== null ? Number(power.toFixed(1)) : null,
        socPercent: soc !== null ? Number(Math.max(10, Math.min(95, soc)).toFixed(1)) : null,
        quality: isBrokenInScenarioB ? 'EXPIRED' : 'NORMAL',
        source: isBrokenInScenarioB
          ? '时代星云 EMS 通信网关 (已中断无上报)'
          : '时代星云 EMS 实测有功与荷电四象限寄存器',
        isDataMissing: isBrokenInScenarioB,
        missingReason: isBrokenInScenarioB
          ? '05:37:12 时代星云通信中断，缺少实测采样帧，杜绝插值连线'
          : undefined,
        operatingState: state,
      };
    });
  }, [isEmsInterrupted]);

  // 6. 最近 4 小时高频采样 (03:00 到 07:00，展现 05:37:12 断线瞬间)
  const recent4hSamples: StorageTrendSample[] = useMemo(() => {
    const timeSlots = [
      { t: '03:00', h: 3, m: 0, p: -185.0, s: 55.0 },
      { t: '03:30', h: 3, m: 30, p: -188.0, s: 60.0 },
      { t: '04:00', h: 4, m: 0, p: -190.0, s: 65.0 },
      { t: '04:30', h: 4, m: 30, p: -185.0, s: 70.0 },
      { t: '05:00', h: 5, m: 0, p: -180.0, s: 72.5 },
      { t: '05:30', h: 5, m: 30, p: -180.0, s: 74.0 },
      // 05:37:12 断线点
      { t: '05:45', h: 5, m: 45, p: null, s: null, isMissing: true },
      { t: '06:00', h: 6, m: 0, p: null, s: null, isMissing: true },
      { t: '06:30', h: 6, m: 30, p: null, s: null, isMissing: true },
      { t: '07:00', h: 7, m: 0, p: null, s: null, isMissing: true },
    ];

    return timeSlots.map((item) => {
      const isMissing = isEmsInterrupted && item.isMissing;
      return {
        timestamp: item.t,
        hour: item.h,
        minute: item.m,
        pcsPowerKw: isMissing ? null : item.p,
        socPercent: isMissing ? null : item.s,
        quality: isMissing ? 'EXPIRED' : 'NORMAL',
        source: '时代星云 EMS 高频测控',
        isDataMissing: isMissing,
        missingReason: isMissing
          ? '05:37:12 EMS 本地通信网关断线，无心跳帧，杜绝插值平滑'
          : undefined,
        operatingState: isMissing ? 'DISCONNECTED' : 'CHARGING',
      };
    });
  }, [isEmsInterrupted]);

  // 7. 昨日完整循环实测基准 (用于历史复盘对照)
  const yesterdaySamples: StorageTrendSample[] = useMemo(() => {
    return Array.from({ length: 24 }).map((_, hour) => {
      let p = 0;
      let s = 70;
      if (hour >= 0 && hour <= 5) {
        p = -180.0;
        s = 25 + hour * 10;
      } else if (hour >= 6 && hour <= 8) {
        p = 0;
        s = 85;
      } else if (hour >= 9 && hour <= 11) {
        p = 240.0;
        s = 85 - (hour - 8) * 18;
      } else if (hour >= 12 && hour <= 13) {
        p = -150.0;
        s = 35 + (hour - 11) * 15;
      } else if (hour >= 14 && hour <= 18) {
        p = 0;
        s = 65;
      } else if (hour >= 19 && hour <= 20) {
        p = 320.0;
        s = 65 - (hour - 18) * 22;
      } else {
        p = hour === 23 ? -180.0 : 0;
        s = 25;
      }

      return {
        timestamp: `${String(hour).padStart(2, '0')}:00`,
        hour,
        pcsPowerKw: Number(p.toFixed(1)),
        socPercent: Number(Math.max(10, Math.min(95, s)).toFixed(1)),
        quality: 'NORMAL',
        source: '昨日历史实测归档对账库',
        operatingState: p < 0 ? 'CHARGING' : p > 0 ? 'DISCHARGING' : 'STANDBY',
      };
    });
  }, []);

  // 8. 关联近期告警 (过滤出与储能相关的告警)
  const linkedStorageAlarms = useMemo(() => {
    return alarms.filter(
      (a) =>
        a.deviceName.includes('储能') ||
        a.deviceName.includes('EMS') ||
        a.deviceName.includes('PCS') ||
        a.deviceName.includes('BMS') ||
        a.alarmTitle.includes('储能') ||
        a.alarmTitle.includes('EMS')
    );
  }, [alarms]);

  return {
    site,
    scenario,
    switchScenario,
    currentUser,
    currentRole,
    isInspectorRole,
    // 时钟与自动刷新
    countdown,
    refreshIntervalSeconds,
    setRefreshIntervalSeconds,
    isStreamInterrupted,
    toggleStreamInterrupted,
    resumeStream,
    lastDataTimestamp,
    effectiveDataTimestamp,
    emsFrozenTimestamp,
    // 状态仿真
    simulatedState,
    setSimulatedState,
    isEmsInterrupted,
    isSuspiciousBms,
    operatingMode,
    // 核心指标与设备数据
    kpiPoints,
    pcsDetail,
    batteryClusters,
    auxiliarySystems,
    trendSamples24h,
    recent4hSamples,
    yesterdaySamples,
    linkedStorageAlarms,
    qualityIssues,
  };
}
