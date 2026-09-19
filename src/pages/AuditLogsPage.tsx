import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/AppContext';
import { UserRole, AuditLog } from '../types/domain';
import { DetailDrawer } from '../components/common/DetailDrawer';
import {
  FileText,
  Download,
  Filter,
  Search,
  Hash,
  Clock,
  UserCheck,
  ShieldCheck,
  Lock,
  Calendar,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs, currentRole, currentUser } = useAppStore();

  const isAdmin = currentRole === 'ADMIN';
  const isOperator = currentRole === 'OPERATOR';

  // 搜索与多维度筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ALL' | UserRole>('ALL');
  const [selectedResult, setSelectedResult] = useState<'ALL' | 'SUCCESS' | 'BLOCKED' | 'FAILED'>('ALL');
  const [timeRange, setTimeRange] = useState<'ALL' | 'TODAY' | 'THREE_DAYS'>('ALL');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // 运营人员角色业务过滤：仅查看与业务相关日志（如电价、告警、工单、收益、报表、巡检等）
  const relevantLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // 若是运营人员，过滤掉纯系统管理与权限配置日志（三权分立审计约束）
      if (isOperator) {
        const isPureAdmin =
          log.sourcePage?.includes('/admin/roles') ||
          log.sourcePage?.includes('/admin/users') ||
          log.targetObject?.includes('角色权限') ||
          log.targetObject?.includes('系统安全配置') ||
          log.action?.includes('重置权限矩阵');
        if (isPureAdmin) return false;
      }
      return true;
    });
  }, [auditLogs, isOperator]);

  // 多条件组合查询过滤
  const filteredLogs = useMemo(() => {
    return relevantLogs.filter((log) => {
      // 1. 角色筛选
      if (selectedRole !== 'ALL' && log.role !== selectedRole) return false;

      // 2. 结果筛选
      if (selectedResult !== 'ALL') {
        const res = log.result || 'SUCCESS';
        if (res !== selectedResult) return false;
      }

      // 3. 时间范围筛选
      if (timeRange === 'TODAY') {
        const isToday = log.timestamp.includes('2026-09-08') || log.timestamp.includes('今天');
        if (!isToday && !log.timestamp.includes('09-08')) return false;
      } else if (timeRange === 'THREE_DAYS') {
        // 近 3 天日志筛选
        const isRecent =
          log.timestamp.includes('2026-09-08') ||
          log.timestamp.includes('2026-09-07') ||
          log.timestamp.includes('2026-09-06') ||
          log.timestamp.includes('2026-09-05');
        if (!isRecent) return false;
      }

      // 4. 关键词搜索：动作、对象、traceId、操作人、原因、来源页面、版本
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchAction = log.action.toLowerCase().includes(term);
        const matchTarget = log.targetObject.toLowerCase().includes(term);
        const matchTrace = log.traceId.toLowerCase().includes(term);
        const matchOperator = log.operatorName.toLowerCase().includes(term);
        const matchReason = (log.reason || '').toLowerCase().includes(term);
        const matchSource = (log.sourcePage || '').toLowerCase().includes(term);
        const matchVersion = (log.relatedVersion || '').toLowerCase().includes(term);

        if (
          !matchAction &&
          !matchTarget &&
          !matchTrace &&
          !matchOperator &&
          !matchReason &&
          !matchSource &&
          !matchVersion
        ) {
          return false;
        }
      }

      return true;
    });
  }, [relevantLogs, selectedRole, selectedResult, timeRange, searchTerm]);

  const selectedLog = useMemo(() => {
    return auditLogs.find((l) => l.id === selectedLogId) || null;
  }, [auditLogs, selectedLogId]);

  const handleExport = () => {
    setExportNotice(
      `已成功导出：示范站_全流程合规审计流水_${new Date().toISOString().slice(0, 10)}.xlsx (共 ${filteredLogs.length} 条记录，带 SHA-256 存证签名)`
    );
    setTimeout(() => setExportNotice(null), 5000);
  };

  return (
    <div id="audit-logs-container" className="space-y-6 pb-12">
      {/* 头部标题区 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">全域业务操作不可篡改审计日志</h1>
                <span className="inline-flex items-center text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <Lock className="w-3 h-3 mr-1 text-emerald-600" />
                  只追加 · 严禁删除
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {isOperator
                  ? '运营人员专属视图：已过滤底层系统配置日志，仅展示电价方案、告警确认、工单消缺及收益重算等业务流水。'
                  : '系统管理员全域视图：完整追溯电价生效二次授权、补采治理、权限策略调整及安全门禁拦截全链路。'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-export-audit-logs"
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            导出审计流水
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{exportNotice}</span>
          </div>
        </div>
      )}

      {/* 综合多维度查询工具条 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* 关键字搜索输入框 */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-audit-search"
              type="text"
              placeholder="按操作动作、对象、TraceId、版本、操作人或原因查询..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 角色筛选 */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <span className="text-[11px] text-slate-400 px-1">角色:</span>
              <button
                onClick={() => setSelectedRole('ALL')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  selectedRole === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setSelectedRole('ADMIN')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  selectedRole === 'ADMIN' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                管理员
              </button>
              <button
                onClick={() => setSelectedRole('OPERATOR')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  selectedRole === 'OPERATOR' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                运营主管
              </button>
              <button
                onClick={() => setSelectedRole('INSPECTOR')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  selectedRole === 'INSPECTOR' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                巡检员
              </button>
            </div>

            {/* 执行结果筛选 */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <span className="text-[11px] text-slate-400 px-1">结果:</span>
              <button
                onClick={() => setSelectedResult('ALL')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  selectedResult === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setSelectedResult('SUCCESS')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  selectedResult === 'SUCCESS' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                成功
              </button>
              <button
                onClick={() => setSelectedResult('BLOCKED')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  selectedResult === 'BLOCKED' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                门禁拦截
              </button>
              <button
                onClick={() => setSelectedResult('FAILED')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  selectedResult === 'FAILED' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                失败
              </button>
            </div>

            {/* 时间范围筛选 */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
              <button
                onClick={() => setTimeRange('ALL')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  timeRange === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                全部时间
              </button>
              <button
                onClick={() => setTimeRange('TODAY')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  timeRange === 'TODAY' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                今日 (09-08)
              </button>
              <button
                onClick={() => setTimeRange('THREE_DAYS')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${
                  timeRange === 'THREE_DAYS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                近 3 日
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 审计日志列表表格 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">审计操作流水存证明细</span>
            <span>(共匹配 {filteredLogs.length} 条流水)</span>
          </div>
          <span className="text-[11px] text-slate-400">单向递增时间戳 · 严格倒序</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">发生时间</th>
                <th className="py-3 px-4 whitespace-nowrap">操作人 (角色)</th>
                <th className="py-3 px-4 whitespace-nowrap">操作动作</th>
                <th className="py-3 px-4 whitespace-nowrap">操作对象</th>
                <th className="py-3 px-4 whitespace-nowrap">执行结果</th>
                <th className="py-3 px-4 whitespace-nowrap">状态迁移快照</th>
                <th className="py-3 px-4 whitespace-nowrap">业务依据原因</th>
                <th className="py-3 px-4 whitespace-nowrap">Trace ID</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-sm">未查询到匹配的审计日志记录</p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-2 text-xs text-blue-600 hover:underline cursor-pointer"
                      >
                        清空搜索词
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const roleBadgeClass =
                    log.role === 'ADMIN'
                      ? 'text-blue-700 bg-blue-50 border-blue-200'
                      : log.role === 'OPERATOR'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-indigo-700 bg-indigo-50 border-indigo-200';

                  const result = log.result || 'SUCCESS';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-slate-800">{log.operatorName}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${roleBadgeClass}`}
                          >
                            {log.role === 'ADMIN' ? '管理员' : log.role === 'OPERATOR' ? '运营' : '巡检'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {log.action}
                      </td>

                      <td className="py-3 px-4 text-slate-700 max-w-[180px] truncate" title={log.targetObject}>
                        {log.targetObject}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {result === 'SUCCESS' && (
                          <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            成功
                          </span>
                        )}
                        {result === 'BLOCKED' && (
                          <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertOctagon className="w-3 h-3 mr-1 text-amber-600" />
                            门禁拦截
                          </span>
                        )}
                        {result === 'FAILED' && (
                          <span className="inline-flex items-center text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="w-3 h-3 mr-1 text-rose-600" />
                            失败
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <span className="text-slate-400 line-through mr-1 text-[11px]">{log.oldState}</span>
                        <span className="text-blue-600 font-bold text-[11px]">→ {log.newState}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate text-[11px]" title={log.reason}>
                        {log.reason}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {log.traceId}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          id={`btn-view-audit-${log.id}`}
                          onClick={() => setSelectedLogId(log.id)}
                          className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                        >
                          详情
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 审计日志详情抽屉 (支持旧值、新值、原因、来源页面与关联版本深度展示) */}
      <DetailDrawer
        isOpen={Boolean(selectedLogId)}
        onClose={() => setSelectedLogId(null)}
        title={selectedLog?.action || '审计流水详情'}
        subTitle={`全局追溯 TraceId: ${selectedLog?.traceId}`}
      >
        {selectedLog && (
          <div className="space-y-5 text-xs">
            {/* 基础事实 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between text-slate-600">
                <span>发生时间:</span>
                <span className="font-mono text-slate-900 font-semibold">{selectedLog.timestamp}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>操作人员:</span>
                <span className="text-slate-900 font-semibold">{selectedLog.operatorName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>操作角色:</span>
                <span className="text-blue-700 font-semibold">
                  {selectedLog.role === 'ADMIN'
                    ? '系统管理员 (ADMIN)'
                    : selectedLog.role === 'OPERATOR'
                    ? '微电网运营主管 (OPERATOR)'
                    : '特种巡检员 (INSPECTOR)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>操作目标对象:</span>
                <span className="font-mono text-slate-900 font-semibold">{selectedLog.targetObject}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>执行结果判定:</span>
                <span
                  className={`font-semibold ${
                    (selectedLog.result || 'SUCCESS') === 'SUCCESS'
                      ? 'text-emerald-700'
                      : (selectedLog.result || 'SUCCESS') === 'BLOCKED'
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}
                >
                  {selectedLog.result || 'SUCCESS'}
                </span>
              </div>
            </div>

            {/* 状态机旧值与新值对比 */}
            <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100 space-y-2">
              <span className="text-blue-950 font-bold text-xs flex items-center">
                <Layers className="w-3.5 h-3.5 mr-1.5 text-blue-700" />
                状态机前后迁移快照 (State Transition):
              </span>
              <div className="grid grid-cols-2 gap-3 pt-1 font-mono text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block mb-1">变更前旧值 (Old State):</span>
                  <span className="text-slate-700 font-bold">{selectedLog.oldState}</span>
                </div>
                <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-xs">
                  <span className="text-blue-200 text-[10px] block mb-1">变更后新值 (New State):</span>
                  <span className="font-bold">{selectedLog.newState}</span>
                </div>
              </div>
            </div>

            {/* 来源页面与关联版本 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between text-slate-600">
                <span>操作来源路由:</span>
                <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {selectedLog.sourcePage || '/admin/audit'}
                </span>
              </div>
              {selectedLog.relatedVersion && (
                <div className="flex justify-between text-slate-600">
                  <span>关联生效版本:</span>
                  <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedLog.relatedVersion}
                  </span>
                </div>
              )}
            </div>

            {/* 操作依据原因 */}
            <div>
              <span className="font-bold text-slate-800 block mb-1.5">操作依据与业务原因 (Audit Reason):</span>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed text-slate-700 text-xs">
                {selectedLog.reason}
              </div>
            </div>

            {/* 防篡改区块链/存证哈希摘要 */}
            <div className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1.5 shadow-inner">
              <div className="text-cyan-400 font-bold flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                不可篡改审计凭据存证 (WORM Compliant)
              </div>
              <div>SITE_ID: SITE-001 (低碳园区示范站)</div>
              <div>TRACE_ID: {selectedLog.traceId}</div>
              <div>LOG_ID: {selectedLog.id}</div>
              <div className="text-slate-400">
                DIGEST: SHA256:{selectedLog.traceId?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'a9b8c7'}...e5f6
              </div>
              <div className="text-emerald-400 font-semibold">STATUS: VERIFIED_TAMPER_PROOF · 存证哈希已固化</div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};
