import { Alarm, AlarmSeverity, AlarmStatus } from '../types/domain';

export interface SlaCalculationResult {
  stage: 'CONFIRM' | 'HANDLE' | 'COMPLETED' | 'TERMINATED';
  stageLabel: string;
  deadlineText: string;
  deadlineTimestamp: number;
  isOverdue: boolean;
  isExpiringSoon: boolean; // 剩余小于 5 分钟 (紧急) 或 15 分钟 (一般)
  diffMinutes: number; // 剩余分钟数（正数为剩余，负数为超时）
  formattedDuration: string; // e.g. "剩余 8m 15s" 或 "已超时 12m 40s" 或 "已按期处置"
  statusDescription: string;
  ruleExplanation: string;
}

// 运行基准时钟：2026-09-05 06:15:00
export const DEMO_REFERENCE_TIME = '2026-09-05 06:15:00';

export function parseDateSafe(dateStr?: string): number {
  if (!dateStr) return Date.now();
  // 替换空格为 T 以便兼容标准解析
  const cleaned = dateStr.trim().replace(' ', 'T');
  const parsed = Date.parse(cleaned);
  return isNaN(parsed) ? Date.now() : parsed;
}

/**
 * 格式化时差
 */
export function formatMinutesDiff(minutes: number): string {
  const absMin = Math.abs(minutes);
  const hours = Math.floor(absMin / 60);
  const remMins = Math.floor(absMin % 60);

  let str = '';
  if (hours > 0) {
    str += `${hours}h `;
  }
  str += `${remMins}m`;

  if (minutes < 0) {
    return `已超时 ${str}`;
  }
  return `剩余 ${str}`;
}

/**
 * 计算告警的当前 SLA 状态
 * 时效规则：
 * 紧急告警 (CRITICAL)：确认时限 ≤ 15 分钟，处置时限 ≤ 30 分钟
 * 一般告警 (MAJOR / MINOR / WARNING)：确认时限 ≤ 30 分钟，处置时限 ≤ 2 小时 (120分钟)
 */
export function evaluateAlarmSla(
  alarm: Alarm,
  referenceTimeStr: string = DEMO_REFERENCE_TIME
): SlaCalculationResult {
  const isCritical = alarm.severity === 'CRITICAL';
  const firstOccurMs = parseDateSafe(alarm.firstOccurrenceTime || alarm.triggeredAt);
  const refTimeMs = parseDateSafe(referenceTimeStr);

  const confirmMinutesLimit = isCritical ? 15 : 30;
  const handleMinutesLimit = isCritical ? 30 : 120;

  const confirmDeadlineMs = firstOccurMs + confirmMinutesLimit * 60 * 1000;
  const handleDeadlineMs = firstOccurMs + handleMinutesLimit * 60 * 1000;

  const ruleExplanation = isCritical
    ? '【时效规则】紧急告警：确认时限 ≤ 15 分钟、处置闭环时限 ≤ 30 分钟'
    : '【时效规则】一般告警：确认时限 ≤ 30 分钟、处置闭环时限 ≤ 2 小时';

  // 1. 已终结状态 (已处理、已关闭、误报、已忽略)
  if (
    alarm.status === 'RESOLVED' ||
    alarm.status === 'CLOSED' ||
    alarm.status === 'FALSE_ALARM' ||
    alarm.status === 'IGNORED'
  ) {
    const isSuccess = alarm.status === 'RESOLVED' || alarm.status === 'CLOSED';
    return {
      stage: isSuccess ? 'COMPLETED' : 'TERMINATED',
      stageLabel: isSuccess ? 'SLA 已履约闭环' : '已免除 SLA (归档/误报)',
      deadlineText: new Date(handleDeadlineMs).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      deadlineTimestamp: handleDeadlineMs,
      isOverdue: false,
      isExpiringSoon: false,
      diffMinutes: 0,
      formattedDuration: isSuccess ? '已按期闭环' : '无需处置',
      statusDescription: isSuccess ? '全流程闭环归档' : `终止原因: ${alarm.ignoreReason || '人工标记'}`,
      ruleExplanation,
    };
  }

  // 2. 待确认阶段 (PENDING_ACK)
  if (alarm.status === 'PENDING_ACK') {
    const diffMs = confirmDeadlineMs - refTimeMs;
    const diffMinutes = Math.round(diffMs / (60 * 1000));
    const isOverdue = diffMinutes < 0;
    const isExpiringSoon = !isOverdue && diffMinutes <= (isCritical ? 5 : 10);

    const deadlineFormatted = new Date(confirmDeadlineMs).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return {
      stage: 'CONFIRM',
      stageLabel: '待确认 SLA',
      deadlineText: deadlineFormatted,
      deadlineTimestamp: confirmDeadlineMs,
      isOverdue,
      isExpiringSoon,
      diffMinutes,
      formattedDuration: formatMinutesDiff(diffMinutes),
      statusDescription: isOverdue ? `确认已超时 ${Math.abs(diffMinutes)} 分钟` : `限时确认中 (${diffMinutes}m 剩余)`,
      ruleExplanation,
    };
  }

  // 3. 处理中阶段 (PROCESSING)
  const diffMs = handleDeadlineMs - refTimeMs;
  const diffMinutes = Math.round(diffMs / (60 * 1000));
  const isOverdue = diffMinutes < 0;
  const isExpiringSoon = !isOverdue && diffMinutes <= (isCritical ? 10 : 20);

  const deadlineFormatted = new Date(handleDeadlineMs).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return {
    stage: 'HANDLE',
    stageLabel: '处置闭环 SLA',
    deadlineText: deadlineFormatted,
    deadlineTimestamp: handleDeadlineMs,
    isOverdue,
    isExpiringSoon,
    diffMinutes,
    formattedDuration: formatMinutesDiff(diffMinutes),
    statusDescription: isOverdue ? `处置已超时 ${Math.abs(diffMinutes)} 分钟` : `现场处置中 (${diffMinutes}m 剩余)`,
    ruleExplanation,
  };
}
