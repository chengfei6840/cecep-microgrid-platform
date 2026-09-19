import React, { useState, useMemo } from 'react';
import { PvInverterDetail } from '../../types/monitor';
import { StatusBadge } from '../common/StatusBadge';
import { MonitorQualityBadge } from './MonitorQualityBadge';
import {
  SunMedium,
  Thermometer,
  Zap,
  ChevronRight,
  Clock,
  Filter,
  CheckCircle2,
  AlertOctagon,
  WifiOff,
  Radio,
} from 'lucide-react';

interface PvInverterTableProps {
  inverters: PvInverterDetail[];
  onSelectInverter: (inverter: PvInverterDetail) => void;
  className?: string;
}

type InverterFilter = 'ALL' | 'ONLINE' | 'ALARM' | 'OFFLINE_OR_SUSPICIOUS';

export const PvInverterTable: React.FC<PvInverterTableProps> = ({
  inverters,
  onSelectInverter,
  className = '',
}) => {
  const [filter, setFilter] = useState<InverterFilter>('ALL');

  // 统计数据
  const counts = useMemo(() => {
    const online = inverters.filter((inv) => inv.status === 'NORMAL').length;
    const alarm = inverters.filter((inv) => inv.status === 'ALARM').length;
    const offlineOrSuspicious = inverters.filter(
      (inv) => inv.status === 'OFFLINE' || inv.status === 'SUSPICIOUS'
    ).length;
    return {
      all: inverters.length,
      online,
      alarm,
      offlineOrSuspicious,
    };
  }, [inverters]);

  // 过滤逆变器
  const filteredInverters = useMemo(() => {
    switch (filter) {
      case 'ONLINE':
        return inverters.filter((inv) => inv.status === 'NORMAL');
      case 'ALARM':
        return inverters.filter((inv) => inv.status === 'ALARM');
      case 'OFFLINE_OR_SUSPICIOUS':
        return inverters.filter(
          (inv) => inv.status === 'OFFLINE' || inv.status === 'SUSPICIOUS'
        );
      case 'ALL':
      default:
        return inverters;
    }
  }, [inverters, filter]);

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden ${className}`}>
      {/* 头部控制栏：标题与按状态筛选 */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <SunMedium className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs">光伏逆变器机组阵列运行列表</h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              示范站装机共 {inverters.length} 台组串逆变器，实时监控交流有功、机温与数据链路
            </p>
          </div>
        </div>

        {/* 在线/离线/故障状态筛选器 */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              filter === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>全部逆变器</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700">
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('ONLINE')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              filter === 'ONLINE'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>在线正常</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
              {counts.online}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('ALARM')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              filter === 'ALARM'
                ? 'bg-white text-red-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>故障告警</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-red-100 text-red-800">
              {counts.alarm}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('OFFLINE_OR_SUSPICIOUS')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              filter === 'OFFLINE_OR_SUSPICIOUS'
                ? 'bg-white text-amber-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>离线/可疑</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
              {counts.offlineOrSuspicious}
            </span>
          </button>
        </div>
      </div>

      {/* 逆变器表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold">
              <th className="py-3 px-4">逆变器编码 / 名称</th>
              <th className="py-3 px-3">品牌与规格型号</th>
              <th className="py-3 px-3 text-right">额定功率</th>
              <th className="py-3 px-3 text-right">当前出力 (kW)</th>
              <th className="py-3 px-3 text-right">今日发电量 (kWh)</th>
              <th className="py-3 px-3 text-center">机内温度 (℃)</th>
              <th className="py-3 px-3 text-center">运行状态</th>
              <th className="py-3 px-3">最近数据时间</th>
              <th className="py-3 px-4 text-right">监测详情</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
            {filteredInverters.map((inv) => {
              const isAlarm = inv.status === 'ALARM';
              const isSuspicious = inv.status === 'SUSPICIOUS';
              const isOffline = inv.status === 'OFFLINE';

              return (
                <tr
                  key={inv.id}
                  onClick={() => onSelectInverter(inv)}
                  className={`hover:bg-slate-50/80 cursor-pointer transition-colors group ${
                    isAlarm
                      ? 'bg-red-50/20'
                      : isSuspicious
                      ? 'bg-amber-50/20'
                      : isOffline
                      ? 'bg-slate-50/50 opacity-85'
                      : ''
                  }`}
                >
                  {/* 设备编码 / 名称 */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 group-hover:text-[#004287] transition-colors flex items-center gap-1.5">
                      <span>{inv.name}</span>
                      {inv.linkedAlarms && inv.linkedAlarms.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 mt-0.5">{inv.id}</div>
                  </td>

                  {/* 品牌与型号 */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{inv.manufacturer}</div>
                    <div className="font-mono text-[11px] text-slate-500 mt-0.5">{inv.model}</div>
                  </td>

                  {/* 额定功率 */}
                  <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700">
                    {inv.ratedCapacity}
                  </td>

                  {/* 当前出力 */}
                  <td className="py-3 px-3 text-right">
                    <div className="font-mono font-bold text-sm text-slate-900">
                      {inv.currentPowerKw.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">kW</div>
                  </td>

                  {/* 今日发电量 */}
                  <td className="py-3 px-3 text-right">
                    <div className="font-mono font-bold text-slate-900">
                      {inv.dailyYieldKwh.toLocaleString('zh-CN', { minimumFractionDigits: 1 })}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">kWh</div>
                  </td>

                  {/* 机内温度 */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] font-semibold ${
                        inv.temperatureC > 65
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : inv.temperatureC > 50
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Thermometer className="w-3 h-3 text-slate-400" />
                      <span>{inv.temperatureC.toFixed(1)}℃</span>
                    </span>
                  </td>

                  {/* 运行状态 */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <StatusBadge status={inv.status} size="sm" />
                  </td>

                  {/* 最近数据时间 */}
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{inv.lastDataTime}</span>
                    </div>
                  </td>

                  {/* 操作入口 */}
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectInverter(inv);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-[#004287] text-slate-700 hover:text-white font-medium text-xs transition-colors"
                    >
                      <span>详情抽屉</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredInverters.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-slate-400">
                  当前筛选条件下暂无逆变器数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
