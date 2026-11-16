import React, { useState } from 'react';
import { AccountLayout } from '../../components/layout/AccountLayout';
import { useAuthStore } from '../../stores/useAuthStore';
import { Plus, Trash2, CheckCircle2, MapPin } from 'lucide-react';
import { ShippingAddress } from '../../types';

export const AccountAddressesPage: React.FC = () => {
  const { user, addAddress, removeAddress, setDefaultAddress } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);

  const [newAddr, setNewAddr] = useState<ShippingAddress>({
    firstName: user?.name.split(' ')[0] || '',
    lastName: user?.name.split(' ')[1] || '',
    email: user?.email || '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'France',
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.addressLine1 || !newAddr.city || !newAddr.postalCode) return;
    addAddress(newAddr);
    setIsAdding(false);
  };

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
              DESTINATION LEDGER
            </span>
            <h2 className="font-display text-2xl sm:text-3xl text-white tracking-wide">
              Registered Residences
            </h2>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2.5 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest transition-colors flex items-center gap-2 rounded self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Residence</span>
          </button>
        </div>

        {/* Add Address Form Modal / Box */}
        {isAdding && (
          <form onSubmit={handleAddSubmit} className="p-6 rounded-xl bg-noir-950 border border-champagne/40 space-y-4 text-xs font-sans">
            <h3 className="font-display text-lg text-white">Register New Delivery Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase text-platinum-dark mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={newAddr.firstName}
                  onChange={(e) => setNewAddr({ ...newAddr, firstName: e.target.value })}
                  className="w-full px-3 py-2 bg-noir-900 border border-white/15 text-white rounded outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-platinum-dark mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={newAddr.lastName}
                  onChange={(e) => setNewAddr({ ...newAddr, lastName: e.target.value })}
                  className="w-full px-3 py-2 bg-noir-900 border border-white/15 text-white rounded outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase text-platinum-dark mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={newAddr.addressLine1}
                  onChange={(e) => setNewAddr({ ...newAddr, addressLine1: e.target.value })}
                  className="w-full px-3 py-2 bg-noir-900 border border-white/15 text-white rounded outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-platinum-dark mb-1">City</label>
                <input
                  type="text"
                  required
                  value={newAddr.city}
                  onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                  className="w-full px-3 py-2 bg-noir-900 border border-white/15 text-white rounded outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-platinum-dark mb-1">Postal Code</label>
                <input
                  type="text"
                  required
                  value={newAddr.postalCode}
                  onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                  className="w-full px-3 py-2 bg-noir-900 border border-white/15 text-white rounded outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-platinum-dark mb-1">Country</label>
                <input
                  type="text"
                  required
                  value={newAddr.country}
                  onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })}
                  className="w-full px-3 py-2 bg-noir-900 border border-white/15 text-white rounded outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2 bg-champagne text-noir-950 font-semibold uppercase tracking-wider text-xs rounded"
              >
                Save Destination
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-white/20 text-white text-xs uppercase tracking-wider rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* List of Addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {user?.addresses.map((addr, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-xl bg-noir-950 border text-xs font-sans space-y-3 relative ${
                addr.isDefault ? 'border-champagne' : 'border-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-sm">
                  {addr.firstName} {addr.lastName}
                </span>
                {addr.isDefault && (
                  <span className="px-2 py-0.5 rounded-full bg-champagne/20 text-champagne text-[10px] font-mono uppercase">
                    Primary
                  </span>
                )}
              </div>

              <div className="text-platinum-dark leading-relaxed">
                <p>{addr.addressLine1}</p>
                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                <p>{addr.postalCode} {addr.city}, {addr.country}</p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-white/5 text-[11px]">
                {!addr.isDefault ? (
                  <button
                    onClick={() => setDefaultAddress(idx)}
                    className="text-champagne hover:underline"
                  >
                    Set as Primary
                  </button>
                ) : (
                  <span className="text-white/40">Default Destination</span>
                )}
                {user.addresses.length > 1 && (
                  <button
                    onClick={() => removeAddress(idx)}
                    className="text-white/40 hover:text-red-400"
                    aria-label="Delete address"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AccountLayout>
  );
};
