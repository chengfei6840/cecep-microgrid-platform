import React from 'react';
import { ShieldCheck, AlertCircle, Info, Smartphone } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';
import { useNavigate } from 'react-router-dom';

export const RoleBanner: React.FC = () => {
  const { currentRole, currentUser } = useAppStore();
  const navigate = useNavigate();

  if (currentRole === 'INSPECTOR') {
    return (
      <div
        id="alarm-role-banner-inspector"
        className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in"
      >
        <div className="flex items-start gap-2.5">
          <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
            <Smartphone className="w-4 h-4" />
          </span>
          <div>
            <div className="font-bold text-amber-900 flex items-center gap-2">
              <span>当前身份：{currentUser.name} (现场巡检员)</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 text-[10px]">
                Web 端只读
              </span>
            </div>
            <p className="text-amber-700 text-[11px] mt-0.5">
              巡检员在 Web 端为只读视图，无法直接在浏览器端接单或修改告警状态。请前往移动端【巡检任务中心】处理现场工单。
            </p>
          </div>
        </div>
        <button
          id="btn-goto-patrol-mobile"
          onClick={() => navigate('/mobile/patrol')}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-xs"
        >
          前往移动端巡检任务中心
        </button>
      </div>
    );
  }

  if (currentRole === 'ADMIN') {
    return (
      <div
        id="alarm-role-banner-admin"
        className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
      >
        <div className="flex items-start gap-2.5">
          <span className="p-1.5 rounded-lg bg-sky-100 text-sky-800 shrink-0">
            <AlertCircle className="w-4 h-4" />
          </span>
          <div>
            <div className="font-bold text-sky-900 flex items-center gap-2">
              <span>当前身份：{currentUser.name} (系统管理员)</span>
              <span className="px-1.5 py-0.5 rounded bg-sky-200 text-sky-800 text-[10px]">
                接口类处置权限
              </span>
            </div>
            <p className="text-sky-700 text-[11px] mt-0.5">
              系统管理员仅负责处置【接口服务】类通信及平台健康告警；物理设备、数据质量与负荷阈值告警属于业务层，请由运营人员审核派发。
            </p>
          </div>
        </div>
        <span className="text-[11px] text-sky-600 shrink-0 font-medium">
          如需处置设备或阈值告警，可于顶部切换为【运营人员】
        </span>
      </div>
    );
  }

  return (
    <div
      id="alarm-role-banner-operator"
      className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
    >
      <div className="flex items-start gap-2.5">
        <span className="p-1.5 rounded-lg bg-blue-100 text-[#004287] shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </span>
        <div>
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <span>当前身份：{currentUser.name} (运营人员)</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-medium">
              全权处置中控
            </span>
          </div>
          <p className="text-slate-600 text-[11px] mt-0.5">
            运营人员拥有完整告警处置权限：可执行人工接单确认、填写不可篡改理由判定误报/忽略、派发专项巡检任务或整改工单。
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0 font-mono">
        <span>SLA 规则：紧急确认≤15m / 处置≤30m · 一般确认≤30m / 处置≤2h</span>
      </div>
    </div>
  );
};
