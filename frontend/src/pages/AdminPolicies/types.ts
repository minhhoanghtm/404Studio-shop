import { PolicyDocument } from '@/shared/api';

export type PolicyStatusFilter = 'all' | 'draft' | 'published' | 'archived';

export interface PolicyCategoryMeta {
  key: string;
  label: string;
  description: string;
}

export const POLICY_CATEGORIES: PolicyCategoryMeta[] = [
  { key: 'all', label: 'Tất cả loại chính sách', description: 'Toàn bộ danh mục chính sách' },
  { key: 'privacy', label: 'Chính sách bảo mật', description: 'Bảo vệ dữ liệu cá nhân theo Luật 91/2025/QH15' },
  { key: 'terms', label: 'Điều khoản sử dụng', description: 'Quy tắc giao dịch và quyền nghĩa vụ khách hàng' },
  { key: 'cookie', label: 'Chính sách Cookie', description: 'Quy chuẩn lưu trữ và tracking kỹ thuật số' },
  { key: 'returns', label: 'Đổi trả & Hoàn tiền', description: 'Chính sách đổi trả trong vòng 7 ngày' },
  { key: 'shipping', label: 'Chính sách giao hàng', description: 'Quy chuẩn đóng gói kiện gỗ tuyết tùng và logistics GHN' },
  { key: 'payment', label: 'Chính sách thanh toán', description: 'Quy định giao dịch MoMo, VNPay và bảo mật thẻ' },
  { key: 'security', label: 'Bảo mật tài khoản', description: 'Quy chuẩn xác thực 2 lớp OTP và bảo mật mật khẩu' },
];

export interface PolicyTableState {
  items: PolicyDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  search: string;
  status: PolicyStatusFilter;
  category: string;
}
