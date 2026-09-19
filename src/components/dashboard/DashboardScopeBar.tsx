import React from 'react';
import { useAppStore } from '../../store/AppContext';
import {
  Building2,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  Radio,
  SlidersHorizontal,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

export type DashboardTimeScope = 'DAY' | 'MONTH' | 'YEAR';

export type DashboardSimState =
  | 'NORMAL'
  | 'PARTIAL_MISSING'
  | 'SETTLEMENT_BLOCKED'
  | 'FLOW_INTERRUPTED'
  | 'NO_TODO'
  | 'LOAD_FAILED'
  | 'READ_ONLY'
  | 'NO_PERMISSION';

interface DashboardScopeBarProps {
  timeScope: DashboardTimeScope;
  onTimeScopeChange: (scope: DashboardTimeScope) => void;
  activeSimState: DashboardSimState;
  onSimStateChange: (state: DashboardSimState) => void;
}

export const DashboardScopeBar: React.FC<DashboardScopeBarProps> = ({
  timeScope,
  onTimeScopeChange,
  activeSimState,
  onSimStateChange,
}) => {
  const { site, sites, switchSite, scenario, switchScenario, currentRole } = useAppStore();

  return (
    <div className="space-y-3">
      {/* 站点基础信息与口径切换主栏 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 lg:p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* 左侧：站点身份与容量基线 */}
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-blue-50 text-[#004287]">
              <Building2 className="w-5 h-5" />
            </span>
            <div className="flex items-center gap-2">
              <select
                aria-label="切换监控园区站点"
                value={site.id}
                onChange={(e) => switchSite(e.target.value)}
                className="text-base lg:text-lg font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 hover:border-[#004287] focus:outline-hidden cursor-pointer py-0.5"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>多站联网监控中</span>
            </span>
            {scenario === 'SCENARIO_B' && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>场景B：储能异常闭环</span>
              </span>
            )}
            {currentRole === 'ADMIN' && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-600" />
                <span>管理员只读监管模式</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-mono mt-2">
            <span>站点编码: {(site.code || 'CECEP-001').replace(/ZZ-/g, '')}</span>
            <span className="text-slate-300">·</span>
            <span>并网电压: {site.gridVoltage || '10 kV'}</span>
            <span className="text-slate-300">·</span>
            <span>主变容量: {site.transformerCapacity || '2000 kVA'}</span>
            <span className="text-slate-300">·</span>
            <span>光伏装机: {site.pvCapacityKwp ?? '1200'} kWp</span>
            <span className="text-slate-300">·</span>
            <span>储能规格: {site.storageCapacityKwh ?? '1000'} kWh</span>
            <span className="text-slate-300">·</span>
            <span>快充群: {site.chargerCount || 12} 枪</span>
          </div>
        </div>

        {/* 右侧：口径切换条 (严格限制在本页，禁止移动到全局顶栏) */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 p-1 rounded-lg">
            <span className="text-xs text-slate-500 px-2 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>统计口径：</span>
            </span>
            <button
              type="button"
              onClick={() => onTimeScopeChange('DAY')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                timeScope === 'DAY'
                  ? 'bg-[#004287] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              今日视图 (实测)
            </button>
            <button
              type="button"
              onClick={() => onTimeScopeChange('MONTH')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                timeScope === 'MONTH'
                  ? 'bg-[#004287] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              本月累计
            </button>
            <button
              type="button"
              onClick={() => onTimeScopeChange('YEAR')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                timeScope === 'YEAR'
                  ? 'bg-[#004287] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              本年累计
            </button>
          </div>
        </div>
      </div>

      {/* 状态模拟与场景驱动微调条 (支持直接验收8大状态与场景切换) */}
      <div className="bg-slate-50/90 rounded-lg border border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-bold text-slate-700">受控状态快速验收：</span>
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'NORMAL', label: '1. 正常运行' },
              { id: 'PARTIAL_MISSING', label: '2. 部分数据缺失' },
              { id: 'SETTLEMENT_BLOCKED', label: '3. 收益不可结算' },
              { id: 'FLOW_INTERRUPTED', label: '4. 实时流中断' },
              { id: 'NO_TODO', label: '5. 无待办态' },
              { id: 'LOAD_FAILED', label: '6. 加载失败' },
              { id: 'READ_ONLY', label: '7. 管理员只读' },
              { id: 'NO_PERMISSION', label: '8. 巡检员无权限' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => onSimStateChange(st.id as DashboardSimState)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  activeSimState === st.id
                    ? 'bg-slate-800 text-white font-bold shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* 场景A/B直切 */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">业务场景：</span>
          <button
            type="button"
            onClick={() => {
              switchScenario('SCENARIO_A');
              onSimStateChange('NORMAL');
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
              scenario === 'SCENARIO_A'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            场景A (正常)
          </button>
          <button
            type="button"
            onClick={() => {
              switchScenario('SCENARIO_B');
              onSimStateChange('SETTLEMENT_BLOCKED');
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
              scenario === 'SCENARIO_B'
                ? 'bg-red-100 text-red-800 border border-red-300 font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            场景B (储能断线/风险闭环)
          </button>
        </div>
      </div>
    </div>
  );
};
