import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/AppContext';
import {
  User,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Smartphone,
  LogOut,
  MapPin,
  Clock,
  ClipboardCheck,
  AlertTriangle,
  Wrench,
  Wifi,
  WifiOff,
  Bell,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  History,
  RotateCcw,
} from 'lucide-react';

export const MobileProfile: React.FC = () => {
  const navigate = useNavigate();
  const {
    site,
    scenario,
    switchScenario,
    resetDemoData,
    currentUser,
    currentRole,
    switchRole,
    patrolTasks,
    workOrders,
    alarms,
    syncOfflineTask,
  } = useAppStore();

  const [syncingTaskId, setSyncingTaskId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'OFFLINE_QUEUE' | 'NOTIFICATIONS'>('OVERVIEW');

  // 离线待同步记录 (筛选 isOffline 或待同步标记)
  const offlineTasks = patrolTasks.filter((t) => t.isOffline);
  const pendingTasks = patrolTasks.filter((t) => t.status !== 'SUBMITTED');
  const activeWorkOrders = workOrders.filter((w) => w.status !== 'CLOSED');
  const activeAlarms = alarms.filter((a) => a.status === 'PROCESSING' || a.status === 'PENDING_ACK');

  // 消息通知模拟数据 (现场指派与审核反馈)
  const notifications = [
    {
      id: 'N-01',
      title: '运营复核退回提醒',
      content: '工单 WO-20260908-412 已被运营人员退回，要求补充红外测温复测记录并重新提交。',
      time: '10 分钟前',
      type: 'REJECTION',
      unread: true,
    },
    {
      id: 'N-02',
      title: '新派发消缺工单',
      content: '时代星云 500kW PCS 逆变侧接线端子接触电阻异常，已指派给您，请及时接收。',
      time: '45 分钟前',
      type: 'DISPATCH',
      unread: true,
    },
    {
      id: 'N-03',
      title: '日常巡检任务排程已下发',
      content: '示范站当日光储充联合巡检任务已进入【待执行】队列，建议上午 11:00 前完成。',
      time: '今日 08:30',
      type: 'TASK',
      unread: false,
    },
  ];

  // 触发离线同步
  const handleRetrySync = async (taskId: string) => {
    setSyncingTaskId(taskId);
    await new Promise((r) => setTimeout(r, 1200));
    const res = await syncOfflineTask(taskId);
    setSyncingTaskId(null);

    if (res.success) {
      setFeedback({ type: 'success', message: '离线记录已成功同步上云，并生成全局审计日志！' });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 个人身份卡片 */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-3">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-full bg-[#004287] text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-xs">
            林
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 truncate">林志强</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                巡检工程师
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">工号: CECEP-OP-0428</div>
            <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span>低碳园区微电网示范站 (现场驻点)</span>
            </div>
          </div>
        </div>

        {/* 角色切换快捷条 (方便切换不同视角) */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">当前体验身份:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => switchRole('INSPECTOR')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                currentRole === 'INSPECTOR'
                  ? 'bg-[#004287] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              巡检员 (可写)
            </button>
            <button
              onClick={() => switchRole('OPERATOR')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                currentRole === 'OPERATOR'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              运营人员 (只读)
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 text-xs rounded-xl flex items-center gap-2 shadow-xs animate-fadeIn border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 快捷二级 Tab 选项卡 */}
      <div className="grid grid-cols-3 gap-1 bg-slate-200 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('OVERVIEW')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeSubTab === 'OVERVIEW'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>今日概览</span>
        </button>

        <button
          onClick={() => setActiveSubTab('OFFLINE_QUEUE')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 relative ${
            activeSubTab === 'OFFLINE_QUEUE'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>离线暂存</span>
          {offlineTasks.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('NOTIFICATIONS')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 relative ${
            activeSubTab === 'NOTIFICATIONS'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>消息通知</span>
          <span className="text-[10px] bg-red-500 text-white rounded-full px-1 py-0.2 font-mono">
            2
          </span>
        </button>
      </div>

      {/* 视图 1：今日概览 */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-3">
          {/* 今日待办指标 */}
          <div className="grid grid-cols-3 gap-2">
            <div
              onClick={() => navigate('/mobile/tasks')}
              className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs text-center cursor-pointer hover:border-blue-300 transition-colors"
            >
              <div className="text-[11px] text-slate-500">待执行巡检</div>
              <div className="text-lg font-bold text-blue-700 mt-0.5 font-mono">
                {pendingTasks.length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">点击前往</div>
            </div>

            <div
              onClick={() => navigate('/mobile/work-orders')}
              className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs text-center cursor-pointer hover:border-amber-300 transition-colors"
            >
              <div className="text-[11px] text-slate-500">现场工单</div>
              <div className="text-lg font-bold text-amber-600 mt-0.5 font-mono">
                {activeWorkOrders.length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">待消缺处置</div>
            </div>

            <div
              onClick={() => navigate('/mobile/alarms')}
              className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs text-center cursor-pointer hover:border-red-300 transition-colors"
            >
              <div className="text-[11px] text-slate-500">待排查告警</div>
              <div className="text-lg font-bold text-red-600 mt-0.5 font-mono">
                {activeAlarms.length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">现场核对</div>
            </div>
          </div>

          {/* 试点站点详情 */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2 text-xs">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>当前归属微电网站点</span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono font-medium">
                电网并网在线
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5 font-mono text-[11px]">
              <div className="text-slate-800 font-bold">{site.name}</div>
              <div className="text-slate-500">编码: {site.code}</div>
              <div className="text-slate-500">容量规模: 光伏 1.2MWp · 储能 2MWh · 充电桩 16 桩</div>
              <div className="text-slate-400 truncate">位置: {site.address}</div>
            </div>
          </div>

          {/* 运行控制与场景切换 */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3 text-xs">
            <div className="font-bold text-slate-800">运行环境与配置</div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <div className="font-semibold text-slate-700">演练场景切换</div>
                <div className="text-[10px] text-slate-400">切换正常状态或储能异常故障态</div>
              </div>
              <button
                onClick={() => switchScenario(scenario === 'SCENARIO_A' ? 'SCENARIO_B' : 'SCENARIO_A')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  scenario === 'SCENARIO_B'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-[#004287] text-white shadow-xs'
                }`}
              >
                {scenario === 'SCENARIO_A' ? '场景 A (正常)' : '场景 B (储能故障)'}
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <div className="font-semibold text-slate-700">离线缓存持久化</div>
                <div className="text-[10px] text-slate-400">退出登录后保留，支持弱网重试</div>
              </div>
              <span className="text-emerald-700 font-mono font-semibold text-[11px]">
                Active (IndexedDB)
              </span>
            </div>

            <button
              onClick={() => navigate('/inspector')}
              className="w-full py-2 bg-blue-50 text-[#004287] rounded-lg font-semibold text-center flex items-center justify-center gap-1 hover:bg-blue-100 transition-colors"
            >
              <span>进入 Web 原型检查控制台 (审查全局数据流)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-center flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>退出登录 / 切换其他账号</span>
            </button>
          </div>
        </div>
      )}

      {/* 视图 2：离线暂存队列 */}
      {activeSubTab === 'OFFLINE_QUEUE' && (
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <WifiOff className="w-4 h-4 text-amber-600" />
              <span>现场离线暂存机制说明</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-950">
              当配电室或地下机房处于无网络状态时，所填写的巡检点检事实、测量读数与隐患记录将安全保存在本地缓存。即使退出当前登录仍会保留。恢复网络后可点击【重试同步上云】。
            </p>
          </div>

          <div className="space-y-2.5">
            {offlineTasks.length > 0 ? (
              offlineTasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[10px] font-bold">
                          待同步
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">{t.taskCode}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 mt-1">{t.title}</h4>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                    {t.inspectorRemark || '巡检员已完成就地点检并暂存本地，包含端子排温度与网关通信检查项。'}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-mono">
                      暂存时间: 今日 11:20
                    </span>
                    <button
                      type="button"
                      disabled={syncingTaskId === t.id}
                      onClick={() => handleRetrySync(t.id)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingTaskId === t.id ? 'animate-spin' : ''}`} />
                      <span>{syncingTaskId === t.id ? '正在同步...' : '立即重试同步'}</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl p-8 text-center text-slate-400 text-xs border border-slate-200 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <div className="font-semibold text-slate-800">本地离线队列已全部同步</div>
                <p className="text-[11px] text-slate-500">
                  当前无暂存中的离线数据，所有现场操作均已安全持久化至平台数据库。
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 视图 3：消息通知 */}
      {activeSubTab === 'NOTIFICATIONS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-500">巡检员现场通知箱 (共 {notifications.length} 条)</span>
            <span className="text-[11px] text-blue-600 font-semibold cursor-pointer">全部标为已读</span>
          </div>

          <div className="space-y-2.5">
            {notifications.map((msg) => (
              <div
                key={msg.id}
                className={`bg-white rounded-xl p-3.5 border shadow-xs space-y-1.5 text-xs transition-colors ${
                  msg.unread ? 'border-blue-200 bg-blue-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {msg.type === 'REJECTION' ? (
                      <span className="p-1 rounded bg-rose-100 text-rose-700">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                    ) : msg.type === 'DISPATCH' ? (
                      <span className="p-1 rounded bg-amber-100 text-amber-700">
                        <Wrench className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1 rounded bg-blue-100 text-blue-700">
                        <ClipboardCheck className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <h4 className="font-bold text-slate-900 text-xs">{msg.title}</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{msg.time}</span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
                  {msg.content}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                  {msg.type === 'REJECTION' || msg.type === 'DISPATCH' ? (
                    <button
                      onClick={() => navigate('/mobile/work-orders')}
                      className="text-[11px] text-[#004287] font-semibold flex items-center gap-0.5"
                    >
                      <span>前往工单处理</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/mobile/tasks')}
                      className="text-[11px] text-[#004287] font-semibold flex items-center gap-0.5"
                    >
                      <span>查看任务</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

