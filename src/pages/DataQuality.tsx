import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { QualityTag } from '../components/common/QualityTag';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  ShieldCheck,
  RefreshCw,
  FileInput,
  AlertCircle,
  AlertOctagon,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  FileText,
  Lock,
  Upload,
  XCircle,
  Check,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

export const DataQuality: React.FC = () => {
  const { points, qualityIssues, resolveQualityIssue, revenueSnapshots, currentRole, addAuditLog } = useAppStore();

  const isAdmin = currentRole === 'ADMIN';
  const isOperator = currentRole === 'OPERATOR';
  const isInspector = currentRole === 'INSPECTOR';

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: async () => {},
  });

  const [feedback, setFeedback] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>(
    'standardCode,pointName,deviceId,currentValue,unit\nPV_ACTIVE_POWER,光伏总有功,DEV-PV-01,432.8,kW\nESS_SOC_AVG,储能系统SOC,DEV-ESS-02,78.5,%'
  );
  const [importResult, setImportResult] = useState<{ success?: boolean; errors: string[]; parsedCount: number } | null>(null);

  const pendingIssue = qualityIssues.find((q) => q.status === 'PENDING');
  const yesterdayRev = revenueSnapshots.find((r) => r.calcType === 'SETTLEMENT');

  if (isInspector) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-8 rounded-2xl text-center space-y-3">
        <Lock className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">访问受限 (Access Denied)</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          当前登录角色为【巡检员】，无权访问数据质量校验与补采复核中心。
        </p>
      </div>
    );
  }

  const handleSimulateImport = () => {
    const lines = importText.trim().split('\n');
    const errors: string[] = [];
    let count = 0;
    if (lines.length <= 1) {
      setImportResult({ success: false, errors: ['文件内容为空或仅包含表头'], parsedCount: 0 });
      return;
    }

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 5) {
        errors.push(`第 ${i + 1} 行: 字段数量不足（需包含标准编码、名称、设备ID、数值、单位）`);
        continue;
      }
      const [code, name, devId, val, unit] = parts.map((p) => p.trim());
      if (!code) {
        errors.push(`第 ${i + 1} 行 (字段 standardCode): 标准编码不能为空`);
      }
      if (isNaN(Number(val))) {
        errors.push(`第 ${i + 1} 行 (字段 currentValue): 数值 "${val}" 无效，必须为浮点数`);
      }
      count++;
    }

    if (errors.length > 0) {
      setImportResult({ success: false, errors, parsedCount: 0 });
    } else {
      setImportResult({ success: true, errors: [], parsedCount: count });
      addAuditLog({
        targetObject: 'CSV/Excel 手工质量导入',
        action: '解析并预览校验',
        oldState: '待导入',
        newState: `解析成功 ${count} 条记录，等待管理员复核校验`,
        reason: '通过手工文件导入补录时序数据，通过行级错误定位',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部卡片 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-50 text-[#004287]">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              数据质量校验与规程补采复核中心
            </h1>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            对异构时序数据执行完整性、准确性、一致性、及时性、唯一性 5 维校核。质量等级【正常、补录、可疑、异常】直接制约收益核算置信度。
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isOperator && (
            <span className="text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" />
              运营只读模式
            </span>
          )}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowImportModal(true)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>CSV/Excel 手工补录导入</span>
              </button>
            )}
            <span className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-800 font-semibold border border-blue-200 font-mono">
              核算数据置信度: {yesterdayRev ? yesterdayRev.dataConfidencePercent.toFixed(1) : '100.0'}%
            </span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* 5 维质量评分与标准阈值看板 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>数据完整性</span>
            <span className="text-emerald-700 font-bold">&gt; 95% 正常</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-900">99.4 分</div>
          <p className="text-[11px] text-slate-400 mt-1">缺失率达 5% 产生告警，10% 触发补采</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>物理准确性</span>
            <span className="text-emerald-700 font-bold">合规 100%</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-900">99.0 分</div>
          <p className="text-[11px] text-slate-400 mt-1">越限异常标记为【异常】</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>跨源一致性</span>
            <span className="text-amber-700 font-bold">偏差 &lt; 10%</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-900">96.5 分</div>
          <p className="text-[11px] text-slate-400 mt-1">跨源偏差达到 10% 标记【可疑】</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>采集及时性</span>
            <span className="text-emerald-700 font-bold">&lt; 3.0s</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-900">96.8 分</div>
          <p className="text-[11px] text-slate-400 mt-1">微电网边缘实时回传时延</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>记录唯一性</span>
            <span className="text-emerald-700 font-bold">无重复</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-900">100 分</div>
          <p className="text-[11px] text-slate-400 mt-1">时间戳与主键唯一校验</p>
        </div>
      </div>

      {/* 待处置质量缺陷与补采触发区 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">数据质量缺陷事件与补采任务闭环</h2>
          </div>
          <span className="text-xs text-slate-400">共 {qualityIssues.length} 条记录</span>
        </div>

        <div className="space-y-3">
          {qualityIssues.map((issue) => (
            <div
              key={issue.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">
                    {issue.targetDevice} · {issue.dimensionLabel}
                  </span>
                  <QualityTag
                    level={
                      (issue as any).qualityLevel ||
                      (issue.level === 'CRITICAL'
                        ? 'ANOMALY'
                        : issue.level === 'WARN'
                        ? 'SUSPICIOUS'
                        : 'NORMAL')
                    }
                  />
                  <StatusBadge
                    status={
                      issue.status === 'PENDING'
                        ? 'PENDING_APPROVAL'
                        : issue.status === 'RESOLVED'
                        ? 'NORMAL'
                        : 'PROCESSING'
                    }
                    size="sm"
                  />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{issue.description}</p>
                <div className="text-[11px] text-slate-400 font-mono">
                  影响点位: {(issue as any).targetPointKey || issue.targetPoint || '关键遥测'} · 发生时间: {(issue as any).detectedAt || issue.discoveredTime || '近期'}
                </div>
              </div>

              {issue.status === 'PENDING' && isAdmin && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: '启动该断点的规程自动补采？',
                        description:
                          '将向前置通信机发起历史暂存点位请求，回填缺失时段，数据质量将转为【补录】，置信度提升，待管理员校验通过后方可转为可信数据。',
                        action: async () => {
                          const res = await resolveQualityIssue(issue.id, 'AUTO_BACKFILL');
                          setFeedback(res.message);
                          setTimeout(() => setFeedback(null), 4000);
                        },
                      });
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>执行历史补采回填</span>
                  </button>
                </div>
              )}

              {issue.status === 'RESOLVED' && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>已通过补采校验 (可信)</span>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 实时点位质量抽样列表 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3">关键采集点位质量状态与可信过滤</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">点位编号</th>
                <th className="py-2.5 px-3">点位名称</th>
                <th className="py-2.5 px-3">所属设备</th>
                <th className="py-2.5 px-3">当前实时值</th>
                <th className="py-2.5 px-3">质量等级与结算置信</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {points.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80">
                  <td className="py-2 px-3 font-mono text-slate-500">
                    {p.standardCode || (p as any).pointKey || p.id}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{p.pointName}</td>
                  <td className="py-2 px-3 text-slate-600">{p.deviceId}</td>
                  <td className="py-2 px-3 font-mono font-bold text-blue-700">
                    {(p.currentValue ?? (p as any).latestValue ?? '--')} {p.unit}
                  </td>
                  <td className="py-2 px-3">
                    <QualityTag level={p.currentQuality} showDesc />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV / Excel 手工补录导入预览弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">CSV / Excel 手工补录导入预览</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              在此粘贴或编辑 CSV 补录数据格式 (第一行为表头，包含标准编码、名称、设备ID、数值、单位)。系统将执行严格格式校验与行字段错误定位，不直接写入生产数据库。
            </p>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              className="w-full font-mono text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleSimulateImport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                执行文件语法与范围校验
              </button>

              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                关闭
              </button>
            </div>

            {importResult && (
              <div
                className={`p-3 rounded-lg text-xs space-y-1 ${
                  importResult.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {importResult.success ? (
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>校验通过！成功解析 {importResult.parsedCount} 条时序补录记录，待管理员最终复核。</span>
                  </div>
                ) : (
                  <div>
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>导入校验失败（行级错误定位）：</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-0.5 font-mono text-[11px]">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={async () => {
          await confirmDialog.action();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
