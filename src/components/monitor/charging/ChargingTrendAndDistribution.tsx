import React, { useState } from 'react';
import { ChargingTrendSample, ChargerPile } from '../../../types/charging';
import {
  Activity,
  Zap,
  BatteryCharging,
  PieChart as PieIcon,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react';

interface ChargingTrendAndDistributionProps {
  trendSamples: ChargingTrendSample[];
  piles: ChargerPile[];
  onSelectPile?: (pile: ChargerPile) => void;
}

export const ChargingTrendAndDistribution: React.FC<ChargingTrendAndDistributionProps> = ({
  trendSamples,
  piles,
  onSelectPile,
}) => {
  const [hoveredSample, setHoveredSample] = useState<ChargingTrendSample | null>(null);

  // 桩状态统计
  const totalPiles = piles.length;
  const chargingCount = piles.filter((p) => p.status === 'CHARGING').length;
  const idleCount = piles.filter((p) => p.status === 'IDLE').length;
  const faultCount = piles.filter((p) => p.status === 'FAULT').length;
  const offlineCount = piles.filter((p) => p.status === 'OFFLINE').length;

  // 计算负荷曲线坐标
  const maxKw = 220; // 设定 Y 轴上限 220 kW
  const chartHeight = 160;
  const chartWidth = 560;
  const padding = { top: 20, right: 20, bottom: 25, left: 45 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const points = trendSamples.map((sample, idx) => {
    const x = padding.left + (idx / (trendSamples.length - 1)) * innerW;
    const y = padding.top + innerH - (sample.chargingLoadKw / maxKw) * innerH;
    return { x, y, sample };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${padding.left + innerW} ${padding.top + innerH} L ${padding.left} ${padding.top + innerH} Z`;

  // 分时时段背景定义 (大工业分时标准时段)
  // 00:00-06:30 谷, 06:30-08:30 平, 08:30-11:30 峰, 11:30-14:30 平, 14:30-19:00 峰, 19:00-21:00 尖, 21:00-23:00 平, 23:00-24:00 谷
  const timeSlotBands = [
    { startH: 0, endH: 6.5, label: '低谷', color: 'rgba(16, 185, 129, 0.08)' },
    { startH: 6.5, endH: 8.5, label: '平段', color: 'rgba(59, 130, 246, 0.06)' },
    { startH: 8.5, endH: 11.5, label: '高峰', color: 'rgba(245, 158, 11, 0.08)' },
    { startH: 11.5, endH: 14.5, label: '平段', color: 'rgba(59, 130, 246, 0.06)' },
    { startH: 14.5, endH: 19, label: '高峰', color: 'rgba(245, 158, 11, 0.08)' },
    { startH: 19, endH: 21, label: '尖峰', color: 'rgba(239, 68, 68, 0.09)' },
    { startH: 21, endH: 23, label: '平段', color: 'rgba(59, 130, 246, 0.06)' },
    { startH: 23, endH: 24, label: '低谷', color: 'rgba(16, 185, 129, 0.08)' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 左侧：当日实测负荷趋势 (7列) */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-emerald-50 text-emerald-700">
                  <Activity className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  当日充电总负荷实测趋势 (24h)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                基于云端中继采集的实测负荷序列（叠加分时电价时段底色，实测不插值）
              </p>
            </div>

            {/* 图例 */}
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-1 bg-emerald-600 rounded-full" />
                充电实测负荷 (kW)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-red-200" />
                尖
                <span className="w-2 h-2 rounded bg-amber-200" />
                峰
                <span className="w-2 h-2 rounded bg-blue-200" />
                平
                <span className="w-2 h-2 rounded bg-emerald-200" />
                谷
              </span>
            </div>
          </div>

          {/* 趋势图 SVG */}
          <div className="relative w-full aspect-[2.4/1] min-h-[190px]">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chargingLoadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* 分时时段背景矩形 */}
              {timeSlotBands.map((band, i) => {
                const x1 = padding.left + (band.startH / 24) * innerW;
                const x2 = padding.left + (band.endH / 24) * innerW;
                return (
                  <rect
                    key={i}
                    x={x1}
                    y={padding.top}
                    width={x2 - x1}
                    height={innerH}
                    fill={band.color}
                  />
                );
              })}

              {/* 水平网格线 */}
              {[0, 50, 100, 150, 200].map((val) => {
                const y = padding.top + innerH - (val / maxKw) * innerH;
                return (
                  <g key={val}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={padding.left + innerW}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padding.left - 6}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="#94a3b8"
                      className="font-mono"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* X 轴刻度 */}
              {[0, 4, 8, 12, 16, 20, 23].map((hour) => {
                const x = padding.left + (hour / 23) * innerW;
                return (
                  <text
                    key={hour}
                    x={x}
                    y={padding.top + innerH + 16}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#94a3b8"
                    className="font-mono"
                  >
                    {String(hour).padStart(2, '0')}:00
                  </text>
                );
              })}

              {/* 面积与折线 */}
              <path d={areaD} fill="url(#chargingLoadGradient)" />
              <path
                d={pathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 采样点与交互热区 */}
              {points.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredSample?.timestamp === pt.sample.timestamp ? 4 : 2}
                    fill={hoveredSample?.timestamp === pt.sample.timestamp ? '#059669' : '#10b981'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {/* 热区 */}
                  <rect
                    x={pt.x - innerW / 46}
                    y={padding.top}
                    width={innerW / 23}
                    height={innerH}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredSample(pt.sample)}
                    onMouseLeave={() => setHoveredSample(null)}
                  />
                </g>
              ))}

              {/* 悬浮十字光标 */}
              {hoveredSample && (
                <line
                  x1={
                    padding.left +
                    (trendSamples.findIndex((s) => s.timestamp === hoveredSample.timestamp) /
                      (trendSamples.length - 1)) *
                      innerW
                  }
                  y1={padding.top}
                  x2={
                    padding.left +
                    (trendSamples.findIndex((s) => s.timestamp === hoveredSample.timestamp) /
                      (trendSamples.length - 1)) *
                      innerW
                  }
                  y2={padding.top + innerH}
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              )}
            </svg>

            {/* 悬浮 Tooltip 悬浮卡片 */}
            {hoveredSample && (
              <div className="absolute top-2 right-4 bg-slate-900/90 backdrop-blur text-white p-2.5 rounded-lg text-xs shadow-lg pointer-events-none z-10 border border-slate-700 font-sans">
                <div className="flex items-center justify-between gap-4 font-mono font-bold text-emerald-400 border-b border-slate-700/80 pb-1 mb-1.5">
                  <span>时刻 {hoveredSample.timestamp}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-200">
                    {hoveredSample.slotLabel} ({hoveredSample.slotPrice}元/kWh)
                  </span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <div className="flex justify-between gap-4">
                    <span>瞬时充电负荷:</span>
                    <span className="font-mono font-bold text-white">
                      {hoveredSample.chargingLoadKw} kW
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>占用枪数:</span>
                    <span className="font-mono font-semibold text-white">
                      {hoveredSample.occupiedGuns} 枪 / 24枪
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部业务语义提示 */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>负荷低谷主要集中在 01:00-05:00（夜间谷电吸纳）；高峰期负荷稳定在 80~140kW</span>
          </span>
          <span className="font-mono text-slate-400">更新周期: 15s</span>
        </div>
      </div>

      {/* 右侧：桩状态分布与 24 枪占用矩阵 (5列) */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-blue-50 text-blue-700">
                <PieIcon className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-900 text-sm">桩状态分布与枪口占用矩阵</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">共 12 台 / 24 枪</span>
          </div>

          {/* 状态占比条 */}
          <div className="space-y-2 mb-4">
            <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100">
              <div
                style={{ width: `${(chargingCount / totalPiles) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`充电中: ${chargingCount}台 (${((chargingCount / totalPiles) * 100).toFixed(1)}%)`}
              />
              <div
                style={{ width: `${(idleCount / totalPiles) * 100}%` }}
                className="bg-blue-500 transition-all duration-500"
                title={`空闲: ${idleCount}台 (${((idleCount / totalPiles) * 100).toFixed(1)}%)`}
              />
              <div
                style={{ width: `${(faultCount / totalPiles) * 100}%` }}
                className="bg-red-500 transition-all duration-500"
                title={`故障: ${faultCount}台 (${((faultCount / totalPiles) * 100).toFixed(1)}%)`}
              />
              <div
                style={{ width: `${(offlineCount / totalPiles) * 100}%` }}
                className="bg-slate-400 transition-all duration-500"
                title={`离线: ${offlineCount}台 (${((offlineCount / totalPiles) * 100).toFixed(1)}%)`}
              />
            </div>

            {/* 状态图例卡片 */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="text-[11px] text-emerald-700 font-medium">充电中</div>
                <div className="font-mono font-bold text-slate-900 text-sm">{chargingCount} 台</div>
                <div className="text-[10px] text-emerald-600">
                  {((chargingCount / totalPiles) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100">
                <div className="text-[11px] text-blue-700 font-medium">空闲待机</div>
                <div className="font-mono font-bold text-slate-900 text-sm">{idleCount} 台</div>
                <div className="text-[10px] text-blue-600">
                  {((idleCount / totalPiles) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-red-50 border border-red-100">
                <div className="text-[11px] text-red-700 font-medium">故障告警</div>
                <div className="font-mono font-bold text-red-700 text-sm">{faultCount} 台</div>
                <div className="text-[10px] text-red-600">
                  {((faultCount / totalPiles) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200">
                <div className="text-[11px] text-slate-600 font-medium">离线通信</div>
                <div className="font-mono font-bold text-slate-800 text-sm">{offlineCount} 台</div>
                <div className="text-[10px] text-slate-500">
                  {((offlineCount / totalPiles) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* 24 枪占用实时缩略网格 */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
              <span>全场 24 枪口实时状态矩阵</span>
              <span className="text-[10px] text-slate-400 font-normal">点击桩体可快捷查看详情</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {piles.map((pile) => {
                const isFault = pile.status === 'FAULT';
                const isOffline = pile.status === 'OFFLINE';
                const isCharging = pile.status === 'CHARGING';

                return (
                  <button
                    key={pile.id}
                    onClick={() => onSelectPile?.(pile)}
                    className={`p-2 rounded-lg border text-left transition-all hover:shadow-xs ${
                      isFault
                        ? 'bg-red-50/70 border-red-200 hover:border-red-400'
                        : isOffline
                        ? 'bg-slate-50 border-slate-200 hover:border-slate-400'
                        : isCharging
                        ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400'
                        : 'bg-white border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {pile.pileCode}
                      </span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isFault
                            ? 'bg-red-500 animate-pulse'
                            : isOffline
                            ? 'bg-slate-400'
                            : isCharging
                            ? 'bg-emerald-500'
                            : 'bg-blue-500'
                        }`}
                      />
                    </div>
                    {/* A/B枪迷你指示 */}
                    <div className="flex items-center gap-1">
                      {pile.guns.map((g) => (
                        <span
                          key={g.gunCode}
                          className={`flex-1 text-center py-0.5 rounded text-[9px] font-mono font-semibold ${
                            g.status === 'CHARGING'
                              ? 'bg-emerald-600 text-white'
                              : g.status === 'FAULT'
                              ? 'bg-red-600 text-white'
                              : g.status === 'OFFLINE'
                              ? 'bg-slate-300 text-slate-600'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                          title={`${pile.pileCode} 枪${g.gunCode}: ${
                            g.status === 'CHARGING'
                              ? `充电中 (${g.currentPowerKw}kW)`
                              : g.status === 'FAULT'
                              ? '故障'
                              : g.status === 'OFFLINE'
                              ? '离线'
                              : '空闲'
                          }`}
                        >
                          {g.gunCode}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>在线率: 83.3%</span>
          <span>枪口占用率: 33.3% (8/24)</span>
        </div>
      </div>
    </div>
  );
};
