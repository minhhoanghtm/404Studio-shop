import {
  TierDefinition,
  PointTransaction,
  LoyaltyAuditLog,
  LoyaltyRuleConfig,
} from './types';
import { MEMBERSHIP_TIERS, VND_PER_POINT } from './loyaltyConstants';
import { validateTierThresholds } from './loyaltyEngine';

export const STORAGE_KEY_CUSTOM_TIERS = 'atelier_loyalty_custom_tiers';
export const STORAGE_KEY_MANUAL_ADJUSTMENTS = 'atelier_loyalty_manual_adjustments';
export const STORAGE_KEY_RULE_CONFIG = 'atelier_loyalty_rule_config';
export const STORAGE_KEY_AUDIT_LOGS = 'atelier_loyalty_audit_logs';

export const EVENT_LOYALTY_SETTINGS_CHANGED = 'atelier:loyalty-settings-updated';
export const EVENT_LOYALTY_ADJUSTMENTS_CHANGED = 'atelier:loyalty-adjustments-updated';

export const DEFAULT_RULE_CONFIG: LoyaltyRuleConfig = {
  vndPerPoint: VND_PER_POINT,
  pointValueVnd: 100,
  minRedeemPoints: 50,
  expiryMonths: 12,
  requireDelivered: true,
  requirePaid: true,
};

function safeGetStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    console.warn(`[loyaltyStorage] Cannot read ${key}:`, e);
  }
  return null;
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn(`[loyaltyStorage] Cannot write ${key}:`, e);
  }
}

function safeRemoveStorage(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn(`[loyaltyStorage] Cannot remove ${key}:`, e);
  }
}

function dispatchCustomEvent(name: string, detail?: any): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    }
  } catch (e) {
    console.warn(`[loyaltyStorage] Cannot dispatch ${name}:`, e);
  }
}

/**
 * Returns currently active tier definitions (either custom edited or default)
 */
export function getActiveMembershipTiers(): TierDefinition[] {
  const raw = safeGetStorage(STORAGE_KEY_CUSTOM_TIERS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === MEMBERSHIP_TIERS.length) {
        // Merge with full metadata to ensure icons, gradients, and benefits remain intact
        const merged: TierDefinition[] = MEMBERSHIP_TIERS.map((baseTier, idx) => {
          const match = parsed.find((p: any) => p.id === baseTier.id) || parsed[idx];
          return {
            ...baseTier,
            nameVi: match?.nameVi || baseTier.nameVi,
            nameEn: match?.nameEn || baseTier.nameEn,
            minPoints: typeof match?.minPoints === 'number' ? Math.max(0, match.minPoints) : baseTier.minPoints,
          };
        });
        if (validateTierThresholds(merged)) {
          return merged;
        }
      }
    } catch {
      // JSON parse error - fallback to default
    }
  }
  return MEMBERSHIP_TIERS;
}

/**
 * Saves custom tier thresholds
 */
export function saveCustomMembershipTiers(tiers: TierDefinition[]): boolean {
  if (!validateTierThresholds(tiers)) {
    return false;
  }
  const cleanData = tiers.map((t) => ({
    id: t.id,
    nameVi: t.nameVi,
    nameEn: t.nameEn,
    family: t.family,
    level: t.level,
    minPoints: Number(t.minPoints),
  }));
  safeSetStorage(STORAGE_KEY_CUSTOM_TIERS, JSON.stringify(cleanData));
  dispatchCustomEvent(EVENT_LOYALTY_SETTINGS_CHANGED, { tiers });
  return true;
}

/**
 * Resets tier thresholds to system default
 */
export function resetCustomMembershipTiers(): void {
  safeRemoveStorage(STORAGE_KEY_CUSTOM_TIERS);
  dispatchCustomEvent(EVENT_LOYALTY_SETTINGS_CHANGED, { tiers: MEMBERSHIP_TIERS });
}

/**
 * Retrieves rule configuration (conversion rates, rounding, rules)
 */
export function getLoyaltyRuleConfig(): LoyaltyRuleConfig {
  const raw = safeGetStorage(STORAGE_KEY_RULE_CONFIG);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_RULE_CONFIG,
        ...parsed,
      };
    } catch {
      // Ignore
    }
  }
  return DEFAULT_RULE_CONFIG;
}

/**
 * Saves rule configuration
 */
export function saveLoyaltyRuleConfig(config: LoyaltyRuleConfig): void {
  safeSetStorage(STORAGE_KEY_RULE_CONFIG, JSON.stringify(config));
  dispatchCustomEvent(EVENT_LOYALTY_SETTINGS_CHANGED, { config });
}

/**
 * Retrieves all manual adjustments made by administrators (e.g. point revocations, grant bonus points)
 */
export function getManualAdjustments(): PointTransaction[] {
  const raw = safeGetStorage(STORAGE_KEY_MANUAL_ADJUSTMENTS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Ignore
    }
  }
  return [];
}

/**
 * Adds a manual adjustment (revocation or bonus)
 */
export function saveManualAdjustment(adjustment: PointTransaction): void {
  const current = getManualAdjustments();
  // Filter duplicate idempotency key if any
  const updated = [adjustment, ...current.filter((item) => item.idempotencyKey !== adjustment.idempotencyKey)];
  safeSetStorage(STORAGE_KEY_MANUAL_ADJUSTMENTS, JSON.stringify(updated));
  dispatchCustomEvent(EVENT_LOYALTY_ADJUSTMENTS_CHANGED, { adjustment });
}

/**
 * Removes / reverts a manual adjustment by its ID
 */
export function removeManualAdjustment(adjustmentId: string): void {
  const current = getManualAdjustments();
  const updated = current.filter((item) => item.id !== adjustmentId);
  safeSetStorage(STORAGE_KEY_MANUAL_ADJUSTMENTS, JSON.stringify(updated));
  dispatchCustomEvent(EVENT_LOYALTY_ADJUSTMENTS_CHANGED, { removedId: adjustmentId });
}

/**
 * Retrieves administrative audit logs
 */
export function getLoyaltyAuditLogs(): LoyaltyAuditLog[] {
  const raw = safeGetStorage(STORAGE_KEY_AUDIT_LOGS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Ignore
    }
  }
  // Initialize with initial default sample log if empty
  return [
    {
      id: 'LOG-INIT-RULE',
      timestamp: new Date().toISOString(),
      adminName: 'Hệ Thống Maison',
      actionType: 'UPDATE_RULES',
      reason: 'Khởi tạo quy tắc 12 cấp hạng và tỷ lệ quy đổi chuẩn 10.000 ₫ = 1 điểm',
    },
  ];
}

/**
 * Records an entry into the administrative audit log
 */
export function addLoyaltyAuditLog(
  log: Omit<LoyaltyAuditLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
): LoyaltyAuditLog {
  const current = getLoyaltyAuditLogs();
  const newEntry: LoyaltyAuditLog = {
    ...log,
    id: log.id || `LOG-LP-${Date.now().toString(36).toUpperCase()}`,
    timestamp: log.timestamp || new Date().toISOString(),
  };
  const updated = [newEntry, ...current].slice(0, 300); // Keep latest 300 logs
  safeSetStorage(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(updated));
  return newEntry;
}
