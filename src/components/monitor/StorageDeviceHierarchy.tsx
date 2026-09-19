import React, { useState, useMemo } from 'react';
import {
  StoragePcsDetail,
  StorageBatteryClusterDetail,
} from '../../types/monitor';
import { StatusBadge } from '../common/StatusBadge';
import { MonitorQualityBadge } from './MonitorQualityBadge';
import {
  Layers,
  Zap,
  Battery,
  ChevronRight,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Thermometer,
  Activity,
  AlertTriangle,
  Info,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StorageDeviceHierarchyProps {
  pcsDetail: StoragePcsDetail;
  batteryClusters: StorageBatteryClusterDetail[];
  onSelectPcs: (pcs: StoragePcsDetail) => void;
  onSelectCluster: (cluster: StorageBatteryClusterDetail) => void;
  isScenarioBExpired?: boolean;
  className?: string;
}

export type StorageDeviceStatusFilter = 'ALL' | 'RUNNING' | 'STANDBY' | 'ALARM' | 'OFFLINE';

export const StorageDeviceHierarchy: React.FC<StorageDeviceHierarchyProps> = ({
  pcsDetail,
  batteryClusters,
  onSelectPcs,
  onSelectCluster,
  isScenarioBExpired = false,
  className = '',
}) => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StorageDeviceStatusFilter>('ALL');

  // 过滤逻辑
  const isPcsMatched = useMemo(() => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ALARM') return pcsDetail.status === 'ALARM';
    if (statusFilter === 'OFFLINE') return pcsDetail.status === 'OFFLINE';
    if (statusFilter === 'STANDBY') return pcsDetail.runningMode === 'STANDBY';
    if (statusFilter === 'RUNNING') return pcsDetail.runningMode === 'CHARGING' || pcsDetail.runningMode === 'DISCHARGING';
    return true;
  }, [pcsDetail, statusFilter]);

  const filteredClusters = useMemo(() => {
    return batteryClusters.filter((c) => {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'ALARM') return c.status === 'ALARM' || c.isSuspicious;
      if (statusFilter === 'OFFLINE') return c.status === 'OFFLINE';
      if (statusFilter === 'STANDBY') return Math.abs(c.currentA) < 0.1 && c.status === 'NORMAL';
      if (statusFilter === 'RUNNING') return Math.abs(c.currentA) >= 0.1 && c.status === 'NORMAL';
      return true;
    });
  }, [batteryClusters, statusFilter]);

  const pcsPower = pcsDetail.activePowerKw;
  const isPcsCharging = pcsPower < 0;
  const isPcsDischarging = pcsPower > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 顶部标题与状态筛选条 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900">
              储能系统三级拓扑与设备监测
            </h3>
            <span className="text-[11px] text-slate-500">
              储能系统预制舱 (总成) → PCS 变流器 (变流) → 4 个电池簇 / BMS (电芯)
            </span>
          </div>
        </div>

        {/* 状态筛选按钮组 */}
        <div className="flex items-center gap-1 overflow-x-auto self-start sm:self-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
          {[
            { key: 'ALL', label: '全部设备' },
            { key: 'RUNNING', label: '运行中 (充/放)' },
            { key: 'STANDBY', label: '待机中' },
            { key: 'ALARM', label: '故障 / 可疑' },
            { key: 'OFFLINE', label: '离线' },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key as StorageDeviceStatusFilter)}
              className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === f.key
                  ? 'bg-[#004287] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 层级 1: 储能系统总成卡片 (System Level) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  层级 1 · 预制舱总成
                </span>
                <h4 className="font-bold text-sm text-slate-900">
                  示范站 500kW/1000kWh 磷酸铁锂储能系统 (DEV-STORAGE-SYS01)
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                包含 1 台 500kW PCS 升压一体舱 + 1 台 1000kWh 液冷电池集装箱 (4 簇并联)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                isScenarioBExpired
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {isScenarioBExpired ? 'EMS 通信断线' : '系统联机运行'}
            </span>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
              母线电压: 748.2 V
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
          <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 text-[11px] block">核准容量</span>
            <span className="font-mono font-bold text-slate-800 text-sm">500kW / 1000kWh</span>
          </div>
          <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 text-[11px] block">电池化学体系</span>
            <span className="font-semibold text-slate-800 text-xs">磷酸铁锂 (CATL LFP 280Ah)</span>
          </div>
          <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 text-[11px] block">冷却温控形式</span>
            <span className="font-semibold text-blue-700 text-xs">水乙二醇一体化液冷 (0.5C)</span>
          </div>
          <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 text-[11px] block">消防抑制介质</span>
            <span className="font-semibold text-emerald-700 text-xs">七氟丙烷 (全淹没 + 簇级探测)</span>
          </div>
        </div>
      </div>

      {/* 层级 2: PCS 变流器卡片 (PCS Level) */}
      {isPcsMatched && (
        <div className="ml-0 sm:ml-4 pl-0 sm:pl-4 sm:border-l-2 sm:border-blue-200">
          <div
            onClick={() => onSelectPcs(pcsDetail)}
            className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group ${
              pcsDetail.status === 'ALARM'
                ? 'border-red-300 bg-red-50/15 hover:border-red-400'
                : 'border-slate-200/90 hover:border-blue-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    pcsDetail.status === 'ALARM'
                      ? 'bg-red-100 text-red-700'
                      : isPcsCharging
                      ? 'bg-blue-100 text-blue-700'
                      : isPcsDischarging
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      层级 2 · 变流器
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                      {pcsDetail.name}
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    型号: {pcsDetail.model} · 额定功率: {pcsDetail.ratedCapacity} · 编号: {pcsDetail.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={pcsDetail.status} size="sm" />
                <span className="text-xs text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  <span>详情抽屉</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* PCS 核心遥测指标 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block">实时出力功率</span>
                <span
                  className={`font-mono font-bold text-sm flex items-center gap-1 ${
                    isPcsCharging
                      ? 'text-blue-700'
                      : isPcsDischarging
                      ? 'text-emerald-700'
                      : 'text-slate-700'
                  }`}
                >
                  {isPcsCharging && <ArrowDownRight className="w-3.5 h-3.5 text-blue-600" />}
                  {isPcsDischarging && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />}
                  {pcsDetail.activePowerKw} kW
                </span>
                <span className="text-[10px] text-slate-500">
                  {isPcsCharging ? '吸收电网电能' : isPcsDischarging ? '释放电能上网' : '零出力待机'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[11px] block">交流侧线电压</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {pcsDetail.acVoltageV} V
                </span>
                <span className="text-[10px] text-slate-500">400V 低压交流并网</span>
              </div>

              <div>
                <span className="text-slate-500 text-[11px] block">交流侧线电流</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {pcsDetail.acCurrentA} A
                </span>
                <span className="text-[10px] text-slate-500">额定电流 360A</span>
              </div>

              <div>
                <span className="text-slate-500 text-[11px] block">电网频率 / 因数</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {pcsDetail.frequencyHz} Hz / {pcsDetail.powerFactor}
                </span>
                <span className="text-[10px] text-slate-500">电网同步正常</span>
              </div>

              <div>
                <span className="text-slate-500 text-[11px] block">IGBT 桥臂温度</span>
                <span className="font-mono font-bold text-slate-800 text-sm flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                  {pcsDetail.igbtTempC} ℃
                </span>
                <span className="text-[10px] text-slate-500">限温 85℃ 正常</span>
              </div>

              <div>
                <span className="text-slate-500 text-[11px] block">变流转换效率</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {pcsDetail.conversionEfficiency} %
                </span>
                <span className="text-[10px] text-slate-500">双向高能效整流/逆变</span>
              </div>
            </div>

            {pcsDetail.status === 'ALARM' && pcsDetail.linkedAlarms && pcsDetail.linkedAlarms.length > 0 && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/alarms?deviceId=DEV-STORAGE-PCS01');
                }}
                className="mt-3 p-2 bg-red-100/60 rounded-lg border border-red-200 text-xs text-red-900 flex items-center justify-between cursor-pointer hover:bg-red-100"
              >
                <div className="flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="font-bold">存在活动紧急告警：</span>
                  <span>{pcsDetail.linkedAlarms[0].title}</span>
                </div>
                <span className="text-[11px] text-red-700 underline font-semibold flex items-center gap-0.5">
                  <span>跳转告警中心</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 层级 3: 电池系统与 4 簇电池 (Battery Clusters / BMS Level) */}
      <div className="ml-0 sm:ml-4 pl-0 sm:pl-4 sm:border-l-2 sm:border-emerald-200 space-y-3">
        {/* 电池舱总成标头 */}
        <div className="flex items-center justify-between text-xs text-slate-700 bg-slate-100/80 p-2.5 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px]">
              层级 3 · 电池舱簇控 (BMS)
            </span>
            <span className="font-bold text-slate-900">
              宁德时代 1000kWh 户外液冷电池舱总成 (DEV-STORAGE-BATT01)
            </span>
            <span className="text-slate-500 text-[11px]">
              （4 簇并联接入直流母线 · 点击任意电池簇查看单体电压与温差分布）
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            当前显示: {filteredClusters.length} / {batteryClusters.length} 簇
          </span>
        </div>

        {/* 4 个电池簇网格卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredClusters.map((cluster) => {
            const isClusterSuspicious = cluster.isSuspicious;
            return (
              <div
                key={cluster.id}
                onClick={() => onSelectCluster(cluster)}
                className={`bg-white rounded-xl border p-3.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between ${
                  cluster.status === 'ALARM'
                    ? 'border-red-300 bg-red-50/15 hover:border-red-400'
                    : isClusterSuspicious
                    ? 'border-amber-300 bg-amber-50/15 hover:border-amber-400'
                    : 'border-slate-200/90 hover:border-emerald-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center ${
                          isClusterSuspicious
                            ? 'bg-amber-100 text-amber-700'
                            : cluster.status === 'ALARM'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        <Battery className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {cluster.name}
                        </h5>
                        <span className="text-[10px] font-mono text-slate-500">
                          {cluster.id} · 250 kWh
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isClusterSuspicious && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-200 flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          温差可疑
                        </span>
                      )}
                      <StatusBadge status={cluster.status} size="sm" />
                    </div>
                  </div>

                  {/* 电池簇核心遥测参数 */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 text-[10px] block font-sans">簇端总压</span>
                      <strong className="text-slate-800">{cluster.voltageV} V</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block font-sans">充放电流</span>
                      <strong
                        className={
                          cluster.currentA < 0
                            ? 'text-blue-700'
                            : cluster.currentA > 0
                            ? 'text-emerald-700'
                            : 'text-slate-700'
                        }
                      >
                        {cluster.currentA} A
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block font-sans">荷电 / 健康</span>
                      <strong className="text-slate-800">
                        {cluster.socPercent}% / {cluster.sohPercent}%
                      </strong>
                    </div>
                  </div>

                  {/* 电芯单体压差与温差核心指标 (BMS 关键安全) */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div className="bg-slate-50/80 p-2 rounded border border-slate-100">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">单体最大压差:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {cluster.cellVoltageDeltaMv} mV
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                        {cluster.maxCellVoltageV}V ~ {cluster.minCellVoltageV}V
                      </span>
                    </div>

                    <div
                      className={`p-2 rounded border ${
                        isClusterSuspicious
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-slate-50/80 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={isClusterSuspicious ? 'text-amber-800 font-bold' : 'text-slate-500'}>
                          电芯最大温差:
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isClusterSuspicious ? 'text-amber-900 font-extrabold' : 'text-slate-800'
                          }`}
                        >
                          {cluster.cellTempDeltaC} ℃
                        </span>
                      </div>
                      <span
                        className={`text-[10px] block mt-0.5 font-mono ${
                          isClusterSuspicious ? 'text-amber-700' : 'text-slate-400'
                        }`}
                      >
                        最高温 {cluster.maxCellTempC}℃ ({cluster.maxCellTempLocation})
                      </span>
                    </div>
                  </div>
                </div>

                {/* 底部详情提示 */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    <span>绝缘: {cluster.insulationResistancePositiveMohm}MΩ</span>
                    <span>·</span>
                    <span>均衡: {cluster.equalizationStatus === 'ACTIVE' ? '主动开启' : '待机'}</span>
                  </span>
                  <span className="text-emerald-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    <span>电芯测点分析</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredClusters.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            当前筛选条件下未发现匹配的电池簇设备。
          </div>
        )}
      </div>
    </div>
  );
};
