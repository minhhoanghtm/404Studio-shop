import React, { useState } from 'react';
import { AccountLayout } from '../../components/layout/AccountLayout';
import { useAuthStore } from '../../stores/useAuthStore';
import { useToastStore } from '../../stores/useToastStore';
import { Shield, Bell, Check } from 'lucide-react';

export const AccountSettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { addToast } = useToastStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [receivePrivateNotices, setReceivePrivateNotices] = useState(true);
  const [receiveRunwayInvitations, setReceiveRunwayInvitations] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, email, phone });
    addToast({
      type: 'success',
      title: 'Preferences Updated',
      message: 'Your personal settings have been saved.',
    });
  };

  return (
    <AccountLayout>
      <div className="space-y-8 max-w-xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
            PATRON PREFERENCES
          </span>
          <h2 className="font-display text-2xl sm:text-3xl text-white tracking-wide">
            Settings & Security
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-6 text-xs font-sans">
          <div className="space-y-4">
            <h4 className="text-white font-medium uppercase tracking-wider text-[11px] border-b border-white/5 pb-2">
              Identity Profile
            </h4>
            <div>
              <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-noir-950 border border-white/15 focus:border-champagne text-white outline-none rounded"
              />
            </div>
            <div>
              <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">
                Patron Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-noir-950 border border-white/15 focus:border-champagne text-white outline-none rounded"
              />
            </div>
            <div>
              <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">
                Direct Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-noir-950 border border-white/15 focus:border-champagne text-white outline-none rounded"
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            <h4 className="text-white font-medium uppercase tracking-wider text-[11px] pb-1">
              Private Dispatches & Privileges
            </h4>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={receivePrivateNotices}
                onChange={(e) => setReceivePrivateNotices(e.target.checked)}
                className="accent-champagne w-4 h-4 rounded"
              />
              <span className="text-platinum-light">
                Receive quarterly Gazette monographs & textile essays
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={receiveRunwayInvitations}
                onChange={(e) => setReceiveRunwayInvitations(e.target.checked)}
                className="accent-champagne w-4 h-4 rounded"
              />
              <span className="text-platinum-light">
                Receive Paris Fashion Week presentation reservations
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold uppercase tracking-widest text-xs rounded transition-colors"
          >
            Save Preferences
          </button>
        </form>
      </div>
    </AccountLayout>
  );
};
