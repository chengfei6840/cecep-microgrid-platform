import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { DetailDrawer } from '../components/common/DetailDrawer';
import {
  Database,
  RefreshCw,
  Server,
  KeyRound,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  Activity,
  Play,
  RotateCcw,
} from 'lucide-react';

export const DataIntegrations: React.FC = () => {
  const { adapters, verifyAdapter, syncAdapter, scenario, currentRole, devices, points, alarms } = useAppStore();

  const isAdmin = currentRole === 'ADMIN';
  const isOperator = currentRole === 'OPERATOR';
  const isInspector = currentRole === 'INSPECTOR';

  const [selectedAdapterId, setSelectedAdapterId] = useState<string | null>(null);
  const [activeSubView, setActiveSubView] = useState<'LOGS' | 'MAPPING'>('LOGS');
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [traceIdBanner, setTraceIdBanner] = useState<string | null>(null);

  // Exponential backoff demo state for Scenario B Energy Storage
  const [backoffSeconds, setBackoffSeconds] = useState<number>(32);
  const [isBackoffRunning, setIsBackoffRunning] = useState<boolean>(scenario === 'SCENARIO_B');

  useEffect(() => {
    if (scenario === 'SCENARIO_B') {
      setIsBackoffRunning(true);
      setBackoffSeconds(32);
    } else {
      setIsBackoffRunning(false);
    }
  }, [scenario]);

  useEffect(() => {
    let timer: any;
    if (isBackoffRunning && backoffSeconds > 0) {
      timer = setInterval(() => {
        setBackoffSeconds((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBackoffRunning, backoffSeconds]);

  const selectedAdapter = adapters.find((a) => a.id === selectedAdapterId);

  // Associated devices and points for selected adapter
  const associatedDevices = devices.filter((d) => {
    if (!selectedAdapter) return false;
    if (selectedAdapter.type === 'PV_INVERTER') return d.type.includes('INVERTER') || d.type.includes('PV');
    if (selectedAdapter.type === 'STORAGE_EMS') return d.type.includes('PCS') || d.type.includes('BATTERY') || d.type.includes('STORAGE');
    if (selectedAdapter.type === 'CHARGING_PLATFORM') return d.type.includes('CHARGER');
    if (selectedAdapter.type === 'GRID_METER') return d.type.includes('METER');
    return true;
  });

  const associatedPoints = points.filter((p) => associatedDevices.some((d) => d.id === p.deviceId));

  const handleReverify = async (adapterId: string) => {
    if (!isAdmin) {
      setActionMessage('权限不足：只有【系统管理员】可执行协议握手与连接验证。');
      setTimeout(() => setActionMessage(null), 4000);
      return;
    }
    setIsVerifying(adapterId);
    const res = await verifyAdapter(adapterId);
    setIsVerifying(null);
    setActionMessage(res.message);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleSync = async (adapterId: string) => {
    if (!isAdmin) {
      setActionMessage('权限不足：只有【系统管理员】可执行主动同步与下发。');
      setTimeout(() => setActionMessage(null), 4000);
      return;
    }
    setIsSyncing(adapterId);
    const res = await syncAdapter(adapterId);
    setIsSyncing(null);
    setActionMessage(res.message);
    if (res.traceId) setTraceIdBanner(res.traceId);
    setTimeout(() => setActionMessage(null), 5000);
  };

  if (isInspector) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-8 rounded-2xl text-center space-y-3">
        <Lock className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">访问受限 (Access Denied)</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          当前登录角色为【巡检员】，无权访问第三方数据接入与通信适配管理模块。请切换至系统管理员或运营人员角色。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部卡片 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-50 text-[#004287]">
              <Database className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              第三方数据接入与通信适配管理
            </h1>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            示范站微电网直连阳光 iSolarCloud、储能 EMS、星星充电、电表系统与气象环境仪 5 类异构数据源。严格遵循统一同步任务队列、指数退避重试与审计追溯。
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isOperator && (
            <span className="text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" />
              运营只读模式
            </span>
          )}
          <span className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200 font-mono">
            已接入 5 / 5 类数据源
          </span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span className="font-semibold">{actionMessage}</span>
          {traceIdBanner && (
            <span className="ml-auto font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800">
              TraceID: {traceIdBanner}
            </span>
          )}
        </div>
      )}

      {/* 场景 B 指数退避提示横幅 */}
      {scenario === 'SCENARIO_B' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500 text-white animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-amber-900">【场景 B 告警】储能 EMS 接口连续三次心跳超时</div>
              <p className="text-amber-700 mt-0.5">
                当前触发指数退避重试机制 (Backoff Progression: 1s → 2s → 4s → 8s → 16s → <strong className="font-mono underline">32s</strong>)。倒计时结束后将标记接口离线并自动派发工单。
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono font-bold text-amber-900 text-sm">
              重试倒计时: {backoffSeconds}s
            </span>
            <button
              onClick={() => setBackoffSeconds(0)}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-xs"
            >
              立即重试触发
            </button>
          </div>
        </div>
      )}

      {/* 5 类适配器列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {adapters.map((adapter) => {
          const isError = adapter.status === 'RETRYING' || adapter.status === 'FAILED';
          const devCount = devices.filter((d) => {
            if (adapter.type === 'PV_INVERTER') return d.type.includes('INVERTER') || d.type.includes('PV');
            if (adapter.type === 'STORAGE_EMS') return d.type.includes('PCS') || d.type.includes('BATTERY') || d.type.includes('STORAGE');
            if (adapter.type === 'CHARGING_PLATFORM') return d.type.includes('CHARGER');
            if (adapter.type === 'GRID_METER') return d.type.includes('METER');
            return true;
          }).length;

          return (
            <div
              key={adapter.id}
              className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                isError ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug flex items-center gap-1.5">
                      <span>{adapter.platformName}</span>
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {adapter.id} · {adapter.type}
                    </div>
                  </div>
                  <StatusBadge status={adapter.status} size="sm" />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 font-mono">
                    <span className="text-slate-500">模拟鉴权方式：</span>
                    <span className="font-semibold text-slate-800">{adapter.authType || 'OAuth2 Bearer'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 font-mono">
                    <span className="text-slate-500">同步方式：</span>
                    <span className="font-semibold text-slate-800">{adapter.syncMode || '定时轮询 (10s)'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 font-mono">
                    <span className="text-slate-500">最近成功时间：</span>
                    <span className="text-slate-700 truncate max-w-[140px]">{adapter.lastSyncTime}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 font-mono">
                    <span className="text-slate-500">连续失败次数：</span>
                    <span className={`font-bold ${adapter.consecutiveFailures > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {adapter.consecutiveFailures} 次
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 font-mono">
                    <span className="text-slate-500">关联设备/点位：</span>
                    <span className="text-blue-700 font-semibold">{devCount} 台 / {devCount * 8} 个点位</span>
                  </div>
                </div>

                {adapter.errorMessage && (
                  <div className="mt-3 p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-800">
                    <div className="font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span>接口异常/指数退避中</span>
                    </div>
                    <div className="text-[11px] text-red-700 mt-1 font-mono">
                      {adapter.errorMessage}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedAdapterId(adapter.id);
                      setActiveSubView('LOGS');
                    }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    查看日志
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => {
                      setSelectedAdapterId(adapter.id);
                      setActiveSubView('MAPPING');
                    }}
                    className="text-slate-700 hover:underline font-medium"
                  >
                    查看映射
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {isAdmin && (
                    <button
                      onClick={() => handleSync(adapter.id)}
                      disabled={isSyncing === adapter.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#004287] font-medium transition-colors"
                      title="发起主动同步"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncing === adapter.id ? 'animate-spin' : ''}`} />
                      <span>同步</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleReverify(adapter.id)}
                    disabled={isVerifying === adapter.id || !isAdmin}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors disabled:opacity-50"
                    title="验证模拟连接"
                  >
                    <Zap className={`w-3 h-3 ${isVerifying === adapter.id ? 'animate-spin text-amber-600' : 'text-amber-500'}`} />
                    <span>验证</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 适配器详情与日志/映射抽屉 */}
      <DetailDrawer
        isOpen={Boolean(selectedAdapterId)}
        onClose={() => setSelectedAdapterId(null)}
        title={selectedAdapter?.platformName || '适配器详情与链路观测'}
        subTitle={`ID: ${selectedAdapter?.id} · 协议: ${selectedAdapter?.protocol}`}
      >
        {selectedAdapter && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveSubView('LOGS')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeSubView === 'LOGS' ? 'bg-[#004287] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                通信报文与日志
              </button>
              <button
                onClick={() => setActiveSubView('MAPPING')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeSubView === 'MAPPING' ? 'bg-[#004287] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                点位映射表 ({associatedPoints.length})
              </button>
            </div>

            {activeSubView === 'LOGS' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 font-mono text-[11px]">
                  <div className="text-slate-600">服务端点: {selectedAdapter.endpoint}</div>
                  <div className="text-slate-600">鉴权密钥 (脱敏): {selectedAdapter.credentialsMasked}</div>
                  <div className="text-slate-600">心跳频率: 每 {selectedAdapter.syncFrequencySec || 10} 秒</div>
                </div>

                <div>
                  <span className="font-bold text-slate-900 block mb-1">
                    实时通信抓包与底层交互日志 (TraceID 追溯)
                  </span>
                  <div className="bg-slate-950 text-slate-200 p-3 rounded-lg font-mono text-[11px] space-y-1.5 overflow-x-auto">
                    <div className="text-emerald-400">
                      [{selectedAdapter.lastSyncTime}] INFO Handshake OK via {selectedAdapter.protocol} [Auth: {selectedAdapter.authType}]
                    </div>
                    <div>[{selectedAdapter.lastSyncTime}] TX &gt; POLLING FUNCTION CODE 0x03 [REG START 40001 LEN 32]</div>
                    {selectedAdapter.status === 'RETRYING' || selectedAdapter.status === 'FAILED' ? (
                      <>
                        <div className="text-amber-400">
                          [{selectedAdapter.lastSyncTime}] WARN ACK TIMEOUT after 3000ms. Exponential backoff active ({backoffSeconds}s)...
                        </div>
                        <div className="text-red-400 font-bold">
                          [{selectedAdapter.lastSyncTime}] ERROR Connection refused / Gateway timeout (Consecutive Failures: {selectedAdapter.consecutiveFailures})
                        </div>
                      </>
                    ) : (
                      <div className="text-cyan-300">
                        [{selectedAdapter.lastSyncTime}] RX &lt; PAYLOAD OK (64 BYTES, CRC16: 0x4A2B VALID)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSubView === 'MAPPING' && (
              <div className="space-y-3">
                <p className="text-slate-600">
                  当前适配器绑定的物理设备与标准测点映射关系（未映射测点无法参与实时监测与收益核算）：
                </p>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">标准编码</th>
                        <th className="py-2 px-3">业务测点名称</th>
                        <th className="py-2 px-3">第三方字段</th>
                        <th className="py-2 px-3">映射状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {associatedPoints.length > 0 ? (
                        associatedPoints.map((pt) => (
                          <tr key={pt.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono text-blue-700 font-semibold">{pt.standardCode}</td>
                            <td className="py-2 px-3 font-medium text-slate-900">{pt.pointName}</td>
                            <td className="py-2 px-3 font-mono text-slate-500">{pt.thirdPartyField}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                                {pt.mappingStatus || 'MAPPED'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400">
                            暂无直接关联测点，或适配器处于虚拟网关转发模式。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};
