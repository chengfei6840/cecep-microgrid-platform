import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/AppContext';
import {
  generateAiAgentResponse,
  AiAgentResponse,
  AiAgentMetricCard,
  AiAgentActionLink,
} from '../../utils/aiAgentEngine';
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Minimize2,
  Maximize2,
  ExternalLink,
  ChevronRight,
  Bot,
  User as UserIcon,
  SunMedium,
  BatteryCharging,
  Zap,
  CloudSun,
  Coins,
  FileText,
  AlertTriangle,
  LayoutDashboard,
  CheckCircle2,
  Compass,
  ArrowRight,
  Info,
  RefreshCw,
} from 'lucide-react';

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text?: string;
  response?: AiAgentResponse;
}

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_TOPICS = [
  { id: 'pv', label: '☀️ 光伏发电情况', prompt: '请分析当前电站光伏发电和就地消纳情况' },
  { id: 'storage', label: '🔋 储能运行情况', prompt: '请告诉我当前储能系统的充放电状态和SOC' },
  { id: 'charging', label: '⚡ 充电桩负荷情况', prompt: '当前充电桩运行负荷与在充车辆情况如何？' },
  { id: 'weather', label: '🌤️ 气象与辐照度', prompt: '站区目前的天气、辐照度与温度情况怎样？' },
  { id: 'revenue', label: '💰 相关收益统计', prompt: '统计一下今天各项收益构成与电价结算情况' },
  { id: 'reports', label: '📑 运营报表统计', prompt: '汇报一下运营报表生成状态与防伪对账进度' },
  { id: 'alarms', label: '🚨 未闭环安全告警', prompt: '当前站点有哪些待处置告警和消缺工单？' },
  { id: 'nav-monitor', label: '🖥️ 打开微电网大屏', prompt: '请帮我打开微电网监控大屏' },
  { id: 'nav-revenue', label: '📊 打开收益中心', prompt: '打开收益核算中心' },
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    site,
    telemetry,
    devices,
    points,
    alarms,
    reports,
    workOrders,
    tariffScheme,
    revenueSnapshots,
    currentRole,
  } = useAppStore();

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isNavigatingNotice, setIsNavigatingNotice] = useState<string | null>(null);

  // 初始欢迎消息
  const initialContext = {
    site,
    telemetry,
    devices,
    points,
    alarms,
    reports,
    workOrders,
    tariffScheme,
    revenueSnapshots,
    currentRole,
  };

  const [messages, setMessages] = useState<MessageItem[]>(() => {
    const welcome = generateAiAgentResponse('你好', initialContext);
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        response: welcome,
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  if (!isOpen) return null;

  // 处理发送消息
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isThinking) return;

    const userMsgId = `user-${Date.now()}`;
    const userTimestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    // 添加用户消息
    const userMessage: MessageItem = {
      id: userMsgId,
      sender: 'user',
      timestamp: userTimestamp,
      text: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsThinking(true);

    // 模拟智能体推理延迟（更真实，带呼吸律动）
    setTimeout(() => {
      const currentContext = {
        site,
        telemetry,
        devices,
        points,
        alarms,
        reports,
        workOrders,
        tariffScheme,
        revenueSnapshots,
        currentRole,
      };

      const agentResp = generateAiAgentResponse(query, currentContext);

      const assistantMessage: MessageItem = {
        id: agentResp.id,
        sender: 'assistant',
        timestamp: agentResp.timestamp,
        response: agentResp,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsThinking(false);

      // 如果有明确自动跳转意图，并且用户提问是直接跳转命令
      if (agentResp.autoNavigatePath && agentResp.category === 'NAVIGATION') {
        setIsNavigatingNotice(`已为您定位至目标模块，点击下方卡片或已自动就绪`);
        setTimeout(() => {
          setIsNavigatingNotice(null);
        }, 4000);
      }
    }, 600);
  };

  // 一键清空对话
  const handleClearHistory = () => {
    const welcome = generateAiAgentResponse('你好', {
      site,
      telemetry,
      devices,
      points,
      alarms,
      reports,
      workOrders,
      tariffScheme,
      revenueSnapshots,
      currentRole,
    });
    setMessages([
      {
        id: `msg-welcome-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        response: welcome,
      },
    ]);
  };

  // 页面跳转动作
  const handleActionNavigate = (link: AiAgentActionLink) => {
    navigate(link.path);
    setIsNavigatingNotice(`已成功前往【${link.title}】`);
    setTimeout(() => {
      setIsNavigatingNotice(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-2xs transition-opacity animate-in fade-in duration-200">
      {/* 遮罩点击关闭 */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* AI 对话面板容器 */}
      <div
        className={`relative z-10 flex flex-col bg-white shadow-2xl border-l border-slate-200 h-full transition-all duration-300 ease-out ${
          isExpanded ? 'w-full lg:w-[820px]' : 'w-full sm:w-[480px] md:w-[540px]'
        }`}
      >
        {/* 1. 顶部 Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-[#00152A] via-[#002B5C] to-[#004287] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-sm ring-2 ring-white/20 shrink-0">
              <Sparkles className="w-4 h-4 text-cyan-100 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white tracking-wide truncate">
                  中节能微电网 AI 智能体助手
                </h3>
                <span className="px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-200 text-[10px] font-mono border border-cyan-400/30">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>实时遥测已接入: {site.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-slate-300">
            <button
              onClick={handleClearHistory}
              className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="清空对话历史"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
              title={isExpanded ? '缩小窗口' : '展开宽屏视图'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-1"
              title="关闭对话助手"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. 页面跳转提示浮条 */}
        {isNavigatingNotice && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 flex items-center justify-between shadow-inner animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{isNavigatingNotice}</span>
            </div>
            <button
              onClick={() => setIsNavigatingNotice(null)}
              className="text-emerald-100 hover:text-white text-xs underline ml-2"
            >
              知道了
            </button>
          </div>
        )}

        {/* 3. 预设快捷提问 Chips 横向滚动条 */}
        <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
            <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-[#004287]" />
              快捷提问:
            </span>
            {PRESET_TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleSendMessage(topic.prompt)}
                disabled={isThinking}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-[#004287] hover:border-blue-300 hover:bg-blue-50/60 text-xs transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. 消息对话主区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/60">
          {messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="flex justify-end gap-2.5 pl-8">
                  <div className="flex flex-col items-end">
                    <div className="px-4 py-2.5 rounded-2xl rounded-tr-xs bg-gradient-to-r from-blue-600 to-[#004287] text-white text-xs leading-relaxed shadow-sm">
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 font-mono">{msg.timestamp}</span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-[#004287] flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200 shadow-2xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                </div>
              );
            }

            // AI 助手消息卡片
            const resp = msg.response;
            return (
              <div key={msg.id} className="flex items-start gap-2.5 pr-4 animate-in fade-in duration-200">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#002B5C] to-cyan-600 text-white flex items-center justify-center shrink-0 shadow-sm ring-2 ring-blue-100 mt-0.5">
                  <Bot className="w-4 h-4 text-cyan-200" />
                </div>
                <div className="flex-1 space-y-2.5 max-w-[94%]">
                  {/* 主气泡卡片 */}
                  <div className="bg-white rounded-2xl rounded-tl-xs p-4 shadow-sm border border-slate-200/80 text-xs text-slate-800 space-y-3">
                    {/* Markdown 文本 */}
                    <div className="leading-relaxed whitespace-pre-wrap space-y-2 text-slate-700">
                      {resp?.content.split('\n\n').map((para, pIdx) => {
                        // 简单格式化支持：粗体与标题
                        if (para.startsWith('### ')) {
                          return (
                            <h4 key={pIdx} className="text-sm font-bold text-slate-900 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                              {para.replace('### ', '')}
                            </h4>
                          );
                        }
                        if (para.startsWith('- ')) {
                          const items = para.split('\n- ');
                          return (
                            <ul key={pIdx} className="space-y-1 pl-1">
                              {items.map((it, itIdx) => {
                                const clean = it.replace(/^- /, '');
                                return (
                                  <li key={itIdx} className="flex items-start gap-1.5">
                                    <span className="text-[#004287] font-bold mt-0.5">•</span>
                                    <span>
                                      {clean.split('**').map((seg, sIdx) =>
                                        sIdx % 2 === 1 ? (
                                          <strong key={sIdx} className="font-semibold text-slate-900">
                                            {seg}
                                          </strong>
                                        ) : (
                                          seg
                                        )
                                      )}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          );
                        }
                        return (
                          <p key={pIdx}>
                            {para.split('**').map((seg, sIdx) =>
                              sIdx % 2 === 1 ? (
                                <strong key={sIdx} className="font-semibold text-slate-900">
                                  {seg}
                                </strong>
                              ) : (
                                seg
                              )
                            )}
                          </p>
                        );
                      })}
                    </div>

                    {/* 关键数据卡片指标网格 (Key Metrics) */}
                    {resp?.metrics && resp.metrics.length > 0 && (
                      <div className="pt-1">
                        <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-[#004287]" />
                          <span>相关实时测点与运行指标快照</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                          {resp.metrics.map((metric, mIdx) => (
                            <div
                              key={mIdx}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between hover:bg-blue-50/40 transition-colors"
                            >
                              <span className="text-[11px] text-slate-500 truncate">{metric.label}</span>
                              <div className="flex items-baseline gap-1 my-0.5">
                                <span className="text-sm font-bold text-slate-900 font-mono">
                                  {metric.value}
                                </span>
                                {metric.unit && (
                                  <span className="text-[10px] text-slate-500">{metric.unit}</span>
                                )}
                              </div>
                              {metric.subText && (
                                <span className="text-[10px] text-slate-400 truncate">{metric.subText}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 一键直达页面操作卡片 (核心诉求：根据用户问答直接打开对应页面) */}
                    {resp?.actionLinks && resp.actionLinks.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-[11px] font-bold text-[#004287] mb-2 flex items-center gap-1">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>推荐直接前往对应业务页面：</span>
                        </div>
                        <div className="space-y-1.5">
                          {resp.actionLinks.map((link, lIdx) => (
                            <button
                              key={lIdx}
                              onClick={() => handleActionNavigate(link)}
                              className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                                link.type === 'primary'
                                  ? 'bg-blue-50/80 border-blue-200 hover:bg-blue-100 hover:border-blue-300 text-blue-900 shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-semibold text-xs text-[#004287] flex items-center gap-1.5">
                                  <span>{link.title}</span>
                                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white text-slate-500 border border-slate-200">
                                    {link.path}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                                  {link.description}
                                </div>
                              </div>
                              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#004287] shadow-2xs group-hover:translate-x-0.5 transition-transform shrink-0">
                                <ArrowRight className="w-3.5 h-3.5" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 延伸建议提问 (Follow-up prompts) */}
                    {resp?.suggestedQuestions && resp.suggestedQuestions.length > 0 && (
                      <div className="pt-2 border-t border-slate-100/80">
                        <span className="text-[10px] text-slate-400 block mb-1.5">猜您还想了解：</span>
                        <div className="flex flex-wrap gap-1.5">
                          {resp.suggestedQuestions.map((q, qIdx) => (
                            <button
                              key={qIdx}
                              onClick={() => handleSendMessage(q)}
                              disabled={isThinking}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg text-[11px] transition-colors border border-slate-200/60 cursor-pointer disabled:opacity-50"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 pl-1 font-mono">
                    <span>{resp?.timestamp}</span>
                    <span>·</span>
                    <span>微电网多模态知识推理</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 思考中动画 */}
          {isThinking && (
            <div className="flex items-center gap-2.5 animate-in fade-in">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#002B5C] to-cyan-600 text-white flex items-center justify-center shrink-0 shadow-sm ring-2 ring-blue-100">
                <Bot className="w-4 h-4 text-cyan-200 animate-spin" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-white border border-slate-200 shadow-sm flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="font-medium text-slate-600 ml-1">智能体正在抓取电站 SCADA 实时测点与分析...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 5. 底部输入与操作区 */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="询问光伏、储能、充电桩、气象、收益、报表，或输入‘打开收益中心’..."
                disabled={isThinking}
                className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
              {inputPrompt && (
                <button
                  type="button"
                  onClick={() => setInputPrompt('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={!inputPrompt.trim() || isThinking}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-[#004287] hover:from-blue-700 hover:to-[#003366] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">发送</span>
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="truncate">
              支持自然语言问答与意图直达 · 当前站点: <strong className="text-slate-600">{site.name}</strong>
            </span>
            <span className="hidden sm:inline text-slate-300">按 Enter 发送</span>
          </div>
        </div>
      </div>
    </div>
  );
};
