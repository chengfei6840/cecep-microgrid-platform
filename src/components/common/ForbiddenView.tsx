import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/AppContext';
import { UserRole } from '../../types/domain';
import { MOCK_USERS } from '../../store/scenarioData';
import {
  ShieldAlert,
  ArrowLeft,
  UserCheck,
  Shield,
  Smartphone,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface ForbiddenViewProps {
  requiredRoles?: UserRole[];
  pageTitle?: string;
  reason?: string;
}

export const ForbiddenView: React.FC<ForbiddenViewProps> = ({
  requiredRoles = ['ADMIN'],
  pageTitle,
  reason,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRole, currentUser, switchRole, addAuditLog } = useAppStore();

  const [switchingRole, setSwitchingRole] = useState<UserRole | null>(null);

  const getRequiredRoleNames = () => {
    return requiredRoles
      .map((r) => {
        const u = MOCK_USERS.find((user) => user.role === r);
        return u ? `${u.roleTitle}（${u.name}）` : r;
      })
      .join(' 或 ');
  };

  const getDefaultLanding = (role: UserRole) => {
    if (role === 'ADMIN') return '/data/integrations';
    if (role === 'OPERATOR') return '/agent-hub';
    return '/mobile/tasks';
  };

  const handleSwitchConfirm = (targetRole: UserRole) => {
    const targetUser = MOCK_USERS.find((u) => u.role === targetRole) || MOCK_USERS[0];
    switchRole(targetRole);
    addAuditLog({
      targetObject: '权限控制网关',
      action: '403 页面直接切换角色',
      oldState: `${currentUser.roleTitle} (${currentUser.name})`,
      newState: `${targetUser.roleTitle} (${targetUser.name})`,
      reason: `用户在受限页面 [${location.pathname}] 切换角色以获取访问权限`,
      role: targetRole,
      operatorName: targetUser.name,
    });
    setSwitchingRole(null);
    navigate(getDefaultLanding(targetRole));
  };

  return (
    <div className="min-h-[520px] flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl border border-red-200 shadow-lg p-8 space-y-6">
        {/* 顶部警示图标与 403 状态 */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-100 text-red-800">
                HTTP 403 FORBIDDEN
              </span>
              <span className="text-xs font-semibold text-slate-500">
                权限安全策略拦截
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              访问受限：当前角色无权访问此页面
            </h2>
          </div>
        </div>

        {/* 详细拦截原因 */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
          <div className="flex items-center justify-between text-slate-500 border-b border-slate-200/80 pb-2">
            <span>当前登录账号：</span>
            <span className="font-semibold text-slate-800">
              {currentUser.name} · {currentUser.roleTitle} ({currentUser.department})
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500 border-b border-slate-200/80 pb-2">
            <span>尝试访问路径：</span>
            <span className="font-mono font-semibold text-red-700">
              {location.pathname}
            </span>
          </div>
          <div className="text-slate-700 leading-relaxed pt-1">
            <p className="font-semibold text-slate-900 mb-1">拦截规则与说明：</p>
            <p>
              {reason ||
                `根据中节能低碳园区微电网三权分立安全规程，【${
                  pageTitle || '目标管理模块'
                }】属于【${getRequiredRoleNames()}】专属权限。巡检员严格受限于移动端点检与现场整改，不得进入后台配置、电价授权、收益核算与系统管理。`}
            </p>
          </div>
        </div>

        {/* 角色快捷切换提示 */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-3 text-blue-900">
          <div className="flex items-center gap-2 font-semibold text-blue-800">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>系统权限授权指引</span>
          </div>
          <p className="text-[11px] text-blue-700 leading-relaxed">
            支持快速切换为具备该模块访问权限的操作账号：
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {requiredRoles.includes('ADMIN') && (
              <button
                onClick={() => setSwitchingRole('ADMIN')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004287] text-white rounded-lg text-xs font-semibold hover:bg-[#003366] transition-colors shadow-xs"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>切换为系统管理员 (张宇轩)</span>
              </button>
            )}
            {requiredRoles.includes('OPERATOR') && (
              <button
                onClick={() => setSwitchingRole('OPERATOR')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>切换为运营主管 (陈若涵)</span>
              </button>
            )}
          </div>
        </div>

        {/* 底部返回动作 */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            onClick={() => navigate(getDefaultLanding(currentRole))}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回我的工作台 ({currentRole === 'INSPECTOR' ? '移动巡检端' : '落地主页'})</span>
          </button>
        </div>
      </div>

      {/* 角色切换二次确认模态框 */}
      {switchingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-[#00152A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>角色切换二次确认</span>
              </div>
              <button
                onClick={() => setSwitchingRole(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                您即将从当前角色【{currentUser.roleTitle}（{currentUser.name}）】切换至：
              </p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl font-medium text-blue-900">
                {switchingRole === 'ADMIN' && '系统管理员 · 张宇轩（平台技术部）'}
                {switchingRole === 'OPERATOR' && '微电网运营主管 · 陈若涵（能效管理中心）'}
                {switchingRole === 'INSPECTOR' && '现场特种运维巡检员 · 林志强（现场工程组）'}
              </div>
              <p className="text-[11px] text-slate-500">
                切换后将为您重定向至该角色的默认工作落地页，并在系统操作审计日志中留下记录。
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSwitchingRole(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  onClick={() => handleSwitchConfirm(switchingRole)}
                  className="px-4 py-1.5 rounded-lg bg-[#004287] text-white font-semibold hover:bg-[#003366]"
                >
                  确认切换并进入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
