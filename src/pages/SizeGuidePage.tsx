import React, { useState } from 'react';
import { SIZE_CHART } from '../data/storeInfo';
import { Ruler, Sparkles } from 'lucide-react';

export const SizeGuidePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'women' | 'men'>('women');

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-champagne/30 text-champagne text-[10px] uppercase tracking-widest">
            <Ruler className="w-3.5 h-3.5" /> Tailoring Metric System
          </div>
          <h1 className="font-display text-4xl sm:text-6xl text-white tracking-wide">
            Sartorial Size Guide
          </h1>
          <p className="text-xs sm:text-sm text-platinum-dark max-w-xl mx-auto font-sans font-light">
            Our garments follow traditional Parisian couture and Milanese bespoke grading standards. Please consult the conversion measurements below.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setActiveTab('women')}
            className={`px-6 py-3 rounded-full text-xs uppercase font-sans tracking-widest font-semibold transition-all ${
              activeTab === 'women'
                ? 'bg-champagne text-noir-950 shadow-lg'
                : 'bg-white/5 text-white/70 hover:text-white'
            }`}
          >
            Women&apos;s Tailoring (FR Sizing)
          </button>
          <button
            onClick={() => setActiveTab('men')}
            className={`px-6 py-3 rounded-full text-xs uppercase font-sans tracking-widest font-semibold transition-all ${
              activeTab === 'men'
                ? 'bg-champagne text-noir-950 shadow-lg'
                : 'bg-white/5 text-white/70 hover:text-white'
            }`}
          >
            Men&apos;s Tailoring (IT Sizing)
          </button>
        </div>

        {/* Size Chart Table */}
        <div className="rounded-2xl border border-white/10 bg-noir-900 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-white/5 border-b border-white/10 uppercase tracking-widest text-champagne text-[10px]">
                {activeTab === 'women' ? (
                  <tr>
                    <th className="py-4 px-6">French Size (FR)</th>
                    <th className="py-4 px-6">US Equivalent</th>
                    <th className="py-4 px-6">Bust</th>
                    <th className="py-4 px-6">Waist</th>
                    <th className="py-4 px-6">Hips</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="py-4 px-6">Italian Size (IT)</th>
                    <th className="py-4 px-6">US Equivalent</th>
                    <th className="py-4 px-6">Chest</th>
                    <th className="py-4 px-6">Waist</th>
                    <th className="py-4 px-6">Collar</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-white/5 text-platinum-light font-mono">
                {activeTab === 'women'
                  ? SIZE_CHART.women.map((row) => (
                      <tr key={row.fr} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6 font-bold text-white">{row.fr}</td>
                        <td className="py-4 px-6">{row.us}</td>
                        <td className="py-4 px-6">{row.bust}</td>
                        <td className="py-4 px-6">{row.waist}</td>
                        <td className="py-4 px-6">{row.hips}</td>
                      </tr>
                    ))
                  : SIZE_CHART.men.map((row) => (
                      <tr key={row.it} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6 font-bold text-white">{row.it}</td>
                        <td className="py-4 px-6">{row.us}</td>
                        <td className="py-4 px-6">{row.chest}</td>
                        <td className="py-4 px-6">{row.waist}</td>
                        <td className="py-4 px-6">{row.collar}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Measuring Guide Notes */}
        <div className="p-8 rounded-2xl bg-noir-900 border border-white/5 space-y-4 text-xs font-sans text-platinum-dark leading-relaxed">
          <h4 className="font-display text-lg text-white">How to Take Accurate Measurements</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Bust / Chest:</strong> Measure around the fullest part of your chest, keeping the tape horizontal under your arms and across your shoulder blades.</li>
            <li><strong>Natural Waist:</strong> Measure around the narrowest part of your torso, typically one inch above the navel.</li>
            <li><strong>Hips:</strong> Measure around the widest part of your hips and seat while standing with feet together.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
