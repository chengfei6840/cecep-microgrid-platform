import React, { useState } from 'react';
import { useAppStore } from '../../store/AppContext';
import { ReportType, ReportItem } from '../../types/domain';
import {
  X,
  FilePlus,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Database,
  ArrowRight,
  Sparkles,
  Info,
  Loader2,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReportCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newReport: ReportItem) => void;
}

export const ReportCreateModal: React.FC<ReportCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const {
    site,
    tariffScheme,
    revenueSnapshots,
    qualityIssues,
    scenario,
    generateReportItem,
  } = useAppStore();

  const [reportType, setReportType] = useState<ReportType>('DAILY_OPERATION');
  const [period, setPeriod] = useState<string>('2026-09-04');
  const [reportTitle, setReportTitle] = useState<string>('');
  const [isFormalSettlement, setIsFormalSettlement] = useState<boolean>(false);
  const [customNotes, setCustomNotes] = useState<string>('');

  // 生成状态机: 'IDLE' | 'VALIDATING' | 'GENERATING' | 'DONE' | 'BLOCKED'
  const [generationStep, setGenerationStep] = useState<
    'IDLE' | 'VALIDATING' | 'GENERATING' | 'DONE' | 'BLOCKED'
  >('IDLE');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [recoveryAdvice, setRecoveryAdvice] = useState<string>('');

  if (!isOpen) return null;

  // 依赖检查数据
  const safeSnapshots = Array.isArray(revenueSnapshots) ? revenueSnapshots : [];
  const v2Snapshot = safeSnapshots.find((s) => s && s.id === 'REV-YEST-SETTLEMENT-V2');
  const currentSnapshot = v2Snapshot || safeSnapshots.find((s) => s && s.id === 'REV-YEST-SETTLEMENT-V1') || safeSnapshots[0];
  const currentConfidence = currentSnapshot?.dataConfidencePercent ?? (scenario === 'SCENARIO_B' && !v2Snapshot ? 71.4 : 99.2);
  const isConfidencePass = currentConfidence >= 95.0;

  // 门禁判定：如果是结算报表且勾选了“标记为正式结算报表”，但置信度低于 95%
  const isGateBlocked = reportType === 'REVENUE_SETTLEMENT' && isFormalSettlement && !isConfidencePass;

  const handleGenerate = async () => {
    setErrorMessage('');
    setRecoveryAdvice('');
    setGenerationStep('VALIDATING');

    // 步骤 1：依赖校验模拟延时
    await new Promise((resolve) => setTimeout(resolve, 350));

    // 门禁校验
    if (isGateBlocked) {
      setGenerationStep('BLOCKED');
      setErrorMessage(`数据置信度为 ${currentConfidence}%，低于正式财务结算门禁阈值 95.0%。`);
      setRecoveryAdvice(
        '恢复路径：因储能 EMS 出现通信中断，收益数据存在缺失。请前往【数据质量】恢复通信并补录插补，在【运营收益】中心发起“收益 V2 重算”；或者取消“标记为正式财务结算”，生成带风险提示的测算日报草稿。'
      );
      return;
    }

    setGenerationStep('GENERATING');
    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = await generateReportItem({
      type: reportType,
      period,
      title: reportTitle.trim() || undefined,
      isFormalSettlement: reportType === 'REVENUE_SETTLEMENT' ? isFormalSettlement : false,
      customNotes: customNotes.trim() || undefined,
    });

    if (result.success && result.report) {
      setGenerationStep('DONE');
      setTimeout(() => {
        onSuccess(result.report!);
        onClose();
      }, 400);
    } else {
      setGenerationStep('BLOCKED');
      setErrorMessage(result.message);
      if (result.recoveryAdvice) {
        setRecoveryAdvice(result.recoveryAdvice);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
        {/* 头部 */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">新建运营分析报表</h2>
              <p className="text-xs text-slate-500">
                按周期与数据依赖生成快照报表，追踪电价与收益核算版本
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={generationStep === 'GENERATING'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="py-4 space-y-4 text-sm">
          {/* 1. 站点固定提示 */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-semibold text-slate-900">核算站点：</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium">
                {site.name} ({site.id})
              </span>
            </div>
            <span className="text-slate-400">
              ★ 严格单站核算口径，不提供跨园区多站汇总
            </span>
          </div>

          {/* 2. 报表类型选择 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              报表类型 <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  id: 'DAILY_OPERATION',
                  title: '综合运营日报',
                  desc: '发电/充放电/购售电/收益/告警与设备运行率',
                },
                {
                  id: 'MONTHLY_SUMMARY',
                  title: '综合运营月报',
                  desc: '月度量能汇总、削峰填谷成效与数据质量分析',
                },
                {
                  id: 'REVENUE_SETTLEMENT',
                  title: 'T+1 收益结算报表',
                  desc: '依赖 T+1 结算快照与电价版本，支持 V1/V2 追踪',
                },
                {
                  id: 'PATROL_MAINTENANCE',
                  title: '现场运维巡检报表',
                  desc: '巡检计划完成率、现场异常数、隐患工单闭环',
                },
              ].map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setReportType(t.id as ReportType);
                    if (t.id === 'MONTHLY_SUMMARY') {
                      setPeriod('2026-08');
                    } else if (period === '2026-08') {
                      setPeriod('2026-09-04');
                    }
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    reportType === t.id
                      ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-900 flex items-center justify-between">
                    <span>{t.title}</span>
                    {reportType === t.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {t.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 统计周期与自定义名称 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                统计/核算周期 <span className="text-rose-500">*</span>
              </label>
              {reportType === 'MONTHLY_SUMMARY' ? (
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="2026-08">2026年08月 (上月归档周期)</option>
                  <option value="2026-09">2026年09月 (当月累计周期)</option>
                </select>
              ) : (
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="2026-09-04">2026-09-04 (昨日 T+1 结算日)</option>
                  <option value="2026-09-05">2026-09-05 (今日实时运行日)</option>
                  <option value="2026-09-03">2026-09-03 (前日运行归档日)</option>
                  <option value="2026-09-01 ~ 2026-09-05">2026-09-01 ~ 2026-09-05 (本周专项)</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                报表自定义标题 <span className="text-slate-400 font-normal">(选填，留空使用标准规范命名)</span>
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="例如：示范站昨日收益复核报告"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* 4. 依赖数据与版本溯源检查卡 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                数据来源与版本溯源检查
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                当前电价方案：{tariffScheme.currentVersion}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-500 block text-[11px]">电价版本引用</span>
                <span className="font-semibold text-slate-800 text-xs">
                  {tariffScheme.currentVersion}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-500 block text-[11px]">收益核算快照</span>
                <span className="font-semibold text-slate-800 text-xs">
                  {v2Snapshot ? 'REV-SETTLEMENT-V2 (重算)' : 'REV-SETTLEMENT-V1 (初始)'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-slate-500 block text-[11px]">周期数据置信度</span>
                <span
                  className={`font-semibold text-xs flex items-center gap-1 ${
                    isConfidencePass ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {currentConfidence.toFixed(1)}%
                  {isConfidencePass ? (
                    <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-600 inline" />
                  )}
                </span>
              </div>
            </div>

            {/* 5. 收益结算特有门禁：正式财务结算勾选 */}
            {reportType === 'REVENUE_SETTLEMENT' && (
              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFormalSettlement}
                    onChange={(e) => {
                      setIsFormalSettlement(e.target.checked);
                      setErrorMessage('');
                      setRecoveryAdvice('');
                    }}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div>
                    <span className="font-semibold text-xs text-slate-800 block">
                      标记为正式财务结算报表 (严格财务审计门禁)
                    </span>
                    <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                      正式结算报表要求所选周期必须已完成 T+1 核算且数据置信度 ≥ 95.0%。若置信度不足，系统将拦截正式报表生成，但允许以草稿测算版本生成。
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* 门禁拦截或异常警告提示 */}
          {isGateBlocked && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>【正式结算门禁拦截】置信度不足，无法生成正式结算报表</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-700">
                当前核算周期数据置信度仅为 <strong>{currentConfidence.toFixed(1)}%</strong>（低于财务门禁 95.0%）。储能 EMS 通信缺失导致削峰放电数据少计约 260 kWh。
              </p>
              <div className="bg-white/80 p-2 rounded-lg border border-rose-200 text-[11px] space-y-1 text-slate-700">
                <strong className="text-rose-800 block">恢复路径：</strong>
                <p>1. 取消勾选“标记为正式财务结算报表”，生成带风险提示的测算日报草稿；</p>
                <p>
                  2. 或前往【运营收益】中心发起“收益 V2 重算”，重算生成 V2 (置信度 99.5%) 后即可解锁正式结算报表。
                </p>
              </div>
            </div>
          )}

          {errorMessage && generationStep === 'BLOCKED' && !isGateBlocked && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                {errorMessage}
              </div>
              {recoveryAdvice && (
                <p className="text-[11px] text-slate-600 mt-1">{recoveryAdvice}</p>
              )}
            </div>
          )}

          {/* 备注说明 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              业务备注与核算说明 <span className="text-slate-400 font-normal">(选填)</span>
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="例如：本次核算包含储能套利数据补录与尖峰时段复核..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-400">
            {generationStep === 'VALIDATING' && '正在校验数据依赖与电价版本...'}
            {generationStep === 'GENERATING' && '正在提取指标快照与生成报表...'}
            {generationStep === 'DONE' && '报表生成成功，正在载入...'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={generationStep === 'GENERATING'}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generationStep === 'GENERATING' || generationStep === 'VALIDATING'}
              className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition-colors ${
                isGateBlocked
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {generationStep === 'GENERATING' || generationStep === 'VALIDATING' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  开始生成报表
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
