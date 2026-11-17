import React from 'react';
import { ShippingAddress } from '../../../shared/types';
import { vi } from '../../../shared/locales/vi/common';

interface ShippingAddressFormProps {
  formData: ShippingAddress;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const ShippingAddressForm: React.FC<ShippingAddressFormProps> = ({
  formData,
  onChange,
}) => {
  return (
    <div className="p-8 rounded-2xl bg-noir-900 border border-white/10 space-y-6">
      <h3 className="font-display text-xl text-white tracking-wide border-b border-white/10 pb-4">
        {vi.checkout.step1}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
        <div>
          <label className="block text-white/60 mb-1.5">{vi.checkout.firstName}</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={onChange}
            required
            className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white focus:border-champagne outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-white/60 mb-1.5">{vi.checkout.lastName}</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={onChange}
            required
            className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white focus:border-champagne outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-white/60 mb-1.5">{vi.checkout.email}</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            required
            className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white focus:border-champagne outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-white/60 mb-1.5">{vi.checkout.phone}</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            required
            className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white focus:border-champagne outline-none transition-colors"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-white/60 mb-1.5">{vi.checkout.address}</label>
          <input
            type="text"
            name="addressLine1"
            value={formData.addressLine1}
            onChange={onChange}
            required
            placeholder="Số nhà, tên đường, khu đô thị..."
            className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white focus:border-champagne outline-none transition-colors"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-white/60 mb-1.5">{vi.checkout.apartment}</label>
          <input
            type="text"
            name="addressLine2"
            value={formData.addressLine2 || ''}
            onChange={onChange}
            placeholder="Căn hộ, tầng, tòa nhà (tùy chọn)..."
            className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white focus:border-champagne outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-white/60 mb-1.5">{vi.checkout.city}</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={onChange}
            required
            className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white focus:border-champagne outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-white/60 mb-1.5">{vi.checkout.state}</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={onChange}
            className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white focus:border-champagne outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-white/60 mb-1.5">{vi.checkout.postalCode}</label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={onChange}
            required
            className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white focus:border-champagne outline-none transition-colors font-mono"
          />
        </div>

        <div>
          <label className="block text-white/60 mb-1.5">{vi.checkout.country}</label>
          <select
            name="country"
            value={formData.country}
            onChange={onChange}
            className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white focus:border-champagne outline-none transition-colors"
          >
            <option value="Việt Nam">Việt Nam</option>
            <option value="France">Pháp (France)</option>
            <option value="Japan">Nhật Bản (Japan)</option>
            <option value="United States">Hoa Kỳ (USA)</option>
            <option value="Italy">Ý (Italy)</option>
            <option value="Singapore">Singapore</option>
          </select>
        </div>
      </div>
    </div>
  );
};
