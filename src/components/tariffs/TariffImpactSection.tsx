import React from 'react';
import { TariffVersion } from '../../types/domain';
import {
  ShieldCheck,
  AlertTriangle,
  Server,
  DollarSign,
  Layers,
  FileSpreadsheet,
  Cpu,
  History,
} from 'lucide-react';

interface TariffImpactSectionProps {
  version: TariffVersion;
}

export const TariffImpactSection: React.FC<TariffImpactSectionProps> = ({ version }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#004287]" />
            电价方案影响范围与结算安全边界评估
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            核验新版本在全站多源设备、微电网收益结算及历史账期中的生效影响边界
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-800 rounded font-semibold border border-blue-200">
          目标基准: {version.versionNumber}
        </span>
      </div>

      {/* Safety Policy Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>生效隔离与基准唯一性准则</span>
          </div>
          <p className="text-emerald-800 leading-relaxed text-[11px]">
            系统仅允许唯一的【已生效】版本作为电能量与收益核算的计算基准（当前基准：{version.versionNumber}
            ）。草稿、待审批及已驳回版本严格禁止被结算引擎引用。
          </p>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>历史已结账期防静默覆盖门禁</span>
          </div>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            涉及已结算归档历史日期的电价追溯，系统严禁直接覆盖历史收益快照（RevenueSnapshot）。必须通过【重算批次管理】发起合规重算并留痕。
          </p>
        </div>
      </div>

      {/* Impact Modules */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-blue-600" />
          <span>受影响的结算核算科目</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <div className="font-semibold text-slate-800">1. 电网购电成本</div>
            <div className="text-slate-500 text-[11px] leading-relaxed">
              执行尖峰 ¥{version.slots?.find((s) => s.label === '尖峰')?.price ?? 1.425}/kWh 等分时电价，影响站内负荷与储能充放电外购成本。
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <div className="font-semibold text-slate-800">2. 光伏上网与消纳</div>
            <div className="text-slate-500 text-[11px] leading-relaxed">
              执行
              {version.pvConfig?.mode === 'FIXED'
                ? '固定上网标杆价'
                : version.pvConfig?.mode === 'TIERED'
                ? '月度阶梯分档价'
                : version.pvConfig?.mode === 'MARKET'
                ? '市场撮合浮动价'
                : '固定标杆价 (0.3916元/kWh)'}
              ，直接计算 1.2MW 光伏月度实际上网电费收益。
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <div className="font-semibold text-slate-800">3. 充电桩运营收入</div>
            <div className="text-slate-500 text-[11px] leading-relaxed">
              执行充电运营服务费 ¥{(version.chargingConfig?.serviceFee ?? 0.4).toFixed(2)}/kWh
              加分时电量价，计算对外超充服务总营运收入。
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <div className="font-semibold text-slate-800">4. 基本电费摊销</div>
            <div className="text-slate-500 text-[11px] leading-relaxed">
              执行
              {version.basicFeeConfig?.type === 'CAPACITY'
                ? `容量电费 (¥${version.basicFeeConfig?.capacityUnitPrice ?? 32}/kVA)`
                : version.basicFeeConfig?.type === 'DEMAND'
                ? `需量电费 (¥${version.basicFeeConfig?.demandUnitPrice ?? 40}/kW)`
                : '容量电费 (¥32.00/kVA，装见容量 2000kVA)'}
              ，按月度计入示范站固定用电折旧与两部制基础电费成本。
            </div>
          </div>
        </div>
      </div>

      {/* Connected devices */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-purple-600" />
          <span>关联物理设备与计量采集点位</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg border border-slate-200 bg-white">
            <span className="text-slate-500 block text-[11px] font-sans">高压主变电表:</span>
            <span className="font-bold text-slate-900">DEV-MTR-01 (2000kVA)</span>
            <span className="text-[10px] text-slate-400 block mt-1 font-sans">正反向有功/需量计量</span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-white">
            <span className="text-slate-500 block text-[11px] font-sans">集中式光伏逆变器:</span>
            <span className="font-bold text-slate-900">DEV-PV-01 (1200kW)</span>
            <span className="text-[10px] text-slate-400 block mt-1 font-sans">上网及站内就地消纳发电量</span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-white">
            <span className="text-slate-500 block text-[11px] font-sans">磷酸铁锂储能系统:</span>
            <span className="font-bold text-slate-900">DEV-ESS-01 (1MW/2MWh)</span>
            <span className="text-[10px] text-slate-400 block mt-1 font-sans">谷充峰放价差套利与需量削峰</span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-white">
            <span className="text-slate-500 block text-[11px] font-sans">直流超充桩集群:</span>
            <span className="font-bold text-slate-900">DEV-CHG-CLUSTER (8桩)</span>
            <span className="text-[10px] text-slate-400 block mt-1 font-sans">分时用电及运营服务费计量</span>
          </div>
        </div>
      </div>
    </div>
  );
};
