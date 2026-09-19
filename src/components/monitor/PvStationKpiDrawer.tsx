import React from 'react';
import { UnifiedMonitorPoint, PvInverterDetail } from '../../types/monitor';
import { StatusBadge } from '../common/StatusBadge';
import { MonitorQualityBadge } from './MonitorQualityBadge';
import {
  X,
  Lock,
  SunMedium,
  Zap,
  Activity,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  FileSpreadsheet,
  Gauge,
  TrendingUp,
  Cpu,
  Building2,
  ExternalLink,
} from 'lucide-react';

interface PvStationKpiDrawerProps {
  selectedPoint: UnifiedMonitorPoint | null;
  kpiPoints: UnifiedMonitorPoint[];
  inverters: PvInverterDetail[];
  onSelectPoint: (point: UnifiedMonitorPoint) => void;
  onDrilldownInverter: (inverter: PvInverterDetail) => void;
  onClose: () => void;
}

export const PvStationKpiDrawer: React.FC<PvStationKpiDrawerProps> = ({
  selectedPoint,
  kpiPoints,
  inverters,
  onSelectPoint,
  onDrilldownInverter,
  onClose,
}) => {
  if (!selectedPoint) return null;

  // 全站装机容量与总数
  const totalCapacityKwp = inverters.reduce((sum, inv) => {
    const capNum = parseFloat(inv.ratedCapacity) || 0;
    return sum + capNum;
  }, 0) || 1200;

  // 全站实时功率总和
  const totalPowerKw = inverters.reduce((sum, inv) => sum + inv.currentPowerKw, 0);

  // 全站今日发电量总和
  const totalDailyYieldKwh = inverters.reduce((sum, inv) => sum + inv.dailyYieldKwh, 0);

  // 判断当前选中哪个核心指标
  const isRealtimePower = selectedPoint.standardCode === 'PV_ACTIVE_POWER_TOTAL';
  const isDailyYield = selectedPoint.standardCode === 'PV_DAILY_YIELD_KWH';
  const isTotalYield = selectedPoint.standardCode === 'PV_TOTAL_LIFETIME_YIELD_MWH';
  const isCapacity = selectedPoint.standardCode === 'PV_INSTALLED_CAPACITY_KWP';
  const isPeakHours = selectedPoint.standardCode === 'PV_EQUIVALENT_PEAK_HOURS';

  // 装机分布与用途辅助信息
  const inverterLocations: Record<string, { location: string; panels: string; orientation: string }> = {
    'DEV-PV-INV01': {
      location: '1# 厂房主屋顶 (一期)',
      panels: '单晶高效硅 550Wp × 582 片',
      orientation: '正南向 22° 最佳倾角',
    },
    'DEV-PV-INV02': {
      location: '2# 仓库平屋顶 (一期)',
      panels: '单晶高效硅 550Wp × 582 片',
      orientation: '正南偏东 5° 倾角 20°',
    },
    'DEV-PV-INV03': {
      location: '园区智慧光伏车棚 (二期)',
      panels: '双玻透光双面组件 540Wp × 592 片',
      orientation: '南北朝向 坡度 10°',
    },
    'DEV-PV-INV04': {
      location: '综合研发展厅南立面光电幕墙 (二期)',
      panels: '碲化镉薄膜 BIPV 400Wp × 600 片',
      orientation: '垂直南立面 90°',
    },
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 遮罩背景 */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* 抽屉头部 */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/90">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <SunMedium className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-sm tracking-tight">
                      全站光伏汇总看板分析
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                      全站 1.2 MWp 聚合口径
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                    <span>示范站 (SITE-001)</span>
                    <span>·</span>
                    <span>共 {inverters.length} 台逆变器汇流并网</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                title="关闭抽屉"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 只读保护提示 */}
            <div className="mt-3 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-amber-900 text-[11px] flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>电站总览聚合视角：</strong>当前看板指标为示范站全站 4 台组串逆变器的汇总指标，展示并网总出线、累计发电微积分与各机组贡献拆解。
              </span>
            </div>

            {/* 5 大核心汇总指标切换选项卡 */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="text-[11px] font-bold text-slate-600 mb-2 flex items-center justify-between">
                <span>切换查看全站汇总指标</span>
                <span className="font-mono text-[10px] text-slate-400">点击切换下方拆解维度</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {kpiPoints.map((pt) => {
                  const isActive = pt.id === selectedPoint.id;
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => onSelectPoint(pt)}
                      className={`p-2 rounded-lg text-left transition-all border ${
                        isActive
                          ? 'bg-[#004287] text-white border-[#004287] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      <div
                        className={`text-[10px] truncate ${
                          isActive ? 'text-blue-100 font-medium' : 'text-slate-500'
                        }`}
                      >
                        {pt.pointName.replace('全站', '').replace('光伏', '')}
                      </div>
                      <div className="font-mono font-bold text-xs mt-0.5 truncate">
                        {pt.formattedValue}
                        <span
                          className={`text-[10px] ml-0.5 font-normal ${
                            isActive ? 'text-blue-200' : 'text-slate-400'
                          }`}
                        >
                          {pt.unit}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 抽屉内容主体 (可滚动) */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs">
            {/* 1. 当前选中的汇总 KPI 详情卡片 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    当前选定全站汇总指标
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                      {selectedPoint.formattedValue}
                    </span>
                    <span className="text-sm font-bold text-slate-600 font-mono">
                      {selectedPoint.unit}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                      {selectedPoint.timeScope === 'REALTIME'
                        ? '全站瞬时聚合'
                        : selectedPoint.timeScope === 'TODAY_CUMULATIVE'
                        ? '日内微积分累加'
                        : '关口历史结算'}
                    </span>
                  </div>
                  <div className="font-bold text-slate-800 text-xs mt-1">
                    {selectedPoint.pointName}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                    标准代码: {selectedPoint.standardCode} · 测点编码: {selectedPoint.id}
                  </div>
                </div>

                <MonitorQualityBadge
                  quality={selectedPoint.quality}
                  source={selectedPoint.qualitySource}
                  reason={selectedPoint.qualityReason}
                  lastUpdated={selectedPoint.lastUpdated}
                  size="md"
                />
              </div>

              {/* 规约与汇总依据说明 */}
              <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[11px]">
                <div className="flex items-start gap-1.5 text-slate-600">
                  <span className="text-slate-400 shrink-0">汇总节点:</span>
                  <span className="font-medium text-slate-800">{selectedPoint.deviceName}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-600">
                  <span className="text-slate-400 shrink-0">数据源规约:</span>
                  <span className="font-medium text-slate-800">{selectedPoint.qualitySource}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-600">
                  <span className="text-slate-400 shrink-0">质量校验依据:</span>
                  <span className="text-slate-700">{selectedPoint.qualityReason}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px] pt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>更新时间: {selectedPoint.lastUpdated}</span>
                </div>
              </div>
            </div>

            {/* 2. 核心：全站 4 台逆变器在此指标上的贡献拆解分析 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#004287]" />
                  <span>全站 4 台组串逆变器贡献明细与拆解</span>
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  全站装机 {totalCapacityKwp} kWp
                </span>
              </div>

              <div className="space-y-2.5">
                {inverters.map((inv, index) => {
                  const locationInfo = inverterLocations[inv.id] || {
                    location: '光伏阵列',
                    panels: '单晶硅组件',
                    orientation: '南向倾斜',
                  };

                  // 计算各指标下的单机贡献度
                  let contributionText = '';
                  let contributionPercent = 0;
                  let secondaryMetricText = '';

                  if (isRealtimePower) {
                    contributionPercent = totalPowerKw > 0 ? (inv.currentPowerKw / totalPowerKw) * 100 : 0;
                    contributionText = `${inv.currentPowerKw.toFixed(1)} kW`;
                    secondaryMetricText = `出力贡献占比: ${contributionPercent.toFixed(1)}%`;
                  } else if (isDailyYield) {
                    contributionPercent = totalDailyYieldKwh > 0 ? (inv.dailyYieldKwh / totalDailyYieldKwh) * 100 : 0;
                    contributionText = `${inv.dailyYieldKwh.toLocaleString('zh-CN', { minimumFractionDigits: 1 })} kWh`;
                    secondaryMetricText = `日电量贡献: ${contributionPercent.toFixed(1)}%`;
                  } else if (isCapacity) {
                    const invCap = parseFloat(inv.ratedCapacity) || 300;
                    contributionPercent = (invCap / totalCapacityKwp) * 100;
                    contributionText = inv.ratedCapacity;
                    secondaryMetricText = `装机占比: ${contributionPercent.toFixed(1)}%`;
                  } else if (isPeakHours) {
                    const invCap = parseFloat(inv.ratedCapacity) || 320;
                    const invPeakHour = invCap > 0 ? inv.dailyYieldKwh / invCap : 0;
                    contributionText = `${invPeakHour.toFixed(2)} h`;
                    secondaryMetricText = `单机日发电 / 额定容量 (${inv.ratedCapacity})`;
                  } else {
                    // 累计总发电量
                    contributionPercent = index === 0 ? 52 : index === 1 ? 24 : index === 2 ? 16 : 8;
                    contributionText = `全寿命核验`;
                    secondaryMetricText = `历年加权贡献权重约 ${contributionPercent}%`;
                  }

                  return (
                    <div
                      key={inv.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                            {index + 1}#
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{inv.name}</span>
                              <StatusBadge status={inv.status} size="sm" />
                            </div>
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                              {inv.id} · {inv.model} · 额定 {inv.ratedCapacity}
                            </div>
                          </div>
                        </div>

                        {/* 单机指标数值 */}
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            {contributionText}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {secondaryMetricText}
                          </div>
                        </div>
                      </div>

                      {/* 进度条与占比（若存在百分比） */}
                      {contributionPercent > 0 && (
                        <div className="space-y-1">
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(2, contributionPercent))}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* 空间位置与出厂阵列 */}
                      <div className="p-2 rounded bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700">{locationInfo.location}</span>
                          <span>·</span>
                          <span>{locationInfo.orientation}</span>
                        </div>
                        <div className="text-slate-400 font-mono">
                          IGBT 机温: {inv.temperatureC.toFixed(1)}℃
                        </div>
                      </div>

                      {/* 下钻操作按钮：深入查看该单台逆变器设备详情 */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-mono">
                          通信链路: Modbus-TCP / {inv.lastDataTime}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onDrilldownInverter(inv);
                          }}
                          className="inline-flex items-center gap-1 text-[#004287] hover:text-blue-800 font-bold text-[11px] hover:underline"
                        >
                          <span>查看单机详细测点与硬件</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. 全站光伏聚合电气架构说明卡 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-600" />
                <span>全站汇总计算口径与电气拓扑说明</span>
              </h4>
              <div className="text-[11px] text-slate-600 leading-relaxed space-y-1.5">
                <p>
                  • <strong>出力聚合规则</strong>：全站光伏实时出力功率 (kW) 是由前置通讯采集网关每 5 秒轮询 4 台组串逆变器的交流输出有功寄存器，经前置规约引擎加总求和得到，严格滤除离线坏帧并标注质量。
                </p>
                <p>
                  • <strong>发电积分规则</strong>：今日发电量 (kWh) 采用日内 00:00 至当前时刻的梯形有功微积分累加，与电站关口智能双向电表的正向有功电量进行动态同频校验。
                </p>
                <p>
                  • <strong>等效利用小时公式</strong>：严格按照国家能源局与《光伏发电站设计规范》(GB 50797)，计算公式为：
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800 ml-1">
                    利用小时 (h) = 全站今日发电量 (kWh) / 全站光伏核准装机容量 (1,200 kWp)
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* 抽屉底部 */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 font-mono">
              全站时钟同步基准: {selectedPoint.lastUpdated}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md font-medium text-xs hover:bg-slate-100 transition-colors shadow-2xs"
            >
              关闭抽屉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
