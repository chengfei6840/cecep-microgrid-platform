import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  RefreshCw,
  QrCode,
  User,
  Info,
} from 'lucide-react';

export const MobileTasks: React.FC = () => {
  const navigate = useNavigate();
  const { patrolTasks, site, currentRole, syncOfflineTask } = useAppStore();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'IN_PROGRESS' | 'SUBMITTED'>('PENDING');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const isReadOnly = currentRole !== 'INSPECTOR';

  // 分组统计
  const pendingList = patrolTasks.filter((t) => t.status === 'PENDING_ACCEPT' || t.status === 'PENDING_START');
  const inProgressList = patrolTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING_SUBMIT' || t.isOffline);
  const submittedList = patrolTasks.filter((t) => t.status === 'SUBMITTED' || t.status === 'ARCHIVED');

  const displayedTasks =
    activeTab === 'PENDING'
      ? pendingList
      : activeTab === 'IN_PROGRESS'
      ? inProgressList
      : submittedList;

  const handleSync = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSyncingId(taskId);
    await new Promise((r) => setTimeout(r, 1000));
    await syncOfflineTask(taskId);
    setSyncingId(null);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 顶部身份与状态提示 */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">现场巡检责任人</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">林志强 (巡检员)</div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-100">
            {site.name}
          </span>
        </div>

        {isReadOnly && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>当前为【{currentRole}】移动端只读预览身份，无法修改或提交任务。</span>
          </div>
        )}
      </div>

      {/* 分组切换 Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-slate-200 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'PENDING'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>待执行</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono">
            {pendingList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('IN_PROGRESS')}
          className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'IN_PROGRESS'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>执行中/离线</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono">
            {inProgressList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SUBMITTED')}
          className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'SUBMITTED'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>已提交</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono">
            {submittedList.length}
          </span>
        </button>
      </div>

      {/* 任务列表 */}
      <div className="space-y-3">
        {displayedTasks.map((task) => {
          const isOverdue = new Date(task.planDeadline || task.deadlineTime || Date.now()) < new Date();
          return (
            <div
              key={task.id}
              onClick={() => navigate(`/mobile/tasks/${task.id}/execute`)}
              className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 active:scale-[0.99] transition-transform cursor-pointer space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {task.taskCode}
                    </span>
                    {task.source === 'PLAN' ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                        计划规程
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">
                        临时专项
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{task.title}</h3>
                </div>
                <StatusBadge status={task.status} size="sm" />
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {task.description || `检查路线：${task.targetZone}，设备数：${task.deviceList?.length || 4}`}
              </p>

              {/* 离线暂存队列标示 */}
              {task.isOffline && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center gap-1.5">
                    <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>本地缓存待同步 (IndexedDB 队列)</span>
                  </div>
                  <button
                    onClick={(e) => handleSync(task.id, e)}
                    disabled={syncingId === task.id || isReadOnly}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded shadow-xs flex items-center gap-1"
                  >
                    {syncingId === task.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    <span>{syncingId === task.id ? '同步中...' : '同步上报'}</span>
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                    截止: {task.planDeadline || task.deadlineTime || '今日 18:00'}
                    {isOverdue && ' (已逾期)'}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{task.checkItems?.length || 4} 项检查</span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs font-semibold text-blue-700">
                <span>{task.status === 'SUBMITTED' ? '查看不可变电子档案' : '进入现场点检执行'}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}

        {displayedTasks.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400 text-xs border border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <div className="font-semibold text-slate-800">当前分类下暂无巡检任务</div>
            <p className="text-[11px] text-slate-500">所有计划点检与特巡任务均已妥善流转与归档。</p>
          </div>
        )}
      </div>
    </div>
  );
};

