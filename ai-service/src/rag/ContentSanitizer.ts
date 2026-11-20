const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|rules)/gi,
  /disregard\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|rules)/gi,
  /system\s*prompt\s*:/gi,
  /you\s+are\s+now\s+(?:a|an|in)\s+[^\n.]+/gi,
  /forget\s+everything\s+above/gi,
  /bỏ\s+qua\s+(?:tất\s+cả\s+)?(?:các\s+)?(?:hướng\s+dẫn|quy\s+tắc|lệnh)\s+(?:trước|ở\s+trên)/gi,
  /tiết\s+lộ\s+(?:system\s+prompt|api\s+key|mật\s+khẩu|bí\s+mật)/gi,
  /reveal\s+(?:your\s+)?(?:system\s+prompt|api\s+key|secret|instructions)/gi,
  /<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi,
  /\[(?:SYSTEM|INST|ADMIN_OVERRIDE)\]/gi,
];

/**
 * Sanitize untrusted retrieved document text to neutralize indirect prompt injection attacks.
 */
export function sanitizeRetrievedContent(rawText = ''): {
  sanitizedText: string;
  injectionDetected: boolean;
} {
  let text = String(rawText || '');
  let injectionDetected = false;

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      injectionDetected = true;
      text = text.replace(pattern, '[REDACTED_UNTRUSTED_INSTRUCTION]');
    }
    pattern.lastIndex = 0;
  }

  return {
    sanitizedText: text.trim(),
    injectionDetected,
  };
}
