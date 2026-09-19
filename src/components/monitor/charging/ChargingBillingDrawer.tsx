import React from 'react';
import { ChargingOrder } from '../../../types/charging';
import {
  X,
  Receipt,
  FileText,
  Clock,
  Car,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChargingBillingDrawerProps {
  order: ChargingOrder | null;
  isOpen: boolean;
  onClose: () => void;
  referencedTariffVersion: string;
}

export const ChargingBillingDrawer: React.FC<ChargingBillingDrawerProps> = ({
  order,
  isOpen,
  onClose,
  referencedTariffVersion,
}) => {
  if (!isOpen || !order) return null;

  const isCompleted = order.integrityStatus === 'COMPLETED';
  const isPending = order.integrityStatus === 'PENDING_SYNC';
  const isMissing = order.integrityStatus === 'FIELD_MISSING';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* 抽屉头部 */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono text-slate-900">{order.orderId}</h2>
                {isCompleted && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    已完整结算
                  </span>
                )}
                {isPending && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    待完整同步 (仅计估算)
                  </span>
                )}
                {isMissing && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    字段缺失挂起
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">充电计量流水及分时电费拆解报告</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 抽屉内容 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* T+1 口径与结算归档状态横幅说明 */}
          {isPending ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>【T+1 前未完整拉取说明】</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                本笔订单当前处于第三方云端运营平台中继流水预同步阶段，尚未完成 T+1 跨机构批量关口清分及日终财务回执校验。
              </p>
              <div className="bg-amber-100/60 p-2.5 rounded-lg text-xs font-medium text-amber-900 border border-amber-200">
                ⚠️ <strong>财务记账与收益原则：</strong>
                本订单金额（¥{order.totalAmount.toFixed(2)}）仅纳入【今日实时收益估算池】，
                <strong>严禁计入正式财务结算收益</strong>。待次日 00:30 完成 T+1 批量对账归档后方可转为正式结算。
              </div>
            </div>
          ) : isCompleted ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">已完整核验结算：</span>
                <span className="text-emerald-800 ml-1">
                  本订单已通过关口规约校验与 T+1 归档对账，全额 ¥{order.totalAmount.toFixed(2)} 已如实计入微电网中心结算收益。
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">关键字段缺失预警：</span>
                <span className="text-red-800 ml-1">
                  本订单在同步过程中缺失关键计量特征或车辆标识，已被清分系统自动挂起，不计入任何收益。
                </span>
              </div>
            </div>
          )}

          {/* 订单基础工况 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>充电作业基本信息</span>
              <span className="font-mono text-slate-400 font-normal">来源: {order.dataSourceLabel}</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">车牌号码</span>
                <span className="font-bold text-slate-800 font-mono text-sm">{order.plateNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">车型与掩码 VIN</span>
                <span className="text-slate-700 font-medium">{order.vehicleModel}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">充电桩与枪口</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {order.pileCode} (枪口 {order.gunCode})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">充电时长</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {order.durationMinutes} 分钟
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-500">
                  起止时间: {order.startTime} ~ {order.endTime}
                </span>
                <span className="font-bold text-slate-900">
                  累计用电: {order.totalEnergyKwh.toFixed(2)} kWh
                </span>
              </div>
            </div>
          </div>

          {/* 电价版本引用凭证 */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <div>
                <div className="font-semibold text-slate-800">
                  计费标准版本：
                  <span className="font-mono text-amber-800 font-bold ml-1">
                    {referencedTariffVersion}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  示范站微电网分时计费规则 · 充电服务费 {order.serviceFeeUnitPrice} 元/kWh
                </div>
              </div>
            </div>

            <Link
              to="/tariffs"
              className="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <span>查看电价方案</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* 计费拆解详情：基础电费分时细目 */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>1. 基础电费分时计量拆解 (按 currentTariffVersion 结算)</span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-800">
                小计: ¥{order.baseEnergyFee.toFixed(2)}
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">时段性质</th>
                  <th className="py-2.5 px-3">时段区间</th>
                  <th className="py-2.5 px-3 text-right">执行单价</th>
                  <th className="py-2.5 px-3 text-right">计费电量</th>
                  <th className="py-2.5 px-3 text-right">分段电费</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {order.timeSlotBreakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          item.slotLabel === '尖峰'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : item.slotLabel === '高峰'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : item.slotLabel === '平段'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {item.slotLabel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px] font-sans">
                      {item.period}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      ¥{item.unitPrice.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {item.energyKwh.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">kWh</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      ¥{item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 计费拆解详情：服务费 */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-slate-900">2. 充电服务费核算</div>
              <div className="text-slate-500 text-[11px] mt-0.5 font-mono">
                {order.totalEnergyKwh.toFixed(2)} kWh × {order.serviceFeeUnitPrice.toFixed(2)} 元/kWh
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs text-slate-400 mr-1">服务费小计:</span>
              <span className="font-bold text-slate-900 text-sm">
                ¥{order.serviceFeeAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* 订单应付总额核算 */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between shadow-md">
            <div>
              <div className="text-xs text-slate-300">订单核算应付总额</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                基础电费 (¥{order.baseEnergyFee.toFixed(2)}) + 服务费 (¥{order.serviceFeeAmount.toFixed(2)})
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-amber-400">
                ¥{order.totalAmount.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">
                {isCompleted ? '已完成清分归档' : '估算金额 · T+1归档对账中'}
              </div>
            </div>
          </div>

          {/* 安全合规声明 */}
          <div className="text-[11px] text-slate-400 text-center leading-relaxed">
            免责与合规声明：本系统为微电网运营与电费核算监测平台，不创建商业支付账户与支付能力，所有金额仅供计费复核与成本归集。
          </div>
        </div>

        {/* 抽屉底部 */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            完成查看
          </button>
        </div>
      </div>
    </div>
  );
};
