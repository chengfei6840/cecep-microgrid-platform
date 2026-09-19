import React from 'react';
import { UnifiedMonitorDevice } from '../../types/monitor';
import { MonitorQualityBadge } from './MonitorQualityBadge';
import { StatusBadge } from '../common/StatusBadge';
import {
  SunMedium,
  BatteryCharging,
  Zap,
  Activity,
  FileText,
  ChevronRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface MonitorDeviceTableProps {
  devices: UnifiedMonitorDevice[];
  onSelectDevice: (device: UnifiedMonitorDevice) => void;
  className?: string;
}

export const MonitorDeviceTable: React.FC<MonitorDeviceTableProps> = ({
  devices,
  onSelectDevice,
  className = '',
}) => {
  const getSubsystemBadge = (subsystem: string) => {
    switch (subsystem) {
      case 'PV':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <SunMedium className="w-3 h-3 text-amber-600" />
            <span>光伏发电</span>
          </span>
        );
      case 'STORAGE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <BatteryCharging className="w-3 h-3 text-blue-600" />
            <span>储能系统</span>
          </span>
        );
      case 'CHARGING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Zap className="w-3 h-3 text-emerald-600" />
            <span>充电桩群</span>
          </span>
        );
      case 'GRID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Activity className="w-3 h-3 text-purple-600" />
            <span>电网关口</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold">
              <th className="py-3 px-4">设备编码 / 设备名称</th>
              <th className="py-3 px-3">所属微网系统</th>
              <th className="py-3 px-3">规格与额定容量</th>
              <th className="py-3 px-3">核心遥测点 (实时值)</th>
              <th className="py-3 px-3">运行与质量状态</th>
              <th className="py-3 px-3">通信更新时刻</th>
              <th className="py-3 px-4 text-right">监测操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
            {devices.map((device) => {
              const primaryPoint = device.primaryPoint;
              const isAlarm = device.status === 'ALARM';

              return (
                <tr
                  key={device.id}
                  onClick={() => onSelectDevice(device)}
                  className={`hover:bg-slate-50/80 cursor-pointer transition-colors group ${
                    isAlarm ? 'bg-red-50/20' : ''
                  }`}
                >
                  {/* 设备编码 / 名称 */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 group-hover:text-[#004287] transition-colors">
                      {device.name}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 mt-0.5">{device.id}</div>
                  </td>

                  {/* 微网子系统 */}
                  <td className="py-3 px-3 whitespace-nowrap">{getSubsystemBadge(device.subsystem)}</td>

                  {/* 品牌型号与额定容量 */}
                  <td className="py-3 px-3">
                    <div className="text-slate-800 font-medium">
                      {device.manufacturer} {device.model}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      额定: {device.ratedCapacity}
                    </div>
                  </td>

                  {/* 核心遥测点 */}
                  <td className="py-3 px-3">
                    {primaryPoint ? (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {primaryPoint.formattedValue}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {primaryPoint.unit}
                          </span>
                          {primaryPoint.powerDirectionNote && (
                            <span className="text-[10px] text-slate-500 ml-1">
                              ({primaryPoint.powerDirectionNote})
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {primaryPoint.id} · {primaryPoint.pointName}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">暂无映射测点</span>
                    )}
                  </td>

                  {/* 运行与质量状态 */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge status={device.status} size="sm" />
                      {primaryPoint && (
                        <MonitorQualityBadge
                          quality={primaryPoint.quality}
                          source={primaryPoint.qualitySource}
                          reason={primaryPoint.qualityReason}
                          lastUpdated={primaryPoint.lastUpdated}
                          size="sm"
                        />
                      )}
                    </div>
                  </td>

                  {/* 通信更新时间 */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{device.lastDataTime}</span>
                    </div>
                  </td>

                  {/* 操作列：严格只读，无控制按钮 */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDevice(device);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#004287] bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>查看详情</span>
                      <ChevronRight className="w-3 h-3 opacity-60" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {devices.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  当前筛选条件下暂无设备记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
