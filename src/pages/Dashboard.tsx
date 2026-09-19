import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/AppContext';
import {
  DashboardScopeBar,
  DashboardTimeScope,
  DashboardSimState,
} from '../components/dashboard/DashboardScopeBar';
import { DashboardKpiSection } from '../components/dashboard/DashboardKpiSection';
import { DashboardEnergyFlow } from '../components/dashboard/DashboardEnergyFlow';
import { DashboardOpsWarnings } from '../components/dashboard/DashboardOpsWarnings';
import { DashboardTasksAndAlarms } from '../components/dashboard/DashboardTasksAndAlarms';
import {
  Smartphone,
  ShieldAlert,
  RotateCcw,
  AlertOctagon,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentRole, switchRole, scenario } = useAppStore();

  // 页面内统计口径切换 (今日 / 本月 / 本年)，从 localStorage 读取并持久化，不污染全局顶栏
  const [timeScope, setTimeScope] = useState<DashboardTimeScope>(() => {
    const saved = localStorage.getItem('cecep_dashboard_time_scope');
    if (saved === 'DAY' || saved === 'MONTH' || saved === 'YEAR') {
      return saved;
    }
    return 'DAY';
  });

  const handleTimeScopeChange = (scope: DashboardTimeScope) => {
    setTimeScope(scope);
    localStorage.setItem('cecep_dashboard_time_scope', scope);
  };

  // 首页受控测试状态（用于覆盖并快速验收 8 大状态：正常、部分缺失、收益不可结算、实时流中断、无待办、加载失败、只读、无权限）
  const [activeSimState, setActiveSimState] = useState<DashboardSimState>(() => {
    if (currentRole === 'INSPECTOR') return 'NO_PERMISSION';
    if (currentRole === 'ADMIN') return 'READ_ONLY';
    if (scenario === 'SCENARIO_B') return 'SETTLEMENT_BLOCKED';
    return 'NORMAL';
  });

  // 当外部角色或场景变化时，同步更新默认模拟状态
  useEffect(() => {
    if (currentRole === 'INSPECTOR') {
      setActiveSimState('NO_PERMISSION');
    } else if (currentRole === 'ADMIN') {
      setActiveSimState('READ_ONLY');
    } else if (scenario === 'SCENARIO_B') {
      setActiveSimState('SETTLEMENT_BLOCKED');
    }
  }, [currentRole, scenario]);

  // 8 大状态之【无权限状态】：巡检员使用移动首页，不进入桌面首页
  if (currentRole === 'INSPECTOR' || activeSimState === 'NO_PERMISSION') {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#004287] flex items-center justify-center mx-auto border border-blue-200 shadow-xs">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              巡检员角色视图限制
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-2">巡检员请使用移动工作台</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              根据业务规划，现场巡检人员默认使用移动小程序执行设备点检、巡视工单与现场拍照打卡，不进入桌面端运营总览大盘。
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={() => navigate('/mobile-simulator')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#004287] hover:bg-[#003366] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <Smartphone className="w-4 h-4" />
              <span>进入移动巡检模拟器 (/mobile-simulator)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                switchRole('OPERATOR');
                setActiveSimState('NORMAL');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>切换为【运营人员】角色查看桌面大盘</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 8 大状态之【加载失败状态】：数据同步或网络加载失败
  if (activeSimState === 'LOAD_FAILED') {
    return (
      <div className="min-h-[460px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-6 sm:p-8 text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">示范站数据拉取失败</h2>
            <p className="text-xs text-slate-500 mt-1">
              上游 EMS 通信网关响应超时 (HTTP 504 Gateway Timeout)，实时遥测及分时电量同步受阻。
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setActiveSimState('NORMAL')}
              className="px-4 py-2 rounded-xl bg-[#004287] text-white text-xs font-bold hover:bg-blue-800 flex items-center justify-center gap-2 mx-auto shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重新拉取数据 (恢复正常)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* 1. 顶部站点信息、口径条与状态模拟条 */}
      <DashboardScopeBar
        timeScope={timeScope}
        onTimeScopeChange={handleTimeScopeChange}
        activeSimState={activeSimState}
        onSimStateChange={setActiveSimState}
      />

      {/* 8 大状态之【管理员只读监管模式提示】 */}
      {(currentRole === 'ADMIN' || activeSimState === 'READ_ONLY') && (
        <div className="bg-amber-50/90 border border-amber-300/80 rounded-xl p-3 px-4 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>系统管理员只读监控视图：</strong>
              可完整查看全站能源、拓扑、收益和告警明细，经营决策与调度主操作已按角色权限收敛隐藏。
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              switchRole('OPERATOR');
              setActiveSimState('NORMAL');
            }}
            className="px-2.5 py-1 rounded bg-amber-200/80 hover:bg-amber-200 text-amber-900 font-bold shrink-0 text-[11px]"
          >
            切换为运营人员
          </button>
        </div>
      )}

      {/* 8 大状态之【部分数据缺失状态提示】 */}
      {activeSimState === 'PARTIAL_MISSING' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>
              <strong>部分数据缺失警示：</strong>
              华控微气象仪出现网络时延，光伏 4# 支路电流突变，相关电量指标标记为【可疑 (SUSPICIOUS)】，已触发数据补采建议。
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/data/quality')}
            className="text-[#004287] font-semibold hover:underline shrink-0 text-[11px]"
          >
            查看数据质量报告 →
          </button>
        </div>
      )}

      {/* 8 大状态之【收益不可结算提示】 */}
      {(scenario === 'SCENARIO_B' || activeSimState === 'SETTLEMENT_BLOCKED') && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-red-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span>
              <strong>综合收益结算风控警示：</strong>
              储能 EMS 遥测连续丢失 35 分钟，收益核算置信度降至 71.4%（低于 95% 财务红线），日终正式对账锁定不可结算。
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/revenue')}
            className="text-red-700 font-bold hover:underline shrink-0 text-[11px]"
          >
            进入收益结算风控中心 →
          </button>
        </div>
      )}

      {/* 2. 4 大核心 KPI 卡片 (PV、储能、充电、电网、综合收益；含单位、口径、更新时间、数据质量) */}
      <DashboardKpiSection timeScope={timeScope} activeSimState={activeSimState} />

      {/* 3. 实时微电网能量流动图 (光伏、电网、储能、负荷、充电桩，同 P09 功率方向) */}
      <DashboardEnergyFlow activeSimState={activeSimState} />

      {/* 4. 重点运维预警 (储能 SOC、需量利用率、智能终端联控率、接口同步状态) */}
      <DashboardOpsWarnings activeSimState={activeSimState} />

      {/* 5. 待办与告警协同中心 (Agent 待决策、紧急告警、待执行巡检、待复核工单) */}
      <DashboardTasksAndAlarms activeSimState={activeSimState} />
    </div>
  );
};
export default Dashboard;
