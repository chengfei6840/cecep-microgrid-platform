import React, { useState } from 'react';
import { StoragePcsDetail } from '../../types/monitor';
import { StatusBadge } from '../common/StatusBadge';
import { MonitorQualityBadge } from './MonitorQualityBadge';
import {
  X,
  Zap,
  Shield,
  ShieldAlert,
  Clock,
  ExternalLink,
  Lock,
  Thermometer,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StoragePcsDrawerProps {
  pcs: StoragePcsDetail | null;
  onClose: () => void;
}

export const StoragePcsDrawer: React.FC<StoragePcsDrawerProps> = ({ pcs, onClose }) => {
  const navigate = useNavigate();
  const [showActionFeedback, setShowActionFeedback] = useState<string | null>(null);

  if (!pcs) return null;

  const isCharging = pcs.activePowerKw < 0;
  const isDischarging = pcs.activePowerKw > 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden text-slate-800 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. 抽屉顶部头部 */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                pcs.status === 'ALARM'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-[#004287]'
              }`}
            >
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  PCS-500K
                </span>
                <h2 className="text-base font-bold text-slate-900">{pcs.name}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                设备编号: <span className="font-mono">{pcs.id}</span> · 制造厂商: {pcs.manufacturer} · 型号: {pcs.model}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={pcs.status} size="md" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              title="关闭抽屉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. 抽屉内容主体 (可纵向滚动) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* 只读保护警示横幅 */}
          <div className="p-3.5 bg-slate-100/90 border border-slate-200 rounded-xl flex items-start gap-3 text-slate-700 shadow-2xs">
            <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-900 block text-xs">
                工业网络安全受控只读工作台 (IEC 62443 标准)
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                当前用户角色仅具备现场运行工况监视权限。系统严禁在此页面执行<strong>变流器启停开关、有功无功参数调节、功率因数强制设定或下行复位</strong>指令。
              </p>
            </div>
          </div>

          {/* 实时电气运行状态与四象限遥测 */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-600" />
                PCS 实时电气参数与四象限运行状态
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                额定容量: 500 kW / 360 A
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 text-[11px] block">实时出力功率</span>
                <span
                  className={`font-mono font-black text-base flex items-center gap-1 mt-0.5 ${
                    isCharging
                      ? 'text-blue-700'
                      : isDischarging
                      ? 'text-emerald-700'
                      : 'text-slate-800'
                  }`}
                >
                  {isCharging && <ArrowDownRight className="w-4 h-4 text-blue-600" />}
                  {isDischarging && <ArrowUpRight className="w-4 h-4 text-emerald-600" />}
                  {pcs.activePowerKw} kW
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {isCharging ? '吸收电网电能 (充电)' : isDischarging ? '向电网放电 (输出)' : '待机'}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 text-[11px] block">交流侧线电压</span>
                <span className="font-mono font-black text-base text-slate-800 mt-0.5">
                  {pcs.acVoltageV} V
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">三相 400V 系统</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 text-[11px] block">交流侧线电流</span>
                <span className="font-mono font-black text-base text-slate-800 mt-0.5">
                  {pcs.acCurrentA} A
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">实时交流有效值</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 text-[11px] block">电网频率 / 因数</span>
                <span className="font-mono font-black text-base text-slate-800 mt-0.5">
                  {pcs.frequencyHz} Hz
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  功率因数: {pcs.powerFactor}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 text-[11px] block">IGBT 桥臂结温</span>
                <span className="font-mono font-black text-base text-slate-800 mt-0.5 flex items-center gap-1">
                  <Thermometer className="w-4 h-4 text-amber-500" />
                  {pcs.igbtTempC} ℃
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">超温跳闸限值 85℃</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 text-[11px] block">双向变流转换效率</span>
                <span className="font-mono font-black text-base text-emerald-700 mt-0.5">
                  {pcs.conversionEfficiency} %
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">高频 PWM 调制整流</span>
              </div>
            </div>
          </div>

          {/* 三级保护整定阈值 (过流/过压/欠压/过频/防孤岛) */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                变流器并网与电气安全保护整定门槛
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                硬件级保护闭锁
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">交流侧过流瞬时跳闸门槛</span>
                  <span className="text-[10px] text-slate-500">I_trip 保护阈值</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {pcs.protectionThresholds.overCurrentA} A
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">交流侧过压保护阈值</span>
                  <span className="text-[10px] text-slate-500">U_max 保护动作</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {pcs.protectionThresholds.overVoltageV} V
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">交流侧欠压跳闸阈值</span>
                  <span className="text-[10px] text-slate-500">U_min 保护动作</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {pcs.protectionThresholds.underVoltageV} V
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">防孤岛主动脱网时延</span>
                  <span className="text-[10px] text-slate-500">Anti-Islanding</span>
                </div>
                <span className="font-mono font-bold text-emerald-700">
                  ≤ {pcs.protectionThresholds.antiIslandingDelayMs} ms
                </span>
              </div>
            </div>
          </div>

          {/* 规约链路与时钟来源 */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Clock className="w-4 h-4 text-blue-600" />
              规约链路、时钟与数据质量溯源
            </span>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">上行采集协议:</span>
                <span className="font-mono text-slate-800 font-semibold">{pcs.sourcePlatform}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">规约适配器编号:</span>
                <span className="font-mono text-slate-800">{pcs.sourceAdapterId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">最后刷新时间戳:</span>
                <span className="font-mono text-slate-800">{pcs.lastDataTime}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-500">当前数据质量状态:</span>
                <div className="flex items-center gap-2">
                  <MonitorQualityBadge
                    quality={pcs.status === 'ALARM' ? 'EXPIRED' : 'NORMAL'}
                    source={pcs.sourcePlatform}
                    reason={
                      pcs.status === 'ALARM'
                        ? 'EMS 通信中断导致遥测冻结，禁止作为实时控制依据'
                        : '规约通信正常，全遥测帧校验通过'
                    }
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={() => navigate('/data/quality?deviceId=DEV-STORAGE-PCS01')}
                    className="text-blue-600 hover:text-blue-800 underline font-semibold flex items-center gap-0.5"
                  >
                    <span>跳转质量中心</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 关联告警列表 */}
          {pcs.linkedAlarms && pcs.linkedAlarms.length > 0 && (
            <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-950 text-xs flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  当前活动关联告警 ({pcs.linkedAlarms.length})
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/alarms?deviceId=DEV-STORAGE-PCS01')}
                  className="text-xs text-red-700 hover:text-red-900 font-bold underline inline-flex items-center gap-1"
                >
                  <span>前往告警中心处置</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {pcs.linkedAlarms.map((a) => (
                <div
                  key={a.id}
                  className="p-2.5 bg-white/90 rounded-lg border border-red-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-900">{a.title}</span>
                    <span className="font-mono text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">
                      {a.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{a.description}</p>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    触发时间: {a.time}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 反馈信息弹窗 */}
          {showActionFeedback && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{showActionFeedback}</span>
              </div>
              <button
                onClick={() => setShowActionFeedback(null)}
                className="text-blue-500 hover:text-blue-700 font-bold p-1"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* 3. 抽屉底部操作栏 (只读规范：仅允许查看处置建议与生成巡检工单导航) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>只读监视保护中 · 严禁远程下发启停指令</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowActionFeedback('已调取《时代星云 NEB-500K 储能变流器应急处置预案 S-04》，建议运维班组优先核验网关交换机指示灯与直流侧接触器状态。');
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition-colors flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>查看处置建议</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowActionFeedback('已成功登记现场巡检任务工单【WO-20260905-PCS01】，已派发至运维班组企业微信与工单待办库。');
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#004287] hover:bg-[#00366f] text-white font-bold transition-colors flex items-center gap-1 shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>生成现场巡检工单</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
