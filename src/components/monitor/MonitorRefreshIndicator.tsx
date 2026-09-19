import React from 'react';
import { RefreshCw, Play, Pause, AlertTriangle, ShieldCheck, Lock, Radio } from 'lucide-react';

interface MonitorRefreshIndicatorProps {
  countdown: number;
  refreshIntervalSeconds: number;
  onSetRefreshInterval: (seconds: number) => void;
  isStreamInterrupted: boolean;
  onToggleStreamInterrupted: () => void;
  onResumeStream: () => void;
  lastUpdatedTime: string;
  siteCode?: string;
  siteName?: string;
  className?: string;
}

export const MonitorRefreshIndicator: React.FC<MonitorRefreshIndicatorProps> = ({
  countdown,
  refreshIntervalSeconds,
  onSetRefreshInterval,
  isStreamInterrupted,
  onToggleStreamInterrupted,
  onResumeStream,
  lastUpdatedTime,
  siteCode = 'SITE-001',
  siteName = '微电网示范站',
  className = '',
}) => {
  // 进度条百分比 (0 到 100)
  const progressPercent = isStreamInterrupted
    ? 0
    : Math.max(0, Math.min(100, ((refreshIntervalSeconds - countdown) / refreshIntervalSeconds) * 100));

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs ${className}`}
    >
      {/* 站点与模式标识 */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <Radio
            className={`w-4 h-4 ${
              isStreamInterrupted ? 'text-red-500 animate-none' : 'text-emerald-500 animate-pulse'
            }`}
          />
          <span>{siteName}</span>
          <span className="text-[10px] font-mono text-slate-400 font-normal">({siteCode})</span>
        </div>

        <span className="h-3 w-[1px] bg-slate-200" />

        {/* 只读监控徽标 */}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <Lock className="w-3 h-3 text-slate-500" />
          <span>只读监控模式</span>
        </span>
      </div>

      {/* 刷新周期与流状态控制 */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* 数据更新时间 */}
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="text-slate-400">更新基准:</span>
          <span className="font-mono font-bold text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
            {lastUpdatedTime}
          </span>
        </div>

        {/* 流状态与倒计时指示 */}
        {!isStreamInterrupted ? (
          <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200/70 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-emerald-800 font-medium text-[11px]">
              推流中 ({countdown}s 后刷新)
            </span>
            <div className="w-12 h-1.5 bg-emerald-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span className="text-red-700 font-semibold text-[11px]">实时流已中断·更新停止</span>
            <button
              onClick={onResumeStream}
              className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] shadow-2xs transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>恢复数据流</span>
            </button>
          </div>
        )}

        {/* 刷新速度切换 (标准 15s / 加速 5s) */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-medium border border-slate-200/70">
          <button
            onClick={() => onSetRefreshInterval(15)}
            className={`px-2 py-1 rounded transition-all ${
              refreshIntervalSeconds === 15
                ? 'bg-white text-slate-900 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            标准 (15s)
          </button>
          <button
            onClick={() => onSetRefreshInterval(5)}
            className={`px-2 py-1 rounded transition-all ${
              refreshIntervalSeconds === 5
                ? 'bg-white text-slate-900 font-bold shadow-2xs text-blue-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            加速 (5s)
          </button>
        </div>

        {/* 模拟断线测试开关 */}
        <button
          onClick={onToggleStreamInterrupted}
          className={`px-2 py-1 rounded border text-[11px] font-medium transition-colors flex items-center gap-1 ${
            isStreamInterrupted
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
          title={isStreamInterrupted ? '恢复数据推送' : '模拟推流网络中断，停止更新时间'}
        >
          {isStreamInterrupted ? (
            <>
              <Play className="w-3 h-3" />
              <span>恢复推送</span>
            </>
          ) : (
            <>
              <Pause className="w-3 h-3" />
              <span>模拟断线</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
