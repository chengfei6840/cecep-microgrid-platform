import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RevenueBreakdownItem } from '../../types/revenue';
import { QualityTag } from '../common/QualityTag';
import { VersionBadge } from '../common/VersionBadge';
import {
  X,
  Calculator,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
  FileCheck2,
  Clock,
  HelpCircle,
} from 'lucide-react';

interface RevenueDrilldownModalProps {
  item: RevenueBreakdownItem | null;
  onClose: () => void;
  caliber: 'ESTIMATE' | 'SETTLEMENT';
}

export const RevenueDrilldownModal: React.FC<RevenueDrilldownModalProps> = ({
  item,
  onClose,
  caliber,
}) => {
  const navigate = useNavigate();
  if (!item) return null;

  const isIncome = item.amount >= 0;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal 头部 */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white ${
                isIncome ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                收益穿透核算明细推导
              </h3>
              <p className="text-[11px] text-slate-500">
                {item.categoryLabel} · {caliber === 'SETTLEMENT' ? 'T+1 终审冻结' : '实时15分钟估算'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal 内容 */}
        <div className="p-6 space-y-5">
          {/* 金额核心卡 */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isIncome ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
            }`}
          >
            <div>
              <span className="text-xs font-semibold text-slate-600">
                核算结果金额 ({isIncome ? '经营创收' : '成本支出'})
              </span>
              <div
                className={`text-2xl font-black font-mono mt-1 ${
                  isIncome ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {isIncome ? '+' : ''}¥{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">数据置信度</span>
              <span className="text-base font-bold font-mono text-slate-900">
                {item.confidencePercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 公式与数学计算拆解 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-blue-600" />
              <span>数学算式推导过程 (Mathematical Derivation)</span>
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 space-y-1">
              <div className="text-slate-500 text-[11px]">算式规则：</div>
              <div className="font-bold text-blue-900">{item.formulaText}</div>
            </div>
          </div>

          {/* 详细参数指标属性表 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-600" />
              <span>输入测点参数与源头依据</span>
            </h4>
            <div className="bg-slate-50/80 rounded-xl border border-slate-200 divide-y divide-slate-200/60 text-xs">
              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-500">时段划分与窗口</span>
                <span className="font-medium text-slate-900">{item.timeslotLabel}</span>
              </div>
              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-500">参与核算电量</span>
                <span className="font-mono font-bold text-slate-900">
                  {item.energyKwh > 0 ? `${item.energyKwh.toLocaleString()} kWh` : '需量固定分摊'}
                </span>
              </div>
              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-500">适用单价标准</span>
                <span className="font-mono font-semibold text-slate-900">
                  ¥{item.unitPrice.toFixed(4)} {item.category === 'CAPACITY_BASE' ? '元/kW/月' : '元/kWh'}
                </span>
              </div>
              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-500">物理数据源硬件</span>
                <span className="text-slate-800 font-medium truncate max-w-[280px]">
                  {item.dataSource}
                </span>
              </div>
              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-500">引用电价方案版本</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/tariffs');
                  }}
                  className="font-mono text-blue-700 hover:underline flex items-center gap-1 font-semibold"
                >
                  <VersionBadge version={item.referencedTariffVersion} status="EFFECTIVE" />
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-500">数据质量等级</span>
                <div className="flex items-center gap-2">
                  <QualityTag level={item.quality} />
                  {item.quality !== 'NORMAL' && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/data/quality');
                      }}
                      className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-0.5"
                    >
                      <span>前往质量中心</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 异常原因提示 (若有) */}
          {item.qualityReason && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <span className="font-bold">数据质量诊断备注：</span>
              <span>{item.qualityReason}</span>
            </div>
          )}
        </div>

          {/* 底部按钮 */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-[11px] text-slate-400">
            核算公式按既定基准规则执行
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            关闭推导明细
          </button>
        </div>
      </div>
    </div>
  );
};
