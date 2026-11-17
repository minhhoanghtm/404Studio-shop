import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useConsentStore } from './useConsentStore';
import { ConsentBanner } from './ConsentBanner';
import { ConsentPreferencesModal } from './ConsentPreferencesModal';
import { TrackingRegistry } from '../tracking/TrackingRegistry';

export const ConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initializeConsent = useConsentStore((state) => state.initializeConsent);
  const location = useLocation();

  // Initialize consent on mount
  useEffect(() => {
    initializeConsent();
  }, [initializeConsent]);

  // Synchronize across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'atelier_privacy_consent') {
        initializeConsent();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initializeConsent]);

  // Track pageviews safely (stubs drop automatically if analytics not allowed)
  useEffect(() => {
    TrackingRegistry.trackPageView(location.pathname + location.search);
  }, [location]);

  return (
    <>
      {children}
      <ConsentBanner />
      <ConsentPreferencesModal />
    </>
  );
};
