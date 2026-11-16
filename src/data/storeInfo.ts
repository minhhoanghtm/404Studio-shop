export interface FAQItem {
  id: string;
  category: 'Orders & Concierge' | 'Artisanal Craft & Sizing' | 'Shipping & Customs' | 'Returns & Care';
  question: string;
  answer: string;
}

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Orders & Concierge',
    question: 'How do I commission a Made-to-Measure (Sur Mesure) piece?',
    answer: 'Our Haute Couture and Sur Mesure creations are crafted individually upon client request. You may schedule a private video consultation with our Paris atelier or reserve an in-person fitting at our Place Vendôme salon. Each bespoke piece requires 8 to 14 weeks of dedicated tailoring.',
  },
  {
    id: 'faq-2',
    category: 'Orders & Concierge',
    question: 'Are all garments limited in production?',
    answer: 'Yes. Atelier Vérité produces in strictly limited serial editions to avoid overproduction and safeguard textile integrity. Once a specific fabric dye lot or hide run is exhausted, that iteration is permanently archived.',
  },
  {
    id: 'faq-3',
    category: 'Shipping & Customs',
    question: 'What are the delivery terms and complimentary thresholds?',
    answer: 'We provide complimentary worldwide white-glove courier delivery on all orders exceeding $500 / €500. Orders below this threshold incur a flat $35 express dispatch fee. All customs duties, luxury import taxes, and insurance are prepaid by Maison Vérité.',
  },
  {
    id: 'faq-4',
    category: 'Shipping & Customs',
    question: 'How long will my order take to arrive?',
    answer: 'Ready-to-Wear garments and leather accessories are dispatched within 24-48 business hours via DHL Express or Ferrari Logistics. Transit times are typically 2-3 business days within Western Europe and North America, and 3-5 business days to Asia-Pacific and the Middle East.',
  },
  {
    id: 'faq-5',
    category: 'Returns & Care',
    question: 'What is your returns and exchange policy?',
    answer: 'We offer a 30-day complimentary return window from the day your package is signed for. Garments must remain unworn, unwashed, unaltered, and with all security tags and cedar garment packaging intact.',
  },
  {
    id: 'faq-6',
    category: 'Artisanal Craft & Sizing',
    question: 'How do French (FR) and Italian (IT) sizes translate?',
    answer: 'Our women’s collection is sized according to traditional Parisian tailoring (FR 34 to 42), while our men’s tailoring follows Milanese grading (IT 46 to 54). Please consult our interactive Size Guide for precise measurements in centimeters and inches.',
  },
];

export const SIZE_CHART = {
  women: [
    { fr: '34 FR', us: '0 US', bust: '80-83 cm (31-32.5")', waist: '60-63 cm (23.5-25")', hips: '86-89 cm (34-35")' },
    { fr: '36 FR', us: '2-4 US', bust: '84-87 cm (33-34.5")', waist: '64-67 cm (25-26.5")', hips: '90-93 cm (35.5-36.5")' },
    { fr: '38 FR', us: '6 US', bust: '88-91 cm (34.5-36")', waist: '68-71 cm (27-28")', hips: '94-97 cm (37-38")' },
    { fr: '40 FR', us: '8 US', bust: '92-95 cm (36-37.5")', waist: '72-75 cm (28.5-29.5")', hips: '98-101 cm (38.5-40")' },
    { fr: '42 FR', us: '10 US', bust: '96-100 cm (38-39.5")', waist: '76-80 cm (30-31.5")', hips: '102-106 cm (40-41.5")' },
  ],
  men: [
    { it: '46 IT', us: '36 US', chest: '92-95 cm (36-37.5")', waist: '78-81 cm (30.5-32")', collar: '38 cm (15")' },
    { it: '48 IT', us: '38 US', chest: '96-99 cm (38-39")', waist: '82-85 cm (32-33.5")', collar: '39 cm (15.5")' },
    { it: '50 IT', us: '40 US', chest: '100-103 cm (39.5-40.5")', waist: '86-89 cm (34-35")', collar: '40 cm (16")' },
    { it: '52 IT', us: '42 US', chest: '104-107 cm (41-42")', waist: '90-93 cm (35.5-36.5")', collar: '41 cm (16.5")' },
    { it: '54 IT', us: '44 US', chest: '108-112 cm (42.5-44")', waist: '94-98 cm (37-38.5")', collar: '42 cm (17")' },
  ],
};
