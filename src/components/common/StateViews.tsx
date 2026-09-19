import React from 'react';
import { Loader2, Inbox, AlertTriangle, ShieldAlert, Lock, AlertCircle, RefreshCw } from 'lucide-react';

export const LoadingView: React.FC<{ text?: string }> = ({ text = '数据加载中...' }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <Loader2 className="w-8 h-8 text-[#004287] animate-spin mb-3" />
    <p className="text-sm text-slate-500 font-medium">{text}</p>
  </div>
);

export const EmptyView: React.FC<{
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}> = ({
  title = '暂无相关数据记录',
  description = '当前查询条件或当前场景下暂未生成数据，可调整筛选或切换运行场景。',
  actionText,
  onAction,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
      <Inbox className="w-6 h-6" />
    </div>
    <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
    <p className="text-xs text-slate-500 leading-relaxed mb-4">{description}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#004287] bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>{actionText}</span>
      </button>
    )}
  </div>
);

export const ErrorView: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  traceId?: string;
}> = ({
  title = '服务请求发生异常',
  message = '模拟网络请求失败或网关响应超时，请检查通信配置或重试。',
  onRetry,
  traceId,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-3">
      <AlertTriangle className="w-6 h-6" />
    </div>
    <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
    <p className="text-xs text-slate-600 leading-relaxed mb-3">{message}</p>
    {traceId && (
      <div className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded mb-4">
        TraceId: {traceId}
      </div>
    )}
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#004287] rounded-md hover:bg-[#003366] transition-colors shadow-xs"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>重新尝试请求</span>
      </button>
    )}
  </div>
);

export const UnauthorizedView: React.FC<{
  requiredRole?: string;
  currentRole?: string;
  onSwitchRole?: () => void;
}> = ({
  requiredRole = '系统管理员 / 运营主管',
  currentRole = '巡检员',
  onSwitchRole,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-3">
      <ShieldAlert className="w-6 h-6" />
    </div>
    <h3 className="text-base font-semibold text-slate-900 mb-1">页面访问权限受控</h3>
    <p className="text-xs text-slate-600 leading-relaxed mb-4">
      当前操作角色为【{currentRole}】，根据系统权限规则，该业务模块需要【{requiredRole}】权限。请使用顶栏控件切换具备权限的操作身份。
    </p>
    {onSwitchRole && (
      <button
        onClick={onSwitchRole}
        className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors shadow-xs"
      >
        快速切换具备权限的角色
      </button>
    )}
  </div>
);

export const ReadonlyBanner: React.FC<{ message?: string }> = ({
  message = '当前模块处于归档只读状态，历史快照与审计记录不可直接篡改。',
}) => (
  <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs">
    <Lock className="w-4 h-4 text-slate-500 shrink-0" />
    <span className="font-medium">只读模式：</span>
    <span>{message}</span>
  </div>
);

export const BusinessBlockBanner: React.FC<{
  title: string;
  reason: string;
  recoveryRouteName?: string;
  onNavigate?: () => void;
}> = ({ title, reason, recoveryRouteName, onNavigate }) => (
  <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs">
    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
    <div className="flex-1">
      <div className="font-semibold text-amber-800">{title}</div>
      <div className="text-amber-700 mt-0.5">{reason}</div>
    </div>
    {recoveryRouteName && onNavigate && (
      <button
        onClick={onNavigate}
        className="px-2.5 py-1 text-xs font-medium text-amber-900 bg-amber-200/70 hover:bg-amber-200 rounded transition-colors shrink-0"
      >
        前往 {recoveryRouteName}
      </button>
    )}
  </div>
);
