import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/AppContext';
import { User, UserRole, PatrolTask, WorkOrder } from '../types/domain';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRightLeft,
  X,
  Copy,
  Check,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Building2,
  Filter,
} from 'lucide-react';

export const UsersManagement: React.FC = () => {
  const {
    users,
    currentRole,
    currentUser,
    patrolTasks,
    workOrders,
    addUser,
    toggleUserStatus,
    reassignUserTasksAndDeactivate,
    resetUserPassword,
  } = useAppStore();

  // 搜索与过滤
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');

  // 新增用户模态框
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserData, setNewUserData] = useState<Partial<User>>({
    name: '',
    username: '',
    role: 'OPERATOR',
    department: '低碳园区示范站 / 智慧运营中心',
    phone: '138-****-9201',
    email: '',
    wechat: '',
  });
  const [addError, setAddError] = useState('');

  // 任务改派并停用模态框
  const [blockedTargetUser, setBlockedTargetUser] = useState<User | null>(null);
  const [pendingTasksForBlocked, setPendingTasksForBlocked] = useState<PatrolTask[]>([]);
  const [pendingOrdersForBlocked, setPendingOrdersForBlocked] = useState<WorkOrder[]>([]);
  const [availableReassignees, setAvailableReassignees] = useState<User[]>([]);
  const [selectedNewAssigneeId, setSelectedNewAssigneeId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState('人员岗位临时轮换，名下全部未完成巡检任务与工单正式交接备班人员');
  const [isSubmittingReassign, setIsSubmittingReassign] = useState(false);

  // 密码重置成功模态框
  const [resetModalData, setResetModalData] = useState<{
    userName: string;
    username: string;
    token: string;
  } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // 操作通知提示
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'SUCCESS' | 'ERROR' } | null>(null);

  const showToast = (text: string, type: 'SUCCESS' | 'ERROR' = 'SUCCESS') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 权限守卫：仅 ADMIN 角色可管理用户
  const isAdmin = currentRole === 'ADMIN';

  // 统计数据
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'ACTIVE').length;
    const disabled = users.filter((u) => u.status === 'DISABLED').length;
    const assignedInspectors = new Set(
      patrolTasks
        .filter((t) => t.status !== 'ARCHIVED' && t.status !== 'SUBMITTED')
        .map((t) => t.assignee)
    ).size;
    return { total, active, disabled, assignedInspectors };
  }, [users, patrolTasks]);

  // 过滤后的用户列表
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const s = searchTerm.trim().toLowerCase();
      const matchSearch =
        !s ||
        u.name.toLowerCase().includes(s) ||
        u.username.toLowerCase().includes(s) ||
        (u.phone && u.phone.includes(s)) ||
        (u.email && u.email.toLowerCase().includes(s));
      return matchRole && matchStatus && matchSearch;
    });
  }, [users, roleFilter, statusFilter, searchTerm]);

  // 处理启停
  const handleToggleStatus = async (user: User) => {
    if (!isAdmin) {
      showToast('权限受限：仅系统管理员有权调整人员账号状态', 'ERROR');
      return;
    }

    const res = await toggleUserStatus(user.id);
    if (res.blocked) {
      // 触发交接改派流程
      setBlockedTargetUser(user);
      setPendingTasksForBlocked(res.pendingTasks || []);
      setPendingOrdersForBlocked(res.pendingOrders || []);
      const reassignCandidates = res.availableReassignees || [];
      setAvailableReassignees(reassignCandidates);
      if (reassignCandidates.length > 0) {
        setSelectedNewAssigneeId(reassignCandidates[0].id);
      }
    } else if (res.success) {
      showToast(res.message);
    } else {
      showToast(res.message, 'ERROR');
    }
  };

  // 提交交接改派并停用
  const handleConfirmReassignAndDeactivate = async () => {
    if (!blockedTargetUser || !selectedNewAssigneeId) return;
    setIsSubmittingReassign(true);
    try {
      const res = await reassignUserTasksAndDeactivate(
        blockedTargetUser.id,
        selectedNewAssigneeId,
        reassignReason
      );
      if (res.success) {
        showToast(res.message);
        setBlockedTargetUser(null);
      } else {
        showToast(res.message, 'ERROR');
      }
    } finally {
      setIsSubmittingReassign(false);
    }
  };

  // 处理重置密码
  const handleResetPassword = async (user: User) => {
    if (!isAdmin) {
      showToast('权限受限：仅系统管理员有权执行密码重置', 'ERROR');
      return;
    }
    const res = await resetUserPassword(user.id);
    if (res.success) {
      setResetModalData({
        userName: user.name,
        username: user.username,
        token: res.tempPasswordToken,
      });
      setCopiedToken(false);
    } else {
      showToast(res.message, 'ERROR');
    }
  };

  // 提交新建用户
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.username) {
      setAddError('请完整填写姓名和系统账号');
      return;
    }
    const exists = users.some((u) => u.username.toLowerCase() === (newUserData.username || '').toLowerCase());
    if (exists) {
      setAddError('账号已存在，请使用其他登录账号');
      return;
    }

    const res = await addUser(newUserData);
    if (res.success) {
      showToast(res.message);
      setShowAddModal(false);
      setNewUserData({
        name: '',
        username: '',
        role: 'OPERATOR',
        department: '低碳园区示范站 / 智慧运营中心',
        phone: '138-****-9201',
        email: '',
        wechat: '',
      });
      setAddError('');
    } else {
      setAddError(res.message);
    }
  };

  return (
    <div id="users-management-container" className="space-y-6 pb-12">
      {/* 顶部标题区与操作栏 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">用户与人员管理</h1>
              <p className="text-sm text-slate-500 mt-1">
                统一管理示范站三类核心角色（系统管理员、微电网运营主管、特种巡检员），支持启停门禁与安全改派。
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isAdmin ? (
            <button
              id="btn-add-demo-user"
              onClick={() => {
                setShowAddModal(true);
                setAddError('');
              }}
              className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              新增用户
            </button>
          ) : (
            <div className="inline-flex items-center px-3.5 py-1.5 bg-amber-50 text-amber-800 text-xs font-medium rounded-full border border-amber-200">
              <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              只读模式（仅管理员可编辑）
            </div>
          )}
        </div>
      </div>

      {/* 统计指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">用户总数</span>
            <span className="p-1.5 bg-slate-100 text-slate-700 rounded-md">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500">位</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">正常在岗账号</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-600">{stats.active}</span>
            <span className="text-xs text-slate-500">位处于激活状态</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">已停用账号</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-md">
              <UserX className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-rose-600">{stats.disabled}</span>
            <span className="text-xs text-slate-500">位禁用账号</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">负荷中的执行人</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-blue-600">{stats.assignedInspectors}</span>
            <span className="text-xs text-slate-500">人有进行中任务</span>
          </div>
        </div>
      </div>

      {/* 搜索过滤控制栏 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-user-search"
              type="text"
              placeholder="搜索姓名、账号、手机或邮箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
              <button
                onClick={() => setRoleFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  roleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                全部角色
              </button>
              <button
                onClick={() => setRoleFilter('ADMIN')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  roleFilter === 'ADMIN' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                系统管理员
              </button>
              <button
                onClick={() => setRoleFilter('OPERATOR')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  roleFilter === 'OPERATOR' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                运营主管
              </button>
              <button
                onClick={() => setRoleFilter('INSPECTOR')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  roleFilter === 'INSPECTOR' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                巡检员
              </button>
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                全部状态
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                正常
              </button>
              <button
                onClick={() => setStatusFilter('DISABLED')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'DISABLED' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                已停用
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 用户列表表格 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                <th className="py-3 px-4">姓名 / 账号</th>
                <th className="py-3 px-4">系统角色</th>
                <th className="py-3 px-4">所属部门</th>
                <th className="py-3 px-4">账号状态</th>
                <th className="py-3 px-4">最近登录</th>
                <th className="py-3 px-4">联系方式占位</th>
                <th className="py-3 px-4 text-right">操作管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-sm">未找到符合条件的用户</p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-2 text-xs text-blue-600 hover:underline cursor-pointer"
                      >
                        清空搜索条件
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = currentUser.username === user.username;
                  const roleBadgeClass =
                    user.role === 'ADMIN'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : user.role === 'OPERATOR'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200';

                  // 统计当前用户进行中任务
                  const activeTasks = patrolTasks.filter(
                    (t) => t.assignee === user.name && t.status !== 'ARCHIVED' && t.status !== 'SUBMITTED'
                  );
                  const activeOrders = workOrders.filter(
                    (w) => w.assignee === user.name && w.status !== 'CLOSED'
                  );

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                            {user.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-slate-900">{user.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded">
                                  当前会话
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-mono text-slate-500">{user.username}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${roleBadgeClass}`}
                        >
                          {user.roleTitle}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        <div className="flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{user.department}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col space-y-1">
                          {user.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center text-xs font-medium text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                              正常在岗
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-medium text-rose-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5"></span>
                              已停用
                            </span>
                          )}
                          {(activeTasks.length > 0 || activeOrders.length > 0) && (
                            <span className="text-[11px] text-amber-600 font-medium">
                              {activeTasks.length > 0 && `${activeTasks.length}巡检待办 `}
                              {activeOrders.length > 0 && `${activeOrders.length}工单待办`}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.lastLoginTime || '未记录'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col space-y-1 text-xs text-slate-500">
                          <div className="flex items-center space-x-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{user.phone || '138-****-0000'}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[130px]">{user.email || `${user.username}@cecep.cn`}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <MessageSquare className="w-3 h-3 text-slate-400" />
                            <span>{user.wechat || `wx_${user.username}`}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1">
                          {isAdmin ? (
                            <>
                              <button
                                id={`btn-reset-pwd-${user.id}`}
                                onClick={() => handleResetPassword(user)}
                                title="重置用户口令"
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>

                              <button
                                id={`btn-toggle-status-${user.id}`}
                                onClick={() => handleToggleStatus(user)}
                                title={user.status === 'ACTIVE' ? '停用账号' : '启用账号'}
                                className={`p-1.5 rounded transition-colors cursor-pointer ${
                                  user.status === 'ACTIVE'
                                    ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                                    : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {user.status === 'ACTIVE' ? (
                                  <UserX className="w-4 h-4" />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">只读</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 停用前门禁：安全改派模态框 */}
      {blockedTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-rose-50/80 border-b border-rose-100 flex items-start space-x-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-rose-900">安全生产停用门禁：存在未闭环待办</h3>
                <p className="text-xs text-rose-700 mt-1">
                  根据中节能电力安全规程，执行人名下有未完成巡检任务或整改工单时严禁直接注销或停用，必须先移交改派至备班在岗人员！
                </p>
              </div>
              <button
                onClick={() => setBlockedTargetUser(null)}
                className="text-rose-400 hover:text-rose-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">原任务执行人:</span>
                  <span className="font-semibold text-slate-900">
                    {blockedTargetUser.name} ({blockedTargetUser.roleTitle})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">未闭环巡检任务:</span>
                  <span className="font-semibold text-rose-600">{pendingTasksForBlocked.length} 项进行中</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">未闭环整改工单:</span>
                  <span className="font-semibold text-rose-600">{pendingOrdersForBlocked.length} 项未关闭</span>
                </div>
              </div>

              {/* 任务清单摘要展示 */}
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg p-2 text-xs">
                {pendingTasksForBlocked.map((t) => (
                  <div key={t.id} className="py-1.5 flex items-center justify-between text-slate-700">
                    <span className="font-mono text-slate-500">{t.taskCode}</span>
                    <span className="truncate max-w-[200px]">{t.taskName || t.title}</span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-1 rounded border border-amber-200">
                      巡检中
                    </span>
                  </div>
                ))}
                {pendingOrdersForBlocked.map((w) => (
                  <div key={w.id} className="py-1.5 flex items-center justify-between text-slate-700">
                    <span className="font-mono text-slate-500">{w.orderCode}</span>
                    <span className="truncate max-w-[200px]">{w.title}</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-1 rounded border border-blue-200">
                      消缺工单
                    </span>
                  </div>
                ))}
              </div>

              {/* 改派目标选择 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  接替执行人（仅列出示范站在岗活跃人员）:
                </label>
                {availableReassignees.length === 0 ? (
                  <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs border border-rose-200">
                    示范站无其他在岗备班人员！请先激活或新增一名备班巡检员后重试。
                  </div>
                ) : (
                  <select
                    id="select-reassignee"
                    value={selectedNewAssigneeId}
                    onChange={(e) => setSelectedNewAssigneeId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {availableReassignees.map((cand) => (
                      <option key={cand.id} value={cand.id}>
                        {cand.name} - {cand.roleTitle} ({cand.username})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">交接原因与审计说明:</label>
                <textarea
                  rows={2}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="请输入交接安全审计说明..."
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => setBlockedTargetUser(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                id="btn-confirm-reassign-deactivate"
                disabled={isSubmittingReassign || availableReassignees.length === 0}
                onClick={handleConfirmReassignAndDeactivate}
                className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />
                {isSubmittingReassign ? '正在改派并停用...' : '一键改派并停用原账号'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 密码重置成功令牌展示模态框 (不显示明文密码，显示安全临时令牌) */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-blue-50/80 border-b border-blue-100 flex items-start space-x-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-blue-900">登录口令重置成功</h3>
                <p className="text-xs text-blue-700 mt-1">
                  平台已为用户签发一次性安全临时凭证令牌，合规审计已自动记录。
                </p>
              </div>
              <button onClick={() => setResetModalData(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">用户姓名:</span>
                  <span className="font-semibold text-slate-900">{resetModalData.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">登录账号:</span>
                  <span className="font-mono text-slate-900">{resetModalData.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">令牌有效期:</span>
                  <span className="text-emerald-700 font-medium">10 分钟（一次性核销）</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">一次性临时授权凭据 (Token):</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={resetModalData.token}
                    className="flex-1 text-xs font-mono font-bold text-blue-800 bg-blue-50/50 p-2.5 border border-blue-200 rounded-lg select-all"
                  />
                  <button
                    id="btn-copy-token"
                    onClick={() => {
                      navigator.clipboard?.writeText(resetModalData.token);
                      setCopiedToken(true);
                      setTimeout(() => setCopiedToken(false), 2000);
                    }}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-colors flex items-center cursor-pointer"
                  >
                    {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  * 安全合规说明：平台绝不保存或明文回显真实密钥，系统通过受控临时凭证保障零信任安全。
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setResetModalData(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                已确认并关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增用户模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-semibold text-slate-900">新增示范站用户</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs border border-rose-200 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  真实姓名 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：林晓鹏"
                  value={newUserData.name || ''}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  系统登录账号 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：linxp"
                  value={newUserData.username || ''}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  角色定位 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newUserData.role || 'OPERATOR'}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="OPERATOR">微电网运营主管 (监控/电价草稿/收益重算/工单复核)</option>
                  <option value="INSPECTOR">特种巡检员 (移动端/离线巡检/异常消缺上报)</option>
                  <option value="ADMIN">系统管理员 (全功能/用户权限配置/二次授权审批)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">所属组织 / 班组</label>
                <input
                  type="text"
                  placeholder="中节能示范站综合运营组"
                  value={newUserData.department || ''}
                  onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">联系手机 (脱敏占位)</label>
                  <input
                    type="text"
                    placeholder="138-****-8822"
                    value={newUserData.phone || ''}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">企业微信账号</label>
                  <input
                    type="text"
                    placeholder="wx_linxp"
                    value={newUserData.wechat || ''}
                    onChange={(e) => setNewUserData({ ...newUserData, wechat: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  创建用户
                </button>
              </div>
            </form>
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
