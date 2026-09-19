import React, { useState } from 'react';
import { ChargingOrder, ChargingOrderIntegrity } from '../../../types/charging';
import {
  FileText,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Car,
  ChevronRight,
  Info,
  HelpCircle,
  Receipt,
} from 'lucide-react';

interface ChargingOrderTableProps {
  orders: ChargingOrder[];
  onViewBreakdown: (order: ChargingOrder) => void;
  referencedTariffVersion: string;
}

export const ChargingOrderTable: React.FC<ChargingOrderTableProps> = ({
  orders,
  onViewBreakdown,
  referencedTariffVersion,
}) => {
  const [integrityFilter, setIntegrityFilter] = useState<'ALL' | ChargingOrderIntegrity>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const counts = {
    ALL: orders.length,
    COMPLETED: orders.filter((o) => o.integrityStatus === 'COMPLETED').length,
    PENDING_SYNC: orders.filter((o) => o.integrityStatus === 'PENDING_SYNC').length,
    FIELD_MISSING: orders.filter((o) => o.integrityStatus === 'FIELD_MISSING').length,
  };

  const filteredOrders = orders.filter((order) => {
    if (integrityFilter !== 'ALL' && order.integrityStatus !== integrityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = order.orderId.toLowerCase().includes(q);
      const matchPlate = order.plateNumber.toLowerCase().includes(q);
      const matchPile = order.pileCode.toLowerCase().includes(q);
      const matchModel = order.vehicleModel.toLowerCase().includes(q);
      if (!matchId && !matchPlate && !matchPile && !matchModel) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 顶部财务与同步口径严密提醒横幅 */}
      <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">财务结算与订单拉取口径公约：</span>
          <span className="text-amber-800 ml-1">
            计费标准严格引用当前系统核准版本 <strong>{referencedTariffVersion}</strong>。
            对于 <strong>T+1 前未完整拉取</strong> 的订单，系统标识为【待完整同步】，<strong>绝不计入结算收益，仅供运营实时估算参考</strong>；每日 T+1 日终 00:30 完成清分核验并获取正式银行流水凭据后方转入正式结算。
          </span>
        </div>
      </div>

      {/* 过滤筛选条 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            完整性状态:
          </span>

          <button
            onClick={() => setIntegrityFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              integrityFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部订单 ({counts.ALL})
          </button>

          <button
            onClick={() => setIntegrityFilter('COMPLETED')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              integrityFilter === 'COMPLETED'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            已完整结算 ({counts.COMPLETED})
          </button>

          <button
            onClick={() => setIntegrityFilter('PENDING_SYNC')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              integrityFilter === 'PENDING_SYNC'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
            title="T+1 前未完整拉取，只计入预估，不进入结算收益"
          >
            <Clock className="w-3.5 h-3.5" />
            待完整同步 ({counts.PENDING_SYNC})
          </button>

          <button
            onClick={() => setIntegrityFilter('FIELD_MISSING')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              integrityFilter === 'FIELD_MISSING'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            字段缺失预警 ({counts.FIELD_MISSING})
          </button>
        </div>

        {/* 快捷搜索 */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="搜索订单号 / 车牌 / 桩枪 / 车型..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* 订单表格 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">订单编号</th>
                <th className="py-3 px-4">桩枪 / 车辆</th>
                <th className="py-3 px-4">开始 / 结束时间</th>
                <th className="py-3 px-4">充电电量</th>
                <th className="py-3 px-4">时段电价构成</th>
                <th className="py-3 px-4">基础电费</th>
                <th className="py-3 px-4">服务费</th>
                <th className="py-3 px-4">订单金额</th>
                <th className="py-3 px-4">完整性状态</th>
                <th className="py-3 px-4">数据来源</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 text-xs">
                    未检索到符合筛选条件的充电流水订单
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isCompleted = order.integrityStatus === 'COMPLETED';
                  const isPending = order.integrityStatus === 'PENDING_SYNC';
                  const isMissing = order.integrityStatus === 'FIELD_MISSING';

                  return (
                    <tr
                      key={order.orderId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isPending ? 'bg-amber-50/20' : isMissing ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {/* 订单编号 */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {order.orderId}
                      </td>

                      {/* 桩枪 / 车辆 */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                            {order.pileCode} ({order.gunCode})
                          </span>
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              <Car className="w-3 h-3 text-slate-400" />
                              <span>{order.plateNumber}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">{order.vehicleModel}</div>
                          </div>
                        </div>
                      </td>

                      {/* 开始 / 结束时间 */}
                      <td className="py-3 px-4 text-[11px] font-mono text-slate-600">
                        <div>{order.startTime}</div>
                        <div className="text-slate-400">{order.endTime}</div>
                        <div className="text-[10px] text-slate-500">时长: {order.durationMinutes} 分钟</div>
                      </td>

                      {/* 充电电量 */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {order.totalEnergyKwh.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">kWh</span>
                      </td>

                      {/* 时段电价构成 (尖/峰/平/谷) */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[170px]">
                          {order.timeSlotBreakdown.map((item, idx) => (
                            <span
                              key={idx}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                                item.slotLabel === '尖峰'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : item.slotLabel === '高峰'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : item.slotLabel === '平段'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                              title={`${item.period} · ${item.unitPrice}元/kWh · ${item.energyKwh}kWh`}
                            >
                              {item.slotLabel}:{item.unitPrice}元 ({item.energyKwh}度)
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* 基础电费 */}
                      <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                        ¥{order.baseEnergyFee.toFixed(2)}
                      </td>

                      {/* 服务费 */}
                      <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                        ¥{order.serviceFeeAmount.toFixed(2)}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          @{order.serviceFeeUnitPrice}元/度
                        </span>
                      </td>

                      {/* 订单金额 (总金额) */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                        ¥{order.totalAmount.toFixed(2)}
                      </td>

                      {/* 完整性状态 */}
                      <td className="py-3 px-4">
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            已完整结算
                          </span>
                        )}
                        {isPending && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                            title="T+1 前未完整拉取，不计入结算收益，只可进入估算"
                          >
                            <Clock className="w-3 h-3 text-amber-600" />
                            待完整同步 (仅估算)
                          </span>
                        )}
                        {isMissing && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3 h-3" />
                            字段缺失预警
                          </span>
                        )}
                      </td>

                      {/* 数据来源 */}
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        <span className="truncate max-w-[120px] inline-block font-sans" title={order.dataSourceLabel}>
                          {order.dataSourceLabel}
                        </span>
                      </td>

                      {/* 操作 */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onViewBreakdown(order)}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Receipt className="w-3 h-3 text-slate-500" />
                          <span>计费拆解</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 底部汇总说明 */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <span>
              已展示 {filteredOrders.length} / {orders.length} 笔订单（其中已结算 {counts.COMPLETED} 笔，待完整同步 {counts.PENDING_SYNC} 笔）
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span>计费引擎: {referencedTariffVersion}</span>
            <span>·</span>
            <span>无真实支付能力（仅流水核算）</span>
          </div>
        </div>
      </div>
    </div>
  );
};
