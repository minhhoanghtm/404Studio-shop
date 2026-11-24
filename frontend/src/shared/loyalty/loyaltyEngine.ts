import {
  TierDefinition,
  TierId,
  PointTransaction,
  CustomerLoyaltyProfile,
  LoyaltySystemStats,
  TierFamily,
} from './types';
import {
  MEMBERSHIP_TIERS,
  VND_PER_POINT,
  RULE_VERSION,
} from './loyaltyConstants';

/**
 * Validates that tier thresholds are strictly ascending.
 */
export function validateTierThresholds(tiers: TierDefinition[]): boolean {
  if (!tiers || tiers.length === 0) return false;
  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i].minPoints <= tiers[i - 1].minPoints) {
      return false;
    }
  }
  return true;
}

/**
 * Determines whether an order is eligible for earning loyalty points according to Phase 3 rules:
 * - Order must be completed ('delivered')
 * - Payment must be confirmed ('paid')
 * - Order must not be cancelled
 * - For COD: both delivery and payment must be completed
 */
export function isOrderEligibleForPoints(order: any): boolean {
  if (!order) return false;

  const status = String(order.status || '').toLowerCase();
  const paymentStatus = String(order.payment_status || '').toLowerCase();
  const paymentMethod = String(order.payment_method || '').toLowerCase();

  // Cancelled or invalid orders never earn points
  if (
    status === 'cancelled' ||
    paymentStatus === 'failed' ||
    paymentStatus === 'expired' ||
    paymentStatus === 'refunded'
  ) {
    return false;
  }

  // Must be delivered and paid
  if (status !== 'delivered') {
    return false;
  }

  // For COD: payment must be collected upon delivery
  if (paymentMethod === 'cod') {
    return paymentStatus === 'paid';
  }

  // For online payments: payment status must be paid
  return paymentStatus === 'paid';
}

/**
 * Calculates the eligible merchandise amount for loyalty points:
 * - Uses order.total_price or merchandise value after discounts
 * - Deducts shipping fees if explicitly provided
 * - Deducts refunded amounts if applicable
 */
export function calculateEligibleAmount(order: any): number {
  if (!order) return 0;

  // Base price: total_price is the final invoice amount after discounts
  let total = Number(order.total_price ?? order.total ?? 0);

  // Exclude shipping fee if separated in order model
  const shippingFee = Number(order.shipping_fee ?? order.shippingFee ?? 0);
  if (shippingFee > 0 && total >= shippingFee) {
    total -= shippingFee;
  }

  // Deduct refund amount if partial refund is recorded
  const refundedAmount = Number(order.refunded_amount ?? order.refundedAmount ?? 0);
  if (refundedAmount > 0) {
    total = Math.max(0, total - refundedAmount);
  }

  return Math.max(0, total);
}

/**
 * Calculates points earned from an eligible order:
 * earnedPoints = floor(eligibleAmount / 10000)
 */
export function calculateOrderEarnedPoints(order: any): number {
  if (!isOrderEligibleForPoints(order)) {
    return 0;
  }
  const eligibleAmount = calculateEligibleAmount(order);
  return Math.floor(eligibleAmount / VND_PER_POINT);
}

/**
 * Calculates estimated points for a shopping cart value (before checkout completion)
 */
export function calculateEstimatedPointsForCart(cartTotal: number): number {
  if (!cartTotal || cartTotal <= 0) return 0;
  return Math.floor(cartTotal / VND_PER_POINT);
}

/**
 * Maps qualifying points to the appropriate membership tier (highest matching threshold)
 */
export function getTierForPoints(points: number, tiers: TierDefinition[] = MEMBERSHIP_TIERS): TierDefinition {
  const safePoints = Math.max(0, points || 0);
  // Iterate in reverse (highest to lowest threshold)
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (safePoints >= tiers[i].minPoints) {
      return tiers[i];
    }
  }
  return tiers[0];
}

/**
 * Retrieves the immediate next tier in the hierarchy
 */
export function getNextTier(tierId: TierId, tiers: TierDefinition[] = MEMBERSHIP_TIERS): TierDefinition | null {
  const currentIndex = tiers.findIndex((t) => t.id === tierId);
  if (currentIndex >= 0 && currentIndex < tiers.length - 1) {
    return tiers[currentIndex + 1];
  }
  return null;
}

/**
 * Calculates the progress percentage (0 - 100) between current tier and next tier
 */
export function calculateTierProgress(
  points: number,
  currentTier: TierDefinition,
  nextTier: TierDefinition | null
): { pointsRemaining: number; percentage: number } {
  if (!nextTier) {
    // Reached Diamond III (highest tier)
    return { pointsRemaining: 0, percentage: 100 };
  }

  const range = nextTier.minPoints - currentTier.minPoints;
  if (range <= 0) {
    return { pointsRemaining: 0, percentage: 100 };
  }

  const earnedInRange = Math.max(0, points - currentTier.minPoints);
  const remaining = Math.max(0, nextTier.minPoints - points);
  const percentage = Math.min(100, Math.floor((earnedInRange / range) * 100));

  return { pointsRemaining: remaining, percentage };
}

/**
 * Builds an idempotent Point Ledger and complete Loyalty Profile from real backend orders.
 * Follows Phase 4 (Point Ledger & Idempotency) & Phase 5 (Refunds & Reversals).
 */
export function buildCustomerLoyaltyProfile(
  customerId: string,
  orders: any[] = [],
  customerInfo?: { name?: string; email?: string; phone?: string; manualAdjustments?: PointTransaction[] },
  tiers: TierDefinition[] = MEMBERSHIP_TIERS
): CustomerLoyaltyProfile {
  const rawOrders = Array.isArray(orders) ? orders : [];

  // Filter orders belonging to this customer if user_id is present
  const customerOrders = rawOrders.filter((o) => {
    if (!o) return false;
    if (o.user_id) {
      const orderUserId = typeof o.user_id === 'object' ? (o.user_id._id || o.user_id.id) : o.user_id;
      return String(orderUserId) === String(customerId);
    }
    return true; // If already pre-filtered for customer
  });

  // Sort chronologically by event occurrence (paid_at for earn, updatedAt/refunded_at for refunds)
  const getOrderEventTime = (order: any) => {
    if (order.payment_status === 'refunded' || order.status === 'refunded' || order.is_refunded) {
      return new Date(order.refunded_at || order.updatedAt || order.paid_at || order.createdAt || 0).getTime();
    }
    return new Date(order.paid_at || order.createdAt || order.created_at || order.updatedAt || 0).getTime();
  };

  const sortedOrders = [...customerOrders].sort((a, b) => {
    return getOrderEventTime(a) - getOrderEventTime(b);
  });

  const transactions: PointTransaction[] = [];
  const processedKeys = new Set<string>();

  let runningBalance = 0;
  let totalEarned = 0;
  let totalReversed = 0;
  let totalEligibleSpend = 0;
  let eligibleOrdersCount = 0;

  for (const order of sortedOrders) {
    const orderId = String(order._id || order.id || '');
    const orderCode = String(order.orderNumber || order.order_code || order._id || 'ĐƠN HÀNG');
    const paymentStatus = String(order.payment_status || '').toLowerCase();
    const status = String(order.status || '').toLowerCase();

    // 1. EARN EVENT
    if (isOrderEligibleForPoints(order)) {
      const earnIdempotencyKey = `earn-${orderId}-${RULE_VERSION}`;
      if (!processedKeys.has(earnIdempotencyKey)) {
        processedKeys.add(earnIdempotencyKey);

        const eligibleAmount = calculateEligibleAmount(order);
        const points = Math.floor(eligibleAmount / VND_PER_POINT);

        if (points > 0) {
          const prevBal = runningBalance;
          runningBalance += points;
          totalEarned += points;
          totalEligibleSpend += eligibleAmount;
          eligibleOrdersCount += 1;

          transactions.push({
            id: `TX-LP-${orderId.slice(-6).toUpperCase()}-EARN`,
            customerId,
            orderId,
            orderCode,
            eventType: 'EARN',
            pointsDelta: points,
            previousBalance: prevBal,
            newBalance: runningBalance,
            createdAt: order.paid_at || order.updatedAt || order.createdAt || new Date().toISOString(),
            reason: `Tích lũy từ đơn hàng hoàn tất #${orderCode.slice(-8)}`,
            idempotencyKey: earnIdempotencyKey,
            ruleVersion: RULE_VERSION,
            metadata: {
              eligibleAmount,
              orderTotal: order.total_price ?? order.total,
            },
          });
        }
      }
    }

    // 2. REFUND / REVERSAL EVENT
    if (paymentStatus === 'refunded' || status === 'refunded' || order.is_refunded) {
      const refundIdempotencyKey = `refund-${orderId}-${RULE_VERSION}`;
      if (!processedKeys.has(refundIdempotencyKey)) {
        processedKeys.add(refundIdempotencyKey);

        const eligibleAmount = calculateEligibleAmount(order);
        const originalPoints = Math.floor(eligibleAmount / VND_PER_POINT);

        if (originalPoints > 0) {
          const prevBal = runningBalance;
          runningBalance = Math.max(0, runningBalance - originalPoints);
          totalReversed += originalPoints;

          transactions.push({
            id: `TX-LP-${orderId.slice(-6).toUpperCase()}-REV`,
            customerId,
            orderId,
            orderCode,
            eventType: 'REFUND_REVERSAL',
            pointsDelta: -originalPoints,
            previousBalance: prevBal,
            newBalance: runningBalance,
            createdAt: order.updatedAt || order.refunded_at || new Date().toISOString(),
            reason: `Thu hồi điểm do hoàn tiền đơn hàng #${orderCode.slice(-8)}`,
            idempotencyKey: refundIdempotencyKey,
            ruleVersion: RULE_VERSION,
            metadata: {
              reversalAmount: eligibleAmount,
            },
          });
        }
      }
    }
  }

  // Append any approved manual admin adjustments (with idempotency check)
  if (customerInfo?.manualAdjustments && Array.isArray(customerInfo.manualAdjustments)) {
    for (const adj of customerInfo.manualAdjustments) {
      if (!processedKeys.has(adj.idempotencyKey)) {
        processedKeys.add(adj.idempotencyKey);
        const prevBal = runningBalance;
        runningBalance = Math.max(0, runningBalance + adj.pointsDelta);
        if (adj.pointsDelta > 0) totalEarned += adj.pointsDelta;
        if (adj.pointsDelta < 0) totalReversed += Math.abs(adj.pointsDelta);

        transactions.push({
          ...adj,
          previousBalance: prevBal,
          newBalance: runningBalance,
        });
      }
    }
  }

  // Qualifying points are based on cumulative eligible points earned minus reversals
  const qualifyingPoints = Math.max(0, totalEarned - totalReversed);
  const currentTier = getTierForPoints(qualifyingPoints, tiers);
  const nextTier = getNextTier(currentTier.id, tiers);
  const { pointsRemaining, percentage } = calculateTierProgress(qualifyingPoints, currentTier, nextTier);

  // Return reverse chronological transactions for UI display
  const sortedTransactions = [...transactions].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return {
    customerId,
    customerName: customerInfo?.name || 'Khách Hàng Thân Thiết',
    customerEmail: customerInfo?.email || '',
    customerPhone: customerInfo?.phone || '',
    qualifyingPoints,
    earnedPoints: totalEarned,
    reversedPoints: totalReversed,
    currentBalance: runningBalance,
    currentTier,
    nextTier,
    pointsToNextTier: pointsRemaining,
    progressPercentage: percentage,
    transactions: sortedTransactions,
    eligibleOrdersCount,
    totalEligibleSpend,
  };
}

/**
 * Computes aggregate loyalty statistics across all members
 */
export function computeLoyaltySystemStats(
  profiles: CustomerLoyaltyProfile[]
): LoyaltySystemStats {
  const tierDistribution: Record<TierId, number> = {
    bronze_1: 0,
    bronze_2: 0,
    bronze_3: 0,
    silver_1: 0,
    silver_2: 0,
    silver_3: 0,
    gold_1: 0,
    gold_2: 0,
    gold_3: 0,
    diamond_1: 0,
    diamond_2: 0,
    diamond_3: 0,
  };

  const familyDistribution: Record<TierFamily, number> = {
    bronze: 0,
    silver: 0,
    gold: 0,
    diamond: 0,
  };

  let totalPointsIssued = 0;
  let totalPointsReversed = 0;
  let activeBalance = 0;

  for (const p of profiles) {
    tierDistribution[p.currentTier.id] = (tierDistribution[p.currentTier.id] || 0) + 1;
    familyDistribution[p.currentTier.family] = (familyDistribution[p.currentTier.family] || 0) + 1;
    totalPointsIssued += p.earnedPoints;
    totalPointsReversed += p.reversedPoints;
    activeBalance += p.currentBalance;
  }

  return {
    totalMembers: profiles.length,
    totalPointsIssued,
    totalPointsReversed,
    activeBalance,
    tierDistribution,
    familyDistribution,
    conversionRateVnd: VND_PER_POINT,
  };
}
