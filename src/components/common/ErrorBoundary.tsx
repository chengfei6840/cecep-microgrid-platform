import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  private handleClearStorageAndReload = () => {
    try {
      localStorage.removeItem('cecep_microgrid_state_v1');
    } catch (e) {
      console.error(e);
    }
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[360px] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-red-200 shadow-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {this.props.fallbackTitle || '页面组件加载遇到异常'}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {this.state.error?.message || '运行时检测到非预期状态，已启动安全隔离降级机制。'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>重新加载当前视图</span>
              </button>
              <button
                onClick={this.handleClearStorageAndReload}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                <span>清除缓存重置本地数据</span>
              </button>
            </div>

            {this.state.error && (
              <details className="text-left text-[11px] text-slate-400 bg-slate-50 border border-slate-200 p-2.5 rounded-lg max-h-36 overflow-auto font-mono mt-3">
                <summary className="cursor-pointer text-slate-600 font-semibold mb-1">
                  查看异常详情与错误堆栈
                </summary>
                <p className="text-red-700 font-bold mb-1">{this.state.error.message}</p>
                <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
