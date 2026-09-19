import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { SlaTimer } from '../components/common/SlaTimer';
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  User,
  Wifi,
  WifiOff,
  Clock,
  Radio,
  Camera,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MobileSimulatorPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    patrolTasks,
    alarms,
    workOrders,
    scenario,
    switchScenario,
    toggleTaskOffline,
    submitPatrolTask,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'TASKS' | 'ALARMS' | 'ORDERS' | 'PROFILE'>('TASKS');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [nfcPunched, setNfcPunched] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const activeTask = patrolTasks.find((t) => t.id === selectedTaskId) || patrolTasks[0];
  const isOffline = activeTask?.isOffline ?? false;

  const handlePunchIn = () => {
    setNfcPunched(true);
    setActionNotice('NFC 打卡校验成功：示范站 10kV 储能预制舱');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleToggleCheck = (itemId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleSubmit = async () => {
    if (!activeTask) return;
    await submitPatrolTask(activeTask.id, {
      tempCelsius: 41.2,
      irPhotoPlaceholder: 'storage_bms_thermal_evidence.jpg',
      conclusion: '现场储能舱通信接口已重新拔插，网线接触恢复良好，测温 41.2℃ 在合理区间',
    });
    setActionNotice('巡检任务已成功提交归档！');
    setTimeout(() => {
      setActionNotice(null);
      setSelectedTaskId(null);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* 头部介绍 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Smartphone className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              微信移动巡检小程序形态模拟器
            </h1>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            模拟一线巡检员（林志强）微信小程序端作业全流程。支持站内 NFC 扫码打卡、离线弱网数据暂存、红外测温填报与佐证拍照、现场整改工单反馈。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/mobile/tasks')}
            className="px-3.5 py-2 bg-[#004287] hover:bg-[#003366] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>全屏独立窗口体验</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">{actionNotice}</span>
        </div>
      )}

      {/* 手机容器 + 业务说明双栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 左侧说明与控制 */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600" />
              <span>现场移动端核心特性说明</span>
            </h2>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-700">1. NFC 物理防作弊：</span>
                <span>必须到达示范站 10kV 储能预制舱贴卡，方可解锁巡视填报。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-700">2. 弱网离线暂存：</span>
                <span>储能集装箱屏蔽严重时自动进入离线模式，现场填写数据本地持久化，出舱后自动同步上云。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-700">3. 闭环工单联动：</span>
                <span>现场完成储能网关通信故障排查后，直接上传测温与整改报告，通知运营人员复核。</span>
              </li>
            </ul>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-500">当前运行场景：</span>
              <button
                onClick={() => switchScenario(scenario === 'SCENARIO_A' ? 'SCENARIO_B' : 'SCENARIO_A')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  scenario === 'SCENARIO_B'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-blue-50 text-[#004287] border border-blue-200'
                }`}
              >
                {scenario === 'SCENARIO_A' ? '切换为场景 B (储能异常)' : '已激活场景 B (储能异常)'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2 text-xs">
            <h3 className="font-bold text-slate-900">当前登录巡检人员</h3>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 font-mono">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold font-sans">
                林
              </div>
              <div>
                <div className="font-bold text-slate-900 font-sans">林志强</div>
                <div className="text-[11px] text-slate-500">示范站专职巡检班长</div>
                <div className="text-[10px] text-emerald-600 font-semibold">微信号: lin_cecep_zz</div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧手机外壳 (390px 独立设计) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-[390px] h-[780px] bg-white rounded-[38px] shadow-2xl border-8 border-slate-800 flex flex-col overflow-hidden relative">
            {/* 顶部听筒微胶囊 */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-30" />

            {/* 小程序顶栏 */}
            <div className="bg-[#00152A] text-white px-4 pt-7 pb-2.5 shrink-0 flex items-center justify-between border-b border-slate-800 z-20">
              <div className="flex items-center gap-1.5">
                <img src="/logo_no.png" alt="CECEP" className="h-4 w-auto object-contain brightness-125" />
                <span className="text-xs font-bold">微电网巡检</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => activeTask && toggleTaskOffline(activeTask.id)}
                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                    isOffline ? 'bg-amber-900/60 text-amber-300' : 'bg-emerald-900/60 text-emerald-300'
                  }`}
                  title="点击切换离线弱网仿真"
                >
                  {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                  <span>{isOffline ? '离线暂存' : '在线同步'}</span>
                </button>
              </div>
            </div>

            {/* 小程序页面内容区 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 text-xs">
              {/* Tab 1: 巡检任务 */}
              {activeTab === 'TASKS' && (
                <>
                  {!selectedTaskId ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">今日现场巡检任务</span>
                        <span className="text-[11px] text-slate-400">共 {patrolTasks.length} 项</span>
                      </div>

                      {patrolTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTaskId(t.id)}
                          className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all cursor-pointer space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{t.taskName}</span>
                            <StatusBadge status={t.status} size="sm" />
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">{t.targetZone}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                            <span>期限: {t.deadlineTime}</span>
                            <span className="text-blue-600 font-semibold">开始点检 →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* 任务执行填报表单 */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setSelectedTaskId(null)}
                          className="text-blue-600 font-medium"
                        >
                          ← 返回任务列表
                        </button>
                        <span className="font-mono text-slate-400 text-[10px]">{activeTask.taskCode}</span>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                        <h3 className="font-bold text-sm text-slate-900">{activeTask.taskName}</h3>
                        <div className="text-[11px] text-slate-500">点检对象: {activeTask.targetZone}</div>

                        {/* NFC 贴卡打卡 */}
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            onClick={handlePunchIn}
                            className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                              nfcPunched
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                : 'bg-[#004287] text-white shadow-xs hover:bg-[#003366]'
                            }`}
                          >
                            <Radio className="w-3.5 h-3.5" />
                            <span>{nfcPunched ? '✓ 站内 NFC 打卡核验已完成' : '现场 NFC 贴卡打卡验证'}</span>
                          </button>
                        </div>
                      </div>

                      {/* 点检检查项勾选 */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                        <span className="font-bold text-slate-800">检查项目逐项确认</span>
                        <div className="space-y-2 pt-1">
                          {activeTask.checklist.map((item) => (
                            <label
                              key={item.id}
                              className="flex items-start gap-2 p-2 rounded bg-slate-50 border border-slate-100 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checkedItems[item.id] ?? item.isChecked}
                                onChange={() => handleToggleCheck(item.id)}
                                className="mt-0.5 rounded text-blue-600"
                              />
                              <div className="text-[11px] leading-snug">
                                <div className="font-semibold text-slate-800">{item.itemTitle}</div>
                                <div className="text-slate-400 font-mono text-[10px]">基准: {item.standard}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 拍照与数据填报 */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                        <span className="font-bold text-slate-800">现场测温与佐证</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 p-2 rounded bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-400 block">红外热成像测温 (°C)</span>
                            <span className="font-mono font-bold text-sm text-slate-800">41.2 ℃ (正常)</span>
                          </div>
                          <div className="w-16 h-12 rounded border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                            <Camera className="w-4 h-4" />
                            <span className="text-[9px]">已附照片</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleSubmit}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        提交巡检整改结果
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Tab 2: 活动告警 */}
              {activeTab === 'ALARMS' && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-800">现场实时告警</div>
                  {alarms.map((a) => (
                    <div key={a.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{a.alarmTitle}</span>
                        <StatusBadge status={a.status} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{a.description}</p>
                      <div className="text-[10px] text-red-600 font-mono">SLA: {a.slaDeadlineTime}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: 整改工单 */}
              {activeTab === 'ORDERS' && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-800">我的整改工单</div>
                  {workOrders.map((wo) => (
                    <div key={wo.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{wo.title}</span>
                        <StatusBadge status={wo.status} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{wo.description}</p>
                      <div className="text-[10px] text-slate-400 font-mono">期限: {wo.deadline}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 4: 个人中心 */}
              {activeTab === 'PROFILE' && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                      林
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">林志强</div>
                      <div className="text-slate-500 text-[11px]">示范站专职巡检员</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600 font-mono">
                    <div>所属站点: SITE-001 (示范站)</div>
                    <div>安全资质: 高压特种作业操作证 (闽)</div>
                    <div>打卡规范: NFC 现场定位防作弊</div>
                  </div>
                </div>
              )}
            </div>

            {/* 小程序底部导航栏 */}
            <div className="h-14 bg-white border-t border-slate-200 px-3 flex items-center justify-around shrink-0 z-20">
              <button
                onClick={() => setActiveTab('TASKS')}
                className={`flex flex-col items-center gap-0.5 text-[10px] ${
                  activeTab === 'TASKS' ? 'text-[#004287] font-bold' : 'text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>巡检任务</span>
              </button>
              <button
                onClick={() => setActiveTab('ALARMS')}
                className={`flex flex-col items-center gap-0.5 text-[10px] ${
                  activeTab === 'ALARMS' ? 'text-[#004287] font-bold' : 'text-slate-400'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>现场告警</span>
              </button>
              <button
                onClick={() => setActiveTab('ORDERS')}
                className={`flex flex-col items-center gap-0.5 text-[10px] ${
                  activeTab === 'ORDERS' ? 'text-[#004287] font-bold' : 'text-slate-400'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>整改工单</span>
              </button>
              <button
                onClick={() => setActiveTab('PROFILE')}
                className={`flex flex-col items-center gap-0.5 text-[10px] ${
                  activeTab === 'PROFILE' ? 'text-[#004287] font-bold' : 'text-slate-400'
                }`}
              >
                <User className="w-4 h-4" />
                <span>我的</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
