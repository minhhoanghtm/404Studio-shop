import { create } from 'zustand';
import { api } from '../api/client';
import { socketService } from '../services/socketService';

interface WebsiteSettingsState {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceUntil: string | null;
  siteName: string;
  hotline: string;
  email: string;
  isLoaded: boolean;
  fetchSettings: () => Promise<void>;
  setMaintenanceState: (mode: boolean, message?: string, until?: string | null) => void;
  initSocketListener: () => () => void;
}

export const useWebsiteSettingsStore = create<WebsiteSettingsState>((set, get) => ({
  maintenanceMode: false,
  maintenanceMessage:
    'Hệ thống đang được nâng cấp để mang đến trải nghiệm tốt hơn. Quý khách vui lòng quay lại sau ít phút.',
  maintenanceUntil: null,
  siteName: 'Atelier Vérité',
  hotline: '',
  email: '',
  isLoaded: false,

  fetchSettings: async () => {
    try {
      const res: any = await api.get('/settings');
      const data = res?.data || res;
      const sys = data?.system;
      const general = data?.general;

      set({
        maintenanceMode: Boolean(sys?.maintenanceMode),
        maintenanceMessage:
          sys?.maintenanceMessage ||
          'Hệ thống đang được nâng cấp để mang đến trải nghiệm tốt hơn. Quý khách vui lòng quay lại sau ít phút.',
        maintenanceUntil: sys?.maintenanceUntil || null,
        siteName: general?.siteName || 'Atelier Vérité',
        hotline: general?.hotline || '',
        email: general?.email || '',
        isLoaded: true,
      });
    } catch {
      // In case /settings fails or backend is unreachable
      set({ isLoaded: true });
    }
  },

  setMaintenanceState: (mode: boolean, message?: string, until?: string | null) => {
    set((state) => ({
      maintenanceMode: mode,
      maintenanceMessage: message !== undefined ? message : state.maintenanceMessage,
      maintenanceUntil: until !== undefined ? until : state.maintenanceUntil,
    }));
  },

  initSocketListener: () => {
    try {
      const socket = socketService.connect();
      const onSettingsUpdated = (data: any) => {
        const sys = data?.system;
        if (sys) {
          set({
            maintenanceMode: Boolean(sys.maintenanceMode),
            maintenanceMessage:
              sys.maintenanceMessage ||
              'Hệ thống đang được nâng cấp để mang đến trải nghiệm tốt hơn. Quý khách vui lòng quay lại sau ít phút.',
            maintenanceUntil: sys.maintenanceUntil || null,
          });
        }
      };

      socket.on('settings:updated', onSettingsUpdated);
      return () => {
        socket.off('settings:updated', onSettingsUpdated);
      };
    } catch {
      return () => {};
    }
  },
}));
