/**
 * 中节能低碳园区微电网数字化平台 - 集中式 Mock 异步请求服务
 * 支持：
 * - 默认可配置的微小加载延迟 (体验流畅且具备真实异步质感)
 * - 模式切换：成功、空数据、失败、无权限
 * - 统一 traceId 生成
 */

export type MockResultMode = 'SUCCESS' | 'EMPTY' | 'FAILED' | 'UNAUTHORIZED';

export interface MockResponse<T> {
  code: number;
  success: boolean;
  message: string;
  data: T | null;
  traceId: string;
  timestamp: string;
}

export class MockService {
  private static globalMode: MockResultMode = 'SUCCESS';
  private static defaultDelayMs = 250;

  public static setMode(mode: MockResultMode) {
    this.globalMode = mode;
  }

  public static getMode(): MockResultMode {
    return this.globalMode;
  }

  public static generateTraceId(prefix = 'TR'): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${dateStr}-${rand}`;
  }

  /**
   * 模拟异步请求
   * @param data 正常返回数据
   * @param options 可选特定模式覆盖或空数据定义
   */
  public static async execute<T>(
    data: T,
    options?: {
      overrideMode?: MockResultMode;
      emptyFallback?: T;
      delayMs?: number;
      customErrorMessage?: string;
    }
  ): Promise<MockResponse<T>> {
    const mode = options?.overrideMode || this.globalMode;
    const delay = options?.delayMs ?? this.defaultDelayMs;
    const traceId = this.generateTraceId();
    const timestamp = new Date().toLocaleString('zh-CN', { hour12: false });

    await new Promise((resolve) => setTimeout(resolve, delay));

    if (mode === 'FAILED') {
      return {
        code: 500,
        success: false,
        message: options?.customErrorMessage || '模拟服务响应超时或网关连接重置 (500 Internal Server Error)',
        data: null,
        traceId,
        timestamp,
      };
    }

    if (mode === 'UNAUTHORIZED') {
      return {
        code: 403,
        success: false,
        message: '当前操作角色无权执行此操作，请切换至具有相应审批权限的角色 (403 Forbidden)',
        data: null,
        traceId,
        timestamp,
      };
    }

    if (mode === 'EMPTY') {
      return {
        code: 200,
        success: true,
        message: '查询成功，当前暂无符合条件的记录',
        data: (options?.emptyFallback !== undefined ? options.emptyFallback : null) as T,
        traceId,
        timestamp,
      };
    }

    return {
      code: 200,
      success: true,
      message: '操作成功',
      data,
      traceId,
      timestamp,
    };
  }
}
