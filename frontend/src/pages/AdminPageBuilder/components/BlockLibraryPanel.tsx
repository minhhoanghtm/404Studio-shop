/**
 * Block Library Panel
 * Displays searchable categorized blocks that can be appended to the active section.
 */

import React, { useState } from 'react';
import {
  Search,
  Heading,
  AlignLeft,
  FileText,
  Quote,
  List,
  Table,
  HelpCircle,
  Minus,
  Image,
  Grid,
  Video,
  Layers,
  Columns,
  Box,
  Maximize2,
  ChevronsUpDown,
  ShoppingBag,
  Sparkles,
  Camera,
  Ticket,
  MousePointer,
  Bookmark,
  Clock,
  Timer,
  BookOpen,
  Shield,
  PieChart,
  Sliders,
  RefreshCw,
  Calendar,
  Tag,
  Plus,
} from 'lucide-react';
import { BLOCK_DEFINITIONS } from '@/shared/cms';
import { BlockCategory, BlockType } from '@/shared/cms/types';

interface BlockLibraryPanelProps {
  onAddBlock: (type: BlockType) => void;
}

export const BlockLibraryPanel: React.FC<BlockLibraryPanelProps> = ({ onAddBlock }) => {
  const [selectedCategory, setSelectedCategory] = useState<BlockCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categoryLabels: { id: BlockCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'Tất Cả' },
    { id: 'content', label: 'Nội Dung' },
    { id: 'media', label: 'Phương Tiện' },
    { id: 'layout', label: 'Bố Cục' },
    { id: 'commerce', label: 'Thương Mại' },
    { id: 'interactive', label: 'Tương Tác' },
    { id: 'legal', label: 'Pháp Lý' },
  ];

  const getIcon = (name: string) => {
    switch (name) {
      case 'Heading': return <Heading className="w-4 h-4 text-[#d4af37]" />;
      case 'AlignLeft': return <AlignLeft className="w-4 h-4 text-[#d4af37]" />;
      case 'FileText': return <FileText className="w-4 h-4 text-[#d4af37]" />;
      case 'Quote': return <Quote className="w-4 h-4 text-[#d4af37]" />;
      case 'List': return <List className="w-4 h-4 text-[#d4af37]" />;
      case 'Table': return <Table className="w-4 h-4 text-[#d4af37]" />;
      case 'HelpCircle': return <HelpCircle className="w-4 h-4 text-[#d4af37]" />;
      case 'Minus': return <Minus className="w-4 h-4 text-[#d4af37]" />;
      case 'Image': return <Image className="w-4 h-4 text-[#d4af37]" />;
      case 'Grid': return <Grid className="w-4 h-4 text-[#d4af37]" />;
      case 'Video': return <Video className="w-4 h-4 text-[#d4af37]" />;
      case 'Layers': return <Layers className="w-4 h-4 text-[#d4af37]" />;
      case 'Columns': return <Columns className="w-4 h-4 text-[#d4af37]" />;
      case 'Box': return <Box className="w-4 h-4 text-[#d4af37]" />;
      case 'Maximize2': return <Maximize2 className="w-4 h-4 text-[#d4af37]" />;
      case 'ChevronsUpDown': return <ChevronsUpDown className="w-4 h-4 text-[#d4af37]" />;
      case 'ShoppingBag': return <ShoppingBag className="w-4 h-4 text-[#d4af37]" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-[#d4af37]" />;
      case 'Camera': return <Camera className="w-4 h-4 text-[#d4af37]" />;
      case 'Ticket': return <Ticket className="w-4 h-4 text-[#d4af37]" />;
      case 'MousePointer': return <MousePointer className="w-4 h-4 text-[#d4af37]" />;
      case 'Bookmark': return <Bookmark className="w-4 h-4 text-[#d4af37]" />;
      case 'Clock': return <Clock className="w-4 h-4 text-[#d4af37]" />;
      case 'Timer': return <Timer className="w-4 h-4 text-[#d4af37]" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4 text-[#d4af37]" />;
      case 'Shield': return <Shield className="w-4 h-4 text-[#d4af37]" />;
      case 'PieChart': return <PieChart className="w-4 h-4 text-[#d4af37]" />;
      case 'Sliders': return <Sliders className="w-4 h-4 text-[#d4af37]" />;
      case 'RefreshCw': return <RefreshCw className="w-4 h-4 text-[#d4af37]" />;
      case 'Calendar': return <Calendar className="w-4 h-4 text-[#d4af37]" />;
      case 'Tag': return <Tag className="w-4 h-4 text-[#d4af37]" />;
      default: return <Sparkles className="w-4 h-4 text-[#d4af37]" />;
    }
  };

  const filteredBlocks = BLOCK_DEFINITIONS.filter((b) => {
    const matchCat = selectedCategory === 'all' || b.category === selectedCategory;
    const matchSearch =
      b.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="h-full flex flex-col bg-[#0e0e14] border-r border-white/10 select-none">
      {/* Search Input */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm khối block..."
            className="w-full bg-white/5 border border-white/10 rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#d4af37]"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="p-2 border-b border-white/10 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {categoryLabels.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-[#d4af37] text-black font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Block List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredBlocks.map((b) => (
          <div
            key={b.type}
            onClick={() => onAddBlock(b.type)}
            className="group p-2.5 rounded-lg border border-white/5 bg-white/[0.02] hover:border-[#d4af37]/60 hover:bg-white/[0.05] transition-all cursor-pointer flex items-start justify-between gap-2"
          >
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded bg-black/40 border border-white/10 shrink-0 group-hover:border-[#d4af37]/40 transition-colors">
                {getIcon(b.iconName)}
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-white group-hover:text-[#d4af37] transition-colors">
                  {b.label}
                </div>
                <div className="text-[10px] text-white/50 leading-tight">
                  {b.description}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="p-1 rounded text-white/30 group-hover:text-[#d4af37] group-hover:bg-[#d4af37]/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
