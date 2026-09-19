import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/AppContext';
import { AlarmKpiCards } from '../components/alarms/AlarmKpiCards';
import { AlarmFilterBar } from '../components/alarms/AlarmFilterBar';
import { AlarmTable } from '../components/alarms/AlarmTable';
import { AlarmDetailDrawer } from '../components/alarms/AlarmDetailDrawer';
import { AlarmActionModal, AlarmActionMode } from '../components/alarms/AlarmActionModal';
import { RoleBanner } from '../components/alarms/RoleBanner';
import { evaluateAlarmSla } from '../utils/alarmSla';
import { Alarm } from '../types/domain';
import {
  AlertOctagon,
  CheckCircle2,
  ExternalLink,
  Bot,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AlarmsCenter: React.FC = () => {
  const navigate = useNavigate();
  const { alarms } = useAppStore();

  // 状态与筛选器
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSla, setFilterSla] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 抽屉与处置弹窗
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    mode: AlarmActionMode;
    alarm: Alarm | null;
  }>({
    isOpen: false,
    mode: 'ACK',
    alarm: null,
  });

  // 操作成功反馈
  const [feedback, setFeedback] = useState<string | null>(null);

  // 筛选核心逻辑
  const filteredAlarms = useMemo(() => {
    return alarms.filter((alarm) => {
      // 1. 等级筛选
      if (filterSeverity !== 'ALL' && alarm.severity !== filterSeverity) {
        return false;
      }

      // 2. 来源筛选 (含第三方标识)
      if (filterSource !== 'ALL') {
        if (filterSource === 'THIRD_PARTY') {
          if (!alarm.isThirdParty) return false;
        } else if (alarm.source !== filterSource) {
          return false;
        }
      }

      // 3. 状态筛选
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'CLOSED') {
          if (alarm.status !== 'CLOSED' && alarm.status !== 'RESOLVED') return false;
        } else if (alarm.status !== filterStatus) {
          return false;
        }
      }

      // 4. SLA 状态筛选
      if (filterSla !== 'ALL') {
        const sla = evaluateAlarmSla(alarm);
        if (filterSla === 'OVERDUE') {
          if (!sla.isOverdue) return false;
        } else if (filterSla === 'EXPIRING') {
          if (!sla.isExpiringSoon) return false;
        } else if (filterSla === 'NORMAL') {
          if (sla.isOverdue || sla.isExpiringSoon) return false;
        }
      }

      // 5. 关键字搜索
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = alarm.alarmTitle.toLowerCase().includes(q);
        const matchCode = (alarm.alarmCode || alarm.id).toLowerCase().includes(q);
        const matchDevice = alarm.deviceName.toLowerCase().includes(q);
        const matchDesc = (alarm.description || '').toLowerCase().includes(q);
        const matchTrace = (alarm.traceId || '').toLowerCase().includes(q);
        const matchPoint = (alarm.pointId || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchDevice && !matchDesc && !matchTrace && !matchPoint) {
          return false;
        }
      }

      return true;
    });
  }, [alarms, filterSeverity, filterSource, filterStatus, filterSla, searchQuery]);

  // 重置筛选
  const handleResetFilters = () => {
    setFilterSeverity('ALL');
    setFilterSource('ALL');
    setFilterStatus('ALL');
    setFilterSla('ALL');
    setSearchQuery('');
  };

  // KPI 点击筛选联动
  const handleKpiFilter = (type: 'status' | 'severity' | 'sla', value: string) => {
    if (type === 'status') {
      setFilterStatus(value);
      setFilterSeverity('ALL');
      setFilterSla('ALL');
    } else if (type === 'severity') {
      setFilterSeverity(value);
      setFilterStatus('ALL');
      setFilterSla('ALL');
    } else if (type === 'sla') {
      setFilterSla(value);
      setFilterStatus('ALL');
      setFilterSeverity('ALL');
    }
  };

  // 打开处置弹窗
  const handleOpenAction = (alarm: Alarm, mode: AlarmActionMode) => {
    setActionModal({
      isOpen: true,
      mode,
      alarm,
    });
  };

  // 处置成功后刷新
  const handleActionSuccess = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 5000);
    // 如果当前选中的告警正在抽屉中展示，更新抽屉对象
    if (selectedAlarm) {
      const updated = alarms.find((a) => a.id === selectedAlarm.id);
      if (updated) {
        setSelectedAlarm(updated);
      }
    }
  };

  // 保持抽屉选中的告警与 Store 同步
  const currentSelectedAlarm = selectedAlarm
    ? alarms.find((a) => a.id === selectedAlarm.id) || selectedAlarm
    : null;

  return (
    <div id="alarms-center-page" className="space-y-5 animate-in fade-in pb-12">
      {/* 头部卡片 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-50 text-red-600 shadow-2xs">
              <AlertOctagon className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              微电网告警风控与 SLA 协同中心
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-semibold">
              SLA 引擎在线
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
            集成设备、接口、数据质量与越限阈值 4 类告警来源。
            <strong className="text-slate-800 font-semibold ml-1">
              【时效规则】：紧急告警确认限时 ≤ 15 分钟、处置限时 ≤ 30 分钟；一般告警确认 ≤ 30 分钟、处置 ≤ 2 小时。
            </strong>
            所有判定误报或人工忽略操作必须留存不可篡改审计理由。
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="btn-nav-agent-hub"
            onClick={() => navigate('/agent-hub')}
            className="px-3.5 py-2 rounded-lg bg-blue-50 text-[#004287] hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-200 shadow-2xs"
          >
            <Bot className="w-4 h-4" />
            <span>Agent 研判中心</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 操作反馈消息 */}
      {feedback && (
        <div
          id="alarm-feedback-toast"
          className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-xs animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* 角色与权限提示 */}
      <RoleBanner />

      {/* 告警 KPI 统计卡片 */}
      <AlarmKpiCards
        alarms={alarms}
        activeFilterStatus={filterStatus}
        activeFilterSeverity={filterSeverity}
        activeFilterSla={filterSla}
        onSelectFilter={handleKpiFilter}
      />

      {/* 筛选控制器 */}
      <AlarmFilterBar
        filterSeverity={filterSeverity}
        setFilterSeverity={setFilterSeverity}
        filterSource={filterSource}
        setFilterSource={setFilterSource}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterSla={filterSla}
        setFilterSla={setFilterSla}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onReset={handleResetFilters}
        totalFiltered={filteredAlarms.length}
        totalAlarms={alarms.length}
      />

      {/* 告警列表 */}
      <AlarmTable
        alarms={filteredAlarms}
        onSelectAlarm={(alm) => setSelectedAlarm(alm)}
        onOpenAction={handleOpenAction}
      />

      {/* 告警详情抽屉 */}
      <AlarmDetailDrawer
        alarm={currentSelectedAlarm}
        onClose={() => setSelectedAlarm(null)}
        onOpenAction={(mode) => {
          if (currentSelectedAlarm) {
            handleOpenAction(currentSelectedAlarm, mode);
          }
        }}
      />

      {/* 处置动作对话框 */}
      <AlarmActionModal
        isOpen={actionModal.isOpen}
        mode={actionModal.mode}
        alarm={actionModal.alarm}
        onClose={() => setActionModal((prev) => ({ ...prev, isOpen: false, alarm: null }))}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
};
