import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export function verifyIncomingNodeSignature(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const secret = process.env.AI_SERVICE_SHARED_SECRET;
  if (!secret || secret.length < 32) {
    res.status(500).json({
      success: false,
      code: 'SECRET_CONFIG_ERROR',
      message: 'AI_SERVICE_SHARED_SECRET is not configured or too short (min 32 chars).',
    });
    return;
  }

  const timestamp = req.get('X-AI-Service-Timestamp');
  const signature = req.get('X-AI-Service-Signature');
  const endUserId = req.get('X-AI-End-User-Id') || 'anonymous';
  const endUserRole = req.get('X-AI-End-User-Role') || 'guest';

  if (!timestamp || !signature) {
    res.status(401).json({
      success: false,
      code: 'UNAUTHENTICATED_SERVICE_CALL',
      message: 'Missing HMAC signature or timestamp headers.',
    });
    return;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - Number(timestamp)) > 60) {
    res.status(401).json({
      success: false,
      code: 'EXPIRED_TIMESTAMP',
      message: 'Request timestamp is skewed by more than 60 seconds.',
    });
    return;
  }

  const path = req.originalUrl || req.path;
  // Node side generates: `${timestamp}.POST.${path}.${userId || "anonymous"}.${safeRole}`
  // Let's verify both potential material shapes for maximum interoperability:
  const materialA = `${timestamp}.POST.${path}.${endUserId}.${endUserRole}`;
  const expectedA = crypto.createHmac('sha256', secret).update(materialA).digest('hex');

  const bodyStr = JSON.stringify(req.body || {});
  const bodyDigest = crypto.createHash('sha256').update(bodyStr).digest('hex');
  const materialB = `${timestamp}.POST.${path}.${bodyDigest}`;
  const expectedB = crypto.createHmac('sha256', secret).update(materialB).digest('hex');

  let valid = false;
  try {
    if (crypto.timingSafeEqual(Buffer.from(expectedA), Buffer.from(signature))) {
      valid = true;
    }
  } catch {}

  if (!valid) {
    try {
      if (crypto.timingSafeEqual(Buffer.from(expectedB), Buffer.from(signature))) {
        valid = true;
      }
    } catch {}
  }

  if (!valid) {
    res.status(401).json({
      success: false,
      code: 'INVALID_SIGNATURE',
      message: 'HMAC signature verification failed.',
    });
    return;
  }

  (req as any).authContext = {
    userId: endUserId !== 'anonymous' ? endUserId : null,
    role: endUserRole,
  };

  next();
}
