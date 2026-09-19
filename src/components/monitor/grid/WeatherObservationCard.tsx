import React from 'react';
import { WeatherObservationData } from '../../../types/grid';
import {
  SunMedium,
  Thermometer,
  Wind,
  Compass,
  Droplets,
  CloudSun,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Radio,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface WeatherObservationCardProps {
  weather: WeatherObservationData;
}

export const WeatherObservationCard: React.FC<WeatherObservationCardProps> = ({
  weather,
}) => {
  const isStationOffline = weather.stationStatus === 'OFFLINE';

  return (
    <div
      id="weather-observation-card"
      className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden"
    >
      {/* 头部标题区 */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <CloudSun className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                微气象站环境现场实测 (严谨实测，杜绝插值)
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  isStationOffline
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isStationOffline ? '传感器离线缺测' : '测点在线采集正常'}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-mono">
                全项标注实测
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              观测站：{weather.stationDeviceName} · 规约：Modbus-RTU / RS485 现场直采
            </p>
          </div>
        </div>

        {/* 传感器时标 */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            实测更新: <span className="font-mono text-slate-700">{weather.lastUpdated}</span>
          </span>
        </div>
      </div>

      {/* 气象缺失警告 (若发生通信丢包) */}
      {isStationOffline && (
        <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-100 flex items-center gap-2 text-xs text-rose-700">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>
            <strong>传感器数据缺失警示：</strong>气象仪 RS485
            总线丢包未收到有效应答，系统已保留缺失断点，严禁使用 0 值假冒或使用算法虚假平滑填充！
          </span>
        </div>
      )}

      {/* 气象 6 大实测指标网格 */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. 水平总辐照度 */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <SunMedium className="w-3.5 h-3.5 text-amber-500" />
              水平总辐照度
            </span>
            <span className="text-[10px] text-slate-400 font-mono">实测</span>
          </div>

          <div className="my-2">
            {weather.totalIrradiance.isMissing ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-rose-500">--</span>
                <span className="text-[11px] text-rose-600 font-medium">缺测断点</span>
              </div>
            ) : weather.totalIrradiance.value === 0 ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-slate-800">0</span>
                <span className="text-xs font-medium text-slate-400">W/m²</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded ml-1">夜间正常零</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {weather.totalIrradiance.value}
                </span>
                <span className="text-xs font-medium text-slate-400">W/m²</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              {weather.totalIrradiance.isMissing
                ? '通信中断未收到采样帧'
                : weather.totalIrradiance.rangeNote}
            </p>
          </div>

          <div className="pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-400 truncate">
            {weather.totalIrradiance.sensor}
          </div>
        </div>

        {/* 2. 环境温度 */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-blue-500" />
              环境温度
            </span>
            <span className="text-[10px] text-slate-400 font-mono">实测</span>
          </div>

          <div className="my-2">
            {weather.ambientTemp.isMissing ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-rose-500">--</span>
                <span className="text-[11px] text-rose-600 font-medium">缺测断点</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {weather.ambientTemp.value?.toFixed(1)}
                </span>
                <span className="text-xs font-medium text-slate-400">℃</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              {weather.ambientTemp.isMissing ? '传感器通信异常' : '百叶箱防辐射罩保护'}
            </p>
          </div>

          <div className="pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-400 truncate">
            {weather.ambientTemp.sensor}
          </div>
        </div>

        {/* 3. 组件背板温度 */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              组件背板温度
            </span>
            <span className="text-[10px] text-slate-400 font-mono">实测</span>
          </div>

          <div className="my-2">
            {weather.moduleTemp.isMissing ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-rose-500">--</span>
                <span className="text-[11px] text-rose-600 font-medium">缺测断点</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {weather.moduleTemp.value?.toFixed(1)}
                </span>
                <span className="text-xs font-medium text-slate-400">℃</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              {weather.moduleTemp.isMissing
                ? '传感器通信异常'
                : weather.ambientTemp.value !== null && weather.moduleTemp.value !== null
                ? `较气温升温 +${(weather.moduleTemp.value - weather.ambientTemp.value).toFixed(1)}℃`
                : '--'}
            </p>
          </div>

          <div className="pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-400 truncate">
            {weather.moduleTemp.sensor}
          </div>
        </div>

        {/* 4. 相对湿度 */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-500" />
              空气相对湿度
            </span>
            <span className="text-[10px] text-slate-400 font-mono">实测</span>
          </div>

          <div className="my-2">
            {weather.relativeHumidity.isMissing ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-rose-500">--</span>
                <span className="text-[11px] text-rose-600 font-medium">缺测断点</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {weather.relativeHumidity.value?.toFixed(1)}
                </span>
                <span className="text-xs font-medium text-slate-400">%</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              {weather.relativeHumidity.isMissing ? '传感器通信异常' : '空气潮湿舒适'}
            </p>
          </div>

          <div className="pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-400 truncate">
            {weather.relativeHumidity.sensor}
          </div>
        </div>

        {/* 5. 现场风速 */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-teal-500" />
              现场风速
            </span>
            <span className="text-[10px] text-slate-400 font-mono">实测</span>
          </div>

          <div className="my-2">
            {weather.windSpeed.isMissing ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-rose-500">--</span>
                <span className="text-[11px] text-rose-600 font-medium">缺测断点</span>
              </div>
            ) : weather.windSpeed.value === 0 ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-slate-800">0.0</span>
                <span className="text-xs font-medium text-slate-400">m/s</span>
                <span className="text-[10px] text-slate-500 bg-slate-200 px-1 rounded ml-1">静风</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {weather.windSpeed.value?.toFixed(1)}
                </span>
                <span className="text-xs font-medium text-slate-400">m/s</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              {weather.windSpeed.isMissing ? '传感器通信异常' : '2 级微风，有利于逆变器散热'}
            </p>
          </div>

          <div className="pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-400 truncate">
            {weather.windSpeed.sensor}
          </div>
        </div>

        {/* 6. 风向 */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              实时风向
            </span>
            <span className="text-[10px] text-slate-400 font-mono">实测</span>
          </div>

          <div className="my-2">
            {weather.windDirection.isMissing ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-rose-500">--</span>
                <span className="text-[11px] text-rose-600 font-medium">缺测断点</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black font-mono text-slate-900 truncate">
                  {weather.windDirection.compass}
                </span>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              {weather.windDirection.isMissing
                ? '传感器通信异常'
                : `霍尔角度 ${weather.windDirection.deg}°`}
            </p>
          </div>

          <div className="pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-400 truncate">
            {weather.windDirection.sensor}
          </div>
        </div>
      </div>
    </div>
  );
};
