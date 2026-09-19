import React from 'react';
import { UnifiedMonitorDevice } from '../../types/monitor';
import { MonitorQualityBadge } from './MonitorQualityBadge';
import { StatusBadge } from '../common/StatusBadge';
import {
  X,
  Lock,
  Cpu,
  Radio,
  Clock,
  ShieldCheck,
  AlertOctagon,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MonitorDeviceDrawerProps {
  device: UnifiedMonitorDevice | null;
  onClose: () => void;
}

export const MonitorDeviceDrawer: React.FC<MonitorDeviceDrawerProps> = ({ device, onClose }) => {
  const navigate = useNavigate();

  if (!device) return null;

  const isAlarm = device.status === 'ALARM';

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
          <div className="p-5 border-b border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#004287] flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{device.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                    <span>{device.id}</span>
                    <span>·</span>
                    <span>{device.siteId}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={device.status} size="sm" />
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
                <strong>只读监控保护：</strong>本监测视图仅供工况观察与质量诊断，禁止直接下发遥控开关、功率调节或调度指令。
              </span>
            </div>
          </div>

          {/* 抽屉内容主体 (可滚动) */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs">
            {/* 1. 设备规格基本信息 */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>设备硬件与额定参数</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block">设备类型</span>
                  <span className="font-semibold text-slate-800">{device.type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">额定容量</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {device.ratedCapacity}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">制造厂商</span>
                  <span className="font-semibold text-slate-800">{device.manufacturer}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">型号标识</span>
                  <span className="font-semibold text-slate-800 font-mono">{device.model}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200">
                  <span className="text-[10px] text-slate-400 block">接入适配器源</span>
                  <span className="font-mono text-slate-700">{device.sourceAdapterId}</span>
                </div>
              </div>
            </div>

            {/* 2. 映射遥测点列表与实时数据 */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-600" />
                  <span>实时遥测点与质量解析</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400 font-normal">
                  共 {device.points.length} 个测点
                </span>
              </h4>

              <div className="space-y-2">
                {device.points.map((pt) => (
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
                        {pt.timeScope === 'REALTIME' ? '瞬时值' : '今日累计值'}
                      </span>
                    </div>

                    {pt.powerDirectionNote && (
                      <div className="text-[11px] text-slate-600 flex items-center gap-1">
                        <span className="font-semibold text-slate-500">功率符号约定:</span>
                        <span className="text-blue-700 font-medium">{pt.powerDirectionNote}</span>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 space-y-1 bg-slate-50/60 p-2 rounded">
                      <div>
                        <span className="text-slate-400">数据来源: </span>
                        <span className="font-mono">{pt.qualitySource}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">质量说明: </span>
                        <span>{pt.qualityReason}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">更新时刻: </span>
                        <span className="font-mono">{pt.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {device.points.length === 0 && (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-lg">
                    该设备暂未配置标准化遥测点映射
                  </div>
                )}
              </div>
            </div>

            {/* 3. 告警诊断与系统联动入口 */}
            {isAlarm && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-900 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <AlertOctagon className="w-4 h-4 text-red-600" />
                  <span>设备当前存在待处置告警</span>
                </div>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  储能通信网关持续心跳超时，已影响收益估算置信度。可前往告警风控中心查看处置进度或协同工单。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/alarms');
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-2xs transition-colors"
                >
                  <span>前往告警风控中心查看处置</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 抽屉底部 */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 font-mono">
              上次通信: {device.lastDataTime}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md font-medium text-xs hover:bg-slate-50 transition-colors"
            >
              关闭抽屉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
