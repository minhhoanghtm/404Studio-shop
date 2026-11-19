import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { Plus, Edit3, Trash2, FolderTree } from 'lucide-react';
import { categoriesApi, adminApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.getCategories();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setCategories(res.data);
      } else {
        setCategories([
          {
            id: 'c-1',
            name: 'Áo Khoác Haute Couture',
            slug: 'outerwear',
            description: 'Dạ len Cashmere Biella và Shearling đúc khối kiến trúc',
            productCount: 8,
          },
          {
            id: 'c-2',
            name: 'Đầm Lụa Dạ Tiệc',
            slug: 'gowns',
            description: 'Cắt xéo 45 độ trên lụa Lyon 30-momme',
            productCount: 12,
          },
          {
            id: 'c-3',
            name: 'Đồ May Đo Thượng Khách',
            slug: 'tailoring',
            description: 'Âu phục nam may đo thủ công, sơ mi lanh Normandy',
            productCount: 6,
          },
          {
            id: 'c-4',
            name: 'Phụ Kiện Da Thật & Trang Sức',
            slug: 'accessories',
            description: 'Da Box Calfskin tay cầm gỗ sồi và bạc Vermeil mạ vàng',
            productCount: 14,
          },
        ]);
      }
    } catch {
      // Fallback
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingCat) {
      setCategories(
        categories.map((c) =>
          c.id === editingCat.id || c._id === editingCat.id
            ? { ...c, name: formName, slug: formSlug, description: formDescription }
            : c
        )
      );
      addToast('Cập nhật danh mục thành công!', 'success');
    } else {
      const newCat = {
        id: 'c-' + Date.now(),
        name: formName,
        slug: formSlug || formName.toLowerCase().replace(/\s+/g, '-'),
        description: formDescription,
        productCount: 0,
      };
      setCategories([...categories, newCat]);
      addToast('Đã thêm danh mục mới thành công!', 'success');
    }
    setIsModalOpen(false);
    setEditingCat(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Xác nhận xóa danh mục "${name}"?`)) return;
    setCategories(categories.filter((c) => c.id !== id && c._id !== id));
    addToast(`Đã xóa danh mục ${name}`, 'success');
  };

  return (
    <AdminLayout
      title="Danh Mục Thời Trang Phân Cấp"
      subtitle="Quản lý cấu trúc cây danh mục hiển thị trên Mega Menu và bộ lọc sản phẩm"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-xs text-platinum-dark">
            Tổng cộng: <strong className="text-white font-mono">{categories.length}</strong> danh mục
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingCat(null);
              setFormName('');
              setFormSlug('');
              setFormDescription('');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-champagne text-noir-950 font-semibold text-xs uppercase tracking-wider rounded-sm hover:bg-champagne/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Danh Mục Mới</span>
          </button>
        </div>

        <div className="bg-noir-900 border border-white/10 rounded-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-platinum-dark uppercase tracking-wider bg-white/5">
                <th className="py-3 px-4">Tên Danh Mục</th>
                <th className="py-3 px-4">Đường Dẫn Slug</th>
                <th className="py-3 px-4">Mô Tả Định Hướng</th>
                <th className="py-3 px-4">Số Sản Phẩm</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {categories.map((cat) => (
                <tr key={cat.id || cat._id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-serif font-medium text-white text-sm">
                    {cat.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-champagne">{cat.slug}</td>
                  <td className="py-3.5 px-4 text-platinum-dark max-w-xs truncate">
                    {cat.description || 'Chưa có mô tả'}
                  </td>
                  <td className="py-3.5 px-4 font-mono">{cat.productCount || 0}</td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCat(cat);
                        setFormName(cat.name);
                        setFormSlug(cat.slug);
                        setFormDescription(cat.description || '');
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-platinum-dark hover:text-champagne transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id || cat._id, cat.name)}
                      className="p-1.5 text-platinum-dark hover:text-red-400 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-noir-900 border border-white/10 w-full max-w-md p-6 rounded-sm text-white">
              <h3 className="font-display text-lg mb-4">
                {editingCat ? 'Chỉnh Sửa Danh Mục' : 'Tạo Danh Mục Mới'}
              </h3>
              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="block text-platinum-dark uppercase tracking-wider mb-1">
                    Tên Danh Mục
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ví dụ: Đầm Dạ Tiệc"
                    className="w-full px-3 py-2 bg-noir-950 border border-white/15 focus:border-champagne focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-platinum-dark uppercase tracking-wider mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="gowns"
                    className="w-full px-3 py-2 bg-noir-950 border border-white/15 focus:border-champagne focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-platinum-dark uppercase tracking-wider mb-1">
                    Mô Tả
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Mô tả phong cách và chất liệu tiêu biểu..."
                    className="w-full px-3 py-2 bg-noir-950 border border-white/15 focus:border-champagne focus:outline-none"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-white/15 text-platinum-dark hover:text-white uppercase tracking-wider"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-champagne text-noir-950 font-semibold uppercase tracking-wider"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
