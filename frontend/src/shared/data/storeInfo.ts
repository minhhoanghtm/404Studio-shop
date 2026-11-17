export interface FAQItem {
  id: string;
  category: 'Đơn hàng & Concierge' | 'Thủ công & Đo kích cỡ' | 'Vận chuyển & Thuế quan' | 'Đổi trả & Bảo quản';
  question: string;
  answer: string;
}

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Đơn hàng & Concierge',
    question: 'Làm thế nào để ủy thác một tác phẩm May Đo Riêng (Sur Mesure)?',
    answer: 'Các tác phẩm Haute Couture và Sur Mesure của chúng tôi được chế tác riêng biệt theo yêu cầu của từng quý khách. Quý khách có thể đặt lịch tư vấn trực tuyến với xưởng may Paris hoặc đặt lịch thử đồ trực tiếp tại salon Place Vendôme. Mỗi tác phẩm may đo đòi hỏi từ 8 đến 14 tuần hoàn thiện thủ công.',
  },
  {
    id: 'faq-2',
    category: 'Đơn hàng & Concierge',
    question: 'Các y phục có được sản xuất với số lượng giới hạn không?',
    answer: 'Chính xác. Atelier Vérité chỉ sản xuất theo các đợt hữu hạn được đánh số seri riêng để ngăn chặn sự sản xuất thừa và bảo đảm độ hoàn mỹ của chất liệu dệt. Khi một mẻ nhuộm hoặc cuộn da cừu độc quyền được dùng hết, kiểu dáng đó sẽ được lưu trữ vĩnh viễn.',
  },
  {
    id: 'faq-3',
    category: 'Vận chuyển & Thuế quan',
    question: 'Chính sách vận chuyển và hạn mức miễn phí là gì?',
    answer: 'Chúng tôi cung cấp dịch vụ chuyển phát găng tay trắng miễn phí toàn cầu cho tất cả các đơn hàng từ 12.000.000 ₫ trở lên. Đơn hàng dưới mức này áp dụng phí chuyển phát cố định 850.000 ₫. Toàn bộ thuế nhập khẩu và bảo hiểm vận chuyển đều được Maison Vérité thanh toán trước.',
  },
  {
    id: 'faq-4',
    category: 'Vận chuyển & Thuế quan',
    question: 'Thời gian giao hàng mất bao lâu?',
    answer: 'Y phục may sẵn và phụ kiện đồ da được đóng gói và bàn giao trong vòng 24-48 giờ làm việc qua dịch vụ DHL Express hoặc Ferrari Logistics. Thời gian giao hàng thông thường từ 2-4 ngày làm việc tới châu Âu và Bắc Mỹ, và 3-5 ngày làm việc tới châu Á - Thái Bình Dương.',
  },
  {
    id: 'faq-5',
    category: 'Đổi trả & Bảo quản',
    question: 'Chính sách đổi trả và chăm sóc trang phục như thế nào?',
    answer: 'Chúng tôi áp dụng chính sách đổi trả miễn phí trong vòng 30 ngày kể từ ngày quý khách ký nhận kiện hàng. Y phục cần giữ nguyên vẹn tem niêm phong an ninh, chưa qua sử dụng, chưa giặt ủi và còn đầy đủ hộp gỗ tuyết tùng cùng mắc áo đi kèm.',
  },
  {
    id: 'faq-6',
    category: 'Thủ công & Đo kích cỡ',
    question: 'Kích cỡ may đo Pháp (FR) và Ý (IT) được quy đổi như thế nào?',
    answer: 'Bộ sưu tập nữ của chúng tôi tuân theo hệ số đo may đo truyền thống của Paris (từ FR 34 đến FR 42), trong khi đồ may đo nam áp dụng chuẩn của Milan (từ IT 46 đến IT 54). Quý khách vui lòng tham khảo Bảng Hướng Dẫn Đo Kích Cỡ chi tiết tính bằng cm để lựa chọn chuẩn xác.',
  },
];

export const SIZE_CHART = {
  women: [
    { fr: '34 FR', us: '0 US', bust: '80-83 cm', waist: '60-63 cm', hips: '86-89 cm' },
    { fr: '36 FR', us: '2-4 US', bust: '84-87 cm', waist: '64-67 cm', hips: '90-93 cm' },
    { fr: '38 FR', us: '6 US', bust: '88-91 cm', waist: '68-71 cm', hips: '94-97 cm' },
    { fr: '40 FR', us: '8 US', bust: '92-95 cm', waist: '72-75 cm', hips: '98-101 cm' },
    { fr: '42 FR', us: '10 US', bust: '96-100 cm', waist: '76-80 cm', hips: '102-106 cm' },
  ],
  men: [
    { it: '46 IT', us: '36 US', chest: '92-95 cm', waist: '78-81 cm', collar: '38 cm' },
    { it: '48 IT', us: '38 US', chest: '96-99 cm', waist: '82-85 cm', collar: '39 cm' },
    { it: '50 IT', us: '40 US', chest: '100-103 cm', waist: '86-89 cm', collar: '40 cm' },
    { it: '52 IT', us: '42 US', chest: '104-107 cm', waist: '90-93 cm', collar: '41 cm' },
    { it: '54 IT', us: '44 US', chest: '108-112 cm', waist: '94-98 cm', collar: '42 cm' },
  ],
};
