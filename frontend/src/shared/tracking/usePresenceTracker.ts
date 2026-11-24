import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../stores/useAuthStore';
import { useToastStore } from '../stores/useToastStore';
import { socketService } from '../services/socketService';

export type PresenceStatus = 'active' | 'idle' | 'away' | 'background';

const VISITOR_ID_KEY = 'visitorId';
const ANON_ID_KEY = 'atelier_anon_id';

/**
 * Ngưỡng thời gian không tương tác chuột/phím để tính là "Treo" (Idle/Away):
 * 3 phút = 180 giây
 */
export const IDLE_THRESHOLD_SECONDS = 180;

/**
 * Lấy hoặc tạo mới visitorId ngẫu nhiên chuẩn UUID v4 lưu trong localStorage
 */
export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'visitor-ssr-fallback';

  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (visitorId && visitorId.trim()) {
      return visitorId.trim();
    }

    // Tái sử dụng anon_id nếu đã có
    const existingAnonId = localStorage.getItem(ANON_ID_KEY);
    if (existingAnonId && existingAnonId.trim()) {
      visitorId = existingAnonId.trim();
    } else if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      visitorId = crypto.randomUUID();
    } else {
      visitorId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }

    localStorage.setItem(VISITOR_ID_KEY, visitorId);
    return visitorId;
  } catch {
    return 'visitor-storage-fallback';
  }
}

/**
 * Hook theo dõi hiện diện và phát nhịp tim (Heartbeat) định kỳ 15s,
 * khi đổi trang, hoặc khi tab ẩn/hiện.
 * Nếu người dùng không thao tác trong vòng 3 phút (>= 180s) sẽ tự động chuyển sang trạng thái "Treo" (idle).
 */
export function usePresenceTracker(): void {
  const location = useLocation();
  const lastActiveRef = useRef<number>(Date.now());
  const currentStatusRef = useRef<PresenceStatus>('active');
  const lastSentPageRef = useRef<string>('');
  const lastSentStatusRef = useRef<PresenceStatus | ''>('');
  const lastSentTimeRef = useRef<number>(0);

  const computeStatus = useCallback((): PresenceStatus => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return 'background';
    }
    const idleSec = Math.floor((Date.now() - lastActiveRef.current) / 1000);
    // Nếu người dùng không thao tác trong vòng 3 phút (180 giây) thì tính là "Treo"
    if (idleSec >= IDLE_THRESHOLD_SECONDS) {
      return 'idle';
    }
    return 'active';
  }, []);

  const sendHeartbeat = useCallback(
    async (overrideStatus?: PresenceStatus) => {
      if (typeof window === 'undefined') return;

      const visitorId = getOrCreateVisitorId();
      const page = window.location.pathname || '/';
      const status = overrideStatus || computeStatus();
      currentStatusRef.current = status;

      const now = Date.now();
      // Ngăn spam heartbeat gửi liên tiếp trong vòng 1.5 giây nếu page và status không đổi
      if (
        lastSentPageRef.current === page &&
        lastSentStatusRef.current === status &&
        now - lastSentTimeRef.current < 1500
      ) {
        return;
      }

      lastSentPageRef.current = page;
      lastSentStatusRef.current = status;
      lastSentTimeRef.current = now;

      try {
        await api
          .post('/events/presence/heartbeat', {
            visitorId,
            visitor_id: visitorId,
            session_id: visitorId,
            page,
            current_route: page,
            status,
            timestamp: now,
          })
          .catch(() => {
            // Không chặn hoặc gián đoạn UI nếu mạng lag
          });
      } catch {
        // Ignored
      }
    },
    [computeStatus]
  );

  // 1. Khi đổi trang (route change)
  useEffect(() => {
    void sendHeartbeat();
  }, [location.pathname, sendHeartbeat]);

  // 2. Định kỳ 15 giây gửi nhịp tim
  useEffect(() => {
    const interval = setInterval(() => {
      void sendHeartbeat();
    }, 15000);

    return () => clearInterval(interval);
  }, [sendHeartbeat]);

  // 3. Lắng nghe cử chỉ người dùng để cập nhật trạng thái tương tác
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleUserActivity = () => {
      lastActiveRef.current = Date.now();
      if (currentStatusRef.current !== 'active' && document.visibilityState === 'visible') {
        if (!throttleTimeout) {
          throttleTimeout = setTimeout(() => {
            throttleTimeout = null;
            void sendHeartbeat('active');
          }, 500);
        }
      }
    };

    const userEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    userEvents.forEach((ev) => {
      window.addEventListener(ev, handleUserActivity, { passive: true });
    });

    // 4. Lắng nghe tab ẩn / hiện (Visibility change)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void sendHeartbeat('background');
      } else {
        lastActiveRef.current = Date.now();
        void sendHeartbeat('active');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 5. Lắng nghe window focus / blur
    const handleFocus = () => {
      lastActiveRef.current = Date.now();
      void sendHeartbeat('active');
    };
    const handleBlur = () => {
      // Khi tab mất focus nhưng chưa chắc bị hidden
      if (document.visibilityState === 'hidden') {
        void sendHeartbeat('background');
      }
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // 6. Beacon leave khi đóng tab / rời trang
    const handleUnload = () => {
      try {
        const vid = getOrCreateVisitorId();
        const leavePayload = JSON.stringify({
          visitorId: vid,
          visitor_id: vid,
          session_id: vid,
          reason: 'tab_closed',
        });
        if (navigator.sendBeacon) {
          const configuredBase = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/$/, '');
          const base = configuredBase.endsWith('/api')
            ? configuredBase
            : (configuredBase === '' ? '/api' : `${configuredBase}/api`);
          const blob = new Blob([leavePayload], { type: 'application/json' });
          navigator.sendBeacon(`${base}/events/presence/leave`, blob);
        }
      } catch {}
    };
    window.addEventListener('pagehide', handleUnload);

    return () => {
      if (throttleTimeout) clearTimeout(throttleTimeout);
      userEvents.forEach((ev) => {
        window.removeEventListener(ev, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [sendHeartbeat]);

  // 7. Lắng nghe sự kiện Quản trị viên buộc đăng xuất hoặc chấm dứt phiên (Admin Force Logout)
  useEffect(() => {
    const s = socketService.connect();
    const handleForceLogout = (payload: {
      visitorId?: string;
      sessionId?: string;
      userId?: string;
      message?: string;
    }) => {
      const vid = getOrCreateVisitorId();
      const currentAuth = useAuthStore.getState();
      const uid = currentAuth.user?.id || (currentAuth.user as any)?._id;

      const targetVid = payload?.visitorId || payload?.sessionId;
      const isMatch =
        (targetVid && targetVid === vid) ||
        (payload?.userId && String(payload.userId) === String(uid));

      if (isMatch) {
        useToastStore
          .getState()
          .addToast(
            payload?.message || 'Phiên làm việc của bạn đã được Quản trị viên kết thúc.',
            'info'
          );
        if (currentAuth.isAuthenticated) {
          currentAuth.logout();
        }
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
          window.location.href = '/login';
        }
      }
    };

    s.on('presence:session_terminated', handleForceLogout);
    s.on('auth:force_logout', handleForceLogout);

    return () => {
      s.off('presence:session_terminated', handleForceLogout);
      s.off('auth:force_logout', handleForceLogout);
    };
  }, []);
}
