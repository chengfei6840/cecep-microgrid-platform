import React from 'react';
import { StorageAuxiliarySystem } from '../../types/monitor';
import { Alarm } from '../../types/domain';
import {
  ThermometerSnowflake,
  Flame,
  Gauge,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Activity,
  Droplets,
  Wind,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StorageAuxiliaryCardsProps {
  auxiliary: StorageAuxiliarySystem;
  linkedAlarms: Alarm[];
  isScenarioBExpired?: boolean;
  className?: string;
}

export const StorageAuxiliaryCards: React.FC<StorageAuxiliaryCardsProps> = ({
  auxiliary,
  linkedAlarms,
  isScenarioBExpired = false,
  className = '',
}) => {
  const navigate = useNavigate();
  const { liquidCooling, fireSafety, smartMeter } = auxiliary;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 ${className}`}>
      {/* 1. 液冷热管理系统卡片 */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ThermometerSnowflake className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">液冷热管理系统</h4>
                <span className="text-[10px] text-slate-500 font-mono">0.5C 水乙二醇循环机组</span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                liquidCooling.pumpStatus === 'RUNNING'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {liquidCooling.pumpStatus === 'RUNNING' ? '循环制冷中' : '待机自循环'}
            </span>
          </div>

          {/* 液冷核心参数 */}
          <div className="grid grid-cols-2 gap-2.5 py-3 text-xs">
            <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
              <span className="text-slate-500 text-[10px] block">进/回水温度</span>
              <span className="font-mono font-bold text-slate-800">
                {liquidCooling.inletTempC}℃ / {liquidCooling.outletTempC}℃
              </span>
              <span className="text-[10px] text-blue-600 block mt-0.5">
                温差 ΔT: {liquidCooling.deltaTempC}℃ (正常)
              </span>
            </div>

            <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
              <span className="text-slate-500 text-[10px] block">循环水压</span>
              <span className="font-mono font-bold text-slate-800">
                {liquidCooling.pressureMpa} MPa
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                正常区 (0.20~0.35)
              </span>
            </div>

            <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
              <span className="text-slate-500 text-[10px] block">冷却水循环流量</span>
              <span className="font-mono font-bold text-slate-800">
                {liquidCooling.flowRateLmin} L/min
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">变频恒流泵</span>
            </div>

            <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
              <span className="text-slate-500 text-[10px] block">膨胀水箱液位</span>
              <span className="font-mono font-bold text-slate-800">
                {liquidCooling.expansionTankLevelPercent} %
              </span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">液位安全无渗漏</span>
            </div>
          </div>
        </div>

        {/* 来源与时钟规范 */}
        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex flex-col gap-0.5 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">数据来源:</span>
            <span className="truncate max-w-[170px]" title={liquidCooling.source}>
              {liquidCooling.source}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">更新时刻:</span>
            <span>{liquidCooling.lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* 2. 消防与早期热失控安全系统卡片 */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">消防与热失控防护</h4>
                <span className="text-[10px] text-slate-500 font-mono">七氟丙烷气体灭火系统</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              正常监视
            </span>
          </div>

          {/* 消防参数 */}
          <div className="grid grid-cols-2 gap-2.5 py-3 text-xs">
            <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
              <span className="text-slate-500 text-[10px] block">药剂瓶组压力</span>
              <span className="font-mono font-bold text-emerald-700">
                {fireSafety.aerosolPressureMpa} MPa
              </span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">绿色正常区</span>
            </div>

            <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
              <span className="text-slate-500 text-[10px] block">舱内均温 / 烟雾</span>
              <span className="font-mono font-bold text-slate-800">
                {fireSafety.chamberAvgTempC}℃ / 无烟
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">感温/感烟双监视</span>
            </div>

            <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
              <span className="text-slate-500 text-[10px] block">热失控 CO 浓度</span>
              <span className="font-mono font-bold text-slate-800">
                {fireSafety.coGasPpm} ppm
              </span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">零本底安全</span>
            </div>

            <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
              <span className="text-slate-500 text-[10px] block">热失控 H2 浓度</span>
              <span className="font-mono font-bold text-slate-800">
                {fireSafety.h2GasPpm} ppm
              </span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">泄压排气阀常闭</span>
            </div>
          </div>
        </div>

        {/* 来源与时钟规范 */}
        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex flex-col gap-0.5 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">数据来源:</span>
            <span className="truncate max-w-[170px]" title={fireSafety.source}>
              {fireSafety.source}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">更新时刻:</span>
            <span>{fireSafety.lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* 3. 储能专用并网智能电表 */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">储能专用并网电表</h4>
                <span className="text-[10px] text-slate-500 font-mono">0.5S 级关口计量表</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
              DL/T 645
            </span>
          </div>

          {/* 电表参数 */}
          <div className="grid grid-cols-2 gap-2.5 py-3 text-xs">
            <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
              <span className="text-slate-500 text-[10px] block">三相相电压 (平均)</span>
              <span className="font-mono font-bold text-slate-800">
                {smartMeter.voltageA} V
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">400V 系统相电压</span>
            </div>

            <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
              <span className="text-slate-500 text-[10px] block">三相电流 (平均)</span>
              <span className="font-mono font-bold text-slate-800">
                {smartMeter.currentA} A
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">三相平衡度 99.8%</span>
            </div>

            <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
              <span className="text-slate-500 text-[10px] block">今日吸收充电量</span>
              <span className="font-mono font-bold text-blue-700">
                {smartMeter.positiveActiveKwh} kWh
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">正向有功电能量</span>
            </div>

            <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
              <span className="text-slate-500 text-[10px] block">今日释放放电量</span>
              <span className="font-mono font-bold text-emerald-700">
                {smartMeter.reverseActiveKwh} kWh
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">反向有功电能量</span>
            </div>
          </div>
        </div>

        {/* 来源与时钟规范 */}
        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex flex-col gap-0.5 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">数据来源:</span>
            <span className="truncate max-w-[170px]" title={smartMeter.source}>
              {smartMeter.source}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">更新时刻:</span>
            <span>{smartMeter.lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* 4. 储能子系统关联近期告警卡片 */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  linkedAlarms.length > 0
                    ? 'bg-red-50 text-red-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">储能关联活动告警</h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  活动告警: {linkedAlarms.length} 条
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/alarms?deviceId=DEV-STORAGE-PCS01')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-0.5"
            >
              <span>中心风控</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="py-2.5 space-y-2 max-h-[190px] overflow-y-auto">
            {linkedAlarms.length > 0 ? (
              linkedAlarms.slice(0, 2).map((alarm) => (
                <div
                  key={alarm.id}
                  onClick={() => navigate(`/alarms?deviceId=DEV-STORAGE-PCS01`)}
                  className="p-2.5 bg-red-50/70 hover:bg-red-100/70 border border-red-200 rounded-lg text-xs cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-900 truncate max-w-[180px]">
                      {alarm.alarmTitle}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-red-600 text-white">
                      {alarm.severity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-red-700 font-mono">
                    <span>{alarm.alarmCode}</span>
                    <span>{alarm.triggeredAt || alarm.firstOccurrenceTime}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 space-y-1.5">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-medium text-slate-700">储能系统无未处置严重告警</p>
                <p className="text-[11px] text-slate-400">PCS、BMS、液冷、消防运行指标全部在安全阈值内</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>保留设备筛选</span>
          <button
            type="button"
            onClick={() => navigate('/alarms?deviceId=DEV-STORAGE-PCS01')}
            className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1"
          >
            <span>前往告警中心</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
