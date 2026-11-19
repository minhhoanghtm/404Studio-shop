import { useState, useEffect } from 'react';
import { publicPoliciesApi, PolicyDocument } from '@/shared/api';

interface UsePublicPolicyResult {
  policy: PolicyDocument | null;
  dynamicContent: string | null;
  isLivePolicy: boolean;
  loading: boolean;
  error: string | null;
}

export function usePublicPolicy(slug: string): UsePublicPolicyResult {
  const [policy, setPolicy] = useState<PolicyDocument | null>(null);
  const [dynamicContent, setDynamicContent] = useState<string | null>(null);
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

            // Extract content from sections
            if (doc.sections && doc.sections.length > 0) {
              const story = doc.sections.find((s) => s.type === 'story');
              if (story?.data?.content) {
                setDynamicContent(story.data.content);
              }
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

  return { policy, dynamicContent, isLivePolicy, loading, error };
}
