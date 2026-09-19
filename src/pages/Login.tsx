import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/AppContext';
import { UserRole } from '../types/domain';
import { MOCK_USERS } from '../store/scenarioData';
import { getDefaultLandingRoute, isRouteAllowedForRole } from '../utils/authPermissions';
import {
  User,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Shield,
  Building2,
} from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAppStore();

  // 表单状态
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('123456');
  const [captchaInput, setCaptchaInput] = useState<string>('');
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // 交互与反馈状态
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. 生成 4 位随机验证码并在 Canvas 绘制防伪图案
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
    drawCaptcha(code);
  };

  // 绘制验证码画布 (防伪噪点与干扰曲线)
  const drawCaptcha = (code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 背景填充
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, width, height);

    // 绘制干扰随机线条
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = ['#93c5fd', '#86efac', '#fca5a5', '#cbd5e1'][i % 4];
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height
      );
      ctx.stroke();
    }

    // 绘制随机干扰噪点
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = ['#64748b', '#94a3b8', '#3b82f6'][Math.floor(Math.random() * 3)];
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 1, 0, 2 * Math.PI);
      ctx.fill();
    }

    // 绘制字符
    const colors = ['#004287', '#0369a1', '#0f766e', '#1e40af'];
    for (let i = 0; i < code.length; i++) {
      ctx.save();
      ctx.font = 'bold 22px "Consolas", "Monaco", monospace';
      ctx.fillStyle = colors[i % colors.length];
      const x = 16 + i * 22;
      const y = 28 + (Math.random() * 6 - 3);
      const angle = (Math.random() * 24 - 12) * (Math.PI / 180);
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // 快捷填入测试账号
  const handleQuickFill = (targetRole: UserRole) => {
    setErrorMessage(null);
    if (targetRole === 'ADMIN') {
      setUsername('admin');
      setPassword('123456');
    } else if (targetRole === 'OPERATOR') {
      setUsername('operator');
      setPassword('123456');
    } else {
      setUsername('inspector');
      setPassword('123456');
    }
    // 同时贴心地填入当前验证码，避免再次手打
    setCaptchaInput(captchaCode);
  };

  // 根据输入的账号名匹配角色
  const resolveRoleFromUsername = (u: string): UserRole => {
    const clean = u.trim().toLowerCase();
    if (clean.includes('admin') || clean === '张宇轩') {
      return 'ADMIN';
    }
    if (clean.includes('inspect') || clean === '林志强' || clean === '王浩然') {
      return 'INSPECTOR';
    }
    if (clean.includes('operator') || clean === 'oper' || clean === '陈若涵') {
      return 'OPERATOR';
    }
    // 检查是否匹配 mock 用户工号或手机号
    const matched = MOCK_USERS.find(
      (m) =>
        m.username.toLowerCase() === clean ||
        m.phone.replace(/[^0-9]/g, '') === clean.replace(/[^0-9]/g, '')
    );
    if (matched) return matched.role;

    // 默认运营主管
    return 'OPERATOR';
  };

  // 表单提交登录
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();
    const cleanCaptcha = captchaInput.trim().toUpperCase();

    // 1. 必填字段校验
    if (!cleanUser) {
      setErrorMessage('请输入登录账号或工号');
      return;
    }
    if (!cleanPass) {
      setErrorMessage('请输入登录密码');
      return;
    }
    if (!cleanCaptcha) {
      setErrorMessage('请输入 4 位图形验证码');
      return;
    }

    // 2. 验证码校验 (大小写不敏感)
    if (cleanCaptcha !== captchaCode.toUpperCase()) {
      setErrorMessage('验证码错误或已过期，请重新输入');
      generateCaptcha();
      return;
    }

    // 3. 密码校验 (初始密码 123456，或长度大于等于 6)
    if (cleanPass.length < 6) {
      setErrorMessage('密码格式不正确，初始密码至少为 6 位字符');
      return;
    }

    // 4. 执行身份鉴权
    setIsLoading(true);
    const targetRole = resolveRoleFromUsername(cleanUser);

    setTimeout(async () => {
      try {
        await login(targetRole);
        setSuccessMessage('身份鉴权成功，正在跳转工作台...');

        // 检查是否有拦截前目标路径
        const from = (location.state as any)?.from?.pathname;
        if (from && from !== '/login' && from !== '/' && isRouteAllowedForRole(from, targetRole)) {
          navigate(from, { replace: true });
        } else {
          navigate(getDefaultLandingRoute(targetRole), { replace: true });
        }
      } catch (err) {
        setErrorMessage('系统登录异常，请稍后重试');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#00152A] text-slate-100 flex flex-col justify-between items-center p-4 relative overflow-hidden select-none">
      {/* 科技几何背景网络 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 30%, rgba(0, 66, 135, 0.7) 0%, transparent 65%), linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 36px 36px, 36px 36px',
        }}
      />

      {/* 顶部简明品牌占位区 */}
      <div className="w-full pt-4 md:pt-8 flex justify-center z-10">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <Building2 className="w-4 h-4 text-blue-400" />
          <span>低碳园区示范站 · 智能微电网统一认证门户</span>
        </div>
      </div>

      {/* 核心登录卡片 */}
      <div className="relative z-10 w-full max-w-[450px] my-6 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl p-7 md:p-8 backdrop-blur-md">
        {/* CECEP 品牌 Logo 与平台标题 */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="bg-white px-5 py-2.5 rounded-xl shadow-sm mb-3.5 flex items-center justify-center border border-slate-200">
            <img
              src="/logo_full.svg"
              alt="中国节能 CECEP"
              className="h-9 w-auto max-w-[220px] object-contain"
            />
          </div>

          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            中节能低碳园区微电网数字化平台
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            基于 AI 的低碳园区微电网数字化平台
          </p>
        </div>

        {/* 错误提示横条 */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-700/80 rounded-xl text-xs text-red-200 flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* 成功跳转提示横条 */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-700/80 rounded-xl text-xs text-emerald-200 flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="leading-snug">{successMessage}</span>
          </div>
        )}

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. 账号输入 */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              登录账号 / 工号
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名 / 手机号 / 工号"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* 2. 密码输入 */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              登录密码
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入登录密码 (默认: 123456)"
                disabled={isLoading}
                className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                title={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 3. 验证码输入 */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              安全验证码
            </label>
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  maxLength={4}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="4位验证码"
                  disabled={isLoading}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white uppercase placeholder:text-slate-500 tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* 验证码画布与点击刷新 */}
              <div
                onClick={generateCaptcha}
                className="relative cursor-pointer rounded-xl overflow-hidden border border-slate-600 bg-slate-100 hover:opacity-90 transition-opacity flex items-center shadow-xs select-none"
                title="点击刷新验证码"
              >
                <canvas
                  ref={canvasRef}
                  width={110}
                  height={42}
                  className="block pointer-events-none"
                />
                <button
                  type="button"
                  className="absolute right-1 top-1 p-1 bg-white/70 hover:bg-white rounded text-slate-700 shadow-2xs"
                  title="刷新"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* 4. 辅助选项：记住账号与忘记密码 */}
          <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
              />
              <span>记住登录状态</span>
            </label>
            <span className="text-slate-500 text-[11px] cursor-not-allowed">
              忘记密码请联系管理员
            </span>
          </div>

          {/* 5. 登录按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#004287] hover:bg-[#003366] text-white rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>正在进行身份认证...</span>
              </>
            ) : (
              <>
                <span>登 录</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 快捷填入测试账号便捷面板 */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>快捷填入账号（点击自动填入）</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              初始密码: 123456
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickFill('ADMIN')}
              className="px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 text-slate-200 transition-all text-left flex flex-col cursor-pointer"
            >
              <span className="font-semibold text-white text-[11px]">系统管理员</span>
              <span className="text-[10px] text-blue-400 font-mono mt-0.5">admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('OPERATOR')}
              className="px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/60 text-slate-200 transition-all text-left flex flex-col cursor-pointer"
            >
              <span className="font-semibold text-white text-[11px]">运营主管</span>
              <span className="text-[10px] text-emerald-400 font-mono mt-0.5">operator</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('INSPECTOR')}
              className="px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/60 text-slate-200 transition-all text-left flex flex-col cursor-pointer"
            >
              <span className="font-semibold text-white text-[11px]">巡检员</span>
              <span className="text-[10px] text-cyan-400 font-mono mt-0.5">inspector</span>
            </button>
          </div>
        </div>
      </div>

      {/* 底部版权与安全说明 */}
      <div className="w-full pb-4 text-center text-slate-500 text-xs font-mono z-10 space-y-1">
        <div>版权所有 © 中国节能低碳园区微电网数字化平台 · 安全认证中心</div>
        <div className="text-[11px] text-slate-600">
          建议使用 Chrome、Edge 或主流现代浏览器访问 · 1080P 及以上分辨率体验最佳
        </div>
      </div>
    </div>
  );
};
