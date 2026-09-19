import React from 'react';
import { useAppStore } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  MonitorPlay,
  SunMedium,
  BatteryCharging,
  Zap,
  Activity,
  CloudSun,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const BigScreenEmbedPage: React.FC = () => {
  const navigate = useNavigate();
  const { site, telemetry, alarms, revenueSnapshots, scenario } = useAppStore();

  const todayRev = revenueSnapshots.find((r) => r.calcType === 'ESTIMATE');

  return (
    <div className="space-y-6">
      {/* 头部卡片 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700">
              <MonitorPlay className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              示范站 · 集中监控大屏看板
            </h1>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            提供低碳园区微电网 10kV 交流母线能量流实时动态拓扑、光储充关键指标、环境微气象与分时结算大盘。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/big-screen')}
            className="px-4 py-2 bg-[#00152A] hover:bg-slate-800 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-2 border border-cyan-800/60 shadow-md transition-all"
          >
            <MonitorPlay className="w-4 h-4" />
            <span>进入无边框纯净全屏监控模式</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 嵌入式暗黑风格大屏容器 */}
      <div className="bg-[#050D1A] rounded-2xl border-2 border-[#163860] p-6 text-slate-100 shadow-2xl space-y-6">
        {/* 大屏顶栏 */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-[#163860]/80 gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo_no.png" alt="CECEP" className="h-6 w-auto object-contain brightness-125" />
            <div>
              <h2 className="text-base font-bold text-cyan-100 tracking-wider">
                低碳园区微电网运行监测中心
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                SITE-001 · 10kV 并网点电度与微网平衡
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-cyan-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>数据通信: 正常 (5s 刷新)</span>
            </span>
            <span className="text-slate-400">
              主变负载: {((telemetry.gridPowerKw / (parseFloat(site.transformerCapacity) || 2000)) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* 核心能量拓扑流动 */}
        <div className="bg-[#071120] border border-[#163E6E] rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-sm text-cyan-300">
              微电网能量拓扑流动 (10kV 交流母线)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              光伏装机 500kW · 储能 1000kWh · 充电 12桩
            </span>
          </div>

          {/* 10kV AC 母线 */}
          <div className="w-full h-3.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(0,168,255,0.6)] my-8 relative">
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-bold tracking-widest text-cyan-300 uppercase bg-[#071120] px-4 py-0.5 rounded border border-cyan-800">
              10kV 站内交流公共母线
            </div>
          </div>

          {/* 4 大分支节点 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {/* PV */}
            <div className="p-4 rounded-xl bg-[#09172B] border border-amber-500/40">
              <SunMedium className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-amber-200">屋顶光伏</div>
              <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                +{telemetry.pvActivePowerKw.toFixed(1)} kW
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                日发电: {telemetry.pvDailyGenKwh.toFixed(0)} kWh
              </div>
            </div>

            {/* Storage */}
            <div className={`p-4 rounded-xl bg-[#09172B] border ${scenario === 'SCENARIO_B' ? 'border-red-500/60' : 'border-blue-500/40'}`}>
              <BatteryCharging className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-blue-200">磷酸铁锂储能</div>
              <div className="text-lg font-bold font-mono text-blue-400 mt-1">
                {telemetry.storagePowerKw > 0 ? `+${telemetry.storagePowerKw.toFixed(1)}` : telemetry.storagePowerKw.toFixed(1)} kW
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                SOC: {telemetry.storageSocPercent.toFixed(1)}% ({scenario === 'SCENARIO_B' ? '通信重试' : '削峰填谷'})
              </div>
            </div>

            {/* Grid */}
            <div className="p-4 rounded-xl bg-[#09172B] border border-cyan-500/40">
              <Activity className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-cyan-200">电网关口负荷</div>
              <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
                {telemetry.gridPowerKw.toFixed(1)} kW
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                变压器容量: {site.transformerCapacity} kVA
              </div>
            </div>

            {/* EV */}
            <div className="p-4 rounded-xl bg-[#09172B] border border-emerald-500/40">
              <Zap className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-emerald-200">充电桩群</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                -{telemetry.chargingLoadKw.toFixed(1)} kW
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                日充电: {telemetry.chargingDailyKwh.toFixed(0)} kWh
              </div>
            </div>
          </div>
        </div>

        {/* 底部收益与气象指标 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#09172A] border border-[#163860] rounded-xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <CloudSun className="w-7 h-7 text-amber-300 shrink-0" />
              <div>
                <div className="font-bold text-cyan-100">站址气象监测仪 (示范园区)</div>
                <div className="text-[10px] text-slate-400">微气象实时联动</div>
              </div>
            </div>
            <div className="font-mono text-cyan-300 space-y-0.5 text-right">
              <div>环境温湿度: {telemetry.ambientTempC}°C / 68%</div>
              <div>光伏总辐射: {telemetry.solarIrradiationWm2} W/m²</div>
            </div>
          </div>

          <div className="bg-[#09172A] border border-[#163860] rounded-xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-cyan-100">今日综合收益滚动估算</div>
                <div className="text-[10px] text-slate-400">工商业分时电价双轨核算</div>
              </div>
            </div>
            <div className="font-mono text-right">
              <div className="text-xl font-bold text-emerald-400">
                ¥{todayRev ? todayRev.netComprehensiveRevenue.toFixed(2) : '0.00'}
              </div>
              <span className="text-[10px] text-slate-400">实时滚动计算中</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
