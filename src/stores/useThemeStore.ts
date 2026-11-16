import { create } from 'zustand';

interface ThemeState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

const getInitialTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('atelier_theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export const useThemeStore = create<ThemeState>((set) => {
  const initialTheme = getInitialTheme();
  
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (initialTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }

  return {
    theme: initialTheme,
    toggleTheme: () => {
      set((state) => {
        const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          if (nextTheme === 'light') {
            root.classList.remove('dark');
            root.classList.add('light');
          } else {
            root.classList.remove('light');
            root.classList.add('dark');
          }
          localStorage.setItem('atelier_theme', nextTheme);
        }
        return { theme: nextTheme };
      });
    },
    setTheme: (theme) => {
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (theme === 'light') {
          root.classList.remove('dark');
          root.classList.add('light');
        } else {
          root.classList.remove('light');
          root.classList.add('dark');
        }
        localStorage.setItem('atelier_theme', theme);
      }
      set({ theme });
    },
  };
});
