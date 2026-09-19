import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '../store/AppContext';
import { useMonitorData } from './useMonitorData';
import {
  GridSimulatedState,
  GridKpiData,
  WeatherObservationData,
  EnergyFlowNode,
  EnergyFlowEdge,
  PowerBalanceSummary,
  GridTrendSample,
} from '../types/grid';

export function useGridMonitorData() {
  const {
    site,
    telemetry,
    tariffScheme,
    alarms,
    scenario,
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

  // 模拟演练状态切换 (覆盖 11 大受控场景供验收)
  const [simulatedState, setSimulatedState] = useState<GridSimulatedState>('NORMAL');

  // 时钟联动与刷新
  const [refreshCount, setRefreshCount] = useState<number>(0);
  useEffect(() => {
    if (isStreamInterrupted) return;
    setRefreshCount((c) => c + 1);
  }, [lastDataTimestamp, isStreamInterrupted]);

  // 判断是否处于电表离线状态 (关口表中断 或 场景 B 储能异常联动)
  const isGridMeterOffline =
    simulatedState === 'GRID_METER_OFFLINE' || isStreamInterrupted;

  // 判断是否处于气象数据缺失状态
  const isWeatherMissing = simulatedState === 'WEATHER_MISSING';

  // 判断是否处于异常状态 (需量预警/功率因数异常)
  const isPartialAnomaly = simulatedState === 'PARTIAL_ANOMALY';

  // 1. 各子系统功率实时数值 (严格与 P06-P08 页面同源)
  // 光伏实时功率 (P06 同源：432.8 kW)
  const pvPowerKw = useMemo(() => {
    if (simulatedState === 'FEED_IN_SURPLUS') return 520.0;
    if (simulatedState === 'SELF_CONSUMPTION') return 215.0; // 恰好覆盖负荷
    return telemetry.pvActivePowerKw || 432.8;
  }, [simulatedState, telemetry.pvActivePowerKw]);

  // 储能实时功率 (P07 同源：+放 / -充)
  const storagePowerKw = useMemo(() => {
    if (simulatedState === 'STORAGE_DISCHARGING') return 240.0; // 高峰放电 +240 kW
    if (simulatedState === 'STORAGE_CHARGING') return -220.0; // 谷电充电 -220 kW
    if (simulatedState === 'SELF_CONSUMPTION') return 0.0; // 待机 0 kW
    if (simulatedState === 'FEED_IN_SURPLUS') return 0.0; // 满电待机 0 kW
    return -180.0; // 正常模式：充电 -180 kW
  }, [simulatedState]);

  // 充电桩群实时负荷 (P08 同源：128.4 kW)
  const chargingLoadKw = 128.4;

  // 站内基础厂用负荷 (办公楼/空调照明/辅助动力：85.0 kW)
  const baseStationLoadKw = 85.0;

  // 站内总负荷
  const totalStationLoadKw = Number((chargingLoadKw + baseStationLoadKw).toFixed(1)); // 213.4 kW

  // 电网关口受电功率计算 (+购 / -售)
  // 公式：电网功率 = 站内总负荷 - 光伏发电 - 储能放电 (+放 / -充)
  // 正值购电，负值上网
  const calculatedGridPowerKw = useMemo(() => {
    if (isGridMeterOffline) return null;

    if (simulatedState === 'SELF_CONSUMPTION') {
      return 1.2; // 自发自用，电网微量受电维持电压
    }
    if (simulatedState === 'FEED_IN_SURPLUS') {
      // 520 - 213.4 = 306.6 kW 上网
      return -306.6;
    }
    if (simulatedState === 'STORAGE_DISCHARGING') {
      // 进线: 光伏 432.8 + 储能放电 240.0 = 672.8 kW
      // 负荷: 213.4 kW
      // 反送电网: 672.8 - 213.4 = 459.4 kW (反送为负)
      return -459.4;
    }
    if (simulatedState === 'STORAGE_CHARGING') {
      // 负荷 213.4 kW + 储能吸收 220.0 kW = 433.4 kW
      // 光伏 432.8 kW
      // 电网购电: 433.4 - 432.8 = +0.6 kW
      return 0.6;
    }

    // 默认 NORMAL 工况：
    // 光伏 432.8 kW, 储能吸收 180.0 kW, 负荷 213.4 kW
    // 总吸收 = 393.4 kW, 光伏发 432.8 kW
    // 余电上网 = -(432.8 - 393.4) = -39.4 kW (考虑测量微小非同期误差 1.2 kW -> -38.2 kW)
    return -38.2;
  }, [isGridMeterOffline, simulatedState]);

  // 2. 电网 KPI 数据聚合
  const gridKpi: GridKpiData = useMemo(() => {
    const pwr = calculatedGridPowerKw;
    let direction: 'PURCHASE' | 'FEED_IN' | 'ZERO' | 'DISCONNECTED' = 'DISCONNECTED';
    let directionLabel = '关口表通信离线';

    if (pwr !== null) {
      if (Math.abs(pwr) < 0.5) {
        direction = 'ZERO';
        directionLabel = '近零平衡交互';
      } else if (pwr > 0) {
        direction = 'PURCHASE';
        directionLabel = '下网受电购电中';
      } else {
        direction = 'FEED_IN';
        directionLabel = '余电反送上网中';
      }
    }

    // 需量统计 (合同需量 800 kW，取自示范站申报需量)
    const contractDemandKw = 800.0;
    const currentDemandKw = isPartialAnomaly
      ? 718.5 // 异常时接近 800 kW 触发预警
      : pwr !== null && pwr > 0
      ? Math.max(120.0, Number((pwr * 1.05).toFixed(1)))
      : 386.4; // 历史滑窗采样最大需量

    const demandUtilizationPercent = Number(((currentDemandKw / contractDemandKw) * 100).toFixed(1));
    const isDemandNearLimit = demandUtilizationPercent >= 80.0;

    let demandWarningMessage: string | undefined = undefined;
    if (isDemandNearLimit) {
      demandWarningMessage = `当前 15 分钟实测最大需量达到 ${currentDemandKw} kW (占合同申报值 ${demandUtilizationPercent}%)，已突破 80% 警戒基线。根据《福建电网供用电合同》，超过申报值将征收加倍基本电费。建议运行人员协调微网柔性充电桩负荷削峰，或申报上调合同需量。系统处于只读监测，无任何下行远程控制。`;
    }

    // 功率因数 (cosφ)
    const powerFactor = isPartialAnomaly ? 0.82 : 0.97;
    const powerFactorQuality = isPartialAnomaly ? 'SUSPICIOUS' : 'NORMAL';

    return {
      gridPowerKw: pwr,
      gridDirection: direction,
      gridDirectionLabel: directionLabel,
      totalStationLoadKw,
      chargingLoadKw,
      baseStationLoadKw,
      currentDemandKw,
      contractDemandKw,
      demandUtilizationPercent,
      isDemandNearLimit,
      demandWarningMessage,
      powerFactor,
      powerFactorQuality,
      reactivePowerKvar: isPartialAnomaly ? 85.2 : 21.4,
      gridFrequencyHz: 50.02,
      threePhaseVoltage: {
        va: 10024, // 10kV 进线
        vb: 10018,
        vc: 10031,
      },
      threePhaseCurrent: {
        ia: pwr !== null ? Number((Math.abs(pwr) / (10 * Math.sqrt(3) * 0.95)).toFixed(1)) : 0,
        ib: pwr !== null ? Number((Math.abs(pwr) / (10 * Math.sqrt(3) * 0.95)).toFixed(1)) : 0,
        ic: pwr !== null ? Number((Math.abs(pwr) / (10 * Math.sqrt(3) * 0.95)).toFixed(1)) : 0,
      },
      todayPurchaseKwh: 1420.5,
      todayFeedInKwh: 2894.2,
      meterQuality: isGridMeterOffline ? 'ANOMALY' : 'NORMAL',
      meterSource: '威胜 10kV 变压器进线高精度关口双向电能表 (DL/T 645-2007)',
      meterQualityReason: isGridMeterOffline
        ? '关口电能表 RS485 通信连续 3 次轮询超时，数据帧丢失'
        : '0.2S 级关口表三相电压电流平衡，四象限计量校验通过',
      lastUpdated: isGridMeterOffline ? '2026-09-06 06:50:12 (断线)' : lastDataTimestamp,
    };
  }, [
    calculatedGridPowerKw,
    isGridMeterOffline,
    isPartialAnomaly,
    totalStationLoadKw,
    chargingLoadKw,
    baseStationLoadKw,
    lastDataTimestamp,
  ]);

  // 3. 气象实测点位数据 (严格区分实测零值与数据缺失)
  const weather: WeatherObservationData = useMemo(() => {
    // 正常工况：水平总辐照 742 W/m²，环境温度 28.5 ℃，背板 46.2 ℃，湿度 68.5%，风速 3.2m/s
    const isMissing = isWeatherMissing;
    const missingReason = '微气象站通信中继丢包，未收到传感器实测采样帧';

    return {
      totalIrradiance: {
        value: isMissing ? null : 742,
        unit: 'W/m²',
        isNightZero: false,
        isMissing,
        missingReason,
        quality: isMissing ? 'ANOMALY' : 'NORMAL',
        sensor: '华控 HKY-TBQ 总辐射表 (短波光电热电堆)',
        lastUpdated: isMissing ? '2026-09-06 06:45:00 (中断)' : lastDataTimestamp,
        rangeNote: '示范园区实测有效辐射区 (0 ~ 1100 W/m²)',
      },
      ambientTemp: {
        value: isMissing ? null : 28.5,
        unit: '℃',
        isMissing,
        missingReason,
        quality: isMissing ? 'ANOMALY' : 'NORMAL',
        sensor: '高精度百叶箱环境温湿度探头 (PT1000)',
        lastUpdated: isMissing ? '2026-09-06 06:45:00 (中断)' : lastDataTimestamp,
        rangeNote: '户外环境气温',
      },
      moduleTemp: {
        value: isMissing ? null : 46.2,
        unit: '℃',
        isMissing,
        missingReason,
        quality: isMissing ? 'ANOMALY' : 'NORMAL',
        sensor: '光伏组件背板贴片式热敏电阻探头',
        lastUpdated: isMissing ? '2026-09-06 06:45:00 (中断)' : lastDataTimestamp,
        rangeNote: '组件运行受光升温 (+17.7℃ 温升)',
      },
      relativeHumidity: {
        value: isMissing ? null : 68.5,
        unit: '%',
        isMissing,
        missingReason,
        quality: isMissing ? 'ANOMALY' : 'NORMAL',
        sensor: '高分子湿敏电容传感器',
        lastUpdated: isMissing ? '2026-09-06 06:45:00 (中断)' : lastDataTimestamp,
        rangeNote: '沿海湿热气候环境',
      },
      windSpeed: {
        value: isMissing ? null : 3.2,
        unit: 'm/s',
        isMissing,
        missingReason,
        quality: isMissing ? 'ANOMALY' : 'NORMAL',
        sensor: '三杯式超声波微风速仪',
        lastUpdated: isMissing ? '2026-09-06 06:45:00 (中断)' : lastDataTimestamp,
        rangeNote: '2 级轻风',
      },
      windDirection: {
        deg: isMissing ? null : 135,
        compass: isMissing ? '--' : '东南风 (ESE 135°)',
        isMissing,
        missingReason,
        quality: isMissing ? 'ANOMALY' : 'NORMAL',
        sensor: '精密霍尔感应风向标',
        lastUpdated: isMissing ? '2026-09-06 06:45:00 (中断)' : lastDataTimestamp,
      },
      dailyAccumulatedIrradiationMj: {
        value: isMissing ? null : 16.8,
        unit: 'MJ/m²',
        isMissing,
        missingReason,
        quality: isMissing ? 'ANOMALY' : 'NORMAL',
        sensor: '气象站积分器日内实测日照累计',
        lastUpdated: isMissing ? '2026-09-06 06:45:00 (中断)' : lastDataTimestamp,
      },
      stationStatus: isMissing ? 'OFFLINE' : 'ONLINE',
      stationDeviceName: '示范站 1# 自动微气象观测站 (华控 HKY-QX800)',
      lastUpdated: isMissing ? '2026-09-06 06:45:00 (通信中断)' : lastDataTimestamp,
    };
  }, [isWeatherMissing, lastDataTimestamp]);

  // 4. 能流图五大节点构建 (PV, GRID, STORAGE, LOAD, CHARGING)
  const flowNodes: EnergyFlowNode[] = useMemo(() => {
    return [
      {
        id: 'PV',
        name: '屋顶光伏发电',
        subTitle: '1.2 MWp 分布式逆变器群',
        ratedCapacityText: '额定容量 1200 kWp',
        powerKw: pvPowerKw,
        isBidirectional: false,
        directionText: '单向发电 (+)',
        status: 'NORMAL',
        quality: 'NORMAL',
        qualityReason: '阳光电源逆变器交流侧实测采集正常',
        sourceSystem: '阳光电源 iSolarCloud 云平台 (Modbus-TCP)',
        protocol: 'Modbus-TCP / RJ45 网口',
        targetRoute: '/monitor/pv',
        lastUpdated: lastDataTimestamp,
      },
      {
        id: 'GRID',
        name: '10kV 上级电网关口',
        subTitle: '2000 kVA 主变进线总降',
        ratedCapacityText: '变压器容量 2000 kVA',
        powerKw: gridKpi.gridPowerKw,
        isBidirectional: true,
        directionText:
          gridKpi.gridPowerKw === null
            ? '通信断开'
            : gridKpi.gridPowerKw >= 0
            ? '下网购电 (+)'
            : '余电上网 (-)',
        status: isGridMeterOffline ? 'OFFLINE' : 'NORMAL',
        quality: gridKpi.meterQuality,
        qualityReason: gridKpi.meterQualityReason,
        sourceSystem: '威胜 10kV 进线高精度关口表',
        protocol: 'DL/T 645-2007 / RS485 专线',
        lastUpdated: gridKpi.lastUpdated,
      },
      {
        id: 'STORAGE',
        name: '电化学储能系统',
        subTitle: '500 kW / 1000 kWh 预制舱',
        ratedCapacityText: '额定容量 500 kW / 1000 kWh',
        powerKw: storagePowerKw,
        isBidirectional: true,
        directionText:
          storagePowerKw > 0
            ? '高峰放电 (+)'
            : storagePowerKw < 0
            ? '低谷充电 (-)'
            : '待机待命 (0)',
        status: 'NORMAL',
        quality: 'NORMAL',
        qualityReason: '时代星云 CATL-Nebula EMS 实测遥测正常',
        sourceSystem: '时代星云 EMS 系统 (IEC 61850)',
        protocol: 'IEC 61850 / 光纤环网',
        targetRoute: '/monitor/storage',
        lastUpdated: lastDataTimestamp,
      },
      {
        id: 'CHARGING',
        name: '园区充电桩群',
        subTitle: '12 台双枪直流快充',
        ratedCapacityText: '额定负荷 1440 kW',
        powerKw: chargingLoadKw,
        isBidirectional: false,
        directionText: '单向负荷用电 (+)',
        status: 'NORMAL',
        quality: 'NORMAL',
        qualityReason: '特来电平台 10 桩在线，6 桩正在充电',
        sourceSystem: '特来电 TELD 桩端平台 (MQTT/JSON)',
        protocol: 'MQTT / 4G 物联卡',
        targetRoute: '/monitor/charging',
        lastUpdated: lastDataTimestamp,
      },
      {
        id: 'LOAD',
        name: '站内综合基础负荷',
        subTitle: '办公区 / 空调 / 照明 / 辅动',
        ratedCapacityText: '配电变低压母线受电',
        powerKw: baseStationLoadKw,
        isBidirectional: false,
        directionText: '单向负荷用电 (+)',
        status: 'NORMAL',
        quality: 'NORMAL',
        qualityReason: '园区能源监控动力分表实时采集正常',
        sourceSystem: '安科瑞 Acrel-5000 智能微电网能耗仪表',
        protocol: 'Modbus-RTU / RS485 专网',
        lastUpdated: lastDataTimestamp,
      },
    ];
  }, [
    pvPowerKw,
    gridKpi,
    storagePowerKw,
    chargingLoadKw,
    baseStationLoadKw,
    isGridMeterOffline,
    lastDataTimestamp,
  ]);

  // 5. 能流图连线推导 (连线方向、颜色、动画速度由实时功率绝对值推导)
  const flowEdges: EnergyFlowEdge[] = useMemo(() => {
    const edges: EnergyFlowEdge[] = [];

    // 速度函数：功率越大，速度越快 (周期 1s ~ 4s)
    const calcSpeed = (power: number) => {
      const p = Math.abs(power);
      if (p <= 0) return 0;
      const speed = Math.max(1.0, 4.0 - (p / 500) * 2.8);
      return Number(speed.toFixed(2));
    };

    // 1. 光伏 -> 母线 (PV -> BUS)
    edges.push({
      id: 'EDGE-PV-BUS',
      fromNode: 'PV',
      toNode: 'BUS',
      activePowerKw: pvPowerKw,
      isReversed: false,
      isDisconnected: false,
      colorScheme: 'amber',
      strokeSpeedSec: calcSpeed(pvPowerKw),
      sourceLabel: '光伏输出',
      targetLabel: '交流母线',
    });

    // 2. 电网 <-> 母线 (GRID <-> BUS)
    if (isGridMeterOffline || gridKpi.gridPowerKw === null) {
      edges.push({
        id: 'EDGE-GRID-BUS',
        fromNode: 'GRID',
        toNode: 'BUS',
        activePowerKw: 0,
        isReversed: false,
        isDisconnected: true,
        disconnectReason: '关口表 DL/T 645 通信中断，连线已断开',
        colorScheme: 'purple',
        strokeSpeedSec: 0,
        sourceLabel: '电网关口',
        targetLabel: '交流母线',
      });
    } else if (gridKpi.gridPowerKw > 0) {
      // 购电：电网 -> 母线
      edges.push({
        id: 'EDGE-GRID-BUS',
        fromNode: 'GRID',
        toNode: 'BUS',
        activePowerKw: gridKpi.gridPowerKw,
        isReversed: false,
        isDisconnected: false,
        colorScheme: 'purple',
        strokeSpeedSec: calcSpeed(gridKpi.gridPowerKw),
        sourceLabel: '电网购电',
        targetLabel: '交流母线',
      });
    } else {
      // 上网：母线 -> 电网
      edges.push({
        id: 'EDGE-BUS-GRID',
        fromNode: 'BUS',
        toNode: 'GRID',
        activePowerKw: Math.abs(gridKpi.gridPowerKw),
        isReversed: true, // 从母线流向电网
        isDisconnected: false,
        colorScheme: 'purple',
        strokeSpeedSec: calcSpeed(gridKpi.gridPowerKw),
        sourceLabel: '余电反送',
        targetLabel: '电网关口',
      });
    }

    // 3. 储能 <-> 母线 (STORAGE <-> BUS)
    if (storagePowerKw > 0) {
      // 放电：储能 -> 母线
      edges.push({
        id: 'EDGE-STORAGE-BUS',
        fromNode: 'STORAGE',
        toNode: 'BUS',
        activePowerKw: storagePowerKw,
        isReversed: false,
        isDisconnected: false,
        colorScheme: 'blue',
        strokeSpeedSec: calcSpeed(storagePowerKw),
        sourceLabel: '储能放电',
        targetLabel: '交流母线',
      });
    } else if (storagePowerKw < 0) {
      // 充电：母线 -> 储能
      edges.push({
        id: 'EDGE-BUS-STORAGE',
        fromNode: 'BUS',
        toNode: 'STORAGE',
        activePowerKw: Math.abs(storagePowerKw),
        isReversed: true, // 从母线流向储能
        isDisconnected: false,
        colorScheme: 'blue',
        strokeSpeedSec: calcSpeed(storagePowerKw),
        sourceLabel: '吸收充电',
        targetLabel: '储能系统',
      });
    } else {
      // 待机
      edges.push({
        id: 'EDGE-STORAGE-BUS',
        fromNode: 'STORAGE',
        toNode: 'BUS',
        activePowerKw: 0,
        isReversed: false,
        isDisconnected: false,
        colorScheme: 'blue',
        strokeSpeedSec: 0,
        sourceLabel: '待机待命',
        targetLabel: '交流母线',
      });
    }

    // 4. 母线 -> 充电桩 (BUS -> CHARGING)
    edges.push({
      id: 'EDGE-BUS-CHARGING',
      fromNode: 'BUS',
      toNode: 'CHARGING',
      activePowerKw: chargingLoadKw,
      isReversed: false,
      isDisconnected: false,
      colorScheme: 'emerald',
      strokeSpeedSec: calcSpeed(chargingLoadKw),
      sourceLabel: '充电消纳',
      targetLabel: '桩群负荷',
    });

    // 5. 母线 -> 站内负荷 (BUS -> LOAD)
    edges.push({
      id: 'EDGE-BUS-LOAD',
      fromNode: 'BUS',
      toNode: 'LOAD',
      activePowerKw: baseStationLoadKw,
      isReversed: false,
      isDisconnected: false,
      colorScheme: 'cyan',
      strokeSpeedSec: calcSpeed(baseStationLoadKw),
      sourceLabel: '综合动力',
      targetLabel: '站内用电',
    });

    return edges;
  }, [pvPowerKw, gridKpi, storagePowerKw, chargingLoadKw, baseStationLoadKw, isGridMeterOffline]);

  // 6. 功率平衡核算汇总 (展示小幅非同期测量误差)
  const powerBalance: PowerBalanceSummary = useMemo(() => {
    if (isGridMeterOffline || gridKpi.gridPowerKw === null) {
      return {
        generationKw: pvPowerKw + (storagePowerKw > 0 ? storagePowerKw : 0),
        consumptionKw:
          chargingLoadKw +
          baseStationLoadKw +
          (storagePowerKw < 0 ? Math.abs(storagePowerKw) : 0),
        imbalanceDeltaKw: 0,
        imbalancePercent: 0,
        isDemonstrationNote: '关口电能表离线，缺少网侧计量输入，暂停微网全域功率平衡校验。',
        balanceStatus: 'DISCONNECTED_METER',
      };
    }

    // 电源侧进线 = 光伏发电 + 储能放电 (正值) + 电网购电 (正值)
    const gen =
      pvPowerKw +
      (storagePowerKw > 0 ? storagePowerKw : 0) +
      (gridKpi.gridPowerKw > 0 ? gridKpi.gridPowerKw : 0);

    // 负荷侧出线 = 充电桩 + 站内基础负荷 + 储能充电 (负值取正) + 电网反送 (负值取正)
    const con =
      chargingLoadKw +
      baseStationLoadKw +
      (storagePowerKw < 0 ? Math.abs(storagePowerKw) : 0) +
      (gridKpi.gridPowerKw < 0 ? Math.abs(gridKpi.gridPowerKw) : 0);

    const delta = Number((gen - con).toFixed(1));
    const percent = gen > 0 ? Number(((Math.abs(delta) / gen) * 100).toFixed(2)) : 0;

    return {
      generationKw: Number(gen.toFixed(1)),
      consumptionKw: Number(con.toFixed(1)),
      imbalanceDeltaKw: delta,
      imbalancePercent: percent,
      isDemonstrationNote:
        '实时显示 1.2 kW (0.28%) 的功率不平衡量，属现场不同厂商规约轮询非同期采集的正常物理容差。',
      balanceStatus: percent < 1.0 ? 'WITHIN_TOLERANCE' : 'PERFECT',
    };
  }, [
    pvPowerKw,
    storagePowerKw,
    gridKpi.gridPowerKw,
    chargingLoadKw,
    baseStationLoadKw,
    isGridMeterOffline,
  ]);

  // 7. 24 小时实测曲线 (同轴/分图展示：电网功率、总负荷、光伏、充电负荷)
  const trendSamples24h: GridTrendSample[] = useMemo(() => {
    return Array.from({ length: 24 }).map((_, hour) => {
      const isSun = hour >= 6 && hour <= 18;
      const pv = isSun ? Math.sin(((hour - 6) / 12) * Math.PI) * 420 : 0;

      let storage = 0;
      if (hour >= 0 && hour <= 6) storage = -220; // 谷充
      else if (hour >= 9 && hour <= 11) storage = 240; // 早峰放
      else if (hour >= 12 && hour <= 13) storage = -150; // 午平充
      else if (hour >= 19 && hour <= 20) storage = 320; // 晚尖峰放
      else storage = 0;

      const charge = hour >= 7 && hour <= 21 ? 120 + ((hour * 17) % 80) : 35;
      const base = 80 + ((hour * 7) % 15);
      const totalLoad = charge + base;

      // 电网关口 = 站内总负荷 - 光伏 - 储能放电
      let grid: number | null = totalLoad - pv - storage;

      // 若处于电表断线模式，下午 14:00 之后出现断点，绝不插值！
      let isGridMissing = false;
      if (isGridMeterOffline && hour >= 14) {
        grid = null;
        isGridMissing = true;
      }

      return {
        timestamp: `${String(hour).padStart(2, '0')}:00`,
        hour,
        gridPowerKw: grid !== null ? Number(grid.toFixed(1)) : null,
        totalLoadKw: Number(totalLoad.toFixed(1)),
        pvPowerKw: Math.max(0, Number(pv.toFixed(1))),
        chargingLoadKw: Number(charge.toFixed(1)),
        storagePowerKw: Number(storage.toFixed(1)),
        isGridMissing,
        quality: isGridMissing ? 'ANOMALY' : 'NORMAL',
        qualityNote: isGridMissing ? '关口表通信失联，采样断点' : undefined,
      };
    });
  }, [isGridMeterOffline]);

  return {
    site,
    countdown,
    refreshIntervalSeconds,
    setRefreshIntervalSeconds,
    isStreamInterrupted,
    toggleStreamInterrupted,
    resumeStream,
    lastDataTimestamp,
    isInspectorRole,
    // 状态模拟
    simulatedState,
    setSimulatedState,
    isGridMeterOffline,
    isWeatherMissing,
    isPartialAnomaly,
    // 核心数据
    gridKpi,
    weather,
    flowNodes,
    flowEdges,
    powerBalance,
    trendSamples24h,
    pvPowerKw,
    storagePowerKw,
    chargingLoadKw,
    baseStationLoadKw,
    totalStationLoadKw,
  };
}
