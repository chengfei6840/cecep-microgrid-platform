import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAppStore } from '../../store/AppContext';
import { getWebFallbackRoute } from '../../utils/authPermissions';
import { ErrorBoundary } from '../common/ErrorBoundary';
import {
  Home,
  ClipboardCheck,
  AlertTriangle,
  Wrench,
  User,
  Wifi,
  WifiOff,
  ArrowLeft,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const MobileLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, currentRole, switchRole, scenario, switchScenario, patrolTasks, alarms, workOrders } = useAppStore();

  const [isOfflineMode, setIsOfflineMode] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isExecuting = location.pathname.includes('/execute');

  const pendingTasksCount = patrolTasks.filter((t) => t.status !== 'SUBMITTED').length;
  const criticalAlarmsCount = alarms.filter((a) => a.status === 'PROCESSING' || a.status === 'PENDING_ACK').length;
  const pendingOrdersCount = workOrders.filter((w) => w.status !== 'CLOSED').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-800 flex flex-col items-center justify-start p-0 sm:py-6 overflow-x-hidden">
      {/* 顶部快捷工具栏：无论何种屏幕宽度均常驻展示返回按钮 */}
      <div className="w-full max-w-[420px] mb-3 px-4 flex items-center justify-between text-xs text-slate-300">
        <button
          onClick={() => navigate(getWebFallbackRoute(currentRole))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回 Web 后台</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => switchScenario(scenario === 'SCENARIO_A' ? 'SCENARIO_B' : 'SCENARIO_A')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold ${
              scenario === 'SCENARIO_B' ? 'bg-amber-500 text-slate-950' : 'bg-[#004287] text-white'
            }`}
          >
            {scenario === 'SCENARIO_A' ? '场景 A' : '场景 B (异常)'}
          </button>
        </div>
      </div>

      {/* 手机外壳容器 (规范要求: 390px 左右独立设备设计) */}
      <div className="w-full sm:w-[390px] h-screen sm:h-[844px] bg-slate-50 sm:rounded-[36px] sm:shadow-2xl flex flex-col overflow-hidden border-0 sm:border-8 sm:border-slate-800 relative">
        {/* 微信小程序状态栏与顶栏胶囊 */}
        <div className="bg-[#00152A] text-white px-4 pt-3 pb-2.5 shrink-0 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <img
              src="/logo_no.png"
              alt="CECEP"
              className="h-5 w-auto object-contain brightness-125"
            />
            <span className="text-xs font-bold tracking-tight truncate">
              中节能现场巡检
            </span>
          </div>

          {/* 微信小程序模拟右上角胶囊按钮 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-full border border-slate-700/60 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="text-slate-300 font-mono text-[10px]">●●●</span>
            <span className="text-slate-600">|</span>
            <span className="w-2.5 h-2.5 rounded-full border border-slate-400 flex items-center justify-center text-[8px] text-slate-400">
              ◎
            </span>
          </div>
        </div>

        {/* 网络在线 / 离线状态感知横幅 (支持仿真开关切换) */}
        <div
          className={`px-3 py-2 text-xs flex flex-col gap-1 font-medium shrink-0 transition-colors ${
            isOfflineMode
              ? 'bg-amber-600 text-white'
              : 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {isOfflineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span>{isOfflineMode ? '现场弱网 / 离线作业模式 (本地缓存)' : '网络正常 · 云端实时同步中'}</span>
            </div>
            <button
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isOfflineMode ? 'bg-white text-amber-900 hover:bg-amber-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isOfflineMode ? '恢复在线' : '模拟离线'}
            </button>
          </div>
          {isOfflineMode && (
            <div className="text-[10px] text-amber-100 opacity-95 leading-tight">
              离线模式下：巡检打卡、现场拍照、故障记录将暂存至本地 IndexedDB 队列，待网络恢复后自动同步至云端
            </div>
          )}
        </div>

        {/* 页面内容区 */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 scrollbar-thin">
          <ErrorBoundary fallbackTitle="移动巡检工作台渲染异常">
            <Outlet />
          </ErrorBoundary>
        </div>

        {/* 底部导航栏 (执行中页面可隐藏) */}
        {!isExecuting && (
          <div className="h-14 bg-white border-t border-slate-200 flex items-center justify-around px-1 shrink-0 z-10 shadow-lg">
            <NavLink
              to="/mobile/home"
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${
                  isActive ? 'text-[#004287] font-bold' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">首页</span>
            </NavLink>

            <NavLink
              to="/mobile/tasks"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${
                  isActive ? 'text-[#004287] font-bold' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <ClipboardCheck className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">我的巡检</span>
              {pendingTasksCount > 0 && (
                <span className="absolute top-1 right-3 w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {pendingTasksCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/mobile/alarms"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${
                  isActive ? 'text-[#004287] font-bold' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <AlertTriangle className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">移动告警</span>
              {criticalAlarmsCount > 0 && (
                <span className="absolute top-1 right-3 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {criticalAlarmsCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/mobile/work-orders"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${
                  isActive ? 'text-[#004287] font-bold' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Wrench className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">整改工单</span>
              {pendingOrdersCount > 0 && (
                <span className="absolute top-1 right-3 w-4 h-4 bg-amber-500 text-slate-900 rounded-full text-[9px] font-bold flex items-center justify-center">
                  {pendingOrdersCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/mobile/profile"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                  isActive ? 'text-[#004287] font-bold' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <User className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">个人中心</span>
            </NavLink>
          </div>
        )}
      </div>
    </div>
  );
};
