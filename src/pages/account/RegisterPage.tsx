import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { ArrowRight, Sparkles } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    await register(name, email, password);
    navigate('/account');
  };

  return (
    <div className="w-full bg-noir-950 text-white min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 sm:p-10 rounded-2xl bg-noir-900 border border-white/10 shadow-2xl space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
            NEW PATRON PORTFOLIO
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
            Join the Maison
          </h1>
          <p className="text-xs text-platinum-dark font-sans font-light">
            Register to save customized measurements, receive runway invitations, and track orders.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Clara Moreau"
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

          <div>
            <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">
              Create Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-4 py-3 bg-noir-950 border border-white/15 focus:border-champagne text-white outline-none rounded"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 shadow-lg rounded"
            >
              <span>Initialize Patron Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-platinum-dark pt-4 border-t border-white/10">
          <p>
            Already an authenticated patron?{' '}
            <Link to="/login" className="text-champagne font-medium hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
