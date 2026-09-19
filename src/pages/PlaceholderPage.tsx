import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { UserRole } from '../types/domain';
import {
  LoadingView,
  EmptyView,
  ErrorView,
  UnauthorizedView,
  ReadonlyBanner,
} from '../components/common/StateViews';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Layers,
  Sparkles,
  Info,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlaceholderPageProps {
  pageCode: string;
  title: string;
  moduleGroup: string;
  description: string;
  requiredRole?: UserRole[];
  contentSummary?: React.ReactNode;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  pageCode,
  title,
  moduleGroup,
  description,
  requiredRole,
  contentSummary,
}) => {
  const navigate = useNavigate();
  const { currentRole, currentUser, switchRole, scenario, mockMode, setMockMode } = useAppStore();
  const [localState, setLocalState] = useState<'NORMAL' | 'LOADING' | 'EMPTY' | 'ERROR'>('NORMAL');

  // 检查权限
  const hasPermission = !requiredRole || requiredRole.includes(currentRole);

  if (!hasPermission) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <UnauthorizedView
          currentRole={currentUser.roleTitle}
          requiredRole={requiredRole.map((r) => (r === 'ADMIN' ? '系统管理员' : r === 'OPERATOR' ? '运营人员' : '巡检员')).join(' 或 ')}
          onSwitchRole={() => switchRole(requiredRole[0])}
        />
      </div>
    );
  }

  // 模拟请求模式响应
  if (mockMode === 'FAILED' || localState === 'ERROR') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <ErrorView
          onRetry={() => {
            setMockMode('SUCCESS');
            setLocalState('NORMAL');
          }}
        />
      </div>
    );
  }

  if (mockMode === 'EMPTY' || localState === 'EMPTY') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <EmptyView
          actionText="刷新重试加载数据"
          onAction={() => {
            setMockMode('SUCCESS');
            setLocalState('NORMAL');
          }}
        />
      </div>
    );
  }

  if (localState === 'LOADING') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <LoadingView text={`正在加载 ${title} 实时数据...`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 顶部业务卡片 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {moduleGroup}
              </span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs font-mono text-slate-500">{pageCode}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">{description}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* 状态切换体验测试按钮 */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs text-slate-600">
              <button
                onClick={() => setLocalState('NORMAL')}
                className={`px-2 py-1 rounded transition-colors ${
                  (localState as string) === 'NORMAL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : ''
                }`}
              >
                正常态
              </button>
              <button
                onClick={() => setLocalState('EMPTY')}
                className={`px-2 py-1 rounded transition-colors ${
                  (localState as string) === 'EMPTY' ? 'bg-white text-slate-900 shadow-2xs font-bold' : ''
                }`}
              >
                空数据
              </button>
              <button
                onClick={() => setLocalState('ERROR')}
                className={`px-2 py-1 rounded transition-colors ${
                  (localState as string) === 'ERROR' ? 'bg-white text-slate-900 shadow-2xs font-bold' : ''
                }`}
              >
                异常态
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 核心内容展示区 */}
      {contentSummary ? (
        contentSummary
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>模块就绪状态与接口定义</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            该页面已完成路由骨架接入与领域实体关联，所有数据均已连接至全局状态容器与集中式 Mock Service。后续页面更新将直接在此骨架上呈现丰富看板。
          </p>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">所属站点：</span>
              <span className="font-semibold text-slate-900">低碳园区示范站 (SITE-001)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">当前激活场景：</span>
              <span className="font-semibold text-blue-700">
                {scenario === 'SCENARIO_A' ? '场景 A (正常运营)' : '场景 B (储能 EMS 异常闭环)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">操作人角色：</span>
              <span className="font-semibold text-slate-900">
                {currentUser.name} ({currentUser.roleTitle})
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => navigate('/inspector')}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              <span>查看全局状态与场景闭环流转</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-slate-400">
              数据来源: 集中式 Mock 异步服务 (自动防空与防白屏)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
