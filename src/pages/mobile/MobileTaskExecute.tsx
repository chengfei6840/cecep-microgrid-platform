import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/AppContext';
import {
  ArrowLeft,
  Camera,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Wifi,
  WifiOff,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const MobileTaskExecute: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patrolTasks, executePatrolTask, scenario } = useAppStore();

  const task = patrolTasks.find((t) => t.id === id) || patrolTasks[0];

  const fallbackItems = [
    {
      id: 'CI-01',
      itemName: '时代星云 500kW PCS 变流柜主断路器状态检查',
      method: '目视与就地仪表核验',
      standard: '断路器闭合状态正常，就地指示灯常绿，无焦糊异味',
      result: 'NORMAL' as const,
    },
    {
      id: 'CI-02',
      itemName: 'EMS 现场前置工控机 RS485/以太网通信接头',
      method: '线缆拔插紧固与指示灯核查',
      standard: 'RJ45 与端子排连接牢固，TX/RX 闪烁节拍与轮询一致',
      result: scenario === 'SCENARIO_B' ? ('ANOMALY' as const) : ('NORMAL' as const),
    },
    {
      id: 'CI-03',
      itemName: 'CATL 储能电池集装箱空调与热管理管路温差',
      method: '红外测温枪实测',
      standard: '进回风温差在 3~5℃ 范围内，冷却水泵运行无异常震动',
      result: 'NORMAL' as const,
    },
    {
      id: 'CI-04',
      itemName: '1#、2# 屋顶光伏组串逆变器交流并网箱防雷开关',
      method: '防雷器视窗检查',
      standard: '防雷视窗呈绿色，接地扁铁阻抗 < 4Ω',
      result: 'NORMAL' as const,
    },
  ];

  const items = task?.checkItems && task.checkItems.length > 0 ? task.checkItems : fallbackItems;

  const [checkedItems, setCheckedItems] = useState<Record<string, 'NORMAL' | 'ANOMALY'>>(
    () => {
      const init: Record<string, 'NORMAL' | 'ANOMALY'> = {};
      items.forEach((ci) => {
        init[ci.id] = ci.result;
      });
      return init;
    }
  );

  const [isOfflineSim, setIsOfflineSim] = useState(task?.isOffline ?? false);
  const [remark, setRemark] = useState('现场核查 EMS 通信线缆已重新插拔紧固，网关指示灯恢复常绿，就地测试 Modbus 报文握手通过。');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMockPhoto, setHasMockPhoto] = useState(true);

  if (!task) {
    return <div className="p-4 text-center text-xs text-slate-500">未找到对应巡检任务</div>;
  }

  const handleToggleItem = (itemId: string, status: 'NORMAL' | 'ANOMALY') => {
    setCheckedItems((prev) => ({ ...prev, [itemId]: status }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await executePatrolTask(
      task.id,
      items.map((ci) => ({
        ...ci,
        result: checkedItems[ci.id] || 'NORMAL',
      })),
      remark
    );
    setIsSubmitting(false);
    navigate('/mobile/tasks');
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 顶部返回条 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/mobile/tasks')}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回任务</span>
        </button>
        <button
          onClick={() => setIsOfflineSim(!isOfflineSim)}
          className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
            isOfflineSim
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {isOfflineSim ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
          <span>{isOfflineSim ? '离线作业模式' : '在线同步模式'}</span>
        </button>
      </div>

      {/* 任务基本信息卡片 */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">{task.title}</h2>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
          <span>{task.taskCode}</span>
          <span>·</span>
          <span>示范站 10kV 储能配电间</span>
        </div>

        <div className="mt-3 p-2.5 rounded bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>NFC 签到定位：已核对 (现场误差 &lt; 2m)</span>
          </div>
          <span className="font-bold text-emerald-600">已打卡</span>
        </div>
      </div>

      {/* 现场检查项清单 */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold text-slate-800 px-1">现场点检确认项</div>

        {items.map((item, idx) => (
          <div
            key={item.id}
            className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 leading-snug">
                {idx + 1}. {item.itemName}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono shrink-0">
                {item.method}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              标准要求: {item.standard}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleToggleItem(item.id, 'NORMAL')}
                className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                  checkedItems[item.id] === 'NORMAL'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-1 ring-emerald-300'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>正常</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleItem(item.id, 'ANOMALY')}
                className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                  checkedItems[item.id] === 'ANOMALY'
                    ? 'bg-red-50 text-red-800 border-red-400 ring-1 ring-red-300'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>异常</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 现场拍照与整改说明 */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="text-xs font-bold text-slate-800">现场整改佐证照片</div>

        <div className="flex items-center gap-3">
          <div className="relative w-20 h-20 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 overflow-hidden cursor-pointer hover:bg-slate-200/50">
            {hasMockPhoto ? (
              <div className="w-full h-full bg-slate-800 text-white flex flex-col items-center justify-center p-1 text-[10px] text-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1" />
                <span>已拍摄佐证</span>
              </div>
            ) : (
              <>
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-[10px]">拍照上传</span>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-500 leading-snug">
            支持现场离线拍摄拍照。已记录拍摄时间与水印坐标（10kV配电室机柜A-03）。
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            现场排查与整改结论说明
          </label>
          <textarea
            rows={3}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:border-[#004287] focus:ring-1 focus:ring-[#004287] outline-none"
          />
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || task.status === 'SUBMITTED'}
          className={`w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
            task.status === 'SUBMITTED'
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-[#004287] hover:bg-[#003366] active:scale-[0.99]'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>
            {task.status === 'SUBMITTED'
              ? '该任务已完成提交'
              : isOfflineSim
              ? '离线暂存并待网联同步'
              : '提交现场巡检记录并同步云端'}
          </span>
        </button>
      </div>
    </div>
  );
};
