import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ShieldCheck,
  AlertTriangle,
  ClipboardCheck,
  Wrench,
  Zap,
  BatteryCharging,
  Sun,
  Activity,
  ChevronRight,
  Wifi,
  WifiOff,
  RefreshCw,
  User,
  Sparkles,
  CheckCircle2,
  AlertOctagon,
  Clock,
  MapPin,
  Info,
} from 'lucide-react';

export const MobileHome: React.FC = () => {
  const navigate = useNavigate();
  const {
    site,
    patrolTasks,
    alarms,
    workOrders,
    currentRole,
    currentUser,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isReadOnlyPreview = currentRole !== 'INSPECTOR';

  // 统计数据
  const safeOperationDays = 1280;
  const unresolvedAlarms = alarms.filter(
    (a) => a.status === 'PROCESSING' || a.status === 'PENDING_ACK'
  );
  const pendingTasks = patrolTasks.filter((t) => t.status !== 'SUBMITTED');
  const activeWorkOrders = workOrders.filter((w) => w.status !== 'CLOSED');

  const handleRefresh = () => {
    setIsLoading(true);
    setHasLoadError(false);
    setTimeout(() => {
      setIsLoading(false);
      setRefreshKey((prev) => prev + 1);
    }, 800);
  };

  const simulateLoadError = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setHasLoadError(true);
    }, 600);
  };

  return (
    <div className="space-y-4 pb-10">
      {/* 微信小程序形态原型标识标签 */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-blue-500/30 text-cyan-300 font-mono text-[10px] border border-cyan-400/30 font-bold">
              微信小程序形态原型
            </span>
            <span className="text-[11px] text-slate-300 font-medium">
              {site.name}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
            title="刷新数据"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-[11px] text-slate-300">园区安全稳定运行</div>
            <div className="text-xl font-bold font-mono text-cyan-200 flex items-center gap-1.5 mt-0.5">
              <span>{safeOperationDays}</span>
              <span className="text-xs text-slate-300 font-normal">天无事故</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-300">当前登录身份</div>
            <div className="text-xs font-bold text-amber-300 mt-0.5">
              {currentRole === 'INSPECTOR' ? '巡检员 (林志强)' : `${currentRole} (只读预览)`}
            </div>
          </div>
        </div>
      </div>

      {/* 权限提示：非巡检员只读预览模式 */}
      {isReadOnlyPreview && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>只读预览提示：</strong>当前身份为【{currentRole}】，可查阅现场巡检、告警与工单数据，实际现场打卡与移动点检闭环仅限巡检员操作。
          </span>
        </div>
      )}

      {/* 加载失败状态展示 */}
      {hasLoadError ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-sm font-bold text-slate-900">数据加载失败 (网络超时)</div>
          <p className="text-xs text-slate-500">无法从边缘网关同步最新微电网遥测与巡检任务队列。</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-[#004287] text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-blue-800 transition-colors"
          >
            点击重试同步
          </button>
        </div>
      ) : isLoading ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-2">
          <RefreshCw className="w-6 h-6 text-[#004287] animate-spin mx-auto" />
          <div className="text-xs text-slate-500 font-mono">正在拉取示范站实时遥测与任务队列...</div>
        </div>
      ) : (
        <>
          {/* 核心指标统计卡片 (安全运行天数、未处理告警数、今日待执行巡检数) */}
          <div className="grid grid-cols-3 gap-2.5">
            <div
              onClick={() => navigate('/mobile/alarms')}
              className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-all text-center space-y-1"
            >
              <div className="text-[11px] text-slate-500">未处理告警</div>
              <div className="text-lg font-bold font-mono text-rose-600">
                {unresolvedAlarms.length}
              </div>
              <div className="text-[10px] text-slate-400">点击查看详情</div>
            </div>

            <div
              onClick={() => navigate('/mobile/tasks')}
              className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-all text-center space-y-1"
            >
              <div className="text-[11px] text-slate-500">今日待巡检</div>
              <div className="text-lg font-bold font-mono text-blue-700">
                {pendingTasks.length}
              </div>
              <div className="text-[10px] text-slate-400">
                已完 {patrolTasks.filter((t) => t.status === 'SUBMITTED').length} 项
              </div>
            </div>

            <div
              onClick={() => navigate('/mobile/work-orders')}
              className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-all text-center space-y-1"
            >
              <div className="text-[11px] text-slate-500">待整改工单</div>
              <div className="text-lg font-bold font-mono text-amber-600">
                {activeWorkOrders.length}
              </div>
              <div className="text-[10px] text-slate-400">闭环跟进中</div>
            </div>
          </div>

          {/* 光伏、储能、充电桩实时状态卡片 */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 pb-2 border-b border-slate-100">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-700" />
                <span>园区微电网核心三端状态</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                实时运行正常
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-center text-amber-500">
                  <Sun className="w-4 h-4" />
                </div>
                <div className="text-[11px] text-slate-500">光伏发电</div>
                <div className="text-sm font-bold font-mono text-slate-900">3.45 MW</div>
                <div className="text-[10px] text-emerald-600 font-medium">满发运行</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-center text-indigo-600">
                  <BatteryCharging className="w-4 h-4" />
                </div>
                <div className="text-[11px] text-slate-500">储能 BESS</div>
                <div className="text-sm font-bold font-mono text-slate-900">78% SOC</div>
                <div className="text-[10px] text-indigo-700 font-medium">智能削峰中</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-center text-teal-600">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-[11px] text-slate-500">充电桩群</div>
                <div className="text-sm font-bold font-mono text-slate-900">18 / 20</div>
                <div className="text-[10px] text-teal-700 font-medium">在线运营</div>
              </div>
            </div>
          </div>

          {/* 当日光伏与负荷实测趋势简图 */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span>当日光伏发电与厂区负荷实测曲线</span>
              <span className="text-[10px] text-slate-400 font-mono">2026-09-06</span>
            </div>

            <div className="h-28 bg-slate-900 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden text-[10px] text-slate-400">
              <div className="flex justify-between items-center z-10">
                <span className="text-amber-400 font-mono font-bold">● 光伏出力峰值 3.6MW</span>
                <span className="text-teal-400 font-mono font-bold">■ 峰谷平平衡</span>
              </div>

              <div>
                <svg className="w-full h-12 overflow-visible" viewBox="0 0 300 50">
                  {/* 光伏曲线 */}
                  <path
                    d="M 0 45 Q 75 5 150 10 Q 225 15 300 48"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2.5"
                  />
                  {/* 负荷曲线 */}
                  <path
                    d="M 0 30 Q 75 35 150 20 Q 225 25 300 32"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                </svg>
              </div>

              <div className="flex justify-between text-[9px] text-slate-400 font-mono z-10">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>24:00</span>
              </div>
            </div>
          </div>

          {/* 最近待办任务与告警卡片 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1">
              <span>最近现场待办与紧急任务</span>
              <button
                onClick={() => navigate('/mobile/tasks')}
                className="text-blue-600 font-medium flex items-center gap-0.5 hover:underline"
              >
                <span>全部任务</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingTasks.slice(0, 2).map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/mobile/tasks/${task.id}/execute`)}
                className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs cursor-pointer active:scale-98 transition-transform space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{task.title}</span>
                  <StatusBadge status={task.status} size="sm" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{task.targetZone || '示范站 10kV 配电房'}</span>
                  </span>
                  <span className="font-mono">{task.checkItems?.length || 4}项点检</span>
                </div>
              </div>
            ))}

            {pendingTasks.length === 0 && (
              <div className="bg-white rounded-xl p-6 text-center text-slate-400 text-xs border border-slate-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                <span>今日所有巡检与隐患排查已圆满完成！</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* 测试状态按钮群 (用于验收状态控制) */}
      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 px-1 border-t border-slate-200">
        <span>原型状态测试:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={simulateLoadError}
            className="text-rose-600 hover:underline font-medium"
          >
            模拟加载失败
          </button>
          <span>|</span>
          <button
            onClick={handleRefresh}
            className="text-blue-600 hover:underline font-medium"
          >
            恢复正常状态
          </button>
        </div>
      </div>
    </div>
  );
};
