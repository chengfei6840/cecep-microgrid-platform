import React from 'react';
import { PvInverterDetail } from '../../types/monitor';
import { StatusBadge } from '../common/StatusBadge';
import { MonitorQualityBadge } from './MonitorQualityBadge';
import {
  X,
  Lock,
  SunMedium,
  Thermometer,
  Zap,
  Radio,
  Clock,
  ShieldCheck,
  AlertOctagon,
  ExternalLink,
  Layers,
  ArrowRight,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PvInverterDrawerProps {
  inverter: PvInverterDetail | null;
  onClose: () => void;
}

export const PvInverterDrawer: React.FC<PvInverterDrawerProps> = ({
  inverter,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!inverter) return null;

  const isAlarm = inverter.status === 'ALARM';
  const isSuspicious = inverter.status === 'SUSPICIOUS';
  const isOffline = inverter.status === 'OFFLINE';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 遮罩背景 */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* 抽屉头部 */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <SunMedium className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{inverter.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                    <span>{inverter.id}</span>
                    <span>·</span>
                    <span>{inverter.siteId}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={inverter.status} size="sm" />
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 只读监控声明 */}
            <div className="mt-3 p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>
                <strong>只读监控保护：</strong>本监测视图仅供工况观察与数据质量诊断，禁止直接下发逆变器远程启停或无功/有功调节调度指令。
              </span>
            </div>
          </div>

          {/* 抽屉内容主体 (可滚动) */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs">
            {/* 1. 核心监测指标速览 (当前功率、日发电量、温度、额定功率) */}
            <div className="grid grid-cols-2 gap-3">
              {/* 当前功率 */}
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70">
                <span className="text-[10px] text-amber-700 block font-semibold">当前实测功率</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black font-mono text-slate-900">
                    {inverter.currentPowerKw.toFixed(1)}
                  </span>
                  <span className="text-xs font-bold text-slate-600 font-mono">kW</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">交流并网侧</span>
              </div>

              {/* 今日发电量 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-semibold">今日累计发电量</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black font-mono text-slate-900">
                    {inverter.dailyYieldKwh.toLocaleString('zh-CN', { minimumFractionDigits: 1 })}
                  </span>
                  <span className="text-xs font-bold text-slate-600 font-mono">kWh</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">日内电量连续积分</span>
              </div>

              {/* 机内运行温度 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-semibold">机内 IGBT 模块温度</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black font-mono text-slate-900">
                    {inverter.temperatureC.toFixed(1)}
                  </span>
                  <span className="text-xs font-bold text-slate-600">℃</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  工作温升正常 (阈值 80℃)
                </span>
              </div>

              {/* 转换效率与额定功率 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-semibold">额定功率与效率</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black font-mono text-slate-900">
                    {inverter.ratedCapacity}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold">
                  最大效率 {inverter.efficiencyPercent || 98.6}%
                </span>
              </div>
            </div>

            {/* 2. 设备硬件与规格属性 (型号、额定功率、制造厂商、适配器) */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>设备硬件与出厂规格</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block">制造厂商</span>
                  <span className="font-semibold text-slate-800">{inverter.manufacturer}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">设备型号</span>
                  <span className="font-semibold text-slate-800 font-mono">{inverter.model}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">交流并网额定电压</span>
                  <span className="font-semibold text-slate-800 font-mono">800V AC (三相)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">最大直流输入电压</span>
                  <span className="font-semibold text-slate-800 font-mono">1500V DC</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200">
                  <span className="text-[10px] text-slate-400 block">数采网关与协议</span>
                  <span className="font-mono text-slate-700">
                    {inverter.sourcePlatform || inverter.sourceAdapterId}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. 关联遥测点位与数据质量诊断 */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-600" />
                  <span>关联实时遥测点位与质量校验</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400 font-normal">
                  共 {inverter.points.length} 个标准指标测点
                </span>
              </h4>

              <div className="space-y-2">
                {inverter.points.map((pt) => (
                  <div
                    key={pt.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900">{pt.pointName}</div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {pt.id} · {pt.standardCode}
                        </div>
                      </div>
                      <MonitorQualityBadge
                        quality={pt.quality}
                        source={pt.qualitySource}
                        reason={pt.qualityReason}
                        lastUpdated={pt.lastUpdated}
                        size="sm"
                      />
                    </div>

                    <div className="flex items-baseline justify-between bg-slate-50 p-2 rounded border border-slate-100">
                      <div className="flex items-baseline gap-1 font-mono">
                        <span className="text-lg font-black text-slate-900">
                          {pt.formattedValue}
                        </span>
                        <span className="font-bold text-slate-600 text-xs">{pt.unit}</span>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                        {pt.timeScope === 'REALTIME' ? '瞬时实测' : '今日累计'}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 space-y-0.5 bg-slate-50/60 p-2 rounded">
                      <div>
                        <span className="text-slate-400">规约来源: </span>
                        <span className="font-mono">{pt.qualitySource}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">质量诊断: </span>
                        <span>{pt.qualityReason}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">上报时间: </span>
                        <span className="font-mono">{pt.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. 近期告警与处置联动 */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-slate-500" />
                <span>近期告警事件与风险诊断</span>
              </h4>

              {inverter.linkedAlarms && inverter.linkedAlarms.length > 0 ? (
                <div className="space-y-2">
                  {inverter.linkedAlarms.map((alarm) => (
                    <div
                      key={alarm.id}
                      className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-900 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <AlertOctagon className="w-4 h-4 text-red-600" />
                          <span>{alarm.title}</span>
                        </span>
                        <span className="text-[10px] font-mono text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                          {alarm.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-red-700 leading-relaxed">
                        {alarm.description}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-red-500 font-mono pt-1">
                        <span>发生时刻: {alarm.time}</span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate('/alarms');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-2xs transition-colors"
                        >
                          <span>前往告警中心</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px]">
                    该逆变器运行工况优良，近 72 小时无待处理告警或跳闸事件。
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 抽屉底部 */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 font-mono">
              通信刷新: {inverter.lastDataTime}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md font-medium text-xs hover:bg-slate-50 transition-colors shadow-2xs"
            >
              关闭抽屉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
