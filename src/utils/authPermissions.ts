import { UserRole } from '../types/domain';

// 角色默认主落地页
export const getDefaultLandingRoute = (role: UserRole): string => {
  switch (role) {
    case 'ADMIN':
      return '/data/integrations';
    case 'OPERATOR':
      return '/agent-hub';
    case 'INSPECTOR':
      return '/mobile/tasks';
    default:
      return '/dashboard';
  }
};

// 角色进入 Web 端后台时的有效承接页（避免跳到无权限页面）
export const getWebFallbackRoute = (role: UserRole): string => {
  switch (role) {
    case 'ADMIN':
      return '/data/integrations';
    case 'OPERATOR':
      return '/agent-hub';
    case 'INSPECTOR':
      return '/operations/tasks';
    default:
      return '/dashboard';
  }
};

/**
 * 严格路由权限校验矩阵
 * 系统管理员 (ADMIN): 拥有全部页面权限
 * 运营人员 (OPERATOR): 拥有业务看板、收益中心、电价只读、现场闭环与审计日志权限，禁止访问系统级管理 (admin/users, admin/roles, admin/health, data/integrations)
 * 巡检员 (INSPECTOR): 现场移动运维定位。Web 端仅开放现场告警 (/alarms)、巡检任务 (/operations/tasks)、整改工单 (/operations/work-orders)、历史记录 (/operations/records)、移动模拟 (/mobile-simulator) 与移动端 (/mobile/*)；严禁访问后台配置 (/tariffs, /data/*)、收益核算 (/revenue)、调度决策 (/agent-hub, /dashboard, /screen, /monitor/*) 与系统管理 (/admin/*, /reports, /operations/plans)
 */
export const isRouteAllowedForRole = (pathname: string, role: UserRole): boolean => {
  // 管理员无阻碍放行
  if (role === 'ADMIN') {
    return true;
  }

  // 1. 运营主管 (OPERATOR) 权限校验
  if (role === 'OPERATOR') {
    const adminExclusivePrefixes = [
      '/data/integrations',
      '/admin/users',
      '/admin/roles',
    ];
    // 禁止访问系统管理员专属底层配置
    if (adminExclusivePrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
      return false;
    }
    return true;
  }

  // 2. 现场巡检员 (INSPECTOR) 权限校验
  if (role === 'INSPECTOR') {
    // 允许访问的精确路径或前缀
    const inspectorAllowedPrefixes = [
      '/mobile',
      '/mobile-simulator',
      '/operations/tasks',
      '/operations/work-orders',
      '/operations/records',
      '/alarms',
      '/login',
    ];

    const isExplicitlyAllowed = inspectorAllowedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
    );

    return isExplicitlyAllowed;
  }

  return false;
};

/**
 * 获取友好的无权限拦截解释文案
 */
export const getForbiddenReason = (pathname: string, role: UserRole): string => {
  if (role === 'INSPECTOR') {
    if (pathname.startsWith('/tariffs')) {
      return '根据中节能电气安全与三权分立规程，分时电价方案与生效授权（/tariffs）属于财务与运管核心配置，现场巡检员（林志强）严禁进入。现场工作请使用移动巡检工作台。';
    }
    if (pathname.startsWith('/revenue')) {
      return '根据中节能三权分立规程，微电网收益核算与差异分析（/revenue）属于财务与运管专属业务，现场巡检员（林志强）严禁访问。';
    }
    if (pathname.startsWith('/data')) {
      return '数据接入与点位资产治理模块属于系统管理员与运营主管管辖范围，现场巡检员（林志强）无权进入。';
    }
    if (pathname.startsWith('/admin')) {
      return '系统配置、人员账号与安全矩阵属于系统管理员专属管理域，现场巡检员（林志强）严禁访问。';
    }
    if (pathname.startsWith('/agent-hub') || pathname.startsWith('/dashboard') || pathname.startsWith('/screen') || pathname.startsWith('/big-screen') || pathname.startsWith('/monitor')) {
      return '全站监控运行调度与 Agent 智能决策中心属于运行值守与运营主管管辖，现场巡检员（林志强）仅负责现场物理点检与工单闭环。';
    }
    if (pathname.startsWith('/operations/plans')) {
      return '巡检周期计划编制属于运营主管专属权限，现场巡检员仅可执行已派发的现场任务。';
    }
    if (pathname.startsWith('/reports')) {
      return '财务与综合运营报表归档属于运营主管管辖范围，现场巡检员无权进入。';
    }
    return '根据中节能三权分立安全规程，当前页面属于后台配置或运管专属模块，巡检员严禁操作。现场作业请使用移动巡检工作台。';
  }

  if (role === 'OPERATOR') {
    return '该模块包含平台底层适配器接入或人员系统安全矩阵，属于【系统管理员（张宇轩）】专属管辖权限。运营主管享有只读业务总览与日志权限。';
  }

  return '当前角色权限受限，无法访问指定受保护路由。';
};
