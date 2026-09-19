import React, { useState } from 'react';
import { ChargerPile, ChargerPileStatus } from '../../../types/charging';
import {
  BatteryCharging,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wifi,
  WifiOff,
  SlidersHorizontal,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface ChargingPileTableProps {
  piles: ChargerPile[];
  onSelectPile: (pile: ChargerPile) => void;
  onJumpAlarm: (pile: ChargerPile) => void;
}

export const ChargingPileTable: React.FC<ChargingPileTableProps> = ({
  piles,
  onSelectPile,
  onJumpAlarm,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | ChargerPileStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 状态计数
  const counts = {
    ALL: piles.length,
    IDLE: piles.filter((p) => p.status === 'IDLE').length,
    CHARGING: piles.filter((p) => p.status === 'CHARGING').length,
    FAULT: piles.filter((p) => p.status === 'FAULT').length,
    OFFLINE: piles.filter((p) => p.status === 'OFFLINE').length,
  };

  // 过滤后的桩列表
  const filteredPiles = piles.filter((pile) => {
    if (statusFilter !== 'ALL' && pile.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = pile.pileCode.toLowerCase().includes(q);
      const matchName = pile.name.toLowerCase().includes(q);
      const matchPlatform = pile.associatedPlatform.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchPlatform) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 顶部过滤筛选控制条 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            桩状态筛选:
          </span>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部 ({counts.ALL})
          </button>

          <button
            onClick={() => setStatusFilter('CHARGING')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'CHARGING'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            充电中 ({counts.CHARGING})
          </button>

          <button
            onClick={() => setStatusFilter('IDLE')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'IDLE'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            空闲待机 ({counts.IDLE})
          </button>

          <button
            onClick={() => setStatusFilter('FAULT')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'FAULT'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            故障告警 ({counts.FAULT})
          </button>

          <button
            onClick={() => setStatusFilter('OFFLINE')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'OFFLINE'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            离线通信 ({counts.OFFLINE})
          </button>
        </div>

        {/* 快捷搜索 */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="搜索桩编号 / 桩名称 / 协议平台..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* 充电桩列表表格 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">桩编号 / 名称</th>
                <th className="py-3 px-4">枪编号与状态</th>
                <th className="py-3 px-4">规格类型</th>
                <th className="py-3 px-4">额定功率</th>
                <th className="py-3 px-4">当前功率</th>
                <th className="py-3 px-4">今日电量</th>
                <th className="py-3 px-4">设备状态</th>
                <th className="py-3 px-4">最近心跳</th>
                <th className="py-3 px-4">关联平台</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPiles.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                    未检索到符合筛选条件的充电桩设备
                  </td>
                </tr>
              ) : (
                filteredPiles.map((pile) => {
                  const isFault = pile.status === 'FAULT';
                  const isOffline = pile.status === 'OFFLINE';
                  const isCharging = pile.status === 'CHARGING';

                  return (
                    <tr
                      key={pile.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isFault ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {/* 桩编号 / 名称 */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isFault
                                ? 'bg-red-100 text-red-700'
                                : isOffline
                                ? 'bg-slate-100 text-slate-500'
                                : isCharging
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                              <span>{pile.pileCode}</span>
                              {pile.linkedAlarmId && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-100 text-red-700 font-sans font-semibold">
                                  告警中
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                              {pile.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 枪编号与状态 (A / B) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {pile.guns.map((gun) => (
                            <div
                              key={gun.gunCode}
                              className={`px-2 py-1 rounded text-[10px] font-mono border flex items-center gap-1 ${
                                gun.status === 'CHARGING'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : gun.status === 'FAULT'
                                  ? 'bg-red-50 text-red-800 border-red-200'
                                  : gun.status === 'OFFLINE'
                                  ? 'bg-slate-50 text-slate-500 border-slate-200'
                                  : 'bg-blue-50 text-blue-800 border-blue-200'
                              }`}
                            >
                              <span className="font-bold">枪{gun.gunCode}:</span>
                              <span>
                                {gun.status === 'CHARGING'
                                  ? `${gun.currentPowerKw}kW (${gun.socPercent}%)`
                                  : gun.status === 'FAULT'
                                  ? '故障'
                                  : gun.status === 'OFFLINE'
                                  ? '离线'
                                  : '空闲'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* 规格类型 */}
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                          {pile.typeLabel}
                        </span>
                      </td>

                      {/* 额定功率 */}
                      <td className="py-3 px-4 font-mono text-slate-800 font-semibold">
                        {pile.ratedPowerKw} kW
                      </td>

                      {/* 当前功率 */}
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-bold ${
                            pile.currentPowerKw > 0 ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {pile.currentPowerKw.toFixed(1)} kW
                        </span>
                      </td>

                      {/* 今日累计电量 */}
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {pile.todayEnergyKwh.toFixed(1)} kWh
                      </td>

                      {/* 设备状态 */}
                      <td className="py-3 px-4">
                        {isCharging && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            充电中
                          </span>
                        )}
                        {pile.status === 'IDLE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            空闲待机
                          </span>
                        )}
                        {isFault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            故障告警
                          </span>
                        )}
                        {isOffline && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <WifiOff className="w-3 h-3" />
                            离线失联
                          </span>
                        )}
                      </td>

                      {/* 最近心跳 */}
                      <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                        {pile.lastHeartbeat}
                      </td>

                      {/* 关联平台 */}
                      <td className="py-3 px-4 text-[11px] text-slate-600">
                        <span className="truncate max-w-[150px] inline-block" title={pile.associatedPlatform}>
                          {pile.associatedPlatform}
                        </span>
                      </td>

                      {/* 操作列 */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {isFault && (
                            <button
                              onClick={() => onJumpAlarm(pile)}
                              className="px-2 py-1 rounded text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-1"
                              title="跳转告警中心查看故障根因"
                            >
                              <ShieldAlert className="w-3 h-3" />
                              查看告警
                            </button>
                          )}
                          <button
                            onClick={() => onSelectPile(pile)}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1"
                          >
                            <span>详情</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 底部统计与一致性校验提示 */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">列表与指标口径校验：</span>
            <span>
              显示 {filteredPiles.length} / {piles.length} 台桩（在网可服务 {counts.IDLE + counts.CHARGING} 台，充电中 {counts.CHARGING} 台）
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            IEC 62443 只读受控 · 严禁启停控制
          </span>
        </div>
      </div>
    </div>
  );
};
