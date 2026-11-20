/**
 * ATELIER VÉRITÉ — useDynamicCMSPage Hook
 * Connects storefront pages to real Backend CMS endpoints (/pages/:slug).
 * Enables dynamic block rendering with graceful statutory fallback.
 */

import { useState, useEffect } from 'react';
import { cmsPagesApi, PolicyDocument } from '@/shared/api';
import { EditorSection, BlockItem } from '@/shared/cms/types';
import { createBlockInstance } from '@/shared/cms/blockLibrary';

interface UseDynamicCMSPageResult {
  page: PolicyDocument | null;
  sections: EditorSection[];
  allBlocks: BlockItem[];
  isDynamic: boolean;
  loading: boolean;
  error: string | null;
}

export function useDynamicCMSPage(slug: string, fallbackType?: string): UseDynamicCMSPageResult {
  const [page, setPage] = useState<PolicyDocument | null>(null);
  const [sections, setSections] = useState<EditorSection[]>([]);
  const [allBlocks, setAllBlocks] = useState<BlockItem[]>([]);
  const [isDynamic, setIsDynamic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        let doc: any = null;

        // 1. Try slug directly
        try {
          const res = await cmsPagesApi.getPublicPageBySlug(slug);
          if (res?.data && res.data.status === 'published') {
            doc = res.data;
          }
        } catch {
          // Slug not found directly, try fallbackType if provided
        }

        // 2. Fallback to querying by type if primary slug missed
        if (!doc && fallbackType) {
          try {
            const res = await cmsPagesApi.getPublicPages({ type: fallbackType, limit: 1 });
            const first = res?.data?.pages?.[0];
            if (first && first.status === 'published') {
              // fetch full populated page
              const full = await cmsPagesApi.getPublicPageBySlug(first.slug);
              if (full?.data) doc = full.data;
            }
          } catch {
            // No type match
          }
        }

        if (isMounted && doc) {
          setPage(doc);
          const rawSecs = doc.sections || [];
          const hydratedSecs: EditorSection[] = rawSecs.map((s: any, idx: number) => {
            let blocks: BlockItem[] = s.data?.blocks || [];
            if (blocks.length === 0) {
              if (s.type === 'hero') {
                blocks = [
                  {
                    ...createBlockInstance('heading'),
                    content: { text: s.data?.title || doc.title, level: 'h1' },
                  },
                ];
                if (s.data?.description) {
                  blocks.push({
                    ...createBlockInstance('paragraph'),
                    content: { text: s.data.description },
                  });
                }
              } else if (s.type === 'story') {
                blocks = [
                  {
                    ...createBlockInstance('paragraph'),
                    content: { text: s.data?.content || '' },
                  },
                ];
              } else if (s.type === 'quote') {
                blocks = [
                  {
                    ...createBlockInstance('quote'),
                    content: { quote: s.data?.quote || '', author: s.data?.author || '' },
                  },
                ];
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

          const flatBlocks = hydratedSecs.flatMap((s) => s.blocks);
          setSections(hydratedSecs);
          setAllBlocks(flatBlocks);
          setIsDynamic(flatBlocks.length > 0);

          // Increment view counter
          cmsPagesApi.incrementViewCount(doc.slug).catch(() => {});
        } else if (isMounted) {
          setIsDynamic(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Không thể tải nội dung trang');
          setIsDynamic(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPage();

    return () => {
      isMounted = false;
    };
  }, [slug, fallbackType]);

  return { page, sections, allBlocks, isDynamic, loading, error };
}
