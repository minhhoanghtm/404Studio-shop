import React from 'react';
import { ThreeUIHero } from '../../../shared/threeui/ThreeUIHero';
import { vi } from '../../../shared/locales/vi/common';

export const HeroSection: React.FC = () => {
  return (
    <ThreeUIHero
      title={vi.hero.title}
      subtitle={vi.hero.subtitle}
      season={vi.hero.season}
      primaryCtaText={vi.hero.exploreCollection}
      primaryCtaLink="/collections/noir-absolu"
      secondaryCtaText={vi.hero.discoverShop}
      secondaryCtaLink="/products"
    />
  );
};
