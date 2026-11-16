import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '@/shared/stores/useCartStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useToastStore } from '@/shared/stores/useToastStore';
import { ordersApi, paymentsApi } from '@/shared/api';
import { ShippingAddress } from '@/shared/types';
import { ShippingAddressForm } from './components/ShippingAddressForm';
import { DeliveryMethodSelector } from './components/DeliveryMethodSelector';
import { PaymentMethodSelector } from './components/PaymentMethodSelector';
import type { PaymentMethod } from './components/PaymentMethodSelector';
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

  const { user } = useAuthStore();
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.addressLine1 || !formData.city || !formData.postalCode) {
      addToast({
        type: 'error',
        title: 'Địa chỉ chưa đầy đủ',
        message: 'Quý khách vui lòng cung cấp đầy đủ thông tin giao hàng bắt buộc.',
      });
      return;
    }

    const objectId = /^[a-f\d]{24}$/i;
    if (items.some((item) => !objectId.test(item.productId))) {
      addToast({ type: 'error', title: 'Không thể tạo đơn hàng an toàn', message: 'Giỏ hàng hiện chứa dữ liệu mẫu chưa có mã sản phẩm từ Backend. Vui lòng tải lại sản phẩm từ cửa hàng trước khi thanh toán.' });
      return;
    }

    setIsProcessing(true);
    try {
      let orderId = pendingOrderId;
      let order: any;
      if (!orderId) {
        const response = await ordersApi.createOrder({
          items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity, price: item.price })),
          shipping_address: {
            full_name: `${formData.firstName} ${formData.lastName}`.trim(), phone: formData.phone,
            city: formData.city, district: formData.state, ward: formData.postalCode, address_detail: formData.addressLine1,
          },
          payment_method: paymentMethod,
        });
        order = response.order || response.data?.order || response.data;
        orderId = order?._id || order?.id;
        if (!orderId) throw new Error('Máy chủ không trả về mã đơn hàng hợp lệ.');
        setPendingOrderId(orderId);
      }

      if (paymentMethod === 'cod') {
        clearCart();
        setPendingOrderId(null);
        navigate('/order-success', { state: { order } });
        return;
      }

      const paymentResponse = paymentMethod === 'momo' ? await paymentsApi.createMomoPayment(orderId) : await paymentsApi.createVnpayPayment(orderId);
      const paymentUrl = paymentResponse.paymentUrl || paymentResponse.data?.paymentUrl;
      if (!paymentUrl || !/^https?:\/\//i.test(paymentUrl)) throw new Error('Máy chủ chưa cung cấp đường dẫn thanh toán hợp lệ.');
      window.location.assign(paymentUrl);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Chưa thể hoàn tất', message: error?.message || 'Đơn hàng chưa được xác nhận. Vui lòng thử lại.' });
    } finally {
      setIsProcessing(false);
    }
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
              onSelectMethod={(method) => {
                if (pendingOrderId && method !== paymentMethod) {
                  addToast({ type: 'info', title: 'Đơn hàng đang chờ thanh toán', message: 'Để tránh tạo hoặc thanh toán trùng, hãy hoàn tất hoặc liên hệ hỗ trợ cho đơn hàng hiện tại.' });
                  return;
                }
                setPaymentMethod(method);
              }}
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
