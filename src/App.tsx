import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppStore } from './store/AppContext';
import { getDefaultLandingRoute } from './utils/authPermissions';
import { AdminLayout } from './components/layout/AdminLayout';
import { MobileLayout } from './components/layout/MobileLayout';
import { Login } from './pages/Login';
import { PrototypeInspector } from './pages/PrototypeInspector';
import { Dashboard } from './pages/Dashboard';
import { AgentHub } from './pages/AgentHub';
import { DataIntegrations } from './pages/DataIntegrations';
import { DataQuality } from './pages/DataQuality';
import { TariffManagement } from './pages/TariffManagement';
import { RevenueCenter } from './pages/RevenueCenter';
import { AlarmsCenter } from './pages/AlarmsCenter';
import { PatrolPlansPage } from './pages/operations/PatrolPlansPage';
import { PatrolTasksPage } from './pages/operations/PatrolTasksPage';
import { WorkOrdersPage } from './pages/operations/WorkOrdersPage';
import { PatrolRecordsPage } from './pages/operations/PatrolRecordsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { BigScreenPreview } from './pages/BigScreenPreview';
import { BigScreenEmbedPage } from './pages/BigScreenEmbedPage';
import { MobileSimulatorPage } from './pages/MobileSimulatorPage';
import { DataAssets } from './pages/DataAssets';
import { MonitorHub } from './pages/MonitorHub';
import { MonitorPv } from './pages/MonitorPv';
import { MonitorStorage } from './pages/MonitorStorage';
import { MonitorCharging } from './pages/MonitorCharging';
import { MonitorGrid } from './pages/MonitorGrid';
import { ReportsPage } from './pages/ReportsPage';
import { UsersManagement } from './pages/UsersManagement';
import { RolesManagement } from './pages/RolesManagement';
import { PlatformHealthPage } from './pages/PlatformHealthPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

// Mobile Pages
import { MobileHome } from './pages/mobile/MobileHome';
import { MobileTasks } from './pages/mobile/MobileTasks';
import { MobileTaskExecute } from './pages/mobile/MobileTaskExecute';
import { MobileAlarms } from './pages/mobile/MobileAlarms';
import { MobileWorkOrders } from './pages/mobile/MobileWorkOrders';
import { MobileProfile } from './pages/mobile/MobileProfile';

const RoleBasedRedirect: React.FC = () => {
  const { currentRole } = useAppStore();
  return <Navigate to={getDefaultLandingRoute(currentRole)} replace />;
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* 登录与角色选择 */}
          <Route path="/login" element={<Login />} />

          {/* 全屏监控大屏 */}
          <Route path="/big-screen" element={<BigScreenPreview />} />

          {/* 移动巡检小程序形态路由 */}
          <Route path="/mobile" element={<MobileLayout />}>
            <Route index element={<MobileHome />} />
            <Route path="home" element={<MobileHome />} />
            <Route path="tasks" element={<MobileTasks />} />
            <Route path="tasks/:id/execute" element={<MobileTaskExecute />} />
            <Route path="alarms" element={<MobileAlarms />} />
            <Route path="work-orders" element={<MobileWorkOrders />} />
            <Route path="profile" element={<MobileProfile />} />
          </Route>

          {/* Web 管理端主工作台 */}
          <Route element={<AdminLayout />}>
            <Route index element={<RoleBasedRedirect />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="inspector" element={<PrototypeInspector />} />
            <Route path="agent-hub" element={<AgentHub />} />

            {/* 数据接入与治理 */}
            <Route path="data/integrations" element={<DataIntegrations />} />
            <Route path="data/assets" element={<DataAssets />} />
            <Route path="data/quality" element={<DataQuality />} />
            <Route path="tariffs" element={<TariffManagement />} />

            {/* 集中监控大屏与移动端模拟器 */}
            <Route path="screen" element={<Navigate to="/big-screen" replace />} />
            <Route path="mobile-simulator" element={<MobileSimulatorPage />} />

            {/* 实时微电网监测 */}
            <Route path="monitor" element={<MonitorHub />} />
            <Route path="monitor/pv" element={<MonitorPv />} />
            <Route path="monitor/storage" element={<MonitorStorage />} />
            <Route path="monitor/charging" element={<MonitorCharging />} />
            <Route path="monitor/grid" element={<MonitorGrid />} />

            {/* 运营结算与风控 */}
            <Route path="revenue" element={<RevenueCenter />} />
            <Route path="alarms" element={<AlarmsCenter />} />

            {/* 现场运维闭环 */}
            <Route path="operations/plans" element={<PatrolPlansPage />} />
            <Route path="operations/tasks" element={<PatrolTasksPage />} />
            <Route path="operations/work-orders" element={<WorkOrdersPage />} />
            <Route path="operations/records" element={<PatrolRecordsPage />} />
            <Route path="reports" element={<ReportsPage />} />

            {/* 系统管理与审计 */}
            <Route path="admin/users" element={<UsersManagement />} />
            <Route path="admin/roles" element={<RolesManagement />} />
            <Route path="admin/audit" element={<AuditLogsPage />} />
            <Route path="admin/health" element={<PlatformHealthPage />} />

            {/* 未匹配路由跳转回当前角色专属落地页 */}
            <Route path="*" element={<RoleBasedRedirect />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
