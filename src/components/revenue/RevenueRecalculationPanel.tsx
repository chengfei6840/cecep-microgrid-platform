import React from 'react';
import { RecalculationBatch } from '../../types/domain';
import { VersionBadge } from '../common/VersionBadge';
import {
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  GitCompare,
  UserCheck,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface RevenueRecalculationPanelProps {
  batches: RecalculationBatch[];
  onOpenRecalculateDialog: () => void;
  canInitiate: boolean;
}

export const RevenueRecalculationPanel: React.FC<RevenueRecalculationPanelProps> = ({
  batches,
  onOpenRecalculateDialog,
  canInitiate,
}) => {
  const getStatusBadge = (status: RecalculationBatch['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            已完成并归档
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            计算引擎重算中
          </span>
        );
      case 'AWAITING_CONFIRM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            待运营二次确认
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            排队等待中
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            重算异常失败
          </span>
        );
    }
  };

  const latestBatch = batches[0];

  return (
    <div className="space-y-5">
      {/* 1. 顶部操作说明与发起区 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              历史收益重算与版本归档台账
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            严格遵循可追溯审计要求：历史数据补采或电价调整修复后，必须生成新版本并永久保留旧版本，严禁覆盖历史原记录。
          </p>
        </div>

        {canInitiate && (
          <button
            onClick={onOpenRecalculateDialog}
            className="px-4 py-2 bg-[#004287] hover:bg-[#003366] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>发起新重算任务 (生成 V2.0)</span>
          </button>
        )}
      </div>

      {/* 2. 重点对比卡：V1 原始结算 vs V2 修正重算 (双版本并列对比) */}
      {latestBatch ? (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm border border-slate-700/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <GitCompare className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold tracking-tight">
                最近重算版本对账：{latestBatch.originalVersion} ➔ {latestBatch.targetVersion}
              </h4>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-slate-400">批次追踪号: {latestBatch.traceId}</span>
              {getStatusBadge(latestBatch.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* V1 原始版本 */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-300">原版本 (V1.0 原始结算)</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px] font-mono">
                  封存留存
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-200 mt-2">
                ¥{latestBatch.v1NetRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-400 mt-2 space-y-1">
                <div>• 数据置信度：71.4% (储能丢失2批次)</div>
                <div>• 储能套利额：¥1,650.00</div>
                <div>• 电网购电费：-¥4,920.00</div>
              </div>
            </div>

            {/* 差异差额 */}
            <div className="bg-emerald-950/40 rounded-xl p-4 border border-emerald-700/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
                  <span className="font-semibold">重算差异额 (Variance)</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 text-[10px] font-bold">
                    净收益上浮
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
                  +¥{latestBatch.varianceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-emerald-300/80 mt-2">
                  相对增幅: +{((latestBatch.varianceAmount / latestBatch.v1NetRevenue) * 100).toFixed(2)}%
                </div>
              </div>
              <div className="text-[11px] text-emerald-400/90 pt-2 border-t border-emerald-800/50">
                差额成因：时代星云储能历史遥测补录后，确认夜间谷段充电实际电量少于盲估推算，成本降低套利增加。
              </div>
            </div>

            {/* V2 修正版本 */}
            <div className="bg-blue-950/40 rounded-xl p-4 border border-blue-600/50">
              <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
                <span className="font-semibold text-blue-200">新版本 ({latestBatch.targetVersion})</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">
                  现行生效
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
                ¥{latestBatch.v2NetRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-blue-200/80 mt-2 space-y-1">
                <div>• 数据置信度：99.5% (已补录验证)</div>
                <div>• 储能套利额：¥1,936.50 (+286.5元)</div>
                <div>• 审计结论：财务对账正式归档</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center text-slate-500 text-xs">
          <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">暂无历史重算批次记录</p>
          <p className="mt-1">当发现遥测缺失补录、电价版本回溯或表计校准后，运营人员可在此发起重算。</p>
        </div>
      )}

      {/* 3. 历史重算批次列表与审计时间线 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h4 className="text-sm font-bold text-slate-900">
            全部重算批次与审计时间线 (Audit Timeline)
          </h4>
          <span className="text-xs font-mono text-slate-500">
            累计 {batches.length} 个批次
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {batches.map((batch) => (
            <div key={batch.id} className="p-5 hover:bg-slate-50/70 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {batch.id}
                    </span>
                    {getStatusBadge(batch.status)}
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                      {batch.originalVersion} ➔ {batch.targetVersion}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium mt-1">
                    <span className="text-slate-500">重算原因：</span>
                    {batch.reason}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0">
                  <div>
                    <span className="text-slate-400 block text-[11px]">核算区间</span>
                    <span className="font-medium text-slate-800">{batch.dateRange}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">发起人</span>
                    <span className="font-medium text-slate-800">{batch.initiator}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">收益差异</span>
                    <span className="font-mono font-bold text-emerald-600 text-sm">
                      +{batch.varianceAmount.toFixed(2)} 元
                    </span>
                  </div>
                </div>
              </div>

              {/* 审计流水节点展示 */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px]">
                <div className="flex items-start gap-2 text-slate-600">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-[10px] font-bold">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">补采数据归入</div>
                    <div className="text-slate-400">{batch.initiateTime}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-slate-600">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-[10px] font-bold">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">运营审核发起</div>
                    <div className="text-slate-400">{batch.initiator} 确认</div>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-slate-600">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-[10px] font-bold">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">规则引擎重新结算</div>
                    <div className="text-slate-400">保留 V1 对账快照</div>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-slate-600">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-[10px] font-bold">
                    4
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">生成 V2.0 归档</div>
                    <div className="text-slate-400 font-mono">{batch.traceId}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
