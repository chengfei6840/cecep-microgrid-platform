import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SettlementGateStatus } from '../../types/revenue';
import { UserRole } from '../../types/domain';
import {
  Clock,
  FileCheck2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sliders,
  Layers,
  Info,
  Building,
} from 'lucide-react';

interface RevenueCaliberHeaderProps {
  caliber: 'ESTIMATE' | 'SETTLEMENT';
  onCaliberChange: (caliber: 'ESTIMATE' | 'SETTLEMENT') => void;
  dateFilterType: 'DATE' | 'MONTH' | 'YEAR';
  onDateFilterTypeChange: (type: 'DATE' | 'MONTH' | 'YEAR') => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  gateStatus: SettlementGateStatus;
  currentRole: UserRole;
  onOpenRecalculateDialog: () => void;
  isRecalculatedV2: boolean;
  onJumpToQuality: () => void;
}

export const RevenueCaliberHeader: React.FC<RevenueCaliberHeaderProps> = ({
  caliber,
  onCaliberChange,
  dateFilterType,
  onDateFilterTypeChange,
  selectedDate,
  onDateChange,
  gateStatus,
  currentRole,
  onOpenRecalculateDialog,
  isRecalculatedV2,
  onJumpToQuality,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
      {/* 1. 主标题与角色操作条 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  微电网综合运营收益核算中心
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  示范站
                </span>
                {isRecalculatedV2 && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    V2.0 追溯重算已生成
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                明确区分【实时估算】与【日终结算】双口径 · 严格四项收益公式分解 · 异常追溯重算留存
              </p>
            </div>
          </div>
        </div>

        {/* 顶部操作区：日期选择 + 重算发起 */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 维度切换：日 / 月 / 年 */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs">
            <button
              onClick={() => onDateFilterTypeChange('DATE')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                dateFilterType === 'DATE'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              按日
            </button>
            <button
              onClick={() => onDateFilterTypeChange('MONTH')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                dateFilterType === 'MONTH'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              按月
            </button>
            <button
              onClick={() => onDateFilterTypeChange('YEAR')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                dateFilterType === 'YEAR'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              按年
            </button>
          </div>

          {/* 具体日期下拉选择 */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              {dateFilterType === 'DATE' && (
                <>
                  <option value="2026-09-05">今日 (2026-09-05 实时)</option>
                  <option value="2026-09-04">昨日 (2026-09-04 终审)</option>
                  <option value="2026-09-03">前日 (2026-09-03 归档)</option>
                </>
              )}
              {dateFilterType === 'MONTH' && (
                <>
                  <option value="2026-09">2026年 09月 (本月累积)</option>
                  <option value="2026-08">2026年 08月 (上月已封账)</option>
                </>
              )}
              {dateFilterType === 'YEAR' && (
                <>
                  <option value="2026">2026 年度 (运行中)</option>
                  <option value="2025">2025 年度 (投运期)</option>
                </>
              )}
            </select>
          </div>

          {/* 重算发起按钮 (运营人员专属，二次确认；管理员只读审计) */}
          {currentRole === 'OPERATOR' && (
            <button
              onClick={onOpenRecalculateDialog}
              className="px-3.5 py-1.5 bg-[#004287] hover:bg-[#003366] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>发起收益重算 (生成 V2)</span>
            </button>
          )}

          {currentRole === 'ADMIN' && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>管理员只读审计</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. 核心：估算 / 结算 双口径切换卡（不仅用颜色区分，文字、图标、数据源、时态全面区分） */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* 口径 A：实时估算 */}
        <div
          onClick={() => onCaliberChange('ESTIMATE')}
          className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            caliber === 'ESTIMATE'
              ? 'bg-blue-50/70 border-blue-600 shadow-sm'
              : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  caliber === 'ESTIMATE'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Clock className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    实时估算口径 (滚动推算)
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                    每 15 分钟滚动
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  基于逆变器、PCS、充电桩遥测即时功率与当前分时单价的动态估算
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 font-mono">数据来源</span>
              <div className="text-xs font-bold text-slate-700">15min 遥测积分</div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
            <span className="flex items-center gap-1 text-blue-800 font-medium">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              未到日终关账时点，随功率实测波动，供运营调度参考
            </span>
            <span className="font-mono text-slate-400">更新时间：当前实时</span>
          </div>
        </div>

        {/* 口径 B：日终结算 */}
        <div
          onClick={() => onCaliberChange('SETTLEMENT')}
          className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            caliber === 'SETTLEMENT'
              ? 'bg-emerald-50/70 border-emerald-600 shadow-sm'
              : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  caliber === 'SETTLEMENT'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    日终结算口径 (T+1 终审)
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    T+1 正式归档
                  </span>
                  {!gateStatus.canSettle && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      结算安全门禁拦截
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  基于供电局铅封 10kV 关口双向表计日结底数与特来电结单资金对账
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 font-mono">数据来源</span>
              <div className="text-xs font-bold text-slate-700">0.2S级表计冻结底数</div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
            <span className="flex items-center gap-1 text-emerald-800 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              引用已生效电价与完整封单，支持重算保留多版本
            </span>
            <span className="font-mono text-slate-400">归档时间：T+1 00:30:15</span>
          </div>
        </div>
      </div>

      {/* 3. 门禁状态与风险提示条 (如无生效电价、订单未完整同步、或置信度下降) */}
      {(!gateStatus.canSettle || gateStatus.warnings.length > 0) && caliber === 'SETTLEMENT' && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>结算门禁与置信度审计预警：</span>
            </div>
            <span className="font-mono text-amber-800 text-[11px]">
              当前数据置信度: {gateStatus.dataConfidencePercent.toFixed(1)}% (阈值 85.0%)
            </span>
          </div>

          {gateStatus.blockReasons.length > 0 && (
            <div className="space-y-1 pl-6">
              {gateStatus.blockReasons.map((reason, idx) => (
                <div key={idx} className="flex items-center justify-between text-rose-800 font-medium">
                  <span>• 门禁阻断项: {reason}</span>
                </div>
              ))}
            </div>
          )}

          {gateStatus.affectedScope && (
            <div className="pl-6 text-amber-800">
              <span className="font-semibold">影响范围：</span>
              <span>{gateStatus.affectedScope}</span>
            </div>
          )}

          <div className="pt-1 pl-6 flex items-center justify-between">
            <span className="text-slate-600 text-[11px]">
              处置指引：请在【数据质量中心】排查传感器链路或等待订单 T+1 完整同步后发起 V2 重算。
            </span>
            <button
              onClick={onJumpToQuality}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 underline ml-2"
            >
              <span>前往数据质量中心排查</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
