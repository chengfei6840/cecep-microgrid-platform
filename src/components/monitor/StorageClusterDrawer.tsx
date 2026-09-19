import React, { useState } from 'react';
import { StorageBatteryClusterDetail } from '../../types/monitor';
import { StatusBadge } from '../common/StatusBadge';
import { MonitorQualityBadge } from './MonitorQualityBadge';
import {
  X,
  Battery,
  Shield,
  Clock,
  ExternalLink,
  Lock,
  Thermometer,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  BarChart2,
  ShieldAlert,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StorageClusterDrawerProps {
  cluster: StorageBatteryClusterDetail | null;
  onClose: () => void;
}

export const StorageClusterDrawer: React.FC<StorageClusterDrawerProps> = ({
  cluster,
  onClose,
}) => {
  const navigate = useNavigate();
  const [showFeedback, setShowFeedback] = useState<string | null>(null);

  if (!cluster) return null;

  // 模拟代表性 24 节单体电压样本分布 (240 节电芯中每 10 节抽检 1 节)
  const cellVoltageSamples = Array.from({ length: 24 }).map((_, i) => {
    const isMax = i === 4; // Cell #42 附近
    const isMin = i === 10; // Cell #108 附近
    let v = 3.248 + Math.sin(i * 1.3) * 0.005;
    if (isMax) v = cluster.maxCellVoltageV;
    if (isMin) v = cluster.minCellVoltageV;
    return {
      index: (i + 1) * 10,
      voltage: Number(v.toFixed(3)),
      isMax,
      isMin,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden text-slate-800 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. 抽屉头部 */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                cluster.status === 'ALARM'
                  ? 'bg-red-100 text-red-700'
                  : cluster.isSuspicious
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <Battery className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Rack-{cluster.clusterIndex.toString().padStart(2, '0')}
                </span>
                <h2 className="text-base font-bold text-slate-900">{cluster.name}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                设备编号: <span className="font-mono">{cluster.id}</span> · 电芯数量: {cluster.cellCount} 串 · 容量: {cluster.ratedCapacityKwh} kWh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={cluster.status} size="md" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              title="关闭抽屉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. 抽屉滚动主体 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* 只读保护警示横幅 */}
          <div className="p-3.5 bg-slate-100/90 border border-slate-200 rounded-xl flex items-start gap-3 text-slate-700 shadow-2xs">
            <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-900 block text-xs">
                BMS 簇控系统安全只读工作台 (IEC 62443 标准)
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                当前运行工作台仅用于电池簇微观单体电气与温度状态监视。系统严格封锁任何<strong>强制开闭主接触器、重置过温门槛、或修改主动均衡参数</strong>的控制指令。
              </p>
            </div>
          </div>

          {/* 可疑状态提示 */}
          {cluster.isSuspicious && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-950 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <strong className="text-amber-900 block">触发电池簇电芯温差偏大预警：</strong>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {cluster.suspiciousReason || '电芯最大温差超过安全警戒线，建议现场检查水冷分流回路'}
                </p>
                <div className="pt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/data/quality?deviceId=DEV-STORAGE-CLUS03')}
                    className="text-amber-900 underline font-bold inline-flex items-center gap-0.5"
                  >
                    <span>跳转数据质量中心</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/alarms?deviceId=DEV-STORAGE-CLUS03')}
                    className="text-amber-900 underline font-bold inline-flex items-center gap-0.5"
                  >
                    <span>跳转告警中心</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 核心指标卡 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-500 text-[11px] block">簇端总电压</span>
              <span className="font-mono font-black text-base text-slate-800 mt-0.5">
                {cluster.voltageV} V
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">240 串 LFP 母线</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-500 text-[11px] block">充放电电流</span>
              <span
                className={`font-mono font-black text-base mt-0.5 ${
                  cluster.currentA < 0
                    ? 'text-blue-700'
                    : cluster.currentA > 0
                    ? 'text-emerald-700'
                    : 'text-slate-800'
                }`}
              >
                {cluster.currentA} A
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {cluster.currentA < 0 ? '充电输入' : cluster.currentA > 0 ? '放电输出' : '浮充/待机'}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-500 text-[11px] block">荷电状态 (SOC)</span>
              <span className="font-mono font-black text-base text-amber-700 mt-0.5">
                {cluster.socPercent} %
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">能量状态 (可用容量)</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-500 text-[11px] block">健康状态 (SOH)</span>
              <span className="font-mono font-black text-base text-emerald-700 mt-0.5">
                {cluster.sohPercent} %
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">健康状态 (寿命评估)</span>
            </div>
          </div>

          {/* 240 节电芯单体电压分布柱状图 */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <BarChart2 className="w-4 h-4 text-emerald-600" />
                <span>单体电芯电压分布 (240 节电芯代表性抽检)</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-slate-600">
                  最高: <strong>{cluster.maxCellVoltageV} V</strong> ({cluster.maxCellVoltageLocation})
                </span>
                <span className="text-slate-600">
                  最低: <strong>{cluster.minCellVoltageV} V</strong> ({cluster.minCellVoltageLocation})
                </span>
                <span className="text-emerald-700 font-bold">
                  最大压差: {cluster.cellVoltageDeltaMv} mV
                </span>
              </div>
            </div>

            {/* 柱状模拟图 */}
            <div className="space-y-1.5 pt-1">
              <div className="h-24 flex items-end justify-between gap-1 px-1 bg-slate-50/60 rounded-lg p-2 border border-slate-100">
                {cellVoltageSamples.map((sample) => {
                  const minBase = 3.235;
                  const maxBase = 3.265;
                  const pct = Math.max(10, Math.min(100, ((sample.voltage - minBase) / (maxBase - minBase)) * 100));
                  return (
                    <div
                      key={sample.index}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      <div
                        className={`w-full rounded-t-xs transition-all ${
                          sample.isMax
                            ? 'bg-amber-500'
                            : sample.isMin
                            ? 'bg-blue-500'
                            : 'bg-emerald-500/80 group-hover:bg-emerald-600'
                        }`}
                        style={{ height: `${pct}%` }}
                      />
                      {/* Tooltip */}
                      <div className="hidden group-hover:block absolute bottom-full mb-1 z-20 bg-slate-900 text-white text-[10px] p-1.5 rounded whitespace-nowrap shadow-lg">
                        <span>电芯 #{sample.index}: </span>
                        <strong className="font-mono">{sample.voltage} V</strong>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
                <span>Cell #01</span>
                <span>Cell #60</span>
                <span>Cell #120</span>
                <span>Cell #180</span>
                <span>Cell #240</span>
              </div>
            </div>
          </div>

          {/* 单体电芯温度分布与均衡状态 */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-500" />
                电芯温度多点探头监测与热管理一致性
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                每簇布置 120 个 NTC 探针
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <span className="text-slate-500 text-[11px] block">最高单体温度</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                  {cluster.maxCellTempC} ℃
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {cluster.maxCellTempLocation}
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <span className="text-slate-500 text-[11px] block">最低单体温度</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                  {cluster.minCellTempC} ℃
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {cluster.minCellTempLocation}
                </span>
              </div>

              <div
                className={`p-2.5 rounded-lg border ${
                  cluster.isSuspicious
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-slate-50/70 border-slate-100'
                }`}
              >
                <span
                  className={`text-[11px] block ${
                    cluster.isSuspicious ? 'text-amber-800 font-bold' : 'text-slate-500'
                  }`}
                >
                  最大温差 ΔT
                </span>
                <span
                  className={`font-mono font-extrabold text-sm mt-0.5 block ${
                    cluster.isSuspicious ? 'text-amber-900' : 'text-slate-900'
                  }`}
                >
                  {cluster.cellTempDeltaC} ℃
                </span>
                <span
                  className={`text-[10px] mt-0.5 block ${
                    cluster.isSuspicious ? 'text-amber-700 font-semibold' : 'text-emerald-700'
                  }`}
                >
                  {cluster.isSuspicious ? '温差超过 5.0℃ 门槛' : '温差 ≤ 3.0℃ 符合国标'}
                </span>
              </div>
            </div>

            {/* 绝缘阻抗与均衡状态 */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded">
                <span className="text-slate-500">正极对地绝缘电阻:</span>
                <strong className="font-mono text-slate-800">
                  {cluster.insulationResistancePositiveMohm} MΩ
                </strong>
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded">
                <span className="text-slate-500">负极对地绝缘电阻:</span>
                <strong className="font-mono text-slate-800">
                  {cluster.insulationResistanceNegativeMohm} MΩ
                </strong>
              </div>
            </div>
          </div>

          {/* 规约溯源 */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-2">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Clock className="w-4 h-4 text-blue-600" />
              簇控 BMS 通信链路与采集依据
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">BMS 通信总线:</span>
                <span className="font-mono text-slate-800 font-semibold">{cluster.sourcePlatform}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">数据最后刷新时刻:</span>
                <span className="font-mono text-slate-800">{cluster.lastDataTime}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-500">BMS 遥测质量评定:</span>
                <div className="flex items-center gap-2">
                  <MonitorQualityBadge
                    quality={cluster.status === 'ALARM' ? 'EXPIRED' : cluster.isSuspicious ? 'SUSPICIOUS' : 'NORMAL'}
                    source={cluster.sourcePlatform}
                    reason={cluster.suspiciousReason || '单体电压与温度全部通过物理区间校验'}
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={() => navigate('/data/quality?deviceId=DEV-STORAGE-CLUS03')}
                    className="text-blue-600 hover:text-blue-800 underline font-semibold flex items-center gap-0.5"
                  >
                    <span>跳转质量中心</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 操作反馈提示 */}
          {showFeedback && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{showFeedback}</span>
              </div>
              <button
                onClick={() => setShowFeedback(null)}
                className="text-blue-500 hover:text-blue-700 font-bold p-1"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* 3. 抽屉底部操作栏 (只读受控) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>只读监视保护中 · 严禁修改均衡与跳闸参数</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowFeedback('已调取《宁德时代 EnerOne 储能电池簇维护指引》，请检查 3# 簇进水液冷软管是否弯折受限。');
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition-colors flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>查看处置建议</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowFeedback(`已生成现场电池巡检工单【WO-20260905-BAT0${cluster.clusterIndex}】，并附带单体电芯压差温差快照。`);
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
