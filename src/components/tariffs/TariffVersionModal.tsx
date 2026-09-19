import React, { useState, useMemo } from 'react';
import {
  TariffVersion,
  TariffTimeInterval,
  PvFeedInConfig,
  ChargingTariffConfig,
  BasicFeeConfig,
} from '../../types/domain';
import { validateAllTariffConfigs } from '../../utils/tariffValidation';
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sun,
  Zap,
  Building2,
  FileCheck2,
  Layers,
  RotateCcw,
} from 'lucide-react';

interface TariffVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (versionData: Partial<TariffVersion>) => Promise<void>;
  initialVersion?: TariffVersion | null;
  mode: 'CREATE' | 'EDIT';
}

const DEFAULT_INTERVALS: TariffTimeInterval[] = [
  { id: 'di-1', start: '00:00', end: '06:30', label: '低谷', price: 0.315 },
  { id: 'di-2', start: '06:30', end: '08:30', label: '平段', price: 0.692 },
  { id: 'di-3', start: '08:30', end: '11:30', label: '高峰', price: 1.165 },
  { id: 'di-4', start: '11:30', end: '12:00', label: '平段', price: 0.692 },
  { id: 'di-5', start: '12:00', end: '14:00', label: '深谷', price: 0.205 },
  { id: 'di-6', start: '14:00', end: '14:30', label: '平段', price: 0.692 },
  { id: 'di-7', start: '14:30', end: '19:00', label: '高峰', price: 1.165 },
  { id: 'di-8', start: '19:00', end: '21:00', label: '尖峰', price: 1.488 },
  { id: 'di-9', start: '21:00', end: '23:00', label: '平段', price: 0.692 },
  { id: 'di-10', start: '23:00', end: '24:00', label: '低谷', price: 0.315 },
];

export const TariffVersionModal: React.FC<TariffVersionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialVersion,
  mode,
}) => {
  const [activeTab, setActiveTab] = useState<'TOU' | 'PV' | 'CHARGING' | 'BASIC_FEE'>('TOU');

  const [versionNumber, setVersionNumber] = useState(
    initialVersion?.versionNumber || (mode === 'CREATE' ? 'V3.0' : '')
  );
  const [startDate, setStartDate] = useState(initialVersion?.effectiveDateStart || '2026-10-01');
  const [endDate, setEndDate] = useState(initialVersion?.effectiveDateEnd || '2026-12-31');
  const [notes, setNotes] = useState(
    initialVersion?.notes || '示范站 2026 年度分时及微电网运行调控修订草案'
  );

  const [intervals, setIntervals] = useState<TariffTimeInterval[]>(
    initialVersion?.timeIntervals || DEFAULT_INTERVALS
  );

  const [pvConfig, setPvConfig] = useState<PvFeedInConfig>(
    initialVersion?.pvConfig || {
      mode: 'TIERED',
      tieredConfig: { thresholdKwh: 500000, tier1Price: 0.4150, tier2Price: 0.3800 },
      description: '阶梯电价模式：月累计消纳 ≤500MWh 按 0.4150 元/kWh 结算，超出部分 0.3800 元/kWh',
    }
  );

  const [chargingConfig, setChargingConfig] = useState<ChargingTariffConfig>(
    initialVersion?.chargingConfig || {
      serviceFee: 0.42,
      energyPriceTou: {
        sharp: 1.488,
        peak: 1.165,
        flat: 0.692,
        valley: 0.315,
        deepValley: 0.205,
      },
    }
  );

  const [basicFeeConfig, setBasicFeeConfig] = useState<BasicFeeConfig>(
    initialVersion?.basicFeeConfig || {
      type: 'DEMAND',
      demandUnitPrice: 40.0,
      declaredDemandKw: 1200,
      capacityUnitPrice: 32.0,
      transformerCapacityKva: 2000,
      description: '选用【需量电费】：核定需量 1200 kW × 40.00 元/kW/月 = 48,000 元/月；容量电费停用。',
    }
  );

  const [isSaving, setIsSaving] = useState(false);

  // 运行实时全面校验
  const validationResult = useMemo(() => {
    return validateAllTariffConfigs(intervals, pvConfig, chargingConfig, basicFeeConfig);
  }, [intervals, pvConfig, chargingConfig, basicFeeConfig]);

  if (!isOpen) return null;

  const handleAddInterval = () => {
    const last = intervals[intervals.length - 1];
    const newStart = last ? last.end : '00:00';
    const newEnd = '24:00';
    const newInterval: TariffTimeInterval = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      start: newStart,
      end: newEnd,
      label: '平段',
      price: 0.700,
    };
    setIntervals([...intervals, newInterval]);
  };

  const handleRemoveInterval = (index: number) => {
    setIntervals(intervals.filter((_, i) => i !== index));
  };

  const handleIntervalChange = (index: number, field: keyof TariffTimeInterval, value: any) => {
    setIntervals((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleResetToTemplate = () => {
    setIntervals(DEFAULT_INTERVALS);
  };

  const getSlotColorBadge = (label: string) => {
    switch (label) {
      case '尖峰':
        return 'bg-red-50 text-red-700 border-red-200';
      case '高峰':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case '平段':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case '低谷':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case '深谷':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleSubmit = async () => {
    if (!validationResult.isValid) return;
    setIsSaving(true);
    try {
      // 聚合为 slots 展示格式
      const slotMap: Record<string, { periods: string[]; price: number }> = {};
      intervals.forEach((it) => {
        if (!slotMap[it.label]) {
          slotMap[it.label] = { periods: [], price: it.price };
        }
        slotMap[it.label].periods.push(`${it.start} - ${it.end}`);
      });

      const slots = (['尖峰', '高峰', '平段', '低谷', '深谷'] as const).map((lbl) => {
        const found = slotMap[lbl];
        return {
          label: lbl,
          period: found ? found.periods.join(', ') : '未配置',
          price: found ? found.price : 0,
        };
      });

      const baseFeeStr =
        basicFeeConfig.type === 'CAPACITY'
          ? `容量电费: ${basicFeeConfig.capacityUnitPrice?.toFixed(2)}元/kVA/月`
          : `需量电费: ${basicFeeConfig.demandUnitPrice?.toFixed(2)}元/kW/月`;

      const serviceFeeOrBaseFee = `充电服务费: ${chargingConfig.serviceFee.toFixed(2)}元/kWh | ${baseFeeStr}`;

      await onSave({
        versionNumber,
        effectiveDateStart: startDate,
        effectiveDateEnd: endDate,
        notes,
        slots,
        timeIntervals: intervals,
        serviceFeeOrBaseFee,
        pvConfig,
        chargingConfig,
        basicFeeConfig,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-blue-100 text-[#004287]">
              <FileCheck2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {mode === 'CREATE' ? '编制新电价方案草稿' : `编辑电价方案草稿 (${versionNumber})`}
              </h2>
              <p className="text-xs text-slate-500">
                支持 4 类综合电价配置，需通过 24 小时覆盖校验后提交系统管理员二次授权
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Basic Meta Row */}
        <div className="p-6 pb-3 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">版本标识 (防覆盖唯一号)</label>
            <input
              type="text"
              value={versionNumber}
              onChange={(e) => setVersionNumber(e.target.value)}
              placeholder="如 V3.0"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">计划生效起始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">计划生效截止日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">编制依据 / 政策发文字号</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="输入省发改委文号或调整理由"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Navigation Tabs for 4 Pricing Modules */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('TOU')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'TOU'
                ? 'border-[#004287] text-[#004287] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            1. 分时购电 (尖/峰/平/谷/深谷)
          </button>
          <button
            onClick={() => setActiveTab('PV')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'PV'
                ? 'border-[#004287] text-[#004287] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sun className="w-4 h-4" />
            2. 光伏上网 (固定/阶梯/市场化)
          </button>
          <button
            onClick={() => setActiveTab('CHARGING')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'CHARGING'
                ? 'border-[#004287] text-[#004287] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4" />
            3. 充电电价及服务费
          </button>
          <button
            onClick={() => setActiveTab('BASIC_FEE')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'BASIC_FEE'
                ? 'border-[#004287] text-[#004287] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            4. 基本电费 (容量/需量互斥)
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: TOU GRID */}
          {activeTab === 'TOU' && (
            <div className="space-y-4">
              {/* Validation Banner */}
              <div
                className={`p-3.5 rounded-xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  validationResult.isValid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {validationResult.isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">
                      {validationResult.isValid
                        ? '24 小时全覆盖校验通过：00:00–24:00 连续无重叠无空隙'
                        : '24 小时时段连续性校验未通过'}
                    </span>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      已覆盖时长: {(validationResult.totalCoveredMinutes / 60).toFixed(1)} / 24.0 小时 (
                      {(validationResult.coverageRatio * 100).toFixed(1)}%)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetToTemplate}
                    className="px-2.5 py-1 text-[11px] bg-white border border-slate-300 rounded hover:bg-slate-100 flex items-center gap-1 font-semibold text-slate-700 shadow-2xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    恢复省标时段模板
                  </button>
                  <button
                    onClick={handleAddInterval}
                    className="px-2.5 py-1 text-[11px] bg-[#004287] text-white rounded hover:bg-[#003366] flex items-center gap-1 font-semibold shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    追加时段
                  </button>
                </div>
              </div>

              {/* Error list if any */}
              {validationResult.issues.length > 0 && (
                <div className="space-y-1.5">
                  {validationResult.issues.map((iss, i) => (
                    <div
                      key={i}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2 font-mono"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                      <span>{iss.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 24-hour visual proportional stripe */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>24:00</span>
                </div>
                <div className="h-6 w-full rounded-lg overflow-hidden flex border border-slate-300 bg-slate-100 text-[10px] font-bold">
                  {intervals.map((it, idx) => {
                    const startMin = parseInt(it.start.split(':')[0], 10) * 60 + parseInt(it.start.split(':')[1], 10);
                    const endMin = parseInt(it.end.split(':')[0], 10) * 60 + parseInt(it.end.split(':')[1], 10);
                    const widthPct = Math.max(2, ((endMin - startMin) / 1440) * 100);
                    const bgClass =
                      it.label === '尖峰'
                        ? 'bg-red-500 text-white'
                        : it.label === '高峰'
                        ? 'bg-orange-500 text-white'
                        : it.label === '平段'
                        ? 'bg-blue-500 text-white'
                        : it.label === '低谷'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-cyan-500 text-white';
                    return (
                      <div
                        key={idx}
                        style={{ width: `${widthPct}%` }}
                        className={`h-full flex items-center justify-center truncate px-0.5 border-r border-white/20 transition-all ${bgClass}`}
                        title={`${it.start} - ${it.end} [${it.label}] ¥${it.price}/kWh`}
                      >
                        {it.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Table of intervals */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 text-left w-12">序号</th>
                      <th className="py-2.5 px-3 text-left w-28">起始时间 (HH:mm)</th>
                      <th className="py-2.5 px-3 text-left w-28">结束时间 (HH:mm)</th>
                      <th className="py-2.5 px-3 text-left w-28">时段类型</th>
                      <th className="py-2.5 px-3 text-left">电价 (元/kWh)</th>
                      <th className="py-2.5 px-3 text-center w-16">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {intervals.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 text-slate-400 font-sans">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={it.start}
                            onChange={(e) => handleIntervalChange(idx, 'start', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 text-slate-800"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={it.end}
                            onChange={(e) => handleIntervalChange(idx, 'end', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 text-slate-800"
                          />
                        </td>
                        <td className="py-2 px-3 font-sans">
                          <select
                            value={it.label}
                            onChange={(e) => handleIntervalChange(idx, 'label', e.target.value as any)}
                            className={`w-full px-2 py-1 border rounded font-semibold text-xs ${getSlotColorBadge(
                              it.label
                            )}`}
                          >
                            <option value="尖峰">尖峰 (最高价)</option>
                            <option value="高峰">高峰</option>
                            <option value="平段">平段</option>
                            <option value="低谷">低谷</option>
                            <option value="深谷">深谷 (极低价)</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">¥</span>
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={it.price}
                              onChange={(e) =>
                                handleIntervalChange(idx, 'price', parseFloat(e.target.value) || 0)
                              }
                              className="w-28 px-2 py-1 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 font-bold text-slate-900"
                            />
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleRemoveInterval(idx)}
                            disabled={intervals.length <= 1}
                            className="text-slate-400 hover:text-red-600 disabled:opacity-30 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PV FEED-IN */}
          {activeTab === 'PV' && (
            <div className="space-y-5 text-xs">
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
                <span className="font-bold text-amber-900 text-sm">光伏发电上网电价配置 (余电上网/全额上网)</span>
                <p className="text-slate-600 mt-1">
                  支持【固定价】、【阶梯价】、【市场化价】三种定价模式，作为光伏反送电网及站内消纳核算来源。
                </p>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    id: 'FIXED',
                    title: '模式一：固定价模式',
                    desc: '执行国家/省发改委固定燃煤基准价或固定上网协议价',
                  },
                  {
                    id: 'TIERED',
                    title: '模式二：阶梯价模式',
                    desc: '按月度上网累计电量设置分档阈值，超额部分降价收购',
                  },
                  {
                    id: 'MARKET',
                    title: '模式三：市场化浮动价',
                    desc: '基于电力交易中心月度双边撮合基准价与上下浮动点差',
                  },
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setPvConfig({ ...pvConfig, mode: m.id as any })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      pvConfig.mode === m.id
                        ? 'border-[#004287] bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-slate-900 mb-1">{m.title}</div>
                    <div className="text-slate-500 text-[11px] leading-relaxed">{m.desc}</div>
                  </div>
                ))}
              </div>

              {/* Mode specific inputs */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
                {pvConfig.mode === 'FIXED' && (
                  <div className="max-w-md">
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      固定上网结算电价 (元/kWh)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={pvConfig.fixedPrice ?? 0.3916}
                        onChange={(e) =>
                          setPvConfig({ ...pvConfig, fixedPrice: parseFloat(e.target.value) || 0 })
                        }
                        className="px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm w-48 bg-white"
                      />
                      <span className="text-slate-500">福建脱硫标杆基准价参考: 0.3916 元/kWh</span>
                    </div>
                  </div>
                )}

                {pvConfig.mode === 'TIERED' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1.5">
                        月度第一档电量阈值 (kWh)
                      </label>
                      <input
                        type="number"
                        step="10000"
                        min="0"
                        value={pvConfig.tieredConfig?.thresholdKwh ?? 500000}
                        onChange={(e) =>
                          setPvConfig({
                            ...pvConfig,
                            tieredConfig: {
                              thresholdKwh: parseFloat(e.target.value) || 0,
                              tier1Price: pvConfig.tieredConfig?.tier1Price ?? 0.415,
                              tier2Price: pvConfig.tieredConfig?.tier2Price ?? 0.38,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1.5">
                        第一档结算电价 (≤ 阈值)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={pvConfig.tieredConfig?.tier1Price ?? 0.415}
                        onChange={(e) =>
                          setPvConfig({
                            ...pvConfig,
                            tieredConfig: {
                              thresholdKwh: pvConfig.tieredConfig?.thresholdKwh ?? 500000,
                              tier1Price: parseFloat(e.target.value) || 0,
                              tier2Price: pvConfig.tieredConfig?.tier2Price ?? 0.38,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-emerald-700 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1.5">
                        第二档结算电价 (&gt; 阈值)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={pvConfig.tieredConfig?.tier2Price ?? 0.38}
                        onChange={(e) =>
                          setPvConfig({
                            ...pvConfig,
                            tieredConfig: {
                              thresholdKwh: pvConfig.tieredConfig?.thresholdKwh ?? 500000,
                              tier1Price: pvConfig.tieredConfig?.tier1Price ?? 0.415,
                              tier2Price: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-amber-700 bg-white"
                      />
                    </div>
                  </div>
                )}

                {pvConfig.mode === 'MARKET' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1.5">
                        电力市场出清基准价 (元/kWh)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={pvConfig.marketConfig?.basePrice ?? 0.405}
                        onChange={(e) =>
                          setPvConfig({
                            ...pvConfig,
                            marketConfig: {
                              basePrice: parseFloat(e.target.value) || 0,
                              floatingSpread: pvConfig.marketConfig?.floatingSpread ?? 0.02,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1.5">
                        现货撮合浮动点差 (元/kWh)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={pvConfig.marketConfig?.floatingSpread ?? 0.02}
                        onChange={(e) =>
                          setPvConfig({
                            ...pvConfig,
                            marketConfig: {
                              basePrice: pvConfig.marketConfig?.basePrice ?? 0.405,
                              floatingSpread: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold bg-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">模式补充说明</label>
                  <input
                    type="text"
                    value={pvConfig.description || ''}
                    onChange={(e) => setPvConfig({ ...pvConfig, description: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    placeholder="输入该光伏电价模式在核算结算中的执行细则"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHARGING SERVICE & TOU */}
          {activeTab === 'CHARGING' && (
            <div className="space-y-5 text-xs">
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
                <span className="font-bold text-blue-900 text-sm">充电站运营价格：分时电量价 + 服务费</span>
                <p className="text-slate-600 mt-1">
                  用户最终充电结算总单价 = 对应时段分时电量价 + 充电运营服务费（两者独立列支于发票明细）。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-3">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>充电运营服务费</span>
                    <span className="text-slate-400 font-normal">固定加价</span>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">服务费单价 (元/kWh)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={chargingConfig.serviceFee}
                        onChange={(e) =>
                          setChargingConfig({
                            ...chargingConfig,
                            serviceFee: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-40 px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm"
                      />
                      <span className="text-slate-500">发改委核定最高限价 0.50 元/kWh</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2">
                  <div className="font-bold text-slate-900">分时综合到手预估单价</div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-red-700 font-semibold font-sans">尖峰时刻:</span>
                      <span>
                        ¥{(chargingConfig.energyPriceTou.sharp + chargingConfig.serviceFee).toFixed(3)}/kWh (电¥
                        {chargingConfig.energyPriceTou.sharp} + 服¥{chargingConfig.serviceFee})
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-orange-700 font-semibold font-sans">高峰时刻:</span>
                      <span>
                        ¥{(chargingConfig.energyPriceTou.peak + chargingConfig.serviceFee).toFixed(3)}/kWh (电¥
                        {chargingConfig.energyPriceTou.peak} + 服¥{chargingConfig.serviceFee})
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-blue-700 font-semibold font-sans">平段时刻:</span>
                      <span>
                        ¥{(chargingConfig.energyPriceTou.flat + chargingConfig.serviceFee).toFixed(3)}/kWh (电¥
                        {chargingConfig.energyPriceTou.flat} + 服¥{chargingConfig.serviceFee})
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-emerald-700 font-semibold font-sans">低谷时刻:</span>
                      <span>
                        ¥{(chargingConfig.energyPriceTou.valley + chargingConfig.serviceFee).toFixed(3)}/kWh (电¥
                        {chargingConfig.energyPriceTou.valley} + 服¥{chargingConfig.serviceFee})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TOU inputs */}
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                <span className="font-bold text-slate-800">充电桩分时电量价微调 (元/kWh)</span>
                <div className="grid grid-cols-5 gap-3 font-mono">
                  <div>
                    <label className="block text-red-700 font-sans font-semibold mb-1">尖峰电价</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={chargingConfig.energyPriceTou.sharp}
                      onChange={(e) =>
                        setChargingConfig({
                          ...chargingConfig,
                          energyPriceTou: {
                            ...chargingConfig.energyPriceTou,
                            sharp: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-orange-700 font-sans font-semibold mb-1">高峰电价</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={chargingConfig.energyPriceTou.peak}
                      onChange={(e) =>
                        setChargingConfig({
                          ...chargingConfig,
                          energyPriceTou: {
                            ...chargingConfig.energyPriceTou,
                            peak: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-blue-700 font-sans font-semibold mb-1">平段电价</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={chargingConfig.energyPriceTou.flat}
                      onChange={(e) =>
                        setChargingConfig({
                          ...chargingConfig,
                          energyPriceTou: {
                            ...chargingConfig.energyPriceTou,
                            flat: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-700 font-sans font-semibold mb-1">低谷电价</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={chargingConfig.energyPriceTou.valley}
                      onChange={(e) =>
                        setChargingConfig({
                          ...chargingConfig,
                          energyPriceTou: {
                            ...chargingConfig.energyPriceTou,
                            valley: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-cyan-700 font-sans font-semibold mb-1">深谷电价</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={chargingConfig.energyPriceTou.deepValley}
                      onChange={(e) =>
                        setChargingConfig({
                          ...chargingConfig,
                          energyPriceTou: {
                            ...chargingConfig.energyPriceTou,
                            deepValley: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BASIC FEE (MUTUALLY EXCLUSIVE) */}
          {activeTab === 'BASIC_FEE' && (
            <div className="space-y-5 text-xs">
              <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl">
                <span className="font-bold text-purple-900 text-sm">两部制电价：基本电费计费方式选择 (互斥准则)</span>
                <p className="text-slate-600 mt-1">
                  依据《国家发改委两部制电价管理办法》，大工业电力户必须在【按变压器容量计费】与【按最大需量计费】中选择一种，
                  <span className="font-bold text-purple-900"> 同一生效周期内严禁同时计费！</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Mode Option 1: Capacity */}
                <div
                  onClick={() =>
                    setBasicFeeConfig({
                      ...basicFeeConfig,
                      type: 'CAPACITY',
                      capacityUnitPrice: basicFeeConfig.capacityUnitPrice ?? 32.0,
                      transformerCapacityKva: basicFeeConfig.transformerCapacityKva ?? 2000,
                      description: `选用【容量电费】：装见容量 ${
                        basicFeeConfig.transformerCapacityKva ?? 2000
                      } kVA × ${(basicFeeConfig.capacityUnitPrice ?? 32.0).toFixed(2)} 元/kVA/月；需量电费停用。`,
                    })
                  }
                  className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    basicFeeConfig.type === 'CAPACITY'
                      ? 'border-purple-600 bg-purple-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-sm">方式一：按变压器容量计费</span>
                    {basicFeeConfig.type === 'CAPACITY' && (
                      <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-semibold text-[10px]">
                        当前选用
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 mb-4 leading-relaxed">
                    依据示范站总装见容量固定计取，不论每月实际负荷高低，基本电费恒定。
                  </p>
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-sans">示范站装见容量:</span>
                      <span className="font-bold text-slate-800">
                        {basicFeeConfig.transformerCapacityKva ?? 2000} kVA
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-sans">容量单价 (元/kVA/月):</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={basicFeeConfig.capacityUnitPrice ?? 32.0}
                        onChange={(e) =>
                          setBasicFeeConfig({
                            ...basicFeeConfig,
                            capacityUnitPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-24 px-2 py-1 border border-slate-300 rounded font-bold text-right bg-white"
                      />
                    </div>
                    <div className="pt-2 border-t border-purple-200/60 flex justify-between font-bold text-purple-900">
                      <span>月度基本电费:</span>
                      <span>
                        ¥
                        {(
                          (basicFeeConfig.transformerCapacityKva ?? 2000) *
                          (basicFeeConfig.capacityUnitPrice ?? 32.0)
                        ).toLocaleString('zh-CN')}
                        /月
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mode Option 2: Demand */}
                <div
                  onClick={() =>
                    setBasicFeeConfig({
                      ...basicFeeConfig,
                      type: 'DEMAND',
                      demandUnitPrice: basicFeeConfig.demandUnitPrice ?? 40.0,
                      declaredDemandKw: basicFeeConfig.declaredDemandKw ?? 1200,
                      description: `选用【需量电费】：核定需量 ${
                        basicFeeConfig.declaredDemandKw ?? 1200
                      } kW × ${(basicFeeConfig.demandUnitPrice ?? 40.0).toFixed(2)} 元/kW/月；容量电费停用。`,
                    })
                  }
                  className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    basicFeeConfig.type === 'DEMAND'
                      ? 'border-purple-600 bg-purple-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-sm">方式二：按实际最大需量计费</span>
                    {basicFeeConfig.type === 'DEMAND' && (
                      <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-semibold text-[10px]">
                        当前选用
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 mb-4 leading-relaxed">
                    依据申报需量或月末结算表最大需量计费，储能削峰可直接降低需量电费支出。
                  </p>
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-sans">申报核定需量 (kW):</span>
                      <input
                        type="number"
                        step="50"
                        min="0"
                        value={basicFeeConfig.declaredDemandKw ?? 1200}
                        onChange={(e) =>
                          setBasicFeeConfig({
                            ...basicFeeConfig,
                            declaredDemandKw: parseFloat(e.target.value) || 0,
                          })
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-24 px-2 py-1 border border-slate-300 rounded font-bold text-right bg-white"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-sans">需量单价 (元/kW/月):</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={basicFeeConfig.demandUnitPrice ?? 40.0}
                        onChange={(e) =>
                          setBasicFeeConfig({
                            ...basicFeeConfig,
                            demandUnitPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-24 px-2 py-1 border border-slate-300 rounded font-bold text-right bg-white"
                      />
                    </div>
                    <div className="pt-2 border-t border-purple-200/60 flex justify-between font-bold text-purple-900">
                      <span>月度基本电费:</span>
                      <span>
                        ¥
                        {(
                          (basicFeeConfig.declaredDemandKw ?? 1200) *
                          (basicFeeConfig.demandUnitPrice ?? 40.0)
                        ).toLocaleString('zh-CN')}
                        /月
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-semibold text-slate-700">计费方式核定备注：</span>
                <span className="text-slate-600 font-mono ml-1">{basicFeeConfig.description}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                validationResult.isValid ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
            <span>
              {validationResult.isValid
                ? '全部参数完整且时段连续覆盖，可保存草稿'
                : `存在 ${validationResult.issues.length} 项参数或连续性校验问题，请先修正`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              disabled={!validationResult.isValid || isSaving}
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-semibold bg-[#004287] hover:bg-[#003366] text-white rounded-lg transition-colors disabled:opacity-40 shadow-xs flex items-center gap-1.5"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{isSaving ? '正在保存...' : '保存为电价草稿'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
