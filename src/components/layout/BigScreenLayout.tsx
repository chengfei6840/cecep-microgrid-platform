import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Maximize2, Minimize2, Clock } from 'lucide-react';
import { useAppStore } from '../../store/AppContext';

export const BigScreenLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { site } = useAppStore();
  const [currentTime, setCurrentTime] = React.useState(() => {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10);
    const timeStr = d.toTimeString().slice(0, 8);
    return `${dateStr} ${timeStr}`;
  });
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      const dateStr = d.toISOString().slice(0, 10);
      const timeStr = d.toTimeString().slice(0, 8);
      setCurrentTime(`${dateStr} ${timeStr}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#030712] text-slate-100 font-sans select-none overflow-x-hidden relative">
      {/* Background grid accent */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(0, 168, 255, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 168, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Header - Compact single-line layout */}
      <header className="relative z-20 h-16 px-5 sm:px-8 flex items-center justify-between border-b border-[#163E6E]/70 bg-[#050C1B]/95 backdrop-blur-md">
        {/* Left: CECEP Logo and Back button */}
        <div className="flex items-center gap-3.5 shrink-0">
          <button
            id="btn-bigscreen-back"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-[#1E4976] text-cyan-300 text-xs hover:bg-[#0E2849] hover:text-cyan-200 transition-colors shadow-xs"
            title="返回后台管理工作台"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">返回管理后台</span>
            <span className="sm:hidden">返回</span>
          </button>
          <div className="h-6 w-px bg-[#163E6E]" />
          <img
            src={`${import.meta.env.BASE_URL}logo_no.png`}
            alt="中国节能 CECEP"
            className="h-8 w-auto object-contain shrink-0 filter brightness-110"
          />
        </div>

        {/* Center: Title + Single Site Demonstration Badge */}
        <div className="flex items-center gap-3 mx-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 truncate">
              低碳园区示范站运行态势
            </h1>
          </div>
          <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-[#004287]/80 text-cyan-200 border border-cyan-500/40">
            一期单站试点
          </span>
          <span className="hidden lg:inline-flex text-xs text-slate-400 font-mono">
            {site.code} · 10kV 进线
          </span>
        </div>

        {/* Right: Date-time on same line, Simulation Env, Fullscreen icon with tooltip */}
        <div className="flex items-center gap-3 shrink-0">
          {/* 模拟环境标识 */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-600/50 text-amber-300 text-[11px] font-mono shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>模拟演练沙箱环境</span>
          </div>

          {/* 数据时间：日期与更新时间保持在同一行 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#07152B] border border-[#163E6E] text-xs font-mono text-cyan-300 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="whitespace-nowrap">{currentTime}</span>
          </div>

          {/* 全屏按钮：图标加 Tooltip */}
          <div className="relative group">
            <button
              id="btn-bigscreen-fullscreen"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-[#07152B] border border-[#163E6E] text-cyan-300 hover:text-white hover:bg-[#0E2849] hover:border-cyan-400 transition-all shadow-xs"
              aria-label={isFullscreen ? '退出全屏' : '全屏展示'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            {/* Tooltip */}
            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-50 px-2 py-1 text-[10px] font-mono text-cyan-200 bg-slate-900/95 border border-[#163E6E] rounded shadow-lg whitespace-nowrap pointer-events-none">
              {isFullscreen ? '退出全屏模式 (Esc)' : '进入全屏汇报监控'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 p-4 sm:p-5 max-w-[1920px] mx-auto">{children}</main>
    </div>
  );
};
