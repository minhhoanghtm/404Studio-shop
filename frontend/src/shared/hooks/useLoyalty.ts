import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { ordersApi, loyaltyApi } from '../api';
import {
  CustomerLoyaltyProfile,
  buildCustomerLoyaltyProfile,
  getActiveMembershipTiers,
  getManualAdjustments,
  EVENT_LOYALTY_SETTINGS_CHANGED,
  EVENT_LOYALTY_ADJUSTMENTS_CHANGED,
} from '../loyalty';

export interface UseLoyaltyResult {
  profile: CustomerLoyaltyProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  backendSyncMode: 'REAL_ORDER_DERIVED' | 'BACKEND_NATIVE';
}

export function useLoyalty(): UseLoyaltyResult {
  const { user, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState<CustomerLoyaltyProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [backendSyncMode, setBackendSyncMode] = useState<'REAL_ORDER_DERIVED' | 'BACKEND_NATIVE'>('REAL_ORDER_DERIVED');

  const fetchLoyaltyData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const customerId = String(user.id || (user as any)._id || 'current-user');
    const customerInfo = {
      name: user.name || (user as any).fullName,
      email: user.email,
      phone: user.phone,
    };

    try {
      // 1. Attempt to fetch native backend loyalty profile first
      try {
        const nativeRes = await loyaltyApi.getProfile();
        if (nativeRes && nativeRes.data && nativeRes.data.currentTier) {
          setProfile(nativeRes.data);
          setBackendSyncMode('BACKEND_NATIVE');
          setIsLoading(false);
          return;
        }
      } catch {
        // Backend loyalty route not yet registered on legacy backend — proceed to Real Order derivation
      }

      // 2. Derive loyalty strictly from Real Backend Orders (GET /order)
      const ordersRes = await ordersApi.getMyOrders();
      const rawOrders: any = ordersRes?.data || [];
      const ordersList: any[] = Array.isArray(rawOrders) ? rawOrders : (rawOrders.orders || rawOrders.items || []);

      const activeTiers = getActiveMembershipTiers();
      const myAdjustments = getManualAdjustments().filter(
        (adj) => String(adj.customerId) === String(customerId)
      );

      const derivedProfile = buildCustomerLoyaltyProfile(
        customerId,
        ordersList,
        {
          ...customerInfo,
          manualAdjustments: myAdjustments,
        },
        activeTiers
      );

      setProfile(derivedProfile);
      setBackendSyncMode('REAL_ORDER_DERIVED');
    } catch (err: any) {
      console.warn('[useLoyalty] Error loading loyalty profile:', err);
      // Fallback: Build 0-point profile for customer
      const activeTiers = getActiveMembershipTiers();
      const myAdjustments = getManualAdjustments().filter(
        (adj) => String(adj.customerId) === String(customerId)
      );
      const fallbackProfile = buildCustomerLoyaltyProfile(
        customerId,
        [],
        {
          ...customerInfo,
          manualAdjustments: myAdjustments,
        },
        activeTiers
      );
      setProfile(fallbackProfile);
      setError(err?.message || 'Không thể tải dữ liệu đơn hàng');
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    fetchLoyaltyData();
  }, [fetchLoyaltyData]);

  // Reactive listener for tier changes and manual adjustments
  useEffect(() => {
    const handleUpdate = () => {
      fetchLoyaltyData();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_LOYALTY_SETTINGS_CHANGED, handleUpdate);
      window.addEventListener(EVENT_LOYALTY_ADJUSTMENTS_CHANGED, handleUpdate);
      return () => {
        window.removeEventListener(EVENT_LOYALTY_SETTINGS_CHANGED, handleUpdate);
        window.removeEventListener(EVENT_LOYALTY_ADJUSTMENTS_CHANGED, handleUpdate);
      };
    }
  }, [fetchLoyaltyData]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchLoyaltyData,
    backendSyncMode,
  };
}
