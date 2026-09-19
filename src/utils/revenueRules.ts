import {
  RevenueBreakdownItem,
  RevenueKpiSummary,
  SettlementGateStatus,
  RevenueTimeslotTrendItem,
} from '../types/revenue';
import { TariffScheme, QualityLevel } from '../types/domain';

/**
 * 收益核算核心公式配置字典（集中管理）
 * 严格按照业务要求实现四项基础公式与综合收益推导
 * 页面强制标注：“核算公式已配置，实际财务结算以双方月末最终盖章对账单为准”
 */
export const REVENUE_FORMULA_CONFIG = {
  disclaimer: '核算公式已配置，实际财务结算以双方月末最终盖章对账单为准',
  rules: [
    {
      id: 'RULE-PV',
      name: '光伏综合收益',
      code: 'PV_REVENUE',
      formula: '光伏收益 = 自用电量 × 分时购电价 + 上网电量 × 上网价',
      description:
        '屋顶光伏所发电量优先供给站内负荷与充电桩就地消纳（按时段替代电网购电价计算节省），富余部分反送至 10kV 关口上网（按福建燃煤发电基准价或阶梯标杆价结算）。',
    },
    {
      id: 'RULE-ESS',
      name: '储能峰谷套利收益',
      code: 'STORAGE_ARBITRAGE',
      formula: '储能套利 = 各时段放电收益 − 各时段充电成本',
      description:
        '储能系统利用夜间低谷/深谷电价时段充电蓄能，在白天高峰及晚间尖峰电价时段放电替代高额电网购电，净差价为峰谷套利净额。',
    },
    {
      id: 'RULE-EV',
      name: '充电桩群运营收入',
      code: 'CHARGING_REVENUE',
      formula: '充电收入 = 充电电量 × 充电电价 + 充电电量 × 充电服务费',
      description:
        '园区充电桩对外服务所收取的综合电费与服务费，其中充电电费顺加当期分时电价，服务费按 0.40 元/kWh 固定标准或浮动协议计收。',
    },
    {
      id: 'RULE-NET',
      name: '综合运营净收益',
      code: 'NET_COMPREHENSIVE_REVENUE',
      formula: '综合收益 = 光伏收益 + 储能套利 + 充电收入 − 购电成本 − 基本电费',
      description:
        '园区微电网四项收益总和减去向上级电网购电支出与变压器/需量基本电费分摊后的实际运营净盈余。',
    },
  ],
};

/**
 * 结算门禁评估器
 * 门禁规则：
 * 1. 没有已生效电价时禁用结算
 * 2. 订单未完整同步时阻塞进入结算
 * 3. 数据为可疑/异常时显示置信度下降和影响范围
 */
export function evaluateSettlementGates(
  tariffScheme: TariffScheme,
  scenario: 'SCENARIO_A' | 'SCENARIO_B',
  hasSimulatedPendingOrders: boolean = false,
  isRecalculatedV2: boolean = false
): SettlementGateStatus {
  const effectiveVersion = tariffScheme.versions.find((v) => v.status === 'EFFECTIVE');
  const hasEffectiveTariff = !!effectiveVersion;

  const hasPendingSyncOrders = hasSimulatedPendingOrders;
  const pendingSyncOrderCount = hasSimulatedPendingOrders ? 3 : 0;

  const blockReasons: string[] = [];
  const warnings: string[] = [];

  // 门禁 1：电价版本生效校验
  if (!hasEffectiveTariff) {
    blockReasons.push('未检测到已生效的电价版本（当前无 EFFECTIVE 状态电价方案），日终结算已阻塞');
  }

  // 门禁 2：充电订单同步完整性校验
  if (hasPendingSyncOrders) {
    blockReasons.push(
      `存在 ${pendingSyncOrderCount} 笔充电桩模拟订单处于“待完整同步”状态（T+1 账单尚未封存），未进入结算`
    );
  }

  // 门禁 3：数据质量与置信度评估
  let dataQualityStatus: 'NORMAL' | 'SUSPICIOUS' | 'ANOMALY' = 'NORMAL';
  let dataConfidencePercent = 98.6;
  let affectedScope: string | undefined = undefined;

  if (scenario === 'SCENARIO_B' && !isRecalculatedV2) {
    dataQualityStatus = 'ANOMALY';
    dataConfidencePercent = 71.4;
    affectedScope = '昨日 22:00-24:00 储能充电计量丢失 2 个遥测批次，影响储能套利计算';
    warnings.push(
      '数据置信度为 71.4%（低于 85% 结算安全门槛），受时代星云储能通信丢包影响，需补采后发起 V2 重算'
    );
    blockReasons.push('昨日储能遥测数据质量异常导致置信度未达标（71.4% < 85.0%），结算被安全阻塞');
  } else if (isRecalculatedV2) {
    dataQualityStatus = 'NORMAL';
    dataConfidencePercent = 99.5;
    warnings.push('已通过历史数据补采修正生成 V2 记录，置信度恢复至 99.5%，已解除结算阻塞');
  }

  const canSettle = blockReasons.length === 0;

  return {
    canSettle,
    hasEffectiveTariff,
    effectiveTariffVersion: effectiveVersion?.versionNumber,
    hasPendingSyncOrders,
    pendingSyncOrderCount,
    dataQualityStatus,
    dataConfidencePercent,
    affectedScope,
    blockReasons,
    warnings,
  };
}

/**
 * 生成细分计算明细项 (Breakdown Items)
 */
export function generateRevenueBreakdownItems(params: {
  caliber: 'ESTIMATE' | 'SETTLEMENT';
  scenario: 'SCENARIO_A' | 'SCENARIO_B';
  tariffVersion: string;
  isV2: boolean;
  hasPendingOrders?: boolean;
}): RevenueBreakdownItem[] {
  const { caliber, scenario, tariffVersion, isV2, hasPendingOrders } = params;

  const isB = scenario === 'SCENARIO_B' && !isV2;
  const storageQuality: QualityLevel = isB ? 'ANOMALY' : isV2 ? 'PATCHED' : 'NORMAL';
  const storageConfidence = isB ? 71.4 : isV2 ? 99.5 : 98.6;
  const storageReason = isB
    ? '时代星云储能 EMS 连续 3 个周期通信超时，夜间谷段充电数据缺失'
    : isV2
    ? '历史补录完成，差额 +286.50 元已修正入账'
    : undefined;

  const chargingSyncStatus = hasPendingOrders ? 'PENDING_SYNC' : 'SYNCED';

  const items: RevenueBreakdownItem[] = [
    // 1. 光伏自发自用收益 (自用电量 × 分时购电价)
    {
      id: 'REV-ITEM-PV-SELF',
      category: 'PV_SELF',
      categoryLabel: '光伏自发自用节约',
      componentGroup: 'PV',
      timeslotLabel: '白天平/高峰 (08:30-17:30)',
      energyKwh: caliber === 'ESTIMATE' ? 820.0 : 3560.0,
      unitPrice: 0.85,
      pricingMode: '分时平均购电替代价',
      amount: caliber === 'ESTIMATE' ? 697.0 : 3026.0,
      quality: 'NORMAL',
      confidencePercent: 99.2,
      referencedTariffVersion: tariffVersion,
      formulaText: `${caliber === 'ESTIMATE' ? '820.0' : '3,560.0'} kWh × 0.850 元/kWh = ¥${
        caliber === 'ESTIMATE' ? '697.00' : '3,026.00'
      }`,
      dataSource: '阳光电源逆变器 0.4kV 出线母线并网表计',
      syncStatus: 'SYNCED',
    },
    // 2. 光伏余电上网收益 (上网电量 × 上网价)
    {
      id: 'REV-ITEM-PV-GRID',
      category: 'PV_GRID',
      categoryLabel: '光伏余电上网收益',
      componentGroup: 'PV',
      timeslotLabel: '午间富余窗口 (11:30-13:30)',
      energyKwh: caliber === 'ESTIMATE' ? 310.0 : 2071.2,
      unitPrice: 0.393,
      pricingMode: '福建省脱硫燃煤基准上网标杆价',
      amount: caliber === 'ESTIMATE' ? 121.8 : 814.0,
      quality: 'NORMAL',
      confidencePercent: 99.0,
      referencedTariffVersion: tariffVersion,
      formulaText: `${caliber === 'ESTIMATE' ? '310.0' : '2,071.2'} kWh × 0.3930 元/kWh = ¥${
        caliber === 'ESTIMATE' ? '121.83' : '814.00'
      }`,
      dataSource: '10kV 变电站双向关口表 (反向有功增量)',
      syncStatus: 'SYNCED',
    },
    // 3. 储能放电套利收益 (高峰放电替代)
    {
      id: 'REV-ITEM-ESS-DISCHARGE',
      category: 'STORAGE_DISCHARGE',
      categoryLabel: '储能高峰放电收益',
      componentGroup: 'STORAGE',
      timeslotLabel: '早高峰与晚尖峰 (两充两放)',
      energyKwh: caliber === 'ESTIMATE' ? 320.0 : 1850.0,
      unitPrice: 1.42,
      pricingMode: '尖峰/高峰时段放电购电替代价',
      amount: caliber === 'ESTIMATE' ? 454.4 : 2627.0,
      quality: storageQuality,
      confidencePercent: storageConfidence,
      referencedTariffVersion: tariffVersion,
      formulaText: `${caliber === 'ESTIMATE' ? '320.0' : '1,850.0'} kWh × 1.420 元/kWh = ¥${
        caliber === 'ESTIMATE' ? '454.40' : '2,627.00'
      }`,
      dataSource: '时代星云 500kW PCS 交流出线计量表',
      syncStatus: 'SYNCED',
      qualityReason: storageReason,
      qualityIssueId: isB ? 'ALM-STORAGE-COMM-01' : undefined,
    },
    // 4. 储能低谷充电成本 (低谷充电购电)
    {
      id: 'REV-ITEM-ESS-CHARGE',
      category: 'STORAGE_CHARGE',
      categoryLabel: '储能低谷充电成本',
      componentGroup: 'STORAGE',
      timeslotLabel: '夜间谷段与午间深谷 (23:00-06:30)',
      energyKwh: caliber === 'ESTIMATE' ? 380.0 : isV2 ? 2200.0 : isB ? 1500.0 : 2100.0,
      unitPrice: 0.326,
      pricingMode: '夜间谷电时段购电价',
      amount:
        caliber === 'ESTIMATE'
          ? -123.9
          : isV2
          ? -690.5 // 修正后套利 2627 - 690.5 = 1936.5
          : isB
          ? -977.0 // 丢失 2 个批次导致估算偏高，套利 2627 - 977 = 1650
          : -977.0,
      quality: storageQuality,
      confidencePercent: storageConfidence,
      referencedTariffVersion: tariffVersion,
      formulaText: `${
        caliber === 'ESTIMATE' ? '380.0' : isV2 ? '2,118.1' : '2,100.0'
      } kWh × 0.3260 元/kWh = -¥${
        caliber === 'ESTIMATE' ? '123.88' : isV2 ? '690.50' : '977.00'
      }`,
      dataSource: '时代星云 500kW PCS 交流进线计量表',
      syncStatus: 'SYNCED',
      qualityReason: storageReason,
      qualityIssueId: isB ? 'ALM-STORAGE-COMM-01' : undefined,
    },
    // 5. 充电桩综合充电电量收入 (顺加电价)
    {
      id: 'REV-ITEM-CHARGER-ENERGY',
      category: 'CHARGING_ENERGY',
      categoryLabel: '充电桩分时电费代收',
      componentGroup: 'CHARGING',
      timeslotLabel: '全天 24 小时动态车流',
      energyKwh: caliber === 'ESTIMATE' ? 890.0 : 2820.0,
      unitPrice: 0.528,
      pricingMode: '充电桩分时顺加电价加权均价',
      amount: caliber === 'ESTIMATE' ? 470.0 : 1489.0,
      quality: hasPendingOrders ? 'SUSPICIOUS' : 'NORMAL',
      confidencePercent: hasPendingOrders ? 84.0 : 99.4,
      referencedTariffVersion: tariffVersion,
      formulaText: `${caliber === 'ESTIMATE' ? '890.0' : '2,820.0'} kWh × 0.5280 元/kWh = ¥${
        caliber === 'ESTIMATE' ? '470.00' : '1,489.00'
      }`,
      dataSource: '特来电平台 12 台 120kW 快充桩计费模块',
      syncStatus: chargingSyncStatus,
      qualityReason: hasPendingOrders ? '3笔订单数据待完整同步，暂未归集' : undefined,
    },
    // 6. 充电桩服务费收益 (固定服务费)
    {
      id: 'REV-ITEM-CHARGER-SERVICE',
      category: 'CHARGING_SERVICE',
      categoryLabel: '充电桩运营服务费',
      componentGroup: 'CHARGING',
      timeslotLabel: '全天对外充电订单',
      energyKwh: caliber === 'ESTIMATE' ? 890.0 : 2820.0,
      unitPrice: 0.351,
      pricingMode: '充电运营固定服务费 0.351元/kWh',
      amount: caliber === 'ESTIMATE' ? 312.4 : 991.0,
      quality: hasPendingOrders ? 'SUSPICIOUS' : 'NORMAL',
      confidencePercent: hasPendingOrders ? 84.0 : 99.4,
      referencedTariffVersion: tariffVersion,
      formulaText: `${caliber === 'ESTIMATE' ? '890.0' : '2,820.0'} kWh × 0.3514 元/kWh = ¥${
        caliber === 'ESTIMATE' ? '312.40' : '991.00'
      }`,
      dataSource: '特来电云平台实收资金账户对账流水',
      syncStatus: chargingSyncStatus,
      qualityReason: hasPendingOrders ? '待完整同步订单金额未计入结算' : undefined,
    },
    // 7. 电网购电成本支出 (正购负售)
    {
      id: 'REV-ITEM-GRID-PURCHASE',
      category: 'GRID_PURCHASE',
      categoryLabel: '上级电网购电支出',
      componentGroup: 'GRID',
      timeslotLabel: '10kV 高压进线关口净购电',
      energyKwh: caliber === 'ESTIMATE' ? 1420.0 : 6850.0,
      unitPrice: 0.718,
      pricingMode: '福建大工业两部制分时加权购电均价',
      amount: caliber === 'ESTIMATE' ? -1020.0 : isV2 ? -4904.0 : -4920.0,
      quality: 'NORMAL',
      confidencePercent: 99.6,
      referencedTariffVersion: tariffVersion,
      formulaText: `${caliber === 'ESTIMATE' ? '1,420.0' : '6,850.0'} kWh × 0.7182 元/kWh = -¥${
        caliber === 'ESTIMATE' ? '1,020.00' : isV2 ? '4,904.00' : '4,920.00'
      }`,
      dataSource: '10kV 进线变压器高压总降双向电能表',
      syncStatus: 'SYNCED',
    },
    // 8. 基本电费分摊 (需量/容量)
    {
      id: 'REV-ITEM-CAPACITY-BASE',
      category: 'CAPACITY_BASE',
      categoryLabel: '需量基本电费日摊',
      componentGroup: 'BASE',
      timeslotLabel: '日终固定分摊 (1200kW申报)',
      energyKwh: 0,
      unitPrice: 38.0,
      pricingMode: '核定需量 38.00元/kW/月 按日折算',
      amount: caliber === 'ESTIMATE' ? -355.3 : -1066.0,
      quality: 'NORMAL',
      confidencePercent: 100.0,
      referencedTariffVersion: tariffVersion,
      formulaText: `1,200 kW × 38.00 元/kW/月 ÷ 30天 = -¥${
        caliber === 'ESTIMATE' ? '355.33' : '1,066.00'
      }`,
      dataSource: '供电局大工业合同需量备案协议',
      syncStatus: 'SYNCED',
    },
  ];

  return items;
}

/**
 * 汇总 KPI 指标数据
 */
export function aggregateRevenueKpis(
  items: RevenueBreakdownItem[],
  referencedTariffVersion: string,
  dataConfidencePercent: number
): RevenueKpiSummary {
  const pvSelf = items.find((i) => i.category === 'PV_SELF')?.amount || 0;
  const pvGrid = items.find((i) => i.category === 'PV_GRID')?.amount || 0;
  const pvTotal = pvSelf + pvGrid;

  const storageDischarge = items.find((i) => i.category === 'STORAGE_DISCHARGE')?.amount || 0;
  const storageCharge = Math.abs(items.find((i) => i.category === 'STORAGE_CHARGE')?.amount || 0);
  const storageArbitrage = storageDischarge - storageCharge;

  const chargingEnergy = items.find((i) => i.category === 'CHARGING_ENERGY')?.amount || 0;
  const chargingService = items.find((i) => i.category === 'CHARGING_SERVICE')?.amount || 0;
  const chargingTotal = chargingEnergy + chargingService;

  const gridPurchaseCost = Math.abs(items.find((i) => i.category === 'GRID_PURCHASE')?.amount || 0);
  const capacityBaseFee = Math.abs(items.find((i) => i.category === 'CAPACITY_BASE')?.amount || 0);

  // 综合收益 = 光伏收益 + 储能套利 + 充电收入 - 购电成本 - 基本电费
  const netComprehensiveRevenue =
    pvTotal + storageArbitrage + chargingTotal - gridPurchaseCost - capacityBaseFee;

  return {
    pvSelfRevenue: pvSelf,
    pvFeedInRevenue: pvGrid,
    pvTotalRevenue: pvTotal,
    storageDischargeRevenue: storageDischarge,
    storageChargeCost: storageCharge,
    storageArbitrage,
    chargingEnergyRevenue: chargingEnergy,
    chargingServiceRevenue: chargingService,
    chargingTotalRevenue: chargingTotal,
    gridPurchaseCost,
    capacityBaseFee,
    netComprehensiveRevenue,
    dataConfidencePercent,
    referencedTariffVersion,
  };
}

/**
 * 生成 24 小时各时段走势数据
 */
export function generateTimeslotTrendData(caliber: 'ESTIMATE' | 'SETTLEMENT'): RevenueTimeslotTrendItem[] {
  const isEst = caliber === 'ESTIMATE';

  return [
    {
      timeslot: '00:00 - 06:30',
      label: '夜间谷段',
      pvRevenue: 0,
      storageArbitrage: -320, // 充电蓄能
      chargingRevenue: isEst ? 95 : 380,
      gridPurchaseCost: isEst ? 280 : 1250,
      netRevenue: isEst ? -505 : -2190,
    },
    {
      timeslot: '06:30 - 08:30',
      label: '早平段',
      pvRevenue: isEst ? 80 : 320,
      storageArbitrage: 0,
      chargingRevenue: isEst ? 70 : 260,
      gridPurchaseCost: isEst ? 150 : 620,
      netRevenue: isEst ? 0 : -40,
    },
    {
      timeslot: '08:30 - 11:30',
      label: '上午高峰',
      pvRevenue: isEst ? 340 : 1450,
      storageArbitrage: isEst ? 240 : 880, // 放电套利
      chargingRevenue: isEst ? 180 : 640,
      gridPurchaseCost: isEst ? 220 : 920,
      netRevenue: isEst ? 540 : 2050,
    },
    {
      timeslot: '11:30 - 14:30',
      label: '午间光伏消纳/深谷',
      pvRevenue: isEst ? 280 : 1380,
      storageArbitrage: isEst ? -120 : -450, // 深谷微充补电
      chargingRevenue: isEst ? 190 : 720,
      gridPurchaseCost: isEst ? 120 : 480,
      netRevenue: isEst ? 230 : 1170,
    },
    {
      timeslot: '14:30 - 19:00',
      label: '下午高峰',
      pvRevenue: isEst ? 118.8 : 690,
      storageArbitrage: isEst ? 180 : 770, // 再次放电
      chargingRevenue: isEst ? 160 : 540,
      gridPurchaseCost: isEst ? 250 : 1150,
      netRevenue: isEst ? 208.8 : 850,
    },
    {
      timeslot: '19:00 - 21:00',
      label: '晚尖峰',
      pvRevenue: 0,
      storageArbitrage: isEst ? 214.4 : 977, // 尖峰放电顶峰
      chargingRevenue: isEst ? 110 : 380,
      gridPurchaseCost: isEst ? 180 : 820,
      netRevenue: isEst ? 144.4 : 537,
    },
    {
      timeslot: '21:00 - 24:00',
      label: '晚平段与谷初',
      pvRevenue: 0,
      storageArbitrage: -150,
      chargingRevenue: isEst ? 65 : 260,
      gridPurchaseCost: isEst ? 160 : 680,
      netRevenue: isEst ? -245 : -570,
    },
  ];
}
