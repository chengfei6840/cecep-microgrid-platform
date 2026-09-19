import React from 'react';
import { UnifiedMonitorPoint, StorageBatteryClusterDetail, StoragePcsDetail } from '../../types/monitor';
import { MonitorQualityBadge } from './MonitorQualityBadge';
import {
  X,
  Layers,
  BatteryCharging,
  Zap,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Clock,
  Lock,
  FileText,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StorageKpiDrawerProps {
  point: UnifiedMonitorPoint | null;
  pcsDetail: StoragePcsDetail;
  batteryClusters: StorageBatteryClusterDetail[];
  onClose: () => void;
  isScenarioBExpired?: boolean;
}

export const StorageKpiDrawer: React.FC<StorageKpiDrawerProps> = ({
  point,
  pcsDetail,
  batteryClusters,
  onClose,
  isScenarioBExpired = false,
}) => {
  const navigate = useNavigate();

  if (!point) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden text-slate-800 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. 抽屉顶部头部 */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#004287] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  全站汇总指标
                </span>
                <h2 className="text-base font-bold text-slate-900">{point.pointName}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                标准测点代码: <span className="font-mono">{point.standardCode}</span> · 统计口径: 全站储能总成汇总
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MonitorQualityBadge
              quality={point.quality}
              source={point.qualitySource}
              reason={point.qualityReason}
              size="md"
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              title="关闭抽屉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. 抽屉内容主体 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* 只读保护提示 */}
          <div className="p-3.5 bg-slate-100/90 border border-slate-200 rounded-xl flex items-start gap-3 text-slate-700">
            <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                指标全景溯源与设备贡献分析
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                此抽屉反映<strong>全站储能系统整体运行指标</strong>的计算依据与下属各子设备（PCS 变流器、4 簇电池组）的出力构成，页面受只读安全保护。
              </p>
            </div>
          </div>

          {/* 当前宏观汇总数值卡 */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-xs">全站储能宏观实测汇总值</span>
              <span className="text-[11px] font-mono text-slate-500">
                更新时刻: {point.lastUpdated}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900">
                {point.formattedValue}
              </span>
              <span className="text-sm font-semibold text-slate-500">{point.unit}</span>
              {point.powerDirectionNote && (
                <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {point.powerDirectionNote}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <strong>指标口径说明：</strong>
              {point.standardCode === 'BATT_SOC_PERCENT' &&
                '表示全站 4 簇电池的加权平均荷电状态，作为能量管理系统 (EMS) 剩余电量估算与两充两放策略调度依据。'}
              {point.standardCode === 'BATT_SOH_PERCENT' &&
                '基于 CATL 电芯容量衰减模型，反映电池簇当前健康度，与日内荷电状态 (SOC) 严格区分，严禁混淆。'}
              {point.standardCode === 'PCS_ACTIVE_POWER' &&
                '变流器交流并网端口净出力，正值 (+) 为放电、负值 (-) 为充电，遵循电力行业微电网功率符号公约。'}
              {point.standardCode === 'STORAGE_DAILY_CHARGE_KWH' &&
                '当日 00:00 至今储能系统累计自电网或光伏吸收的充电总电量，经 0.5S 关口电表微积分核算。'}
              {point.standardCode === 'STORAGE_DAILY_DISCHARGE_KWH' &&
                '当日 00:00 至今储能系统累计向站内负荷或电网释放的放电总电量。'}
              {point.standardCode === 'STORAGE_RATED_CAPACITY' &&
                '经电网接入批复的核准储能装机容量：500 kW / 1000 kWh。'}
            </p>
          </div>

          {/* 4 簇电池设备的贡献构成分析 */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <BatteryCharging className="w-4 h-4 text-emerald-600" />
                下属 4 簇电池并联参数与贡献分布
              </span>
              <span className="text-[11px] font-mono text-slate-500">4 簇并联对总成贡献</span>
            </div>

            <div className="space-y-2">
              {batteryClusters.map((cluster) => (
                <div
                  key={cluster.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {cluster.name}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      端压: <strong className="font-mono text-slate-800">{cluster.voltageV}V</strong> ·
                      电流: <strong className="font-mono text-slate-800">{cluster.currentA}A</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 font-sans text-[10px]">SOC: </span>
                      <strong className="text-slate-900">{cluster.socPercent}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans text-[10px]">SOH: </span>
                      <strong className="text-emerald-700">{cluster.sohPercent}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans text-[10px]">温差: </span>
                      <strong className="text-amber-700">{cluster.cellTempDeltaC}℃</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 数据质量诊断与溯源凭证 */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Clock className="w-4 h-4 text-blue-600" />
              数据质量规则判定与凭证说明
            </span>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">质量判定等级:</span>
                <span className="font-bold text-slate-800">{point.quality}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">数据来源通道:</span>
                <span className="font-mono text-slate-800">{point.qualitySource}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">校验结果依据:</span>
                <span className="text-slate-700">{point.qualityReason}</span>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/data/quality?deviceId=DEV-STORAGE-SYS01')}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition-colors inline-flex items-center gap-1 text-xs"
                >
                  <span>前往全站数据质量中心查看明细</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 抽屉底部操作栏 */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">统计口径与时间基准受统一数据规范管辖</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
