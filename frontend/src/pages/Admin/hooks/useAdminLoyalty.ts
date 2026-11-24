import { useState, useEffect, useCallback } from 'react';
import { adminApi, loyaltyApi } from '@/shared/api';
import {
  CustomerLoyaltyProfile,
  PointTransaction,
  LoyaltySystemStats,
  buildCustomerLoyaltyProfile,
  computeLoyaltySystemStats,
  getActiveMembershipTiers,
  getManualAdjustments,
  EVENT_LOYALTY_SETTINGS_CHANGED,
  EVENT_LOYALTY_ADJUSTMENTS_CHANGED,
} from '@/shared/loyalty';

export interface UseAdminLoyaltyResult {
  profiles: CustomerLoyaltyProfile[];
  allTransactions: PointTransaction[];
  stats: LoyaltySystemStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: (silent?: boolean) => Promise<void>;
  backendSyncMode: 'REAL_ORDER_DERIVED' | 'BACKEND_NATIVE';
}

export function useAdminLoyalty(): UseAdminLoyaltyResult {
  const [profiles, setProfiles] = useState<CustomerLoyaltyProfile[]>([]);
  const [allTransactions, setAllTransactions] = useState<PointTransaction[]>([]);
  const [stats, setStats] = useState<LoyaltySystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendSyncMode, setBackendSyncMode] = useState<'REAL_ORDER_DERIVED' | 'BACKEND_NATIVE'>('REAL_ORDER_DERIVED');

  const fetchAdminLoyaltyData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      // Retrieve active tier thresholds and administrative manual adjustments
      const activeTiers = getActiveMembershipTiers();
      const manualAdjustments = getManualAdjustments();

      // Group adjustments by customerId
      const adjustmentsByCust = new Map<string, PointTransaction[]>();
      for (const adj of manualAdjustments) {
        if (!adjustmentsByCust.has(adj.customerId)) {
          adjustmentsByCust.set(adj.customerId, []);
        }
        adjustmentsByCust.get(adj.customerId)!.push(adj);
      }

      // 1. Check if backend native loyalty admin endpoints exist
      try {
        const [nativeStats, nativeCustomers, nativeTx] = await Promise.all([
          loyaltyApi.getAdminStats(),
          loyaltyApi.getAdminCustomers(),
          loyaltyApi.getAdminTransactions(),
        ]);

        if (nativeStats?.data && nativeCustomers?.data) {
          // If native backend returned profiles, ensure local adjustments are incorporated
          const baseCustomers = Array.isArray(nativeCustomers.data) ? nativeCustomers.data : [];
          const mergedProfiles = baseCustomers.map((cust: any) => {
            const custId = String(cust.customerId || cust._id || cust.id);
            const extraAdjs = adjustmentsByCust.get(custId) || [];
            if (extraAdjs.length === 0) return cust;
            const extraDelta = extraAdjs.reduce((sum, a) => sum + (a.pointsDelta || 0), 0);
            const updatedBalance = Math.max(0, (cust.currentBalance || 0) + extraDelta);
            return {
              ...cust,
              currentBalance: updatedBalance,
              qualifyingPoints: Math.max(0, (cust.qualifyingPoints || cust.currentBalance || 0) + extraDelta),
              transactions: [...extraAdjs, ...(cust.transactions || [])],
            };
          });

          setStats(nativeStats.data);
          setProfiles(mergedProfiles);
          setAllTransactions([...manualAdjustments, ...(nativeTx?.data || [])]);
          setBackendSyncMode('BACKEND_NATIVE');
          setIsLoading(false);
          return;
        }
      } catch {
        // Backend loyalty route not yet registered on legacy backend — proceed to Real Order derivation
      }

      // 2. Fetch real orders and real customers from Backend APIs
      const [ordersRes, customersRes] = await Promise.all([
        adminApi.getAllOrders({ limit: 1000 }),
        adminApi.getCustomers(),
      ]);

      const rawOrders = ordersRes?.data?.items || ordersRes?.data || [];
      const ordersList: any[] = Array.isArray(rawOrders) ? rawOrders : [];

      const rawCustomers = customersRes?.data || [];
      const customersList: any[] = Array.isArray(rawCustomers) ? rawCustomers : [];

      // Group orders by user_id
      const ordersByUser = new Map<string, any[]>();
      for (const order of ordersList) {
        if (!order) continue;
        const uId = order.user_id ? String(order.user_id._id || order.user_id.id || order.user_id) : 'guest';
        if (!ordersByUser.has(uId)) {
          ordersByUser.set(uId, []);
        }
        ordersByUser.get(uId)!.push(order);
      }

      // Build loyalty profiles for all registered customers
      const computedProfiles: CustomerLoyaltyProfile[] = [];
      const combinedTx: PointTransaction[] = [];

      for (const cust of customersList) {
        const custId = String(cust._id || cust.id);
        const userOrders = ordersByUser.get(custId) || [];
        const custAdjs = adjustmentsByCust.get(custId) || [];
        const profile = buildCustomerLoyaltyProfile(
          custId,
          userOrders,
          {
            name: cust.fullName || cust.name,
            email: cust.email,
            phone: cust.phone,
            manualAdjustments: custAdjs,
          },
          activeTiers
        );

        computedProfiles.push(profile);
        combinedTx.push(...profile.transactions);
      }

      // Also account for any orders whose user_id wasn't in the customer list
      for (const [userId, userOrders] of ordersByUser.entries()) {
        if (userId === 'guest') continue;
        const exists = computedProfiles.some((p) => p.customerId === userId);
        if (!exists) {
          const custAdjs = adjustmentsByCust.get(userId) || [];
          const profile = buildCustomerLoyaltyProfile(
            userId,
            userOrders,
            {
              name: `Thành viên #${userId.slice(-6)}`,
              manualAdjustments: custAdjs,
            },
            activeTiers
          );
          computedProfiles.push(profile);
          combinedTx.push(...profile.transactions);
        }
      }

      // Account for any customer with manual adjustments only
      for (const [adjCustomerId, adjs] of adjustmentsByCust.entries()) {
        const exists = computedProfiles.some((p) => p.customerId === adjCustomerId);
        if (!exists) {
          const profile = buildCustomerLoyaltyProfile(
            adjCustomerId,
            [],
            {
              name: `Khách hàng #${adjCustomerId.slice(-6)}`,
              manualAdjustments: adjs,
            },
            activeTiers
          );
          computedProfiles.push(profile);
          combinedTx.push(...profile.transactions);
        }
      }

      // Sort profiles by qualifyingPoints descending
      computedProfiles.sort((a, b) => b.qualifyingPoints - a.qualifyingPoints);

      // Sort all transactions by createdAt descending
      combinedTx.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const computedStats = computeLoyaltySystemStats(computedProfiles);

      setProfiles(computedProfiles);
      setAllTransactions(combinedTx);
      setStats(computedStats);
      setBackendSyncMode('REAL_ORDER_DERIVED');
    } catch (err: any) {
      console.warn('[useAdminLoyalty] Error deriving admin loyalty data:', err);
      setError(err?.message || 'Không thể tổng hợp dữ liệu khách hàng thân thiết');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminLoyaltyData();
  }, [fetchAdminLoyaltyData]);

  // Reactive listener for local adjustments & tier threshold updates
  useEffect(() => {
    const handleUpdate = () => {
      // Khi có thay đổi cấu hình hoặc điều chỉnh điểm, cập nhật âm thầm không reload spinner
      fetchAdminLoyaltyData(true);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_LOYALTY_SETTINGS_CHANGED, handleUpdate);
      window.addEventListener(EVENT_LOYALTY_ADJUSTMENTS_CHANGED, handleUpdate);
      return () => {
        window.removeEventListener(EVENT_LOYALTY_SETTINGS_CHANGED, handleUpdate);
        window.removeEventListener(EVENT_LOYALTY_ADJUSTMENTS_CHANGED, handleUpdate);
      };
    }
  }, [fetchAdminLoyaltyData]);

  return {
    profiles,
    allTransactions,
    stats,
    isLoading,
    error,
    refetch: (silent = true) => fetchAdminLoyaltyData(silent),
    backendSyncMode,
  };
}
