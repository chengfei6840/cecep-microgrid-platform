import React from 'react';
import { ChargerPile } from '../../../types/charging';
import {
  X,
  Zap,
  BatteryCharging,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Car,
  Wifi,
  Thermometer,
  ShieldAlert,
  ArrowRight,
  FileText,
  Lock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChargingPileDrawerProps {
  pile: ChargerPile | null;
  isOpen: boolean;
  onClose: () => void;
  onJumpAlarm?: (pile: ChargerPile) => void;
}

export const ChargingPileDrawer: React.FC<ChargingPileDrawerProps> = ({
  pile,
  isOpen,
  onClose,
  onJumpAlarm,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !pile) return null;

  const isFault = pile.status === 'FAULT';
  const isOffline = pile.status === 'OFFLINE';
  const isCharging = pile.status === 'CHARGING';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* 抽屉头部 */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-xs ${
                isFault
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : isOffline
                  ? 'bg-slate-100 text-slate-500 border border-slate-200'
                  : isCharging
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono text-slate-900">{pile.pileCode}</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isCharging
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : pile.status === 'IDLE'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : isFault
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {isCharging
                    ? '充电中'
                    : pile.status === 'IDLE'
                    ? '空闲待机'
                    : isFault
                    ? '故障告警'
                    : '离线失联'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{pile.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 抽屉内容区 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* 只读安全声明横幅 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-600">
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong>只读运行监测受控：</strong>系统已锁定所有控制下行通道。严禁在此下发启停充电、远程调控或下行修改指令。
            </span>
          </div>

          {/* 故障告警快捷处置（若存在故障） */}
          {pile.linkedAlarmId && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>关联活动告警：{pile.linkedAlarmId}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-200/80 text-red-800 font-bold">
                  需现场排查
                </span>
              </div>
              <p className="text-xs text-red-800 leading-relaxed">
                {pile.linkedAlarmTitle || '检测到绝缘阻抗偏低，已触发桩端硬件闭锁保护。'}
              </p>
              <div className="pt-2 border-t border-red-200/80 flex items-center justify-between">
                <span className="text-[11px] text-red-700 font-mono">保护响应等级: 自动切断高压输出</span>
                <button
                  onClick={() => {
                    onClose();
                    if (onJumpAlarm) {
                      onJumpAlarm(pile);
                    } else {
                      navigate(`/alarms?deviceId=${pile.id}`);
                    }
                  }}
                  className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <span>查看对应告警详情</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 枪口实时遥测指标 (A枪 / B枪) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              双枪实时电气运行工况
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pile.guns.map((gun) => (
                <div
                  key={gun.gunCode}
                  className={`p-4 rounded-xl border space-y-3 ${
                    gun.status === 'CHARGING'
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : gun.status === 'FAULT'
                      ? 'bg-red-50/40 border-red-200'
                      : gun.status === 'OFFLINE'
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-mono font-bold text-sm text-slate-800">
                      枪口 {gun.gunCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        gun.status === 'CHARGING'
                          ? 'bg-emerald-100 text-emerald-800'
                          : gun.status === 'FAULT'
                          ? 'bg-red-100 text-red-800'
                          : gun.status === 'OFFLINE'
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {gun.status === 'CHARGING'
                        ? '充电作业中'
                        : gun.status === 'FAULT'
                        ? '保护停机'
                        : gun.status === 'OFFLINE'
                        ? '通信离线'
                        : '挂枪空闲'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">输出功率</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {gun.currentPowerKw} kW
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">当前 SOC</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {gun.socPercent !== null ? `${gun.socPercent}%` : '--'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">直流电压</span>
                      <span className="font-mono text-slate-700">{gun.voltageV} V</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">直流电流</span>
                      <span className="font-mono text-slate-700">{gun.currentA} A</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">枪温传感器</span>
                      <span className="font-mono text-slate-700">{gun.gunTempC} ℃</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">已充时长</span>
                      <span className="font-mono text-slate-700">
                        {gun.chargingDurationMinutes ? `${gun.chargingDurationMinutes} 分钟` : '--'}
                      </span>
                    </div>
                  </div>

                  {gun.currentOrderId && (
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>当前订单:</span>
                      <span className="font-mono text-slate-700 font-medium">
                        {gun.currentOrderId}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 充电机电气与设备技术参数 */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              充电机电气台账与通信网络
            </h3>

            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
              <div className="p-3 flex justify-between">
                <span className="text-slate-500">设备规格型号</span>
                <span className="font-medium text-slate-900">{pile.typeLabel} (额定 {pile.ratedPowerKw}kW)</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500">直流输出电压范围</span>
                <span className="font-mono text-slate-700">200 V ~ 750 V DC</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500">最大输出电流</span>
                <span className="font-mono text-slate-700">250 A (单枪峰值)</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500">绝缘阻抗监测值</span>
                <span
                  className={`font-mono font-bold ${
                    pile.insulationResistanceMohm < 0.5 && pile.insulationResistanceMohm > 0
                      ? 'text-red-600'
                      : 'text-emerald-700'
                  }`}
                >
                  {pile.insulationResistanceMohm > 0 ? `${pile.insulationResistanceMohm} MΩ` : '离线未知'}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                    (门槛: 0.5 MΩ)
                  </span>
                </span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500">机内环温</span>
                <span className="font-mono text-slate-700">{pile.ambientTempC} ℃</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500">通信网络 IP 与协议</span>
                <span className="font-mono text-slate-700">
                  {pile.ipAddress} (Modbus-TCP / MQTT)
                </span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-slate-500">协议对接平台</span>
                <span className="text-slate-700 font-medium">{pile.associatedPlatform}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 抽屉底部 */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              navigate('/work-orders');
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            发起现场巡检工单
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
