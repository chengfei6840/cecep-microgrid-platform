import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/AppContext';
import { UserRole } from '../types/domain';
import { PERMISSION_DEFINITIONS, DEFAULT_ROLE_PERMISSIONS } from '../store/scenarioData';
import {
  ShieldCheck,
  Lock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Info,
  Sliders,
  Table,
  Layers,
  ChevronRight,
  Shield,
  X,
  ArrowRight,
} from 'lucide-react';

interface RoleMeta {
  role: UserRole;
  title: string;
  name: string;
  tagline: string;
  duty: string;
  colorClass: string;
  badgeClass: string;
}

const ROLES_META: RoleMeta[] = [
  {
    role: 'ADMIN',
    title: '系统管理员',
    name: '系统安全与配置审计',
    tagline: '负责平台底座安全、系统配置、用户账号管理与电价二次独立授权审批',
    duty: '系统级配置、底层适配器接入、两票制二次授权审批、权限分配及全量审计追溯。',
    colorClass: 'border-blue-500 bg-blue-50/20 text-blue-800',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    role: 'OPERATOR',
    title: '微电网运营主管',
    name: '调度监控与收益核算',
    tagline: '负责微电网日常运行大屏监控、分时电价编制、收益重算复核与工单闭环',
    duty: '微电网实时遥测、电价草稿编制上报、日终收益重算校验、告警处置转工单及巡检复核。',
    colorClass: 'border-emerald-500 bg-emerald-50/20 text-emerald-800',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    role: 'INSPECTOR',
    title: '特种巡检员',
    name: '移动巡检与现场消缺',
    tagline: '负责现场特种作业移动端点检、离线巡查、缺陷异常上报与紧急消缺',
    duty: '移动端点检任务执行、离线数据暂存与回传、现场故障取证及整改工单处置。',
    colorClass: 'border-indigo-500 bg-indigo-50/20 text-indigo-800',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
];

export const RolesManagement: React.FC = () => {
  const {
    rolePermissions,
    updateRolePermission,
    currentRole,
    addAuditLog,
  } = useAppStore();

  const isAdmin = currentRole === 'ADMIN';

  // 视图模式：矩阵全景对比 or 单角色深入
  const [viewMode, setViewMode] = useState<'MATRIX' | 'SINGLE'>('MATRIX');
  const [activeRoleTab, setActiveRoleTab] = useState<UserRole>('OPERATOR');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'ACTION' | 'MENU'>('ALL');

  // 互斥冲突提示模态框
  const [conflictModal, setConflictModal] = useState<{
    show: boolean;
    role: UserRole;
    permName: string;
    reason: string;
  }>({
    show: false,
    role: 'OPERATOR',
    permName: '',
    reason: '',
  });

  // 高风险权限二次确认模态框
  const [highRiskConfirmModal, setHighRiskConfirmModal] = useState<{
    show: boolean;
    role: UserRole;
    permKey: string;
    permName: string;
    targetEnable: boolean;
    riskLevel: string;
    description: string;
  } | null>(null);

  // 通知消息
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'SUCCESS' | 'ERROR' } | null>(null);

  const showToast = (text: string, type: 'SUCCESS' | 'ERROR' = 'SUCCESS') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 过滤权限项
  const filteredPermissions = useMemo(() => {
    return PERMISSION_DEFINITIONS.filter((p) => {
      if (filterCategory === 'ALL') return true;
      return p.category === filterCategory;
    });
  }, [filterCategory]);

  // 分类统计
  const actionPerms = useMemo(() => PERMISSION_DEFINITIONS.filter((p) => p.category === 'ACTION'), []);
  const menuPerms = useMemo(() => PERMISSION_DEFINITIONS.filter((p) => p.category === 'MENU'), []);

  // 处理权限切换点击
  const handlePermissionToggle = async (role: UserRole, permKey: string, currentEnabled: boolean) => {
    if (!isAdmin) {
      showToast('权限受限：仅系统管理员有权调整角色权限矩阵', 'ERROR');
      return;
    }

    const permDef = PERMISSION_DEFINITIONS.find((p) => p.key === permKey);
    if (!permDef) return;

    const targetEnable = !currentEnabled;

    // 1. 如果是高风险或临界权限，触发二次确认
    if (permDef.riskLevel === 'CRITICAL' || permDef.riskLevel === 'HIGH') {
      setHighRiskConfirmModal({
        show: true,
        role,
        permKey,
        permName: permDef.name,
        targetEnable,
        riskLevel: permDef.riskLevel,
        description: permDef.description,
      });
      return;
    }

    // 2. 正常低中风险权限直接更新（带互斥校验）
    executePermissionChange(role, permKey, targetEnable);
  };

  // 实际执行权限变更
  const executePermissionChange = async (role: UserRole, permKey: string, enable: boolean) => {
    const permDef = PERMISSION_DEFINITIONS.find((p) => p.key === permKey);
    const res = await updateRolePermission(role, permKey, enable);

    if (res.conflict) {
      setConflictModal({
        show: true,
        role,
        permName: permDef?.name || permKey,
        reason: res.conflictReason || '违反内部控制两票制三权分立原则，严禁同一角色同时赋权！',
      });
    } else if (res.success) {
      showToast(res.message || '权限已更新并生效');
    } else {
      showToast(res.message || '操作失败', 'ERROR');
    }
  };

  // 确认高风险变更
  const handleConfirmHighRisk = () => {
    if (!highRiskConfirmModal) return;
    executePermissionChange(
      highRiskConfirmModal.role,
      highRiskConfirmModal.permKey,
      highRiskConfirmModal.targetEnable
    );
    setHighRiskConfirmModal(null);
  };

  // 恢复出厂默认三权分立权限矩阵
  const handleResetToDefault = () => {
    if (!isAdmin) return;
    if (window.confirm('确认将三类内置角色的权限矩阵全部重置为标准两票制三权分立预设方案？')) {
      // 遍历更新
      ROLES_META.forEach((r) => {
        const defaultPerms = DEFAULT_ROLE_PERMISSIONS[r.role] || [];
        PERMISSION_DEFINITIONS.forEach((p) => {
          const shouldHave = defaultPerms.includes(p.key);
          const currentHave = (rolePermissions[r.role] || []).includes(p.key);
          if (shouldHave !== currentHave) {
            updateRolePermission(r.role, p.key, shouldHave);
          }
        });
      });
      addAuditLog({
        targetObject: '全局角色权限矩阵',
        action: '重置权限矩阵至标准预设',
        oldState: 'CUSTOMIZED',
        newState: 'DEFAULT_SEGREGATION_OF_DUTIES',
        result: 'SUCCESS',
        sourcePage: '/admin/roles',
        reason: '管理员一键恢复标准两票制三权分立权限矩阵预设',
      });
      showToast('已成功恢复系统标准两票制三权分立权限方案');
    }
  };

  return (
    <div id="roles-management-container" className="space-y-6 pb-12">
      {/* 头部与操作区 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">角色权限矩阵与安全策略</h1>
              <p className="text-sm text-slate-500 mt-1">
                展示示范站三权分立权限矩阵。固定三类核心角色（不可删除），支持细粒度菜单与按钮权限调整，严格保障两票制三权分立互斥。
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isAdmin && (
            <button
              id="btn-reset-default-perms"
              onClick={handleResetToDefault}
              className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              重置为标准预设
            </button>
          )}

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('MATRIX')}
              className={`flex items-center px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'MATRIX' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5 mr-1.5" />
              全景对比矩阵
            </button>
            <button
              onClick={() => setViewMode('SINGLE')}
              className={`flex items-center px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'SINGLE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              角色专属视图
            </button>
          </div>
        </div>
      </div>

      {/* 三类核心角色卡片展示（不可删除核心角色保护） */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLES_META.map((meta) => {
          const currentCount = (rolePermissions[meta.role] || []).length;
          const isSelected = viewMode === 'SINGLE' && activeRoleTab === meta.role;

          return (
            <div
              key={meta.role}
              onClick={() => {
                if (viewMode === 'SINGLE') setActiveRoleTab(meta.role);
              }}
              className={`p-5 rounded-2xl border transition-all ${
                isSelected
                  ? 'border-blue-500 bg-white shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              } ${viewMode === 'SINGLE' ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${meta.badgeClass}`}>
                    {meta.title}
                  </span>
                  <span className="inline-flex items-center text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    <Lock className="w-3 h-3 mr-1 text-slate-400" />
                    内置核心角色
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  {currentCount} 项已赋权
                </span>
              </div>

              <h3 className="text-base font-semibold text-slate-900 mt-3">{meta.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{meta.tagline}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="truncate max-w-[200px] text-[11px] text-slate-400">{meta.duty}</span>
                {viewMode === 'SINGLE' && (
                  <span className="text-blue-600 font-medium flex items-center shrink-0">
                    {isSelected ? '正在编辑' : '查看详情'}
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 两票制三权分立安全指引 Banner */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-1">
          <p className="font-semibold text-amber-950">
            内部控制两票制三权分立原则 (Segregation of Duties):
          </p>
          <p className="text-amber-800 leading-relaxed">
            系统严格遵循电力营销与财务合规审计要求：同一角色严禁同时拥有【电价草稿编制与提交】与【电价二次授权审批】权限。编制人与审批人生效分离，保障电费核算客观公允。取消某按钮权限后，菜单、按钮与模拟
            API 门禁拦截将同步立即生效。
          </p>
        </div>
      </div>

      {/* 过滤控制栏 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-slate-500">权限类型筛选:</span>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setFilterCategory('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterCategory === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部 ({PERMISSION_DEFINITIONS.length})
            </button>
            <button
              onClick={() => setFilterCategory('ACTION')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterCategory === 'ACTION' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              按钮与关键操作 ({actionPerms.length})
            </button>
            <button
              onClick={() => setFilterCategory('MENU')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterCategory === 'MENU' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              页面与菜单访问 ({menuPerms.length})
            </button>
          </div>
        </div>

        {viewMode === 'SINGLE' && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500">当前正在配置:</span>
            <div className="flex space-x-1.5">
              {ROLES_META.map((r) => (
                <button
                  key={r.role}
                  onClick={() => setActiveRoleTab(r.role)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    activeRoleTab === r.role ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {r.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 视图 1: 三角色全景对比矩阵 */}
      {viewMode === 'MATRIX' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 text-xs font-semibold">
                  <th className="py-3.5 px-4 w-[340px]">权限项名称 / 编码</th>
                  <th className="py-3.5 px-3 w-[100px] text-center">类型</th>
                  <th className="py-3.5 px-3 w-[110px] text-center">风险等级</th>
                  <th className="py-3.5 px-6 text-center w-[170px] bg-blue-50/40 border-l border-r border-slate-200">
                    <div className="font-bold text-blue-900">系统管理员</div>
                    <div className="text-[10px] text-blue-600 font-normal">ADMIN</div>
                  </th>
                  <th className="py-3.5 px-6 text-center w-[170px] bg-emerald-50/40 border-r border-slate-200">
                    <div className="font-bold text-emerald-900">运营主管</div>
                    <div className="text-[10px] text-emerald-600 font-normal">OPERATOR</div>
                  </th>
                  <th className="py-3.5 px-6 text-center w-[170px] bg-indigo-50/40">
                    <div className="font-bold text-indigo-900">特种巡检员</div>
                    <div className="text-[10px] text-indigo-600 font-normal">INSPECTOR</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPermissions.map((p) => {
                  const isAdminActive = (rolePermissions.ADMIN || []).includes(p.key);
                  const isOperatorActive = (rolePermissions.OPERATOR || []).includes(p.key);
                  const isInspectorActive = (rolePermissions.INSPECTOR || []).includes(p.key);

                  const riskBadge =
                    p.riskLevel === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : p.riskLevel === 'HIGH'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : p.riskLevel === 'MEDIUM'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                  const riskLabel =
                    p.riskLevel === 'CRITICAL'
                      ? '临界高危'
                      : p.riskLevel === 'HIGH'
                      ? '高风险'
                      : p.riskLevel === 'MEDIUM'
                      ? '中风险'
                      : '基础操作';

                  return (
                    <tr key={p.key} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-xs">{p.name}</span>
                          <span className="text-[11px] font-mono text-slate-400">{p.key}</span>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{p.description}</p>
                          {p.mutuallyExclusiveWith && (
                            <span className="inline-flex items-center text-[10px] text-amber-700 mt-1 font-medium">
                              <AlertTriangle className="w-3 h-3 mr-1 shrink-0" />
                              与 [{p.mutuallyExclusiveWith}] 强互斥
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            p.category === 'ACTION'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}
                        >
                          {p.category === 'ACTION' ? '按钮操作' : '页面菜单'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${riskBadge}`}>
                          {riskLabel}
                        </span>
                      </td>

                      {/* ADMIN 列 */}
                      <td className="py-3.5 px-6 text-center bg-blue-50/20 border-l border-r border-slate-200">
                        <button
                          id={`chk-admin-${p.key}`}
                          disabled={!isAdmin}
                          onClick={() => handlePermissionToggle('ADMIN', p.key, isAdminActive)}
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-md transition-all cursor-pointer ${
                            isAdminActive
                              ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                              : 'border-2 border-slate-300 text-transparent hover:border-blue-400 bg-white'
                          } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </td>

                      {/* OPERATOR 列 */}
                      <td className="py-3.5 px-6 text-center bg-emerald-50/20 border-r border-slate-200">
                        <button
                          id={`chk-operator-${p.key}`}
                          disabled={!isAdmin}
                          onClick={() => handlePermissionToggle('OPERATOR', p.key, isOperatorActive)}
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-md transition-all cursor-pointer ${
                            isOperatorActive
                              ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                              : 'border-2 border-slate-300 text-transparent hover:border-emerald-400 bg-white'
                          } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </td>

                      {/* INSPECTOR 列 */}
                      <td className="py-3.5 px-6 text-center bg-indigo-50/20">
                        <button
                          id={`chk-inspector-${p.key}`}
                          disabled={!isAdmin}
                          onClick={() => handlePermissionToggle('INSPECTOR', p.key, isInspectorActive)}
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-md transition-all cursor-pointer ${
                            isInspectorActive
                              ? 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-700'
                              : 'border-2 border-slate-300 text-transparent hover:border-indigo-400 bg-white'
                          } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 视图 2: 角色专属深入视图 */}
      {viewMode === 'SINGLE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {ROLES_META.find((r) => r.role === activeRoleTab)?.title} - 专属权限清单
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {ROLES_META.find((r) => r.role === activeRoleTab)?.tagline}
              </p>
            </div>
            <div className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              已授予 {(rolePermissions[activeRoleTab] || []).length} / {PERMISSION_DEFINITIONS.length} 项权限
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPermissions.map((p) => {
              const isEnabled = (rolePermissions[activeRoleTab] || []).includes(p.key);
              return (
                <div
                  key={p.key}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between space-x-3 ${
                    isEnabled
                      ? 'border-blue-200 bg-blue-50/30'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                  }`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900 text-xs">{p.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          p.category === 'ACTION' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {p.category === 'ACTION' ? '按钮' : '菜单'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{p.description}</p>
                    <div className="flex items-center space-x-2 pt-1 text-[11px] text-slate-400 font-mono">
                      <span>{p.key}</span>
                      {p.riskLevel === 'CRITICAL' && (
                        <span className="text-rose-600 font-bold">· 临界权限</span>
                      )}
                      {p.mutuallyExclusiveWith && (
                        <span className="text-amber-700 font-medium">· 与 {p.mutuallyExclusiveWith} 互斥</span>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={!isAdmin}
                    onClick={() => handlePermissionToggle(activeRoleTab, p.key, isEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? 'bg-blue-600' : 'bg-slate-300'
                    } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 互斥冲突告警弹窗（两票制三权分立拦截） */}
      {conflictModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-start space-x-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-rose-900">权限冲突：两票制三权分立门禁拦截</h3>
                <p className="text-xs text-rose-700 mt-1">
                  系统已主动拦截本次赋权请求，该配置违反了内部控制职责分离原则。
                </p>
              </div>
              <button
                onClick={() => setConflictModal({ show: false, role: 'OPERATOR', permName: '', reason: '' })}
                className="text-rose-400 hover:text-rose-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-2">
                <p className="font-semibold text-rose-950">安全阻断原因：</p>
                <p className="leading-relaxed">{conflictModal.reason}</p>
              </div>

              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p className="font-medium text-slate-800">中节能合规管控规范：</p>
                <p>
                  1. 电价草稿编制人员负责市场调研与测算输入；二次授权审批人员独立行使审批权，自编自批将直接导致内控失效与财务结算风险。
                </p>
                <p>2. 如确需调整审批权，请先收回该角色的【电价草稿提交】权限后，再尝试授予审批生效权。</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setConflictModal({ show: false, role: 'OPERATOR', permName: '', reason: '' })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                我知道了 (安全拦截已生效)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 高风险权限调整二次确认弹窗 */}
      {highRiskConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-amber-50 border-b border-amber-100 flex items-start space-x-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-amber-900">高风险权限变更二次确认</h3>
                <p className="text-xs text-amber-700 mt-1">
                  您正在变更一项影响全站运行或财务结算的高风险权限，请确认操作意图。
                </p>
              </div>
              <button
                onClick={() => setHighRiskConfirmModal(null)}
                className="text-amber-400 hover:text-amber-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">目标受控角色:</span>
                  <span className="font-semibold text-slate-900">
                    {ROLES_META.find((r) => r.role === highRiskConfirmModal.role)?.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">目标权限项:</span>
                  <span className="font-semibold text-slate-900">{highRiskConfirmModal.permName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">调整动作:</span>
                  <span
                    className={`font-bold ${
                      highRiskConfirmModal.targetEnable ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {highRiskConfirmModal.targetEnable ? '【授予权限并生效】' : '【收回权限并停用】'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">风险等级:</span>
                  <span className="font-semibold text-rose-700">{highRiskConfirmModal.riskLevel}</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">业务影响说明:</p>
                <p className="leading-relaxed text-slate-500">{highRiskConfirmModal.description}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => setHighRiskConfirmModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                id="btn-confirm-high-risk-perm"
                onClick={handleConfirmHighRisk}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                确认调整并记录审计
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 提示消息 Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom duration-200">
          <div
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl shadow-lg border text-sm ${
              toastMessage.type === 'SUCCESS'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            {toastMessage.type === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};
