import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useToastStore } from '../stores/useToastStore';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inquiryType, setInquiryType] = useState('Private Fitting Appointment');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  const { addToast } = useToastStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSent(true);
    addToast({
      type: 'success',
      title: 'Concierge Request Received',
      message: 'Our Place Vendôme salon concierge will contact you within 24 hours.',
    });
  };

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
            SALONS PRIVÉS & CONCIERGE
          </span>
          <h1 className="font-display text-4xl sm:text-6xl text-white tracking-wide">
            Private Inquiries
          </h1>
          <p className="text-xs sm:text-sm text-platinum-dark leading-relaxed font-sans font-light">
            Reserve private fittings at our salons in Paris and Tokyo, commission Sur Mesure couture, or seek advice from our styling concierge.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Details & Salons */}
          <div className="lg:col-span-5 space-y-8">
            <div className="p-8 rounded-2xl bg-noir-900 border border-white/10 space-y-6">
              <h3 className="font-display text-2xl text-white">Paris Salon Privé</h3>
              <div className="space-y-4 text-xs font-sans text-platinum-dark">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-champagne flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-medium">14 Place Vendôme</strong>
                    <span>75001 Paris, France</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-champagne flex-shrink-0" />
                  <span className="text-white font-mono">+33 1 42 68 55 00</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-champagne flex-shrink-0" />
                  <span>Monday – Saturday, 10:00 – 19:00 CET</span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-noir-900 border border-white/10 space-y-6">
              <h3 className="font-display text-2xl text-white">Tokyo Ginza Salon</h3>
              <div className="space-y-4 text-xs font-sans text-platinum-dark">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-champagne flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-medium">6-10-1 Ginza, Chuo-ku</strong>
                    <span>Tokyo 104-0061, Japan</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-champagne flex-shrink-0" />
                  <span className="text-white font-mono">+81 3 5537 2000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-2xl bg-noir-900 border border-white/10 shadow-2xl">
              <h3 className="font-display text-2xl text-white mb-6">Concierge Transmission</h3>

              {isSent ? (
                <div className="py-16 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-champagne mx-auto" />
                  <h4 className="font-display text-2xl text-white">Transmission Recorded</h4>
                  <p className="text-xs text-platinum-dark max-w-sm mx-auto">
                    Your request has been delivered to our Private Salons manager. We look forward to welcoming you.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Geneviève Laurent"
                        className="w-full px-4 py-3 bg-noir-950 border border-white/15 focus:border-champagne text-white outline-none rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">
                        Patron Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="patron@domain.com"
                        className="w-full px-4 py-3 bg-noir-950 border border-white/15 focus:border-champagne text-white outline-none rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">
                      Inquiry Nature
                    </label>
                    <select
                      value={inquiryType}
                      onChange={(e) => setInquiryType(e.target.value)}
                      className="w-full px-4 py-3 bg-noir-950 border border-white/15 focus:border-champagne text-white outline-none rounded"
                    >
                      <option value="Private Fitting Appointment">Private Fitting Appointment (Paris/Tokyo)</option>
                      <option value="Sur Mesure Couture Consultation">Sur Mesure Couture Consultation</option>
                      <option value="Order & Courier Inquiries">Order & Courier Inquiries</option>
                      <option value="Press & Editorial Archiving">Press & Editorial Archiving</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">
                      Your Message or Fitting Preferences *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please specify desired dates, garments of interest, or sizing questions..."
                      className="w-full px-4 py-3 bg-noir-950 border border-white/15 focus:border-champagne text-white outline-none rounded"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>Transmit Concierge Inquiry</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
