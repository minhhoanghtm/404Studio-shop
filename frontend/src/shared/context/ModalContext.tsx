import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Z_INDEX } from '../config/zIndex';

export interface ModalRegistration {
  id: string;
  onClose?: () => void;
  priority?: number; // Explicit priority level (e.g. 150 for first-visit cookie banner)
}

interface ModalContextType {
  stack: ModalRegistration[];
  registerModal: (modal: ModalRegistration) => void;
  unregisterModal: (id: string) => void;
  bringToFront: (id: string) => void;
  isTopModal: (id: string) => boolean;
  getModalZIndex: (id: string) => { overlay: number; content: number };
  topModalId: string | null;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stack, setStack] = useState<ModalRegistration[]>([]);
  // Store previous active elements for focus restoration when closing
  const previousActiveElementRef = useRef<Map<string, HTMLElement | null>>(new Map());

  const registerModal = useCallback((modal: ModalRegistration) => {
    // Save current active element before modal steals focus
    if (!previousActiveElementRef.current.has(modal.id) && typeof document !== 'undefined') {
      previousActiveElementRef.current.set(modal.id, document.activeElement as HTMLElement | null);
    }

    setStack((prev) => {
      // Re-opening an existing modal brings it to the top (end of array) without duplication
      const filtered = prev.filter((m) => m.id !== modal.id);
      return [...filtered, modal];
    });
  }, []);

  const unregisterModal = useCallback((id: string) => {
    setStack((prev) => {
      if (!prev.some((m) => m.id === id)) return prev;
      return prev.filter((m) => m.id !== id);
    });

    // Restore focus to previous element when modal is dismissed
    const prevElem = previousActiveElementRef.current.get(id);
    if (prevElem && typeof prevElem.focus === 'function') {
      setTimeout(() => {
        try {
          prevElem.focus();
        } catch {}
      }, 50);
    }
    previousActiveElementRef.current.delete(id);
  }, []);

  const bringToFront = useCallback((id: string) => {
    setStack((prev) => {
      const target = prev.find((m) => m.id === id);
      if (!target) return prev;
      return [...prev.filter((m) => m.id !== id), target];
    });
  }, []);

  const isTopModal = useCallback(
    (id: string) => {
      if (stack.length === 0) return false;
      return stack[stack.length - 1].id === id;
    },
    [stack]
  );

  const getModalZIndex = useCallback(
    (id: string) => {
      const index = stack.findIndex((m) => m.id === id);
      const modal = stack[index];

      // If modal has explicit high priority (e.g. cookie first visit = 150)
      if (modal?.priority && modal.priority > 0) {
        return {
          overlay: modal.priority - 5,
          content: modal.priority,
        };
      }

      if (index === -1) {
        // Fallback for unstacked or single render
        return {
          overlay: Z_INDEX.modalOverlayBase,
          content: Z_INDEX.modalBase,
        };
      }

      // Dynamic stacking: each subsequent modal receives base + index * 10
      // modal 0: overlay 110, content 120
      // modal 1: overlay 120, content 130
      // modal 2: overlay 130, content 140
      return {
        overlay: Z_INDEX.modalOverlayBase + index * 10,
        content: Z_INDEX.modalBase + index * 10,
      };
    },
    [stack]
  );

  // Esc key listener: Only the topmost modal receives and handles Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stack.length > 0) {
        const topModal = stack[stack.length - 1];
        if (topModal && topModal.onClose) {
          e.preventDefault();
          e.stopPropagation();
          topModal.onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Capture phase
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [stack]);

  // Body scroll locking and Lenis coordination
  useEffect(() => {
    if (stack.length > 0) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      if ((window as any).lenis?.stop) {
        (window as any).lenis.stop();
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        if ((window as any).lenis?.start) {
          (window as any).lenis.start();
        }
      };
    }
  }, [stack.length > 0]);

  const topModalId = stack.length > 0 ? stack[stack.length - 1].id : null;

  return (
    <ModalContext.Provider
      value={{
        stack,
        registerModal,
        unregisterModal,
        bringToFront,
        isTopModal,
        getModalZIndex,
        topModalId,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModalContext = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    // Graceful fallback if called outside provider (e.g. isolated test)
    return {
      stack: [],
      registerModal: () => {},
      unregisterModal: () => {},
      bringToFront: () => {},
      isTopModal: () => true,
      getModalZIndex: () => ({
        overlay: Z_INDEX.modalOverlayBase,
        content: Z_INDEX.modalBase,
      }),
      topModalId: null,
    };
  }
  return context;
};

/**
 * useModal Hook
 * Automatically registers and coordinates a modal dialog in the global modal stack
 */
export function useModal({
  id,
  isOpen,
  onClose,
  priority = 0,
}: {
  id: string;
  isOpen: boolean;
  onClose?: () => void;
  priority?: number;
}) {
  const { registerModal, unregisterModal, getModalZIndex, isTopModal, topModalId } = useModalContext();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isOpen) {
      registerModal({
        id,
        onClose: () => onCloseRef.current?.(),
        priority,
      });
      return () => {
        unregisterModal(id);
      };
    } else {
      unregisterModal(id);
    }
  }, [isOpen, id, priority, registerModal, unregisterModal]);

  const zIndices = getModalZIndex(id);
  const isTop = isTopModal(id);

  return {
    overlayZIndex: zIndices.overlay,
    contentZIndex: zIndices.content,
    isTop,
    topModalId,
  };
}

/**
 * ModalPortal Component
 * Safely renders modal DOM directly into document.body to avoid stacking context traps
 */
export const ModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};
