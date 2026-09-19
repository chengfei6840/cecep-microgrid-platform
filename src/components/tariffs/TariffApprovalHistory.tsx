import React from 'react';
import { TariffApprovalRecord, TariffVersion } from '../../types/domain';
import {
  FileCheck2,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  User,
  Tag,
} from 'lucide-react';

interface TariffApprovalHistoryProps {
  version: TariffVersion;
}

export const TariffApprovalHistory: React.FC<TariffApprovalHistoryProps> = ({ version }) => {
  const records = version.approvalRecords || [];

  const getActionConfig = (action: TariffApprovalRecord['action']) => {
    switch (action) {
      case 'CREATE_DRAFT':
        return {
          icon: FileCheck2,
          color: 'text-slate-600 bg-slate-100 border-slate-300',
          badge: 'bg-slate-100 text-slate-700',
        };
      case 'SUBMIT':
        return {
          icon: Send,
          color: 'text-blue-600 bg-blue-50 border-blue-300',
          badge: 'bg-blue-50 text-blue-700',
        };
      case 'AUTHORIZE':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-300',
          badge: 'bg-emerald-50 text-emerald-700',
        };
      case 'REJECT':
        return {
          icon: XCircle,
          color: 'text-red-600 bg-red-50 border-red-300',
          badge: 'bg-red-50 text-red-700',
        };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            方案编制与二次授权审计时间轴 ({version.versionNumber})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            记录运营人员录入草稿、提交审批及系统管理员独立核验签署的完整全流程
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          共计 {records.length} 条审计存证
        </span>
      </div>

      {records.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">暂无审批流转记录</div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {records.map((rec, idx) => {
            const config = getActionConfig(rec.action);
            const Icon = config.icon;
            return (
              <div key={rec.id || idx} className="relative group">
                <div
                  className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full border flex items-center justify-center ${config.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5 transition-all group-hover:border-slate-300 group-hover:bg-slate-50/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${config.badge}`}>
                        {rec.actionName}
                      </span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {rec.operatorName} ({rec.role === 'ADMIN' ? '系统管理员' : '运营人员'})
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{rec.timestamp}</span>
                  </div>

                  {rec.notes && (
                    <div className="text-slate-600 text-[11px] leading-relaxed pl-1 pt-0.5">
                      审核意见 / 理由: <span className="font-medium text-slate-800">{rec.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
