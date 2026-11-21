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
import { ArrowLeft, AlertTriangle, Trash2 } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    getSubtotal,
    getDiscount,
    getShippingFee,
    getTax,
    clearCart,
    removeInvalidItems,
  } = useCartStore();

  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const objectId = /^[a-f\d]{24}$/i;
  const invalidItems = items.filter((item) => !objectId.test(item.productId));

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
      <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-[70vh] flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h2 className="font-display text-3xl text-[var(--text)]">Túi mua sắm trống</h2>
          <p className="text-xs text-[var(--text-muted)]">Vui lòng chọn sản phẩm trước khi tiến hành thanh toán.</p>
          <Link
            to="/products"
            className="inline-block px-6 py-3 bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[#9E7B15] font-semibold text-xs uppercase tracking-widest rounded-lg shadow-md"
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

    if (invalidItems.length > 0) {
      const invalidNames = invalidItems.map((item) => `"${item.name}"`).join(', ');
      addToast({
        type: 'error',
        title: 'Sản phẩm không hợp lệ trong giỏ',
        message: `Phát hiện ${invalidItems.length} sản phẩm dữ liệu mẫu chưa có mã Backend: ${invalidNames}. Vui lòng bấm nút "Xóa sản phẩm lỗi" bên dưới để tiếp tục thanh toán.`,
      });
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
            full_name: `${formData.firstName} ${formData.lastName}`.trim(),
            phone: formData.phone,
            city: formData.city,
            district: formData.state,
            ward: formData.postalCode,
            address_detail: formData.addressLine1,
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

      const paymentResponse =
        paymentMethod === 'momo'
          ? await paymentsApi.createMomoPayment(orderId)
          : await paymentsApi.createVnpayPayment(orderId);
      const paymentUrl = paymentResponse.paymentUrl || paymentResponse.data?.paymentUrl;
      if (!paymentUrl || !/^https?:\/\//i.test(paymentUrl)) {
        throw new Error('Máy chủ chưa cung cấp đường dẫn thanh toán hợp lệ.');
      }
      window.location.assign(paymentUrl);
    } catch (error: any) {
      const isGuestError =
        error?.code === 'GUEST_CHECKOUT_DISABLED' ||
        error?.status === 403 ||
        error?.message?.includes('không cần đăng nhập');
      if (isGuestError && !user) {
        addToast({
          type: 'error',
          title: 'Yêu cầu đăng nhập',
          message: 'Chức năng đặt hàng hiện yêu cầu đăng nhập tài khoản. Đang chuyển hướng đến trang đăng nhập...',
        });
        setTimeout(() => navigate('/account/login?redirect=/checkout'), 1600);
        return;
      }
      addToast({
        type: 'error',
        title: 'Chưa thể hoàn tất',
        message: error?.message || 'Đơn hàng chưa được xác nhận. Vui lòng thử lại.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full bg-[var(--bg-page)] text-[var(--text-primary)] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
          <div>
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--accent)] hover:underline mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Trở lại túi mua sắm
            </Link>
            <h1 className="font-display text-3xl sm:text-4xl text-[var(--text-primary)]">
              {vi.checkout.title}
            </h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-sans hidden sm:block">
            {vi.checkout.subtitle}
          </p>
        </div>

        {/* Cảnh báo sản phẩm lỗi / dữ liệu mẫu kèm nút Xóa sản phẩm lỗi */}
        {invalidItems.length > 0 && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-red-400 font-medium text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Phát hiện {invalidItems.length} sản phẩm dữ liệu mẫu chưa có mã Backend</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Sản phẩm lỗi: <strong className="text-[var(--text-primary)]">{invalidItems.map((it) => it.name).join(', ')}</strong>. Vui lòng xóa các mục này để tiếp tục thanh toán an toàn.
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeInvalidItems()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/60 rounded text-xs font-mono font-medium transition-colors shrink-0 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa sản phẩm lỗi ({invalidItems.length})
            </button>
          </div>
        )}

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
                  addToast({
                    type: 'info',
                    title: 'Đơn hàng đang chờ thanh toán',
                    message: 'Để tránh tạo hoặc thanh toán trùng, hãy hoàn tất hoặc liên hệ hỗ trợ cho đơn hàng hiện tại.',
                  });
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
