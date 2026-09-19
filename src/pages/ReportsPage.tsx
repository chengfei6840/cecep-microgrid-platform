import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/AppContext';
import { ReportItem, ReportType } from '../types/domain';
import {
  FileText,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Download,
  Eye,
  Trash2,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Search,
} from 'lucide-react';
import { ReportFilterBar } from '../components/reports/ReportFilterBar';
import { ReportCreateModal } from '../components/reports/ReportCreateModal';
import { ReportPreviewDrawer } from '../components/reports/ReportPreviewDrawer';
import { exportReportToCSV } from '../utils/reportExport';
import { UnauthorizedView, ReadonlyBanner, EmptyView } from '../components/common/StateViews';
import { useNavigate } from 'react-router-dom';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentRole,
    currentUser,
    switchRole,
    reports,
    deleteReport,
    scenario,
    revenueSnapshots,
    site,
    hasPermission,
  } = useAppStore();

  // 角色权限判断
  const isInspector = currentRole === 'INSPECTOR';
  const isAdmin = currentRole === 'ADMIN';
  const isOperator = currentRole === 'OPERATOR';

  // 状态管理
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [onlyRisk, setOnlyRisk] = useState<boolean>(false);
  const [onlyFormal, setOnlyFormal] = useState<boolean>(false);

  // 弹窗与抽屉
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [previewReport, setPreviewReport] = useState<ReportItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // 巡检员访问控制：友好无权限视图
  if (isInspector) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-3xl mx-auto">
          <UnauthorizedView
            currentRole={currentUser?.roleTitle || '现场巡检员'}
            requiredRole="运营人员 (陈若涵) 或 系统管理员 (张宇轩)"
            onSwitchRole={() => switchRole('OPERATOR')}
          />
        </div>
      </div>
    );
  }

  // 安全数据兜底
  const safeReports = Array.isArray(reports) ? reports : [];
  const safeSnapshots = Array.isArray(revenueSnapshots) ? revenueSnapshots : [];

  // 统计概览
  const totalReports = safeReports.length;
  const formalReports = safeReports.filter((r) => r && r.isSettlementFormal).length;
  const riskReports = safeReports.filter((r) => r && r.hasRiskWarning).length;
  const multiVersionReports = safeReports.filter(
    (r) => r && ((r.versions && r.versions.length > 1) || r.version === 'V2.0')
  ).length;

  // 场景 B 检查与未重算预警
  const v2Snapshot = safeSnapshots.find((s) => s && s.id === 'REV-YEST-SETTLEMENT-V2');
  const showScenarioBWarning = scenario === 'SCENARIO_B' && !v2Snapshot;

  // 过滤逻辑
  const filteredReports = useMemo(() => {
    return safeReports.filter((report) => {
      if (!report) return false;
      // 类型过滤
      if (selectedType !== 'ALL' && report.type !== selectedType) {
        return false;
      }
      // 风险过滤
      if (onlyRisk && !report.hasRiskWarning) {
        return false;
      }
      // 正式结算过滤
      if (onlyFormal && !report.isSettlementFormal) {
        return false;
      }
      // 搜索关键词
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const matchCode = (report.reportCode || '').toLowerCase().includes(kw);
        const matchTitle = (report.title || '').toLowerCase().includes(kw);
        const matchTrace = (report.traceId || '').toLowerCase().includes(kw);
        const matchPeriod = (report.period || '').toLowerCase().includes(kw);
        if (!matchCode && !matchTitle && !matchTrace && !matchPeriod) {
          return false;
        }
      }
      return true;
    });
  }, [safeReports, selectedType, searchKeyword, onlyRisk, onlyFormal]);

  const handleOpenPreview = (item: ReportItem) => {
    setPreviewReport(item);
    setIsDrawerOpen(true);
  };

  const handleExportSingle = (e: React.MouseEvent, item: ReportItem) => {
    e.stopPropagation();
    if (!hasPermission('reports_export')) {
      showToast('权限策略拦截：当前角色未被授予【报表与核算数据导出】权限 (reports_export)。');
      return;
    }
    const ok = exportReportToCSV(item);
    if (ok) {
      showToast(`已成功导出报表《${item.title}》为 CSV 文件！`);
    }
  };

  const handleDelete = (e: React.MouseEvent, item: ReportItem) => {
    e.stopPropagation();
    if (window.confirm(`确定要删除报表《${item.title}》(${item.reportCode}) 吗？`)) {
      deleteReport(item.id);
      showToast(`报表 ${item.reportCode} 已删除并记录审计日志。`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 消息提示浮层 */}
      {feedbackToast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* 管理员只读提示栏 */}
      {isAdmin && (
        <ReadonlyBanner
          message="当前以系统管理员 (张宇轩) 身份访问报表中心：支持全量预览、版本审计溯源与文件导出；生成新报表及数据重算需切换至运营人员权限。"
        />
      )}

      {/* 场景 B 异常警示横幅 */}
      {showScenarioBWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 shadow-xs flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-amber-950 flex items-center gap-2">
                <span>【场景 B 运行预警】储能通信中断致数据置信度受损 (71.4%)</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-200 text-amber-900 font-semibold">
                  门禁拦截激活
                </span>
              </div>
              <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">
                昨日削峰放电数据少计约 260 kWh，正式财务结算报表已受到门禁拦截。允许生成带风险说明的测算日报草稿；若需生成正式结算报表，请前往运营收益中心发起 V2 修正重算。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/revenue')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs"
            >
              前往运营收益中心重算
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 页面主标题区 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              报表中心
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {site.name}
            </span>
            <span className="text-xs text-slate-400">
              (严格单站核算口径)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            按报表类型、站点与结算周期生成、预览、追踪版本并导出结算文件；明确识别数据来源、置信度与收益版本。
          </p>
        </div>

        {/* 顶部按钮区 */}
        <div className="flex items-center gap-2.5">
          {isOperator && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              新建报表
            </button>
          )}
        </div>
      </div>

      {/* KPI 统计指标卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>总归档报表</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {totalReports}
            <span className="text-xs font-normal text-slate-400 ml-1">份</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            涵盖日报、月报与结算单
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>正式结算报表</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {formalReports}
            <span className="text-xs font-normal text-slate-400 ml-1">份</span>
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block">
            已过 T+1 门禁 (置信度≥95%)
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>含质量风险提示</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {riskReports}
            <span className="text-xs font-normal text-slate-400 ml-1">份</span>
          </div>
          <span className="text-[11px] text-amber-600 mt-1 block">
            通信受损或测算草稿
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>多版本溯源演进</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-2">
            {multiVersionReports}
            <span className="text-xs font-normal text-slate-400 ml-1">份</span>
          </div>
          <span className="text-[11px] text-indigo-600 mt-1 block">
            保留 V1 初核与 V2 修正对比
          </span>
        </div>
      </div>

      {/* 筛选与搜索控制栏 */}
      <ReportFilterBar
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        searchKeyword={searchKeyword}
        onSearchChange={setSearchKeyword}
        onlyRisk={onlyRisk}
        onOnlyRiskChange={setOnlyRisk}
        onlyFormal={onlyFormal}
        onOnlyFormalChange={setOnlyFormal}
        onReset={() => {
          setSelectedType('ALL');
          setSearchKeyword('');
          setOnlyRisk(false);
          setOnlyFormal(false);
        }}
        totalCount={totalReports}
        filteredCount={filteredReports.length}
      />

      {/* 报表任务清单 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">报表任务与历史清单</h2>
            <span className="text-xs text-slate-400">
              (点击行可展开全量预览与版本对比时间线)
            </span>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-8">
            <EmptyView
              title="未检索到符合条件的报表"
              description="请尝试调整筛选条件或搜索关键词，或者新建一份业务分析报表。"
              actionText={isOperator ? '新建报表' : undefined}
              onAction={isOperator ? () => setIsCreateModalOpen(true) : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">报表编号 / 标题</th>
                  <th className="py-3 px-3">类型</th>
                  <th className="py-3 px-3">核算周期</th>
                  <th className="py-3 px-3">版本演进</th>
                  <th className="py-3 px-3">数据置信度</th>
                  <th className="py-3 px-3">结算属性</th>
                  <th className="py-3 px-3">生成人 / 时间</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => {
                  const isV2 = report.version === 'V2.0';
                  return (
                    <tr
                      key={report.id}
                      onClick={() => handleOpenPreview(report)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* 报表编号与标题 */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-mono font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>{report.reportCode}</span>
                          {report.hasRiskWarning && (
                            <span title="含数据质量风险提示">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="font-medium text-slate-900 text-xs mt-0.5 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                          {report.title}
                        </div>
                      </td>

                      {/* 报表类型 */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            report.type === 'DAILY_OPERATION'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : report.type === 'MONTHLY_SUMMARY' || report.type === 'MONTHLY_SETTLEMENT'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : report.type === 'REVENUE_SETTLEMENT'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {report.type === 'DAILY_OPERATION'
                            ? '运营日报'
                            : report.type === 'MONTHLY_SUMMARY' || report.type === 'MONTHLY_SETTLEMENT'
                            ? '运营月报'
                            : report.type === 'REVENUE_SETTLEMENT'
                            ? '收益结算单'
                            : '现场巡检报表'}
                        </span>
                      </td>

                      {/* 核算周期 */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600">
                        {report.period}
                      </td>

                      {/* 版本演进 */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                              isV2
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {report.version}
                          </span>
                          {report.versions && report.versions.length > 1 && (
                            <span className="text-[10px] text-indigo-600 font-semibold">
                              (已归档{report.versions.length}版)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 数据置信度 */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {(() => {
                          const conf = typeof report.dataConfidencePercent === 'number' ? report.dataConfidencePercent : 99.2;
                          const isPass = conf >= 95.0;
                          return (
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${
                                isPass ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {conf.toFixed(1)}%
                              {isPass ? (
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                              )}
                            </span>
                          );
                        })()}
                      </td>

                      {/* 结算属性 */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {report.isSettlementFormal ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <ShieldCheck className="w-3 h-3" />
                            正式结算
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 font-normal">
                            测算草稿
                          </span>
                        )}
                      </td>

                      {/* 生成人与时间 */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">{report.author}</div>
                        <div className="text-[10px] text-slate-400">{report.generatedTime}</div>
                      </td>

                      {/* 操作列 */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPreview(report);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="预览报表详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => handleExportSingle(e, report)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                            title="直接导出 CSV 文件"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {isOperator && (
                            <button
                              onClick={(e) => handleDelete(e, report)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="删除此报表记录"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 底部合规与提示说明 */}
      <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-500 space-y-1">
        <div className="font-semibold text-slate-700 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>报表中心业务准则与门禁规范</span>
        </div>
        <p className="leading-relaxed">
          1. <strong>站点范围：</strong>固定为低碳园区示范站，单站严格口径，不提供跨站点汇总或财务合并报表。
        </p>
        <p className="leading-relaxed">
          2. <strong>门禁规则：</strong>正式收益结算报表依赖已完成 T+1 结算且数据置信度 ≥ 95.0%；若存在断线或数据质量异常，系统允许生成带风险说明的运营日报草案，但严格阻断标记为正式财务结算。
        </p>
        <p className="leading-relaxed">
          3. <strong>版本管理：</strong>重算修正完成后自动生成 V2 新版，原 V1 初核版本永久保留归档，支持双版本穿透比对，严禁覆盖历史凭据。
        </p>
        <p className="leading-relaxed">
          4. <strong>真实导出：</strong>点击导出按钮通过浏览器生成包含 UTF-8 BOM 的标准 CSV 结构化文件，可直接在 Excel 中打开或使用浏览器打印为 PDF。
        </p>
      </div>

      {/* 新建报表对话框 */}
      <ReportCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newReport) => {
          showToast(`报表《${newReport.title}》已成功生成！`);
          setPreviewReport(newReport);
          setIsDrawerOpen(true);
        }}
      />

      {/* 报表预览抽屉 */}
      <ReportPreviewDrawer
        report={previewReport}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setPreviewReport(null);
        }}
      />
    </div>
  );
};
