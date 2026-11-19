import { useState, useEffect, useCallback } from 'react';
import { adminApi, loyaltyApi } from '@/shared/api';
import {
  CustomerLoyaltyProfile,
  PointTransaction,
  LoyaltySystemStats,
  buildCustomerLoyaltyProfile,
  computeLoyaltySystemStats,
  MEMBERSHIP_TIERS,
} from '@/shared/loyalty';

export interface UseAdminLoyaltyResult {
  profiles: CustomerLoyaltyProfile[];
  allTransactions: PointTransaction[];
  stats: LoyaltySystemStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  backendSyncMode: 'REAL_ORDER_DERIVED' | 'BACKEND_NATIVE';
}

export function useAdminLoyalty(): UseAdminLoyaltyResult {
  const [profiles, setProfiles] = useState<CustomerLoyaltyProfile[]>([]);
  const [allTransactions, setAllTransactions] = useState<PointTransaction[]>([]);
  const [stats, setStats] = useState<LoyaltySystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendSyncMode, setBackendSyncMode] = useState<'REAL_ORDER_DERIVED' | 'BACKEND_NATIVE'>('REAL_ORDER_DERIVED');

  const fetchAdminLoyaltyData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Check if backend native loyalty admin endpoints exist
      try {
        const [nativeStats, nativeCustomers, nativeTx] = await Promise.all([
          loyaltyApi.getAdminStats(),
          loyaltyApi.getAdminCustomers(),
          loyaltyApi.getAdminTransactions(),
        ]);

        if (nativeStats?.data && nativeCustomers?.data) {
          setStats(nativeStats.data);
          setProfiles(nativeCustomers.data);
          setAllTransactions(nativeTx?.data || []);
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
        const profile = buildCustomerLoyaltyProfile(
          custId,
          userOrders,
          {
            name: cust.fullName || cust.name,
            email: cust.email,
            phone: cust.phone,
          },
          MEMBERSHIP_TIERS
        );

        computedProfiles.push(profile);
        combinedTx.push(...profile.transactions);
      }

      // Also account for any orders whose user_id wasn't in the customer list
      for (const [userId, userOrders] of ordersByUser.entries()) {
        if (userId === 'guest') continue;
        const exists = computedProfiles.some((p) => p.customerId === userId);
        if (!exists) {
          const profile = buildCustomerLoyaltyProfile(
            userId,
            userOrders,
            { name: `Thành viên #${userId.slice(-6)}` },
            MEMBERSHIP_TIERS
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
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminLoyaltyData();
  }, [fetchAdminLoyaltyData]);

  return {
    profiles,
    allTransactions,
    stats,
    isLoading,
    error,
    refetch: fetchAdminLoyaltyData,
    backendSyncMode,
  };
}
