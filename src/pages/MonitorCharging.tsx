import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChargingMonitorData, ChargingSimulatedState } from '../hooks/useChargingMonitorData';
import { ChargingKpiCards } from '../components/monitor/charging/ChargingKpiCards';
import { ChargingTrendAndDistribution } from '../components/monitor/charging/ChargingTrendAndDistribution';
import { ChargingPileTable } from '../components/monitor/charging/ChargingPileTable';
import { ChargingOrderTable } from '../components/monitor/charging/ChargingOrderTable';
import { ChargingPileDrawer } from '../components/monitor/charging/ChargingPileDrawer';
import { ChargingBillingDrawer } from '../components/monitor/charging/ChargingBillingDrawer';
import { MonitorRefreshIndicator } from '../components/monitor/MonitorRefreshIndicator';
import { MonitorRoleGuard } from '../components/monitor/MonitorRoleGuard';
import {
  ReadonlyBanner,
  LoadingView,
  ErrorView,
  EmptyView,
} from '../components/common/StateViews';
import { ChargerPile, ChargingOrder } from '../types/charging';
import {
  BatteryCharging,
  Zap,
  Sliders,
  Receipt,
  FileText,
  AlertTriangle,
  Lock,
  Layers,
  Info,
  ShieldCheck,
} from 'lucide-react';

export const MonitorCharging: React.FC = () => {
  const navigate = useNavigate();
  const {
    site,
    countdown,
    refreshIntervalSeconds,
    setRefreshIntervalSeconds,
    isStreamInterrupted,
    toggleStreamInterrupted,
    resumeStream,
    effectiveDataTimestamp,
    simulatedState,
    setSimulatedState,
    kpis,
    piles,
    orders,
    trendSamples24h,
    referencedTariffVersion,
  } = useChargingMonitorData();

  // 底部活跃页签: 充电桩列表 vs 充电订单
  const [activeTab, setActiveTab] = useState<'PILES' | 'ORDERS'>('PILES');

  // 抽屉状态
  const [selectedPile, setSelectedPile] = useState<ChargerPile | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ChargingOrder | null>(null);

  // 跳转告警中心
  const handleJumpAlarm = (pile: ChargerPile) => {
    // 携带参数跳转告警中心，并保留设备筛选
    navigate(`/alarms?deviceId=${pile.id}&search=${encodeURIComponent(pile.pileCode)}`);
  };

  // 状态视图判断
  if (simulatedState === 'ERROR') {
    return (
      <MonitorRoleGuard>
        <div className="space-y-6">
          <ErrorView
            message="与充电桩群协议前置机建立通信连接超时，未能获取最新遥测数据"
            onRetry={() => setSimulatedState('NORMAL')}
          />
        </div>
      </MonitorRoleGuard>
    );
  }

  if (simulatedState === 'NO_DEVICES') {
    return (
      <MonitorRoleGuard>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900">充电桩群运行与运营监测</h1>
            <button
              onClick={() => setSimulatedState('NORMAL')}
              className="text-xs text-blue-600 underline font-semibold"
            >
              恢复正常状态
            </button>
          </div>
          <EmptyView
            title="未检索到接入的充电桩设备"
            description="当前园区微电网拓扑配置中暂未绑定直流快充桩或交流充电桩设备。"
          />
        </div>
      </MonitorRoleGuard>
    );
  }

  return (
    <MonitorRoleGuard>
      <div className="space-y-6">
        {/* 1. 顶部标头与面包屑导航 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>微电网实时监测</span>
              <span>/</span>
              <span className="text-slate-900 font-semibold">充电桩群运行与运营监测</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                {site.name}·12台双枪快充桩群实时监测
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                24 枪大功率快充集群
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              单向受电负荷监测 · 实时总负荷、今日累计电量、桩枪在线占用矩阵与模拟订单流水核算（严禁下发控制指令）。
            </p>
          </div>

          {/* 全局模拟刷新控制器 */}
          <MonitorRefreshIndicator
            countdown={countdown}
            refreshIntervalSeconds={refreshIntervalSeconds}
            onSetRefreshInterval={setRefreshIntervalSeconds}
            isStreamInterrupted={isStreamInterrupted}
            onToggleStreamInterrupted={toggleStreamInterrupted}
            onResumeStream={resumeStream}
            lastUpdatedTime={effectiveDataTimestamp}
            siteCode={site.code}
            siteName={site.name}
          />
        </div>

        {/* 2. 只读受控安全警示横幅 (严格落实只读原则，禁止任何远程启停/控制) */}
        <ReadonlyBanner
          message="当前处于充电桩运行只读监测工作台。系统已锁定下行链路，禁用充电桩远程下行控制、远程参数修改与启停操作；本系统未接入商业支付能力，订单金额仅作为运营计量与微网财务结算核对。"
        />

        {/* 3. 计费版本引用与 T+1 财务口径规范横幅 */}
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold">分时计费依据与结算口径规范：</span>
              <span className="text-amber-800 ml-1">
                订单计费动态引用全局核准方案版本 <strong>{referencedTariffVersion}</strong>；
                <strong>T+1 前未完整拉取的订单</strong>统一标记为【待完整同步】，<strong>绝不计入正式结算收益</strong>，仅纳入今日预估收益池供即时运营查看。
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 font-mono text-[11px] text-amber-800">
            <span>协议标准: OCPP 1.6 / 网关中继</span>
            <span>·</span>
            <span>无商业支付 SDK</span>
          </div>
        </div>

        {/* 4. 充电监测工况模拟演练控制器 */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              <span>充电桩群工况演练与数据同步状态切换</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">
                当前工况: <strong>{simulatedState}</strong>
              </span>
              {simulatedState !== 'NORMAL' && (
                <button
                  type="button"
                  onClick={() => setSimulatedState('NORMAL')}
                  className="text-[11px] text-blue-600 hover:text-blue-800 underline font-semibold"
                >
                  恢复标准工况
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { key: 'NORMAL', label: '标准运营', desc: '平稳运营 (128.4kW, 6桩充电)' },
              { key: 'ORDER_PENDING_SYNC', label: 'T+1 待同步流水', desc: '含 3 笔待拉取订单 (不计入结算)' },
              { key: 'ORDER_FIELD_MISSING', label: '字段缺失异常', desc: '包含 1 笔挂起异常订单' },
              { key: 'CHARGING_PEAK', label: '高峰满负荷', desc: '10 桩正在充电 (210kW)' },
              { key: 'ALL_IDLE', label: '夜间全空闲', desc: '0kW 负荷，全场待机' },
              { key: 'OFFLINE_CRITICAL', label: '多桩离线告警', desc: '3 桩离线失联' },
              { key: 'NO_DEVICES', label: '无设备空态', desc: '空数据接入态' },
              { key: 'ERROR', label: '通信故障态', desc: '网关超时错误态' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSimulatedState(item.key as ChargingSimulatedState)}
                className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                  simulatedState === item.key
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title={item.desc}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 5. 顶部 5 大 KPI 核心指标卡片 */}
        <ChargingKpiCards kpis={kpis} />

        {/* 6. 中部：当日实测负荷趋势 (左) + 桩状态分布与枪口矩阵 (右) */}
        <ChargingTrendAndDistribution
          trendSamples={trendSamples24h}
          piles={piles}
          onSelectPile={(pile) => setSelectedPile(pile)}
        />

        {/* 7. 底部页签：充电桩列表 vs 充电流水订单 */}
        <div className="space-y-4">
          {/* 页签切换按钮 */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('PILES')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'PILES'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>充电桩设备监测列表 ({piles.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('ORDERS')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'ORDERS'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>充电订单与计费拆解 ({orders.length})</span>
              </button>
            </div>

            <div className="text-xs text-slate-400 hidden sm:block font-mono">
              计费方案: {referencedTariffVersion} · 仅限监测与核算
            </div>
          </div>

          {/* 页签内容切换 */}
          {activeTab === 'PILES' ? (
            <ChargingPileTable
              piles={piles}
              onSelectPile={(pile) => setSelectedPile(pile)}
              onJumpAlarm={handleJumpAlarm}
            />
          ) : (
            <ChargingOrderTable
              orders={orders}
              onViewBreakdown={(order) => setSelectedOrder(order)}
              referencedTariffVersion={referencedTariffVersion}
            />
          )}
        </div>

        {/* 8. 充电桩详情抽屉 (只读受控) */}
        <ChargingPileDrawer
          pile={selectedPile}
          isOpen={!!selectedPile}
          onClose={() => setSelectedPile(null)}
          onJumpAlarm={handleJumpAlarm}
        />

        {/* 9. 计费拆解详情抽屉 (动态引用电价版本，T+1 口径严密判定) */}
        <ChargingBillingDrawer
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          referencedTariffVersion={referencedTariffVersion}
        />
      </div>
    </MonitorRoleGuard>
  );
};
