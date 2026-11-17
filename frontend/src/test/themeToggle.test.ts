import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useThemeStore, applyThemeToDOM, getInitialTheme } from '../shared/stores/useThemeStore';

describe('Light/Dark Mode Theme System Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.colorScheme = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC-1: applyThemeToDOM properly configures document.documentElement classes and colorScheme', () => {
    applyThemeToDOM('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');

    applyThemeToDOM('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('TC-2: getInitialTheme respects stored localStorage choice over system preference', () => {
    localStorage.setItem('atelier_theme', 'light');
    expect(getInitialTheme()).toBe('light');

    localStorage.setItem('atelier_theme', 'dark');
    expect(getInitialTheme()).toBe('dark');
  });

  it('TC-3: toggleTheme switches theme, updates DOM, and updates localStorage', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(localStorage.getItem('atelier_theme')).toBe('dark');

    // Toggle to Light
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('atelier_theme')).toBe('light');

    // Toggle back to Dark
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(localStorage.getItem('atelier_theme')).toBe('dark');
  });

  it('TC-4: setTheme explicitly sets theme and persists to localStorage', () => {
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(localStorage.getItem('atelier_theme')).toBe('light');

    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('atelier_theme')).toBe('dark');
  });

  it('TC-5: handles corrupted or invalid localStorage entries gracefully', () => {
    localStorage.setItem('atelier_theme', 'invalid_mode');
    const theme = getInitialTheme();
    expect(['dark', 'light']).toContain(theme);
  });
});
