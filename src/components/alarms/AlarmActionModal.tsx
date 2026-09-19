import React, { useState, useEffect } from 'react';
import {
  X,
  AlertOctagon,
  CheckCircle2,
  FileCheck,
  Ban,
  ClipboardList,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import { Alarm } from '../../types/domain';
import { useAppStore } from '../../store/AppContext';

export type AlarmActionMode =
  | 'ACK'
  | 'IGNORE'
  | 'FALSE_ALARM'
  | 'CONVERT_TO_PATROL'
  | 'CONVERT_TO_WORK_ORDER'
  | 'RESOLVE_CLOSE';

interface AlarmActionModalProps {
  isOpen: boolean;
  mode: AlarmActionMode;
  alarm: Alarm | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const AlarmActionModal: React.FC<AlarmActionModalProps> = ({
  isOpen,
  mode,
  alarm,
  onClose,
  onSuccess,
}) => {
  const {
    ackAlarm,
    ignoreAlarm,
    closeAlarm,
    createPatrolTaskFromAlarm,
    createWorkOrderFromAlarm,
    currentRole,
  } = useAppStore();

  const [reason, setReason] = useState('');
  const [assignee, setAssignee] = useState('林志强 (巡检员)');
  const [deadline, setDeadline] = useState('');
  const [details, setDetails] = useState('');
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (alarm) {
      setReason('');
      setErrorMessage(null);
      setAssignee('林志强 (巡检员)');
      setPriority(alarm.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH');

      if (mode === 'CONVERT_TO_PATROL') {
        const d = new Date(Date.now() + 2 * 3600 * 1000);
        setDeadline(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
            d.getDate()
          ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
            d.getMinutes()
          ).padStart(2, '0')}`
        );
        setDetails(`针对 [${alarm.deviceName}] 进行现场接线与通信接口专项核查`);
      } else if (mode === 'CONVERT_TO_WORK_ORDER') {
        const d = new Date(Date.now() + 4 * 3600 * 1000);
        setDeadline(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
            d.getDate()
          ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
            d.getMinutes()
          ).padStart(2, '0')}`
        );
        setDetails(alarm.agentSuggestion || '现场排查异常并更换备件，测试连通性恢复正常。');
      } else if (mode === 'RESOLVE_CLOSE') {
        setDetails('现场排查已完成，设备指标恢复基线正常，通过遥测复核。');
      }
    }
  }, [isOpen, mode, alarm]);

  if (!isOpen || !alarm) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'ACK') {
        const res = await ackAlarm(alarm.id, reason || '运营人员已在限时内接单响应');
        if (!res.success) {
          setErrorMessage(res.message);
          setIsSubmitting(false);
          return;
        }
        onSuccess(res.message);
        onClose();
      } else if (mode === 'IGNORE') {
        if (!reason.trim()) {
          setErrorMessage('【业务门禁】：人工忽略告警必须填写审计原因，不可为空！');
          setIsSubmitting(false);
          return;
        }
        const res = await ignoreAlarm(alarm.id, 'IGNORED', reason);
        if (!res.success) {
          setErrorMessage(res.message);
          setIsSubmitting(false);
          return;
        }
        onSuccess(res.message);
        onClose();
      } else if (mode === 'FALSE_ALARM') {
        if (!reason.trim()) {
          setErrorMessage('【业务门禁】：标记误报必须详细填写误报判据与核实依据，不可为空！');
          setIsSubmitting(false);
          return;
        }
        const res = await ignoreAlarm(alarm.id, 'FALSE_ALARM', reason);
        if (!res.success) {
          setErrorMessage(res.message);
          setIsSubmitting(false);
          return;
        }
        onSuccess(res.message);
        onClose();
      } else if (mode === 'CONVERT_TO_PATROL') {
        const res = await createPatrolTaskFromAlarm(alarm.id, assignee, deadline, details);
        if (!res.success) {
          setErrorMessage(res.message);
          setIsSubmitting(false);
          return;
        }
        onSuccess(res.message);
        onClose();
      } else if (mode === 'CONVERT_TO_WORK_ORDER') {
        const res = await createWorkOrderFromAlarm(alarm.id, assignee, deadline, details);
        if (!res.success) {
          setErrorMessage(res.message);
          setIsSubmitting(false);
          return;
        }
        onSuccess(res.message);
        onClose();
      } else if (mode === 'RESOLVE_CLOSE') {
        if (!details.trim()) {
          setErrorMessage('请填写现场处置闭环结果说明！');
          setIsSubmitting(false);
          return;
        }
        const res = await closeAlarm(alarm.id, details);
        if (!res.success) {
          setErrorMessage(res.message);
          setIsSubmitting(false);
          return;
        }
        onSuccess(res.message);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitleInfo = () => {
    switch (mode) {
      case 'ACK':
        return {
          title: '接单确认告警',
          desc: '确认后告警将由【待确认】流转至【处理中】，SLA 计时器转入处置时限考核。',
          icon: CheckCircle2,
          btnText: '确认接单',
          btnColor: 'bg-[#004287] hover:bg-[#003366] text-white',
        };
      case 'IGNORE':
        return {
          title: '人工忽略告警',
          desc: '忽略操作将计入系统不可篡改审计日志，且【必须填写审计理由】。',
          icon: Ban,
          btnText: '确认忽略',
          btnColor: 'bg-slate-700 hover:bg-slate-800 text-white',
        };
      case 'FALSE_ALARM':
        return {
          title: '判定并标记为误报',
          desc: '标记为误报将免除后续处置闭环要求，【必须填写误报核实证据与理由】。',
          icon: AlertOctagon,
          btnText: '标记为误报',
          btnColor: 'bg-purple-600 hover:bg-purple-700 text-white',
        };
      case 'CONVERT_TO_PATROL':
        return {
          title: '转派现场专项巡检任务',
          desc: '生成现场巡检任务 (PatrolTask)，告警自动进入【处理中】并关联任务编号，不得直接关闭。',
          icon: ClipboardList,
          btnText: '生成巡检任务并流转',
          btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
      case 'CONVERT_TO_WORK_ORDER':
        return {
          title: '转派现场整改工单',
          desc: '生成闭环整改工单 (WorkOrder)，指派现场责任人整改，告警进入【处理中】。',
          icon: Wrench,
          btnText: '生成整改工单并派发',
          btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        };
      case 'RESOLVE_CLOSE':
        return {
          title: '办结归档告警',
          desc: '现场整改或排查完成，确认遥测恢复正常后，将告警状态变更为【已关闭】并归档。',
          icon: FileCheck,
          btnText: '确认闭环归档',
          btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        };
    }
  };

  const config = getTitleInfo();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        id="modal-alarm-action"
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95"
      >
        {/* 对话框头部 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-50 text-[#004287]">
              <Icon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{config.title}</h2>
              <p className="text-[11px] text-slate-500 font-mono">
                告警: {alarm.alarmCode || alarm.id} · 设备: {alarm.deviceName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 提示条 */}
        <div className="px-6 py-2.5 bg-blue-50/50 border-b border-blue-100/50 text-[11px] text-blue-900 leading-relaxed">
          {config.desc}
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 告警基础摘要 */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-slate-600 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">告警现象：</span>
              <span className="font-semibold text-slate-800">{alarm.alarmTitle}</span>
            </div>
            {alarm.traceId && (
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">追踪 TraceId：</span>
                <span className="text-[#004287] bg-blue-50 px-1 rounded">{alarm.traceId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">首次发生时间：</span>
              <span className="font-mono">{alarm.firstOccurrenceTime}</span>
            </div>
          </div>

          {/* 1. 确认模式：简要备注 */}
          {mode === 'ACK' && (
            <div>
              <label className="block text-slate-700 font-medium mb-1.5">
                接单响应备注 (可选)：
              </label>
              <textarea
                id="input-ack-note"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="例如：已电话通知现场巡检员林志强前往配电舱核实..."
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-[#004287] focus:outline-none"
              />
            </div>
          )}

          {/* 2. 忽略与误报模式：强制理由 (必填) */}
          {(mode === 'IGNORE' || mode === 'FALSE_ALARM') && (
            <div>
              <label className="block text-slate-900 font-bold mb-1.5">
                {mode === 'FALSE_ALARM' ? '误报判定证据与理由' : '人工忽略审计理由'}{' '}
                <span className="text-red-500">* (必填，不可篡改审计)</span>
              </label>
              <textarea
                id="input-ignore-reason"
                rows={4}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  mode === 'FALSE_ALARM'
                    ? '例如：经与特来电后台工程师核实，因桩端网关例行在线 OTA 升级导致短暂握手重试，设备电气测量回路完全正常，判定为误报。'
                    : '例如：第三方云服务机房实施例行维护，已提前出具维护通知，此告警为预期内波动，予以忽略并归档。'
                }
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-[#004287] focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                业务门禁约束：忽略或误报操作将关联操作人写入审计时间线，若理由为空则禁止提交。
              </p>
            </div>
          )}

          {/* 3. 转巡检任务模式 */}
          {mode === 'CONVERT_TO_PATROL' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  指派巡检员：
                </label>
                <select
                  id="select-patrol-assignee"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  <option value="林志强 (巡检员)">林志强 (巡检员 - 现场常驻)</option>
                  <option value="陈建明 (值班员)">陈建明 (值班员)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  要求完成时间：
                </label>
                <input
                  id="input-patrol-deadline"
                  type="text"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  专项巡检核查要求：
                </label>
                <textarea
                  id="input-patrol-details"
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>
            </div>
          )}

          {/* 4. 转整改工单模式 */}
          {mode === 'CONVERT_TO_WORK_ORDER' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    工单优先级：
                  </label>
                  <select
                    id="select-order-priority"
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white font-medium"
                  >
                    <option value="CRITICAL">紧急 (CRITICAL)</option>
                    <option value="HIGH">高 (HIGH)</option>
                    <option value="MEDIUM">中 (MEDIUM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    指定整改责任人：
                  </label>
                  <select
                    id="select-order-assignee"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                  >
                    <option value="林志强 (巡检员)">林志强 (巡检员)</option>
                    <option value="王工 (储能厂家技术支持)">王工 (储能厂家技术支持)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  工单截止时间：
                </label>
                <input
                  id="input-order-deadline"
                  type="text"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  现场整改技术方案与要求：
                </label>
                <textarea
                  id="input-order-requirements"
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>
            </div>
          )}

          {/* 5. 办结归档模式 */}
          {mode === 'RESOLVE_CLOSE' && (
            <div>
              <label className="block text-slate-900 font-medium mb-1.5">
                现场整改闭环与复核说明：
              </label>
              <textarea
                id="input-close-note"
                rows={4}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="例如：林志强已现场更换损坏的工业网络交换机电源，Modbus 通信已稳定连续恢复 15 分钟，遥测质量指标全部标绿恢复。"
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-[#004287] focus:outline-none"
              />
            </div>
          )}

          {/* 底部按钮 */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              id="btn-modal-cancel"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors"
            >
              取消
            </button>
            <button
              id="btn-modal-submit"
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-xs ${config.btnColor} ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? '提交中...' : config.btnText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
