import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '@/shared/stores/useCartStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useToastStore } from '@/shared/stores/useToastStore';
import { ShippingAddress } from '@/shared/types';
import { ShippingAddressForm } from './components/ShippingAddressForm';
import { DeliveryMethodSelector } from './components/DeliveryMethodSelector';
import { PaymentMethodSelector } from './components/PaymentMethodSelector';
import { CheckoutSummary } from './components/CheckoutSummary';
import { vi } from '@/shared/locales/vi/common';
import { ArrowLeft } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    getSubtotal,
    getDiscount,
    getShippingFee,
    getTax,
    clearCart,
  } = useCartStore();

  const { user, createOrder } = useAuthStore();
  const { addToast } = useToastStore();

  const [formData, setFormData] = useState<ShippingAddress>({
    firstName: user?.name.split(' ')[0] || 'Geneviève',
    lastName: user?.name.split(' ')[1] || 'Laurent',
    email: user?.email || 'g.laurent@verite-atelier.com',
    phone: user?.phone || '+84 90 123 4567',
    addressLine1: user?.addresses[0]?.addressLine1 || '68 Nguyễn Du, Bến Nghé, Quận 1',
    addressLine2: user?.addresses[0]?.addressLine2 || 'Phòng VIP 4B',
    city: user?.addresses[0]?.city || 'TP. Hồ Chí Minh',
    state: user?.addresses[0]?.state || 'Hồ Chí Minh',
    postalCode: user?.addresses[0]?.postalCode || '700000',
    country: user?.addresses[0]?.country || 'Việt Nam',
  });

  const [shippingMethod, setShippingMethod] = useState<'white-glove' | 'express'>('white-glove');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wire'>('card');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 8842');
  const [cardExpiry, setCardExpiry] = useState('11/29');
  const [cardCvc, setCardCvc] = useState('884');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const baseShipping = getShippingFee();
  const extraShipping = shippingMethod === 'express' ? 500000 : 0;
  const shipping = baseShipping + extraShipping;
  const tax = getTax();
  const total = subtotal - discount + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="w-full bg-noir-950 text-white min-h-[70vh] flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h2 className="font-display text-3xl">Túi mua sắm trống</h2>
          <p className="text-xs text-platinum-dark">Vui lòng chọn tác phẩm trước khi tiến hành thanh toán.</p>
          <Link
            to="/products"
            className="inline-block px-6 py-3 bg-champagne text-noir-950 font-semibold text-xs uppercase tracking-widest rounded-lg"
          >
            Quay lại cửa hàng
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
        title: 'Địa chỉ chưa đầy đủ',
        message: 'Quý khách vui lòng cung cấp đầy đủ thông tin giao hàng bắt buộc.',
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
        paymentMethod: paymentMethod === 'card' ? 'Mastercard •••• 8842' : 'Chuyển khoản Concierge Maison',
      });

      clearCart();
      setIsProcessing(false);

      addToast({
        type: 'success',
        title: 'Đơn hàng đã được xác nhận',
        message: `Mã đơn hàng ${newOrder.orderNumber} đã ghi nhận thành công.`,
      });

      navigate('/order-success', { state: { order: newOrder } });
    }, 1500);
  };

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-champagne hover:underline mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Trở lại túi mua sắm
            </Link>
            <h1 className="font-display text-3xl sm:text-4xl text-white">
              {vi.checkout.title}
            </h1>
          </div>
          <p className="text-xs text-platinum-dark font-sans hidden sm:block">
            {vi.checkout.subtitle}
          </p>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-8">
            <ShippingAddressForm formData={formData} onChange={handleChange} />
            <DeliveryMethodSelector
              method={shippingMethod}
              onSelectMethod={setShippingMethod}
              baseShipping={baseShipping}
            />
            <PaymentMethodSelector
              method={paymentMethod}
              onSelectMethod={setPaymentMethod}
              cardNumber={cardNumber}
              onCardNumberChange={setCardNumber}
              cardExpiry={cardExpiry}
              onCardExpiryChange={setCardExpiry}
              cardCvc={cardCvc}
              onCardCvcChange={setCardCvc}
            />
          </div>

          <div className="lg:col-span-4">
            <CheckoutSummary
              items={items}
              subtotal={subtotal}
              discount={discount}
              shipping={shipping}
              tax={tax}
              total={total}
              isProcessing={isProcessing}
              onSubmit={handlePlaceOrder}
            />
          </div>
        </form>
      </div>
    </div>
  );
};
