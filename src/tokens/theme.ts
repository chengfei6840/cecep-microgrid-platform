/**
 * 中节能低碳园区微电网数字化平台 - 设计令牌与品牌规范
 * 原型推导色：
 * CECEP 蓝：#004287 (中国节能标志蓝)
 * 深海军蓝：#00152A (后台侧栏、高权重底色)
 * 节能绿：#58B331 (绿色正常态、环保基准色)
 */

export const THEME_TOKENS = {
  brand: {
    name: '中节能低碳园区微电网数字化平台',
    subTitle: '基于 AI 的低碳园区微电网数字化平台',
    siteName: '低碳园区示范站',
    siteCode: 'CECEP-001',
    logoUrl: `${import.meta.env.BASE_URL}logo_no.png`,
  },
  colors: {
    cecepBlue: '#004287',
    cecepBlueHover: '#003366',
    cecepBlueLight: '#E8F1FC',
    navySidebar: '#00152A',
    navySidebarHover: '#0B223D',
    navySidebarActive: '#123055',
    greenNormal: '#58B331',
    greenLight: '#EEF8EB',
    amberWarning: '#D97706',
    amberLight: '#FEF3C7',
    redEmergency: '#DC2626',
    redLight: '#FEE2E2',
    pageBg: '#F8FAFC',
    cardBg: '#FFFFFF',
    border: '#E2E8F0',
    borderDark: '#CBD5E1',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
  },
  bigScreen: {
    bg: '#040915',
    panelBg: 'rgba(9, 23, 44, 0.85)',
    borderCyan: '#1E4976',
    accentCyan: '#00A8FF',
    accentGreen: '#38EF7D',
    accentAmber: '#F59E0B',
    accentRed: '#EF4444',
  },
  statusColors: {
    online: { text: '#15803D', bg: '#DCFCE7', border: '#86EFAC', label: '在线' },
    offline: { text: '#475569', bg: '#F1F5F9', border: '#CBD5E1', label: '离线' },
    warning: { text: '#B45309', bg: '#FEF3C7', border: '#FCD34D', label: '告警' },
    retrying: { text: '#2563EB', bg: '#DBEAFE', border: '#93C5FD', label: '重试中' },
    failed: { text: '#B91C1C', bg: '#FEE2E2', border: '#FCA5A5', label: '异常/失败' },
  },
  qualityLevels: {
    normal: { label: '正常', color: '#16A34A', bg: '#DCFCE7', desc: '数据完整连续，无缺失或越限' },
    patched: { label: '补录', color: '#0284C7', bg: '#E0F2FE', desc: '历史缺失数据已按规程补采回填' },
    suspicious: { label: '可疑', color: '#D97706', bg: '#FEF3C7', desc: '数值发生突变或临界偏离，需人工核对' },
    anomaly: { label: '异常', color: '#DC2626', bg: '#FEE2E2', desc: '连续丢失周期超限或物理值失真' },
  },
} as const;
