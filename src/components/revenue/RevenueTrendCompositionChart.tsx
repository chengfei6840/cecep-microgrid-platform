import React, { useState } from 'react';
import { RevenueKpiSummary, RevenueTimeslotTrendItem } from '../../types/revenue';
import { TrendingUp, PieChart, Info, Layers, Sparkles } from 'lucide-react';

interface RevenueTrendCompositionChartProps {
  kpis: RevenueKpiSummary;
  trendData: RevenueTimeslotTrendItem[];
  caliber: 'ESTIMATE' | 'SETTLEMENT';
}

export const RevenueTrendCompositionChart: React.FC<RevenueTrendCompositionChartProps> = ({
  kpis,
  trendData,
  caliber,
}) => {
  const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null);

  const totalIncomes =
    kpis.pvTotalRevenue +
    kpis.storageDischargeRevenue +
    kpis.chargingTotalRevenue;

  const totalCosts =
    kpis.gridPurchaseCost +
    kpis.capacityBaseFee +
    kpis.storageChargeCost;

  const pvSelfPct = totalIncomes > 0 ? ((kpis.pvSelfRevenue / totalIncomes) * 100).toFixed(1) : '0.0';
  const pvGridPct = totalIncomes > 0 ? ((kpis.pvFeedInRevenue / totalIncomes) * 100).toFixed(1) : '0.0';
  const essDischargePct =
    totalIncomes > 0 ? ((kpis.storageDischargeRevenue / totalIncomes) * 100).toFixed(1) : '0.0';
  const chargingPct =
    totalIncomes > 0 ? ((kpis.chargingTotalRevenue / totalIncomes) * 100).toFixed(1) : '0.0';

  const gridCostPct = totalCosts > 0 ? ((kpis.gridPurchaseCost / totalCosts) * 100).toFixed(1) : '0.0';
  const baseFeePct = totalCosts > 0 ? ((kpis.capacityBaseFee / totalCosts) * 100).toFixed(1) : '0.0';
  const essChargePct = totalCosts > 0 ? ((kpis.storageChargeCost / totalCosts) * 100).toFixed(1) : '0.0';

  // SVG 画布参数
  const width = 640;
  const height = 230;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Y轴范围：-2500 到 +2500 元
  const minY = -2500;
  const maxY = 2500;
  const yRange = maxY - minY;

  const getY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return padding.top + ((maxY - clamped) / yRange) * chartH;
  };

  const zeroY = getY(0);

  const slotCount = trendData.length;
  const colWidth = chartW / slotCount;

  // 生成折线坐标
  const netPoints = trendData.map((d, i) => {
    const x = padding.left + i * colWidth + colWidth / 2;
    const y = getY(d.netRevenue);
    return { x, y, data: d };
  });

  const netPathD = netPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 左侧：收益构成与收支结构剖析 (4 列) */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                综合收支结构剖析
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {caliber === 'SETTLEMENT' ? 'T+1 终审账单' : '实时动态滚动'}
            </span>
          </div>

          {/* 收入端与支出端对比 */}
          <div className="space-y-4 mt-4">
            {/* 1. 总收入端 */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  总经营创收贡献 (Total Incomes)
                </span>
                <span className="font-mono text-emerald-700 text-sm">
                  +¥{totalIncomes.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              </div>
              {/* 堆叠进度条 */}
              <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
                <div style={{ width: `${pvSelfPct}%` }} className="bg-amber-400" title={`光伏自用: ${pvSelfPct}%`} />
                <div style={{ width: `${pvGridPct}%` }} className="bg-amber-500" title={`光伏上网: ${pvGridPct}%`} />
                <div style={{ width: `${essDischargePct}%` }} className="bg-blue-500" title={`储能放电: ${essDischargePct}%`} />
                <div style={{ width: `${chargingPct}%` }} className="bg-emerald-500" title={`充电桩创收: ${chargingPct}%`} />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-amber-400" />
                  <span>光伏自用 ({pvSelfPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-amber-500" />
                  <span>光伏上网 ({pvGridPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-blue-500" />
                  <span>储能放电 ({essDischargePct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                  <span>充电桩群 ({chargingPct}%)</span>
                </div>
              </div>
            </div>

            {/* 2. 总支出端 */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-rose-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  总运营购电成本支出 (Total Costs)
                </span>
                <span className="font-mono text-rose-700 text-sm">
                  -¥{totalCosts.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              </div>
              {/* 堆叠进度条 */}
              <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
                <div style={{ width: `${gridCostPct}%` }} className="bg-rose-500" title={`电网购电: ${gridCostPct}%`} />
                <div style={{ width: `${baseFeePct}%` }} className="bg-purple-500" title={`基本电费: ${baseFeePct}%`} />
                <div style={{ width: `${essChargePct}%` }} className="bg-sky-400" title={`储能充电购电: ${essChargePct}%`} />
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-rose-500" />
                  <span className="truncate">电网购电 {gridCostPct}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-purple-500" />
                  <span className="truncate">需量基本费 {baseFeePct}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-sky-400" />
                  <span className="truncate">谷电储能充 {essChargePct}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 综合结余与利润率 */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500">综合盈余率 (ROI)</span>
            <div className="text-sm font-bold font-mono text-slate-800">
              {totalCosts > 0 ? (((totalIncomes - totalCosts) / totalCosts) * 100).toFixed(1) : '0.0'}%
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500">综合运营净收益</span>
            <div className="text-base font-black font-mono text-emerald-700">
              ¥{kpis.netComprehensiveRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：分时时序走势图 (8 列) */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                分时电价时段经营收支走势 (Time-of-Use Trend)
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-700 inline-block" />
                综合净收益曲线
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" />
                光伏收益
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                充电收入
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-sky-400 inline-block" />
                储能套利
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-400 inline-block" />
                购电支出
              </span>
            </div>
          </div>

          {/* SVG 趋势图 */}
          <div className="relative pt-3 w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto min-w-[580px] select-none"
            >
              {/* 网格水平参考线 */}
              {[-2000, -1000, 0, 1000, 2000].map((val) => {
                const y = getY(val);
                return (
                  <g key={val}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke={val === 0 ? '#94a3b8' : '#f1f5f9'}
                      strokeWidth={val === 0 ? 1.5 : 1}
                      strokeDasharray={val === 0 ? undefined : '3 3'}
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize={10}
                      fill="#94a3b8"
                      fontFamily="monospace"
                    >
                      ¥{val}
                    </text>
                  </g>
                );
              })}

              {/* 各时段条形柱 (光伏/充电/储能/购电) */}
              {trendData.map((d, i) => {
                const cx = padding.left + i * colWidth + colWidth / 2;
                const barWidth = 8;
                const isHovered = hoveredSlotIndex === i;

                // 柱 1: 光伏收益 (正向)
                const pvH = (d.pvRevenue / yRange) * chartH;
                const pvY = zeroY - pvH;

                // 柱 2: 充电收入 (正向)
                const chgH = (d.chargingRevenue / yRange) * chartH;
                const chgY = zeroY - chgH;

                // 柱 3: 储能套利 (可能正或负)
                const essH = Math.abs((d.storageArbitrage / yRange) * chartH);
                const essY = d.storageArbitrage >= 0 ? zeroY - essH : zeroY;

                // 柱 4: 购电成本 (负向)
                const gridH = (d.gridPurchaseCost / yRange) * chartH;
                const gridY = zeroY;

                return (
                  <g
                    key={d.timeslot}
                    onMouseEnter={() => setHoveredSlotIndex(i)}
                    onMouseLeave={() => setHoveredSlotIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* 背景高亮条 */}
                    <rect
                      x={padding.left + i * colWidth}
                      y={padding.top}
                      width={colWidth}
                      height={chartH}
                      fill={isHovered ? 'rgba(241, 245, 249, 0.7)' : 'transparent'}
                      rx={6}
                    />

                    {/* 光伏 */}
                    {d.pvRevenue > 0 && (
                      <rect
                        x={cx - barWidth * 2 - 3}
                        y={pvY}
                        width={barWidth}
                        height={Math.max(2, pvH)}
                        fill="#fbbf24"
                        rx={2}
                      />
                    )}

                    {/* 充电 */}
                    {d.chargingRevenue > 0 && (
                      <rect
                        x={cx - barWidth - 1}
                        y={chgY}
                        width={barWidth}
                        height={Math.max(2, chgH)}
                        fill="#10b981"
                        rx={2}
                      />
                    )}

                    {/* 储能 */}
                    {d.storageArbitrage !== 0 && (
                      <rect
                        x={cx + 1}
                        y={essY}
                        width={barWidth}
                        height={Math.max(2, essH)}
                        fill={d.storageArbitrage >= 0 ? '#38bdf8' : '#0284c7'}
                        rx={2}
                      />
                    )}

                    {/* 购电 */}
                    {d.gridPurchaseCost > 0 && (
                      <rect
                        x={cx + barWidth + 3}
                        y={gridY}
                        width={barWidth}
                        height={Math.max(2, gridH)}
                        fill="#f43f5e"
                        rx={2}
                      />
                    )}

                    {/* X 轴标签 */}
                    <text
                      x={cx}
                      y={height - padding.bottom + 16}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={isHovered ? 'bold' : 'normal'}
                      fill={isHovered ? '#0f172a' : '#64748b'}
                    >
                      {d.label}
                    </text>
                    <text
                      x={cx}
                      y={height - padding.bottom + 28}
                      textAnchor="middle"
                      fontSize={8.5}
                      fill="#94a3b8"
                      fontFamily="monospace"
                    >
                      {d.timeslot.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* 净收益连线 */}
              <path
                d={netPathD}
                fill="none"
                stroke="#1e3a8a"
                strokeWidth={2.5}
                strokeLinecap="round"
              />

              {/* 净收益数据点 */}
              {netPoints.map((pt, idx) => {
                const isHovered = hoveredSlotIndex === idx;
                return (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 3.5}
                      fill={isHovered ? '#3b82f6' : '#1e3a8a'}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 悬停详情卡片 */}
        {hoveredSlotIndex !== null ? (
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between text-xs text-slate-700 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                {trendData[hoveredSlotIndex].label} ({trendData[hoveredSlotIndex].timeslot})
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs">
              <span className="text-amber-700">
                光伏: +¥{trendData[hoveredSlotIndex].pvRevenue.toFixed(1)}
              </span>
              <span className="text-emerald-700">
                充电: +¥{trendData[hoveredSlotIndex].chargingRevenue.toFixed(1)}
              </span>
              <span className="text-sky-700">
                储能: {trendData[hoveredSlotIndex].storageArbitrage >= 0 ? '+' : ''}¥{trendData[hoveredSlotIndex].storageArbitrage.toFixed(1)}
              </span>
              <span className="text-rose-700">
                购电: -¥{trendData[hoveredSlotIndex].gridPurchaseCost.toFixed(1)}
              </span>
              <span className="font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                净额: {trendData[hoveredSlotIndex].netRevenue >= 0 ? '+' : ''}¥{trendData[hoveredSlotIndex].netRevenue.toFixed(1)}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-3 py-1 text-[11px] text-slate-400 text-right">
            提示：将鼠标悬停在上方任意时段柱形上，可快速查看各时段创收与购电支出细分值。
          </div>
        )}
      </div>
    </div>
  );
};
