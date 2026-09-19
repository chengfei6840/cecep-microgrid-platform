import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { QualityTag } from '../components/common/QualityTag';
import { DetailDrawer } from '../components/common/DetailDrawer';
import {
  Layers,
  Search,
  Cpu,
  SunMedium,
  BatteryCharging,
  Zap,
  Activity,
  CloudSun,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  SlidersHorizontal,
  FileSpreadsheet,
  Upload,
  Edit3,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Lock,
  Building2,
  Database,
  FileText,
  HelpCircle,
} from 'lucide-react';

export const DataAssets: React.FC = () => {
  const {
    site,
    sites,
    devices,
    points,
    metrics,
    currentRole,
    updateSite,
    addSite,
    switchSite,
    deleteSite,
    updateDevice,
    addDevice,
    deleteDevice,
    updatePoint,
    addPoint,
    deletePoint,
    disablePoint,
    disableDevice,
    updateMetric,
    addMetric,
    deleteMetric,
    batchImportPoints,
  } = useAppStore();

  const isAdmin = currentRole === 'ADMIN';
  const isOperator = currentRole === 'OPERATOR';

  // Active Tab: 'SITE' | 'DEVICES' | 'POINTS' | 'METRICS'
  const [activeTab, setActiveTab] = useState<'SITE' | 'DEVICES' | 'POINTS' | 'METRICS'>('SITE');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  // Drawers & Modals
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<any | null>(null);

  // Edit forms state
  const [editingSite, setEditingSite] = useState(false);
  const [siteForm, setSiteForm] = useState({ ...site });

  const [editingMetric, setEditingMetric] = useState(false);
  const [metricForm, setMetricForm] = useState<any>({});

  // Add Modals
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newSiteForm, setNewSiteForm] = useState({
    name: '',
    code: '',
    location: '',
    address: '',
    pvCapacity: '1.2 MWp',
    storageCapacity: '500 kW / 1000 kWh',
    chargerCount: 12,
    gridVoltage: '10kV',
    transformerCapacity: '2000 kVA',
    commissioningDate: '2026-06-01',
    status: 'ONLINE' as any,
  });
  const [newDeviceForm, setNewDeviceForm] = useState({
    name: '',
    type: 'PV_INVERTER' as any,
    manufacturer: '',
    model: '',
    ratedCapacity: '',
    sourcePlatform: 'huawei_pv_cloud_api',
    sourceAdapterId: 'ADAPTER-01',
    status: 'NORMAL' as any,
    lastDataTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    siteId: site.id,
  });

  const [showAddPointModal, setShowAddPointModal] = useState(false);
  const [newPointForm, setNewPointForm] = useState({
    pointName: '',
    standardCode: '',
    deviceId: devices[0]?.id || '',
    thirdPartyField: '',
    unit: 'kW',
    dataType: 'FLOAT' as any,
    lowerLimit: 0,
    upperLimit: 1000,
    mappingStatus: 'MAPPED' as any,
    currentQuality: 'NORMAL' as any,
    currentValue: 120.5,
    lastUpdated: new Date().toLocaleString('zh-CN', { hour12: false }),
  });

  const [showAddMetricModal, setShowAddMetricModal] = useState(false);
  const [newMetricForm, setNewMetricForm] = useState({
    name: '',
    code: '',
    calculationLogic: '',
    aggregationPeriod: 'REALTIME' as any,
    unit: 'kW',
    allowedQualityGrade: ['NORMAL', 'PATCHED'],
    downstreamUsage: ['综合监测看板', '收益核算报表'],
    status: 'ACTIVE' as any,
    siteId: site.id,
  });

  // Batch Import modal state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchRawText, setBatchRawText] = useState('');
  const [batchPreviewResult, setBatchPreviewResult] = useState<any | null>(null);
  const [batchImportError, setBatchImportError] = useState<string | null>(null);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

  // Helper icons
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'INVERTER':
      case 'PV_INVERTER':
        return <SunMedium className="w-4 h-4 text-amber-500" />;
      case 'PCS':
      case 'BATTERY_CLUSTER':
      case 'ENERGY_STORAGE':
        return <BatteryCharging className="w-4 h-4 text-blue-500" />;
      case 'CHARGER_DC':
      case 'CHARGER_AC':
      case 'CHARGING_STATION':
        return <Zap className="w-4 h-4 text-emerald-500" />;
      case 'SMART_METER':
      case 'GRID_METER':
        return <Activity className="w-4 h-4 text-purple-500" />;
      case 'WEATHER_STATION':
        return <CloudSun className="w-4 h-4 text-sky-500" />;
      default:
        return <Cpu className="w-4 h-4 text-slate-500" />;
    }
  };

  const isDeviceReady = (devId: string) => {
    const dev = devices.find((d) => d.id === devId);
    if (!dev || dev.status === 'DISABLED') return false;
    const hasSource = Boolean(dev.sourcePlatform || dev.sourceAdapterId);
    const devPoints = points.filter((p) => p.deviceId === devId && p.status !== 'DISABLED');
    const hasMappedPoint = devPoints.some((p) => p.mappingStatus === 'MAPPED');
    return hasSource && hasMappedPoint;
  };

  const filteredPoints = points.filter((p) => {
    if (p.status === 'DISABLED') return false;
    if (selectedFilter !== 'ALL') {
      const dev = devices.find((d) => d.id === p.deviceId);
      if (!dev) return false;
      if (selectedFilter === 'PV' && dev.type !== 'INVERTER' && dev.type !== 'PV_INVERTER') return false;
      if (selectedFilter === 'STORAGE' && dev.type !== 'PCS' && dev.type !== 'BATTERY_CLUSTER' && dev.type !== 'ENERGY_STORAGE') return false;
      if (selectedFilter === 'CHARGER' && dev.type !== 'CHARGER_DC' && dev.type !== 'CHARGING_STATION') return false;
      if (selectedFilter === 'GRID' && dev.type !== 'SMART_METER' && dev.type !== 'GRID_METER') return false;
      if (selectedFilter === dev.id) return true;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const name = (p.pointName || '').toLowerCase();
      const code = (p.standardCode || '').toLowerCase();
      const devId = (p.deviceId || '').toLowerCase();
      const field = (p.thirdPartyField || '').toLowerCase();
      if (!name.includes(term) && !code.includes(term) && !devId.includes(term) && !field.includes(term)) {
        return false;
      }
    }
    return true;
  });

  const handlePreviewBatch = () => {
    setBatchImportError(null);
    setBatchSuccessMsg(null);
    try {
      const lines = batchRawText.trim().split('\n');
      if (lines.length === 0 || !batchRawText.trim()) {
        setBatchImportError('请输入或粘贴待导入的点位数据');
        return;
      }
      const parsedRows = lines.map((line, idx) => {
        const parts = line.split(',').map((s) => s.trim());
        return {
          standardCode: parts[0] || '',
          pointName: parts[1] || '导入测点',
          deviceId: parts[2] || devices[0]?.id || 'DEV-01',
          unit: parts[3] || 'kW',
          dataType: (parts[4] as any) || 'FLOAT',
          thirdPartyField: parts[5] || 'modbus.tag_' + idx,
        };
      });

      const errors: string[] = [];
      const existingCodes = new Set(points.map((p) => p.standardCode));
      const validDeviceIds = new Set(devices.map((d) => d.id));

      parsedRows.forEach((row, idx) => {
        if (!row.standardCode) {
          errors.push(`第 ${idx + 1} 行: 缺少标准编码 (standardCode)`);
        }
        if (existingCodes.has(row.standardCode)) {
          errors.push(`第 ${idx + 1} 行: 标准编码 "${row.standardCode}" 在系统中已重复`);
        }
        if (!row.deviceId || !validDeviceIds.has(row.deviceId)) {
          errors.push(`第 ${idx + 1} 行: 关联设备 ID "${row.deviceId}" 不存在或无效`);
        }
        if (!['kW', 'kWh', 'V', 'A', '℃', '%', 'kW·h', 'kW/h'].includes(row.unit)) {
          errors.push(`第 ${idx + 1} 行: 未知或非法单位 "${row.unit}"`);
        }
      });

      setBatchPreviewResult({
        rows: parsedRows,
        errors,
        isValid: errors.length === 0,
      });
    } catch (e: any) {
      setBatchImportError('解析失败，请检查 CSV 格式: ' + e.message);
    }
  };

  const executeBatchImport = () => {
    if (!batchPreviewResult || !batchPreviewResult.isValid) return;
    const res = batchImportPoints(batchPreviewResult.rows);
    if (res.success) {
      setBatchSuccessMsg(`成功批量导入 ${res.importedCount} 个测点！`);
      setShowBatchModal(false);
      setBatchRawText('');
      setBatchPreviewResult(null);
    } else {
      setBatchImportError(res.errors.join('; '));
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部面包屑与全景引导 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-slate-500 font-mono">
            <span className="text-[#004287] font-bold">低碳园区示范站 (SITE-001)</span>
            <span>/</span>
            <span>资产与点位字典管理 (全CRUD支持)</span>
            <span>/</span>
            <span className="text-slate-900 font-semibold">
              {activeTab === 'SITE' && '站点概览'}
              {activeTab === 'DEVICES' && '设备台账与就绪'}
              {activeTab === 'POINTS' && '测点字典与映射'}
              {activeTab === 'METRICS' && '标准指标口径与影响'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#004287]" />
            <span>物理资产、测点映射与标准指标完整增删改查中心</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
            支持系统管理员对站点档案、设备台账、测点字典及标准指标进行完整的 **CRUD（增删改查）** 操作。所有写入与删除变更实时同步至全局状态并记录集中审计日志。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-800 font-semibold border border-blue-200 font-mono flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#004287]" />
            在册点位: {points.filter(p => p.status !== 'DISABLED').length} 个 · 设备: {devices.filter(d => d.status !== 'DISABLED').length} 台套
          </span>
          {isOperator && (
            <span className="text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" />
              运营只读
            </span>
          )}
        </div>
      </div>

      {/* 四个页签导航 */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 pt-3 rounded-t-xl">
        <button
          onClick={() => setActiveTab('SITE')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'SITE'
              ? 'border-[#004287] text-[#004287]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>站点概览 (Site Overview)</span>
        </button>
        <button
          onClick={() => setActiveTab('DEVICES')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'DEVICES'
              ? 'border-[#004287] text-[#004287]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>设备台账 ({devices.filter(d => d.status !== 'DISABLED').length})</span>
        </button>
        <button
          onClick={() => setActiveTab('POINTS')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'POINTS'
              ? 'border-[#004287] text-[#004287]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>测点字典 ({points.filter(p => p.status !== 'DISABLED').length})</span>
        </button>
        <button
          onClick={() => setActiveTab('METRICS')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'METRICS'
              ? 'border-[#004287] text-[#004287]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>指标字典 ({metrics.length})</span>
        </button>
      </div>

      {/* ======================= TAB 1: 站点概览 ======================= */}
      {activeTab === 'SITE' && (
        <div className="space-y-6">
          {/* 站点切换与新增工具条 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500 font-mono font-semibold">当前工作站点:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {sites.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => switchSite(s.id)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      s.id === site.id
                        ? 'bg-[#004287] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{s.name} ({s.code})</span>
                  </button>
                ))}
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddSiteModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>新增站点 (Create Site)</span>
                </button>
                {sites.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(`确认删除当前站点 ${site.name} 吗？`)) {
                        deleteSite(site.id);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>删除当前站</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{site.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                    {site.code}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">{site.location}</p>
              </div>

              {isAdmin && !editingSite && (
                <button
                  onClick={() => {
                    setSiteForm({ ...site });
                    setEditingSite(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#004287] hover:bg-[#003366] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>编辑站点档案 (Update)</span>
                </button>
              )}
            </div>

            {editingSite ? (
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">站点名称：</label>
                    <input
                      type="text"
                      value={siteForm.name}
                      onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#004287]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">站点编码 (Code)：</label>
                    <input
                      type="text"
                      value={siteForm.code}
                      onChange={(e) => setSiteForm({ ...siteForm, code: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#004287]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-600 font-semibold mb-1">详细地址：</label>
                    <input
                      type="text"
                      value={siteForm.address || siteForm.location}
                      onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value, location: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#004287]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">光伏装机容量：</label>
                    <input
                      type="text"
                      value={siteForm.pvCapacity}
                      onChange={(e) => setSiteForm({ ...siteForm, pvCapacity: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#004287]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">储能额定功率与容量：</label>
                    <input
                      type="text"
                      value={siteForm.storageCapacity}
                      onChange={(e) => setSiteForm({ ...siteForm, storageCapacity: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#004287]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">充电桩终端数：</label>
                    <input
                      type="number"
                      value={siteForm.chargerCount}
                      onChange={(e) => setSiteForm({ ...siteForm, chargerCount: Number(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#004287]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">并网电压等级：</label>
                    <input
                      type="text"
                      value={siteForm.gridVoltage}
                      onChange={(e) => setSiteForm({ ...siteForm, gridVoltage: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#004287]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => setEditingSite(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      updateSite(siteForm);
                      setEditingSite(false);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-[#004287] hover:bg-[#003366] text-white font-medium"
                  >
                    保存更新并记录审计日志
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 block">光伏发电装机</span>
                  <span className="text-sm font-bold text-slate-900 font-sans">{site.pvCapacity}</span>
                  <div className="text-[10px] text-emerald-600">屋顶分布式光伏列阵</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 block">电化学储能系统</span>
                  <span className="text-sm font-bold text-slate-900 font-sans">{site.storageCapacity}</span>
                  <div className="text-[10px] text-blue-600">磷酸铁锂电池集装箱</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 block">园区充电桩群</span>
                  <span className="text-sm font-bold text-slate-900 font-sans">{site.chargerCount} 台快充终端</span>
                  <div className="text-[10px] text-purple-600">双枪直流快充 + 有序调度</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 block">并网与变压器</span>
                  <span className="text-sm font-bold text-slate-900 font-sans">{site.gridVoltage} / {site.transformerCapacity}</span>
                  <div className="text-[10px] text-slate-500">投运日期: {site.commissioningDate}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= TAB 2: 设备管理 (CRUD) ======================= */}
      {activeTab === 'DEVICES' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="搜索设备名称、ID或厂商..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#004287]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-mono">在册物理设备共 {devices.filter(d => d.status !== 'DISABLED').length} 台套</span>
              {isAdmin && (
                <button
                  onClick={() => setShowAddDeviceModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#004287] hover:bg-[#003366] text-white font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>新增设备 (Create)</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.filter(d => d.status !== 'DISABLED').map((device) => {
              const ready = isDeviceReady(device.id);
              const devPoints = points.filter((p) => p.deviceId === device.id && p.status !== 'DISABLED');

              return (
                <div key={device.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                          {getDeviceIcon(device.type)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">{device.name}</h3>
                          <span className="text-[10px] font-mono text-slate-400">{device.id}</span>
                        </div>
                      </div>
                      <StatusBadge status={device.status} size="sm" />
                    </div>

                    <div className="space-y-1.5 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">设备厂商:</span>
                        <span className="font-semibold text-slate-800">{device.manufacturer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">型号规格:</span>
                        <span className="text-slate-800">{device.model} ({device.ratedCapacity})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">数据来源平台:</span>
                        <span className="font-semibold text-blue-700">{device.sourcePlatform || device.sourceAdapterId || '未对接'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">就绪状态:</span>
                        <span className={`font-bold ${ready ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {ready ? '✓ 就绪' : '⚠ 未就绪'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">下辖测点数:</span>
                        <span className="text-slate-800 font-bold">{devPoints.length} 点位</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => setSelectedDevice(device)}
                      className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>查看详情/修改</span>
                    </button>

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (confirm(`确认物理删除设备 ${device.name} 及其所有下辖测点吗？`)) {
                              deleteDevice(device.id);
                            }
                          }}
                          className="text-red-600 hover:underline text-[11px] flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>删除</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================= TAB 3: 点位管理 (CRUD) ======================= */}
      {activeTab === 'POINTS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="搜索点位名称、标准编码或第三方字段..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#004287]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none text-xs"
              >
                <option value="ALL">全部分类 ({points.filter(p => p.status !== 'DISABLED').length})</option>
                <option value="PV">光伏系统</option>
                <option value="STORAGE">储能系统</option>
                <option value="CHARGER">充电桩群</option>
                <option value="GRID">网侧关口表</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>设备: {d.name}</option>
                ))}
              </select>

              {isAdmin && (
                <>
                  <button
                    onClick={() => setShowAddPointModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#004287] hover:bg-[#003366] text-white font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>新增测点</span>
                  </button>
                  <button
                    onClick={() => setShowBatchModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>批量导入</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] border-b border-slate-200 font-mono">
                  <tr>
                    <th className="py-3 px-4">标准编码 (Code)</th>
                    <th className="py-3 px-4">测点业务名称</th>
                    <th className="py-3 px-4">所属设备</th>
                    <th className="py-3 px-4">第三方物理字段</th>
                    <th className="py-3 px-4">实时工程值</th>
                    <th className="py-3 px-4">单位</th>
                    <th className="py-3 px-4">映射状态</th>
                    <th className="py-3 px-4">质量校验</th>
                    <th className="py-3 px-4">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredPoints.map((point) => {
                    const dev = devices.find((d) => d.id === point.deviceId);

                    return (
                      <tr key={point.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800">{point.standardCode}</td>
                        <td className="py-3 px-4 font-sans font-semibold text-slate-900">{point.pointName}</td>
                        <td className="py-3 px-4 text-slate-600 font-sans">{dev?.name || point.deviceId}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">{point.thirdPartyField || '--'}</td>
                        <td className="py-3 px-4 font-black text-blue-700 text-sm">
                          {point.currentValue ?? '--'}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{point.unit}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium ${
                            point.mappingStatus === 'MAPPED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            point.mappingStatus === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {point.mappingStatus === 'MAPPED' ? '已映射生效' : point.mappingStatus === 'PENDING' ? '待确认' : '未映射'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <QualityTag level={point.currentQuality} />
                        </td>
                        <td className="py-3 px-4 space-x-2 font-sans">
                          <button
                            onClick={() => setSelectedPoint(point)}
                            className="text-blue-600 hover:underline font-medium text-xs"
                          >
                            详情/编辑
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (confirm(`确认永久删除点位 ${point.standardCode} 吗？`)) {
                                  deletePoint(point.id);
                                }
                              }}
                              className="text-red-500 hover:underline text-xs"
                            >
                              删除
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 4: 指标字典 (CRUD) ======================= */}
      {activeTab === 'METRICS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between text-xs">
            <p className="text-slate-600">
              标准指标字典支持新增、修改口径表达式及物理删除。
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowAddMetricModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#004287] hover:bg-[#003366] text-white font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>新增指标 (Create)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.map((metric) => (
              <div key={metric.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{metric.name}</h3>
                      <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mt-1">
                        {metric.code}
                      </span>
                    </div>
                    <span className="text-xs font-mono px-2 py-1 bg-slate-100 rounded text-slate-600">
                      周期: {metric.aggregationPeriod}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800">
                    <span className="text-slate-400 text-[10px] block mb-0.5">计算口径表达式：</span>
                    <code>{metric.calculationLogic}</code>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="text-slate-400 text-[10px]">下游用途：</span>
                    <div className="flex flex-wrap gap-1.5">
                      {metric.downstreamUsage.map((use, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[11px] border border-amber-200">
                          {use}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-sans">
                  <span className="text-slate-400 font-mono">单位: {metric.unit}</span>
                  {isAdmin && (
                    <div className="space-x-3">
                      <button
                        onClick={() => {
                          setSelectedMetric(metric);
                          setMetricForm({ ...metric });
                          setEditingMetric(true);
                        }}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确认物理删除指标 ${metric.name} 吗？`)) {
                            deleteMetric(metric.id);
                          }
                        }}
                        className="text-red-600 hover:underline"
                      >
                        删除
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= MODAL: 新增设备 ======================= */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#004287]" />
                <span>新增物理设备档案</span>
              </h3>
              <button onClick={() => setShowAddDeviceModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">设备名称：</label>
                <input
                  type="text"
                  placeholder="如: 光伏逆变器 3 号"
                  value={newDeviceForm.name}
                  onChange={(e) => setNewDeviceForm({ ...newDeviceForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-[#004287]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">设备类型：</label>
                  <select
                    value={newDeviceForm.type}
                    onChange={(e) => setNewDeviceForm({ ...newDeviceForm, type: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="PV_INVERTER">光伏逆变器 (PV_INVERTER)</option>
                    <option value="ENERGY_STORAGE">储能电池舱 (ENERGY_STORAGE)</option>
                    <option value="CHARGING_STATION">充电桩终端 (CHARGING_STATION)</option>
                    <option value="GRID_METER">网侧关口表 (GRID_METER)</option>
                    <option value="WEATHER_STATION">气象站 (WEATHER_STATION)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">设备厂商：</label>
                  <input
                    type="text"
                    placeholder="如: 华为数字能源"
                    value={newDeviceForm.manufacturer}
                    onChange={(e) => setNewDeviceForm({ ...newDeviceForm, manufacturer: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">型号规格：</label>
                  <input
                    type="text"
                    placeholder="如: SUN2000-100KTL"
                    value={newDeviceForm.model}
                    onChange={(e) => setNewDeviceForm({ ...newDeviceForm, model: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">额定容量：</label>
                  <input
                    type="text"
                    placeholder="如: 100 kW"
                    value={newDeviceForm.ratedCapacity}
                    onChange={(e) => setNewDeviceForm({ ...newDeviceForm, ratedCapacity: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">数据来源适配平台：</label>
                <input
                  type="text"
                  value={newDeviceForm.sourcePlatform}
                  onChange={(e) => setNewDeviceForm({ ...newDeviceForm, sourcePlatform: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 font-sans">
              <button
                onClick={() => setShowAddDeviceModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!newDeviceForm.name) {
                    alert('请输入设备名称');
                    return;
                  }
                  addDevice(newDeviceForm);
                  setShowAddDeviceModal(false);
                  setNewDeviceForm({
                    name: '',
                    type: 'PV_INVERTER',
                    manufacturer: '',
                    model: '',
                    ratedCapacity: '',
                    sourcePlatform: 'huawei_pv_cloud_api',
                    sourceAdapterId: 'ADAPTER-01',
                    status: 'NORMAL',
                    lastDataTime: new Date().toLocaleString('zh-CN', { hour12: false }),
                    siteId: site.id,
                  });
                }}
                className="px-4 py-1.5 rounded-lg bg-[#004287] hover:bg-[#003366] text-white font-medium shadow-xs"
              >
                确认新增设备
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: 新增测点 ======================= */}
      {showAddPointModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#004287]" />
                <span>新增测点字典</span>
              </h3>
              <button onClick={() => setShowAddPointModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">测点业务名称：</label>
                  <input
                    type="text"
                    placeholder="如: C相逆变电流"
                    value={newPointForm.pointName}
                    onChange={(e) => setNewPointForm({ ...newPointForm, pointName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">标准编码 (Code)：</label>
                  <input
                    type="text"
                    placeholder="如: PV_CURRENT_C"
                    value={newPointForm.standardCode}
                    onChange={(e) => setNewPointForm({ ...newPointForm, standardCode: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">归属设备：</label>
                  <select
                    value={newPointForm.deviceId}
                    onChange={(e) => setNewPointForm({ ...newPointForm, deviceId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  >
                    {devices.filter(d => d.status !== 'DISABLED').map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">计量单位：</label>
                  <input
                    type="text"
                    value={newPointForm.unit}
                    onChange={(e) => setNewPointForm({ ...newPointForm, unit: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">第三方物理字段 (Tag)：</label>
                <input
                  type="text"
                  placeholder="如: modbus.current_c"
                  value={newPointForm.thirdPartyField}
                  onChange={(e) => setNewPointForm({ ...newPointForm, thirdPartyField: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 font-sans">
              <button
                onClick={() => setShowAddPointModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!newPointForm.standardCode || !newPointForm.pointName) {
                    alert('请填写测点标准编码与业务名称');
                    return;
                  }
                  addPoint(newPointForm);
                  setShowAddPointModal(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-[#004287] hover:bg-[#003366] text-white font-medium shadow-xs"
              >
                确认新增测点
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: 新增指标 ======================= */}
      {showAddMetricModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#004287]" />
                <span>新增标准指标</span>
              </h3>
              <button onClick={() => setShowAddMetricModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">指标名称：</label>
                  <input
                    type="text"
                    placeholder="如: 总发电效率"
                    value={newMetricForm.name}
                    onChange={(e) => setNewMetricForm({ ...newMetricForm, name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">指标编码 (Code)：</label>
                  <input
                    type="text"
                    placeholder="如: TOTAL_EFFICIENCY"
                    value={newMetricForm.code}
                    onChange={(e) => setNewMetricForm({ ...newMetricForm, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">计算口径表达式：</label>
                <textarea
                  rows={2}
                  placeholder="如: SUM(pv_power) / CAPACITY"
                  value={newMetricForm.calculationLogic}
                  onChange={(e) => setNewMetricForm({ ...newMetricForm, calculationLogic: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">聚合周期：</label>
                  <select
                    value={newMetricForm.aggregationPeriod}
                    onChange={(e) => setNewMetricForm({ ...newMetricForm, aggregationPeriod: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="REALTIME">实时 (REALTIME)</option>
                    <option value="5MIN">5分钟 (5MIN)</option>
                    <option value="HOURLY">小时 (HOURLY)</option>
                    <option value="DAILY">日 (DAILY)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">计量单位：</label>
                  <input
                    type="text"
                    value={newMetricForm.unit}
                    onChange={(e) => setNewMetricForm({ ...newMetricForm, unit: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 font-sans">
              <button
                onClick={() => setShowAddMetricModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!newMetricForm.name || !newMetricForm.code) {
                    alert('请填写指标名称与编码');
                    return;
                  }
                  addMetric(newMetricForm);
                  setShowAddMetricModal(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-[#004287] hover:bg-[#003366] text-white font-medium shadow-xs"
              >
                确认新增指标
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= 抽屉 1: 设备详情抽屉 ======================= */}
      <DetailDrawer
        isOpen={Boolean(selectedDevice)}
        onClose={() => setSelectedDevice(null)}
        title={selectedDevice?.name || '设备详情'}
        subTitle={`设备ID: ${selectedDevice?.id} · 厂商: ${selectedDevice?.manufacturer}`}
      >
        {selectedDevice && (
          <div className="space-y-5 text-xs font-sans">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">设备类型:</span>
                <span className="font-bold text-slate-900">{selectedDevice.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">型号规格:</span>
                <span className="text-slate-800">{selectedDevice.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">额定容量:</span>
                <span className="text-slate-800">{selectedDevice.ratedCapacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">来源适配平台:</span>
                <span className="font-bold text-blue-700">{selectedDevice.sourcePlatform || selectedDevice.sourceAdapterId || '未对接'}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">该设备下辖测点列表：</h4>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {points.filter(p => p.deviceId === selectedDevice.id).map((pt) => (
                  <div key={pt.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between font-mono text-[11px]">
                    <div>
                      <div className="font-bold text-slate-800">{pt.pointName}</div>
                      <div className="text-slate-400 text-[10px]">{pt.standardCode}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-blue-700">{pt.currentValue ?? '--'} {pt.unit}</div>
                      <span className={`text-[10px] ${pt.mappingStatus === 'MAPPED' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {pt.mappingStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isAdmin && (
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
                <span className="font-bold text-blue-900 block">管理员快捷编辑来源平台 (Update)：</span>
                <input
                  type="text"
                  placeholder="如: huawei_pv_cloud_api"
                  defaultValue={selectedDevice.sourcePlatform || ''}
                  onBlur={(e) => {
                    updateDevice(selectedDevice.id, { sourcePlatform: e.target.value });
                  }}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg outline-none text-xs"
                />
              </div>
            )}
          </div>
        )}
      </DetailDrawer>

      {/* ======================= 抽屉 2: 测点详情抽屉 ======================= */}
      <DetailDrawer
        isOpen={Boolean(selectedPoint)}
        onClose={() => setSelectedPoint(null)}
        title={selectedPoint?.pointName || '测点详情'}
        subTitle={`标准编码: ${selectedPoint?.standardCode} · 归属设备: ${selectedPoint?.deviceId}`}
      >
        {selectedPoint && (
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">标准编码:</span>
                <span className="font-bold text-slate-800">{selectedPoint.standardCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">第三方物理字段:</span>
                <span className="text-slate-800">{selectedPoint.thirdPartyField || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">当前实时值:</span>
                <span className="font-bold text-blue-700">{selectedPoint.currentValue ?? '--'} {selectedPoint.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">数据质量等级:</span>
                <QualityTag level={selectedPoint.currentQuality} showDesc />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">映射状态:</span>
                <span className={selectedPoint.mappingStatus === 'MAPPED' ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                  {selectedPoint.mappingStatus}
                </span>
              </div>
            </div>

            {isAdmin && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 font-mono">
                <h4 className="font-bold text-slate-900 font-sans">管理员配置测点 (Update)：</h4>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">映射状态：</label>
                  <select
                    defaultValue={selectedPoint.mappingStatus}
                    onChange={(e) => updatePoint(selectedPoint.id, { mappingStatus: e.target.value as any })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                  >
                    <option value="MAPPED">MAPPED (已映射生效)</option>
                    <option value="PENDING">PENDING (待确认)</option>
                    <option value="UNMAPPED">UNMAPPED (未映射)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">上限 (upperLimit)：</label>
                  <input
                    type="number"
                    defaultValue={selectedPoint.upperLimit ?? 1000}
                    onBlur={(e) => updatePoint(selectedPoint.id, { upperLimit: Number(e.target.value) })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>

      {/* ======================= MODAL: 指标修改弹窗 ======================= */}
      {editingMetric && selectedMetric && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#004287]" />
                <span>编辑标准指标口径: {selectedMetric.name}</span>
              </h3>
              <button onClick={() => setEditingMetric(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">计算表达式：</label>
                <textarea
                  rows={3}
                  value={metricForm.calculationLogic || ''}
                  onChange={(e) => setMetricForm({ ...metricForm, calculationLogic: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs outline-none focus:border-[#004287]"
                />
              </div>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2 text-amber-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>下游影响评估提示：</span>
                </div>
                <ul className="list-disc list-inside text-[11px] space-y-1 font-mono text-amber-900">
                  {selectedMetric.downstreamUsage.map((u: string, idx: number) => (
                    <li key={idx}><strong>{u}</strong></li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 font-sans">
              <button
                onClick={() => setEditingMetric(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs"
              >
                取消
              </button>
              <button
                onClick={() => {
                  updateMetric(selectedMetric.id, metricForm);
                  setEditingMetric(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#004287] hover:bg-[#003366] text-white font-medium text-xs shadow-xs"
              >
                确认修改口径
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: 批量导入 ======================= */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#004287]" />
                <span>测点字典批量导入与校验预览</span>
              </h3>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-600">
                请输入或粘贴 CSV 数据行（格式：<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">标准编码, 测点名称, 设备ID, 单位, 数据类型, 第三方字段</code>）：
              </p>
              <textarea
                rows={5}
                placeholder="PV_ACTIVE_GEN_02, 光伏逆变器2号有功, DEV-PV-01, kW, FLOAT, modbus.inv_p2&#10;ESS_SOC_02, 储能电池舱2号SOC, DEV-ESS-01, %, FLOAT, modbus.soc_2"
                value={batchRawText}
                onChange={(e) => setBatchRawText(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs outline-none focus:border-[#004287]"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviewBatch}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs shadow-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>执行预览与校验</span>
                </button>
              </div>

              {batchImportError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>校验发现错误：</span>
                  </div>
                  <p className="font-mono text-[11px]">{batchImportError}</p>
                </div>
              )}

              {batchPreviewResult && batchPreviewResult.errors.length > 0 && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs space-y-1 max-h-40 overflow-y-auto">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>预览发现以下不合规项：</span>
                  </div>
                  <ul className="list-disc list-inside font-mono text-[11px] space-y-1">
                    {batchPreviewResult.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {batchPreviewResult && batchPreviewResult.isValid && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                  ✓ 校验通过！共解析出 {batchPreviewResult.rows.length} 个合法点位。
                </div>
              )}

              {batchSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                  {batchSuccessMsg}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 font-sans">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs"
              >
                关闭
              </button>
              {batchPreviewResult && batchPreviewResult.isValid && (
                <button
                  onClick={executeBatchImport}
                  className="px-4 py-2 rounded-lg bg-[#004287] hover:bg-[#003366] text-white font-medium text-xs shadow-xs"
                >
                  确认批量导入
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 新增站点模态框 */}
      {showAddSiteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#004287]" />
                <span>新增多能互补低碳园区试点站点</span>
              </h3>
              <button
                onClick={() => setShowAddSiteModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">站点名称：</label>
                <input
                  type="text"
                  placeholder="例如：厦门科技园低碳微电网示范站"
                  value={newSiteForm.name}
                  onChange={(e) => setNewSiteForm({ ...newSiteForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-[#004287]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">站点编码 (Code)：</label>
                  <input
                    type="text"
                    placeholder="例如：SITE-XM-002"
                    value={newSiteForm.code}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, code: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-[#004287]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">运行状态：</label>
                  <select
                    value={newSiteForm.status}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, status: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-[#004287]"
                  >
                    <option value="ONLINE">ONLINE (在线运行)</option>
                    <option value="WARNING">WARNING (预警状态)</option>
                    <option value="OFFLINE">OFFLINE (离线调试)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">地理位置与地址：</label>
                <input
                  type="text"
                  placeholder="例如：福建省厦门市湖里区高新技术园"
                  value={newSiteForm.location}
                  onChange={(e) => setNewSiteForm({ ...newSiteForm, location: e.target.value, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-[#004287]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">光伏装机容量：</label>
                  <input
                    type="text"
                    value={newSiteForm.pvCapacity}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, pvCapacity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-[#004287]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">储能额定功率与容量：</label>
                  <input
                    type="text"
                    value={newSiteForm.storageCapacity}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, storageCapacity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-[#004287]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">充电桩数量：</label>
                  <input
                    type="number"
                    value={newSiteForm.chargerCount}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, chargerCount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-[#004287]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">并网电压：</label>
                  <input
                    type="text"
                    value={newSiteForm.gridVoltage}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, gridVoltage: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-[#004287]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">变压器容量：</label>
                  <input
                    type="text"
                    value={newSiteForm.transformerCapacity}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, transformerCapacity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-[#004287]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddSiteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!newSiteForm.name || !newSiteForm.code) {
                    alert('请输入站点名称和编码！');
                    return;
                  }
                  addSite({
                    name: newSiteForm.name,
                    code: newSiteForm.code,
                    location: newSiteForm.location || '福建省',
                    address: newSiteForm.address || newSiteForm.location,
                    pvCapacity: newSiteForm.pvCapacity,
                    storageCapacity: newSiteForm.storageCapacity,
                    chargerCount: newSiteForm.chargerCount,
                    gridVoltage: newSiteForm.gridVoltage,
                    transformerCapacity: newSiteForm.transformerCapacity,
                    commissioningDate: newSiteForm.commissioningDate,
                    status: newSiteForm.status,
                  });
                  setShowAddSiteModal(false);
                  setNewSiteForm({
                    name: '',
                    code: '',
                    location: '',
                    address: '',
                    pvCapacity: '1.2 MWp',
                    storageCapacity: '500 kW / 1000 kWh',
                    chargerCount: 12,
                    gridVoltage: '10kV',
                    transformerCapacity: '2000 kVA',
                    commissioningDate: '2026-06-01',
                    status: 'ONLINE',
                  });
                }}
                className="px-4 py-2 rounded-xl bg-[#004287] hover:bg-[#003366] text-white font-medium shadow-xs"
              >
                确认创建站点
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
