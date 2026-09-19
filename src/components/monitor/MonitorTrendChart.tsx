import React, { useState, useMemo } from 'react';
import { TrendPointSample } from '../../types/monitor';
import { MonitorQualityBadge } from './MonitorQualityBadge';
import { Activity, AlertTriangle, Eye, EyeOff, Info } from 'lucide-react';

interface MonitorTrendChartProps {
  samples: TrendPointSample[];
  scenario?: string;
  className?: string;
}

export const MonitorTrendChart: React.FC<MonitorTrendChartProps> = ({
  samples,
  scenario = 'SCENARIO_A',
  className = '',
}) => {
  // 曲线显示控制
  const [visibleSeries, setVisibleSeries] = useState<{
    pv: boolean;
    storage: boolean;
    charging: boolean;
    grid: boolean;
  }>({
    pv: true,
    storage: true,
    charging: true,
    grid: true,
  });

  // 悬浮交互点
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // 坐标系边界设定 (kW 范围: -300 到 +600)
  const minY = -300;
  const maxY = 600;
  const rangeY = maxY - minY;

  // SVG 视口尺寸
  const svgWidth = 800;
  const svgHeight = 260;
  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  // Y 轴 0 刻度线在 SVG 中的 Y 坐标
  const zeroY = paddingTop + chartH * (maxY / rangeY);

  const getY = (val: number) => {
    // 裁剪在 [minY, maxY]
    const clamped = Math.max(minY, Math.min(maxY, val));
    return paddingTop + chartH * ((maxY - clamped) / rangeY);
  };

  const getX = (hour: number) => {
    return paddingLeft + (hour / 23) * chartW;
  };

  // 生成折线路径
  const generatePath = (key: 'pvPowerKw' | 'storagePowerKw' | 'chargingLoadKw' | 'gridPowerKw') => {
    return samples
      .map((s, idx) => {
        const x = getX(s.hour);
        const y = getY(s[key]);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const pvPath = useMemo(() => generatePath('pvPowerKw'), [samples]);
  const storagePath = useMemo(() => generatePath('storagePowerKw'), [samples]);
  const chargingPath = useMemo(() => generatePath('chargingLoadKw'), [samples]);
  const gridPath = useMemo(() => generatePath('gridPowerKw'), [samples]);

  const activeSample = hoveredHour !== null ? samples.find((s) => s.hour === hoveredHour) : null;

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs ${className}`}>
      {/* 标题栏与系列图例开关 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900">微电网全天实测功率走势曲线</h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              采样周期: 1小时·单位: kW
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            零轴基准线明确划分：储能轴上放电/轴下充电；电网轴上购电/轴下送网。
          </p>
        </div>

        {/* 系列开关图例 */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* 光伏 */}
          <button
            type="button"
            onClick={() => setVisibleSeries((prev) => ({ ...prev, pv: !prev.pv }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all ${
              visibleSeries.pv
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs font-bold'
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>光伏发电 (+)</span>
          </button>

          {/* 储能 */}
          <button
            type="button"
            onClick={() => setVisibleSeries((prev) => ({ ...prev, storage: !prev.storage }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all ${
              visibleSeries.storage
                ? 'bg-blue-50 text-blue-800 border-blue-300 shadow-2xs font-bold'
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>储能 (+放 / -充)</span>
          </button>

          {/* 充电负荷 */}
          <button
            type="button"
            onClick={() => setVisibleSeries((prev) => ({ ...prev, charging: !prev.charging }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all ${
              visibleSeries.charging
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs font-bold'
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>充电负荷 (+)</span>
          </button>

          {/* 电网关口 */}
          <button
            type="button"
            onClick={() => setVisibleSeries((prev) => ({ ...prev, grid: !prev.grid }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all ${
              visibleSeries.grid
                ? 'bg-purple-50 text-purple-800 border-purple-300 shadow-2xs font-bold'
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>电网关口 (+购 / -售)</span>
          </button>
        </div>
      </div>

      {/* SVG 趋势绘图区 */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-64 select-none font-mono"
        >
          {/* 背景填充区域 */}
          {/* 放电/受电区 (大于0) */}
          <rect
            x={paddingLeft}
            y={paddingTop}
            width={chartW}
            height={zeroY - paddingTop}
            fill="#f8fafc"
            opacity="0.6"
          />
          {/* 充电/送网区 (小于0) */}
          <rect
            x={paddingLeft}
            y={zeroY}
            width={chartW}
            height={chartH - (zeroY - paddingTop)}
            fill="#eff6ff"
            opacity="0.3"
          />

          {/* 刻度水平网格线 */}
          {[600, 400, 200, 0, -200].map((val) => {
            const y = getY(val);
            const isZero = val === 0;
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke={isZero ? '#475569' : '#e2e8f0'}
                  strokeWidth={isZero ? '1.5' : '1'}
                  strokeDasharray={isZero ? undefined : '3 3'}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fontWeight={isZero ? 'bold' : 'normal'}
                  fill={isZero ? '#0f172a' : '#94a3b8'}
                >
                  {val > 0 ? `+${val}` : val}
                </text>
              </g>
            );
          })}

          {/* 零轴标识文本 */}
          <text
            x={svgWidth - paddingRight - 4}
            y={zeroY - 5}
            textAnchor="end"
            fontSize="9"
            fontWeight="bold"
            fill="#475569"
          >
            0 kW (平衡基准)
          </text>

          {/* X 轴刻度 (24小时) */}
          {Array.from({ length: 9 }).map((_, i) => {
            const hour = i * 3 <= 23 ? i * 3 : 23;
            const x = getX(hour);
            return (
              <g key={hour}>
                <line x1={x} y1={paddingTop} x2={x} y2={paddingTop + chartH} stroke="#f1f5f9" />
                <text
                  x={x}
                  y={paddingTop + chartH + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748b"
                >
                  {String(hour).padStart(2, '0')}:00
                </text>
              </g>
            );
          })}

          {/* 光伏曲线 */}
          {visibleSeries.pv && (
            <path
              d={pvPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 充电桩负荷曲线 */}
          {visibleSeries.charging && (
            <path
              d={chargingPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 电网关口曲线 */}
          {visibleSeries.grid && (
            <path
              d={gridPath}
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeDasharray="4 2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 储能曲线 (场景 B 下带异常标记) */}
          {visibleSeries.storage && (
            <path
              d={storagePath}
              fill="none"
              stroke={scenario === 'SCENARIO_B' ? '#ef4444' : '#3b82f6'}
              strokeWidth="2.5"
              strokeDasharray={scenario === 'SCENARIO_B' ? '5 3' : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 交互悬浮参考线与指示圆点 */}
          {hoveredHour !== null && (
            <g>
              <line
                x1={getX(hoveredHour)}
                y1={paddingTop}
                x2={getX(hoveredHour)}
                y2={paddingTop + chartH}
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {activeSample && (
                <>
                  {visibleSeries.pv && (
                    <circle
                      cx={getX(hoveredHour)}
                      cy={getY(activeSample.pvPowerKw)}
                      r="4"
                      fill="#f59e0b"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                  )}
                  {visibleSeries.storage && (
                    <circle
                      cx={getX(hoveredHour)}
                      cy={getY(activeSample.storagePowerKw)}
                      r="4"
                      fill={activeSample.isStorageAnomaly ? '#ef4444' : '#3b82f6'}
                      stroke="#fff"
                      strokeWidth="2"
                    />
                  )}
                  {visibleSeries.charging && (
                    <circle
                      cx={getX(hoveredHour)}
                      cy={getY(activeSample.chargingLoadKw)}
                      r="4"
                      fill="#10b981"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                  )}
                  {visibleSeries.grid && (
                    <circle
                      cx={getX(hoveredHour)}
                      cy={getY(activeSample.gridPowerKw)}
                      r="4"
                      fill="#a855f7"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                  )}
                </>
              )}
            </g>
          )}

          {/* 触发悬停的热区条 */}
          {samples.map((s) => {
            const x = getX(s.hour) - chartW / 46;
            const w = chartW / 23;
            return (
              <rect
                key={s.hour}
                x={x}
                y={paddingTop}
                width={w}
                height={chartH}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredHour(s.hour)}
                onMouseLeave={() => setHoveredHour(null)}
              />
            );
          })}
        </svg>
      </div>

      {/* 悬停详细指标看板 */}
      {activeSample ? (
        <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 font-mono text-sm">
              {activeSample.timestamp}
            </span>
            {activeSample.isStorageAnomaly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                <span>储能数据断线停滞</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap text-xs">
            {visibleSeries.pv && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-500">光伏:</span>
                <span className="font-mono font-bold text-amber-700">
                  {activeSample.pvPowerKw} kW
                </span>
              </div>
            )}

            {visibleSeries.storage && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeSample.isStorageAnomaly ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                />
                <span className="text-slate-500">储能:</span>
                <span
                  className={`font-mono font-bold ${
                    activeSample.isStorageAnomaly
                      ? 'text-red-700'
                      : activeSample.storagePowerKw >= 0
                      ? 'text-blue-700'
                      : 'text-indigo-700'
                  }`}
                >
                  {activeSample.storagePowerKw > 0
                    ? `+${activeSample.storagePowerKw}`
                    : activeSample.storagePowerKw}{' '}
                  kW
                  <span className="text-[10px] font-normal text-slate-500 ml-1">
                    ({activeSample.storagePowerKw >= 0 ? '放电' : '充电'})
                  </span>
                </span>
              </div>
            )}

            {visibleSeries.charging && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-500">充电桩:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {activeSample.chargingLoadKw} kW
                </span>
              </div>
            )}

            {visibleSeries.grid && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-slate-500">电网关口:</span>
                <span className="font-mono font-bold text-purple-700">
                  {activeSample.gridPowerKw > 0
                    ? `+${activeSample.gridPowerKw}`
                    : activeSample.gridPowerKw}{' '}
                  kW
                  <span className="text-[10px] font-normal text-slate-500 ml-1">
                    ({activeSample.gridPowerKw >= 0 ? '购电' : '上网'})
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 py-2 px-3 rounded-lg bg-slate-50/50 border border-dashed border-slate-200 text-center text-[11px] text-slate-400">
          移动光标至图表任意时间点可查看光伏、储能、充电桩与电网关口的瞬时功率与方向分解
        </div>
      )}
    </div>
  );
};
