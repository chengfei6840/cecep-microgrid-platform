import React from 'react';
import { ReportType } from '../../types/domain';
import { Search, Filter, AlertTriangle, ShieldCheck, FileText, Calendar, RotateCcw } from 'lucide-react';

interface ReportFilterBarProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  searchKeyword: string;
  onSearchChange: (keyword: string) => void;
  onlyRisk: boolean;
  onOnlyRiskChange: (val: boolean) => void;
  onlyFormal: boolean;
  onOnlyFormalChange: (val: boolean) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  selectedType,
  onTypeChange,
  searchKeyword,
  onSearchChange,
  onlyRisk,
  onOnlyRiskChange,
  onlyFormal,
  onOnlyFormalChange,
  onReset,
  totalCount,
  filteredCount,
}) => {
  const typeOptions = [
    { value: 'ALL', label: '全部报表类型' },
    { value: 'DAILY_OPERATION', label: '综合运营日报' },
    { value: 'MONTHLY_SUMMARY', label: '综合运营月报' },
    { value: 'REVENUE_SETTLEMENT', label: 'T+1 收益结算报表' },
    { value: 'PATROL_MAINTENANCE', label: '现场运维巡检报表' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs mb-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* 左侧：类型与搜索 */}
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          {/* 报表类型选择 */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索报表名称、编号、批次号或关键词..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* 右侧：快速过滤标签与重置 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOnlyFormalChange(!onlyFormal)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              onlyFormal
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            仅正式结算报表
          </button>

          <button
            type="button"
            onClick={() => onOnlyRiskChange(!onlyRisk)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              onlyRisk
                ? 'bg-amber-50 border-amber-300 text-amber-800 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            含质量风险提示
          </button>

          {(selectedType !== 'ALL' || searchKeyword || onlyRisk || onlyFormal) && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="重置所有筛选"
            >
              <RotateCcw className="w-3 h-3" />
              重置
            </button>
          )}
        </div>
      </div>

      {/* 底部数量提示与站点说明 */}
      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
        <div className="flex items-center gap-2">
          <span>
            共检索到 <strong className="text-slate-800 font-semibold">{filteredCount}</strong> 份报表
            {filteredCount !== totalCount && ` (总计 ${totalCount} 份)`}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">
            站点范围：<strong className="text-slate-700">低碳园区示范站 (单站严格口径)</strong>
          </span>
        </div>
        <span className="text-slate-400 text-[11px]">
          支持 CSV 导出与浏览器高保真打印预览
        </span>
      </div>
    </div>
  );
};
