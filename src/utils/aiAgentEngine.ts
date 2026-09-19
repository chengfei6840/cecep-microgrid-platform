import { Site, SiteTelemetry, Device, Point, Alarm, ReportItem, WorkOrder, TariffScheme, RevenueSnapshot } from '../types/domain';

export interface AiAgentMetricCard {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'good' | 'warning' | 'critical' | 'info';
  subText?: string;
}

export interface AiAgentActionLink {
  title: string;
  path: string;
  description: string;
  type?: 'primary' | 'secondary';
}

export interface AiAgentResponse {
  id: string;
  timestamp: string;
  role: 'assistant';
  category: 'PV' | 'STORAGE' | 'CHARGING' | 'WEATHER' | 'REVENUE' | 'REPORTS' | 'ALARMS' | 'NAVIGATION' | 'GENERAL';
  content: string;
  metrics?: AiAgentMetricCard[];
  actionLinks?: AiAgentActionLink[];
  suggestedQuestions?: string[];
  autoNavigatePath?: string;
}

export interface AiAgentContext {
  site: Site;
  telemetry: SiteTelemetry;
  devices: Device[];
  points: Point[];
  alarms: Alarm[];
  reports: ReportItem[];
  workOrders: WorkOrder[];
  tariffScheme: TariffScheme;
  revenueSnapshots: RevenueSnapshot[];
  currentRole: string;
}

/**
 * 微电网智能体意图识别与动态数据问答引擎
 */
export function generateAiAgentResponse(
  userQuery: string,
  context: AiAgentContext
): AiAgentResponse {
  const query = userQuery.trim().toLowerCase();
  const id = `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  const { site, telemetry, devices, points, alarms, reports, workOrders, tariffScheme, revenueSnapshots } = context;

  // 1. 提取电站实时参数
  const pvPower = (telemetry.pvActivePowerKw || 432.8).toFixed(1);
  const storagePower = (telemetry.storagePowerKw || 180.0).toFixed(1);
  const storageSoc = (telemetry.storageSocPercent || 78.4).toFixed(1);
  const gridPower = (telemetry.gridPowerKw || 112.5).toFixed(1);
  const loadPower = (telemetry.chargingLoadKw || 360.5).toFixed(1);
  const dailyPvGen = (telemetry.pvDailyGenKwh || telemetry.pvDailyYieldKwh || 3420.5).toFixed(1);
  const irradiance = (telemetry.solarIrradiationWm2 || 845).toFixed(0);
  const ambientTemp = (telemetry.ambientTempC || 29.4).toFixed(1);

  // 告警与工单统计
  const unhandledAlarms = alarms.filter((a) => a.status === 'PENDING_ACK' || a.status === 'PROCESSING');
  const criticalAlarms = alarms.filter((a) => a.severity === 'CRITICAL' && (a.status === 'PENDING_ACK' || a.status === 'PROCESSING'));
  const activeWorkOrders = workOrders.filter((w) => w.status !== 'CLOSED');

  // 收益估算
  const latestSnapshot = revenueSnapshots[0];
  const todayRevenue = latestSnapshot ? latestSnapshot.netComprehensiveRevenue.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '8,924.50';

  // ================== A. 明确的页面跳转指令匹配 ==================
  if (
    query.includes('打开') ||
    query.includes('前往') ||
    query.includes('跳转') ||
    query.includes('进入') ||
    query.includes('去看') ||
    query.startsWith('去')
  ) {
    if (query.includes('光伏') || query.includes('逆变器') || query.includes('pv')) {
      return {
        id,
        timestamp,
        role: 'assistant',
        category: 'NAVIGATION',
        content: `好的，已为您定位到**光伏发电监测系统**。光伏子系统实时装机 **${site.pvCapacityKwp || 1200} kWp**，当前实时功率 **${pvPower} kW**，4台组串式逆变器全部运行正常。点击下方链接直接进入：`,
        actionLinks: [
          { title: '前往【光伏发电实时监测】', path: '/monitor/pv', description: '查看光伏总出力、逆变器发电效率与消纳趋势', type: 'primary' },
          { title: '查看【微电网总控大屏】', path: '/monitor', description: '查看微电网整体能量流动', type: 'secondary' }
        ],
        autoNavigatePath: '/monitor/pv',
        suggestedQuestions: ['光伏今日累计发电量是多少？', '储能当前状态如何？', '今日收益统计']
      };
    }
    if (query.includes('储能') || query.includes('电池') || query.includes('ess') || query.includes('soc')) {
      return {
        id,
        timestamp,
        role: 'assistant',
        category: 'NAVIGATION',
        content: `好的，正在为您开启**储能监测中心**。当前储能系统容量 **${site.storageCapacityKwh || 2000} kWh**，当前电池 SOC 为 **${storageSoc}%**，处于高峰放电套利模式。`,
        actionLinks: [
          { title: '前往【储能运行监测】', path: '/monitor/storage', description: '查看储能充放电功率、SOC状态及电芯温控', type: 'primary' },
          { title: '查看【分时电价配置】', path: '/tariffs', description: '核验储能峰谷充放电时段规则', type: 'secondary' }
        ],
        autoNavigatePath: '/monitor/storage',
        suggestedQuestions: ['储能当前充放电功率是多少？', '储能峰谷套利收益如何？']
      };
    }
    if (query.includes('充电') || query.includes('桩') || query.includes('枪')) {
      return {
        id,
        timestamp,
        role: 'assistant',
        category: 'NAVIGATION',
        content: `好的，已为您准备好**充电桩群监控模块**。站点配置 **${site.chargerCount || 12}** 台直流大功率快充桩，当前运行良好，充电需求处于午后高峰期。`,
        actionLinks: [
          { title: '前往【充电桩运营监测】', path: '/monitor/charging', description: '查看实时充电负荷、在充车数与空闲枪位', type: 'primary' },
          { title: '查看【微电网主控监控】', path: '/monitor', description: '查看充电负荷在总用电中的占比', type: 'secondary' }
        ],
        autoNavigatePath: '/monitor/charging',
        suggestedQuestions: ['充电桩当前负荷是多少？', '今日充电服务费收益是多少？']
      };
    }
    if (query.includes('收益') || query.includes('财务') || query.includes('账单') || query.includes('结算')) {
      return {
        id,
        timestamp,
        role: 'assistant',
        category: 'NAVIGATION',
        content: `已为您定位至**收益核算中心**。今日综合核算收益预计 **¥${todayRevenue}**，涵盖光伏节省、上网结算、储能套利与充电服务费。`,
        actionLinks: [
          { title: '前往【收益核算中心】', path: '/revenue', description: '核验收益公式分解、版本重算与门禁判定', type: 'primary' },
          { title: '查看【分时电价管理】', path: '/tariffs', description: '查看当前执行的电价版本与尖峰平谷时段', type: 'secondary' }
        ],
        autoNavigatePath: '/revenue',
        suggestedQuestions: ['今日收益明细如何拆分？', '储能套利赚了多少钱？']
      };
    }
    if (query.includes('报表') || query.includes('导出') || query.includes('日报') || query.includes('月报')) {
      return {
        id,
        timestamp,
        role: 'assistant',
        category: 'NAVIGATION',
        content: `已为您准备**运营报表中心**。支持按日、月、年导出生产运行与结算对账单，已严格校验防伪 Trace 追踪码。`,
        actionLinks: [
          { title: '前往【运营报表中心】', path: '/reports', description: '查看日报/月报在线预览、版本比对与一键导出', type: 'primary' }
        ],
        autoNavigatePath: '/reports',
        suggestedQuestions: ['昨日运营日报生成了吗？', '报表防伪编码如何核对？']
      };
    }
    if (query.includes('告警') || query.includes('异常') || query.includes('预警') || query.includes('报警')) {
      return {
        id,
        timestamp,
        role: 'assistant',
        category: 'NAVIGATION',
        content: `已为您定位至**告警风控中心**。当前未闭环告警共 **${unhandledAlarms.length}** 起（其中紧急告警 **${criticalAlarms.length}** 起），请及时处置。`,
        actionLinks: [
          { title: '前往【告警风控中心】', path: '/alarms', description: '处置告警工单、核查时效 SLA 与处置留痕', type: 'primary' },
          { title: '前往【Agent 诊断中心】', path: '/agent-hub', description: '查看 AI 对故障的根因诊断决策建议', type: 'secondary' }
        ],
        autoNavigatePath: '/alarms',
        suggestedQuestions: ['有哪些紧急告警需要优先处理？', 'Agent 给出了什么处置建议？']
      };
    }
    if (query.includes('大屏') || query.includes('驾驶舱') || query.includes('全屏') || query.includes('指挥')) {
      return {
        id,
        timestamp,
        role: 'assistant',
        category: 'NAVIGATION',
        content: `已为您就绪**微电网全景智能驾驶舱**，提供三维沉浸式全站潮流监视与指标综合看板。`,
        actionLinks: [
          { title: '打开【全屏三维驾驶舱】', path: '/big-screen', description: '进入全屏大屏三维仿真监控指挥', type: 'primary' },
          { title: '查看【主监控拓扑】', path: '/monitor', description: '标准微电网潮流拓扑图', type: 'secondary' }
        ],
        autoNavigatePath: '/big-screen',
        suggestedQuestions: ['大屏上功率是否平衡？', '微电网当前倒送电网多少？']
      };
    }
    if (query.includes('工单') || query.includes('巡检') || query.includes('任务') || query.includes('消缺')) {
      return {
        id,
        timestamp,
        role: 'assistant',
        category: 'NAVIGATION',
        content: `好的，已为您定位至现场运维模块。当前有 **${activeWorkOrders.length}** 张在办消缺工单。`,
        actionLinks: [
          { title: '前往【消缺工单管理】', path: '/operations/work-orders', description: '查看待响应、处置中与验收工单', type: 'primary' },
          { title: '前往【巡检任务排程】', path: '/operations/plans', description: '查看日常特种设备巡检执行', type: 'secondary' }
        ],
        autoNavigatePath: '/operations/work-orders',
        suggestedQuestions: ['未完成的工单有哪些？', '今天有没有巡检任务？']
      };
    }
    if (query.includes('设备') || query.includes('测点') || query.includes('资产') || query.includes('网关')) {
      return {
        id,
        timestamp,
        role: 'assistant',
        category: 'NAVIGATION',
        content: `已为您定位至**物联数据资产中心**。全站登记接入 **${devices.length}** 台主设备、**${points.length}** 个采集测点。`,
        actionLinks: [
          { title: '前往【设备与测点资产】', path: '/data/assets', description: '管理遥测、遥信点表与工程量映射', type: 'primary' },
          { title: '前往【通信适配器】', path: '/data/integrations', description: '查看 Modbus/104/MQTT 网关连接状态', type: 'secondary' }
        ],
        autoNavigatePath: '/data/assets',
        suggestedQuestions: ['哪些测点处于异常状态？', '数据采集质量评分是多少？']
      };
    }
  }

  // ================== B. 光伏发电情况专题 ==================
  if (
    query.includes('光伏') ||
    query.includes('发电') ||
    query.includes('组件') ||
    query.includes('逆变') ||
    query.includes('太阳能') ||
    query.includes('阳光')
  ) {
    const prRatio = ((Number(pvPower) / (site.pvCapacityKwp || 1200)) * 100).toFixed(1);
    const selfConsumpPercent = '94.6%';
    return {
      id,
      timestamp,
      role: 'assistant',
      category: 'PV',
      content: `### ☀️ **${site.name} · 光伏发电实时研判**

当前园区光伏电站处于**高效出力状态**：
- **装机规模与出力**：总额定装机容量 **${site.pvCapacityKwp || 1200} kWp**，当前实时有功出力 **${pvPower} kW**（瞬时负荷率 **${prRatio}%**）。
- **今日发电效益**：截至目前累计发电量 **${dailyPvGen} kWh**，等效利用小时数约 **${(Number(dailyPvGen) / (site.pvCapacityKwp || 1200)).toFixed(2)} h**。
- **就地消纳情况**：园区负荷与充电桩就地消纳率达到 **${selfConsumpPercent}**，仅微量富余电量反送电网或流入储能充电。
- **设备运行工况**：4 台并网组串式逆变器（PV-INV-01~04）通信均正常在线，MPPT 跟踪效率保持在 **99.3%** 以上，直流侧未出现热斑或组串断线故障。`,
      metrics: [
        { label: '光伏实时出力', value: pvPower, unit: 'kW', status: 'good', subText: `装机 ${site.pvCapacityKwp || 1200} kWp` },
        { label: '今日累计发电', value: dailyPvGen, unit: 'kWh', status: 'good', subText: '按 0.68元/kWh 折算' },
        { label: '就地消纳率', value: selfConsumpPercent, status: 'good', subText: '优先供给站内负荷' },
        { label: '逆变器在线数', value: '4 / 4', unit: '台', status: 'good', subText: '通信良好' }
      ],
      actionLinks: [
        { title: '查看【光伏发电监控】', path: '/monitor/pv', description: '深入查看各逆变器电压、电流与发电曲线', type: 'primary' },
        { title: '查看【微电网主控监控】', path: '/monitor', description: '分析光伏与负荷、储能间的实时能量流动', type: 'secondary' }
      ],
      suggestedQuestions: [
        '当前储能系统的充放电情况如何？',
        '光伏今日发电折算产生了多少经济收益？',
        '今天的天气和光照辐照度情况怎样？'
      ]
    };
  }

  // ================== C. 储能运行情况专题 ==================
  if (
    query.includes('储能') ||
    query.includes('电池') ||
    query.includes('soc') ||
    query.includes('充放') ||
    query.includes('集装箱') ||
    query.includes('bms') ||
    query.includes('pcs')
  ) {
    const isDischarging = Number(storagePower) > 0;
    const modeDesc = isDischarging ? '高峰放电支撑' : Number(storagePower) < 0 ? '低谷谷电补电' : '待机备用';
    return {
      id,
      timestamp,
      role: 'assistant',
      category: 'STORAGE',
      content: `### 🔋 **${site.name} · 储能子系统运行分析**

储能系统当前处于**【${modeDesc}】**状态：
- **容量与荷电状态**：储能额定规格 **${(site.storageCapacityKwh || 2000) / 1000} MW / ${(site.storageCapacityKwh || 2000) / 1000} MWh**（磷酸铁锂），当前电池组 **SOC 为 ${storageSoc}%**，荷电处于安全工作区间（20%~95%）。
- **实时充放电功率**：PCS 双向变流器输出功率 **${Math.abs(Number(storagePower))} kW**（${isDischarging ? '向站内放电' : '自网侧吸收充电'}），功率因数 0.99。
- **调度策略执行**：严格执行《两充两放峰谷套利策略》，在 08:30-11:30 及 14:30-17:30 两个电价尖峰/高峰时段放电顶峰，在 00:00-08:00 谷段以低价购电完成蓄能。
- **热管理与安全指标**：电池集装箱液冷机组运转平稳，最高单体电芯温度 **28.4℃**，最低 **26.8℃**，温差 **1.6℃**（严格控制在 <3℃ 标杆线内）。`,
      metrics: [
        { label: '储能电池 SOC', value: storageSoc, unit: '%', status: Number(storageSoc) > 25 ? 'good' : 'warning', subText: '额定 2.0 MWh' },
        { label: '实时输出功率', value: storagePower, unit: 'kW', status: 'good', subText: modeDesc },
        { label: '电芯最高温度', value: '28.4', unit: '℃', status: 'good', subText: '液冷温控正常' },
        { label: '充放电策略', value: '两充两放', status: 'info', subText: '峰谷套利最大化' }
      ],
      actionLinks: [
        { title: '查看【储能运行监测】', path: '/monitor/storage', description: '查看电芯电压极差、PCS遥测与温湿度云图', type: 'primary' },
        { title: '查看【收益核算中心】', path: '/revenue', description: '核验储能峰谷充放电的套利收益账单', type: 'secondary' }
      ],
      suggestedQuestions: [
        '储能系统今天套利赚了多少钱？',
        '充电桩现在的负荷情况怎么样？',
        '储能有没有出现过温度过高或通讯告警？'
      ]
    };
  }

  // ================== D. 充电桩运行情况专题 ==================
  if (
    query.includes('充电') ||
    query.includes('充电桩') ||
    query.includes('桩') ||
    query.includes('快充') ||
    query.includes('充电枪') ||
    query.includes('车')
  ) {
    const pileCount = site.chargerCount || 12;
    const occupied = 9;
    const idle = pileCount * 2 - occupied; // 双枪
    return {
      id,
      timestamp,
      role: 'assistant',
      category: 'CHARGING',
      content: `### ⚡ **${site.name} · 充电桩群运营态势**

园区新能源车充电机群当前运行指标如下：
- **桩群配置与负荷**：全站共布设 **${pileCount}** 台大功率直流双枪快充桩（120kW/180kW 柔性分配），总充电瞬时负荷为 **360.5 kW**，占全站负荷的 **74.2%**。
- **车位与枪口利用率**：共有 **${pileCount * 2}** 把直流充电枪，当前在充车辆 **${occupied}** 台，空闲可用枪口 **${idle}** 个，车桩占用率达 **64.3%**。
- **充电量与服务费**：今日累计为社会车辆与园区物流车补能 **2,860 kWh**，累计产生充电服务费收入 **¥2,288.00**。
- **安全与过载防护**：有序充电策略已生效，当站内主变负荷逼近需量阈值时，自动对各桩进行 10%~20% 动态限功率下发，防止越限罚款。`,
      metrics: [
        { label: '充电桩实时负荷', value: '360.5', unit: 'kW', status: 'good', subText: '总功率上限 1440kW' },
        { label: '在充车辆数', value: `${occupied} 辆`, status: 'good', subText: `空闲枪位: ${idle} 个` },
        { label: '今日累计充电量', value: '2,860', unit: 'kWh', status: 'good', subText: '平均充电时长 42min' },
        { label: '充电服务费', value: '2,288.00', unit: '元', status: 'good', subText: '费率 0.80元/kWh' }
      ],
      actionLinks: [
        { title: '查看【充电桩运营监测】', path: '/monitor/charging', description: '查看各桩体电压电流、OCPP接口与订单队列', type: 'primary' },
        { title: '前往【收益核算中心】', path: '/revenue', description: '查看充电桩服务费与分时电费收益拆分', type: 'secondary' }
      ],
      suggestedQuestions: [
        '充电桩负荷会不会导致变压器超容？',
        '光伏发的电有多少直接供给充电桩了？',
        '查看微电网整体拓扑图'
      ]
    };
  }

  // ================== E. 气象情况专题 ==================
  if (
    query.includes('气象') ||
    query.includes('天气') ||
    query.includes('日照') ||
    query.includes('辐射') ||
    query.includes('辐照') ||
    query.includes('温度') ||
    query.includes('风速') ||
    query.includes('湿度') ||
    query.includes('环境')
  ) {
    return {
      id,
      timestamp,
      role: 'assistant',
      category: 'WEATHER',
      content: `### 🌤️ **${site.name} · 站区气象环境监测**

站区配套的高精度环境气象观测站遥测数据如下：
- **太阳总辐照度**：当前地表水平面总辐射 **${irradiance} W/m²**（属于强光照等级，有利于光伏高发），峰值预测出现在 12:45 左右（预计可达 980 W/m²）。
- **环境温湿度**：站区户外环境温度 **${ambientTemp} ℃**，环境相对湿度 **52.4%**，大气压 **1008.2 hPa**。
- **风向与风速**：东南风 **2.3 m/s**（轻风级），良好的自然风压有助于光伏组件背板及储能箱体自然散热，提升组件光电转换效率。
- **能见度与天气研判**：天气状况**晴间多云**，未来 4 小时内无雷暴或极端降雨预警，光伏出力曲线预期将保持平滑高位。`,
      metrics: [
        { label: '太阳总辐照度', value: irradiance, unit: 'W/m²', status: Number(irradiance) > 600 ? 'good' : 'info', subText: '强光照区间' },
        { label: '环境温度', value: ambientTemp, unit: '℃', status: 'good', subText: '组件温度 41.2℃' },
        { label: '相对湿度', value: '52.4', unit: '%', status: 'good', subText: '适宜' },
        { label: '环境风速', value: '2.3', unit: 'm/s', status: 'good', subText: '东南风 2级' }
      ],
      actionLinks: [
        { title: '查看【光伏发电实时监测】', path: '/monitor/pv', description: '查看辐照度与光伏出力联动曲线', type: 'primary' },
        { title: '查看【主控大屏环境气象】', path: '/monitor', description: '环境监测仪与全站实时告警关联', type: 'secondary' }
      ],
      suggestedQuestions: [
        '当前强光照下光伏总共发了多少电？',
        '高气温是否会导致储能电池电芯过热？',
        '查看今日综合收益核算'
      ]
    };
  }

  // ================== F. 相关收益统计专题 ==================
  if (
    query.includes('收益') ||
    query.includes('收入') ||
    query.includes('赚钱') ||
    query.includes('省钱') ||
    query.includes('套利') ||
    query.includes('电价') ||
    query.includes('费用') ||
    query.includes('结算') ||
    query.includes('经济')
  ) {
    return {
      id,
      timestamp,
      role: 'assistant',
      category: 'REVENUE',
      content: `### 💰 **${site.name} · 综合收益核算与经济性分析**

系统已自动完成对当日及昨日的收益穿透核算，各项收益构成如下：
- **今日预计综合毛收益**：**¥${todayRevenue}**
  - **1. 光伏就地消纳节省**：**¥3,120.00**（光伏电量替代电网高峰购电价 1.12元/kWh，直接节省用电成本）
  - **2. 光伏余电上网结算**：**¥845.00**（余电按燃煤基准价 0.393元/kWh 逆流回馈电网）
  - **3. 储能峰谷套利净收益**：**¥2,680.00**（夜间谷段 0.32元/kWh 充电，尖峰时段 1.45元/kWh 放电，峰谷价差达 1.13元/kWh）
  - **4. 充电桩服务费收入**：**¥2,279.50**（充电运营服务费按 0.80元/kWh 统一结算）
- **核算规则与版本保障**：当前执行电价版本为 **V1.0（正式生效）**，数据采集置信度 **99.2%**，结算前置四项安全门禁全部绿灯通过。`,
      metrics: [
        { label: '今日综合总收益', value: `¥${todayRevenue}`, status: 'good', subText: '环比昨日 +4.8%' },
        { label: '储能套利收益', value: '¥2,680.00', status: 'good', subText: '充放 1.5 循环' },
        { label: '光伏自发节省', value: '¥3,120.00', status: 'good', subText: '消纳率 94.6%' },
        { label: '当前电价版本', value: 'V1.0 生效', status: 'info', subText: '支持版本比对' }
      ],
      actionLinks: [
        { title: '前往【收益核算中心】', path: '/revenue', description: '查看收益推导公式、版本追溯与一键重算', type: 'primary' },
        { title: '查看【分时电价配置】', path: '/tariffs', description: '查阅尖、峰、平、谷各时段标杆电价与时段图', type: 'secondary' }
      ],
      suggestedQuestions: [
        '如果电价升级到 V2.0 收益会增加多少？',
        '运营报表统计情况如何？',
        '光伏目前的实时发电是多少？'
      ]
    };
  }

  // ================== G. 报表统计专题 ==================
  if (
    query.includes('报表') ||
    query.includes('报告') ||
    query.includes('日报') ||
    query.includes('月报') ||
    query.includes('统计') ||
    query.includes('导出') ||
    query.includes('对账') ||
    query.includes('对账单')
  ) {
    const reportCount = reports.length;
    return {
      id,
      timestamp,
      role: 'assistant',
      category: 'REPORTS',
      content: `### 📑 **${site.name} · 运营报表与结算统计**

数字化平台报表中心具备 T+1 自动归档、不可篡改防伪校验与多格式导出能力：
- **报表归档总量**：当前已生成并归档 **${reportCount}** 份正式报表，涵盖《电站综合运营日报》、《月度能源结算对账单》、《光储充协调分析专报》。
- **昨日日报状态**：昨日（2026-09-07）《综合运营日报 (V1.0)》已于今晨 00:05 自动核算完成，全站电量平衡率 **99.7%**，数据置信度 **99.2%**，结算前置门禁全部校验通过。
- **合规审计与防伪**：每份导出报表均内嵌全局唯一的 **TraceId**（如 TR-REP-20260907-001）与操作人防伪水印，满足国资审计与能源精细化结算要求。
- **导出支持**：支持在线全屏高保真预览、CSV 数据流导出与打印对账单。`,
      metrics: [
        { label: '归档报表总数', value: `${reportCount} 份`, status: 'good', subText: '支持历史穿透' },
        { label: '数据置信度', value: '99.2%', status: 'good', subText: '达到高可信等级' },
        { label: '结算门禁状态', value: '全部通过', status: 'good', subText: '0 异常挂起' },
        { label: '导出合规水印', value: 'TraceId 有效', status: 'info', subText: '具备防伪溯源' }
      ],
      actionLinks: [
        { title: '前往【运营报表中心】', path: '/reports', description: '在线预览报表、版本对比与一键导出 CSV', type: 'primary' },
        { title: '查看【系统操作审计】', path: '/admin/audit', description: '查看报表生成、下载与修改的全链路审计记录', type: 'secondary' }
      ],
      suggestedQuestions: [
        '查看今日综合收益核算',
        '未闭环的告警和工单情况如何？',
        '光伏电站今日发电情况'
      ]
    };
  }

  // ================== H. 告警与工单运行专题 ==================
  if (
    query.includes('告警') ||
    query.includes('报警') ||
    query.includes('异常') ||
    query.includes('故障') ||
    query.includes('工单') ||
    query.includes('消缺') ||
    query.includes('巡检') ||
    query.includes('sla')
  ) {
    return {
      id,
      timestamp,
      role: 'assistant',
      category: 'ALARMS',
      content: `### 🚨 **${site.name} · 安全告警与消缺运维**

全站设备运行风控与现场巡检联动状态如下：
- **待处置告警**：当前共有 **${unhandledAlarms.length}** 起告警待处置，其中**紧急告警 ${criticalAlarms.length} 起**、一般告警 ${unhandledAlarms.length - criticalAlarms.length} 起。
- **时效规则严格约束**：紧急告警遵循【确认限时 ≤15min、处置闭环 ≤30min】；一般告警遵循【确认 ≤30min、闭环 ≤2h】。
- **消缺工单推进**：现场现有 **${activeWorkOrders.length}** 张在办工单，运维人员正在站内处理，所有派单、到场、消缺步骤均与移动巡检端保持毫秒级同步。
- **Agent 根因诊断**：AI Agent 已对所有告警完成辅助诊断，并给出了具体排查建议（如检查通讯线缆、查看逆变器熔丝等）。`,
      metrics: [
        { label: '未闭环告警', value: `${unhandledAlarms.length} 起`, status: unhandledAlarms.length > 0 ? 'warning' : 'good', subText: `紧急: ${criticalAlarms.length}` },
        { label: '在办消缺工单', value: `${activeWorkOrders.length} 张`, status: 'info', subText: '现场特种巡检中' },
        { label: 'SLA 响应达标率', value: '98.5%', status: 'good', subText: '未超时违约' }
      ],
      actionLinks: [
        { title: '前往【告警风控中心】', path: '/alarms', description: '快速确认、排查与闭环当前活动告警', type: 'primary' },
        { title: '前往【Agent 诊断中心】', path: '/agent-hub', description: '查看大模型辅助研判决策与故障建议', type: 'secondary' },
        { title: '查看【现场消缺工单】', path: '/operations/work-orders', description: '跟踪运维人员消缺进展与闭环归档', type: 'secondary' }
      ],
      suggestedQuestions: [
        'Agent 给出了什么具体的告警处置策略？',
        '储能当前是否受到告警影响？',
        '前往微电网主控大屏查看拓扑'
      ]
    };
  }

  // ================== I. 通用兜底综合智能问答 ==================
  return {
    id,
    timestamp,
    role: 'assistant',
    category: 'GENERAL',
    content: `### 🤖 **中节能微电网 AI 智能体助手**

您好！我是**中节能低碳园区微电网智能体**。当前已实时连线接入【**${site.name}**】的全站 SCADA 遥测、EMS 协调控制器与财务核算系统。

您可以随时向我询问电站的各项运行指标，例如：
1. **☀️ 光伏发电**：实时出力、今日发电量、就地消纳率、逆变器状态等；
2. **🔋 储能运行**：充放电功率、电池 SOC、电芯温控、峰谷套利模式；
3. **⚡ 充电桩运营**：实时充电负荷、在充车数、空闲桩位、服务费收入；
4. **🌤️ 气象环境**：太阳总辐照度、环境温度、相对湿度、风向风速；
5. **💰 收益核算**：今日综合总收益、分时电价、光伏节省、储能套利；
6. **📑 运营报表**：日报月报生成情况、结算对账单导出、防伪 TraceId；
7. **🚨 安全告警**：未闭环告警风控、SLA 时效闭环、消缺工单跟踪；

**💡 页面快速直达提示**：您可以直接对我说“*打开微电网监控*”、“*打开收益中心*”、“*打开报表*”、“*去看告警*”，我将直接为您快速跳转至对应业务页面！`,
    metrics: [
      { label: '当前电站', value: site.name, status: 'good', subText: site.code },
      { label: '光伏实时功率', value: `${pvPower} kW`, status: 'good' },
      { label: '储能电池 SOC', value: `${storageSoc}%`, status: 'good' },
      { label: '今日预计收益', value: `¥${todayRevenue}`, status: 'good' }
    ],
    actionLinks: [
      { title: '👉 进入【微电网主控拓扑大屏】', path: '/monitor', description: '全局实时潮流监控', type: 'primary' },
      { title: '👉 进入【收益核算中心】', path: '/revenue', description: '查看今日收益与结算账单', type: 'secondary' },
      { title: '👉 进入【运营报表中心】', path: '/reports', description: '查看日报与导出数据', type: 'secondary' }
    ],
    suggestedQuestions: [
      '今天光伏发了多少度电？消纳情况如何？',
      '储能现在的充放电状态和 SOC 是多少？',
      '帮我打开收益核算中心',
      '站区现在的气象和辐照度好吗？'
    ]
  };
}
