/**
 * ATELIER VÉRITÉ — Admin Visual Page Builder Preview Page
 * Full viewport live rendering of the designed page across devices.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Sun,
  Moon,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { cmsPagesApi, PolicyDocument } from '@/shared/api';
import { EditorSection, ViewportMode, BlockItem } from '@/shared/cms/types';
import { BlockRenderer } from '@/shared/cms/BlockRenderer';
import { createBlockInstance } from '@/shared/cms/blockLibrary';

export const AdminPageBuilderPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState<PolicyDocument | null>(null);
  const [sections, setSections] = useState<EditorSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (!id) return;
    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await cmsPagesApi.getPageDetail(id);
        if (res?.data?.page) {
          setPage(res.data.page);
          const secs = res.data.sections || [];
          const mapped: EditorSection[] = secs.map((s: any, idx: number) => {
            const blocks: BlockItem[] = s.data?.blocks || [];
            if (blocks.length === 0) {
              if (s.type === 'hero') {
                blocks.push({
                  ...createBlockInstance('heading'),
                  content: { text: s.data?.title || res.data?.page?.title || 'Trang', level: 'h1' },
                });
              } else if (s.type === 'story') {
                blocks.push({
                  ...createBlockInstance('paragraph'),
                  content: { text: s.data?.content || '' },
                });
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
            };
          });
          setSections(mapped);
        }
      } catch (err: any) {
        setError(err?.message || 'Không thể tải trang xem trước');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen bg-[#07070a] text-white flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-white/60">Đang chuẩn bị bản xem trước...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="h-screen bg-[#07070a] text-white flex flex-col items-center justify-center space-y-4">
        <p className="text-sm text-red-400">{error || 'Không tìm thấy trang'}</p>
        <Link
          to="/admin/page-builder"
          className="px-4 py-2 rounded-lg bg-white/10 text-xs text-white hover:bg-white/20"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-white flex flex-col">
      {/* Top Preview Control Bar */}
      <header className="h-14 border-b border-white/10 bg-[#0e0e14] px-4 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/page-builder"
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-medium uppercase text-white truncate max-w-[240px]">
              {page.title}
            </span>
            <span className="font-mono text-xs text-[#d4af37]">/{page.slug}</span>
          </div>
        </div>

        {/* Viewport & Theme */}
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setViewportMode('desktop')}
            className={`p-1.5 rounded transition-colors ${
              viewportMode === 'desktop' ? 'bg-[#d4af37] text-black font-bold' : 'text-white/60 hover:text-white'
            }`}
            title="Desktop"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewportMode('tablet')}
            className={`p-1.5 rounded transition-colors ${
              viewportMode === 'tablet' ? 'bg-[#d4af37] text-black font-bold' : 'text-white/60 hover:text-white'
            }`}
            title="Tablet"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewportMode('mobile')}
            className={`p-1.5 rounded transition-colors ${
              viewportMode === 'mobile' ? 'bg-[#d4af37] text-black font-bold' : 'text-white/60 hover:text-white'
            }`}
            title="Mobile"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          <button
            type="button"
            onClick={() => setPreviewTheme(previewTheme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded text-white/60 hover:text-white"
            title="Đổi giao diện Sáng / Tối"
          >
            {previewTheme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>

        {/* Edit Button */}
        <div>
          <Link
            to={`/admin/page-builder/${page._id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4af37] text-black text-xs font-semibold uppercase tracking-wider hover:bg-[#e5c158] transition-colors shadow-md"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Chỉnh Sửa</span>
          </Link>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 flex justify-center items-start p-4 sm:p-10">
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
          <div className="space-y-12">
            {sections.map((sec) => (
              <section key={sec.id} className="relative">
                <BlockRenderer
                  blocks={sec.blocks}
                  viewportMode={viewportMode}
                  isEditorMode={false}
                />
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
