import React from 'react';
import { HeroSection } from './components/HeroSection';
import { ManifestoSection } from './components/ManifestoSection';
import { NewArrivals } from './components/NewArrivals';
import { CategoryBespokeSection } from './components/CategoryBespokeSection';
import { FeaturedCollections } from './components/FeaturedCollections';
import { EditorialCampaignSection } from './components/EditorialCampaignSection';
import { TrendingSilhouettesSection } from './components/TrendingSilhouettesSection';
import { InteractiveLookbookSection } from './components/InteractiveLookbookSection';
import { BrandPillarsSection } from './components/BrandPillarsSection';
import { JournalPreviewSection } from './components/JournalPreviewSection';

export const HomePage: React.FC = () => {
  return (
    <div className="w-full bg-noir-950 text-white min-h-screen">
      <HeroSection />
      <ManifestoSection />
      <NewArrivals />
      <CategoryBespokeSection />
      <FeaturedCollections />
      <EditorialCampaignSection />
      <TrendingSilhouettesSection />
      <InteractiveLookbookSection />
      <BrandPillarsSection />
      <JournalPreviewSection />
    </div>
  );
};
