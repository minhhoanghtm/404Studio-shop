/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useWebsiteSettingsStore } from '../shared/stores/useWebsiteSettingsStore';
import { MaintenancePage } from '../pages/Maintenance/MaintenancePage';

describe('Maintenance Mode Access Control & UI Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWebsiteSettingsStore.setState({
      maintenanceMode: false,
      maintenanceMessage: 'Hệ thống đang được nâng cấp để mang đến trải nghiệm tốt hơn. Quý khách vui lòng quay lại sau ít phút.',
      maintenanceUntil: null,
      siteName: 'Atelier Vérité',
      hotline: '1800 6868',
      email: 'concierge@atelierverite.com',
      isLoaded: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('useWebsiteSettingsStore', () => {
    it('should initialize with default settings', () => {
      const state = useWebsiteSettingsStore.getState();
      expect(state.maintenanceMode).toBe(false);
      expect(state.siteName).toBe('Atelier Vérité');
    });

    it('should update maintenanceMode, message, and completion date via setMaintenanceState', () => {
      useWebsiteSettingsStore.getState().setMaintenanceState(
        true,
        'Bảo dưỡng máy chủ định kỳ',
        '2026-11-22T18:00:00.000Z'
      );

      const state = useWebsiteSettingsStore.getState();
      expect(state.maintenanceMode).toBe(true);
      expect(state.maintenanceMessage).toBe('Bảo dưỡng máy chủ định kỳ');
      expect(state.maintenanceUntil).toBe('2026-11-22T18:00:00.000Z');
    });
  });

  describe('MaintenancePage Component', () => {
    it('should render brand insignia, maintenance title, and custom message', () => {
      useWebsiteSettingsStore.setState({
        maintenanceMode: true,
        maintenanceMessage: 'Hệ thống đang nâng cấp phiên bản 2.5',
      });

      render(
        <MemoryRouter>
          <MaintenancePage />
        </MemoryRouter>
      );

      expect(screen.getByText('Atelier Vérité')).toBeInTheDocument();
      expect(screen.getByText('Không Gian Tạm Đóng Cửa Để Bảo Trì')).toBeInTheDocument();
      expect(screen.getByText('Hệ thống đang nâng cấp phiên bản 2.5')).toBeInTheDocument();
      expect(screen.getByText('Đăng nhập hệ thống')).toBeInTheDocument();
    });

    it('should display estimated completion time when maintenanceUntil is configured', () => {
      useWebsiteSettingsStore.setState({
        maintenanceMode: true,
        maintenanceUntil: '2026-11-22T18:00:00.000Z',
      });

      render(
        <MemoryRouter>
          <MaintenancePage />
        </MemoryRouter>
      );

      expect(screen.getByText('Dự kiến mở lại cửa hàng:')).toBeInTheDocument();
    });

    it('should display contact concierge hotline and email', () => {
      useWebsiteSettingsStore.setState({
        hotline: '1800 6868',
        email: 'concierge@atelierverite.com',
      });

      render(
        <MemoryRouter>
          <MaintenancePage />
        </MemoryRouter>
      );

      expect(screen.getByText('Concierge: 1800 6868')).toBeInTheDocument();
      expect(screen.getByText('concierge@atelierverite.com')).toBeInTheDocument();
    });
  });

  describe('Access Control Logic Simulation', () => {
    const evaluateAccess = (
      maintenanceMode: boolean,
      user: { role?: string } | null
    ): 'allow_storefront' | 'show_maintenance' => {
      const isAdmin = user?.role === 'admin';
      if (maintenanceMode && !isAdmin) {
        return 'show_maintenance';
      }
      return 'allow_storefront';
    };

    it('allows guest visitors when maintenance mode is off', () => {
      expect(evaluateAccess(false, null)).toBe('allow_storefront');
    });

    it('allows customer accounts when maintenance mode is off', () => {
      expect(evaluateAccess(false, { role: 'customer' })).toBe('allow_storefront');
    });

    it('blocks guest visitors when maintenance mode is on (shows MaintenancePage)', () => {
      expect(evaluateAccess(true, null)).toBe('show_maintenance');
    });

    it('blocks regular customer accounts when maintenance mode is on (shows MaintenancePage)', () => {
      expect(evaluateAccess(true, { role: 'customer' })).toBe('show_maintenance');
    });

    it('blocks staff or other non-admin accounts when maintenance mode is on', () => {
      expect(evaluateAccess(true, { role: 'staff' })).toBe('show_maintenance');
    });

    it('allows admin accounts (role: admin) full access even when maintenance mode is on', () => {
      expect(evaluateAccess(true, { role: 'admin' })).toBe('allow_storefront');
    });
  });
});
