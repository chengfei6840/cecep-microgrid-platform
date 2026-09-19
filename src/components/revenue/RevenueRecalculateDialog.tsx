import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  GitCompare,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
} from 'lucide-react';

interface RevenueRecalculateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<{ success: boolean; message: string }>;
  currentV1Net: number;
}

export const RevenueRecalculateDialog: React.FC<RevenueRecalculateDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentV1Net,
}) => {
  const [reason, setReason] = useState<string>(
    '时代星云储能预制舱通信故障现场已排除，历史缺失遥测完成规程补录，启动 T+1 收益核算 V2 重算'
  );
  const [dateRange, setDateRange] = useState<string>('昨日 2026-09-04 全天');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [step, setStep] = useState<'FORM' | 'CONFIRM' | 'PROCESSING'>('FORM');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const estimatedVariance = 286.5;
  const estimatedV2Net = currentV1Net + estimatedVariance;

  const handleStartRecalc = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setStep('PROCESSING');

    try {
      // 模拟计算引擎处理耗时
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const res = await onConfirm(reason);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.message);
        setStep('CONFIRM');
      }
    } catch (e: any) {
      setErrorMsg(e.message || '重算处理异常');
      setStep('CONFIRM');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* 对话框头部 */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                发起历史收益重算 (生成 V2.0 归档)
              </h3>
              <p className="text-[11px] text-slate-500">
                双人复核审批机制 · 保留 V1.0 原始凭据 · 自动记录审计日志
              </p>
            </div>
          </div>
          <button
            disabled={isSubmitting}
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 步骤 1：填写原因与参数 */}
        {step === 'FORM' && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                重算原因说明 (必须如实记录审计线索) *
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="例如：储能通信中断历史数据补采完成，修正谷段充电计费..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  核算时间区间
                </label>
                <input
                  type="text"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  生成版本定义
                </label>
                <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700">
                  V1.0 ➔ V2.0 (重算生效)
                </div>
              </div>
            </div>

            {/* 测算差异预览 */}
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-900 flex items-center gap-1">
                  <GitCompare className="w-3.5 h-3.5" />
                  预期核算结果预估对比：
                </span>
                <span className="font-mono text-emerald-700 font-bold">
                  差异额预估: +¥{estimatedVariance.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-blue-200/50">
                <div className="bg-white p-2 rounded-lg border border-blue-100">
                  <span className="text-[11px] text-slate-500">原 V1 净收益 (置信度 71.4%)</span>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">
                    ¥{currentV1Net.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-100">
                  <span className="text-[11px] text-slate-500">修正 V2 净收益 (置信度 99.5%)</span>
                  <div className="font-mono font-bold text-emerald-700 mt-0.5">
                    ¥{estimatedV2Net.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">数据可追溯原则声明：</span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  重算执行后，平台将生成独立的新版本归档记录，原 V1 收益数据、计算明细与时间戳永久封存备查，不会覆盖或抹除历史任何对账底稿。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 步骤 2：二次确认提示 */}
        {step === 'CONFIRM' && (
          <div className="p-6 space-y-4">
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-3">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                请确认是否正式启动财务收益重算？
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                本次操作将作为正式审计事件写入系统日志并生成不可逆的 V2.0 归档批次。
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">重算原因</span>
                <span className="text-slate-800 font-medium max-w-[280px] text-right truncate">
                  {reason}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">影响区间</span>
                <span className="text-slate-800 font-medium">{dateRange}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">净收益变动</span>
                <span className="font-mono font-bold text-emerald-600">
                  +¥{estimatedVariance.toFixed(2)} (+14.4%)
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* 步骤 3：计算中 */}
        {step === 'PROCESSING' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center animate-spin">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                规则引擎正在执行 T+1 收益修正重算...
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                正在校验补采测点时间戳、重算储能分时套利差额并封存批次快照
              </p>
            </div>
          </div>
        )}

        {/* 对话框底部操作按钮 */}
        {step !== 'PROCESSING' && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <button
              onClick={() => {
                if (step === 'CONFIRM') setStep('FORM');
                else onClose();
              }}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              {step === 'CONFIRM' ? '返回修改' : '取消'}
            </button>

            {step === 'FORM' ? (
              <button
                onClick={() => setStep('CONFIRM')}
                disabled={!reason.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>下一步：核算二次确认</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleStartRecalc}
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>确认并执行重算</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
