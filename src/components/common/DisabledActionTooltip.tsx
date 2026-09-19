import React, { useState } from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface DisabledActionProps {
  disabled: boolean;
  reason?: string;
  recoveryStep?: string;
  children: React.ReactNode;
}

export const DisabledActionTooltip: React.FC<DisabledActionProps> = ({
  disabled,
  reason,
  recoveryStep,
  children,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!disabled) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="opacity-50 cursor-not-allowed pointer-events-none">{children}</div>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-900 text-white rounded-lg shadow-xl text-xs space-y-1 animate-in fade-in duration-100 pointer-events-none">
          <div className="flex items-center gap-1.5 font-semibold text-amber-300">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>操作不可用原因</span>
          </div>
          <p className="text-slate-200 leading-snug">{reason || '前置业务条件未达成'}</p>
          {recoveryStep && (
            <p className="text-[11px] text-sky-300 border-t border-slate-700/60 pt-1 mt-1 flex items-start gap-1">
              <HelpCircle className="w-3 h-3 shrink-0 mt-0.5" />
              <span>恢复指引：{recoveryStep}</span>
            </p>
          )}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};
