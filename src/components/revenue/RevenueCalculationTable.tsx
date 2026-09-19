import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RevenueBreakdownItem } from '../../types/revenue';
import { QualityTag } from '../common/QualityTag';
import { VersionBadge } from '../common/VersionBadge';
import {
  Table,
  ExternalLink,
  Search,
  Filter,
  ArrowUpDown,
  Calculator,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface RevenueCalculationTableProps {
  items: RevenueBreakdownItem[];
  onSelectRow: (item: RevenueBreakdownItem) => void;
  caliber: 'ESTIMATE' | 'SETTLEMENT';
}

export const RevenueCalculationTable: React.FC<RevenueCalculationTableProps> = ({
  items,
  onSelectRow,
  caliber,
}) => {
  const navigate = useNavigate();
  const [filterGroup, setFilterGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = items.filter((item) => {
    if (filterGroup !== 'ALL' && item.componentGroup !== filterGroup) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.categoryLabel.toLowerCase().includes(q) ||
        item.pricingMode.toLowerCase().includes(q) ||
        item.timeslotLabel.toLowerCase().includes(q) ||
        item.dataSource.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* 头部控制栏：分类筛选 + 搜索框 */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-900">
            收益核算穿透计算明细表
          </h3>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-600 bg-slate-200/60 font-semibold">
            共 {filteredItems.length} 项
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 分组筛选 */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterGroup('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterGroup === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部收益项
            </button>
            <button
              onClick={() => setFilterGroup('PV')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterGroup === 'PV'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              光伏
            </button>
            <button
              onClick={() => setFilterGroup('STORAGE')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterGroup === 'STORAGE'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              储能
            </button>
            <button
              onClick={() => setFilterGroup('CHARGING')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterGroup === 'CHARGING'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              充电桩
            </button>
            <button
              onClick={() => setFilterGroup('GRID')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterGroup === 'GRID'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              电网与基础
            </button>
          </div>

          {/* 关键字搜索 */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索收益项或模式..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* 表格主体 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
            <tr>
              <th className="py-3 px-4">收益/成本项</th>
              <th className="py-3 px-3">对应测点与时段</th>
              <th className="py-3 px-3 text-right">核算电量 (kWh)</th>
              <th className="py-3 px-4">适用单价与计价模式</th>
              <th className="py-3 px-4 text-right">核算金额 (元)</th>
              <th className="py-3 px-3">数据质量与置信度</th>
              <th className="py-3 px-3">引用电价版本</th>
              <th className="py-3 px-3 text-center">穿透操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const isIncome = item.amount >= 0;
              const isLowQuality = item.quality === 'SUSPICIOUS' || item.quality === 'ANOMALY';

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectRow(item)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    isLowQuality ? 'bg-amber-50/20' : ''
                  }`}
                >
                  {/* 1. 收益/成本项 */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isIncome ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <span>{item.categoryLabel}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">
                      {item.dataSource}
                    </div>
                  </td>

                  {/* 2. 时段 */}
                  <td className="py-3.5 px-3">
                    <div className="font-medium text-slate-800">{item.timeslotLabel}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {item.syncStatus === 'PENDING_SYNC' ? (
                        <span className="text-amber-600 font-bold">待完整同步</span>
                      ) : (
                        '已冻结'
                      )}
                    </div>
                  </td>

                  {/* 3. 电量 */}
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                    {item.energyKwh > 0 ? (
                      item.energyKwh.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                    ) : (
                      <span className="text-slate-400 font-normal">--</span>
                    )}
                  </td>

                  {/* 4. 单价与计价模式 */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-semibold text-slate-900">
                      ¥{item.unitPrice.toFixed(4)}
                      <span className="text-[11px] text-slate-500 font-normal ml-1">
                        {item.category === 'CAPACITY_BASE' ? '元/kW/月' : '元/kWh'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                      {item.pricingMode}
                    </div>
                  </td>

                  {/* 5. 金额 */}
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`font-mono text-sm font-black ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : ''}¥{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>

                  {/* 6. 数据质量与置信度 (点击跳转到质量中心) */}
                  <td className="py-3.5 px-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <QualityTag level={item.quality} />
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            item.confidencePercent < 85 ? 'text-rose-600' : 'text-slate-600'
                          }`}
                        >
                          {item.confidencePercent.toFixed(1)}%
                        </span>
                      </div>
                      {isLowQuality && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/data/quality');
                          }}
                          className="text-[10px] font-bold text-blue-700 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                        >
                          <span>质量异动详情</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* 7. 引用电价版本 (点击跳转到电价中心) */}
                  <td className="py-3.5 px-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/tariffs');
                      }}
                      className="hover:opacity-80 transition-opacity inline-flex items-center gap-1 group/ver"
                      title="点击跳转查看该电价版本及审批记录"
                    >
                      <VersionBadge version={item.referencedTariffVersion} status="EFFECTIVE" />
                      <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover/ver:text-blue-600" />
                    </button>
                  </td>

                  {/* 8. 穿透操作 */}
                  <td className="py-3.5 px-3 text-center">
                    <span className="text-blue-700 hover:text-blue-900 font-semibold text-xs inline-flex items-center gap-1">
                      <span>公式推导</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 底部备注提示 */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>点击任意行可展开该项收益的【完整推导算式、输入测点、中间倍率与时间戳】。</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          口径基准：{caliber === 'SETTLEMENT' ? 'T+1 日终结算归档' : '实时15分钟滚动估算'}
        </span>
      </div>
    </div>
  );
};
