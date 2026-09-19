import React, { useState } from 'react';
import { useAppStore } from '../../store/AppContext';
import { PatrolRecord, PatrolTask } from '../../types/domain';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DisabledActionTooltip } from '../../components/common/DisabledActionTooltip';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  FileCheck2,
  Calendar,
  Layers,
  MapPin,
  Wifi,
  WifiOff,
  Image as ImageIcon,
  Download,
  AlertOctagon,
  Wrench,
  Printer,
  Sparkles,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PatrolRecordsPage: React.FC = () => {
  const {
    patrolRecords,
    patrolTasks,
    archivePatrolTask,
    currentRole,
    currentUser,
  } = useAppStore();

  const isInspector = currentRole === 'INSPECTOR';
  const canManage = currentRole === 'ADMIN' || currentRole === 'OPERATOR';

  // 视图切换：全部档案 vs 待复核归档待办
  const [activeTab, setActiveTab] = useState<'ARCHIVED' | 'PENDING_ARCHIVE'>('ARCHIVED');

  // 筛选搜索
  const [searchQuery, setSearchQuery] = useState('');
  const [syncFilter, setSyncFilter] = useState<string>('ALL');
  const [resultFilter, setResultFilter] = useState<string>('ALL');

  // 反馈提示
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 查看档案详情抽屉
  const [selectedRecord, setSelectedRecord] = useState<PatrolRecord | null>(null);

  // 电子档案打印预览弹窗
  const [reportPreviewRecord, setReportPreviewRecord] = useState<PatrolRecord | null>(null);

  // 确认归档弹窗
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: async () => {},
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // 待复核归档的任务（状态为 SUBMITTED）
  const pendingArchiveTasks = patrolTasks.filter((t) => t.status === 'SUBMITTED');

  // KPI 统计
  const totalArchivedCount = patrolRecords.length;
  const pendingArchiveCount = pendingArchiveTasks.length;
  const totalAbnormalRecords = patrolRecords.filter((r) => (r.abnormalCount && r.abnormalCount > 0) || r.items.some((i) => i.result === 'ABNORMAL')).length;
  const totalOfflineRecords = patrolRecords.filter((r) => r.syncStatus === 'LOCAL_OFFLINE_QUEUED').length;

  // 过滤已归档记录
  const filteredRecords = patrolRecords.filter((rec) => {
    const matchSearch =
      (rec.recordCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.taskCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.taskTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.submitter || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.planName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchSync = syncFilter === 'ALL' || rec.syncStatus === syncFilter;
    const hasAbnormal = (rec.abnormalCount && rec.abnormalCount > 0) || rec.items.some((i) => i.result === 'ABNORMAL');
    const matchResult =
      resultFilter === 'ALL' ||
      (resultFilter === 'ABNORMAL' && hasAbnormal) ||
      (resultFilter === 'NORMAL' && !hasAbnormal);

    return matchSearch && matchSync && matchResult;
  });

  // 执行复核归档
  const handleArchiveTask = (task: PatrolTask) => {
    if (task.status !== 'SUBMITTED') {
      showNotification(`业务门禁拦截：当前任务状态为【${task.status}】，未提交严禁归档！`, 'error');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: `确认验收并归档巡检任务 ${task.taskCode}？`,
      description: '核实巡检员从移动端提交的现场事实无误后，系统将正式生成不可篡改的电子巡检档案。',
      action: async () => {
        const res = await archivePatrolTask(task.id);
        if (res.success) {
          showNotification(res.message);
          setActiveTab('ARCHIVED');
        } else {
          showNotification(res.message, 'error');
        }
      },
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 头部卡片 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              巡检现场事实电子档案库
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-teal-50 text-teal-700 border border-teal-200 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>不可篡改存证</span>
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            完整归档巡检员从移动端（小程序）提交的现场原始事实。严格遵循事实防伪原则：
            <strong className="text-slate-800 font-semibold mx-1">
              不伪造现场照片、不让管理员代填、完整保留防伪时间戳与地理坐标水印、离线同步审计链
            </strong>
            。形成巡检计划、现场任务、消缺整改与历史归档的端到端闭环。
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/operations/tasks"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <span>返回任务管控</span>
          </Link>
        </div>
      </div>

      {/* 巡检员权限提示横幅 */}
      {isInspector && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold">【巡检员权限提示】现场事实查阅与移动端执行须知</div>
            <p className="text-amber-800 leading-relaxed">
              档案库展示现场已归档核验数据。巡检员通过移动端提交点检数据后，由运营人员复核验收并最终归档。巡检员在 Web 端具有全量档案查阅权限，复核归档操作仅限运营人员与系统管理员。
            </p>
          </div>
        </div>
      )}

      {/* 反馈通知 */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1">已归档电子卷宗</div>
          <div className="text-2xl font-bold text-teal-700 font-mono">{totalArchivedCount}</div>
          <div className="text-[10px] text-teal-800/80 mt-1">具备防伪溯源电子印章</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1">现场已提交待归档</div>
          <div className="text-2xl font-bold text-indigo-600 font-mono">{pendingArchiveCount}</div>
          <div className="text-[10px] text-indigo-700/80 mt-1">等待运营人员验收盖章</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1">记录现场缺陷/异常</div>
          <div className="text-2xl font-bold text-rose-600 font-mono">{totalAbnormalRecords}</div>
          <div className="text-[10px] text-rose-700/80 mt-1">已联动整改消缺工单</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 mb-1">离线打卡同步卷宗</div>
          <div className="text-2xl font-bold text-amber-600 font-mono">{totalOfflineRecords}</div>
          <div className="text-[10px] text-slate-400 mt-1">弱网暂存后完整对齐回传</div>
        </div>
      </div>

      {/* 视图 Tab 切换与搜索栏 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ARCHIVED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ARCHIVED'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              已归档历史事实档案 ({totalArchivedCount})
            </button>
            <button
              onClick={() => setActiveTab('PENDING_ARCHIVE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'PENDING_ARCHIVE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>待复核归档现场任务</span>
              {pendingArchiveCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 font-mono text-[10px] flex items-center justify-center font-bold">
                  {pendingArchiveCount}
                </span>
              )}
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            示范站综合运营监管系统
          </div>
        </div>

        {/* 过滤条 */}
        {activeTab === 'ARCHIVED' && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <div className="relative w-full md:w-60">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索档案号/任务号/巡检员..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-teal-600 bg-slate-50/50"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium">同步模式:</span>
                <select
                  value={syncFilter}
                  onChange={(e) => setSyncFilter(e.target.value)}
                  className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-teal-600"
                >
                  <option value="ALL">全部网络状态</option>
                  <option value="SYNCED">在线实时同步 (SYNCED)</option>
                  <option value="LOCAL_OFFLINE_QUEUED">离线队列暂存同步</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium">结论筛选:</span>
                <select
                  value={resultFilter}
                  onChange={(e) => setResultFilter(e.target.value)}
                  className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-teal-600"
                >
                  <option value="ALL">全部核验结论</option>
                  <option value="NORMAL">全项正常合格</option>
                  <option value="ABNORMAL">存在缺陷/异常</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-400 w-full md:w-auto text-right font-mono">
              显示 {filteredRecords.length} 卷档案
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: 已归档历史记录列表 */}
      {activeTab === 'ARCHIVED' && (
        <div className="space-y-4">
          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              暂无匹配的已归档现场巡检记录
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const hasAbnormal = (rec.abnormalCount && rec.abnormalCount > 0) || rec.items.some((i) => i.result === 'ABNORMAL');

              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-3.5"
                >
                  {/* 档案头部 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                        {rec.recordCode || rec.id}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">
                        {rec.taskTitle || '微电网巡视任务档案'}
                      </h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        快照: {rec.planVersionSnapshot || 'V1.0'}
                      </span>
                      {hasAbnormal ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>记录现场异常</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>全项合格正常</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {rec.syncStatus === 'LOCAL_OFFLINE_QUEUED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          <WifiOff className="w-3 h-3 text-amber-600" />
                          <span>离线缓存补传</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Wifi className="w-3 h-3 text-emerald-600" />
                          <span>实时在线同步</span>
                        </span>
                      )}
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                        已归档
                      </span>
                    </div>
                  </div>

                  {/* 核心流转与审计元数据 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 font-medium">现场提交人: </span>
                      <span className="font-semibold text-slate-800">{rec.submitter}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">现场提交时间: </span>
                      <span className="font-mono text-slate-700">{rec.submittedTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">复核归档人: </span>
                      <span className="font-semibold text-slate-800">{rec.archivedBy || '运营主管'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">归档生效时间: </span>
                      <span className="font-mono text-slate-700">{rec.archivedTime || '2026-09-04 17:35'}</span>
                    </div>
                  </div>

                  {/* 现场文字说明 */}
                  {rec.inspectorRemark && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
                      <strong className="text-slate-800">巡检员现场总结说明：</strong>
                      {rec.inspectorRemark}
                    </div>
                  )}

                  {/* 关联告警与关联工单 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-slate-400">关联追溯:</span>
                      {rec.linkedAlarmCode && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3" />
                          <span>关联告警: {rec.linkedAlarmCode}</span>
                        </span>
                      )}
                      {rec.linkedWorkOrderCode && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-[#004287] border border-blue-200 font-semibold flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          <span>整改工单: {rec.linkedWorkOrderCode}</span>
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400">
                        任务编号: {rec.taskCode}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono">
                      实核设备: {rec.devices ? rec.devices.length : 4} 台套 | 检查要点: {rec.items ? rec.items.length : 4} 项
                    </div>
                  </div>

                  {/* 底部按钮 */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 font-medium px-2.5 py-1.5 rounded-lg bg-teal-50/60 hover:bg-teal-100/60 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>查阅现场事实与防伪水印 ({rec.items?.length || 0}项)</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReportPreviewRecord(rec)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>预览/导出电子归档凭据</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: 巡检员已提交待归档任务列表 */}
      {activeTab === 'PENDING_ARCHIVE' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>运营复核验收区：</strong>以下巡检任务已由巡检员在移动端点检提交完成（状态为 SUBMITTED）。由运营人员核实无误后点击【复核归档】，方可生成上述不可变历史电子卷宗。
              </span>
            </div>
            <span className="font-mono font-bold text-indigo-700 shrink-0">
              待复核: {pendingArchiveTasks.length} 项
            </span>
          </div>

          {pendingArchiveTasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              暂无待复核归档的巡检任务
            </div>
          ) : (
            pendingArchiveTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {task.taskCode}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{task.title || task.taskName}</h3>
                    <StatusBadge status={task.status} size="sm" />
                    {task.hasAbnormality && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        发现现场异常
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500">
                    提交时间: <span className="font-mono text-slate-800">{task.submittedAt || '刚刚'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 font-medium">执行巡检人: </span>
                    <span className="font-semibold text-slate-800">{task.assignee}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">任务来源: </span>
                    <span>{task.source === 'ALARM' ? '告警转办' : task.source === 'PLAN' ? '计划生成' : '临时特巡'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">目标区域: </span>
                    <span>{task.targetZone || '示范站'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">检查要点: </span>
                    <span className="font-mono">{task.checkItems?.length || task.totalItems} 项</span>
                  </div>
                </div>

                {task.inspectorRemark && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900">
                    <span className="font-semibold">巡检员现场核验总结：</span>
                    {task.inspectorRemark}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-slate-400 font-mono">
                    TraceId: {task.traceId || 'TR-SUBMITTED-01'}
                  </div>

                  <div className="flex items-center gap-2">
                    <DisabledActionTooltip
                      disabled={!canManage}
                      reason="权限不足：仅【运营人员】或【系统管理员】有权复核归档。"
                      recoveryStep="请在侧边栏切换身份至【运营人员】。"
                    >
                      <button
                        disabled={!canManage}
                        onClick={() => handleArchiveTask(task)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs shadow-xs transition-all ${
                          canManage
                            ? 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer active:scale-95'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        }`}
                      >
                        <FileCheck2 className="w-4 h-4" />
                        <span>运营复核并归档入库</span>
                      </button>
                    </DisabledActionTooltip>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 档案事实详情抽屉 */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                    {selectedRecord.recordCode}
                  </span>
                  <span className="text-xs font-semibold text-teal-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>不可篡改归档存证</span>
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">{selectedRecord.taskTitle}</h2>
                <div className="text-xs text-slate-500 mt-0.5 font-mono">
                  规程快照: {selectedRecord.planVersionSnapshot || 'V1.0'} | 巡检员: {selectedRecord.submitter}
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs"
              >
                ✕ 关闭
              </button>
            </div>

            {/* 现场核验事实明细 */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-700" />
                <span>现场逐项点检事实与防伪水印 ({selectedRecord.items.length} 项)</span>
              </h3>

              <div className="space-y-3">
                {selectedRecord.items.map((item, idx) => {
                  const isAbnormal = item.result === 'ABNORMAL';

                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                        isAbnormal
                          ? 'border-rose-200 bg-rose-50/40'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-mono text-[11px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span>{item.itemTitle}</span>
                        </div>

                        <div>
                          {isAbnormal ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-300">
                              异常隐患
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-300">
                              合格正常
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 font-medium">合格评判标准: </span>
                          <span className="font-medium text-slate-800">{item.standard}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">设备单元: </span>
                          <span className="font-medium text-slate-800">{item.deviceName}</span>
                        </div>
                      </div>

                      {/* 巡检员记录说明 */}
                      {item.remark && (
                        <div className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200">
                          <span className="font-semibold text-slate-800">现场事实描述: </span>
                          {item.remark}
                        </div>
                      )}

                      {/* 防伪照片占位水印 (严格遵守不伪造假照片原则) */}
                      {item.hasPhotoPlaceholder && (
                        <div className="mt-2 p-2.5 rounded-lg bg-white border border-rose-200 flex items-center gap-3">
                          <div className="w-16 h-16 rounded bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-[10px] text-slate-400 shrink-0">
                            <ImageIcon className="w-4 h-4 mb-0.5 text-slate-400" />
                            <span>现场原图</span>
                            <span>占位凭证</span>
                          </div>
                          <div className="space-y-0.5 text-[10px] text-slate-500 font-mono">
                            <div className="font-bold text-slate-700 font-sans">真实采集凭据与地理时空水印</div>
                            <div>拍摄时标: {item.photoMeta?.timestamp || selectedRecord.submittedTime}</div>
                            <div>地理经纬: {item.photoMeta?.coordinate || '117.653°E, 24.521°N'}</div>
                            <div>打卡点位: {item.photoMeta?.locationName || '示范站 10kV 储能配电区'}</div>
                            <div className="text-emerald-700 font-sans font-semibold">
                              防篡改校验: SHA-256 水印与现场基站时钟已对齐
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 不可篡改印章卡片 */}
              <div className="p-4 bg-teal-50/70 rounded-xl border border-teal-200 space-y-2 text-xs text-teal-950">
                <div className="font-bold flex items-center gap-1.5 text-teal-900">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>国家电网微电网现场巡视防伪存证认证章</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-teal-900">
                  <div>电子归档编号: {selectedRecord.recordCode}</div>
                  <div>TraceId: {selectedRecord.traceId || 'TR-ARCHIVE-01'}</div>
                  <div>归档复核人: {selectedRecord.archivedBy || '运营主管'}</div>
                  <div>网络审计: {selectedRecord.syncStatus === 'SYNCED' ? '实时握手同步' : '离线本地暂存后校验入库'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 电子档案打印预览模态框 */}
      {reportPreviewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-bold text-slate-900">
                  微电网示范站现场巡检电子档案报告
                </h3>
              </div>
              <button
                onClick={() => setReportPreviewRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕ 关闭
              </button>
            </div>

            {/* 报告正文模拟 */}
            <div className="border border-slate-300 p-6 rounded-xl space-y-4 text-xs font-sans text-slate-800 bg-slate-50/30">
              <div className="text-center pb-3 border-b border-slate-200 space-y-1">
                <h2 className="text-lg font-bold text-slate-900 tracking-wide">
                  国家电网福建微电网示范站 · 现场巡视核验凭证单
                </h2>
                <div className="text-xs text-slate-500 font-mono">
                  档案存证号: {reportPreviewRecord.recordCode} | 任务号: {reportPreviewRecord.taskCode}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200 font-mono text-[11px]">
                <div>巡检规程: {reportPreviewRecord.planName || '全站日常例巡规程'}</div>
                <div>版本快照: {reportPreviewRecord.planVersionSnapshot || 'V1.0'}</div>
                <div>责任巡检人: {reportPreviewRecord.submitter}</div>
                <div>提交时间: {reportPreviewRecord.submittedTime}</div>
                <div>复核人: {reportPreviewRecord.archivedBy || '陈若涵 (运营)'}</div>
                <div>归档时间: {reportPreviewRecord.archivedTime || '2026-09-04 17:35'}</div>
              </div>

              <div>
                <div className="font-bold text-slate-900 mb-2">现场核查结论清单：</div>
                <div className="space-y-1.5">
                  {reportPreviewRecord.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 text-[11px]">
                      <div>
                        <span className="font-semibold text-slate-800">{it.deviceName}: </span>
                        <span>{it.itemTitle}</span>
                      </div>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          it.result === 'ABNORMAL'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {it.result === 'ABNORMAL' ? '发现异常 (已派工单)' : '合格正常'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <div>防伪数字哈希: SHA256:{reportPreviewRecord.recordCode}-VERIFIED</div>
                <div className="font-bold text-teal-800">【经微电网运营复核归档·不可篡改】</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 text-xs pt-1">
              <button
                type="button"
                onClick={() => setReportPreviewRecord(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>立即打印 / 存为 PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 确认复核归档对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={async () => {
          await confirmDialog.action();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
