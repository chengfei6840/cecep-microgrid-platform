import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '../store/AppContext';
import {
  ChargerPile,
  ChargerGun,
  ChargingOrder,
  ChargingTrendSample,
  ChargingKpis,
  ChargingSimulatedState,
} from '../types/charging';

export type { ChargingSimulatedState } from '../types/charging';

export function useChargingMonitorData() {
  const {
    site,
    telemetry,
    tariffScheme,
    alarms,
    scenario,
    currentRole,
  } = useAppStore();

  // 刷新与时钟控制
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState<number>(15);
  const [countdown, setCountdown] = useState<number>(15);
  const [isStreamInterrupted, setIsStreamInterrupted] = useState<boolean>(false);
  const [lastDataTimestamp, setLastDataTimestamp] = useState<string>('2026-09-06 06:42:15');

  // 状态演练
  const [simulatedState, setSimulatedState] = useState<ChargingSimulatedState>('NORMAL');

  // 定时刷新驱动
  useEffect(() => {
    if (isStreamInterrupted) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          const now = new Date();
          const timeStr = `2026-09-06 ${String(now.getHours()).padStart(2, '0')}:${String(
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

  const toggleStreamInterrupted = useCallback(() => {
    setIsStreamInterrupted((prev) => !prev);
  }, []);

  const resumeStream = useCallback(() => {
    setIsStreamInterrupted(false);
    setCountdown(refreshIntervalSeconds);
  }, [refreshIntervalSeconds]);

  // 动态读取当前生效电价版本 (杜绝页面常量硬编码)
  const currentTariffVersion = useMemo(() => {
    const currentVersionNumber = tariffScheme.currentVersion || 'V1.0';
    const found = tariffScheme.versions.find((v) => v.versionNumber === currentVersionNumber);
    return found || tariffScheme.versions[0];
  }, [tariffScheme]);

  const chargingConfig = useMemo(() => {
    const cfg = currentTariffVersion?.chargingConfig;
    return {
      serviceFee: cfg?.serviceFee ?? 0.40,
      tou: {
        sharp: cfg?.energyPriceTou?.sharp ?? 1.425,
        peak: cfg?.energyPriceTou?.peak ?? 1.128,
        flat: cfg?.energyPriceTou?.flat ?? 0.685,
        valley: cfg?.energyPriceTou?.valley ?? 0.326,
        deepValley: cfg?.energyPriceTou?.deepValley ?? 0.218,
      },
    };
  }, [currentTariffVersion]);

  // 12 台充电桩数据结构 (4空闲, 6充电, 1故障, 1离线 -> 在线10台, 占用6台)
  const piles: ChargerPile[] = useMemo(() => {
    if (simulatedState === 'NO_DEVICES') {
      return [];
    }

    const basePiles: ChargerPile[] = [
      {
        id: 'DEV-CHG-01',
        pileCode: 'CHG-01',
        name: '1# 120kW 双枪直流快充桩',
        type: 'DC_FAST_120',
        typeLabel: '120kW 双枪直流快充',
        ratedPowerKw: 120,
        status: 'CHARGING',
        currentPowerKw: 62.4,
        todayEnergyKwh: 184.2,
        lastHeartbeat: '5秒前 (06:42:10)',
        associatedPlatform: '星星充电运营平台 (协议对接 · 模拟预同步)',
        ipAddress: '192.168.10.101',
        insulationResistanceMohm: 5.8,
        ambientTempC: 28.5,
        guns: [
          {
            gunCode: 'A',
            gunId: 'CHG-01-A',
            status: 'CHARGING',
            currentPowerKw: 62.4,
            voltageV: 418.5,
            currentA: 149.1,
            socPercent: 78,
            chargingDurationMinutes: 34,
            chargedEnergyKwh: 35.3,
            gunTempC: 38.2,
            currentOrderId: 'ORD-20260906-08812',
          },
          {
            gunCode: 'B',
            gunId: 'CHG-01-B',
            status: 'IDLE',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 29.1,
          },
        ],
      },
      {
        id: 'DEV-CHG-02',
        pileCode: 'CHG-02',
        name: '2# 120kW 双枪直流快充桩',
        type: 'DC_FAST_120',
        typeLabel: '120kW 双枪直流快充',
        ratedPowerKw: 120,
        status: 'CHARGING',
        currentPowerKw: 58.0,
        todayEnergyKwh: 162.0,
        lastHeartbeat: '8秒前 (06:42:07)',
        associatedPlatform: '星星充电运营平台 (协议对接 · 模拟预同步)',
        ipAddress: '192.168.10.102',
        insulationResistanceMohm: 6.2,
        ambientTempC: 29.0,
        guns: [
          {
            gunCode: 'A',
            gunId: 'CHG-02-A',
            status: 'CHARGING',
            currentPowerKw: 58.0,
            voltageV: 395.2,
            currentA: 146.7,
            socPercent: 64,
            chargingDurationMinutes: 28,
            chargedEnergyKwh: 27.1,
            gunTempC: 37.6,
            currentOrderId: 'ORD-20260906-08815',
          },
          {
            gunCode: 'B',
            gunId: 'CHG-02-B',
            status: 'IDLE',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 28.5,
          },
        ],
      },
      {
        id: 'DEV-CHG-03',
        pileCode: 'CHG-03',
        name: '3# 120kW 双枪直流快充桩',
        type: 'DC_FAST_120',
        typeLabel: '120kW 双枪直流快充',
        ratedPowerKw: 120,
        status: 'CHARGING',
        currentPowerKw: 110.5,
        todayEnergyKwh: 215.8,
        lastHeartbeat: '3秒前 (06:42:12)',
        associatedPlatform: '星星充电运营平台 (协议对接 · 模拟预同步)',
        ipAddress: '192.168.10.103',
        insulationResistanceMohm: 5.5,
        ambientTempC: 30.1,
        guns: [
          {
            gunCode: 'A',
            gunId: 'CHG-03-A',
            status: 'CHARGING',
            currentPowerKw: 55.2,
            voltageV: 402.0,
            currentA: 137.3,
            socPercent: 52,
            chargingDurationMinutes: 41,
            chargedEnergyKwh: 37.8,
            gunTempC: 39.4,
            currentOrderId: 'ORD-20260906-08809',
          },
          {
            gunCode: 'B',
            gunId: 'CHG-03-B',
            status: 'CHARGING',
            currentPowerKw: 55.3,
            voltageV: 408.3,
            currentA: 135.4,
            socPercent: 81,
            chargingDurationMinutes: 45,
            chargedEnergyKwh: 41.5,
            gunTempC: 40.2,
            currentOrderId: 'ORD-20260906-08808',
          },
        ],
      },
      {
        id: 'DEV-CHG-04',
        pileCode: 'CHG-04',
        name: '4# 120kW 双枪直流快充桩',
        type: 'DC_FAST_120',
        typeLabel: '120kW 双枪直流快充',
        ratedPowerKw: 120,
        status: 'FAULT',
        currentPowerKw: 0,
        todayEnergyKwh: 45.6,
        lastHeartbeat: '12秒前 (06:42:03)',
        associatedPlatform: '星星充电运营平台 (协议对接 · 模拟预同步)',
        ipAddress: '192.168.10.104',
        insulationResistanceMohm: 0.28, // 绝缘阻抗偏低
        ambientTempC: 31.4,
        linkedAlarmId: 'ALM-CHG-04-01',
        linkedAlarmTitle: 'B枪直流正极绝缘阻抗过低 (0.28 MΩ < 0.5 MΩ 保护门槛)',
        guns: [
          {
            gunCode: 'A',
            gunId: 'CHG-04-A',
            status: 'IDLE',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 28.0,
          },
          {
            gunCode: 'B',
            gunId: 'CHG-04-B',
            status: 'FAULT',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 42.1,
          },
        ],
      },
      {
        id: 'DEV-CHG-05',
        pileCode: 'CHG-05',
        name: '5# 120kW 双枪直流快充桩',
        type: 'DC_FAST_120',
        typeLabel: '120kW 双枪直流快充',
        ratedPowerKw: 120,
        status: 'IDLE',
        currentPowerKw: 0,
        todayEnergyKwh: 128.5,
        lastHeartbeat: '6秒前 (06:42:09)',
        associatedPlatform: '星星充电运营平台 (协议对接 · 模拟预同步)',
        ipAddress: '192.168.10.105',
        insulationResistanceMohm: 6.8,
        ambientTempC: 27.8,
        guns: [
          {
            gunCode: 'A',
            gunId: 'CHG-05-A',
            status: 'IDLE',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 27.2,
          },
          {
            gunCode: 'B',
            gunId: 'CHG-05-B',
            status: 'IDLE',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 27.5,
          },
        ],
      },
      {
        id: 'DEV-CHG-06',
        pileCode: 'CHG-06',
        name: '6# 120kW 双枪直流快充桩',
        type: 'DC_FAST_120',
        typeLabel: '120kW 双枪直流快充',
        ratedPowerKw: 120,
        status: 'CHARGING',
        currentPowerKw: 48.5,
        todayEnergyKwh: 145.0,
        lastHeartbeat: '4秒前 (06:42:11)',
        associatedPlatform: '星星充电运营平台 (协议对接 · 模拟预同步)',
        ipAddress: '192.168.10.106',
        insulationResistanceMohm: 5.9,
        ambientTempC: 28.4,
        guns: [
          {
            gunCode: 'A',
            gunId: 'CHG-06-A',
            status: 'CHARGING',
            currentPowerKw: 48.5,
            voltageV: 388.0,
            currentA: 125.0,
            socPercent: 45,
            chargingDurationMinutes: 19,
            chargedEnergyKwh: 15.3,
            gunTempC: 36.5,
            currentOrderId: 'ORD-20260906-08818',
          },
          {
            gunCode: 'B',
            gunId: 'CHG-06-B',
            status: 'IDLE',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 28.0,
          },
        ],
      },
      {
        id: 'DEV-CHG-07',
        pileCode: 'CHG-07',
        name: '7# 120kW 双枪直流快充桩',
        type: 'DC_FAST_120',
        typeLabel: '120kW 双枪直流快充',
        ratedPowerKw: 120,
        status: 'IDLE',
        currentPowerKw: 0,
        todayEnergyKwh: 92.4,
        lastHeartbeat: '9秒前 (06:42:06)',
        associatedPlatform: '星星充电运营平台 (协议对接 · 模拟预同步)',
        ipAddress: '192.168.10.107',
        insulationResistanceMohm: 7.1,
        ambientTempC: 27.5,
        guns: [
          {
            gunCode: 'A',
            gunId: 'CHG-07-A',
            status: 'IDLE',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 27.0,
          },
          {
            gunCode: 'B',
            gunId: 'CHG-07-B',
            status: 'IDLE',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 27.2,
          },
        ],
      },
      {
        id: 'DEV-CHG-08',
        pileCode: 'CHG-08',
        name: '8# 120kW 双枪直流快充桩',
        type: 'DC_FAST_120',
        typeLabel: '120kW 双枪直流快充',
        ratedPowerKw: 120,
        status: 'CHARGING',
        currentPowerKw: 56.4,
        todayEnergyKwh: 178.6,
        lastHeartbeat: '7秒前 (06:42:08)',
        associatedPlatform: '星星充电运营平台 (协议对接 · 模拟预同步)',
        ipAddress: '192.168.10.108',
        insulationResistanceMohm: 6.0,
        ambientTempC: 29.3,
        guns: [
          {
            gunCode: 'A',
            gunId: 'CHG-08-A',
            status: 'IDLE',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 28.5,
          },
          {
            gunCode: 'B',
            gunId: 'CHG-08-B',
            status: 'CHARGING',
            currentPowerKw: 56.4,
            voltageV: 412.5,
            currentA: 136.7,
            socPercent: 88,
            chargingDurationMinutes: 52,
            chargedEnergyKwh: 48.9,
            gunTempC: 38.9,
            currentOrderId: 'ORD-20260906-08805',
          },
        ],
      },
      {
        id: 'DEV-CHG-09',
        pileCode: 'CHG-09',
        name: '9# 120kW 双枪直流快充桩',
        type: 'DC_FAST_120',
        typeLabel: '120kW 双枪直流快充',
        ratedPowerKw: 120,
        status: 'CHARGING',
        currentPowerKw: 60.2,
        todayEnergyKwh: 165.2,
        lastHeartbeat: '5秒前 (06:42:10)',
        associatedPlatform: '星星充电运营平台 (协议对接 · 模拟预同步)',
        ipAddress: '192.168.10.109',
        insulationResistanceMohm: 5.7,
        ambientTempC: 29.5,
        guns: [
          {
            gunCode: 'A',
            gunId: 'CHG-09-A',
            status: 'CHARGING',
            currentPowerKw: 60.2,
            voltageV: 405.0,
            currentA: 148.6,
            socPercent: 72,
            chargingDurationMinutes: 35,
            chargedEnergyKwh: 35.1,
            gunTempC: 37.9,
            currentOrderId: 'ORD-20260906-08814',
          },
          {
            gunCode: 'B',
            gunId: 'CHG-09-B',
            status: 'IDLE',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 28.3,
          },
        ],
      },
      {
        id: 'DEV-CHG-10',
        pileCode: 'CHG-10',
        name: '10# 120kW 双枪直流快充桩',
        type: 'DC_FAST_120',
        typeLabel: '120kW 双枪直流快充',
        ratedPowerKw: 120,
        status: 'IDLE',
        currentPowerKw: 0,
        todayEnergyKwh: 105.8,
        lastHeartbeat: '10秒前 (06:42:05)',
        associatedPlatform: '星星充电运营平台 (协议对接 · 模拟预同步)',
        ipAddress: '192.168.10.110',
        insulationResistanceMohm: 6.9,
        ambientTempC: 27.9,
        guns: [
          {
            gunCode: 'A',
            gunId: 'CHG-10-A',
            status: 'IDLE',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 27.6,
          },
          {
            gunCode: 'B',
            gunId: 'CHG-10-B',
            status: 'IDLE',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 27.4,
          },
        ],
      },
      {
        id: 'DEV-CHG-11',
        pileCode: 'CHG-11',
        name: '11# 180kW 液冷超充桩 (单枪配双枪扩展)',
        type: 'DC_SUPER_180',
        typeLabel: '180kW 液冷超充',
        ratedPowerKw: 180,
        status: 'IDLE',
        currentPowerKw: 0,
        todayEnergyKwh: 142.3,
        lastHeartbeat: '6秒前 (06:42:09)',
        associatedPlatform: '低碳园区私有专网专线 (Modbus/TCP 汇聚)',
        ipAddress: '192.168.10.111',
        insulationResistanceMohm: 8.5,
        ambientTempC: 26.8,
        guns: [
          {
            gunCode: 'A',
            gunId: 'CHG-11-A',
            status: 'IDLE',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 26.5,
          },
          {
            gunCode: 'B',
            gunId: 'CHG-11-B',
            status: 'IDLE',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 26.7,
          },
        ],
      },
      {
        id: 'DEV-CHG-12',
        pileCode: 'CHG-12',
        name: '12# 7kW 交流慢充桩 (园区通勤保洁专用)',
        type: 'AC_SLOW_7',
        typeLabel: '7kW 交流慢充',
        ratedPowerKw: 7,
        status: 'OFFLINE',
        currentPowerKw: 0,
        todayEnergyKwh: 18.2,
        lastHeartbeat: '45分钟前 (05:57:12 心跳超时)',
        associatedPlatform: '低碳园区私有专网专线 (Modbus/TCP 汇聚)',
        ipAddress: '192.168.10.112',
        insulationResistanceMohm: 0,
        ambientTempC: 26.0,
        guns: [
          {
            gunCode: 'A',
            gunId: 'CHG-12-A',
            status: 'OFFLINE',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 25.5,
          },
          {
            gunCode: 'B',
            gunId: 'CHG-12-B',
            status: 'OFFLINE',
            currentPowerKw: 0,
            voltageV: 0,
            currentA: 0,
            socPercent: null,
            chargingDurationMinutes: null,
            chargedEnergyKwh: null,
            gunTempC: 25.5,
          },
        ],
      },
    ];

    return basePiles;
  }, [simulatedState]);

  // 动态生成充电订单列表 (完全引用 currentTariffVersion)
  const orders: ChargingOrder[] = useMemo(() => {
    if (simulatedState === 'NO_DEVICES') {
      return [];
    }

    const versionNum = currentTariffVersion.versionNumber || 'V1.0';
    const sFee = chargingConfig.serviceFee;
    const { sharp, peak, flat, valley } = chargingConfig.tou;

    // 辅助计算订单函数
    const makeOrder = (
      orderId: string,
      pileCode: string,
      gunCode: '枪A' | '枪B',
      plateNumber: string,
      vehicleModel: string,
      vinMasked: string,
      startTime: string,
      endTime: string,
      durationMinutes: number,
      breakdown: Array<{
        slotLabel: '尖峰' | '高峰' | '平段' | '低谷' | '深谷';
        period: string;
        unitPrice: number;
        energyKwh: number;
      }>,
      integrityStatus: 'COMPLETED' | 'PENDING_SYNC' | 'FIELD_MISSING',
      integrityNote: string | undefined,
      dataSource: 'PLATFORM_SYNC' | 'OFFLINE_BACKFILL' | 'SIMULATED_FEED',
      dataSourceLabel: string
    ): ChargingOrder => {
      const items = breakdown.map((b) => ({
        slotLabel: b.slotLabel,
        period: b.period,
        unitPrice: b.unitPrice,
        energyKwh: b.energyKwh,
        amount: Number((b.unitPrice * b.energyKwh).toFixed(2)),
      }));

      const totalEnergyKwh = Number(items.reduce((acc, cur) => acc + cur.energyKwh, 0).toFixed(2));
      const baseEnergyFee = Number(items.reduce((acc, cur) => acc + cur.amount, 0).toFixed(2));
      const serviceFeeAmount = Number((totalEnergyKwh * sFee).toFixed(2));
      const totalAmount = Number((baseEnergyFee + serviceFeeAmount).toFixed(2));
      const isSettled = integrityStatus === 'COMPLETED';

      return {
        orderId,
        pileId: `DEV-${pileCode}`,
        pileCode,
        gunCode,
        plateNumber,
        vehicleModel,
        vinMasked,
        startTime,
        endTime,
        durationMinutes,
        totalEnergyKwh,
        timeSlotBreakdown: items,
        baseEnergyFee,
        serviceFeeUnitPrice: sFee,
        serviceFeeAmount,
        totalAmount,
        integrityStatus,
        integrityNote,
        isSettled,
        dataSource,
        dataSourceLabel,
        tariffVersionReferenced: versionNum,
      };
    };

    // 16 笔精细订单：
    // 包含已结算 COMPLETED、待完整同步 PENDING_SYNC (关键要求：T+1前未完整拉取，不计入结算收益，只进入估算)
    // 以及异常状态演练时的 FIELD_MISSING
    const list: ChargingOrder[] = [
      // 1. 正在进行中的未结单 (待完整同步)
      makeOrder(
        'ORD-20260906-08812',
        'CHG-01',
        '枪A',
        '闽E·D58291',
        '比亚迪海豹 EV',
        'LSVGB829****8129',
        '2026-09-06 06:08:12',
        '进行中 (预计06:48完成)',
        34,
        [
          { slotLabel: '平段', period: '06:30 - 08:30', unitPrice: flat, energyKwh: 12.5 },
          { slotLabel: '低谷', period: '00:00 - 06:30', unitPrice: valley, energyKwh: 22.8 },
        ],
        'PENDING_SYNC',
        '【T+1前未完整拉取】充电进行中，心跳分段数据预同步中，未生成正式日终对账单，不计入结算口径。',
        'SIMULATED_FEED',
        '星星充电平台 · 实时流水流'
      ),
      // 2. 刚刚完成但平台尚未完成日终对账 (待完整同步)
      makeOrder(
        'ORD-20260906-08815',
        'CHG-02',
        '枪A',
        '闽E·A69102',
        '广汽埃安 AION Y',
        'LHGCR212****9012',
        '2026-09-06 05:42:00',
        '2026-09-06 06:10:00',
        28,
        [{ slotLabel: '低谷', period: '00:00 - 06:30', unitPrice: valley, energyKwh: 27.1 }],
        'PENDING_SYNC',
        '【T+1前未完整拉取】交易刚刚离线结束，等待运营商午夜 T+1 跨机构批量关口清分，暂未计入财务结算。',
        'PLATFORM_SYNC',
        '星星充电平台 · 批量回传'
      ),
      // 3. 正在充电中订单 (待完整同步)
      makeOrder(
        'ORD-20260906-08818',
        'CHG-06',
        '枪A',
        '闽E·D88231',
        '蔚来 ET5',
        'NIO91283****3321',
        '2026-09-06 06:23:00',
        '进行中 (预计06:55完成)',
        19,
        [{ slotLabel: '平段', period: '06:30 - 08:30', unitPrice: flat, energyKwh: 15.3 }],
        'PENDING_SYNC',
        '【T+1前未完整拉取】充电中预同步流水，只可进入今日收益估算池。',
        'SIMULATED_FEED',
        '星星充电平台 · 实时流水流'
      ),
      // 4. 字段缺失预警演练订单 (模拟演练模式启用或常态提示)
      makeOrder(
        'ORD-20260906-08801',
        'CHG-04',
        '枪B',
        '闽E·挂9901',
        '开瑞优优 EV 物流车',
        '缺失 VIN 码 (未上报)',
        '2026-09-06 03:15:00',
        '2026-09-06 04:02:15',
        47,
        [{ slotLabel: '低谷', period: '00:00 - 06:30', unitPrice: valley, energyKwh: 38.6 }],
        simulatedState === 'ORDER_FIELD_MISSING' ? 'FIELD_MISSING' : 'FIELD_MISSING',
        '【字段缺失预警】桩端串口上报报文丢失车架号(VIN)校验位及结算时间戳，需巡检员离线补录核实。',
        'OFFLINE_BACKFILL',
        '就地网关离线缓存'
      ),
      // 5 ~ 16: 已完整结算的订单 (COMPLETED)
      makeOrder(
        'ORD-20260906-08809',
        'CHG-03',
        '枪A',
        '闽E·D19803',
        '小鹏 G6',
        'XPEN9981****1980',
        '2026-09-06 04:30:00',
        '2026-09-06 05:25:30',
        55,
        [{ slotLabel: '低谷', period: '00:00 - 06:30', unitPrice: valley, energyKwh: 48.2 }],
        'COMPLETED',
        '已完整核验，符合 V1.0 低谷费率口径，已归档结算。',
        'PLATFORM_SYNC',
        '星星充电平台 · 批量回传'
      ),
      makeOrder(
        'ORD-20260906-08808',
        'CHG-03',
        '枪B',
        '闽E·A82371',
        '吉利极氪 001',
        'ZEEK1209****8237',
        '2026-09-06 04:10:00',
        '2026-09-06 05:12:00',
        62,
        [{ slotLabel: '低谷', period: '00:00 - 06:30', unitPrice: valley, energyKwh: 54.0 }],
        'COMPLETED',
        '已完整核验，已归档结算。',
        'PLATFORM_SYNC',
        '星星充电平台 · 批量回传'
      ),
      makeOrder(
        'ORD-20260906-08805',
        'CHG-08',
        '枪B',
        '闽E·D77215',
        '特斯拉 Model Y',
        'TSLA5Y12****7721',
        '2026-09-06 03:45:00',
        '2026-09-06 04:55:00',
        70,
        [{ slotLabel: '低谷', period: '00:00 - 06:30', unitPrice: valley, energyKwh: 61.5 }],
        'COMPLETED',
        '已完整核验，已归档结算。',
        'PLATFORM_SYNC',
        '星星充电平台 · 批量回传'
      ),
      makeOrder(
        'ORD-20260906-08814',
        'CHG-09',
        '枪A',
        '闽E·D31562',
        '理想 L7 EV',
        'LI881290****3156',
        '2026-09-06 04:50:00',
        '2026-09-06 05:40:00',
        50,
        [{ slotLabel: '低谷', period: '00:00 - 06:30', unitPrice: valley, energyKwh: 42.0 }],
        'COMPLETED',
        '已完整核验，已归档结算。',
        'PLATFORM_SYNC',
        '星星充电平台 · 批量回传'
      ),
      makeOrder(
        'ORD-20260906-08798',
        'CHG-01',
        '枪B',
        '闽E·A12098',
        '上汽大众 ID.4 CROZZ',
        'WVWZZZ81****1209',
        '2026-09-06 02:10:00',
        '2026-09-06 03:20:00',
        70,
        [{ slotLabel: '低谷', period: '00:00 - 06:30', unitPrice: valley, energyKwh: 58.4 }],
        'COMPLETED',
        '已完整核验，已归档结算。',
        'PLATFORM_SYNC',
        '星星充电平台 · 批量回传'
      ),
      makeOrder(
        'ORD-20260906-08795',
        'CHG-05',
        '枪A',
        '闽E·D61902',
        '比亚迪元 PLUS',
        'LSVGA190****6190',
        '2026-09-06 01:25:00',
        '2026-09-06 02:40:00',
        75,
        [{ slotLabel: '低谷', period: '00:00 - 06:30', unitPrice: valley, energyKwh: 64.2 }],
        'COMPLETED',
        '已完整核验，已归档结算。',
        'PLATFORM_SYNC',
        '星星充电平台 · 批量回传'
      ),
      makeOrder(
        'ORD-20260906-08790',
        'CHG-07',
        '枪A',
        '闽E·D90125',
        '长安深蓝 SL03',
        'SC648102****9012',
        '2026-09-06 00:30:00',
        '2026-09-06 01:45:00',
        75,
        [{ slotLabel: '低谷', period: '00:00 - 06:30', unitPrice: valley, energyKwh: 62.0 }],
        'COMPLETED',
        '已完整核验，已归档结算。',
        'PLATFORM_SYNC',
        '星星充电平台 · 批量回传'
      ),
      makeOrder(
        'ORD-20260906-08785',
        'CHG-10',
        '枪B',
        '闽E·D45512',
        '问界 M5 纯电版',
        'HIMA8192****4551',
        '2026-09-05 23:15:00',
        '2026-09-06 00:20:00',
        65,
        [{ slotLabel: '低谷', period: '23:00 - 次日06:30', unitPrice: valley, energyKwh: 52.8 }],
        'COMPLETED',
        '已完整核验，已归档结算。',
        'PLATFORM_SYNC',
        '星星充电平台 · 批量回传'
      ),
      makeOrder(
        'ORD-20260905-08770',
        'CHG-11',
        '枪A',
        '闽E·D00198',
        '保时捷 Taycan 4S',
        'WP0AA2Y1****0019',
        '2026-09-05 19:40:00',
        '2026-09-05 20:25:00',
        45,
        [{ slotLabel: '尖峰', period: '19:00 - 21:00', unitPrice: sharp, energyKwh: 76.5 }],
        'COMPLETED',
        '跨尖峰时段超充，已完整核验并结算。',
        'PLATFORM_SYNC',
        '低碳园区私有专网专线'
      ),
      makeOrder(
        'ORD-20260905-08765',
        'CHG-02',
        '枪B',
        '闽E·A55189',
        '广汽埃安 S Plus 出租车',
        'LHGCR190****5518',
        '2026-09-05 17:30:00',
        '2026-09-05 18:20:00',
        50,
        [{ slotLabel: '高峰', period: '14:30 - 19:00', unitPrice: peak, energyKwh: 45.0 }],
        'COMPLETED',
        '高峰时段充电，已完整核验并结算。',
        'PLATFORM_SYNC',
        '星星充电平台 · 批量回传'
      ),
      makeOrder(
        'ORD-20260905-08752',
        'CHG-06',
        '枪B',
        '闽E·D22019',
        '比亚迪汉 EV',
        'LSVGH819****2201',
        '2026-09-05 15:10:00',
        '2026-09-05 16:15:00',
        65,
        [{ slotLabel: '高峰', period: '14:30 - 19:00', unitPrice: peak, energyKwh: 55.4 }],
        'COMPLETED',
        '高峰时段充电，已完整核验并结算。',
        'PLATFORM_SYNC',
        '星星充电平台 · 批量回传'
      ),
      makeOrder(
        'ORD-20260905-08740',
        'CHG-08',
        '枪A',
        '闽E·A78120',
        '吉利帝豪 EV 网约车',
        'MR647102****7812',
        '2026-09-05 12:40:00',
        '2026-09-05 13:45:00',
        65,
        [{ slotLabel: '平段', period: '11:30 - 14:30', unitPrice: flat, energyKwh: 49.5 }],
        'COMPLETED',
        '平段时段充电，已完整核验并结算。',
        'PLATFORM_SYNC',
        '星星充电平台 · 批量回传'
      ),
    ];

    return list;
  }, [simulatedState, currentTariffVersion, chargingConfig]);

  // KPI 计算与口径统计
  const kpis: ChargingKpis = useMemo(() => {
    const totalPiles = piles.length;
    const idlePiles = piles.filter((p) => p.status === 'IDLE').length;
    const chargingPiles = piles.filter((p) => p.status === 'CHARGING').length;
    const faultPiles = piles.filter((p) => p.status === 'FAULT').length;
    const offlinePiles = piles.filter((p) => p.status === 'OFFLINE').length;
    const onlinePiles = idlePiles + chargingPiles; // 在线且通信正常可提供服务
    const onlineRate = totalPiles > 0 ? Number(((onlinePiles / totalPiles) * 100).toFixed(1)) : 0;

    let occupiedGuns = 0;
    let totalGuns = 0;
    let activePowerKw = 0;
    let todayChargingKwh = 0;

    piles.forEach((p) => {
      activePowerKw += p.currentPowerKw;
      todayChargingKwh += p.todayEnergyKwh;
      totalGuns += p.guns.length;
      occupiedGuns += p.guns.filter((g) => g.status === 'CHARGING').length;
    });

    // 严密核算结算收益与估算收益：
    // 【关键】：待完整同步订单 (PENDING_SYNC) 以及字段缺失订单 (FIELD_MISSING) 绝对不能计入结算收益！
    const settledOrders = orders.filter((o) => o.isSettled);
    const todaySettledRevenue = Number(
      settledOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)
    );

    const pendingOrders = orders.filter((o) => o.integrityStatus === 'PENDING_SYNC');
    const pendingSyncCount = pendingOrders.length;
    const pendingSyncAmount = Number(
      pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)
    );

    // 估算总收益包含全部订单金额
    const todayEstimatedRevenue = Number(
      orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)
    );

    return {
      activePowerKw: Number(activePowerKw.toFixed(1)),
      todayChargingKwh: Number(todayChargingKwh.toFixed(1)),
      totalPiles,
      onlinePiles,
      chargingPiles,
      idlePiles,
      faultPiles,
      offlinePiles,
      onlineRate,
      occupiedGuns,
      totalGuns,
      todaySettledRevenue,
      todayEstimatedRevenue,
      pendingSyncCount,
      pendingSyncAmount,
      referencedTariffVersion: currentTariffVersion.versionNumber || 'V1.0',
    };
  }, [piles, orders, currentTariffVersion]);

  // 24小时实测负荷趋势 (带有分时电价时段标记与枪口占用数)
  const trendSamples24h: ChargingTrendSample[] = useMemo(() => {
    // 依据真实园区通勤与分时电价规律生成的实测历史采样
    const data: Array<{
      time: string;
      hour: number;
      kw: number;
      guns: number;
      slot: '尖峰' | '高峰' | '平段' | '低谷' | '深谷';
    }> = [
      { time: '00:00', hour: 0, kw: 142.0, guns: 9, slot: '低谷' },
      { time: '01:00', hour: 1, kw: 168.5, guns: 11, slot: '低谷' },
      { time: '02:00', hour: 2, kw: 185.2, guns: 12, slot: '低谷' },
      { time: '03:00', hour: 3, kw: 196.4, guns: 13, slot: '低谷' },
      { time: '04:00', hour: 4, kw: 172.0, guns: 11, slot: '低谷' },
      { time: '05:00', hour: 5, kw: 145.8, guns: 10, slot: '低谷' },
      { time: '06:00', hour: 6, kw: 128.4, guns: 8, slot: '低谷' }, // 当前时间点 06:42
      { time: '07:00', hour: 7, kw: 86.5, guns: 5, slot: '平段' },
      { time: '08:00', hour: 8, kw: 62.0, guns: 4, slot: '平段' },
      { time: '09:00', hour: 9, kw: 95.4, guns: 6, slot: '高峰' },
      { time: '10:00', hour: 10, kw: 115.0, guns: 7, slot: '高峰' },
      { time: '11:00', hour: 11, kw: 88.2, guns: 5, slot: '高峰' },
      { time: '12:00', hour: 12, kw: 132.6, guns: 8, slot: '平段' },
      { time: '13:00', hour: 13, kw: 140.0, guns: 9, slot: '平段' },
      { time: '14:00', hour: 14, kw: 105.2, guns: 6, slot: '平段' },
      { time: '15:00', hour: 15, kw: 78.4, guns: 5, slot: '高峰' },
      { time: '16:00', hour: 16, kw: 84.0, guns: 5, slot: '高峰' },
      { time: '17:00', hour: 17, kw: 112.5, guns: 7, slot: '高峰' },
      { time: '18:00', hour: 18, kw: 135.0, guns: 8, slot: '高峰' },
      { time: '19:00', hour: 19, kw: 65.2, guns: 4, slot: '尖峰' },
      { time: '20:00', hour: 20, kw: 58.0, guns: 3, slot: '尖峰' },
      { time: '21:00', hour: 21, kw: 92.5, guns: 6, slot: '平段' },
      { time: '22:00', hour: 22, kw: 118.0, guns: 7, slot: '平段' },
      { time: '23:00', hour: 23, kw: 155.4, guns: 10, slot: '低谷' },
    ];

    const { sharp, peak, flat, valley } = chargingConfig.tou;
    const priceMap: Record<string, number> = {
      尖峰: sharp,
      高峰: peak,
      平段: flat,
      低谷: valley,
      深谷: chargingConfig.tou.deepValley,
    };

    return data.map((d) => ({
      timestamp: d.time,
      hour: d.hour,
      chargingLoadKw: d.kw,
      occupiedGuns: d.guns,
      slotLabel: d.slot,
      slotPrice: priceMap[d.slot] ?? 0.685,
    }));
  }, [chargingConfig]);

  // 关联的充电桩活动告警
  const linkedChargingAlarms = useMemo(() => {
    return alarms.filter(
      (a) =>
        a.deviceName.includes('充电') ||
        a.alarmTitle.includes('充电') ||
        a.id.includes('CHG') ||
        a.id === 'ALM-20260904-01'
    );
  }, [alarms]);

  return {
    site,
    currentRole,
    scenario,
    countdown,
    refreshIntervalSeconds,
    setRefreshIntervalSeconds,
    isStreamInterrupted,
    toggleStreamInterrupted,
    resumeStream,
    lastDataTimestamp,
    effectiveDataTimestamp: lastDataTimestamp,
    simulatedState,
    setSimulatedState,
    currentTariffVersion,
    referencedTariffVersion: currentTariffVersion.versionNumber,
    chargingConfig,
    piles,
    orders,
    kpis,
    trendSamples24h,
    linkedChargingAlarms,
  };
}
