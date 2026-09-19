import { TariffTimeInterval, BasicFeeConfig, PvFeedInConfig, ChargingTariffConfig } from '../types/domain';

export interface ValidationIssue {
  type: 'ERROR' | 'WARNING';
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  totalCoveredMinutes: number;
  coverageRatio: number; // 0 to 1
  issues: ValidationIssue[];
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hStr, mStr] = timeStr.trim().split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  if (h === 24) return 1440;
  return h * 60 + m;
}

export function formatMinutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(1440, minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  const hh = h < 10 ? `0${h}` : `${h}`;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return `${hh}:${mm}`;
}

export function validateTariffTimeIntervals(intervals: TariffTimeInterval[]): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!intervals || intervals.length === 0) {
    return {
      isValid: false,
      totalCoveredMinutes: 0,
      coverageRatio: 0,
      issues: [{ type: 'ERROR', field: 'timeIntervals', message: '时段配置不能为空，必须覆盖全天 00:00 - 24:00' }],
    };
  }

  // 检查单个时段的合法性与价格非负
  for (let i = 0; i < intervals.length; i++) {
    const it = intervals[i];
    const sMin = parseTimeToMinutes(it.start);
    const eMin = parseTimeToMinutes(it.end);

    if (sMin >= eMin) {
      issues.push({
        type: 'ERROR',
        field: `interval-${i}`,
        message: `时段 [${it.start} - ${it.end}] 起始时间必须早于结束时间`,
      });
    }

    if (typeof it.price !== 'number' || isNaN(it.price) || it.price < 0) {
      issues.push({
        type: 'ERROR',
        field: `price-${i}`,
        message: `时段 [${it.start} - ${it.end}] 的单价必须为大于等于 0 的有效数值`,
      });
    }
  }

  // 排序并检查连续性（覆盖、重叠、间隙）
  const sorted = [...intervals].sort((a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start));

  let coveredMinutes = 0;
  const firstStart = parseTimeToMinutes(sorted[0].start);
  if (firstStart !== 0) {
    issues.push({
      type: 'ERROR',
      field: 'startBoundary',
      message: `时段起始时间必须从 00:00 开始（当前从 ${sorted[0].start} 开始，缺失 00:00 - ${sorted[0].start} 覆盖）`,
    });
  }

  for (let i = 0; i < sorted.length; i++) {
    const curStart = parseTimeToMinutes(sorted[i].start);
    const curEnd = parseTimeToMinutes(sorted[i].end);
    const segLen = Math.max(0, curEnd - curStart);
    coveredMinutes += segLen;

    if (i > 0) {
      const prevEnd = parseTimeToMinutes(sorted[i - 1].end);
      if (curStart < prevEnd) {
        issues.push({
          type: 'ERROR',
          field: `overlap-${i}`,
          message: `时段发生冲突重叠：[${sorted[i - 1].start} - ${sorted[i - 1].end}] 与 [${sorted[i].start} - ${sorted[i].end}] 在 ${sorted[i].start} - ${sorted[i - 1].end} 重合`,
        });
      } else if (curStart > prevEnd) {
        issues.push({
          type: 'ERROR',
          field: `gap-${i}`,
          message: `时段存在空白间隙：[${sorted[i - 1].end} - ${sorted[i].start}] 未配置电价`,
        });
      }
    }
  }

  const lastEnd = parseTimeToMinutes(sorted[sorted.length - 1].end);
  if (lastEnd !== 1440) {
    issues.push({
      type: 'ERROR',
      field: 'endBoundary',
      message: `时段结束时间必须延伸至 24:00（当前结束于 ${sorted[sorted.length - 1].end}，缺失至 24:00 的覆盖）`,
    });
  }

  const coverageRatio = Math.min(1, Math.max(0, coveredMinutes / 1440));
  const hasErrors = issues.some((iss) => iss.type === 'ERROR');

  return {
    isValid: !hasErrors,
    totalCoveredMinutes: coveredMinutes,
    coverageRatio,
    issues,
  };
}

export function validateAllTariffConfigs(
  intervals: TariffTimeInterval[],
  pvConfig?: PvFeedInConfig,
  chargingConfig?: ChargingTariffConfig,
  basicFeeConfig?: BasicFeeConfig
): ValidationResult {
  const result = validateTariffTimeIntervals(intervals);
  const issues = [...result.issues];

  // 1. 光伏上网校验
  if (pvConfig) {
    if (pvConfig.mode === 'FIXED') {
      if (pvConfig.fixedPrice === undefined || pvConfig.fixedPrice < 0) {
        issues.push({
          type: 'ERROR',
          field: 'pvFixedPrice',
          message: '光伏上网固定电价必须为非负有效数值',
        });
      }
    } else if (pvConfig.mode === 'TIERED') {
      if (!pvConfig.tieredConfig || pvConfig.tieredConfig.tier1Price < 0 || pvConfig.tieredConfig.tier2Price < 0) {
        issues.push({
          type: 'ERROR',
          field: 'pvTieredPrice',
          message: '光伏上网阶梯一、二档电价必须为非负有效数值',
        });
      }
    } else if (pvConfig.mode === 'MARKET') {
      if (!pvConfig.marketConfig || pvConfig.marketConfig.basePrice < 0) {
        issues.push({
          type: 'ERROR',
          field: 'pvMarketPrice',
          message: '光伏市场化基准价必须为非负有效数值',
        });
      }
    }
  }

  // 2. 充电服务费及电量价校验
  if (chargingConfig) {
    if (chargingConfig.serviceFee === undefined || chargingConfig.serviceFee < 0) {
      issues.push({
        type: 'ERROR',
        field: 'chargingServiceFee',
        message: '充电桩运营服务费必须为非负有效数值',
      });
    }
    const tou = chargingConfig.energyPriceTou;
    if (tou) {
      if (tou.sharp < 0 || tou.peak < 0 || tou.flat < 0 || tou.valley < 0 || tou.deepValley < 0) {
        issues.push({
          type: 'ERROR',
          field: 'chargingTouPrice',
          message: '充电桩各分时电量价必须为非负数值',
        });
      }
    }
  }

  // 3. 基本电费校验（两部制互斥）
  if (basicFeeConfig) {
    if (basicFeeConfig.type !== 'CAPACITY' && basicFeeConfig.type !== 'DEMAND') {
      issues.push({
        type: 'ERROR',
        field: 'basicFeeType',
        message: '基本电费必须在【容量电费】与【需量电费】中选择一种，且不可兼选',
      });
    }
    if (basicFeeConfig.type === 'CAPACITY') {
      if (basicFeeConfig.capacityUnitPrice === undefined || basicFeeConfig.capacityUnitPrice < 0) {
        issues.push({
          type: 'ERROR',
          field: 'capacityUnitPrice',
          message: '容量电费单价必须为大于等于 0 的数值',
        });
      }
    } else if (basicFeeConfig.type === 'DEMAND') {
      if (basicFeeConfig.demandUnitPrice === undefined || basicFeeConfig.demandUnitPrice < 0) {
        issues.push({
          type: 'ERROR',
          field: 'demandUnitPrice',
          message: '需量电费单价必须为大于等于 0 的数值',
        });
      }
    }
  }

  const hasErrors = issues.some((iss) => iss.type === 'ERROR');
  return {
    isValid: !hasErrors,
    totalCoveredMinutes: result.totalCoveredMinutes,
    coverageRatio: result.coverageRatio,
    issues,
  };
}
