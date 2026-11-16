import { JournalArticle } from '../types';

export const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    id: 'art-01',
    slug: 'the-architecture-of-draping',
    title: 'The Architecture of Draping: Form in Perpetual Motion',
    excerpt: 'An intimate study inside our Parisian atelier exploring how mathematical bias cuts liberate the silhouette from structural rigidity.',
    category: 'Atelier Note',
    author: 'Geneviève Laurent, Creative Director',
    date: 'October 18, 2026',
    readTime: '6 min read',
    coverImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=85',
    sections: [
      {
        heading: 'The Line Between Structure and Abandon',
        paragraph: 'In traditional French tailoring, garments often seek to discipline the anatomy—forcing fabric into crisp, unyielding geometries. At Atelier Vérité, we invert this historic dogma. We ask not what the fabric can force the body into, but what kinetic balance arises when natural gravity becomes our primary collaborator.',
        quote: '“True luxury does not constrict; it grants weightlessness.”',
      },
      {
        heading: 'Bias Cutting as Physics and Philosophy',
        paragraph: 'Cutting fabric diagonally across the grain at a 45-degree angle transforms rigid woven yarns into a living, responsive membrane. In our FW26 Liquid Silk Gown, over 12 yards of 30-momme mulberry silk are pinned entirely by hand on vintage anatomical forms over four days.',
        image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=85',
      },
      {
        heading: 'The Longevity of Quiet Form',
        paragraph: 'Our commitment to slow creation means refusing seasonal obsolescence. When a silhouette achieves balance between proportion and comfort, it transcends the ephemeral calendar of fast fashion to become an enduring artifact in the patron’s permanent wardrobe.',
      },
    ],
  },
  {
    id: 'art-02',
    slug: 'behind-the-silk-lyon-ateliers',
    title: 'Behind the Silk: Centenary Looms of Lyon',
    excerpt: 'Travelling to the historic banks of the Rhône to meet the master weavers preserving 18th-century jacquard and mulberry silk techniques.',
    category: 'Craftsmanship',
    author: 'Henri Duprès',
    date: 'September 29, 2026',
    readTime: '8 min read',
    coverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=85',
    sections: [
      {
        heading: 'Water, Atmosphere, and Thread',
        paragraph: 'In Lyon, silk weaving is as much about the microclimate as it is about mechanical genius. The subtle humidity along the Rhône River prevents superfine raw silk filaments from fraying as they race across restored shuttle looms at hundreds of strokes per minute.',
      },
      {
        heading: 'The 30-Momme Standard',
        paragraph: 'While commercial ready-to-wear rarely exceeds 16-momme weight, Atelier Vérité commissions an extraordinary 30-momme density. The result is silk that possesses substantial hand, an opaque drape, and the liquid luster of cooled mercury.',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
      },
    ],
  },
  {
    id: 'art-03',
    slug: 'monochrome-brutalism-fw26',
    title: 'Monochrome Brutalism: The Anatomy of Autumn/Winter 2026',
    excerpt: 'Exploring the sculptural dialogue between concrete modernist architecture and the monolithic silhouettes of our runway collection.',
    category: 'Campaign',
    author: 'Clara Moreau',
    date: 'August 14, 2026',
    readTime: '5 min read',
    coverImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=85',
    sections: [
      {
        heading: 'A Modernist Manifesto',
        paragraph: 'Shot on location at the Barbican Estate in London and Villa Savoye in Poissy, our FW26 campaign examines the visceral resonance between raw poured concrete and heavy-gauge double-faced virgin wools.',
        quote: '“Architecture is inhabited sculpture; clothing is intimate architecture.”',
      },
    ],
  },
];
