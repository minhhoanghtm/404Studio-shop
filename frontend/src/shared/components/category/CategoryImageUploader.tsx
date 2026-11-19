import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { uploadApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';

interface CategoryImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
}

export const CategoryImageUploader: React.FC<CategoryImageUploaderProps> = ({
  value,
  onChange,
  required = true,
}) => {
  const { addToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [previewError, setPreviewError] = useState(false);

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE_MB = 5;

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      addToast('Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP.', 'error');
      return false;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      addToast(`Dung lượng ảnh vượt quá giới hạn ${MAX_SIZE_MB}MB.`, 'error');
      return false;
    }
    return true;
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setPreviewError(false);

    try {
      const res = await uploadApi.uploadImage(file);
      const uploadedUrl = res.url || res.data?.url;
      if (uploadedUrl) {
        onChange(uploadedUrl);
        addToast('Tải ảnh danh mục lên thành công!', 'success');
      } else {
        throw new Error('Máy chủ không trả về URL ảnh.');
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Không thể tải ảnh lên máy chủ.';
      addToast(`Lỗi upload ảnh: ${msg}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('/uploads/')) {
      addToast('Đường dẫn ảnh phải bắt đầu bằng https:// hoặc /uploads/', 'error');
      return;
    }
    onChange(trimmed);
    setUrlInput('');
    setIsUrlMode(false);
    setPreviewError(false);
    addToast('Đã áp dụng đường dẫn ảnh.', 'success');
  };

  const handleRemove = () => {
    onChange('');
    setPreviewError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-platinum-light font-medium flex items-center gap-1.5">
          <span>Hình Ảnh Đại Diện Danh Mục</span>
          {required && <span className="text-red-400 font-bold">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setIsUrlMode(!isUrlMode)}
          className="text-[11px] text-champagne hover:underline transition-all"
        >
          {isUrlMode ? 'Tải từ máy tính' : 'Dán đường dẫn URL'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {isUrlMode && (
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Dán đường dẫn ảnh HTTPS (VD: https://images.unsplash.com/...)..."
            className="w-full px-3 py-2 text-xs bg-noir-950 border border-white/10 rounded-sm text-white focus:border-champagne focus:outline-none font-mono"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-4 py-2 bg-champagne text-noir-950 text-xs font-semibold rounded-sm hover:bg-champagne/90 transition-all shrink-0"
          >
            Áp Dụng
          </button>
        </div>
      )}

      {/* Main Preview or Upload Box */}
      {value ? (
        <div className="relative group rounded-sm border border-white/10 bg-noir-950 overflow-hidden p-2 flex items-center gap-4">
          <div className="w-20 h-20 rounded-sm overflow-hidden bg-noir-900 border border-white/5 relative shrink-0">
            {!previewError ? (
              <img
                src={value}
                alt="Category Thumbnail Preview"
                onError={() => setPreviewError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-red-400 p-2 text-center">
                <AlertCircle className="w-5 h-5 mb-1" />
                <span className="text-[9px]">Lỗi ảnh</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-8">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã có hình ảnh đại diện</span>
            </div>
            <p className="text-[11px] text-platinum-dark font-mono truncate mt-1" title={value}>
              {value}
            </p>
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-platinum-light hover:text-champagne transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Thay ảnh khác</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 text-platinum-dark hover:text-red-400 transition-colors rounded-sm"
            title="Xóa ảnh này"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-champagne bg-champagne/5'
              : 'border-white/10 hover:border-white/20 bg-noir-950/60'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-4">
              <Loader2 className="w-6 h-6 animate-spin text-champagne" />
              <span className="text-xs text-platinum-light">Đang xử lý và tải ảnh lên máy chủ...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-champagne">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-white">
                  Nhấp để tải ảnh lên hoặc kéo thả tệp vào đây
                </p>
                <p className="text-[11px] text-platinum-dark mt-1">
                  Định dạng hợp lệ: JPG, PNG, WEBP (Tối đa {MAX_SIZE_MB}MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
