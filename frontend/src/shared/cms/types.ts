/**
 * ATELIER VÉRITÉ — Visual Page Builder & CMS Types
 * Strictly typed schema for dynamic page structures, blocks, styling, and templates.
 */

export type PageType = 'about' | 'policy' | 'faq' | 'guide' | 'lookbook' | 'landing' | 'blog';
export type PageStatus = 'draft' | 'published' | 'archived';

export type BackendSectionType =
  | 'hero'
  | 'story'
  | 'gallery'
  | 'quote'
  | 'image_text'
  | 'products'
  | 'banner'
  | 'cta';

export type BlockCategory =
  | 'content'
  | 'media'
  | 'layout'
  | 'commerce'
  | 'interactive'
  | 'legal';

export type BlockType =
  // Content
  | 'heading'
  | 'paragraph'
  | 'rich_text'
  | 'quote'
  | 'list'
  | 'table'
  | 'accordion'
  | 'divider'
  // Media
  | 'image'
  | 'gallery'
  | 'video'
  | 'banner'
  | 'image_text'
  // Layout
  | 'section'
  | 'container'
  | 'two_columns'
  | 'three_columns'
  | 'grid'
  | 'spacer'
  // Commerce
  | 'product_grid'
  | 'featured_product'
  | 'category_grid'
  | 'collection_preview'
  | 'lookbook_gallery'
  | 'voucher_cta'
  | 'campaign_cta'
  // Interactive
  | 'cta_button'
  | 'tabs'
  | 'timeline'
  | 'countdown'
  // Legal
  | 'table_of_contents'
  | 'policy_section'
  | 'cookie_table'
  | 'consent_trigger'
  | 'privacy_request_trigger'
  | 'returns_steps'
  | 'effective_date'
  | 'policy_version';

export interface BlockStyles {
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  fontWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontFamily?: 'serif' | 'sans' | 'mono';
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  marginTop?: number;
  marginBottom?: number;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  maxWidth?: string;
}

export interface BlockResponsive {
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  stackOnMobile?: boolean;
}

export interface BlockItem {
  id: string;
  type: BlockType;
  category: BlockCategory;
  label: string;
  content: Record<string, any>;
  styles?: BlockStyles;
  responsive?: BlockResponsive;
}

export interface EditorSection {
  id: string;
  type: BackendSectionType;
  title?: string;
  order: number;
  isActive: boolean;
  blocks: BlockItem[];
  styles?: BlockStyles;
  data?: Record<string, any>;
}

export interface PageDocument {
  _id?: string;
  title: string;
  slug: string;
  type: PageType;
  status: PageStatus;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  displayOrder?: number;
  publishedAt?: string | null;
  viewCount?: number;
  isFeatured?: boolean;
  thumbnailUrl?: string;
  bannerUrl?: string;
  relatedProducts?: string[];
  sections?: EditorSection[] | any[];
  createdAt?: string;
  updatedAt?: string;
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export interface BlockDefinition {
  type: BlockType;
  category: BlockCategory;
  label: string;
  description: string;
  iconName: string;
  defaultContent: Record<string, any>;
  defaultStyles?: BlockStyles;
}

export interface PageTemplate {
  id: string;
  name: string;
  type: PageType;
  description: string;
  thumbnail?: string;
  defaultTitle: string;
  defaultSlug: string;
  sections: EditorSection[];
}
