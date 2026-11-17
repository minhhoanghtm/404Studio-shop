import { create } from 'zustand';

export type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const applyThemeToDOM = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }
  root.style.colorScheme = theme;
};

export const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem('atelier_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // localStorage may be inaccessible in sandboxes
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = getInitialTheme();
  applyThemeToDOM(initialTheme);

  // Cross-tab synchronization via storage event
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === 'atelier_theme') {
        const newTheme = e.newValue === 'light' ? 'light' : 'dark';
        if (newTheme !== get().theme) {
          applyThemeToDOM(newTheme);
          set({ theme: newTheme });
        }
      }
    });

    // Listen for OS system preference changes if no manual preference has been stored
    const mediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', (e) => {
        try {
          const saved = localStorage.getItem('atelier_theme');
          if (!saved) {
            const sysTheme: Theme = e.matches ? 'dark' : 'light';
            applyThemeToDOM(sysTheme);
            set({ theme: sysTheme });
          }
        } catch {
          // ignore
        }
      });
    }
  }

  return {
    theme: initialTheme,
    toggleTheme: () => {
      const nextTheme: Theme = get().theme === 'dark' ? 'light' : 'dark';
      applyThemeToDOM(nextTheme);
      try {
        localStorage.setItem('atelier_theme', nextTheme);
      } catch {
        // ignore
      }
      set({ theme: nextTheme });
    },
    setTheme: (theme: Theme) => {
      applyThemeToDOM(theme);
      try {
        localStorage.setItem('atelier_theme', theme);
      } catch {
        // ignore
      }
      set({ theme });
    },
  };
});
