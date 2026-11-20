/**
 * Page Structure Tree Panel
 * Visual tree representation of Sections and Blocks on the page with reordering and deletion.
 */

import React from 'react';
import {
  Layers,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Box,
} from 'lucide-react';
import { EditorSection, BackendSectionType } from '@/shared/cms/types';

interface PageStructurePanelProps {
  sections: EditorSection[];
  activeBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onDeleteBlock: (blockId: string) => void;
  onAddSection: (type: BackendSectionType) => void;
  onDeleteSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
}

export const PageStructurePanel: React.FC<PageStructurePanelProps> = ({
  sections,
  activeBlockId,
  onSelectBlock,
  onMoveBlock,
  onDeleteBlock,
  onAddSection,
  onDeleteSection,
  onMoveSection,
}) => {
  return (
    <div className="h-full flex flex-col bg-[#0e0e14] border-r border-white/10 select-none">
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs font-semibold uppercase text-white tracking-wider">
            Cấu Trúc Trang ({sections.length})
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAddSection('story')}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-[10px] font-medium hover:bg-[#d4af37]/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Thêm Vùng</span>
        </button>
      </div>

      {/* Sections Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {sections.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-xs">
            Chưa có phân vùng nào. Hãy thêm phân vùng hoặc chọn một mẫu khởi tạo.
          </div>
        ) : (
          sections.map((section, sIdx) => (
            <div
              key={section.id}
              className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden"
            >
              {/* Section Header */}
              <div className="p-2.5 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Box className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                  <span className="text-xs font-medium text-white truncate">
                    {section.title || `Vùng ${sIdx + 1}`}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-black/40 text-[#d4af37] border border-white/10">
                    {section.type}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {sIdx > 0 && (
                    <button
                      type="button"
                      title="Lên trên"
                      onClick={() => onMoveSection(section.id, 'up')}
                      className="p-1 text-white/40 hover:text-white rounded"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                  )}
                  {sIdx < sections.length - 1 && (
                    <button
                      type="button"
                      title="Xuống dưới"
                      onClick={() => onMoveSection(section.id, 'down')}
                      className="p-1 text-white/40 hover:text-white rounded"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Xóa vùng"
                    onClick={() => onDeleteSection(section.id)}
                    className="p-1 text-white/40 hover:text-red-400 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Blocks inside Section */}
              <div className="p-1.5 space-y-1">
                {section.blocks.length === 0 ? (
                  <div className="p-2 text-center text-[11px] text-white/30 italic">
                    Chưa có khối trong vùng này
                  </div>
                ) : (
                  section.blocks.map((b, bIdx) => {
                    const isSelected = activeBlockId === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => onSelectBlock(b.id)}
                        className={`p-2 rounded-md transition-colors flex items-center justify-between text-xs cursor-pointer ${
                          isSelected
                            ? 'bg-[#d4af37] text-black font-semibold shadow-sm'
                            : 'text-white/80 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] opacity-60">
                            {bIdx + 1}.
                          </span>
                          <span className="truncate">{b.label || b.type}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {bIdx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveBlock(b.id, 'up');
                              }}
                              className={`p-1 rounded ${
                                isSelected ? 'hover:bg-black/10' : 'hover:bg-white/10 text-white/60'
                              }`}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                          )}
                          {bIdx < section.blocks.length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveBlock(b.id, 'down');
                              }}
                              className={`p-1 rounded ${
                                isSelected ? 'hover:bg-black/10' : 'hover:bg-white/10 text-white/60'
                              }`}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteBlock(b.id);
                            }}
                            className={`p-1 rounded ${
                              isSelected ? 'hover:bg-black/10' : 'hover:bg-white/10 text-red-400'
                            }`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
