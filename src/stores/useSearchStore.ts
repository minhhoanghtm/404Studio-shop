import { create } from 'zustand';

interface SearchState {
  isOpen: boolean;
  query: string;
  recentSearches: string[];
  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (query: string) => void;
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
}

const loadRecentSearches = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('atelier_recent_searches');
    return saved ? JSON.parse(saved) : ['Cashmere Coat', 'Silk Column Gown', 'Leather Loafers', 'Architectural Blazer'];
  } catch {
    return ['Cashmere Coat', 'Silk Column Gown', 'Leather Loafers'];
  }
};

export const useSearchStore = create<SearchState>((set, get) => ({
  isOpen: false,
  query: '',
  recentSearches: loadRecentSearches(),

  openSearch: () => set({ isOpen: true }),
  closeSearch: () => set({ isOpen: false, query: '' }),
  setQuery: (query: string) => set({ query }),

  addRecentSearch: (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const current = get().recentSearches.filter((t) => t.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...current].slice(0, 6);
    set({ recentSearches: updated });
    if (typeof window !== 'undefined') {
      localStorage.setItem('atelier_recent_searches', JSON.stringify(updated));
    }
  },

  clearRecentSearches: () => {
    set({ recentSearches: [] });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('atelier_recent_searches');
    }
  },
}));
