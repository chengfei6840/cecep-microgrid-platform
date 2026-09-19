import React from 'react';
import { useAppStore } from '../../store/AppContext';
import { ShieldAlert, Smartphone, ArrowRight, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MonitorRoleGuardProps {
  children: React.ReactNode;
}

export const MonitorRoleGuard: React.FC<MonitorRoleGuardProps> = ({ children }) => {
  const { currentRole, switchRole } = useAppStore();
  const navigate = useNavigate();

  // 角色要求：仅系统管理员和运营人员可查看桌面监测大盘
  if (currentRole === 'INSPECTOR') {
    return (
      <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-2xs">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2">
          桌面监测中心访问权限受控
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed mb-6">
          当前登录角色为【现场巡检员】。根据平台分工规范，桌面端微电网实时监测与全站功率调度仅对【系统管理员】和【运营人员】开放；巡检员请使用移动工作台执行现场任务与告警核查。
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <button
            type="button"
            onClick={() => navigate('/mobile-simulator')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#004287] hover:bg-[#003366] text-white font-medium text-xs shadow-xs transition-colors"
          >
            <Smartphone className="w-4 h-4" />
            <span>前往移动巡检端</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => switchRole('OPERATOR')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-2xs transition-colors"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>快速切换为【运营人员】</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
