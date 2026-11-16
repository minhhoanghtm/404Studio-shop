import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../stores/useCartStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useToastStore } from '../stores/useToastStore';
import { ShippingAddress } from '../types';
import { ShieldCheck, Lock, ArrowRight, Truck, CheckCircle2 } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, getSubtotal, getDiscount, getShippingFee, getTax, getTotal, clearCart } = useCartStore();
  const { user, createOrder } = useAuthStore();
  const { addToast } = useToastStore();

  const [formData, setFormData] = useState<ShippingAddress>({
    firstName: user?.name.split(' ')[0] || 'Geneviève',
    lastName: user?.name.split(' ')[1] || 'Laurent',
    email: user?.email || 'g.laurent@verite-atelier.com',
    phone: user?.phone || '+33 1 42 68 55 00',
    addressLine1: user?.addresses[0]?.addressLine1 || '14 Place Vendôme',
    addressLine2: user?.addresses[0]?.addressLine2 || 'Appartement 4B',
    city: user?.addresses[0]?.city || 'Paris',
    state: user?.addresses[0]?.state || 'Île-de-France',
    postalCode: user?.addresses[0]?.postalCode || '75001',
    country: user?.addresses[0]?.country || 'France',
  });

  const [shippingMethod, setShippingMethod] = useState<'white-glove' | 'express'>('white-glove');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wire' | 'apple-pay'>('card');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 8842');
  const [cardExpiry, setCardExpiry] = useState('11/29');
  const [cardCvc, setCardCvc] = useState('884');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const baseShipping = getShippingFee();
  const extraShipping = shippingMethod === 'express' ? 25 : 0;
  const shipping = baseShipping + extraShipping;
  const tax = getTax();
  const total = subtotal - discount + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="w-full bg-noir-950 text-white min-h-[70vh] flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h2 className="font-display text-3xl">No items in bag</h2>
          <p className="text-xs text-platinum-dark">Please select garments before accessing checkout.</p>
          <Link
            to="/shop"
            className="inline-block px-6 py-3 bg-champagne text-noir-950 font-semibold text-xs uppercase tracking-widest"
          >
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.addressLine1 || !formData.city || !formData.postalCode) {
      addToast({
        type: 'error',
        title: 'Incomplete Address',
        message: 'Please complete all required shipping fields.',
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const orderItems = items.map((item, idx) => ({
        id: `oi_${Date.now()}_${idx}`,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.selectedSize,
        color: item.selectedColor,
        image: item.image,
      }));

      const newOrder = createOrder({
        items: orderItems,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        shippingAddress: formData,
        paymentMethod: paymentMethod === 'card' ? 'Mastercard ending in 8842' : 'Bank Wire Concierge',
      });

      clearCart();
      setIsProcessing(false);

      navigate(`/order-success?orderId=${newOrder.orderNumber}`);
    }, 1200);
  };

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="border-b border-white/10 pb-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-1">
              Concierge Checkout
            </span>
            <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
              Complete Acquisition
            </h1>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-platinum-dark font-sans">
            <Lock className="w-3.5 h-3.5 text-champagne" /> 256-Bit SSL Encrypted
          </span>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Form: Details */}
          <div className="lg:col-span-7 space-y-10">
            {/* Step 1: Shipping Address */}
            <div className="space-y-4">
              <h3 className="font-display text-xl text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-champagne text-noir-950 text-xs font-bold flex items-center justify-center">1</span>
                <span>White-Glove Shipping Address</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-3 bg-noir-900 border border-white/15 focus:border-champagne text-white outline-none rounded"
                  />
                </div>
                <div>
                  <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-3 bg-noir-900 border border-white/15 focus:border-champagne text-white outline-none rounded"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">Email for Private Dispatches *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3.5 py-3 bg-noir-900 border border-white/15 focus:border-champagne text-white outline-none rounded"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">Street Address *</label>
                  <input
                    type="text"
                    name="addressLine1"
                    required
                    value={formData.addressLine1}
                    onChange={handleChange}
                    placeholder="e.g. 14 Place Vendôme"
                    className="w-full px-3.5 py-3 bg-noir-900 border border-white/15 focus:border-champagne text-white outline-none rounded"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">Apartment / Suite / Salon (Optional)</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    className="w-full px-3.5 py-3 bg-noir-900 border border-white/15 focus:border-champagne text-white outline-none rounded"
                  />
                </div>
                <div>
                  <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3.5 py-3 bg-noir-900 border border-white/15 focus:border-champagne text-white outline-none rounded"
                  />
                </div>
                <div>
                  <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">Postal Code *</label>
                  <input
                    type="text"
                    name="postalCode"
                    required
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="w-full px-3.5 py-3 bg-noir-900 border border-white/15 focus:border-champagne text-white outline-none rounded"
                  />
                </div>
                <div>
                  <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">State / Province</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3.5 py-3 bg-noir-900 border border-white/15 focus:border-champagne text-white outline-none rounded"
                  />
                </div>
                <div>
                  <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">Country *</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-3.5 py-3 bg-noir-900 border border-white/15 focus:border-champagne text-white outline-none rounded"
                  >
                    <option value="France">France</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Japan">Japan</option>
                    <option value="Italy">Italy</option>
                    <option value="Germany">Germany</option>
                    <option value="Switzerland">Switzerland</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Delivery Method */}
            <div className="space-y-4">
              <h3 className="font-display text-xl text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-champagne text-noir-950 text-xs font-bold flex items-center justify-center">2</span>
                <span>Delivery Protocol</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  onClick={() => setShippingMethod('white-glove')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    shippingMethod === 'white-glove'
                      ? 'border-champagne bg-champagne/10'
                      : 'border-white/10 bg-noir-900 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-white">
                      White-Glove Courier
                    </span>
                    <Truck className="w-4 h-4 text-champagne" />
                  </div>
                  <p className="text-[11px] text-platinum-dark mt-1 font-sans">
                    3-5 business days • Cedar box packaging with garment hangers.
                  </p>
                  <span className="text-xs font-mono text-champagne font-bold block mt-3">
                    {baseShipping === 0 ? 'Complimentary' : `$${baseShipping}`}
                  </span>
                </label>

                <label
                  onClick={() => setShippingMethod('express')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    shippingMethod === 'express'
                      ? 'border-champagne bg-champagne/10'
                      : 'border-white/10 bg-noir-900 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-white">
                      Priority Air Express
                    </span>
                    <Truck className="w-4 h-4 text-champagne" />
                  </div>
                  <p className="text-[11px] text-platinum-dark mt-1 font-sans">
                    1-2 business days • Dedicated diplomatic freight channel.
                  </p>
                  <span className="text-xs font-mono text-champagne font-bold block mt-3">
                    + $25.00
                  </span>
                </label>
              </div>
            </div>

            {/* Step 3: Payment Simulation */}
            <div className="space-y-4">
              <h3 className="font-display text-xl text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-champagne text-noir-950 text-xs font-bold flex items-center justify-center">3</span>
                <span>Payment Simulation</span>
              </h3>

              <div className="p-4 rounded-xl bg-champagne/5 border border-champagne/30 text-xs text-champagne font-sans mb-4">
                <strong>Simulated Client Experience:</strong> No actual financial transactions occur. Test credentials and prefilled values are active for evaluation.
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-3 text-xs uppercase tracking-wider rounded border ${
                      paymentMethod === 'card'
                        ? 'border-champagne bg-champagne text-noir-950 font-bold'
                        : 'border-white/10 bg-noir-900 text-white'
                    }`}
                  >
                    Credit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('apple-pay')}
                    className={`py-3 text-xs uppercase tracking-wider rounded border ${
                      paymentMethod === 'apple-pay'
                        ? 'border-champagne bg-champagne text-noir-950 font-bold'
                        : 'border-white/10 bg-noir-900 text-white'
                    }`}
                  >
                    Apple Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wire')}
                    className={`py-3 text-xs uppercase tracking-wider rounded border ${
                      paymentMethod === 'wire'
                        ? 'border-champagne bg-champagne text-noir-950 font-bold'
                        : 'border-white/10 bg-noir-900 text-white'
                    }`}
                  >
                    Bank Wire
                  </button>
                </div>

                {paymentMethod === 'card' && (
                  <div className="p-4 rounded-xl bg-noir-900 border border-white/10 space-y-3 text-xs font-sans">
                    <div>
                      <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2.5 bg-noir-950 border border-white/15 focus:border-champagne text-white font-mono rounded"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">Expires</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3 py-2.5 bg-noir-950 border border-white/15 focus:border-champagne text-white font-mono rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-platinum-dark uppercase tracking-wider text-[10px] mb-1">CVC Code</label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full px-3 py-2.5 bg-noir-950 border border-white/15 focus:border-champagne text-white font-mono rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="p-8 rounded-2xl bg-noir-900 border border-white/10 space-y-6 shadow-2xl sticky top-28">
              <h3 className="font-display text-2xl text-white">Order Review</h3>

              {/* Items Miniature List */}
              <div className="max-h-60 overflow-y-auto space-y-3 divide-y divide-white/5 pr-1">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
                    className="pt-3 first:pt-0 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt=""
                        className="w-12 h-14 object-cover rounded bg-noir-950"
                      />
                      <div>
                        <p className="font-serif text-sm text-white font-medium line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-platinum-dark">
                          Qty {item.quantity} • {item.selectedColor} • {item.selectedSize}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-white font-medium">
                      ${(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cost Calculations */}
              <div className="space-y-2 text-xs text-platinum-dark font-sans border-t border-white/10 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white font-mono">${subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-champagne">
                    <span>Privilège Discount</span>
                    <span className="font-mono">-${discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-white font-mono">
                    {shipping === 0 ? 'Complimentary' : `$${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Taxes (8%)</span>
                  <span className="text-white font-mono">${tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-white/10 text-base font-semibold text-white">
                  <span>Total Amount</span>
                  <span className="text-champagne font-mono text-xl">${total.toLocaleString()}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 bg-champagne hover:bg-champagne-hover disabled:bg-champagne/40 text-noir-950 font-semibold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-xl"
              >
                {isProcessing ? (
                  <span>Securing Order Tailoring...</span>
                ) : (
                  <>
                    <span>Confirm & Authorize Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-[10px] text-center text-platinum-dark space-y-1">
                <p>30-Day White Glove Returns Guaranteed</p>
                <p className="text-white/40 font-mono">Simulated Frontend Environment</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
