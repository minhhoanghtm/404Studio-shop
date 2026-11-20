/**
 * ATELIER VÉRITÉ — Admin Visual Page Builder & Dynamic Layout Editor
 * Comprehensive no-code visual canvas for administrators.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Sun,
  Moon,
  Undo2,
  Redo2,
  Save,
  Send,
  Eye,
  Sparkles,
  Layers,
  Grid,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  PanelLeft,
  PanelRight,
  X,
} from 'lucide-react';
import {
  EditorSection,
  BlockItem,
  ViewportMode,
  PageDocument,
  PageType,
  PageStatus,
  BackendSectionType,
  BlockType,
  PageTemplate,
} from '@/shared/cms/types';
import { createBlockInstance } from '@/shared/cms/blockLibrary';
import { validateLegalPageForPublish, LegalValidationResult } from '@/shared/cms/legalValidator';
import { BlockRenderer } from '@/shared/cms/BlockRenderer';
import { BlockLibraryPanel } from './components/BlockLibraryPanel';
import { PageStructurePanel } from './components/PageStructurePanel';
import { BlockInspectorPanel } from './components/BlockInspectorPanel';
import { TemplateSelectorModal } from './components/TemplateSelectorModal';
import { cmsPagesApi } from '@/shared/api';

export const AdminPageBuilderEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Core Editor State
  const [pageMeta, setPageMeta] = useState<Partial<PageDocument>>({
    title: 'Trang Nội Dung Mới',
    slug: 'trang-moi-' + Date.now().toString().slice(-4),
    type: 'lookbook',
    status: 'draft',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });

  const [sections, setSections] = useState<EditorSection[]>([
    {
      id: 'sec_default_1',
      type: 'hero',
      title: 'Phân Vùng Đầu Tiên',
      order: 0,
      isActive: true,
      blocks: [createBlockInstance('heading'), createBlockInstance('paragraph')],
    },
  ]);

  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>('sec_default_1');
  const [leftTab, setLeftTab] = useState<'library' | 'structure'>('library');
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [activeMobileDrawer, setActiveMobileDrawer] = useState<'none' | 'left' | 'right'>('none');

  // Undo / Redo History
  const [history, setHistory] = useState<
    { sections: EditorSection[]; pageMeta: Partial<PageDocument> }[]
  >([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [legalValidationModal, setLegalValidationModal] = useState<LegalValidationResult | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Push to history
  const pushHistory = useCallback(
    (newSections: EditorSection[], newPageMeta: Partial<PageDocument>) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [
          ...sliced,
          {
            sections: JSON.parse(JSON.stringify(newSections)),
            pageMeta: JSON.parse(JSON.stringify(newPageMeta)),
          },
        ];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setSections(JSON.parse(JSON.stringify(prev.sections)));
      setPageMeta(JSON.parse(JSON.stringify(prev.pageMeta)));
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setSections(JSON.parse(JSON.stringify(next.sections)));
      setPageMeta(JSON.parse(JSON.stringify(next.pageMeta)));
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Fetch page data if editing
  useEffect(() => {
    if (!id) {
      pushHistory(sections, pageMeta);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await cmsPagesApi.getPageDetail(id);
        if (res?.data?.page) {
          const p = res.data.page;
          const secs = res.data.sections || [];

          setPageMeta({
            _id: p._id,
            title: p.title,
            slug: p.slug,
            type: p.type as any,
            status: p.status as any,
            seoTitle: p.seoTitle || '',
            seoDescription: p.seoDescription || '',
            seoKeywords: p.seoKeywords || '',
            displayOrder: p.displayOrder || 0,
            isFeatured: p.isFeatured || false,
          });

          // Rehydrate sections & blocks
          if (secs.length > 0) {
            const rehydrated: EditorSection[] = secs.map((s: any, idx: number) => {
              const blocks: BlockItem[] = s.data?.blocks || [];
              // If legacy section without blocks array, map primary content to a block
              if (blocks.length === 0) {
                if (s.type === 'hero') {
                  blocks.push({
                    ...createBlockInstance('heading'),
                    content: { text: s.data?.title || p.title, level: 'h1' },
                  });
                  if (s.data?.description) {
                    blocks.push({
                      ...createBlockInstance('paragraph'),
                      content: { text: s.data.description },
                    });
                  }
                } else if (s.type === 'story') {
                  blocks.push({
                    ...createBlockInstance('paragraph'),
                    content: { text: s.data?.content || '' },
                  });
                } else if (s.type === 'quote') {
                  blocks.push({
                    ...createBlockInstance('quote'),
                    content: { quote: s.data?.quote || '', author: s.data?.author || '' },
                  });
                } else {
                  blocks.push(createBlockInstance('paragraph'));
                }
              }

              return {
                id: s._id || `sec_${idx}`,
                type: s.type,
                title: s.title || `Vùng ${idx + 1}`,
                order: s.order || idx,
                isActive: s.isActive ?? true,
                blocks,
                styles: s.data?.styles || {},
                data: s.data || {},
              };
            });

            setSections(rehydrated);
            if (rehydrated[0]) setActiveSectionId(rehydrated[0].id);
            pushHistory(rehydrated, p as any);
          }
        }
      } catch (err: any) {
        showToast('error', err?.message || 'Không thể tải chi tiết trang');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  // Section & Block Manipulations
  const handleAddBlock = (type: BlockType) => {
    const newBlock = createBlockInstance(type);
    let targetSectionId = activeSectionId;

    if (!sections.some((s) => s.id === targetSectionId)) {
      if (sections.length > 0) {
        targetSectionId = sections[0].id;
      } else {
        const newSec: EditorSection = {
          id: `sec_${Date.now()}`,
          type: 'story',
          title: 'Phân Vùng Mới',
          order: 0,
          isActive: true,
          blocks: [newBlock],
        };
        const updated = [newSec];
        setSections(updated);
        setActiveSectionId(newSec.id);
        setActiveBlockId(newBlock.id);
        pushHistory(updated, pageMeta);
        return;
      }
    }

    const updated = sections.map((sec) => {
      if (sec.id === targetSectionId) {
        return {
          ...sec,
          blocks: [...sec.blocks, newBlock],
        };
      }
      return sec;
    });

    setSections(updated);
    setActiveBlockId(newBlock.id);
    pushHistory(updated, pageMeta);
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<BlockItem>) => {
    const updated = sections.map((sec) => ({
      ...sec,
      blocks: sec.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
    }));
    setSections(updated);
  };

  const handleDeleteBlock = (blockId: string) => {
    const updated = sections.map((sec) => ({
      ...sec,
      blocks: sec.blocks.filter((b) => b.id !== blockId),
    }));
    setSections(updated);
    if (activeBlockId === blockId) setActiveBlockId(null);
    pushHistory(updated, pageMeta);
  };

  const handleDuplicateBlock = (blockId: string) => {
    const updated = sections.map((sec) => {
      const idx = sec.blocks.findIndex((b) => b.id === blockId);
      if (idx === -1) return sec;

      const target = sec.blocks[idx];
      const clone: BlockItem = {
        ...JSON.parse(JSON.stringify(target)),
        id: `block_${target.type}_${Date.now()}_clone`,
        label: `${target.label} (Bản sao)`,
      };

      const newBlocks = [...sec.blocks];
      newBlocks.splice(idx + 1, 0, clone);
      return { ...sec, blocks: newBlocks };
    });

    setSections(updated);
    pushHistory(updated, pageMeta);
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    const updated = sections.map((sec) => {
      const idx = sec.blocks.findIndex((b) => b.id === blockId);
      if (idx === -1) return sec;

      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= sec.blocks.length) return sec;

      const newBlocks = [...sec.blocks];
      const temp = newBlocks[idx];
      newBlocks[idx] = newBlocks[newIdx];
      newBlocks[newIdx] = temp;
      return { ...sec, blocks: newBlocks };
    });

    setSections(updated);
    pushHistory(updated, pageMeta);
  };

  const handleAddSection = (type: BackendSectionType = 'story') => {
    const newSec: EditorSection = {
      id: `sec_${Date.now()}`,
      type,
      title: `Phân Vùng ${sections.length + 1}`,
      order: sections.length,
      isActive: true,
      blocks: [createBlockInstance('heading')],
    };
    const updated = [...sections, newSec];
    setSections(updated);
    setActiveSectionId(newSec.id);
    pushHistory(updated, pageMeta);
  };

  const handleDeleteSection = (sectionId: string) => {
    const updated = sections.filter((s) => s.id !== sectionId);
    setSections(updated);
    if (activeSectionId === sectionId) {
      setActiveSectionId(updated[0]?.id || '');
    }
    pushHistory(updated, pageMeta);
  };

  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) return;

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[idx];
    newSections[idx] = newSections[newIdx];
    newSections[newIdx] = temp;

    // reorder
    newSections.forEach((s, i) => (s.order = i));
    setSections(newSections);
    pushHistory(newSections, pageMeta);
  };

  const handleSelectTemplate = (template: PageTemplate) => {
    setPageMeta((prev) => ({
      ...prev,
      title: template.defaultTitle,
      slug: template.defaultSlug,
      type: template.type,
    }));
    setSections(JSON.parse(JSON.stringify(template.sections)));
    setIsTemplateModalOpen(false);
    showToast('success', `Đã áp dụng mẫu: ${template.name}`);
    pushHistory(template.sections, {
      ...pageMeta,
      title: template.defaultTitle,
      slug: template.defaultSlug,
      type: template.type,
    });
  };

  // Convert EditorSections to Backend Schema format
  const formatPayload = (statusOverride?: PageStatus) => {
    const backendSections = sections.map((sec, idx) => {
      // Find fallback data
      const firstHeading = sec.blocks.find((b) => b.type === 'heading');
      const firstPara = sec.blocks.find((b) => b.type === 'paragraph');
      const firstBanner = sec.blocks.find((b) => b.type === 'banner');
      const firstQuote = sec.blocks.find((b) => b.type === 'quote');

      const data: Record<string, any> = {
        title: firstHeading?.content?.text || firstBanner?.content?.title || sec.title,
        description: firstPara?.content?.text || firstBanner?.content?.subtitle,
        content: firstPara?.content?.text,
        quote: firstQuote?.content?.quote,
        author: firstQuote?.content?.author,
        coverImage: firstBanner?.content?.imageUrl,
        blocks: sec.blocks,
        styles: sec.styles,
      };

      return {
        type: sec.type,
        order: idx,
        isActive: sec.isActive,
        data,
      };
    });

    return {
      title: pageMeta.title || 'Trang Chưa Đặt Tên',
      slug: pageMeta.slug || `page-${Date.now()}`,
      type: pageMeta.type || 'landing',
      status: statusOverride || pageMeta.status || 'draft',
      seoTitle: pageMeta.seoTitle,
      seoDescription: pageMeta.seoDescription,
      seoKeywords: pageMeta.seoKeywords,
      sections: backendSections,
    };
  };

  // Save Draft Handler
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const payload = formatPayload('draft');
      if (isEditing && id) {
        await cmsPagesApi.updatePage(id, payload);
        showToast('success', 'Đã lưu bản nháp thành công');
      } else {
        const res = await cmsPagesApi.createPage(payload);
        showToast('success', 'Đã khởi tạo bản nháp thành công');
        if (res?.data?._id) {
          navigate(`/admin/page-builder/${res.data._id}/edit`, { replace: true });
        }
      }
      setPageMeta((prev) => ({ ...prev, status: 'draft' }));
    } catch (err: any) {
      showToast('error', err?.message || 'Lỗi khi lưu bản nháp');
    } finally {
      setSaving(false);
    }
  };

  // Publish Handler with Legal Validation Gate
  const handlePublish = async () => {
    // 1. Run Legal Disclosure Validation
    const validation = validateLegalPageForPublish({
      ...pageMeta,
      sections,
    });

    if (!validation.isValid) {
      setLegalValidationModal(validation);
      return;
    }

    setSaving(true);
    try {
      const payload = formatPayload('published');
      if (isEditing && id) {
        await cmsPagesApi.updatePage(id, payload);
      } else {
        const res = await cmsPagesApi.createPage(payload);
        if (res?.data?._id) {
          navigate(`/admin/page-builder/${res.data._id}/edit`, { replace: true });
        }
      }
      setPageMeta((prev) => ({ ...prev, status: 'published' }));
      showToast('success', 'Xuất bản trang thành công và đồng bộ tới người dùng!');
    } catch (err: any) {
      showToast('error', err?.message || 'Lỗi khi xuất bản trang');
    } finally {
      setSaving(false);
    }
  };

  // Currently selected block object
  const selectedBlock = activeBlockId
    ? sections.flatMap((s) => s.blocks).find((b) => b.id === activeBlockId) || null
    : null;

  return (
    <div className="h-screen h-dvh max-h-screen overflow-hidden bg-[#07070a] text-white flex flex-col font-sans">
      {/* ================= TOP BAR ================= */}
      <header className="h-14 border-b border-white/10 bg-[#0e0e14] px-2 sm:px-4 flex items-center justify-between shrink-0 z-30 overflow-x-auto no-scrollbar gap-2">
        {/* Left: Back, Drawer Toggles & Title */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            to="/admin/page-builder"
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {/* Drawer Toggles for Mobile & Tablet */}
          <div className="flex xl:hidden items-center gap-1 border-r border-white/10 pr-1.5">
            <button
              type="button"
              title="Khối & Cấu Trúc"
              onClick={() => setActiveMobileDrawer(activeMobileDrawer === 'left' ? 'none' : 'left')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                activeMobileDrawer === 'left' ? 'bg-[#d4af37] text-black font-bold' : 'text-white/70 hover:text-white bg-white/5'
              }`}
            >
              <PanelLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Thuộc Tính"
              onClick={() => setActiveMobileDrawer(activeMobileDrawer === 'right' ? 'none' : 'right')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                activeMobileDrawer === 'right' ? 'bg-[#d4af37] text-black font-bold' : 'text-white/70 hover:text-white bg-white/5'
              }`}
            >
              <PanelRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-serif text-sm font-medium uppercase text-white truncate max-w-[100px] sm:max-w-[200px]">
              {pageMeta.title || 'Chưa Đặt Tên'}
            </span>
            <span
              className={`inline-block px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider shrink-0 ${
                pageMeta.status === 'published'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {pageMeta.status === 'published' ? 'Đã Xuất Bản' : 'Bản Nháp'}
            </span>
          </div>
        </div>

        {/* Center: Device Viewport & Theme Switcher */}
        <div className="flex items-center gap-1 sm:gap-2 bg-black/40 border border-white/10 rounded-lg p-0.5 sm:p-1 shrink-0">
          <button
            type="button"
            title="Màn hình Máy tính (Desktop)"
            onClick={() => setViewportMode('desktop')}
            className={`p-1.5 rounded transition-colors ${
              viewportMode === 'desktop' ? 'bg-[#d4af37] text-black font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Màn hình Máy tính bảng (Tablet)"
            onClick={() => setViewportMode('tablet')}
            className={`p-1.5 rounded transition-colors ${
              viewportMode === 'tablet' ? 'bg-[#d4af37] text-black font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Màn hình Điện thoại (Mobile)"
            onClick={() => setViewportMode('mobile')}
            className={`p-1.5 rounded transition-colors ${
              viewportMode === 'mobile' ? 'bg-[#d4af37] text-black font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-0.5 sm:mx-1" />

          <button
            type="button"
            title={previewTheme === 'dark' ? 'Chế độ Sáng' : 'Chế độ Tối'}
            onClick={() => setPreviewTheme(previewTheme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded text-white/60 hover:text-white"
          >
            {previewTheme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>

        {/* Right: History, Templates, Save & Publish */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Undo / Redo */}
          <div className="hidden sm:flex items-center gap-1 border-r border-white/10 pr-2">
            <button
              type="button"
              disabled={historyIndex <= 0}
              onClick={handleUndo}
              className="p-1.5 rounded text-white/60 hover:text-white disabled:opacity-20"
              title="Hoàn tác (Undo)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={historyIndex >= history.length - 1}
              onClick={handleRedo}
              className="p-1.5 rounded text-white/60 hover:text-white disabled:opacity-20"
              title="Làm lại (Redo)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Templates Trigger */}
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37] text-xs font-medium hover:bg-[#d4af37]/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Mẫu Bố Cục</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveDraft}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 text-white text-xs font-medium hover:bg-white/10 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-white/70" />
            <span className="whitespace-nowrap">Lưu Nháp</span>
          </button>

          {/* Publish */}
          <button
            type="button"
            disabled={saving}
            onClick={handlePublish}
            className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-[#d4af37] text-black text-xs font-semibold uppercase tracking-wider hover:bg-[#e5c158] transition-colors shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Xuất Bản</span>
          </button>
        </div>
      </header>

      {/* ================= WORKSPACE PANELS ================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop */}
        {activeMobileDrawer !== 'none' && (
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm xl:hidden"
            onClick={() => setActiveMobileDrawer('none')}
          />
        )}

        {/* LEFT PANEL: Block Library & Page Structure (w-72) */}
        <aside
          className={`w-72 shrink-0 h-full flex flex-col bg-[#0e0e14] border-r border-white/10 transition-all ${
            activeMobileDrawer === 'left'
              ? 'fixed inset-y-0 left-0 z-50 shadow-2xl flex'
              : 'hidden xl:flex'
          }`}
        >
          {/* Mobile Drawer Close */}
          {activeMobileDrawer === 'left' && (
            <div className="p-2 border-b border-white/10 flex items-center justify-between xl:hidden bg-white/5">
              <span className="text-xs font-mono text-[#d4af37]">Khối & Cấu Trúc</span>
              <button
                type="button"
                aria-label="Đóng bảng khối"
                onClick={() => setActiveMobileDrawer('none')}
                className="p-1 text-white/60 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex border-b border-white/10 bg-black/20">
            <button
              type="button"
              onClick={() => setLeftTab('library')}
              className={`flex-1 py-2.5 text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                leftTab === 'library'
                  ? 'border-b-2 border-[#d4af37] text-[#d4af37] font-semibold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Thư Viện Khối</span>
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('structure')}
              className={`flex-1 py-2.5 text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                leftTab === 'structure'
                  ? 'border-b-2 border-[#d4af37] text-[#d4af37] font-semibold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cấu Trúc Trang</span>
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {leftTab === 'library' ? (
              <BlockLibraryPanel onAddBlock={handleAddBlock} />
            ) : (
              <PageStructurePanel
                sections={sections}
                activeBlockId={activeBlockId}
                onSelectBlock={(bid) => setActiveBlockId(bid)}
                onMoveBlock={handleMoveBlock}
                onDeleteBlock={handleDeleteBlock}
                onAddSection={handleAddSection}
                onDeleteSection={handleDeleteSection}
                onMoveSection={handleMoveSection}
              />
            )}
          </div>
        </aside>

        {/* CENTER: Live Canvas */}
        <main
          onClick={() => setActiveBlockId(null)}
          className="flex-1 h-full overflow-y-auto bg-[#07070a] p-4 sm:p-8 flex justify-center items-start relative select-text"
        >
          <div
            className={`transition-all duration-300 min-h-[85vh] shadow-2xl rounded-2xl border border-white/10 p-6 sm:p-12 overflow-x-hidden ${
              viewportMode === 'mobile'
                ? 'w-[390px] max-w-full'
                : viewportMode === 'tablet'
                ? 'w-[768px] max-w-full'
                : 'w-full max-w-4xl'
            } ${
              previewTheme === 'dark'
                ? 'bg-[#0b0b0e] text-[#f2f2f4]'
                : 'bg-[#fafafa] text-[#111116]'
            }`}
          >
            {sections.length === 0 ? (
              <div className="text-center py-24 space-y-4">
                <Sparkles className="w-10 h-10 text-[#d4af37] mx-auto animate-pulse" />
                <h3 className="font-serif text-2xl uppercase text-white font-medium">
                  Bắt Đầu Trang Thiết Kế
                </h3>
                <p className="text-sm text-white/50 max-w-md mx-auto">
                  Hãy chọn một khối từ Thư Viện Khối bên trái hoặc áp dụng một Mẫu Bố Cục để bắt đầu.
                </p>
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="px-6 py-2.5 rounded-lg bg-[#d4af37] text-black text-xs font-semibold uppercase tracking-wider hover:bg-[#e5c158] transition-colors"
                >
                  Chọn Mẫu Có Sẵn
                </button>
              </div>
            ) : (
              <div className="space-y-12">
                {sections.map((sec) => (
                  <section
                    key={sec.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSectionId(sec.id);
                    }}
                    className={`relative rounded-xl transition-all ${
                      activeSectionId === sec.id ? 'ring-1 ring-white/10' : ''
                    }`}
                  >
                    <BlockRenderer
                      blocks={sec.blocks}
                      viewportMode={viewportMode}
                      isEditorMode={true}
                      activeBlockId={activeBlockId}
                      onSelectBlock={(bid) => {
                        setActiveBlockId(bid);
                        setActiveSectionId(sec.id);
                      }}
                      onDeleteBlock={handleDeleteBlock}
                      onMoveBlock={handleMoveBlock}
                      onDuplicateBlock={handleDuplicateBlock}
                    />
                  </section>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT PANEL: Block & Page Inspector (w-80) */}
        <aside
          className={`w-80 shrink-0 h-full bg-[#0e0e14] border-l border-white/10 flex flex-col transition-all ${
            activeMobileDrawer === 'right'
              ? 'fixed inset-y-0 right-0 z-50 shadow-2xl flex'
              : 'hidden xl:flex'
          }`}
        >
          {/* Mobile Drawer Close */}
          {activeMobileDrawer === 'right' && (
            <div className="p-2 border-b border-white/10 flex items-center justify-between xl:hidden bg-white/5">
              <span className="text-xs font-mono text-[#d4af37]">Thuộc Tính</span>
              <button
                type="button"
                aria-label="Đóng bảng thuộc tính"
                onClick={() => setActiveMobileDrawer('none')}
                className="p-1 text-white/60 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <BlockInspectorPanel
            selectedBlock={selectedBlock}
            pageMeta={pageMeta}
            onUpdateBlock={handleUpdateBlock}
            onUpdatePageMeta={(updates) => setPageMeta((prev) => ({ ...prev, ...updates }))}
          />
        </aside>
      </div>

      {/* ================= TEMPLATE SELECTOR MODAL ================= */}
      <TemplateSelectorModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* ================= LEGAL VALIDATION GATE MODAL ================= */}
      {legalValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#14141c] border border-red-500/40 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-serif text-lg font-medium text-white">
                Không Thể Xuất Bản: Thiếu Quy Định Pháp Lý Bắt Buộc
              </h3>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Theo quy định của <strong>Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15</strong> và Nghị định 356/2025/NĐ-CP, trang chính sách pháp lý của doanh nghiệp không được lược bỏ các điều khoản bắt buộc sau:
            </p>

            <ul className="space-y-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              {legalValidationModal.errors.map((err, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>{err}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setLegalValidationModal(null)}
                className="px-5 py-2 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors"
              >
                Đã Hiểu, Quay Lại Bổ Sung
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-xs font-medium border ${
              toastMessage.type === 'success'
                ? 'bg-[#121c15] text-emerald-300 border-emerald-500/40'
                : 'bg-[#221316] text-red-300 border-red-500/40'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};
