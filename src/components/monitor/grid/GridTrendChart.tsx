import React, { useState } from 'react';
import { GridTrendSample } from '../../../types/grid';
import {
  TrendingUp,
  Activity,
  Zap,
  SunMedium,
  BatteryCharging,
  Layers,
  LayoutGrid,
  Columns,
  AlertTriangle,
  Info,
  Clock,
  Radio,
} from 'lucide-react';

interface GridTrendChartProps {
  samples: GridTrendSample[];
  isGridMeterOffline?: boolean;
}

export const GridTrendChart: React.FC<GridTrendChartProps> = ({
  samples,
  isGridMeterOffline = false,
}) => {
  // 视图模式：同轴综合对比 vs 分图并列展示
  const [viewMode, setViewMode] = useState<'COAXIAL' | 'SPLIT'>('COAXIAL');

  // 曲线显示过滤开闭 (在同轴视图中支持控制)
  const [visibleSeries, setVisibleSeries] = useState({
    grid: true,
    totalLoad: true,
    pv: true,
    charging: true,
  });

  const toggleSeries = (key: keyof typeof visibleSeries) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 悬停查看具体时标点
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG 画布参数
  const width = 880;
  const height = 320;
  const padding = { top: 25, right: 30, bottom: 40, left: 65 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // 统一量纲标尺：Y 轴功率范围从 -500 kW (大额反送上网) 到 +500 kW (大额购电/大负荷)
  const minKw = -500;
  const maxKw = 550;
  const kwRange = maxKw - minKw;

  const count = samples.length;
  const getX = (idx: number) => {
    if (count <= 1) return padding.left;
    return padding.left + (idx / (count - 1)) * chartW;
  };

  const getY = (kw: number) => {
    const clamped = Math.max(minKw, Math.min(maxKw, kw));
    const ratio = (clamped - minKw) / kwRange;
    return padding.top + chartH - ratio * chartH;
  };

  const zeroY = getY(0);

  // 生成电网功率曲线片段 (处理断网缺失断点)
  const gridSegments: string[] = [];
  let currentGridSeg = '';
  samples.forEach((s, idx) => {
    if (s.gridPowerKw === null || s.isGridMissing) {
      if (currentGridSeg) {
        gridSegments.push(currentGridSeg);
        currentGridSeg = '';
      }
    } else {
      const x = getX(idx);
      const y = getY(s.gridPowerKw);
      if (!currentGridSeg) currentGridSeg = `M ${x} ${y}`;
      else currentGridSeg += ` L ${x} ${y}`;
    }
  });
  if (currentGridSeg) gridSegments.push(currentGridSeg);

  // 生成站内总负荷曲线 (恒 >= 0)
  let totalLoadPath = '';
  samples.forEach((s, idx) => {
    const x = getX(idx);
    const y = getY(s.totalLoadKw);
    if (idx === 0) totalLoadPath = `M ${x} ${y}`;
    else totalLoadPath += ` L ${x} ${y}`;
  });

  // 生成光伏出力曲线 (恒 >= 0)
  let pvPath = '';
  samples.forEach((s, idx) => {
    const x = getX(idx);
    const y = getY(s.pvPowerKw);
    if (idx === 0) pvPath = `M ${x} ${y}`;
    else pvPath += ` L ${x} ${y}`;
  });

  // 生成充电桩负荷曲线 (恒 >= 0)
  let chargingPath = '';
  samples.forEach((s, idx) => {
    const x = getX(idx);
    const y = getY(s.chargingLoadKw);
    if (idx === 0) chargingPath = `M ${x} ${y}`;
    else chargingPath += ` L ${x} ${y}`;
  });

  const activeSample = hoveredIndex !== null ? samples[hoveredIndex] : null;

  return (
    <div
      id="grid-trend-chart-card"
      className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4"
    >
      {/* 头部标题与控制栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              微电网 24 小时实测功率趋势 (统一实测 · 杜绝预测)
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono font-semibold border border-purple-200/80">
              同轴/分图 kW
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            零轴以上为购电下网 (+)，零轴以下为余电反送上网 (-)。全部曲线均为 15s 采样点实测，不含负荷或算法预测。
          </p>
        </div>

        {/* 视图切换按钮 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('COAXIAL')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'COAXIAL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              同轴对比
            </button>
            <button
              onClick={() => setViewMode('SPLIT')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'SPLIT'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              四图分立
            </button>
          </div>
        </div>
      </div>

      {/* 图例切换器 (点击开关显示) */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4">
          {/* 电网图例 */}
          <button
            onClick={() => toggleSeries('grid')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              visibleSeries.grid
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
            <span>关口购/售电 (kW)</span>
          </button>

          {/* 站内总负荷 */}
          <button
            onClick={() => toggleSeries('totalLoad')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              visibleSeries.totalLoad
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
            <span>站内总用电负荷 (kW)</span>
          </button>

          {/* 光伏 */}
          <button
            onClick={() => toggleSeries('pv')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              visibleSeries.pv
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>光伏发电出力 (kW)</span>
          </button>

          {/* 充电桩 */}
          <button
            onClick={() => toggleSeries('charging')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              visibleSeries.charging
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
            <span>充电桩负荷 (kW)</span>
          </button>
        </div>

        {isGridMeterOffline && (
          <span className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            14:00 后存在关口表通信失联断口 (杜绝补线)
          </span>
        )}
      </div>

      {/* 视图 1：同轴综合对比视图 (COAXIAL) */}
      {viewMode === 'COAXIAL' && (
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible select-none"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* 网格水平辅助虚线与 Y 轴刻度 */}
            {[-400, -200, 0, 200, 400].map((tick) => {
              const y = getY(tick);
              const isZero = tick === 0;
              return (
                <g key={tick}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke={isZero ? '#64748b' : '#f1f5f9'}
                    strokeWidth={isZero ? 1.5 : 1}
                    strokeDasharray={isZero ? undefined : '3,3'}
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={10}
                    fontFamily="monospace"
                    fill={isZero ? '#334155' : '#94a3b8'}
                    fontWeight={isZero ? 'bold' : 'normal'}
                  >
                    {tick > 0 ? `+${tick}` : tick} kW
                  </text>
                </g>
              );
            })}

            {/* 零轴基准线提示说明 */}
            <text
              x={width - padding.right - 5}
              y={zeroY - 6}
              textAnchor="end"
              fontSize={10}
              fill="#64748b"
              fontFamily="sans-serif"
            >
              0 kW 平衡基线 (上方购电 / 下方上网)
            </text>

            {/* X 轴时间刻度 */}
            {samples.map((s, idx) => {
              if (idx % 3 !== 0 && idx !== count - 1) return null;
              const x = getX(idx);
              return (
                <g key={s.timestamp}>
                  <line
                    x1={x}
                    y1={height - padding.bottom}
                    x2={x}
                    y2={height - padding.bottom + 4}
                    stroke="#cbd5e1"
                    strokeWidth={1}
                  />
                  <text
                    x={x}
                    y={height - padding.bottom + 16}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily="monospace"
                    fill="#64748b"
                  >
                    {s.timestamp}
                  </text>
                </g>
              );
            })}

            {/* 曲线 1: 站内总用电负荷 (蓝色) */}
            {visibleSeries.totalLoad && (
              <path
                d={totalLoadPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="4,2"
                opacity={0.8}
              />
            )}

            {/* 曲线 2: 光伏出力 (阳光金) */}
            {visibleSeries.pv && (
              <path
                d={pvPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            )}

            {/* 曲线 3: 充电桩负荷 (翠绿) */}
            {visibleSeries.charging && (
              <path
                d={chargingPath}
                fill="none"
                stroke="#10b981"
                strokeWidth={1.8}
                opacity={0.85}
              />
            )}

            {/* 曲线 4: 关口购售电功率 (紫色，带断口保护) */}
            {visibleSeries.grid &&
              gridSegments.map((seg, i) => (
                <path
                  key={i}
                  d={seg}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth={2.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

            {/* 鼠标悬停交叉垂直辅助线与交互触发透明矩形 */}
            {samples.map((s, idx) => {
              const x = getX(idx);
              const colW = chartW / count;
              return (
                <rect
                  key={s.timestamp}
                  x={x - colW / 2}
                  y={padding.top}
                  width={colW}
                  height={chartH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                />
              );
            })}

            {/* 悬停辅助虚线 */}
            {hoveredIndex !== null && (
              <g pointerEvents="none">
                <line
                  x1={getX(hoveredIndex)}
                  y1={padding.top}
                  x2={getX(hoveredIndex)}
                  y2={height - padding.bottom}
                  stroke="#94a3b8"
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />
              </g>
            )}
          </svg>

          {/* 浮动点位数值卡片 */}
          {activeSample && (
            <div
              className="absolute z-20 bg-slate-900/90 text-white rounded-lg p-3 shadow-lg border border-slate-700 pointer-events-none text-xs space-y-1"
              style={{
                left: `${Math.min(
                  width - 240,
                  Math.max(20, getX(hoveredIndex!) - 100)
                )}px`,
                top: '10px',
              }}
            >
              <div className="font-bold flex items-center justify-between gap-4 pb-1 border-b border-slate-700">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {activeSample.timestamp} 实测采样
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeSample.quality}
                </span>
              </div>

              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between gap-4">
                  <span className="text-purple-400">电网关口功率:</span>
                  <span className="font-mono font-bold">
                    {activeSample.gridPowerKw !== null
                      ? `${activeSample.gridPowerKw > 0 ? '+' : ''}${activeSample.gridPowerKw} kW`
                      : '-- (断网缺失)'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-amber-400">光伏发电出力:</span>
                  <span className="font-mono font-bold">
                    {activeSample.pvPowerKw} kW
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-blue-400">站内总负荷:</span>
                  <span className="font-mono font-bold">
                    {activeSample.totalLoadKw} kW
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-emerald-400">充电桩负荷:</span>
                  <span className="font-mono font-bold">
                    {activeSample.chargingLoadKw} kW
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 视图 2：四图分立并列展示 (SPLIT) */}
      {viewMode === 'SPLIT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* 1. 电网购售电小图 */}
          <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-600" />
                关口购/售电功率 (kW)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">正购负售</span>
            </div>
            <div className="h-36 flex items-center justify-center">
              <svg viewBox="0 0 400 130" className="w-full h-full">
                <line x1="30" y1="65" x2="390" y2="65" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
                <text x="25" y="68" fontSize="9" textAnchor="end" fill="#94a3b8">0</text>
                <text x="25" y="20" fontSize="9" textAnchor="end" fill="#94a3b8">+500</text>
                <text x="25" y="115" fontSize="9" textAnchor="end" fill="#94a3b8">-500</text>
                {gridSegments.map((seg, i) => (
                  <path
                    key={i}
                    d={seg.replace(/M\s+([\d.]+)\s+([\d.]+)/g, (_, x, y) => `M ${(Number(x)/880)*360+30} ${(Number(y)/320)*110+10}`)}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2.5"
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* 2. 站内总负荷小图 */}
          <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                站内用电总负荷 (kW)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">充电+办公</span>
            </div>
            <div className="h-36 flex items-center justify-center">
              <svg viewBox="0 0 400 130" className="w-full h-full">
                <line x1="30" y1="110" x2="390" y2="110" stroke="#cbd5e1" strokeWidth="1" />
                <text x="25" y="113" fontSize="9" textAnchor="end" fill="#94a3b8">0</text>
                <text x="25" y="25" fontSize="9" textAnchor="end" fill="#94a3b8">400</text>
                <path
                  d={totalLoadPath.replace(/M\s+([\d.]+)\s+([\d.]+)/g, (_, x, y) => `M ${(Number(x)/880)*360+30} ${(Number(y)/320)*110+10}`)}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          {/* 3. 光伏出力小图 */}
          <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <SunMedium className="w-3.5 h-3.5 text-amber-500" />
                屋顶光伏发电出力 (kW)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">1.2 MWp</span>
            </div>
            <div className="h-36 flex items-center justify-center">
              <svg viewBox="0 0 400 130" className="w-full h-full">
                <line x1="30" y1="110" x2="390" y2="110" stroke="#cbd5e1" strokeWidth="1" />
                <text x="25" y="113" fontSize="9" textAnchor="end" fill="#94a3b8">0</text>
                <text x="25" y="25" fontSize="9" textAnchor="end" fill="#94a3b8">500</text>
                <path
                  d={pvPath.replace(/M\s+([\d.]+)\s+([\d.]+)/g, (_, x, y) => `M ${(Number(x)/880)*360+30} ${(Number(y)/320)*110+10}`)}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>

          {/* 4. 充电桩负荷小图 */}
          <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                充电桩实时负荷 (kW)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">12 台桩群</span>
            </div>
            <div className="h-36 flex items-center justify-center">
              <svg viewBox="0 0 400 130" className="w-full h-full">
                <line x1="30" y1="110" x2="390" y2="110" stroke="#cbd5e1" strokeWidth="1" />
                <text x="25" y="113" fontSize="9" textAnchor="end" fill="#94a3b8">0</text>
                <text x="25" y="25" fontSize="9" textAnchor="end" fill="#94a3b8">300</text>
                <path
                  d={chargingPath.replace(/M\s+([\d.]+)\s+([\d.]+)/g, (_, x, y) => `M ${(Number(x)/880)*360+30} ${(Number(y)/320)*110+10}`)}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
