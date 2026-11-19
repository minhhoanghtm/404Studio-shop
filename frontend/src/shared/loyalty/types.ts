/**
 * ATELIER VÉRITÉ — CUSTOMER LOYALTY & 12-TIER MEMBERSHIP TYPES
 * Standardized across Customer & Admin domains.
 * Compliance: Vietnam Law 91/2025/QH15 & Decree 356/2025/NĐ-CP
 */

export type TierId =
  | 'bronze_1'
  | 'bronze_2'
  | 'bronze_3'
  | 'silver_1'
  | 'silver_2'
  | 'silver_3'
  | 'gold_1'
  | 'gold_2'
  | 'gold_3'
  | 'diamond_1'
  | 'diamond_2'
  | 'diamond_3';

export type TierFamily = 'bronze' | 'silver' | 'gold' | 'diamond';

export type TierLevel = 1 | 2 | 3;

export interface TierDefinition {
  id: TierId;
  nameVi: string;
  nameEn: string;
  family: TierFamily;
  level: TierLevel;
  minPoints: number;
  badgeColor: string;
  gradient: string;
  benefits: string[];
}

export type PointTransactionType =
  | 'EARN'
  | 'REFUND_REVERSAL'
  | 'ADMIN_ADJUSTMENT'
  | 'EXPIRATION';

export interface PointTransaction {
  id: string;
  customerId: string;
  orderId?: string;
  orderCode?: string;
  eventType: PointTransactionType;
  pointsDelta: number;
  previousBalance: number;
  newBalance: number;
  createdAt: string;
  reason: string;
  idempotencyKey: string;
  ruleVersion: string;
  metadata?: Record<string, any>;
}

export interface CustomerLoyaltyProfile {
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  qualifyingPoints: number;
  earnedPoints: number;
  reversedPoints: number;
  currentBalance: number;
  currentTier: TierDefinition;
  nextTier: TierDefinition | null;
  pointsToNextTier: number;
  progressPercentage: number;
  transactions: PointTransaction[];
  eligibleOrdersCount: number;
  totalEligibleSpend: number;
}

export interface LoyaltySystemStats {
  totalMembers: number;
  totalPointsIssued: number;
  totalPointsReversed: number;
  activeBalance: number;
  tierDistribution: Record<TierId, number>;
  familyDistribution: Record<TierFamily, number>;
  conversionRateVnd: number;
}
