import { useState, useEffect } from 'react';
import { publicPoliciesApi, PolicyDocument } from '@/shared/api';
import { EditorSection, BlockItem } from '@/shared/cms/types';
import { createBlockInstance } from '@/shared/cms/blockLibrary';

interface UsePublicPolicyResult {
  policy: PolicyDocument | null;
  dynamicContent: string | null;
  sections: EditorSection[];
  blocks: BlockItem[];
  isLivePolicy: boolean;
  loading: boolean;
  error: string | null;
}

export function usePublicPolicy(slug: string): UsePublicPolicyResult {
  const [policy, setPolicy] = useState<PolicyDocument | null>(null);
  const [dynamicContent, setDynamicContent] = useState<string | null>(null);
  const [sections, setSections] = useState<EditorSection[]>([]);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [isLivePolicy, setIsLivePolicy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    const fetchPolicy = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await publicPoliciesApi.getPolicyBySlug(slug);
        if (isMounted && response?.data) {
          const doc = response.data;
          // Only sync if policy is published
          if (doc.status === 'published') {
            setPolicy(doc);
            setIsLivePolicy(true);

            // Extract content and blocks from sections
            if (doc.sections && doc.sections.length > 0) {
              const story = doc.sections.find((s) => s.type === 'story');
              if (story?.data?.content) {
                setDynamicContent(story.data.content);
              }

              const parsedSections: EditorSection[] = doc.sections.map((s: any, idx: number) => {
                let secBlocks: BlockItem[] = s.data?.blocks || [];
                if (secBlocks.length === 0) {
                  if (s.data?.content) {
                    secBlocks = [
                      {
                        ...createBlockInstance('paragraph'),
                        content: { text: s.data.content },
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
                  blocks: secBlocks,
                  styles: s.data?.styles || {},
                };
              });

              setSections(parsedSections);
              setBlocks(parsedSections.flatMap((s) => s.blocks));
            }

            // Increment view count
            publicPoliciesApi.incrementPageView(slug).catch(() => {});
          } else {
            setIsLivePolicy(false);
          }
        }
      } catch (_err: any) {
        if (isMounted) {
          // If 404 or not found, fall back cleanly to static statutory text
          setIsLivePolicy(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPolicy();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { policy, dynamicContent, sections, blocks, isLivePolicy, loading, error };
}
