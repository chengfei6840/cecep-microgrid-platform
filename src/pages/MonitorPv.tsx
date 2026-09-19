import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonitorData } from '../hooks/useMonitorData';
import { useAppStore } from '../store/AppContext';
import { MonitorRoleGuard } from '../components/monitor/MonitorRoleGuard';
import { MonitorRefreshIndicator } from '../components/monitor/MonitorRefreshIndicator';
import { MonitorKpiCard } from '../components/monitor/MonitorKpiCard';
import { PvTrendChart } from '../components/monitor/PvTrendChart';
import { PvInverterTable } from '../components/monitor/PvInverterTable';
import { PvInverterDrawer } from '../components/monitor/PvInverterDrawer';
import { PvStationKpiDrawer } from '../components/monitor/PvStationKpiDrawer';
import { LoadingView, ErrorView, EmptyView, ReadonlyBanner } from '../components/common/StateViews';
import { PvInverterDetail, PvTrendSample, MonitorSystemState, UnifiedMonitorPoint } from '../types/monitor';
import {
  SunMedium,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  Radio,
  Sliders,
  Clock,
  Thermometer,
  CloudSun,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const MonitorPv: React.FC = () => {
  const navigate = useNavigate();
  const { scenario, switchScenario } = useAppStore();

  const {
    site,
    pvMonitorData,
    activeSystemState,
    simulatedStateOverride,
    setSimulatedStateOverride,
    // 刷新控制器
    countdown,
    refreshIntervalSeconds,
    setRefreshIntervalSeconds,
    isStreamInterrupted,
    toggleStreamInterrupted,
    resumeStream,
    lastDataTimestamp,
  } = useMonitorData();

  // 本地页面状态：时间范围 (严格遵守“时间范围仅影响当前页面”要求)
  const [timeRange, setTimeRange] = useState<'TODAY' | 'RECENT_4H' | 'YESTERDAY'>('TODAY');

  // 本地页面状态：选中的趋势采样点 (点击显示时间、功率、辐照度、质量等级和来源)
  const [selectedTrendSample, setSelectedTrendSample] = useState<PvTrendSample | null>(null);

  // 本地页面状态：选中的逆变器抽屉 (单机微观视角)
  const [selectedInverter, setSelectedInverter] = useState<PvInverterDetail | null>(null);

  // 本地页面状态：选中的全站汇总 KPI 指标抽屉 (全站宏观聚合视角)
  const [selectedKpiPoint, setSelectedKpiPoint] = useState<UnifiedMonitorPoint | null>(null);

  // 根据当前局部 timeRange 获取对应样本集
  const currentTrendSamples: PvTrendSample[] = React.useMemo(() => {
    switch (timeRange) {
      case 'RECENT_4H':
        return pvMonitorData.pvRecent4hSamples;
      case 'YESTERDAY':
        return pvMonitorData.pvYesterdaySamples;
      case 'TODAY':
      default:
        return pvMonitorData.pvTrendSamples;
    }
  }, [timeRange, pvMonitorData]);

  // 处理 5 大核心 KPI 卡片点击：打开全站汇总指标分析抽屉（包含所有逆变器的汇总拆解数据）
  const handleKpiDetailClick = (pointId: string) => {
    const point = pvMonitorData.kpiPoints.find((pt) => pt.id === pointId);
    if (point) {
      setSelectedKpiPoint(point);
    } else if (pvMonitorData.kpiPoints.length > 0) {
      setSelectedKpiPoint(pvMonitorData.kpiPoints[0]);
    }
  };

  return (
    <MonitorRoleGuard>
      <div className="space-y-6 pb-12">
        {/* 顶部面包屑与标题栏 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
              <span
                onClick={() => navigate('/monitor')}
                className="hover:text-[#004287] cursor-pointer transition-colors"
              >
                微电网运行监测
              </span>
              <span>/</span>
              <span className="text-slate-800 font-bold">分布式光伏监测</span>
              <span>·</span>
              <span className="font-mono text-slate-400">{site.id}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <SunMedium className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {site.name} · 光伏发电监测
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                1.2 MWp 示范工程
              </span>
            </div>
          </div>

          {/* 右侧：刷新控制器与快速导航 */}
          <div className="flex flex-wrap items-center gap-3">
            <MonitorRefreshIndicator
              countdown={countdown}
              refreshIntervalSeconds={refreshIntervalSeconds}
              onSetRefreshInterval={setRefreshIntervalSeconds}
              isStreamInterrupted={isStreamInterrupted}
              onToggleStreamInterrupted={toggleStreamInterrupted}
              onResumeStream={resumeStream}
              lastUpdatedTime={lastDataTimestamp}
            />

            <button
              type="button"
              onClick={() => navigate('/monitor')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
            >
              <span>微网监测总览</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 只读保护提示 */}
        <ReadonlyBanner
          message="当前处于光伏运行只读监测工作台。系统严格禁止通过本页面下发逆变器启停开关、MPPT 跟踪限制或有功调度指令。"
        />

        {/* 功率符号约定与规范说明栏 */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold">统一功率符号与时间口径规范：</span>
              <span className="text-amber-800 ml-1">
                光伏交流输出有功功率严格采用<strong>正值 (+)</strong> 表示发电中；
                页面严格区分<strong>瞬时功率 (kW)</strong>、<strong>今日累计发电量 (kWh)</strong> 与<strong>历史总电量 (MWh)</strong>，杜绝混用。
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 font-mono text-[11px] text-amber-700">
            <span>当前环境气温: {pvMonitorData.ambientTempC}℃</span>
            <span>·</span>
            <span>实时辐照度: {pvMonitorData.solarIrradiationWm2} W/m²</span>
          </div>
        </div>

        {/* 页面状态模拟演练栏 (支持：正常、白天零功率可疑、部分离线、未映射、加载、失败、空数据、场景B) */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>光伏监测工况状态模拟与业务规则演练切换</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">
                当前激活状态: <strong>{activeSystemState}</strong>
              </span>
              {simulatedStateOverride && (
                <button
                  type="button"
                  onClick={() => setSimulatedStateOverride(null)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 underline font-semibold"
                >
                  恢复真实环境
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { key: null, label: '标准实测', desc: '正常工况' },
              { key: 'SUSPICIOUS_ZERO', label: '白天零功率可疑', desc: '测试业务规则: 辐照充足但零出力' },
              { key: 'PARTIAL_OFFLINE', label: '逆变器部分离线', desc: '测试2#逆变器通信离线' },
              { key: 'PARTIAL_MISSING', label: '数据缺失断点', desc: '测试数据缺失不补齐平滑' },
              { key: 'UNMAPPED', label: '点位未映射', desc: '测试4#逆变器未绑定指标' },
              { key: 'LOADING', label: '加载中骨架', desc: '测试加载屏' },
              { key: 'ERROR', label: '通信故障', desc: '测试重试错误屏' },
              { key: 'NO_DEVICES', label: '无设备接入', desc: '测试空数据屏' },
            ].map((st) => (
              <button
                key={String(st.key)}
                type="button"
                onClick={() => setSimulatedStateOverride(st.key as any)}
                className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                  simulatedStateOverride === st.key
                    ? 'bg-[#004287] text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{st.label}</span>
              </button>
            ))}

            {/* 场景 B 储能异常关联对比 */}
            <button
              type="button"
              onClick={() => switchScenario(scenario === 'SCENARIO_A' ? 'SCENARIO_B' : 'SCENARIO_A')}
              className={`px-2.5 py-1 rounded text-xs transition-colors font-semibold flex items-center gap-1 ${
                scenario === 'SCENARIO_B'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              <span>{scenario === 'SCENARIO_B' ? '当前: 场景B (储能异常)' : '切换到场景B验证'}</span>
            </button>
          </div>
        </div>

        {/* 场景 B 特殊说明横幅 (验收标准：场景 B 不应错误地让光伏也离线) */}
        {scenario === 'SCENARIO_B' && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between gap-3 text-xs text-purple-950">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>场景 B 储能故障隔离验证正常：</strong>当前储能系统 EMS 通信中断，但<strong>光伏发电系统 (PV) 运行正常</strong>，4 台组串逆变器全量在网出力，遥测与发电质量不受影响。
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold shrink-0">
              光伏状态: NORMAL 在线
            </span>
          </div>
        )}

        {/* 白天异常零值横幅提示 (可疑规则触发) */}
        {activeSystemState === 'SUSPICIOUS_ZERO' && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
              <div>
                <strong className="text-amber-900">触发光伏业务规则告警：</strong>
                <span className="text-amber-800 ml-1">
                  当前微气象总辐照度高达 860 W/m² (有效日光照)，但光伏输出功率连续 30 分钟停滞为 0 kW，系统已将其标记为<strong>【可疑】</strong>。
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/alarms')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors self-start sm:self-auto shrink-0 shadow-2xs"
            >
              <span>前往告警风控中心</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 逆变器部分离线横幅提示 */}
        {activeSystemState === 'PARTIAL_OFFLINE' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>通信预警：</strong>检测到 <strong>2# 组串式光伏逆变器</strong> RS485 链路无应答超过 15 分钟，当前处于离线状态，已启动规约链路自动重试机制。
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold shrink-0">
              离线设备: DEV-PV-INV02
            </span>
          </div>
        )}

        {/* 点位未映射横幅提示 */}
        {activeSystemState === 'UNMAPPED' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>指标映射字典预警：</strong>4# 逆变器存在未绑定的未映射测点，请前往指标资产库进行标准物理量绑定。
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/data/assets')}
              className="inline-flex items-center gap-1 text-blue-700 hover:underline font-bold text-xs shrink-0"
            >
              <span>前往资产字典绑定</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 数据推流中断横幅 */}
        {isStreamInterrupted && (
          <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-between gap-3 text-xs text-slate-800">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                <strong>实时推流已暂停：</strong>当前页面显示为最后有效上报快照，自动倒计时已冻结。
              </span>
            </div>
            <button
              type="button"
              onClick={resumeStream}
              className="px-3 py-1 rounded bg-[#004287] text-white font-bold text-xs hover:bg-blue-800 transition-colors"
            >
              恢复推流
            </button>
          </div>
        )}

        {/* 条件渲染主区域视图 (支持加载、错误、空数据状态) */}
        {activeSystemState === 'LOADING' ? (
          <LoadingView text="正在加载示范站光伏逆变器矩阵实时遥测与气象辐照度数据..." />
        ) : activeSystemState === 'ERROR' ? (
          <ErrorView
            title="光伏数据前置机通信握手超时"
            message="示范站阳光电源 iSolarCloud Modbus-TCP 前置接口响应超时，重试 3 次未收到有效遥测帧。"
            onRetry={() => setSimulatedStateOverride(null)}
          />
        ) : activeSystemState === 'NO_DEVICES' ? (
          <EmptyView
            title="未检测到已接入的光伏设备"
            description="当前站点暂未接入符合标准化指标的光伏逆变器设备资产。"
            actionText="前往设备资产接入管理"
            onAction={() => navigate('/data/assets')}
          />
        ) : (
          <>
            {/* 1. 顶部 5 大 KPI 展示 (实时功率、今日发电量、累计发电量、装机容量、等效利用小时) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <span>光伏核心指标看板 (严格区分瞬时 kW 与累计 kWh / 历史 MWh / 装机 kWp / 利用小时 h)</span>
                <span className="font-mono text-[11px] text-slate-400">数据源统一集中选择器</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {pvMonitorData.kpiPoints.map((pt) => (
                  <MonitorKpiCard
                    key={pt.id}
                    point={pt}
                    onClickDetail={() => handleKpiDetailClick(pt.id)}
                  />
                ))}
              </div>
            </div>

            {/* 2. 中部：当日光伏实测出力趋势与辐照度对照 (双 Y 轴实测折线，点击查看点位) */}
            <PvTrendChart
              samples={currentTrendSamples}
              timeRange={timeRange}
              onChangeTimeRange={setTimeRange}
              selectedSample={selectedTrendSample}
              onSelectSample={setSelectedTrendSample}
            />

            {/* 3. 底部：逆变器列表，支持在线/离线/故障筛选与详情抽屉 */}
            <PvInverterTable
              inverters={pvMonitorData.inverters}
              onSelectInverter={(inv) => setSelectedInverter(inv)}
            />
          </>
        )}

        {/* 1. 顶部 5 大核心 KPI 点击弹出的全站光伏汇总指标分析抽屉 (包含全站 4 台逆变器贡献拆解与汇流聚合) */}
        <PvStationKpiDrawer
          selectedPoint={selectedKpiPoint}
          kpiPoints={pvMonitorData.kpiPoints}
          inverters={pvMonitorData.inverters}
          onSelectPoint={(pt) => setSelectedKpiPoint(pt)}
          onDrilldownInverter={(inv) => {
            setSelectedKpiPoint(null);
            setSelectedInverter(inv);
          }}
          onClose={() => setSelectedKpiPoint(null)}
        />

        {/* 2. 底部逆变器列表中点击或从汇总抽屉下钻查看的单台逆变器设备详情抽屉 */}
        <PvInverterDrawer
          inverter={selectedInverter}
          onClose={() => setSelectedInverter(null)}
        />
      </div>
    </MonitorRoleGuard>
  );
};
