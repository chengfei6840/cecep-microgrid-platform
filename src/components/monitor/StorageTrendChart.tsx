import React, { useState } from 'react';
import { StorageTrendSample } from '../../types/monitor';
import { MonitorQualityBadge } from './MonitorQualityBadge';
import {
  BatteryCharging,
  Zap,
  Clock,
  AlertTriangle,
  Info,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StorageTrendChartProps {
  samples: StorageTrendSample[];
  timeRange: 'TODAY' | 'RECENT_4H' | 'YESTERDAY';
  onChangeTimeRange: (range: 'TODAY' | 'RECENT_4H' | 'YESTERDAY') => void;
  isScenarioBExpired?: boolean;
  emsFrozenTimestamp?: string;
  className?: string;
}

export const StorageTrendChart: React.FC<StorageTrendChartProps> = ({
  samples,
  timeRange,
  onChangeTimeRange,
  isScenarioBExpired = false,
  emsFrozenTimestamp = '2026-09-05 05:37:12',
  className = '',
}) => {
  const navigate = useNavigate();
  const [hoveredSample, setHoveredSample] = useState<StorageTrendSample | null>(null);
  const [selectedSample, setSelectedSample] = useState<StorageTrendSample | null>(null);

  // SVG 坐标系参数 (高对比度精细绘制)
  const width = 880;
  const height = 320;
  const padding = { top: 30, right: 65, bottom: 45, left: 65 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // 标尺上限：
  // 左轴：PCS 功率 -500 kW ~ +500 kW (0 kW 位于垂直正中)
  // 右轴：SOC 0% ~ 100%
  const minPower = -500;
  const maxPower = 500;

  const count = samples.length;
  const getX = (index: number) => {
    if (count <= 1) return padding.left;
    return padding.left + (index / (count - 1)) * chartW;
  };

  // 左轴功率 Y 坐标 (0kW 正中)
  const getYPower = (kw: number | null) => {
    if (kw === null) return padding.top + chartH / 2;
    const clamped = Math.max(minPower, Math.min(maxPower, kw));
    // -500kw 位于底部, +500kw 位于顶部, 0kw 位于中线
    const normalized = (clamped - minPower) / (maxPower - minPower); // 0 到 1
    return padding.top + chartH - normalized * chartH;
  };

  // 0kW 中轴线 Y 坐标
  const yZero = padding.top + chartH / 2;

  // 右轴 SOC Y 坐标 (0% 底部, 100% 顶部)
  const getYSoc = (soc: number | null) => {
    if (soc === null) return padding.top + chartH;
    const clamped = Math.max(0, Math.min(100, soc));
    return padding.top + chartH - (clamped / 100) * chartH;
  };

  // 生成 PCS 功率折线 (处理真实断线缺口，不连续拼接)
  const powerSegments: string[] = [];
  let curPowerSegment = '';

  samples.forEach((s, i) => {
    if (s.isDataMissing || s.pcsPowerKw === null) {
      if (curPowerSegment) {
        powerSegments.push(curPowerSegment);
        curPowerSegment = '';
      }
    } else {
      const x = getX(i);
      const y = getYPower(s.pcsPowerKw);
      if (!curPowerSegment) {
        curPowerSegment = `M ${x} ${y}`;
      } else {
        curPowerSegment += ` L ${x} ${y}`;
      }
    }
  });
  if (curPowerSegment) powerSegments.push(curPowerSegment);

  // 生成 SOC 折线 (处理真实断线缺口)
  const socSegments: string[] = [];
  let curSocSegment = '';

  samples.forEach((s, i) => {
    if (s.isDataMissing || s.socPercent === null) {
      if (curSocSegment) {
        socSegments.push(curSocSegment);
        curSocSegment = '';
      }
    } else {
      const x = getX(i);
      const y = getYSoc(s.socPercent);
      if (!curSocSegment) {
        curSocSegment = `M ${x} ${y}`;
      } else {
        curSocSegment += ` L ${x} ${y}`;
      }
    }
  });
  if (curSocSegment) socSegments.push(curSocSegment);

  // 找出第一个断点索引 (用于绘制断点标记与缺口阴影区域)
  const firstMissingIndex = samples.findIndex((s) => s.isDataMissing || s.pcsPowerKw === null);
  const hasMissingGap = firstMissingIndex !== -1;
  const missingStartX = hasMissingGap ? getX(firstMissingIndex) : 0;
  const missingEndX = padding.left + chartW;

  const activePoint = selectedSample || hoveredSample;

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4 ${className}`}>
      {/* 顶部标题与时段切换 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              PCS 充放电功率与电池 SOC 双轴实测趋势
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              双轴无预测实测
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            <strong>功率符号规范：</strong>正值 (+) 表示向电网放电输出，负值 (-) 表示从电网吸收充电；右轴严格跟踪电池组能量状态 (SOC 0%~100%)。
          </p>
        </div>

        {/* 时间切片选择器 */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-lg">
          {[
            { key: 'TODAY', label: '今日实测 (24H)' },
            { key: 'RECENT_4H', label: '断网高频视窗 (4H)' },
            { key: 'YESTERDAY', label: '昨日完整循环' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                onChangeTimeRange(tab.key as any);
                setSelectedSample(null);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                timeRange === tab.key
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 场景 B 异常警示横幅与断点提示 */}
      {isScenarioBExpired && (
        <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-red-950">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 animate-bounce" />
            <div>
              <strong className="text-red-900">时代星云 EMS 本地网关通信中断：</strong>
              <span className="text-red-800 ml-1">
                最后有效心跳采样停滞于 <strong>{emsFrozenTimestamp}</strong>。为保障调度安全，系统已<strong>切断虚假数值延展与平滑插值</strong>，曲线呈现真实断开缺口。
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/data/quality?deviceId=DEV-STORAGE-PCS01')}
              className="px-2.5 py-1 rounded bg-white hover:bg-red-100 text-red-800 border border-red-300 font-bold transition-colors inline-flex items-center gap-1"
            >
              <span>查看质量凭证</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/alarms?deviceId=DEV-STORAGE-PCS01')}
              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold transition-colors inline-flex items-center gap-1"
            >
              <span>查看关联告警</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 图例栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-1 bg-[#004287] rounded" />
            <span className="font-semibold text-slate-800">PCS 变流器实时功率 (kW)</span>
            <span className="text-[10px] text-slate-500 font-mono">(+放 / -充)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-1 bg-amber-500 rounded stroke-dasharray" />
            <span className="font-semibold text-slate-800">电池荷电状态 SOC (%)</span>
            <span className="text-[10px] text-slate-500 font-mono">(0~100%)</span>
          </div>

          {hasMissingGap && (
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3 bg-red-100 border border-dashed border-red-400 rounded" />
              <span className="font-semibold text-red-700">断线真实缺口 (无平滑插值)</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          <span>左轴: -500kW~+500kW</span>
          <span className="mx-1.5">·</span>
          <span>右轴: 0%~100%</span>
        </div>
      </div>

      {/* SVG 矢量趋势图 */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[650px] overflow-visible select-none"
        >
          {/* 背景网格 */}
          <rect
            x={padding.left}
            y={padding.top}
            width={chartW}
            height={chartH}
            fill="#fafbfc"
            stroke="#e2e8f0"
            strokeWidth="1"
          />

          {/* 0 kW 基准水平线 (突出展示正负分界) */}
          <line
            x1={padding.left}
            y1={yZero}
            x2={padding.left + chartW}
            y2={yZero}
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text
            x={padding.left + 8}
            y={yZero - 5}
            fill="#64748b"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            0 kW 待机分界线 (上方放电 + / 下方充电 -)
          </text>

          {/* 辅助水平网格线 */}
          {[250, -250].map((kw) => {
            const y = getYPower(kw);
            return (
              <g key={kw}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {kw > 0 ? `+${kw}` : kw}
                </text>
              </g>
            );
          })}

          {/* 左 Y 轴刻度文字 (功率 kW) */}
          <text
            x={padding.left - 8}
            y={padding.top + 5}
            textAnchor="end"
            fill="#004287"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            +500 kW
          </text>
          <text
            x={padding.left - 8}
            y={padding.top + chartH}
            textAnchor="end"
            fill="#004287"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            -500 kW
          </text>
          <text
            x={padding.left - 48}
            y={padding.top + chartH / 2}
            textAnchor="middle"
            fill="#004287"
            fontSize="10"
            fontWeight="bold"
            transform={`rotate(-90 ${padding.left - 48} ${padding.top + chartH / 2})`}
          >
            PCS 有功功率 (kW)
          </text>

          {/* 右 Y 轴刻度文字 (SOC %) */}
          {[0, 25, 50, 75, 100].map((soc) => {
            const y = getYSoc(soc);
            return (
              <g key={soc}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke="#f8fafc"
                  strokeWidth="0.5"
                />
                <text
                  x={padding.left + chartW + 8}
                  y={y + 3}
                  textAnchor="start"
                  fill="#d97706"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {soc}%
                </text>
              </g>
            );
          })}
          <text
            x={padding.left + chartW + 45}
            y={padding.top + chartH / 2}
            textAnchor="middle"
            fill="#d97706"
            fontSize="10"
            fontWeight="bold"
            transform={`rotate(90 ${padding.left + chartW + 45} ${padding.top + chartH / 2})`}
          >
            电池 SOC (%)
          </text>

          {/* X 轴时间刻度文字 */}
          {samples.map((s, i) => {
            const x = getX(i);
            const isStep =
              count <= 12 ? true : count <= 24 ? i % 3 === 0 || i === count - 1 : i % 2 === 0;
            if (!isStep) return null;
            return (
              <g key={s.timestamp}>
                <line
                  x1={x}
                  y1={padding.top + chartH}
                  x2={x}
                  y2={padding.top + chartH + 5}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padding.top + chartH + 18}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {s.timestamp}
                </text>
              </g>
            );
          })}

          {/* 场景 B 缺口区域阴影填充 (真实断线缺口) */}
          {hasMissingGap && (
            <g>
              <rect
                x={missingStartX}
                y={padding.top}
                width={missingEndX - missingStartX}
                height={chartH}
                fill="#fee2e2"
                fillOpacity="0.4"
                stroke="#f87171"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              <line
                x1={missingStartX}
                y1={padding.top}
                x2={missingStartX}
                y2={padding.top + chartH}
                stroke="#ef4444"
                strokeWidth="2"
              />
              {/* 断点标注 */}
              <rect
                x={missingStartX + 6}
                y={padding.top + 10}
                width={170}
                height={22}
                rx="4"
                fill="#b91c1c"
              />
              <text
                x={missingStartX + 12}
                y={padding.top + 25}
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                05:37:12 EMS 断线真实缺口
              </text>
            </g>
          )}

          {/* 绘制 SOC 曲线段 */}
          {socSegments.map((d, idx) => (
            <path
              key={`soc-${idx}`}
              d={d}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="5 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* 绘制 PCS 功率曲线段 */}
          {powerSegments.map((d, idx) => (
            <path
              key={`power-${idx}`}
              d={d}
              fill="none"
              stroke="#004287"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* 绘制交互式数据点与热区 */}
          {samples.map((s, i) => {
            const x = getX(i);
            const isMissing = s.isDataMissing || s.pcsPowerKw === null;
            const yP = isMissing ? yZero : getYPower(s.pcsPowerKw);
            const yS = isMissing ? yZero : getYSoc(s.socPercent);
            const isHovered = hoveredSample?.timestamp === s.timestamp;
            const isSelected = selectedSample?.timestamp === s.timestamp;

            return (
              <g key={s.timestamp}>
                {/* 触发热区 */}
                <rect
                  x={x - chartW / (count * 2)}
                  y={padding.top}
                  width={chartW / count}
                  height={chartH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredSample(s)}
                  onMouseLeave={() => setHoveredSample(null)}
                  onClick={() => setSelectedSample(s)}
                />

                {/* 正常采样点小圆圈 */}
                {!isMissing && (
                  <>
                    <circle
                      cx={x}
                      cy={yP}
                      r={isHovered || isSelected ? 5.5 : 3}
                      fill={s.pcsPowerKw && s.pcsPowerKw < 0 ? '#2563eb' : '#059669'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <circle
                      cx={x}
                      cy={yS}
                      r={isHovered || isSelected ? 4.5 : 2.5}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </>
                )}

                {/* 断网缺失点标记 */}
                {isMissing && (
                  <circle
                    cx={x}
                    cy={yZero}
                    r={3}
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}

                {/* 选中高亮垂直指示线 */}
                {(isHovered || isSelected) && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + chartH}
                    stroke="#004287"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 底部点选或悬浮数据详情卡 */}
      {activePoint ? (
        <div
          className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
            activePoint.isDataMissing
              ? 'bg-red-50/90 border-red-200 text-red-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold font-mono text-sm">
                采样时刻: {activePoint.timestamp}
              </span>
              <MonitorQualityBadge
                quality={activePoint.quality}
                source={activePoint.source}
                reason={activePoint.missingReason}
                size="sm"
              />
              {activePoint.operatingState && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    activePoint.operatingState === 'CHARGING'
                      ? 'bg-blue-100 text-blue-800'
                      : activePoint.operatingState === 'DISCHARGING'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activePoint.operatingState === 'STANDBY'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {activePoint.operatingState === 'CHARGING'
                    ? '低谷充电'
                    : activePoint.operatingState === 'DISCHARGING'
                    ? '尖峰放电'
                    : activePoint.operatingState === 'STANDBY'
                    ? '待机'
                    : '通信中断'}
                </span>
              )}
            </div>

            {activePoint.isDataMissing ? (
              <p className="text-[11px] text-red-700 font-medium">
                {activePoint.missingReason || '当前时段无 EMS 遥测帧上报，系统拒绝进行线性平滑伪装'}
              </p>
            ) : (
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1">
                  <span className="text-slate-500 font-sans">PCS出力:</span>
                  <strong
                    className={
                      Number(activePoint.pcsPowerKw) < 0
                        ? 'text-blue-700 font-bold'
                        : Number(activePoint.pcsPowerKw) > 0
                        ? 'text-emerald-700 font-bold'
                        : 'text-slate-800'
                    }
                  >
                    {activePoint.pcsPowerKw} kW
                  </strong>
                  <span className="text-[10px] text-slate-500 font-sans">
                    ({Number(activePoint.pcsPowerKw) < 0 ? '负值充电' : Number(activePoint.pcsPowerKw) > 0 ? '正值放电' : '待机'})
                  </span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <span className="text-slate-500 font-sans">荷电状态(SOC):</span>
                  <strong className="text-amber-700 font-bold">{activePoint.socPercent}%</strong>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {activePoint.isDataMissing ? (
              <button
                type="button"
                onClick={() => navigate('/data/quality?deviceId=DEV-STORAGE-PCS01')}
                className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs"
              >
                <span>追溯数据质量异常</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedSample(null)}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                关闭详情
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-lg text-center text-xs text-slate-500">
          鼠标悬停或点击曲线上任意数据点，即可查看该采样时刻的 PCS 充放电功率、SOC、质量等级及规约溯源。
        </div>
      )}
    </div>
  );
};
