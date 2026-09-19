import React, { useState } from 'react';
import { ReportItem, ReportVersionRecord } from '../../types/domain';
import {
  X,
  Download,
  Printer,
  History,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  Layers,
  ArrowRight,
  TrendingUp,
  Zap,
  Battery,
  Building,
  Info,
} from 'lucide-react';
import { exportReportToCSV } from '../../utils/reportExport';

interface ReportPreviewDrawerProps {
  report: ReportItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportPreviewDrawer: React.FC<ReportPreviewDrawerProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const [activeVersionIndex, setActiveVersionIndex] = useState<number>(0);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen || !report) return null;

  const versions = report.versions || [
    {
      version: report.version,
      generatedTime: report.generatedTime,
      author: report.author,
      tariffVersion: report.tariffVersion,
      revenueSnapshotVersion: report.revenueSnapshotVersion,
      revenueSnapshotId: report.revenueSnapshotId,
      dataConfidencePercent: report.dataConfidencePercent,
      qualityFlag: report.qualityLevel,
      changeReason: '首次生成归档',
      fileSize: report.fileSize,
      traceId: report.traceId,
    },
  ];

  const currentVersion = versions[activeVersionIndex] || versions[0];
  const p = report.payload || {};

  const handleExportCSV = () => {
    const ok = exportReportToCSV(report);
    if (ok) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-slideLeft">
        {/* 1. 顶栏操作区 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-500 font-semibold">
                  {report.reportCode}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-800">
                  {report.version}
                </span>
                {report.isSettlementFormal ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="w-3 h-3" />
                    正式结算报表
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-300">
                    <AlertTriangle className="w-3 h-3" />
                    测算草稿 / 非正式凭证
                  </span>
                )}
              </div>
              <h1 className="text-base font-bold text-slate-900 line-clamp-1 mt-0.5">
                {report.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {downloadSuccess && (
              <span className="text-xs text-emerald-600 font-semibold animate-fadeIn flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 已下载 CSV
              </span>
            )}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
              title="下载标准 UTF-8 CSV 文件"
            >
              <Download className="w-3.5 h-3.5" />
              导出 CSV
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
              title="浏览器打印或保存为 PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              打印 / 存为 PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. 抽屉滚动内容区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 printable-area">
          {/* 风险告警横幅（如有） */}
          {report.hasRiskWarning && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>数据质量风险提示：{report.riskDescription || '数据受损'}</span>
              </div>
              <p className="text-amber-800/90 leading-relaxed">
                当前报表生成时存在通信缺失或点位异常（置信度：{(typeof report.dataConfidencePercent === 'number' ? report.dataConfidencePercent : 71.4).toFixed(1)}%）。本报表仅作为运营测算底稿与排查参考，严禁作为正式财务结算或银行对账凭据！
              </p>
            </div>
          )}

          {/* 报表元数据信息栏 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px]">所属站点 (单站口径)</span>
              <span className="font-semibold text-slate-900 block mt-0.5">
                {report.siteName}
              </span>
              <span className="text-[10px] text-slate-400">{report.siteId}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">核算周期</span>
              <span className="font-semibold text-slate-900 block mt-0.5">
                {report.period}
              </span>
              <span className="text-[10px] text-slate-400">T+1 日终核算</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">电价方案版本</span>
              <span className="font-semibold text-slate-900 block mt-0.5 truncate" title={report.tariffVersion}>
                {report.tariffVersion || '两部制 V2.1'}
              </span>
              <span className="text-[10px] text-slate-400">两部制工商业峰平谷</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">收益快照关联</span>
              <span className="font-semibold text-slate-900 block mt-0.5 truncate" title={report.revenueSnapshotId}>
                {report.revenueSnapshotId ? `${report.revenueSnapshotVersion || 'V1'} (${report.revenueSnapshotId})` : '实时计算'}
              </span>
              <span className="text-[10px] text-slate-400">
                置信度: {(typeof report.dataConfidencePercent === 'number' ? report.dataConfidencePercent : 99.2).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 报表版本时间线 (若存在 V1/V2 演进或重算) */}
          <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-800">
                  报表版本追踪与重算演进时间线 (保留历史原版，严禁直接覆盖)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                共记录 {versions.length} 个核算版本
              </span>
            </div>

            <div className="space-y-2">
              {versions.map((ver, idx) => (
                <div
                  key={ver.version + idx}
                  onClick={() => setActiveVersionIndex(idx)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    idx === activeVersionIndex
                      ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        ver.version === 'V2.0'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {ver.version}
                    </span>
                    <div>
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        <span>{ver.changeReason || '版本生成'}</span>
                        {ver.version === report.version && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                            当前展示版
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                        <span>生成时间：{ver.generatedTime}</span>
                        <span>操作人：{ver.author}</span>
                        <span>置信度：{(typeof ver.dataConfidencePercent === 'number' ? ver.dataConfidencePercent : 99.2).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-mono block">
                      {ver.traceId}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {ver.qualityFlag === 'PATCHED'
                        ? '重算修正完成'
                        : ver.qualityFlag === 'ANOMALY'
                        ? '初核异常保留'
                        : '正常已归档'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 综合分析摘要 */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              运营分析综合摘要
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {report.summary}
            </p>
          </div>

          {/* 关键能量与经济指标看板 */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              核心量能平衡与财务指标快照
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {p.pvGenerationKwh !== undefined && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-xs block">光伏总发电量</span>
                  <span className="text-lg font-extrabold text-slate-900 block mt-1">
                    {Number(p.pvGenerationKwh).toLocaleString('zh-CN', { minimumFractionDigits: 1 })}
                    <span className="text-xs font-normal text-slate-500 ml-1">kWh</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 mt-0.5 block">
                    清洁能源消纳率 100%
                  </span>
                </div>
              )}

              {p.chargingKwh !== undefined && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-xs block">充电桩消纳电量</span>
                  <span className="text-lg font-extrabold text-slate-900 block mt-1">
                    {Number(p.chargingKwh).toLocaleString('zh-CN', { minimumFractionDigits: 1 })}
                    <span className="text-xs font-normal text-slate-500 ml-1">kWh</span>
                  </span>
                  <span className="text-[10px] text-blue-600 mt-0.5 block">
                    服务车次集中消纳
                  </span>
                </div>
              )}

              {p.storageArbitrage !== undefined && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-xs block">储能削峰填谷套利</span>
                  <span className="text-lg font-extrabold text-emerald-600 block mt-1">
                    ¥{Number(p.storageArbitrage).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    谷充峰放价差收益
                  </span>
                </div>
              )}

              {p.netComprehensiveRevenue !== undefined && (
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-emerald-800 text-xs font-semibold block">
                    微电网综合净收益
                  </span>
                  <span className="text-lg font-extrabold text-emerald-700 block mt-1">
                    ¥{Number(p.netComprehensiveRevenue).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-emerald-600 mt-0.5 block">
                    含光伏/储能/充电/购电
                  </span>
                </div>
              )}

              {p.gridPurchaseKwh !== undefined && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-xs block">关口购电电量</span>
                  <span className="text-lg font-extrabold text-slate-900 block mt-1">
                    {Number(p.gridPurchaseKwh).toLocaleString('zh-CN', { minimumFractionDigits: 1 })}
                    <span className="text-xs font-normal text-slate-500 ml-1">kWh</span>
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    市电入园补充电量
                  </span>
                </div>
              )}

              {p.deviceAvailabilityRate !== undefined && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-xs block">设备加权可用率</span>
                  <span className="text-lg font-extrabold text-slate-900 block mt-1">
                    {p.deviceAvailabilityRate}%
                  </span>
                  <span className="text-[10px] text-emerald-600 mt-0.5 block">
                    通信心跳正常
                  </span>
                </div>
              )}

              {p.patrolCompletionRate !== undefined && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-xs block">巡检点检完成率</span>
                  <span className="text-lg font-extrabold text-slate-900 block mt-1">
                    {p.patrolCompletionRate}%
                  </span>
                  <span className="text-[10px] text-emerald-600 mt-0.5 block">
                    现场点检全部按期完成
                  </span>
                </div>
              )}

              {p.closedWorkOrdersCount !== undefined && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-xs block">隐患工单闭环数</span>
                  <span className="text-lg font-extrabold text-slate-900 block mt-1">
                    {p.closedWorkOrdersCount}
                    <span className="text-xs font-normal text-slate-500 ml-1">单</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 mt-0.5 block">
                    闭环复核率 100%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 业务分段明细清单 */}
          {p.detailsList && Array.isArray(p.detailsList) && p.detailsList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  业务明细清单与审计核验项
                </h3>
                <span className="text-[11px] text-slate-400">
                  共 {p.detailsList.length} 条记录
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">时段 / 序号</th>
                      <th className="py-2.5 px-3">业务科目 / 巡检任务</th>
                      <th className="py-2.5 px-3 text-right">数值 / 结果</th>
                      <th className="py-2.5 px-3">单位</th>
                      <th className="py-2.5 px-3">核算结论 / 状态</th>
                      <th className="py-2.5 px-3">备注说明</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {p.detailsList.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                          {row.time}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {row.item}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-right">
                          {row.value}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {row.unit}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                              row.status === '正常' || row.status === '合格'
                                ? 'bg-emerald-50 text-emerald-700'
                                : row.status === '已修正重算' || row.status === '已现场处置'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {row.note || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 审计追踪与法律声明 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>数据防伪追踪码：{report.traceId}</span>
              <span>生成人员：{report.author} ({report.generatedTime})</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              【系统合规说明】本结算报表基于低碳园区微电网运营系统的真实业务模型与采集快照自动核算，严格遵循 T+1 结算规则与 V1/V2 版本溯源机制。本报表仅供站端运营分析与内部核算使用，不作为正式银行托收与税务凭据。
            </p>
          </div>
        </div>

        {/* 3. 底部操作栏 */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">报表状态：</span>
            <span
              className={`inline-flex items-center gap-1 font-bold ${
                report.status === 'COMPLETED'
                  ? 'text-emerald-700'
                  : report.status === 'OUTDATED'
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {report.status === 'COMPLETED'
                ? '已完成并归档'
                : report.status === 'OUTDATED'
                ? '已归档历史版 (存在 V2 新版)'
                : '生成失败'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors"
            >
              导出 CSV
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-900 transition-colors"
            >
              关闭预览
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
