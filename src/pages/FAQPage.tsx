import React, { useState } from 'react';
import { FAQS } from '../data/storeInfo';
import { ChevronDown, Sparkles } from 'lucide-react';

export const FAQPage: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [openIds, setOpenIds] = useState<string[]>(['faq-1', 'faq-3']);

  const categories = ['All', 'Orders & Concierge', 'Artisanal Craft & Sizing', 'Shipping & Customs', 'Returns & Care'];

  const filteredFaqs = selectedCat === 'All'
    ? FAQS
    : FAQS.filter((f) => f.category === selectedCat);

  const toggleFaq = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-champagne/30 text-champagne text-[10px] uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Concierge Inquiries
          </div>
          <h1 className="font-display text-4xl sm:text-6xl text-white tracking-wide">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-platinum-dark max-w-xl mx-auto font-sans font-light">
            Answers regarding bespoke orders, white-glove international dispatch, garment preservation, and sizing protocols.
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-sans">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCat(c)}
              className={`px-4 py-2 rounded-full uppercase tracking-wider transition-colors ${
                selectedCat === c
                  ? 'bg-champagne text-noir-950 font-bold'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* FAQs Accordion List */}
        <div className="space-y-4 pt-4">
          {filteredFaqs.map((faq) => {
            const isOpen = openIds.includes(faq.id);

            return (
              <div
                key={faq.id}
                className="p-6 rounded-2xl bg-noir-900 border border-white/10 transition-colors"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between text-left gap-4"
                >
                  <span className="font-serif text-lg sm:text-xl text-white font-medium">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-champagne transition-transform flex-shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-white/5 text-xs sm:text-sm text-platinum-dark leading-relaxed font-sans font-light">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
