import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SlaTimer } from '../../components/common/SlaTimer';
import {
  AlertOctagon,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Info,
  Check,
  AlertTriangle,
  ArrowRight,
  FileText,
  Activity,
  User,
  ExternalLink,
  Cpu,
} from 'lucide-react';

export const MobileAlarms: React.FC = () => {
  const navigate = useNavigate();
  const { alarms, currentRole, ackAlarm, patrolTasks, workOrders } = useAppStore();

  const isReadOnly = currentRole !== 'INSPECTOR';

  // 状态筛选：全部、待确认/处置中、已恢复/已办结
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'P1' | 'P2' | 'P3'>('ALL');
  const [selectedAlarmId, setSelectedAlarmId] = useState<string | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  // 映射 Web 级别到移动端通知等级 P1/P2/P3 (CRITICAL -> P1, MAJOR -> P2, MINOR/WARNING -> P3)
  const getMobilePriority = (alarm: (typeof alarms)[0]) => {
    if (alarm.severity === 'CRITICAL') {
      return { code: 'P1', label: 'P1 · 极高紧急', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    }
    if (alarm.severity === 'MAJOR') {
      return { code: 'P2', label: 'P2 · 高级告警', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    }
    return { code: 'P3', label: 'P3 · 一般预警', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
  };

  // 巡检员分配过滤：展示现场指派或分配至“林志强 (巡检员)”相关的告警，或现场需要就地核查的告警
  const assignedAlarms = alarms.filter((a) => {
    // 若有关联工单或任务给巡检员，或者属于现场设备需巡视核验
    const isAssigned =
      !a.handledBy ||
      a.handledBy.includes('林志强') ||
      a.linkedTaskId ||
      a.linkedWorkOrderId ||
      a.deviceName.includes('储能') ||
      a.deviceName.includes('PCS') ||
      a.deviceName.includes('光伏') ||
      a.deviceName.includes('充电桩');
    return isAssigned;
  });

  const filteredAlarms = assignedAlarms.filter((alarm) => {
    if (levelFilter === 'ALL') return true;
    const prio = getMobilePriority(alarm);
    return prio.code === levelFilter;
  });

  const handleAcknowledgeRead = (alarmId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAcknowledgedIds((prev) => ({ ...prev, [alarmId]: true }));
    setFeedback(`已确认知悉告警 (已读记录留痕)，现场已排查。`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const selectedAlarm = alarms.find((a) => a.id === selectedAlarmId);

  // 关联的任务或工单
  const linkedTask = selectedAlarm?.linkedTaskId
    ? patrolTasks.find((t) => t.id === selectedAlarm.linkedTaskId)
    : patrolTasks.find((t) => t.linkedAlarmId === selectedAlarm?.id);

  const linkedOrder = selectedAlarm?.linkedWorkOrderId
    ? workOrders.find((w) => w.id === selectedAlarm.linkedWorkOrderId)
    : workOrders.find((w) => w.sourceId === selectedAlarm?.id || w.linkedAlarmCode === selectedAlarm?.alarmCode);

  return (
    <div className="space-y-4 pb-12">
      {/* 顶部身份与说明 */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">巡检员现场告警终端</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">林志强 (现场负责)</div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold border border-red-200">
            {assignedAlarms.filter((a) => a.status === 'PROCESSING' || a.status === 'PENDING_ACK').length} 项待排查
          </span>
        </div>

        {/* 权限边界警示 */}
        <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>移动权限规范：</strong>巡检员可查阅诊断摘要、确认已读并跳转现场处置；
            <span className="text-rose-700 font-semibold">严禁擅自忽略、关闭告警或远程控制电气设备</span>。
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 移动优先级 P1/P2/P3 映射筛选 */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-200 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setLevelFilter('ALL')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
            levelFilter === 'ALL'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>全部</span>
          <span className="text-[10px] font-mono">({assignedAlarms.length})</span>
        </button>

        <button
          onClick={() => setLevelFilter('P1')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
            levelFilter === 'P1'
              ? 'bg-red-600 text-white shadow-xs font-bold'
              : 'text-red-700 hover:bg-red-100'
          }`}
        >
          <span>P1 紧急</span>
        </button>

        <button
          onClick={() => setLevelFilter('P2')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
            levelFilter === 'P2'
              ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
              : 'text-amber-800 hover:bg-amber-100'
          }`}
        >
          <span>P2 高级</span>
        </button>

        <button
          onClick={() => setLevelFilter('P3')}
          className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
            levelFilter === 'P3'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-blue-700 hover:bg-blue-100'
          }`}
        >
          <span>P3 一般</span>
        </button>
      </div>

      {/* 告警列表 */}
      <div className="space-y-3">
        {filteredAlarms.map((alarm) => {
          const prio = getMobilePriority(alarm);
          const isRead = Boolean(acknowledgedIds[alarm.id]);
          const isOverdue = alarm.isOverdue || (alarm.slaDeadlineTime && new Date(alarm.slaDeadlineTime) < new Date());

          return (
            <div
              key={alarm.id}
              onClick={() => setSelectedAlarmId(alarm.id)}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2.5 active:scale-[0.99] transition-transform cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${prio.bg} ${prio.text} ${prio.border}`}>
                      {prio.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1 rounded">
                      {alarm.alarmCode}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 leading-snug">
                    {alarm.alarmTitle}
                  </h3>
                </div>
                <StatusBadge status={alarm.status} size="sm" />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {alarm.description || alarm.reason || '遥测参数异常波动，超出微电网额定安全阈值。'}
              </p>

              {/* 规则证据/诊断摘要提示 (区分 AI 建议与业务事实) */}
              {alarm.agentSuggestion && (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 space-y-1">
                  <div className="flex items-center gap-1 text-[#004287] font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>系统诊断摘要 (仅供现场参考，不作为最终定论)</span>
                  </div>
                  <div className="line-clamp-2 text-slate-600">
                    {alarm.agentSuggestion}
                  </div>
                </div>
              )}

              {/* 设备与时限 */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span className="truncate max-w-[170px] text-slate-700 font-medium">
                  {alarm.deviceName}
                </span>
                <SlaTimer
                  deadlineStr={alarm.slaDeadlineTime}
                  severity={alarm.severity}
                />
              </div>

              {/* 快捷操作栏：确认已读、查看处置详情 */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => handleAcknowledgeRead(alarm.id, e)}
                  disabled={isRead}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 border transition-colors ${
                    isRead
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>{isRead ? '已确认收到' : '确认已读'}</span>
                </button>

                <div className="text-xs font-semibold text-[#004287] flex items-center gap-1">
                  <span>查看诊断与联动</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}

        {filteredAlarms.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400 text-xs border border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <div className="font-semibold text-slate-800">当前筛选下无未处置告警</div>
            <p className="text-[11px] text-slate-500">示范站各子系统运行平稳，无分配至您的未闭环告警。</p>
          </div>
        )}
      </div>

      {/* 告警详情浮层 (微信小程序 Bottom Sheet 模式) */}
      {selectedAlarm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end p-0">
          <div className="bg-white rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden animate-slideUp">
            {/* 顶栏 */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getMobilePriority(selectedAlarm).bg} ${getMobilePriority(selectedAlarm).text} ${getMobilePriority(selectedAlarm).border}`}>
                  {getMobilePriority(selectedAlarm).label}
                </span>
                <span className="text-xs font-mono text-slate-500 font-semibold">
                  {selectedAlarm.alarmCode}
                </span>
              </div>
              <button
                onClick={() => setSelectedAlarmId(null)}
                className="text-xs text-slate-500 font-bold px-2 py-1 rounded bg-slate-200 hover:bg-slate-300"
              >
                关闭
              </button>
            </div>

            {/* 内容区 */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-snug">
                  {selectedAlarm.alarmTitle}
                </h2>
                <div className="mt-1 text-slate-500 flex items-center gap-2 font-mono text-[11px]">
                  <span>设备: {selectedAlarm.deviceName}</span>
                  <span>·</span>
                  <span>触发时间: {selectedAlarm.firstOccurrenceTime}</span>
                </div>
              </div>

              {/* 告警描述 */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-semibold text-slate-800 text-[11px]">告警触发根因与现场异常现象</div>
                <p className="text-slate-600 leading-relaxed">
                  {selectedAlarm.description || selectedAlarm.reason}
                </p>
              </div>

              {/* 规则证据与诊断依据 */}
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px]">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  <span>规则证据与系统研判依据</span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div>· 触发规则：微电网实时遥测阈值监测规程 (GB/T 36278)</div>
                  <div>· 判定依据：遥测采样连续 3 个周期波动超出额定波动区间 (±5%)</div>
                  {selectedAlarm.agentSuggestion && (
                    <div className="mt-1 pt-1 border-t border-blue-100 text-blue-800">
                      <strong>处置建议参考：</strong>{selectedAlarm.agentSuggestion}
                    </div>
                  )}
                </div>
              </div>

              {/* 关联任务或工单直达 */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="font-bold text-slate-800 text-xs">现场处置联动入口</div>

                {linkedTask ? (
                  <div
                    onClick={() => {
                      setSelectedAlarmId(null);
                      navigate(`/mobile/tasks/${linkedTask.id}/execute`);
                    }}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-blue-100"
                  >
                    <div>
                      <div className="text-[11px] text-blue-700 font-semibold">已关联现场巡检任务</div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">{linkedTask.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{linkedTask.taskCode}</div>
                    </div>
                    <div className="flex items-center gap-1 text-blue-700 text-xs font-bold shrink-0">
                      <span>进入点检</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                ) : linkedOrder ? (
                  <div
                    onClick={() => {
                      setSelectedAlarmId(null);
                      navigate(`/mobile/work-orders`);
                    }}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-amber-100"
                  >
                    <div>
                      <div className="text-[11px] text-amber-800 font-semibold">已关联消缺整改工单</div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">{linkedOrder.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{linkedOrder.orderCode}</div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-800 text-xs font-bold shrink-0">
                      <span>查看工单</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-[11px] leading-relaxed">
                    当前告警尚未生成工单或任务。可前往【我的巡检】核查例行任务，或由运营人员在 Web 后台统一派发消缺工单。
                  </div>
                )}
              </div>

              {/* 权限限制提示 */}
              <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-500 space-y-1">
                <div className="font-semibold text-slate-700">安全合规审计说明：</div>
                <div>· 移动巡检端不支持远程分合闸、就地复位或强制忽略告警。</div>
                <div>· 现场排查完毕后，请在关联工单中提交现场整改佐证并由运营人员复核验收。</div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <button
                type="button"
                onClick={() => setSelectedAlarmId(null)}
                className="w-full py-2.5 bg-[#004287] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#003366]"
              >
                已核对现场告警事实，返回列表
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

