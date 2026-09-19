import React from 'react';
import { Filter, Search, RotateCcw, Shield, Radio, Database, Activity, ExternalLink } from 'lucide-react';

interface AlarmFilterBarProps {
  filterSeverity: string;
  setFilterSeverity: (val: string) => void;
  filterSource: string;
  setFilterSource: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterSla: string;
  setFilterSla: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onReset: () => void;
  totalFiltered: number;
  totalAlarms: number;
}

export const AlarmFilterBar: React.FC<AlarmFilterBarProps> = ({
  filterSeverity,
  setFilterSeverity,
  filterSource,
  setFilterSource,
  filterStatus,
  setFilterStatus,
  filterSla,
  setFilterSla,
  searchQuery,
  setSearchQuery,
  onReset,
  totalFiltered,
  totalAlarms,
}) => {
  const isFiltered =
    filterSeverity !== 'ALL' ||
    filterSource !== 'ALL' ||
    filterStatus !== 'ALL' ||
    filterSla !== 'ALL' ||
    searchQuery.trim().length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 text-xs">
      {/* 搜索与快速选择行 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-alarm-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索告警编号 / 描述 / 测点 / 设备 / traceId..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004287] focus:border-[#004287] transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[11px]">
            匹配 <strong className="text-slate-900 font-mono">{totalFiltered}</strong> / {totalAlarms} 项
          </span>

          {isFiltered && (
            <button
              id="btn-reset-filters"
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>重置筛选</span>
            </button>
          )}
        </div>
      </div>

      {/* 筛选标签行 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
        {/* 1. 等级筛选 */}
        <div className="space-y-1">
          <label className="text-slate-400 text-[11px] font-medium block">
            告警等级 (Severity)
          </label>
          <select
            id="select-filter-severity"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="w-full p-1.5 rounded border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#004287]"
          >
            <option value="ALL">全部等级 (All Levels)</option>
            <option value="CRITICAL">紧急 (CRITICAL · SLA 15m/30m)</option>
            <option value="MAJOR">重要 (MAJOR · 需量越限/严重)</option>
            <option value="MINOR">次要 (MINOR · 保养提醒/偶发)</option>
            <option value="WARNING">提示 (WARNING · 接口延迟/预警)</option>
          </select>
        </div>

        {/* 2. 来源筛选 */}
        <div className="space-y-1">
          <label className="text-slate-400 text-[11px] font-medium block">
            告警来源 (Source & Third-party)
          </label>
          <select
            id="select-filter-source"
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="w-full p-1.5 rounded border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#004287]"
          >
            <option value="ALL">全部来源 (All Sources)</option>
            <option value="DEVICE">物理设备 (充电桩/逆变器/配电总表)</option>
            <option value="INTERFACE">接口服务 (Modbus/前置机/API)</option>
            <option value="DATA_QUALITY">数据质量 (零值突降/缺失/可疑)</option>
            <option value="THRESHOLD">越限阈值 (变压器容量需量)</option>
            <option value="THIRD_PARTY">第三方平台 (特来电/阳光电源)</option>
          </select>
        </div>

        {/* 3. 状态筛选 */}
        <div className="space-y-1">
          <label className="text-slate-400 text-[11px] font-medium block">
            生命周期状态 (Status)
          </label>
          <select
            id="select-filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-1.5 rounded border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#004287]"
          >
            <option value="ALL">全部状态 (All Statuses)</option>
            <option value="PENDING_ACK">待确认 (Pending Ack)</option>
            <option value="PROCESSING">处理中 (Processing · 已转派)</option>
            <option value="RESOLVED">已处置 (Resolved)</option>
            <option value="CLOSED">已关闭 (Closed · 归档)</option>
            <option value="FALSE_ALARM">已标记误报 (False Alarm)</option>
            <option value="IGNORED">已忽略 (Ignored)</option>
          </select>
        </div>

        {/* 4. SLA 状态筛选 */}
        <div className="space-y-1">
          <label className="text-slate-400 text-[11px] font-medium block">
            SLA 履约状态 (SLA Status)
          </label>
          <select
            id="select-filter-sla"
            value={filterSla}
            onChange={(e) => setFilterSla(e.target.value)}
            className="w-full p-1.5 rounded border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#004287]"
          >
            <option value="ALL">全部 SLA 状态</option>
            <option value="NORMAL">正常履约中 (Normal)</option>
            <option value="EXPIRING">即将超时 (临期 &lt;10m)</option>
            <option value="OVERDUE">已超时 (Overdue · 需优先闭环)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
