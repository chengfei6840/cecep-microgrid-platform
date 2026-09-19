import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAppStore } from '../../store/AppContext';
import { UserRole } from '../../types/domain';
import { MOCK_USERS } from '../../store/scenarioData';
import { ForbiddenView } from '../common/ForbiddenView';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { AiAssistantModal } from '../ai/AiAssistantModal';
import {
  isRouteAllowedForRole,
  getForbiddenReason,
  getDefaultLandingRoute,
} from '../../utils/authPermissions';
import {
  LayoutDashboard,
  Bot,
  Database,
  Layers,
  ShieldCheck,
  Receipt,
  SunMedium,
  BatteryCharging,
  Zap,
  Activity,
  Gauge,
  DollarSign,
  AlertOctagon,
  ClipboardList,
  Wrench,
  FileBarChart,
  Users,
  Shield,
  FileText,
  HeartPulse,
  MonitorPlay,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Building2,
  ChevronDown,
  Bell,
  LogOut,
  Clock,
  AlertTriangle,
  UserCheck,
  Lock,
  Info,
} from 'lucide-react';

interface NavItemConfig {
  path: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
  badgeVariant?: 'red' | 'blue' | 'amber';
  requiredRoles?: UserRole[];
}

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    isAuthenticated,
    isSessionExpired,
    simulateSessionExpiry,
    dismissSessionExpiry,
    logout,
    currentRole,
    currentUser,
    switchRole,
    addAuditLog,
    scenario,
    switchScenario,
    resetDemoData,
    site,
    sites,
    switchSite,
    tariffSchemes,
    alarms,
    agentEvents,
    workOrders,
    mockMode,
    setMockMode,
  } = useAppStore();

  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSiteSwitcher, setShowSiteSwitcher] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [roleSwitchModal, setRoleSwitchModal] = useState<{
    isOpen: boolean;
    targetRole: UserRole | null;
  }>({
    isOpen: false,
    targetRole: null,
  });
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  // 1. 未登录重定向守卫 (刷新时根据会话状态保持，未登录重定向至 /login)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 待处理徽标统计
  const criticalAlarmsCount = alarms.filter(
    (a) => a.status === 'PENDING_ACK' || a.status === 'PROCESSING'
  ).length;
  const pendingAgentDecisions = agentEvents.filter(
    (e) => e.status === 'AWAITING_DECISION'
  ).length;
  const pendingWorkOrders = workOrders.filter(
    (w) => w.status === 'PENDING_ACCEPT' || w.status === 'PENDING_REVIEW'
  ).length;
  const totalNotifications = criticalAlarmsCount + pendingAgentDecisions + pendingWorkOrders;

  // 导航结构与角色权限绑定
  const navSections: Array<{
    groupTitle: string;
    items: NavItemConfig[];
  }> = [
    {
      groupTitle: '核心平台与概览',
      items: [
        {
          path: '/dashboard',
          name: '首页总览',
          icon: LayoutDashboard,
          requiredRoles: ['ADMIN', 'OPERATOR'],
        },
        {
          path: '/agent-hub',
          name: 'Agent Hub 事件中心',
          icon: Bot,
          badgeCount: pendingAgentDecisions,
          badgeVariant: 'amber',
          requiredRoles: ['ADMIN', 'OPERATOR'],
        },
      ],
    },
    {
      groupTitle: '数据接入与治理',
      items: [
        {
          path: '/data/integrations',
          name: '第三方接入与同步',
          icon: Database,
          requiredRoles: ['ADMIN'], // 系统管理员专属
        },
        {
          path: '/data/assets',
          name: '设备点位与指标',
          icon: Layers,
          requiredRoles: ['ADMIN', 'OPERATOR'],
        },
        {
          path: '/data/quality',
          name: '数据质量与补采',
          icon: ShieldCheck,
          requiredRoles: ['ADMIN', 'OPERATOR'],
        },
        {
          path: '/tariffs',
          name: '电价方案与授权',
          icon: Receipt,
          requiredRoles: ['ADMIN', 'OPERATOR'], // 巡检员严禁访问
        },
      ],
    },
    {
      groupTitle: '微电网实时监测',
      items: [
        { path: '/big-screen', name: '单站监控大屏', icon: MonitorPlay, requiredRoles: ['ADMIN', 'OPERATOR'] },
        { path: '/monitor/pv', name: '光伏发电监测', icon: SunMedium, requiredRoles: ['ADMIN', 'OPERATOR'] },
        { path: '/monitor/storage', name: '储能系统监测', icon: BatteryCharging, requiredRoles: ['ADMIN', 'OPERATOR'] },
        { path: '/monitor/charging', name: '充电桩群监测', icon: Zap, requiredRoles: ['ADMIN', 'OPERATOR'] },
        { path: '/monitor/grid', name: '电网负荷与气象', icon: Activity, requiredRoles: ['ADMIN', 'OPERATOR'] },
      ],
    },
    {
      groupTitle: '运营结算与风控',
      items: [
        {
          path: '/revenue',
          name: '收益核算中心',
          icon: DollarSign,
          requiredRoles: ['ADMIN', 'OPERATOR'], // 巡检员严禁访问
        },
        {
          path: '/alarms',
          name: '告警风控中心',
          icon: AlertOctagon,
          badgeCount: criticalAlarmsCount,
          badgeVariant: 'red',
          requiredRoles: ['ADMIN', 'OPERATOR', 'INSPECTOR'], // 巡检员可看现场告警
        },
      ],
    },
    {
      groupTitle: '现场运维闭环',
      items: [
        {
          path: '/mobile-simulator',
          name: '微信移动巡检端',
          icon: Smartphone,
          requiredRoles: ['ADMIN', 'OPERATOR', 'INSPECTOR'],
        },
        {
          path: '/operations/plans',
          name: '巡检计划',
          icon: ClipboardList,
          requiredRoles: ['ADMIN', 'OPERATOR'],
        },
        {
          path: '/operations/tasks',
          name: '巡检任务清单',
          icon: CheckCircle2,
          requiredRoles: ['ADMIN', 'OPERATOR', 'INSPECTOR'],
        },
        {
          path: '/operations/work-orders',
          name: '整改工单',
          icon: Wrench,
          badgeCount: pendingWorkOrders,
          badgeVariant: 'amber',
          requiredRoles: ['ADMIN', 'OPERATOR', 'INSPECTOR'],
        },
        {
          path: '/operations/records',
          name: '巡检历史记录',
          icon: FileText,
          requiredRoles: ['ADMIN', 'OPERATOR', 'INSPECTOR'],
        },
        {
          path: '/reports',
          name: '报表与审计归档',
          icon: FileBarChart,
          requiredRoles: ['ADMIN', 'OPERATOR'],
        },
      ],
    },
    {
      groupTitle: '系统管理与审计',
      items: [
        {
          path: '/admin/users',
          name: '用户管理',
          icon: Users,
          requiredRoles: ['ADMIN'], // 管理员专属
        },
        {
          path: '/admin/roles',
          name: '角色权限矩阵',
          icon: Shield,
          requiredRoles: ['ADMIN'], // 管理员专属
        },
        {
          path: '/admin/audit',
          name: '系统操作日志',
          icon: FileText,
          requiredRoles: ['ADMIN', 'OPERATOR'],
        },
        {
          path: '/admin/health',
          name: '平台健康诊断',
          icon: HeartPulse,
          requiredRoles: ['ADMIN', 'OPERATOR'],
        },
      ],
    },
  ];

  // 得到当前页面面包屑标题
  const getCurrentPageName = () => {
    for (const group of navSections) {
      const found = group.items.find((i) => i.path === location.pathname);
      if (found) return found.name;
    }
    if (location.pathname.startsWith('/operations/tasks/')) return '巡检任务详情';
    return '中节能低碳园区微电网数字化平台';
  };

  // 2. 严格路由权限判定 (不允许直接 URL 绕过)
  const currentPath = location.pathname;
  const isForbidden = !isRouteAllowedForRole(currentPath, currentRole);
  const forbiddenReason = isForbidden ? getForbiddenReason(currentPath, currentRole) : '';
  const forbiddenRequiredRoles: UserRole[] =
    currentRole === 'OPERATOR'
      ? ['ADMIN']
      : currentPath === '/data/integrations' || currentPath.startsWith('/admin')
      ? ['ADMIN']
      : ['ADMIN', 'OPERATOR'];

  // 执行二次确认后的角色切换
  const handleConfirmRoleSwitch = () => {
    if (!roleSwitchModal.targetRole) return;
    const target = roleSwitchModal.targetRole;
    const targetUser = MOCK_USERS.find((u) => u.role === target) || MOCK_USERS[0];

    switchRole(target);

    // 写入安全审计日志
    addAuditLog({
      targetObject: '管理工作台',
      action: '切换操作角色',
      oldState: `${currentUser.roleTitle} (${currentUser.name})`,
      newState: `${targetUser.roleTitle} (${targetUser.name})`,
      reason: `从 ${currentUser.roleTitle} 切换至 ${targetUser.roleTitle} 进行权限与业务核验`,
      role: target,
      operatorName: targetUser.name,
    });

    setRoleSwitchModal({ isOpen: false, targetRole: null });
    navigate(getDefaultLandingRoute(target));
  };

  // 执行退出登录
  const handleConfirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* 1. 左侧深海军蓝可折叠侧边栏 */}
      <aside
        className={`relative z-20 flex flex-col bg-[#00152A] text-slate-200 transition-all duration-200 ease-in-out shrink-0 border-r border-slate-800/80 ${
          collapsed ? 'w-[70px]' : 'w-64'
        }`}
      >
        {/* CECEP 品牌头部与 Logo (展开显示完整含中国节能字样Logo，折叠时保持精致微标且绝不溢出) */}
        {!collapsed ? (
          <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800/80 bg-[#001020] shrink-0">
            <div className="bg-white px-2.5 py-1.5 rounded-lg shrink-0 flex items-center justify-center shadow-2xs border border-slate-700/50">
              <img
                src="/logo_full.svg"
                alt="中国节能 CECEP"
                className="h-7.5 w-auto max-w-[172px] object-contain shrink-0"
              />
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors shrink-0"
              title="折叠导航栏"
              aria-label="折叠导航栏"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-center border-b border-slate-800/80 bg-[#001020] shrink-0 px-2 overflow-hidden">
            <button
              onClick={() => setCollapsed(false)}
              className="group relative flex items-center justify-center w-11 h-10 rounded-lg bg-slate-800/70 hover:bg-[#004287] border border-slate-700/70 hover:border-blue-400/50 transition-all cursor-pointer shadow-xs"
              title="点击展开导航栏"
              aria-label="点击展开导航栏"
            >
              <div className="bg-white px-1.5 py-0.5 rounded-md flex items-center justify-center group-hover:scale-95 transition-transform">
                <img
                  src="/logo_icon.svg"
                  alt="中国节能"
                  className="h-5 w-auto max-w-[28px] object-contain"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#004287] group-hover:bg-blue-500 text-white rounded-full p-0.5 shadow-sm border border-slate-900 transition-colors">
                <ChevronRight className="w-2.5 h-2.5" />
              </div>
            </button>
          </div>
        )}

        {/* 导航菜单列表 (按总控权限显示，隐藏与禁用和路由守卫一致) */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-700">
          {/* 巡检员专属提示与进入移动端按钮 */}
          {currentRole === 'INSPECTOR' && !collapsed && (
            <div className="mx-1 p-2.5 rounded-lg bg-blue-950/70 border border-blue-800 text-xs space-y-1.5 mb-3">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-[11px]">
                <Smartphone className="w-3.5 h-3.5" />
                <span>现场移动作业入口</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                巡检员核心作业为现场移动巡检小程序，支持就地打卡与离线暂存。
              </p>
              <button
                onClick={() => navigate('/mobile/tasks')}
                className="w-full py-1.5 rounded bg-[#004287] hover:bg-[#003366] text-white font-medium text-[11px] flex items-center justify-center gap-1 transition-colors shadow-xs"
              >
                <span>进入移动端任务</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {navSections.map((sec, idx) => {
            // 严格按总控权限过滤：隐藏与路由守卫完全一致
            const visibleItems = sec.items.filter((item) => {
              if (item.requiredRoles && !item.requiredRoles.includes(currentRole)) {
                return false;
              }
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                {!collapsed && (
                  <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    {sec.groupTitle}
                  </div>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  const isLockedForRole =
                    item.requiredRoles && !item.requiredRoles.includes(currentRole);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={
                        collapsed
                          ? `${item.name}${isLockedForRole ? ' (受权限限制)' : ''}`
                          : undefined
                      }
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-xs font-medium group ${
                        isActive
                          ? 'bg-[#004287] text-white shadow-xs'
                          : isLockedForRole
                          ? 'text-slate-500 hover:bg-slate-900/40 hover:text-slate-400'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isActive
                            ? 'text-white'
                            : isLockedForRole
                            ? 'text-slate-500'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      {!collapsed && (
                        <span className="truncate flex-1 flex items-center justify-between">
                          <span className={isLockedForRole ? 'opacity-70' : ''}>
                            {item.name}
                          </span>
                          {isLockedForRole && (
                            <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                          )}
                        </span>
                      )}
                      {!collapsed &&
                        !isLockedForRole &&
                        item.badgeCount !== undefined &&
                        item.badgeCount > 0 && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                              item.badgeVariant === 'red'
                                ? 'bg-red-500 text-white animate-pulse'
                                : item.badgeVariant === 'amber'
                                ? 'bg-amber-500 text-slate-900'
                                : 'bg-blue-500 text-white'
                            }`}
                          >
                            {item.badgeCount}
                          </span>
                        )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* 侧栏底部折叠切换条 (支持底部随时展开或收起) */}
        <div className="p-2 border-t border-slate-800/80 bg-[#001020] shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center rounded-lg p-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
            title={collapsed ? '展开导航栏' : '收起导航栏'}
            aria-label={collapsed ? '展开导航栏' : '收起导航栏'}
          >
            {!collapsed && <span>收起侧栏</span>}
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-slate-300 hover:text-white" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>

      {/* 2. 右侧主工作区 (白色/浅灰背景) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 全局顶栏：当前页面、低碳园区示范站、通知、角色和退出 */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between shrink-0 shadow-2xs z-20">
          {/* 左侧：侧栏切换按钮、当前路由面包屑与多站点选择切换器 */}
          <div className="flex items-center gap-3 min-w-0">
            {/* 顶栏左侧折叠/展开侧边栏按钮，保证无论何时都能快捷展开或折叠 */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
              title={collapsed ? '展开侧边导航栏' : '折叠侧边导航栏'}
              aria-label={collapsed ? '展开侧边导航栏' : '折叠侧边导航栏'}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-[#004287]" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-slate-500" />
              )}
            </button>

            <div className="h-4 w-px bg-slate-200 shrink-0 hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-bold text-slate-900 leading-tight">
                  {getCurrentPageName()}
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden xl:block mt-0.5 font-mono">
                中节能低碳园区微电网数字化平台 · 多试点协同总控
              </p>
            </div>

            {/* 园区站点选择器 (支持多站点协同与专属方案联动) */}
            <div className="relative">
              <button
                onClick={() => setShowSiteSwitcher(!showSiteSwitcher)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left shadow-2xs"
                title="点击切换当前监控园区试点站"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 animate-pulse shrink-0" />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[130px] md:max-w-[170px]">
                      {site.name}
                    </span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-slate-200 text-slate-700 font-mono font-medium hidden sm:inline">
                      {site.code}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    showSiteSwitcher ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* 下拉面板 */}
              {showSiteSwitcher && (
                <div className="absolute left-0 mt-2 w-76 md:w-84 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                  <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#004287]" />
                      切换园区试点站 ({sites.length})
                    </span>
                    <NavLink
                      to="/admin/sites"
                      onClick={() => setShowSiteSwitcher(false)}
                      className="text-[11px] text-[#004287] hover:underline font-medium"
                    >
                      站点管理 →
                    </NavLink>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
                    {sites.map((s) => {
                      const isSelected = s.id === site.id;
                      const sTariff = tariffSchemes.find((ts) => ts.siteId === s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            switchSite(s.id);
                            setShowSiteSwitcher(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start justify-between gap-2 ${
                            isSelected
                              ? 'bg-blue-50/70 border-blue-200 text-slate-900'
                              : 'bg-white border-transparent hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs truncate">{s.name}</span>
                              {isSelected && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-medium">
                                  激活
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 truncate font-mono">
                              {s.gridVoltage} · 光伏 {s.pvCapacityKwp}kWp · 储能 {s.storageCapacityKwh}kWh
                            </div>
                            {sTariff && (
                              <div className="text-[10px] text-blue-700 bg-blue-50/80 px-1.5 py-0.5 rounded mt-1.5 inline-block font-mono">
                                专属方案: {sTariff.name} ({sTariff.currentVersion})
                              </div>
                            )}
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：AI 对话助手、通知、角色切换、用户卡片与退出 */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* AI 助手入口按钮 */}
            <button
              id="btn-top-ai-assistant"
              onClick={() => setIsAiAssistantOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#002B5C] via-[#004287] to-blue-600 hover:from-[#003875] hover:to-blue-500 text-white shadow-xs hover:shadow-md transition-all text-xs font-semibold select-none group cursor-pointer border border-blue-400/40"
              title="打开微电网 AI 助手"
            >
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400 opacity-75" />
                <Sparkles className="w-3.5 h-3.5 text-cyan-300 relative z-10 group-hover:rotate-12 transition-transform" />
              </div>
              <span className="tracking-wide">AI助手</span>
            </button>

            {/* 通知中心按钮与下拉抽屉 */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                title="待办告警与决策通知"
              >
                <Bell className="w-4 h-4" />
                {totalNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* 通知中心浮窗 */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      待处置预警与事件通知
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
                      共 {totalNotifications} 项待办
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {criticalAlarmsCount > 0 && (
                      <div
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/alarms');
                        }}
                        className="p-3 hover:bg-slate-50 cursor-pointer flex items-start gap-2.5"
                      >
                        <AlertOctagon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-slate-800">
                            存在 {criticalAlarmsCount} 起待处置告警
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            包含通信中断或越限预警，点击进入告警风控中心
                          </div>
                        </div>
                      </div>
                    )}
                    {pendingAgentDecisions > 0 && (
                      <div
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/agent-hub');
                        }}
                        className="p-3 hover:bg-slate-50 cursor-pointer flex items-start gap-2.5"
                      >
                        <Bot className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-slate-800">
                            {pendingAgentDecisions} 条待人工决策建议
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Agent 诊断已给出处置策略，需运营人员确认
                          </div>
                        </div>
                      </div>
                    )}
                    {pendingWorkOrders > 0 && (
                      <div
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/operations/work-orders');
                        }}
                        className="p-3 hover:bg-slate-50 cursor-pointer flex items-start gap-2.5"
                      >
                        <Wrench className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-slate-800">
                            {pendingWorkOrders} 张流转中消缺工单
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            联动现场巡检员闭环处理中
                          </div>
                        </div>
                      </div>
                    )}
                    {totalNotifications === 0 && (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        暂无紧急待办通知，全站运行平稳
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-1.5 border-t border-slate-100 bg-slate-50 text-[11px] text-right">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-blue-600 hover:underline"
                    >
                      关闭浮窗
                    </button>
                  </div>
                </div>
              )}
            </div>


            {/* 用户与角色信息卡片 */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div
                className="w-8 h-8 rounded-full bg-[#004287] text-white flex items-center justify-center font-bold text-xs"
                title={`${currentUser.name} (${currentUser.roleTitle})`}
              >
                {currentUser.name.slice(0, 1)}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight truncate max-w-[90px]">
                  {currentUser.roleTitle}
                </span>
              </div>
            </div>

            {/* 退出登录按钮 */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 只读模式提醒横幅 (例如运营人员查看电价页面) */}
        {currentRole === 'OPERATOR' && location.pathname === '/tariffs' && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-900 z-10">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>只读模式提醒：</strong>当前以【运营主管 - 陈若涵】身份访问，可查阅发改委分时电价方案与参数，但电价生效二次授权等控制仅限【系统管理员 - 张宇轩】执行。
              </span>
            </div>
            <button
              onClick={() => setRoleSwitchModal({ isOpen: true, targetRole: 'ADMIN' })}
              className="text-amber-800 font-semibold hover:underline shrink-0 ml-4"
            >
              切换为管理员授权 →
            </button>
          </div>
        )}

        {/* 主体可滚动工作页面 */}
        <main className="flex-1 overflow-y-auto p-5 md:p-6 bg-slate-50 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            <ErrorBoundary fallbackTitle="管理后台工作台渲染异常">
              {isForbidden ? (
                <ForbiddenView
                  requiredRoles={forbiddenRequiredRoles}
                  pageTitle={getCurrentPageName()}
                  reason={forbiddenReason}
                />
              ) : (
                <Outlet />
              )}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* 角色切换二次确认模态框 */}
      {roleSwitchModal.isOpen && roleSwitchModal.targetRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-[#00152A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>角色切换二次确认</span>
              </div>
              <button
                onClick={() => setRoleSwitchModal({ isOpen: false, targetRole: null })}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                您即将从当前角色【{currentUser.roleTitle}（{currentUser.name}）】切换至：
              </p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl font-medium text-blue-900">
                {roleSwitchModal.targetRole === 'ADMIN' &&
                  '系统管理员 · 张宇轩（中节能数字化中心 / 平台技术部）'}
                {roleSwitchModal.targetRole === 'OPERATOR' &&
                  '微电网运营主管 · 陈若涵（园区运营部 / 能效管理中心）'}
                {roleSwitchModal.targetRole === 'INSPECTOR' &&
                  '现场特种运维巡检员 · 林志强（中节能物业 / 现场工程组）'}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                说明：确认切换后将跳转至该角色的默认工作落地页（
                {roleSwitchModal.targetRole === 'ADMIN'
                  ? '/data/integrations'
                  : roleSwitchModal.targetRole === 'OPERATOR'
                  ? '/agent-hub'
                  : '/mobile/tasks'}
                ），并向系统审计日志写入一条操作记录。
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setRoleSwitchModal({ isOpen: false, targetRole: null })}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmRoleSwitch}
                  className="px-4 py-1.5 rounded-lg bg-[#004287] text-white font-semibold hover:bg-[#003366]"
                >
                  确认切换并跳转
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 退出登录确认对话框 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 space-y-4 text-xs">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  确认退出系统？
                </h3>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  退出后将清除当前安全登录会话并返回登录界面。运行期间产生的数据及操作记录（如补采记录、告警处置、工单流转）将完整保留在本地，不会被清空。
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="px-4 py-1.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                >
                  确认退出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 会话超时过期模拟全屏模态框 */}
      {isSessionExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-5 text-center animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-900">
                CECEP-SEC-TIMEOUT (401)
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-2">
                安全会话已过期
              </h2>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                当前账号安全令牌已超时失效。为确保低碳园区微电网运行控制与收益结算安全，请重新登录。业务数据已完好留存。
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-center">
              <button
                onClick={() => {
                  dismissSessionExpiry();
                  navigate('/login');
                }}
                className="px-6 py-2 rounded-xl bg-[#004287] text-white font-semibold text-xs hover:bg-[#003366] transition-colors shadow-sm"
              >
                重新登录认证
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 集中场景控制器模态框 */}
      {showScenarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4.5 bg-[#00152A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>集中场景控制器 (ScenarioController)</span>
              </div>
              <button
                onClick={() => setShowScenarioModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                两套场景使用统一实体 ID（低碳园区示范站 SITE-001），切换后各页面状态全自动联动流转：
              </p>

              {/* 场景 A */}
              <div
                onClick={() => {
                  switchScenario('SCENARIO_A');
                  setShowScenarioModal(false);
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  scenario === 'SCENARIO_A'
                    ? 'border-[#004287] bg-blue-50/50 ring-2 ring-blue-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">
                    场景 A：正常运营
                  </span>
                  {scenario === 'SCENARIO_A' && (
                    <span className="px-2 py-0.5 bg-blue-700 text-white rounded text-[10px] font-bold">
                      当前激活
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  五类数据源均在线采集；分时电价 V1.0 已由管理员二次授权生效；实时监测平稳；今日显示滚动估算收益；昨日 T+1 结算完成；无逾期告警。
                </p>
              </div>

              {/* 场景 B */}
              <div
                onClick={() => {
                  switchScenario('SCENARIO_B');
                  setShowScenarioModal(false);
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  scenario === 'SCENARIO_B'
                    ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">
                    场景 B：储能 EMS 异常闭环
                  </span>
                  {scenario === 'SCENARIO_B' && (
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-900 rounded text-[10px] font-bold">
                      当前激活
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  储能 EMS 连续 3 个周期超时重试 → 生成紧急告警 → 数据接入 Agent 诊断并建议巡检 → 运营人员派单 → 巡检员现场离线作业后恢复网络同步 → 启动历史补采 → 收益重算生成 V2 并保留 V1。
                </p>
              </div>

              {/* 模拟响应模式 */}
              <div className="pt-2 border-t border-slate-100">
                <div className="font-semibold text-slate-700 mb-1.5">模拟异步请求模式：</div>
                <div className="grid grid-cols-4 gap-2">
                  {(['SUCCESS', 'EMPTY', 'FAILED', 'UNAUTHORIZED'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMockMode(m)}
                      className={`px-2 py-1.5 rounded border text-[11px] font-medium transition-colors ${
                        mockMode === m
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m === 'SUCCESS'
                        ? '成功'
                        : m === 'EMPTY'
                        ? '空数据'
                        : m === 'FAILED'
                        ? '请求失败'
                        : '无权限(403)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 模拟会话过期测试动作 */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-600 font-medium">会话状态异常测试：</span>
                <button
                  onClick={() => {
                    setShowScenarioModal(false);
                    simulateSessionExpiry();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded font-semibold text-xs"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>模拟会话过期</span>
                </button>
              </div>

              {/* 重置数据动作 */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    resetDemoData();
                    setShowScenarioModal(false);
                  }}
                  className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>重置所有数据至初始状态</span>
                </button>
                <button
                  onClick={() => setShowScenarioModal(false)}
                  className="px-4 py-1.5 bg-slate-200 text-slate-800 rounded font-medium hover:bg-slate-300"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* AI 对话助手浮动模态/抽屉 */}
      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
      />
    </div>
  );
};
