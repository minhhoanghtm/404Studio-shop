import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminLayout } from '../pages/Admin/AdminLayout';
import CreativeStudioEditor from '../pages/Admin/components/CreativeStudioEditor';
import type { AdminDesignProject } from '../shared/api/adminAiApi';

// Mock stores
vi.mock('@/shared/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 'u_1', name: 'Admin Root', role: 'admin' },
    permissions: ['all'],
    logout: vi.fn(),
  }),
}));

vi.mock('@/shared/stores/useThemeStore', () => ({
  useThemeStore: () => ({
    theme: 'dark',
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('@/shared/stores/useAdminAiStore', () => ({
  useAdminAiStore: () => ({
    toggleSidebar: vi.fn(),
    messages: [],
    isLoading: false,
    newConversation: vi.fn(),
    loadConversation: vi.fn(),
    sendMessage: vi.fn(),
    activeMode: 'chat',
    setMode: vi.fn(),
    activeProvider: 'gemini',
    setActiveProvider: vi.fn(),
    settingsData: null,
    loadSettings: vi.fn(),
    testConnection: vi.fn(),
    updateSettings: vi.fn(),
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style }: any) => (
      <div className={className} style={style}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}));

describe('Admin Layout & Creative Studio 1-Page Fit Suite', () => {
  it('should render fullHeight container with compact padding and overflow-y-auto for 1-page fit', () => {
    const { container } = render(
      <BrowserRouter>
        <AdminLayout title="Creative Studio Test" fullHeight={true}>
          <div data-testid="full-height-child" className="h-full flex-1">Creative Content</div>
        </AdminLayout>
      </BrowserRouter>
    );

    const child = screen.getByTestId('full-height-child');
    const scrollContainer = child.parentElement;
    expect(scrollContainer).toBeDefined();
    expect(scrollContainer?.className).toContain('overflow-y-auto');
    expect(scrollContainer?.className).toContain('p-2');
    expect(scrollContainer?.className).toContain('flex-1');
    expect(scrollContainer?.className).toContain('min-h-0');
  });

  it('should render standard scrollable container when fullHeight is false', () => {
    const { container } = render(
      <BrowserRouter>
        <AdminLayout title="Standard Page Test" fullHeight={false}>
          <div data-testid="standard-child">Standard Content</div>
        </AdminLayout>
      </BrowserRouter>
    );

    const child = screen.getByTestId('standard-child');
    // Motion wrapper -> Scroll container
    const motionWrapper = child.parentElement;
    expect(motionWrapper?.className).toContain('p-4');
    expect(motionWrapper?.className).toContain('min-h-full');
  });

  it('should render CreativeStudioEditor in 1-page layout with 3-column workspace and internal scrollbars', () => {
    const mockDesign: AdminDesignProject = {
      _id: 'test_proj_1',
      name: 'Poster Xuân Hè 2026',
      preset: 'instagram_portrait',
      width: 1080,
      height: 1350,
      background: { type: 'color', value: '#1a1918' },
      layers: [
        {
          id: 'l_1',
          type: 'text',
          name: 'Tiêu đề',
          x: 100,
          y: 200,
          width: 800,
          height: 100,
          zIndex: 1,
          visible: true,
          locked: false,
          content: 'ATELIER VÉRITÉ',
        },
      ],
    };

    const { container } = render(
      <CreativeStudioEditor
        design={mockDesign}
        onChange={vi.fn()}
        onSave={vi.fn().mockResolvedValue(undefined)}
        onAiEdit={vi.fn().mockResolvedValue(undefined)}
      />
    );

    // Root should have 100% height and overflow-hidden
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('h-full');
    expect(root.className).toContain('flex-1');
    expect(root.className).toContain('min-h-0');
    expect(root.className).toContain('overflow-hidden');

    // Toolbar should be present and contain Fit button
    expect(screen.getByText('Fit')).toBeDefined();
    expect(screen.getByDisplayValue('Poster Xuân Hè 2026')).toBeDefined();

    // Layers should list our layer
    expect(screen.getByText('Tiêu đề')).toBeDefined();
  });

  it('should render AI Workspace navigation tabs with synchronized admin-tab-active and admin-tab-inactive classes', async () => {
    const { AdminAiWorkspacePage } = await import('../pages/Admin/AdminAiWorkspacePage');
    render(
      <BrowserRouter>
        <AdminAiWorkspacePage />
      </BrowserRouter>
    );

    // Active tab (default 'chat') should have admin-tab-active
    const chatTab = screen.getByText('Trò Chuyện & Điều Hành').closest('button');
    expect(chatTab).toBeDefined();
    expect(chatTab?.className).toContain('admin-tab-active');

    // Inactive tab should have admin-tab-inactive
    const creativeTab = screen.getByText('Creative Studio (Poster & Banner)').closest('button');
    expect(creativeTab).toBeDefined();
    expect(creativeTab?.className).toContain('admin-tab-inactive');

    // Container should have standard bottom border
    const navBar = chatTab?.parentElement;
    expect(navBar?.className).toContain('border-b');
    expect(navBar?.className).toContain('pb-3');
  });

  it('should render Chat tab in 1-page fit layout with bounded grid, internal scrollbars and visible input', async () => {
    const { AdminAiWorkspacePage } = await import('../pages/Admin/AdminAiWorkspacePage');
    const { container } = render(
      <BrowserRouter>
        <AdminAiWorkspacePage />
      </BrowserRouter>
    );

    // Root wrapper should have 1-page flex-1 min-h-0 overflow-hidden
    const navBar = screen.getByText('Trò Chuyện & Điều Hành').closest('button')?.parentElement;
    const pageWrapper = navBar?.parentElement;
    expect(pageWrapper?.className).toContain('h-full');
    expect(pageWrapper?.className).toContain('flex-1');
    expect(pageWrapper?.className).toContain('min-h-0');
    expect(pageWrapper?.className).toContain('overflow-hidden');

    // Sidebar should be bounded with internal scroll
    expect(screen.getByText('Phiên Làm Việc')).toBeDefined();
    const chatInput = screen.getByPlaceholderText(/Nhập yêu cầu:/);
    expect(chatInput).toBeDefined();

    // Send button should be present
    expect(screen.getByText('Gửi')).toBeDefined();
  });

  it('renders AdminAiPosterCard with direct designId studio link and SafeMarkdown without raw ** tokens', async () => {
    const { AdminAiPosterCard } = await import('../shared/components/adminAi/cards/AdminAiCards');
    const { SafeMarkdown } = await import('../shared/components/adminAi/SafeMarkdown');

    render(
      <div>
        <SafeMarkdown content="**Doanh thu** tăng trưởng ổn định" />
        <AdminAiPosterCard
          data={{
            _id: 'design_99',
            name: 'Autumn Silk Layout',
            preset: 'instagram_portrait',
            width: 1080,
            height: 1350,
            background: { type: 'gradient', value: '#1a1918', secondaryValue: '#0d0d0c' },
            layers: [{ id: '1' }],
          }}
        />
      </div>
    );

    const strong = screen.getByText('Doanh thu');
    expect(strong.tagName.toLowerCase()).toBe('strong');
    expect(screen.queryByText(/\*\*Doanh thu\*\*/)).toBeNull();
    const link = screen.getByRole('link', { name: /Mở Trong Studio/i });
    expect(link.getAttribute('href')).toBe('/admin/ai-assistant?tab=creative&designId=design_99');
  });
});
