import crypto from 'crypto';
import { ToolExecutionResult } from '../types/index.js';

export interface BackendAuthContext {
  userId?: string | null;
  role?: string;
}

export class NodeBackendClient {
  private readonly baseUrl: string;
  private readonly secret: string;

  constructor(options: { baseUrl?: string; secret?: string } = {}) {
    this.baseUrl = String(options.baseUrl || process.env.NODE_BACKEND_BASE_URL || '').trim().replace(/\/$/, '');
    this.secret = options.secret || process.env.AI_SERVICE_SHARED_SECRET || '';
  }

  /**
   * Execute tool on Node Backend with cryptographic HMAC signature and forwarded identity.
   */
  public async executeTool(
    toolName: string,
    args: Record<string, unknown> = {},
    authContext: BackendAuthContext = {}
  ): Promise<ToolExecutionResult> {
    if (!this.baseUrl) {
      throw new Error('Missing NODE_BACKEND_BASE_URL for NodeBackendClient.');
    }
    if (!this.secret) {
      throw new Error('Missing AI_SERVICE_SHARED_SECRET for NodeBackendClient.');
    }
    const timestamp = String(Math.floor(Date.now() / 1000));
    const path = `/api/internal/ai/tools/${toolName}`;
    const payload = { arguments: args };
    const bodyStr = JSON.stringify(payload);

    const bodyDigest = crypto.createHash('sha256').update(bodyStr).digest('hex');
    const material = `${timestamp}.POST.${path}.${bodyDigest}`;
    const signature = crypto.createHmac('sha256', this.secret).update(material).digest('hex');

    const userId = authContext.userId || 'anonymous';
    const role = authContext.role || 'guest';

    const url = `${this.baseUrl}${path}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AI-Service-Timestamp': timestamp,
          'X-AI-Service-Signature': signature,
          'X-AI-End-User-Id': String(userId),
          'X-AI-End-User-Role': String(role),
        },
        body: bodyStr,
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        let errJson: any = null;
        try {
          errJson = await response.json();
        } catch {}
        return {
          success: false,
          code: errJson?.code || `HTTP_${response.status}`,
          message: errJson?.message || `Lỗi khi gọi API Backend (${response.status})`,
        };
      }

      const data = (await response.json()) as ToolExecutionResult;
      return data;
    } catch (err: any) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: `Không thể kết nối Backend API: ${err.message}`,
      };
    }
  }
}
