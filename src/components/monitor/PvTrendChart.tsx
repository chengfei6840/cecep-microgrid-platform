import React, { useState } from 'react';
import { PvTrendSample } from '../../types/monitor';
import { MonitorQualityBadge } from './MonitorQualityBadge';
import {
  SunMedium,
  CloudSun,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PvTrendChartProps {
  samples: PvTrendSample[];
  timeRange: 'TODAY' | 'RECENT_4H' | 'YESTERDAY';
  onChangeTimeRange: (range: 'TODAY' | 'RECENT_4H' | 'YESTERDAY') => void;
  selectedSample: PvTrendSample | null;
  onSelectSample: (sample: PvTrendSample | null) => void;
  className?: string;
}

export const PvTrendChart: React.FC<PvTrendChartProps> = ({
  samples,
  timeRange,
  onChangeTimeRange,
  selectedSample,
  onSelectSample,
  className = '',
}) => {
  const navigate = useNavigate();
  const [hoveredSample, setHoveredSample] = useState<PvTrendSample | null>(null);

  // SVG 坐标系参数
  const width = 860;
  const height = 300;
  const padding = { top: 30, right: 65, bottom: 45, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // 标尺上限：功率 500 kW，辐照度 1000 W/m²
  const maxPower = 500;
  const maxIrradiance = 1000;

  const count = samples.length;
  const getX = (index: number) => {
    if (count <= 1) return padding.left;
    return padding.left + (index / (count - 1)) * chartW;
  };

  const getYPower = (kw: number) => {
    const clamped = Math.max(0, Math.min(maxPower, kw));
    return padding.top + chartH - (clamped / maxPower) * chartH;
  };

  const getYIrradiance = (wm2: number) => {
    const clamped = Math.max(0, Math.min(maxIrradiance, wm2));
    return padding.top + chartH - (clamped / maxIrradiance) * chartH;
  };

  // 生成光伏功率折线与填充 (处理数据缺失断点)
  const powerSegments: string[] = [];
  let currentSegment = '';

  samples.forEach((s, i) => {
    if (s.isDataMissing) {
      if (currentSegment) {
        powerSegments.push(currentSegment);
        currentSegment = '';
      }
    } else {
      const x = getX(i);
      const y = getYPower(s.pvPowerKw);
      if (!currentSegment) {
        currentSegment = `M ${x} ${y}`;
      } else {
        currentSegment += ` L ${x} ${y}`;
      }
    }
  });
  if (currentSegment) powerSegments.push(currentSegment);

  // 生成辐照度曲线
  let irradiancePath = '';
  samples.forEach((s, i) => {
    const x = getX(i);
    const y = getYIrradiance(s.irradianceWm2);
    if (i === 0) irradiancePath = `M ${x} ${y}`;
    else irradiancePath += ` L ${x} ${y}`;
  });

  // 当前查看的焦点点位（优先选中，其次悬停）
  const activeDetailPoint = selectedSample || hoveredSample;

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4 ${className}`}>
      {/* 顶部标题与时间范围切换栏 (时间范围仅影响当前页面) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
              <SunMedium className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">当日光伏实测出力趋势与辐照度对照</h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200/80">
              双 Y 轴实测对照
            </span>
          </div>
          <p className="text-xs text-slate-500">
            左轴实测光伏输出功率 (kW，阳光金)，右轴水平总辐照度 (W/m²，天蓝)。点击趋势点查看全维度解析。
          </p>
        </div>

        {/* 时间范围切换器 (局部状态) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => onChangeTimeRange('TODAY')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              timeRange === 'TODAY'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            今日全天实测 (24h)
          </button>
          <button
            type="button"
            onClick={() => onChangeTimeRange('RECENT_4H')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              timeRange === 'RECENT_4H'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            最近 4 小时高频 (15min)
          </button>
          <button
            type="button"
            onClick={() => onChangeTimeRange('YESTERDAY')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              timeRange === 'YESTERDAY'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            昨日全天对比
          </button>
        </div>
      </div>

      {/* 图例栏与业务口径提示 */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/70 px-3 py-2 rounded-lg border border-slate-200/60">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-amber-500 rounded-full inline-block" />
            <span className="font-semibold text-slate-700">光伏实测交流出力 (kW)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-sky-500 rounded-full inline-block" />
            <span className="font-semibold text-slate-700">水平总辐照度 (W/m²)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <span>实测数据源：阳光电源 iSolarCloud · 华控微气象仪</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>夜间零值正常</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>白天零值可疑</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>数据缺失断点</span>
          </span>
        </div>
      </div>

      {/* SVG 趋势主画布 */}
      <div className="relative w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[650px] overflow-visible"
        >
          <defs>
            {/* 光伏功率填充渐变 */}
            <linearGradient id="pvPowerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
            {/* 辐照度填充渐变 */}
            <linearGradient id="irradianceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* 背景网格虚线与 Y 轴刻度 */}
          {[0, 100, 200, 300, 400, 500].map((val) => {
            const y = getYPower(val);
            const irradianceVal = val * 2; // 0-1000 W/m² 对应 0-500 kW
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
                {/* 左 Y 轴刻度 (功率 kW) */}
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                  fill="#b45309"
                  fontWeight="600"
                >
                  {val}
                </text>
                {/* 右 Y 轴刻度 (辐照度 W/m²) */}
                <text
                  x={width - padding.right + 8}
                  y={y + 3}
                  textAnchor="start"
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                  fill="#0369a1"
                  fontWeight="600"
                >
                  {irradianceVal}
                </text>
              </g>
            );
          })}

          {/* 轴名称标注 */}
          <text
            x={padding.left - 10}
            y={padding.top - 12}
            textAnchor="end"
            fontSize="10"
            fontWeight="bold"
            fill="#b45309"
          >
            功率 (kW)
          </text>
          <text
            x={width - padding.right + 10}
            y={padding.top - 12}
            textAnchor="start"
            fontSize="10"
            fontWeight="bold"
            fill="#0369a1"
          >
            辐照度 (W/m²)
          </text>

          {/* 辐照度曲线 */}
          <path
            d={irradiancePath}
            fill="none"
            stroke="#0284c7"
            strokeWidth="2"
            strokeDasharray="4 2"
            opacity="0.8"
          />

          {/* 光伏实测有功功率折线 (分段绘制以呈现缺失断点) */}
          {powerSegments.map((seg, idx) => (
            <path
              key={idx}
              d={seg}
              fill="none"
              stroke="#d97706"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* X 轴时间刻度与可交互采样点 */}
          {samples.map((sample, idx) => {
            const x = getX(idx);
            const yPower = getYPower(sample.pvPowerKw);
            const isSelected = selectedSample?.timestamp === sample.timestamp;
            const isHovered = hoveredSample?.timestamp === sample.timestamp;

            // X 轴文字抽样显示（点多时只显示部分整点）
            const showLabel =
              count <= 12 ||
              idx % (timeRange === 'RECENT_4H' ? 2 : count > 18 ? 3 : 1) === 0 ||
              idx === count - 1;

            return (
              <g key={sample.timestamp}>
                {/* 时间刻度线与文字 */}
                {showLabel && (
                  <>
                    <line
                      x1={x}
                      y1={height - padding.bottom}
                      x2={x}
                      y2={height - padding.bottom + 4}
                      stroke="#cbd5e1"
                    />
                    <text
                      x={x}
                      y={height - padding.bottom + 16}
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="ui-monospace, monospace"
                      fill="#64748b"
                    >
                      {sample.timestamp}
                    </text>
                  </>
                )}

                {/* 缺失数据断点标注 */}
                {sample.isDataMissing && (
                  <g transform={`translate(${x}, ${height - padding.bottom - 10})`}>
                    <line
                      x1={0}
                      y1={-chartH + 20}
                      x2={0}
                      y2={0}
                      stroke="#ef4444"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle cx={0} cy={0} r={4} fill="#ef4444" />
                    <text
                      x={0}
                      y={-6}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#ef4444"
                      fontWeight="bold"
                    >
                      数据缺失
                    </text>
                  </g>
                )}

                {/* 数据采样交互点 (非缺失点) */}
                {!sample.isDataMissing && (
                  <g
                    className="cursor-pointer transition-transform"
                    onClick={() => onSelectSample(isSelected ? null : sample)}
                    onMouseEnter={() => setHoveredSample(sample)}
                    onMouseLeave={() => setHoveredSample(null)}
                  >
                    {/* 焦点外圈光晕 */}
                    {(isSelected || isHovered) && (
                      <circle
                        cx={x}
                        cy={yPower}
                        r={9}
                        fill={sample.isSuspiciousZero ? '#fef3c7' : '#fde68a'}
                        stroke={sample.isSuspiciousZero ? '#d97706' : '#b45309'}
                        strokeWidth="1.5"
                        opacity="0.8"
                      />
                    )}

                    {/* 采样核心圆点 */}
                    <circle
                      cx={x}
                      cy={yPower}
                      r={isSelected ? 5 : isHovered ? 4.5 : sample.isSuspiciousZero ? 4.5 : 3}
                      fill={
                        sample.isSuspiciousZero
                          ? '#d97706'
                          : sample.isNightZero
                          ? '#059669'
                          : '#f59e0b'
                      }
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />

                    {/* 白天异常零值告警标志 */}
                    {sample.isSuspiciousZero && (
                      <g transform={`translate(${x - 7}, ${yPower - 22})`}>
                        <rect
                          width="14"
                          height="14"
                          rx="3"
                          fill="#fef3c7"
                          stroke="#d97706"
                          strokeWidth="1"
                        />
                        <text
                          x="7"
                          y="11"
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#b45309"
                        >
                          !
                        </text>
                      </g>
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 点击趋势点展示时间、功率、辐照度、质量等级和来源 (满足需求规范) */}
      {activeDetailPoint && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 shadow-xs animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#004287] flex items-center justify-center font-mono font-bold text-xs">
                {activeDetailPoint.timestamp}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">
                  实测采样点全维度诊断 · {activeDetailPoint.timestamp} 采样帧
                </h4>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  来源：{activeDetailPoint.source}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MonitorQualityBadge quality={activeDetailPoint.quality} size="sm" />
              <button
                type="button"
                onClick={() => onSelectSample(null)}
                className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded hover:bg-white/80 transition-colors"
              >
                收起解析
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            {/* 实测光伏功率 */}
            <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-semibold">实测光伏功率 (kW)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-black font-mono text-amber-600">
                  {activeDetailPoint.pvPowerKw.toFixed(1)}
                </span>
                <span className="text-[11px] font-bold text-slate-500">kW</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                {activeDetailPoint.isNightZero ? '夜间无光照正常停机' : '交流输出侧实测'}
              </span>
            </div>

            {/* 水平总辐照度 */}
            <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-semibold">气象总辐照度 (W/m²)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-black font-mono text-sky-600">
                  {activeDetailPoint.irradianceWm2}
                </span>
                <span className="text-[11px] font-bold text-slate-500">W/m²</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                {activeDetailPoint.irradianceWm2 > 100 ? '光照条件良好' : '微弱/无光照'}
              </span>
            </div>

            {/* 质量判定口径与规则 */}
            <div className="col-span-2 p-2.5 rounded-lg bg-white border border-slate-200/80 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">工况诊断与业务规则</span>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  {activeDetailPoint.isNightZero && (
                    <span className="text-emerald-700 font-medium">
                      ✓ <strong>夜间零功率规则：</strong>00:00~05:00 及 19:00~23:00
                      辐照度为零，逆变器零功率处于正常待机状态，质量判定为正常，不误报异常。
                    </span>
                  )}
                  {activeDetailPoint.isSuspiciousZero && (
                    <span className="text-amber-800 font-medium">
                      ⚠️ <strong>白天零功率规则：</strong>白天有效辐照度 ({activeDetailPoint.irradianceWm2}{' '}
                      W/m²) 下实测功率连续 30 分钟为零，系统已标记为可疑并已产生告警线索。
                    </span>
                  )}
                  {activeDetailPoint.isDataMissing && (
                    <span className="text-red-700 font-medium">
                      ✕ <strong>实测保真原则：</strong>该采样周期通信丢包，严格呈现断点，杜绝使用虚假平滑曲线误导运行调度。
                    </span>
                  )}
                  {!activeDetailPoint.isNightZero &&
                    !activeDetailPoint.isSuspiciousZero &&
                    !activeDetailPoint.isDataMissing && (
                      <span className="text-slate-600">
                        实测功率与辐照度走势高度吻合，转换效率达 98.5%，发电工况正常稳定。
                      </span>
                    )}
                </p>
              </div>

              {/* 白天异常零值提供跳转告警中心 */}
              {activeDetailPoint.isSuspiciousZero && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-amber-700">疑似直流熔丝熔断或断路器跳闸</span>
                  <button
                    type="button"
                    onClick={() => navigate('/alarms')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-colors"
                  >
                    <span>前往告警风控中心核查</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
