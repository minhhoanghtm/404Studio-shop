import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Download, Eye, EyeOff, GripVertical, Image as ImageIcon, Layers, Lock, LockKeyholeOpen, Plus, Redo2, RotateCcw, Save, Trash2, Type, Undo2 } from 'lucide-react';
import { adminAiApi, type AdminDesignProject } from '@/shared/api/adminAiApi';
import { bannersApi, categoriesApi, productsApi } from '@/shared/api';

type Layer = AdminDesignProject['layers'][number];
type Props = { design: AdminDesignProject | null; onChange: (design: AdminDesignProject) => void; onSave: (design: AdminDesignProject) => Promise<AdminDesignProject | void>; onAiEdit: (request: string, selectedLayerId?: string) => Promise<void> };
const TEXT_TYPES = new Set(['text', 'badge', 'button', 'logo']);
const uid = () => `layer_${crypto.randomUUID()}`;

const clone = <T,>(value: T): T => structuredClone(value);
const sorted = (layers: Layer[]) => [...layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
const isImage = (layer: Layer) => ['image', 'product', 'background'].includes(layer.type);
type LibrarySource = 'banner' | 'design';
type LibraryAsset = { id: string; source: LibrarySource; name: string; url: string; description?: string };

export const CreativeStudioEditor: React.FC<Props> = ({ design, onChange, onSave, onAiEdit }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const importRevisionRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const queuedSaveRef = useRef<AdminDesignProject | null>(null);
  const latestDesignRef = useRef<AdminDesignProject | null>(design);
  latestDesignRef.current = design;
  const dragRef = useRef<{ id: string; affectedIds: string[]; mode: 'move' | 'resize' | 'rotate'; startX: number; startY: number; originX: number; originY: number; originWidth?: number; originHeight?: number; originRotation?: number; before: AdminDesignProject } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<AdminDesignProject[]>([]);
  const [future, setFuture] = useState<AdminDesignProject[]>([]);
  const [zoom, setZoom] = useState(0.38);
  const [isSaving, setIsSaving] = useState(false);
  const [aiRequest, setAiRequest] = useState('');
  const [exportError, setExportError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [importError, setImportError] = useState('');
  const [pendingImport, setPendingImport] = useState<AdminDesignProject | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const [productsLoading, setProductsLoading] = useState(false);
  const [variantByProduct, setVariantByProduct] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [librarySource, setLibrarySource] = useState<'all' | LibrarySource>('all');
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  const [brandKitLoaded, setBrandKitLoaded] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewVersion, setPreviewVersion] = useState<number | null>(null);

  const handleFit = () => {
    const section = svgRef.current?.closest('section');
    if (section) {
      const availW = section.clientWidth - 48;
      const availH = section.clientHeight - 48;
      if (availW > 0 && availH > 0 && design) {
        const w = design.width || 1080;
        const h = design.height || 1350;
        const calculated = Math.min(availW / w, availH / h);
        setZoom(Number(Math.max(0.2, Math.min(1, calculated)).toFixed(2)));
        return;
      }
    }
    setZoom(0.38);
  };

  useEffect(() => {
    const timer = window.setTimeout(handleFit, 60);
    window.addEventListener('resize', handleFit);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', handleFit);
    };
  }, [design?._id, design?.width, design?.height]);

  useEffect(() => { const initial = design?.layers?.[0]?.id || null; setSelectedId(initial); setSelectedIds(initial ? [initial] : []); setHistory([]); setFuture([]); importRevisionRef.current += 1; setPendingImport(null); setImportError(''); }, [design?._id]);
  useEffect(() => {
    if (!design?._id) return;
    const timer = window.setTimeout(() => { void persist(design).catch(() => undefined); }, 1400);
    return () => window.clearTimeout(timer);
  }, [design?.updatedAt, design?.layers, design?.background]);

  const selected = useMemo(() => design?.layers.find((layer) => layer.id === selectedId) || null, [design, selectedId]);
  const selectedLayers = useMemo(() => design?.layers.filter((layer) => selectedIds.includes(layer.id)) || [], [design, selectedIds]);
  const previewSnapshot = useMemo(() => design?.versionHistory?.find((version) => version.version === previewVersion) || null, [design?.versionHistory, previewVersion]);
  const selectionBounds = useMemo(() => { if (selectedLayers.length < 2) return null; const left = Math.min(...selectedLayers.map((layer) => layer.x)); const top = Math.min(...selectedLayers.map((layer) => layer.y)); const right = Math.max(...selectedLayers.map((layer) => layer.x + layer.width)); const bottom = Math.max(...selectedLayers.map((layer) => layer.y + layer.height)); return { left, top, width: right - left, height: bottom - top }; }, [selectedLayers]);
  const groupMembers = (layer: Layer): string[] => { try { return layer.type === 'group' ? JSON.parse(layer.content || '[]').filter((id: unknown): id is string => typeof id === 'string') : []; } catch { return []; } };
  const parentGroups = (layerId: string) => (design?.layers || []).filter((candidate) => candidate.type === 'group' && groupMembers(candidate).includes(layerId));
  const isEffectivelyVisible = (layer: Layer) => layer.visible && parentGroups(layer.id).every((groupLayer) => groupLayer.visible);
  const isEffectivelyLocked = (layer: Layer) => layer.locked || parentGroups(layer.id).some((groupLayer) => groupLayer.locked);
  const effectiveOpacity = (layer: Layer) => parentGroups(layer.id).reduce((opacity, groupLayer) => opacity * (groupLayer.opacity ?? 1), layer.opacity ?? 1);
  const selectLayers = (id: string, additive = false) => { setSelectedIds((ids) => additive ? (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]) : [id]); setSelectedId(id); };
  const commit = (next: AdminDesignProject) => {
    if (!design) return;
    setHistory((items) => [...items.slice(-39), clone(design)]);
    setFuture([]);
    onChange(next);
  };
  const persist = async (document: AdminDesignProject) => { queuedSaveRef.current = document; if (saveInFlightRef.current) return; saveInFlightRef.current = true; setSaveError(''); try { while (queuedSaveRef.current) { const next = queuedSaveRef.current; queuedSaveRef.current = null; const saved = await onSave(next); const current = latestDesignRef.current; if (saved?.versionHistory && current && current._id === next._id) { const merged: AdminDesignProject = { _id: current._id, name: current.name, preset: current.preset, width: current.width, height: current.height, background: current.background, layers: current.layers, thumbnailUrl: current.thumbnailUrl, status: current.status, updatedAt: current.updatedAt, versionHistory: saved.versionHistory }; onChange(merged); } } } catch (error) { setSaveError('Không thể lưu thiết kế. Không có thay đổi nào bị xóa; vui lòng thử lại.'); throw error; } finally { saveInFlightRef.current = false; } };
  const patch = (updater: (value: AdminDesignProject) => AdminDesignProject) => { if (design) commit(updater(clone(design))); };
  const patchLayer = (id: string, changes: Partial<Layer>) => patch((value) => ({ ...value, layers: value.layers.map((layer) => layer.id === id ? { ...layer, ...changes } : layer) }));
  const patchStyles = (id: string, styles: Record<string, unknown>) => patch((value) => ({ ...value, layers: value.layers.map((layer) => layer.id === id ? { ...layer, styles: { ...layer.styles, ...styles } } : layer) }));
  const undo = () => { const previous = history.at(-1); if (!previous || !design) return; setFuture((items) => [clone(design), ...items]); setHistory((items) => items.slice(0, -1)); onChange(previous); };
  const redo = () => { const next = future[0]; if (!next || !design) return; setHistory((items) => [...items, clone(design)]); setFuture((items) => items.slice(1)); onChange(next); };
  const restoreVersion = (version: NonNullable<AdminDesignProject['versionHistory']>[number]) => { if (!design) return; commit({ ...clone(design), name: version.name, width: version.canvas.width, height: version.canvas.height, background: clone(version.background), layers: clone(version.layers) }); setPreviewVersion(null); };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName);
      if (editing || !design) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd' && selected) { event.preventDefault(); duplicate(); }
      if (event.key === 'Delete' && selected && !selected.locked) { event.preventDefault(); remove(); }
      if (selected && !selected.locked && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault(); const step = event.shiftKey ? 10 : 1; patchLayer(selected.id, { x: selected.x + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0), y: selected.y + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0) });
      }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [design, selected, history, future]);

  if (!design) {
    return (
      <div className="h-full flex-1 min-h-[360px] rounded-2xl border border-dashed border-[var(--border)] flex flex-col items-center justify-center p-8 text-center text-sm text-[var(--text-muted)] gap-3 bg-[var(--bg-card)]">
        <Layers className="w-10 h-10 text-[var(--accent)] opacity-60" />
        <p className="max-w-md">Chưa có Design Project. Hãy tạo poster từ Admin AI Copilot hoặc khởi tạo thiết kế mẫu để bắt đầu chỉnh sửa.</p>
        <button
          onClick={() => {
            const initialProject: AdminDesignProject = {
              _id: `proj_${Date.now()}`,
              name: 'Thiết Kế Mới · Atelier Vérité',
              preset: 'instagram_portrait',
              width: 1080,
              height: 1350,
              background: { type: 'gradient', value: '#1a1918', secondaryValue: '#0d0d0c' },
              layers: [
                {
                  id: 'layer_title',
                  type: 'text',
                  name: 'Tiêu đề chính',
                  x: 140,
                  y: 280,
                  width: 800,
                  height: 120,
                  rotation: 0,
                  opacity: 1,
                  zIndex: 1,
                  visible: true,
                  locked: false,
                  content: 'ATELIER VÉRITÉ',
                  styles: { fontFamily: 'Cinzel', fontSize: 64, fontWeight: '700', color: '#D4AF37', textAlign: 'center', letterSpacing: 6 }
                },
                {
                  id: 'layer_subtitle',
                  type: 'text',
                  name: 'Phụ đề',
                  x: 140,
                  y: 420,
                  width: 800,
                  height: 60,
                  rotation: 0,
                  opacity: 1,
                  zIndex: 2,
                  visible: true,
                  locked: false,
                  content: 'HAUTE COUTURE · NEW ARRIVAL 2026',
                  styles: { fontFamily: 'Inter', fontSize: 22, fontWeight: '500', color: '#EAE6DF', textAlign: 'center', letterSpacing: 4 }
                },
                {
                  id: 'layer_cta',
                  type: 'button',
                  name: 'Nút CTA',
                  x: 390,
                  y: 1100,
                  width: 300,
                  height: 70,
                  rotation: 0,
                  opacity: 1,
                  zIndex: 3,
                  visible: true,
                  locked: false,
                  content: 'KHÁM PHÁ NGAY',
                  styles: { backgroundColor: '#D4AF37', color: '#0d0d0c', fontSize: 18, fontWeight: '700', borderRadius: 35, textAlign: 'center' }
                }
              ]
            };
            onChange(initialProject);
          }}
          className="studio-button bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[#9E7B15] font-semibold px-4 py-2"
        >
          <Plus size={15} />
          Khởi tạo thiết kế Atelier mẫu
        </button>
      </div>
    );
  }
  const width = design.width || 1080; const height = design.height || 1350;
  const backgroundStyle = design.background?.type === 'gradient' ? `linear-gradient(135deg, ${design.background.value}, ${design.background.secondaryValue || '#111827'})` : design.background?.value || '#FFFFFF';
  const addLayer = (type: Layer['type']) => {
    const layer: Layer = { id: uid(), type, name: type === 'text' ? 'Văn bản mới' : type === 'shape' ? 'Hình khối mới' : 'Lớp mới', x: 100, y: 100, width: type === 'text' ? 420 : 220, height: type === 'text' ? 80 : 120, rotation: 0, opacity: 1, zIndex: design.layers.length + 1, visible: true, locked: false, content: type === 'text' ? 'Nhập nội dung' : '', styles: type === 'text' ? { fontFamily: 'Inter', fontSize: 42, fontWeight: '700', color: '#111111', textAlign: 'left' } : { backgroundColor: '#D4AF37', borderRadius: 12 } };
    patch((value) => ({ ...value, layers: [...value.layers, layer] })); selectLayers(layer.id);
  };
  const uploadAsset = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
      setUploadError('Chỉ hỗ trợ JPEG, PNG, WebP hoặc GIF tối đa 10 MB.');
      return;
    }
    setUploadingAsset(true); setUploadError('');
    try {
      const response = await adminAiApi.uploadImageReference(file);
      const uploaded = response?.data;
      if (!uploaded?.url) throw new Error('Máy chủ không trả về URL ảnh.');
      const layer: Layer = { id: uid(), type: 'image', name: uploaded.originalName || file.name, x: 120, y: 260, width: 840, height: 620, rotation: 0, opacity: 1, zIndex: design.layers.length + 1, visible: true, locked: false, content: uploaded.url, styles: { objectFit: 'contain', cropX: 50, cropY: 50, cropZoom: 1 } };
      patch((value) => ({ ...value, layers: [...value.layers, layer] })); selectLayers(layer.id);
    } catch (error: any) {
      setUploadError(error?.message || 'Tải ảnh thất bại. Vui lòng thử lại.');
    } finally { setUploadingAsset(false); }
  };
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await productsApi.getProducts({ search: productQuery.trim() || undefined, category: categoryId || undefined, limit: 12 });
      const payload = response?.data as any;
      setProducts(Array.isArray(payload) ? payload : (Array.isArray(payload?.products) ? payload.products : []));
    } finally { setProductsLoading(false); }
  };
  const loadCategories = async () => {
    const response = await categoriesApi.getCategories();
    setCategories(Array.isArray(response?.data) ? response.data : []);
  };
  const loadAssetLibrary = async () => {
    setLibraryLoading(true); setLibraryError('');
    const [bannersResult, designsResult, brandKitResult] = await Promise.allSettled([
      bannersApi.getAllBanners({ limit: 24 }),
      adminAiApi.getDesigns(),
      adminAiApi.getBrandKit(),
    ]);
    const assets: LibraryAsset[] = [];
    if (bannersResult.status === 'fulfilled') {
      const payload = bannersResult.value?.data as any;
      const banners = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);
      banners.filter((banner: any) => Boolean(banner?.imageUrl)).forEach((banner: any) => assets.push({
        id: `banner:${banner._id || banner.id}`, source: 'banner', name: banner.title || 'Banner chưa đặt tên', url: banner.imageUrl, description: banner.subtitle || 'Banner quản trị',
      }));
    }
    if (designsResult.status === 'fulfilled') {
      const payload = designsResult.value?.data as any;
      const designs = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);
      designs.filter((project: any) => Boolean(project?.thumbnailUrl)).forEach((project: any) => assets.push({
        id: `design:${project._id || project.id}`, source: 'design', name: project.name || 'Design Project chưa đặt tên', url: project.thumbnailUrl, description: 'Thumbnail Design Project',
      }));
    }
    setLibraryAssets(assets);
    setBrandKitLoaded(brandKitResult.status === 'fulfilled');
    if (bannersResult.status === 'rejected' && designsResult.status === 'rejected' && brandKitResult.status === 'rejected') setLibraryError('Không thể tải Asset Library. Phiên đăng nhập hoặc quyền truy cập có thể đã hết hạn.');
    else if (bannersResult.status === 'rejected' || designsResult.status === 'rejected') setLibraryError('Một số nguồn không thể tải theo quyền hiện tại; các asset được phép vẫn đang hiển thị.');
    setLibraryLoading(false);
  };
  const addLibraryAsset = (asset: LibraryAsset, replace = false) => {
    if (replace && selected && isImage(selected) && !selected.locked) {
      patchLayer(selected.id, { content: asset.url, name: `${selected.name} · ${asset.name}` });
      return;
    }
    const layer: Layer = { id: uid(), type: 'image', name: asset.name, x: 120, y: 260, width: 840, height: 620, rotation: 0, opacity: 1, zIndex: design.layers.length + 1, visible: true, locked: false, content: asset.url, styles: { objectFit: 'contain' } };
    patch((value) => ({ ...value, layers: [...value.layers, layer] })); selectLayers(layer.id);
  };
  const filteredLibraryAssets = libraryAssets.filter((asset) => (librarySource === 'all' || asset.source === librarySource) && `${asset.name} ${asset.description || ''}`.toLocaleLowerCase('vi-VN').includes(libraryQuery.trim().toLocaleLowerCase('vi-VN')));
  const toggleProduct = (id: string) => setSelectedProductIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  const addSelectedProducts = () => {
    const selectedProducts = products.filter((product) => selectedProductIds.includes(String(product._id || product.id)));
    patch((value) => {
      const layers = [...value.layers];
      selectedProducts.forEach((product, index) => {
        const variant = (product.variants || []).find((item: any) => String(item._id || item.id) === variantByProduct[String(product._id || product.id)]) || (product.variants || []).find((item: any) => item?.is_active !== false);
        const image = variant?.image_url || product?.displayProduct?.[0] || product?.image_url || '';
        const price = Number(variant?.price ?? product?.new_price ?? 0); const oldPrice = Number(product?.old_price ?? 0); const base = layers.length + 1; const offset = index * 36;
        layers.push(
          { id: uid(), type: 'product', name: `${product.name} · ảnh`, x: 180 + offset, y: 350 + offset, width: 720, height: 520, zIndex: base, visible: true, locked: false, content: image, styles: { objectFit: 'contain' } },
          { id: uid(), type: 'text', name: `${product.name} · tên`, x: 120, y: 900 + offset, width: 840, height: 70, zIndex: base + 1, visible: true, locked: false, content: product.name, styles: { fontFamily: 'Inter', fontSize: 42, fontWeight: '700', color: '#111111', textAlign: 'center' } },
          { id: uid(), type: 'text', name: `${product.name} · giá`, x: 120, y: 980 + offset, width: 840, height: 60, zIndex: base + 2, visible: true, locked: false, content: `${price.toLocaleString('vi-VN')} ₫${oldPrice > price ? `  ${oldPrice.toLocaleString('vi-VN')} ₫` : ''}`, styles: { fontFamily: 'Inter', fontSize: 32, fontWeight: '700', color: '#A56F1B', textAlign: 'center' } }
        );
      });
      return { ...value, layers: layers.map((layer) => ({ ...layer, rotation: layer.rotation ?? 0, opacity: layer.opacity ?? 1 })) };
    });
    setSelectedProductIds([]);
  };
  const addProductAsset = (product: any, variantId?: string) => {
    const variant = Array.isArray(product.variants) ? product.variants.find((item: any) => String(item?._id || item?.id) === variantId) || product.variants.find((item: any) => item?.is_active !== false) : null;
    const image = variant?.image_url || product?.displayProduct?.[0] || product?.image_url || '';
    const price = Number(variant?.price ?? product?.new_price ?? 0);
    const oldPrice = Number(product?.old_price ?? 0);
    const base = design.layers.length + 1;
    const imageLayer: Layer = { id: uid(), type: 'product', name: `${product.name} · ảnh`, x: 180, y: 350, width: 720, height: 520, zIndex: base, visible: true, locked: false, content: image, styles: { objectFit: 'contain' } };
    const nameLayer: Layer = { id: uid(), type: 'text', name: `${product.name} · tên`, x: 120, y: 900, width: 840, height: 70, zIndex: base + 1, visible: true, locked: false, content: product.name, styles: { fontFamily: 'Inter', fontSize: 42, fontWeight: '700', color: '#111111', textAlign: 'center' } };
    const priceLayer: Layer = { id: uid(), type: 'text', name: `${product.name} · giá`, x: 120, y: 980, width: 840, height: 60, zIndex: base + 2, visible: true, locked: false, content: `${price.toLocaleString('vi-VN')} ₫${oldPrice > price ? `  ${oldPrice.toLocaleString('vi-VN')} ₫` : ''}`, styles: { fontFamily: 'Inter', fontSize: 32, fontWeight: '700', color: '#A56F1B', textAlign: 'center' } };
    patch((value) => ({ ...value, layers: [...value.layers, ...[imageLayer, nameLayer, priceLayer].map((layer) => ({ ...layer, rotation: 0, opacity: 1 }))] })); selectLayers(imageLayer.id);
  };
  const remove = () => { const removable = selectedLayers.filter((layer) => !isEffectivelyLocked(layer)).flatMap((layer) => layer.type === 'group' ? [layer.id, ...groupMembers(layer)] : [layer.id]); if (!removable.length) return; patch((value) => ({ ...value, layers: value.layers.filter((layer) => !removable.includes(layer.id)) })); setSelectedId(null); setSelectedIds([]); };
  const duplicate = () => {
    const selectedGroups = selectedLayers.filter((layer) => layer.type === 'group' && !isEffectivelyLocked(layer));
    const groupedMemberIds = new Set(selectedGroups.flatMap(groupMembers));
    const independentLayers = selectedLayers.filter((layer) => layer.type !== 'group' && !isEffectivelyLocked(layer) && !groupedMemberIds.has(layer.id));
    if (!selectedGroups.length && !independentLayers.length) return;
    const copies: Layer[] = [];
    const roots: Layer[] = [];
    let nextZ = Math.max(0, ...design.layers.map((layer) => layer.zIndex || 0)) + 1;
    independentLayers.forEach((layer) => {
      const copy = { ...clone(layer), id: uid(), name: `${layer.name} (bản sao)`, x: layer.x + 24, y: layer.y + 24, zIndex: nextZ++ };
      copies.push(copy); roots.push(copy);
    });
    selectedGroups.forEach((groupLayer) => {
      const idMap = new Map<string, string>();
      const memberCopies = groupMembers(groupLayer).map((memberId) => design.layers.find((layer) => layer.id === memberId)).filter((layer): layer is Layer => Boolean(layer)).map((layer) => {
        const id = uid(); idMap.set(layer.id, id);
        const copy = { ...clone(layer), id, name: `${layer.name} (bản sao)`, x: layer.x + 24, y: layer.y + 24, zIndex: nextZ++ };
        copies.push(copy); return copy;
      });
      if (!memberCopies.length) return;
      const groupCopy = { ...clone(groupLayer), id: uid(), name: `${groupLayer.name} (bản sao)`, x: groupLayer.x + 24, y: groupLayer.y + 24, zIndex: nextZ++, content: JSON.stringify(groupMembers(groupLayer).map((memberId) => idMap.get(memberId)).filter(Boolean)) };
      copies.push(groupCopy); roots.push(groupCopy);
    });
    patch((value) => ({ ...value, layers: [...value.layers, ...copies] }));
    setSelectedId(roots[0]?.id || null); setSelectedIds(roots.map((layer) => layer.id));
  };
  const group = () => { const members = selectedLayers.filter((layer) => !isEffectivelyLocked(layer) && layer.type !== 'group'); if (members.length < 2) return; const left = Math.min(...members.map((layer) => layer.x)); const top = Math.min(...members.map((layer) => layer.y)); const right = Math.max(...members.map((layer) => layer.x + layer.width)); const bottom = Math.max(...members.map((layer) => layer.y + layer.height)); const layer: Layer = { id: uid(), type: 'group', name: `Nhóm (${members.length})`, x: left, y: top, width: right - left, height: bottom - top, rotation: 0, opacity: 1, zIndex: Math.max(...members.map((item) => item.zIndex || 0)) + 1, visible: true, locked: false, content: JSON.stringify(members.map((item) => item.id)), styles: {} }; patch((value) => ({ ...value, layers: [...value.layers, layer] })); setSelectedId(layer.id); setSelectedIds([layer.id]); };
  const ungroup = () => { const groups = selectedLayers.filter((layer) => layer.type === 'group' && !layer.locked); if (!groups.length) return; const members = groups.flatMap(groupMembers); patch((value) => ({ ...value, layers: value.layers.filter((layer) => !groups.some((groupLayer) => groupLayer.id === layer.id)) })); setSelectedId(members[0] || null); setSelectedIds(members); };
  const boundsFor = (layer: Layer) => {
    const radians = (layer.rotation || 0) * Math.PI / 180;
    const centerX = layer.x + layer.width / 2; const centerY = layer.y + layer.height / 2;
    const corners = [[layer.x, layer.y], [layer.x + layer.width, layer.y], [layer.x + layer.width, layer.y + layer.height], [layer.x, layer.y + layer.height]].map(([x, y]) => ({ x: centerX + (x - centerX) * Math.cos(radians) - (y - centerY) * Math.sin(radians), y: centerY + (x - centerX) * Math.sin(radians) + (y - centerY) * Math.cos(radians) }));
    const left = Math.min(...corners.map((point) => point.x)); const top = Math.min(...corners.map((point) => point.y)); const right = Math.max(...corners.map((point) => point.x)); const bottom = Math.max(...corners.map((point) => point.y));
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  };
  const align = (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'distributeH' | 'distributeV' | 'canvasCenter') => {
    const selectedGroups = selectedLayers.filter((layer) => layer.type === 'group');
    const units = selectedLayers.filter((layer) => !isEffectivelyLocked(layer) && isEffectivelyVisible(layer)).filter((layer) => layer.type === 'group' || !selectedGroups.some((groupLayer) => groupMembers(groupLayer).includes(layer.id))).map((layer) => ({ layer, bounds: boundsFor(layer), affectedIds: layer.type === 'group' ? [layer.id, ...groupMembers(layer)] : [layer.id] }));
    if (units.length < (mode.startsWith('distribute') ? 3 : 1)) return;
    const left = Math.min(...units.map((unit) => unit.bounds.left)); const top = Math.min(...units.map((unit) => unit.bounds.top)); const right = Math.max(...units.map((unit) => unit.bounds.right)); const bottom = Math.max(...units.map((unit) => unit.bounds.bottom));
    const ordered = [...units].sort((a, b) => mode === 'distributeV' ? a.bounds.top - b.bounds.top : a.bounds.left - b.bounds.left);
    const offsets = new Map<string, { x: number; y: number }>();
    ordered.forEach((unit, index) => {
      let targetX = unit.bounds.left; let targetY = unit.bounds.top;
      if (mode === 'left') targetX = left;
      if (mode === 'center') targetX = (left + right - unit.bounds.width) / 2;
      if (mode === 'right') targetX = right - unit.bounds.width;
      if (mode === 'top') targetY = top;
      if (mode === 'middle') targetY = (top + bottom - unit.bounds.height) / 2;
      if (mode === 'bottom') targetY = bottom - unit.bounds.height;
      if (mode === 'canvasCenter') { targetX = (width - unit.bounds.width) / 2; targetY = (height - unit.bounds.height) / 2; }
      if (mode === 'distributeH') { const gap = (right - left - ordered.reduce((sum, item) => sum + item.bounds.width, 0)) / (ordered.length - 1); targetX = left + ordered.slice(0, index).reduce((sum, item) => sum + item.bounds.width + gap, 0); }
      if (mode === 'distributeV') { const gap = (bottom - top - ordered.reduce((sum, item) => sum + item.bounds.height, 0)) / (ordered.length - 1); targetY = top + ordered.slice(0, index).reduce((sum, item) => sum + item.bounds.height + gap, 0); }
      unit.affectedIds.forEach((id) => offsets.set(id, { x: targetX - unit.bounds.left, y: targetY - unit.bounds.top }));
    });
    patch((value) => ({ ...value, layers: value.layers.map((layer) => { const offset = offsets.get(layer.id); return offset ? { ...layer, x: Math.round(layer.x + offset.x), y: Math.round(layer.y + offset.y) } : layer; }) }));
  };
  const reorder = (id: string, direction: number) => patch((value) => {
    const target = value.layers.find((layer) => layer.id === id); if (!target || isEffectivelyLocked(target)) return value;
    const affectedIds = new Set(target.type === 'group' ? groupMembers(target) : [id]);
    const renderable = sorted(value.layers.filter((layer) => layer.type !== 'group'));
    const moving = renderable.filter((layer) => affectedIds.has(layer.id)); if (!moving.length) return value;
    const remaining = renderable.filter((layer) => !affectedIds.has(layer.id));
    const firstIndex = renderable.findIndex((layer) => affectedIds.has(layer.id));
    const beforeCount = renderable.slice(0, firstIndex).filter((layer) => !affectedIds.has(layer.id)).length;
    const insertionIndex = Math.max(0, Math.min(remaining.length, beforeCount + (direction > 0 ? 1 : -1)));
    const reordered = [...remaining.slice(0, insertionIndex), ...moving, ...remaining.slice(insertionIndex)];
    const zIndexById = new Map(reordered.map((layer, index) => [layer.id, index + 1]));
    const groupZIndex = Math.max(...moving.map((layer) => zIndexById.get(layer.id) || 1)) + 0.1;
    return { ...value, layers: value.layers.map((layer) => layer.id === id && target.type === 'group' ? { ...layer, zIndex: groupZIndex } : zIndexById.has(layer.id) ? { ...layer, zIndex: zIndexById.get(layer.id)! } : layer) };
  });
  const startTransform = (event: React.PointerEvent<SVGElement>, layer: Layer, mode: 'move' | 'resize' | 'rotate') => { if (isEffectivelyLocked(layer)) return; event.stopPropagation(); const additive = event.ctrlKey || event.metaKey || event.shiftKey; if (additive && mode === 'move') { selectLayers(layer.id, true); return; } const ids = selectedIds.includes(layer.id) && selectedIds.length ? selectedIds : [layer.id]; if (!selectedIds.includes(layer.id) || !selectedIds.length) selectLayers(layer.id, false); const affectedIds = [...new Set(ids.flatMap((id) => { const item = design.layers.find((candidate) => candidate.id === id); return item?.type === 'group' ? [id, ...groupMembers(item)] : [id]; }))]; const box = svgRef.current?.getBoundingClientRect(); if (!box) return; dragRef.current = { id: layer.id, affectedIds, mode, startX: (event.clientX - box.left) * width / box.width, startY: (event.clientY - box.top) * height / box.height, originX: layer.x, originY: layer.y, originWidth: layer.width, originHeight: layer.height, originRotation: layer.rotation || 0, before: clone(design) }; event.currentTarget.setPointerCapture(event.pointerId); };
  const pointerDown = (event: React.PointerEvent<SVGGElement>, layer: Layer) => startTransform(event, layer, 'move');
  const pointerMove = (event: React.PointerEvent<SVGSVGElement>) => { const drag = dragRef.current; const box = svgRef.current?.getBoundingClientRect(); if (!drag || !box) return; const pointerX = (event.clientX - box.left) * width / box.width; const pointerY = (event.clientY - box.top) * height / box.height; const dx = pointerX - drag.startX; const dy = pointerY - drag.startY; const layer = design.layers.find((item) => item.id === drag.id); if (!layer) return; if (drag.mode === 'resize') { onChange({ ...design, layers: design.layers.map((item) => item.id === drag.id ? { ...item, width: Math.max(32, Math.round((drag.originWidth || item.width) + dx)), height: Math.max(32, Math.round((drag.originHeight || item.height) + dy)) } : item) }); return; } if (drag.mode === 'rotate') { const centerX = drag.originX + (drag.originWidth || layer.width) / 2; const centerY = drag.originY + (drag.originHeight || layer.height) / 2; const startAngle = Math.atan2(drag.startY - centerY, drag.startX - centerX); const currentAngle = Math.atan2(pointerY - centerY, pointerX - centerX); const rotation = Math.round((drag.originRotation || 0) + ((currentAngle - startAngle) * 180 / Math.PI)); const delta = rotation - (drag.originRotation || 0); onChange({ ...design, layers: design.layers.map((item) => { if (item.id === drag.id) return { ...item, rotation }; if (layer.type === 'group' && drag.affectedIds.includes(item.id)) { const radians = delta * Math.PI / 180; const original = drag.before.layers.find((candidate) => candidate.id === item.id) || item; const cx = drag.originX + (drag.originWidth || layer.width) / 2; const cy = drag.originY + (drag.originHeight || layer.height) / 2; const ox = original.x + original.width / 2 - cx; const oy = original.y + original.height / 2 - cy; return { ...item, x: Math.round(cx + ox * Math.cos(radians) - oy * Math.sin(radians) - original.width / 2), y: Math.round(cy + ox * Math.sin(radians) + oy * Math.cos(radians) - original.height / 2), rotation: (original.rotation || 0) + delta }; } return item; }) }); return; } const rawX = drag.originX + dx; const rawY = drag.originY + dy; const snapX = Math.abs(rawX + layer.width / 2 - width / 2) < 12 ? width / 2 - layer.width / 2 : rawX; const snapY = Math.abs(rawY + layer.height / 2 - height / 2) < 12 ? height / 2 - layer.height / 2 : rawY; const moveX = snapX - drag.originX; const moveY = snapY - drag.originY; onChange({ ...design, layers: design.layers.map((item) => { if (!drag.affectedIds.includes(item.id)) return item; const original = drag.before.layers.find((candidate) => candidate.id === item.id) || item; return { ...item, x: Math.round(original.x + moveX), y: Math.round(original.y + moveY) }; }) }); };
  const pointerUp = () => { if (dragRef.current) { const before = dragRef.current.before; setHistory((items) => [...items.slice(-39), before]); setFuture([]); dragRef.current = null; } };
  const renderLayer = (layer: Layer) => {
    if (!isEffectivelyVisible(layer)) return null; const styles = layer.styles || {}; const selectedLayer = layer.id === selectedId; const textAnchor = styles.textAlign === 'center' ? 'middle' : styles.textAlign === 'right' ? 'end' : 'start'; const textX = styles.textAlign === 'center' ? layer.width / 2 : styles.textAlign === 'right' ? layer.width : 0;
    const cropZoom = Math.max(1, Number(styles.cropZoom || 1)); const cropWidth = layer.width * cropZoom; const cropHeight = layer.height * cropZoom; const cropX = Math.min(100, Math.max(0, Number(styles.cropX ?? 50))); const cropY = Math.min(100, Math.max(0, Number(styles.cropY ?? 50))); const imageX = -((cropWidth - layer.width) * cropX / 100); const imageY = -((cropHeight - layer.height) * cropY / 100);
    return <g key={layer.id} transform={`translate(${layer.x} ${layer.y}) rotate(${layer.rotation || 0} ${layer.width / 2} ${layer.height / 2})`} opacity={effectiveOpacity(layer)} onPointerDown={(event) => pointerDown(event, layer)} className={isEffectivelyLocked(layer) ? 'cursor-not-allowed' : 'cursor-move'}>
      {layer.type === 'group' && <rect data-group-hitbox="true" width={layer.width} height={layer.height} fill="transparent" pointerEvents="all" />}
      {['shape', 'badge', 'button', 'logo'].includes(layer.type) && <rect width={layer.width} height={layer.height} rx={Number(styles.borderRadius || (layer.type === 'button' ? 28 : 0))} fill={String(styles.backgroundColor || (layer.type === 'shape' ? '#D4AF37' : '#111111'))} stroke={String(styles.borderColor || 'transparent')} strokeWidth={Number(styles.borderWidth || 0)} />}
      {isImage(layer) && layer.content && <><clipPath id={`crop-${layer.id}`}><rect width={layer.width} height={layer.height} /></clipPath><g clipPath={`url(#crop-${layer.id})`}><image href={layer.content} x={imageX} y={imageY} width={cropWidth} height={cropHeight} preserveAspectRatio={styles.objectFit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'} style={{ filter: `brightness(${styles.brightness || 100}%) contrast(${styles.contrast || 100}%) saturate(${styles.saturation || 100}%)` }} /></g></>}
      {TEXT_TYPES.has(layer.type) && <text x={textX} y={layer.height / 2} dominantBaseline="middle" textAnchor={textAnchor as any} fill={String(styles.color || '#111111')} fontFamily={String(styles.fontFamily || 'Inter')} fontSize={Number(styles.fontSize || 24)} fontWeight={String(styles.fontWeight || 'normal')} letterSpacing={Number(styles.letterSpacing || 0)} style={{ textTransform: styles.textTransform as any }}>{layer.content}</text>}
      {selectedLayer && <><rect data-selection="true" x={-7} y={-7} width={layer.width + 14} height={layer.height + 14} fill="none" stroke="#B9922D" strokeWidth={4} vectorEffect="non-scaling-stroke" pointerEvents="none" />{!isEffectivelyLocked(layer) && <g data-transform-handles="true"><line x1={layer.width / 2} y1={0} x2={layer.width / 2} y2={-30} stroke="#B9922D" strokeWidth={3} pointerEvents="none" /><circle data-handle="rotate" cx={layer.width / 2} cy={-36} r={10} fill="#FFFFFF" stroke="#B9922D" strokeWidth={4} onPointerDown={(event) => startTransform(event, layer, 'rotate')} /><circle data-handle="resize" cx={layer.width} cy={layer.height} r={10} fill="#FFFFFF" stroke="#B9922D" strokeWidth={4} onPointerDown={(event) => startTransform(event, layer, 'resize')} /></g>}</>}
    </g>;
  };
  const exportImage = async (format: 'png' | 'jpeg' | 'webp') => {
    setExportError(''); const svg = svgRef.current; if (!svg) return;
    try {
      await document.fonts?.ready;
      const copy = svg.cloneNode(true) as SVGSVGElement;
      copy.querySelectorAll('[data-selection="true"], [data-transform-handles="true"], [data-multi-selection="true"]').forEach((node) => node.remove());
      await Promise.all(Array.from(copy.querySelectorAll('image')).map(async (node) => {
        const href = node.getAttribute('href');
        if (!href || /^data:image\/(png|jpeg|webp|gif);base64,/i.test(href)) return;
        const response = await fetch(href, { mode: 'cors', credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error('Image unavailable');
        if (Number(response.headers.get('content-length') || 0) > 10 * 1024 * 1024) throw new Error('Image too large');
        const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
        if (!/^image\/(png|jpeg|webp|gif)$/.test(contentType) || !response.body) throw new Error('Unsupported image type');
        const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let total = 0;
        try { while (true) { const { value, done } = await reader.read(); if (done) break; total += value.byteLength; if (total > 10 * 1024 * 1024) { await reader.cancel(); throw new Error('Image too large'); } chunks.push(value); } } finally { reader.releaseLock(); }
        const imageBlob = new Blob(chunks as BlobPart[], { type: contentType });
        const header = new Uint8Array(await imageBlob.slice(0, 12).arrayBuffer());
        const mime = imageBlob.type.toLowerCase();
        const signatureValid = mime === 'image/png' ? [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => header[index] === value) : mime === 'image/jpeg' ? header[0] === 255 && header[1] === 216 && header[2] === 255 : mime === 'image/gif' ? String.fromCharCode(...header.slice(0, 6)) === 'GIF87a' || String.fromCharCode(...header.slice(0, 6)) === 'GIF89a' : String.fromCharCode(...header.slice(0, 4)) === 'RIFF' && String.fromCharCode(...header.slice(8, 12)) === 'WEBP';
        if (!signatureValid) throw new Error('Image signature mismatch');
        const embedded = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Image read failed')); reader.onerror = () => reject(reader.error); reader.readAsDataURL(imageBlob); });
        node.setAttribute('href', embedded);
      }));
      const source = new XMLSerializer().serializeToString(copy); const blob = new Blob([source], { type: 'image/svg+xml' }); const url = URL.createObjectURL(blob); const image = new Image(); image.onload = () => { try { const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas unavailable'); context.drawImage(image, 0, 0, width, height); const a = document.createElement('a'); a.href = canvas.toDataURL(`image/${format}`, 0.92); a.download = `${design.name || 'atelier-design'}.${format === 'jpeg' ? 'jpg' : format}`; a.click(); } catch { setExportError('Xuất ảnh thất bại. Vui lòng kiểm tra asset và thử lại.'); } finally { URL.revokeObjectURL(url); } }; image.onerror = () => { URL.revokeObjectURL(url); setExportError('Không thể xuất vì một ảnh ngoài miền không cho phép CORS. Hãy thay asset đó bằng ảnh đã tải lên hệ thống.'); }; image.src = url;
    } catch { setExportError('Không thể xuất vì một ảnh không khả dụng hoặc không cho phép CORS. Hãy kiểm tra asset và thử lại.'); }
  };
  const download = (blob: Blob, extension: string) => {
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${design.name || 'atelier-design'}.${extension}`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const exportSvg = () => {
    const svg = svgRef.current; if (!svg) return;
    const copy = svg.cloneNode(true) as SVGSVGElement;
    copy.querySelectorAll('[data-selection="true"], [data-transform-handles="true"], [data-multi-selection="true"]').forEach((node) => node.remove());
    download(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml;charset=utf-8' }), 'svg');
  };
  const exportJson = () => download(new Blob([JSON.stringify({ schemaVersion: (design as any).schemaVersion || 2, canvas: { width, height }, project: design }, null, 2)], { type: 'application/json;charset=utf-8' }), 'json');
  const prepareImport = (raw: unknown): AdminDesignProject => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('JSON thiết kế không hợp lệ.');
    const envelope = raw as Record<string, unknown>;
    if (envelope.schemaVersion !== undefined && envelope.schemaVersion !== 2) throw new Error('Chỉ hỗ trợ schemaVersion 2.');
    const candidate = (envelope.project && typeof envelope.project === 'object' ? envelope.project : envelope) as Record<string, unknown>;
    if (candidate.schemaVersion !== undefined && candidate.schemaVersion !== 2) throw new Error('Chỉ hỗ trợ schemaVersion 2.');
    const nextWidth = candidate.width ?? (candidate.canvas as Record<string, unknown> | undefined)?.width;
    const nextHeight = candidate.height ?? (candidate.canvas as Record<string, unknown> | undefined)?.height;
    if (typeof candidate.name !== 'string' || !candidate.name.trim() || typeof nextWidth !== 'number' || !Number.isFinite(nextWidth) || nextWidth < 32 || nextWidth > 10000 || typeof nextHeight !== 'number' || !Number.isFinite(nextHeight) || nextHeight < 32 || nextHeight > 10000) throw new Error('Canvas hoặc tên thiết kế không hợp lệ.');
    if (!candidate.background || typeof candidate.background !== 'object' || Array.isArray(candidate.background) || !['color', 'gradient', 'image', 'texture'].includes((candidate.background as Record<string, unknown>).type as string)) throw new Error('Background không hợp lệ.');
    const importedBackground = candidate.background as Record<string, unknown>;
    if (typeof importedBackground.value !== 'string' || (importedBackground.type === 'image' && importedBackground.value && !/^(https?:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/i.test(importedBackground.value))) throw new Error('Nguồn ảnh nền không an toàn.');
    if (!Array.isArray(candidate.layers) || candidate.layers.length > 200) throw new Error('JSON phải chứa tối đa 200 layer.');
    const allowedTypes = new Set(['text', 'image', 'background', 'shape', 'icon', 'logo', 'badge', 'button', 'group', 'product', 'gradient', 'qr']);
    const ids = new Set<string>();
    candidate.layers.forEach((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Layer không hợp lệ.');
      const layer = item as Record<string, unknown>;
      if (typeof layer.id !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(layer.id) || ids.has(layer.id) || !allowedTypes.has(layer.type as string)) throw new Error('Layer ID hoặc type không hợp lệ.');
      ids.add(layer.id);
      for (const key of ['x', 'y', 'width', 'height', 'rotation', 'opacity', 'zIndex']) if (typeof layer[key] !== 'number' || !Number.isFinite(layer[key] as number)) throw new Error(`Geometry layer ${layer.id} không hợp lệ.`);
      if ((layer.width as number) < 1 || (layer.height as number) < 1 || (layer.opacity as number) < 0 || (layer.opacity as number) > 1 || typeof layer.name !== 'string' || typeof layer.content !== 'string' || typeof layer.visible !== 'boolean' || typeof layer.locked !== 'boolean') throw new Error(`Thuộc tính layer ${layer.id} không hợp lệ.`);
      if (['text', 'badge', 'button', 'logo'].includes(layer.type as string) && /<\s*\/?\s*(?:script|iframe|object|embed|svg|math|img|style|link|meta)\b/i.test(layer.content as string)) throw new Error(`Nội dung layer ${layer.id} không an toàn.`);
      if (['image', 'product', 'logo', 'background'].includes(layer.type as string) && layer.content && !/^(https?:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/i.test(layer.content as string)) throw new Error(`Nguồn asset của ${layer.id} không an toàn.`);
      if (layer.styles !== undefined && (!layer.styles || typeof layer.styles !== 'object' || Array.isArray(layer.styles) || Object.keys(layer.styles as Record<string, unknown>).some((key) => ['__proto__', 'constructor', 'prototype'].includes(key)))) throw new Error(`Styles layer ${layer.id} không an toàn.`);
      if (layer.styles) {
        const styles = layer.styles as Record<string, unknown>;
        if (Object.values(styles).some((value) => (value !== null && typeof value === 'object') || (typeof value === 'string' && /(?:url\s*\(|expression\s*\(|javascript\s*:|[<>])/i.test(value)))) throw new Error(`Styles layer ${layer.id} không an toàn.`);
        for (const [key, min, max] of [['cropX', 0, 100], ['cropY', 0, 100], ['cropZoom', 1, 3]] as const) if (styles[key] !== undefined && (typeof styles[key] !== 'number' || !Number.isFinite(styles[key]) || (styles[key] as number) < min || (styles[key] as number) > max)) throw new Error(`Crop layer ${layer.id} không hợp lệ.`);
        if (styles.fontSize !== undefined && (typeof styles.fontSize !== 'number' || !Number.isFinite(styles.fontSize) || styles.fontSize < 1 || styles.fontSize > 10000)) throw new Error(`Cỡ chữ layer ${layer.id} không hợp lệ.`);
      }
    });
    candidate.layers.filter((item) => (item as Record<string, unknown>).type === 'group').forEach((item) => {
      const layer = item as Record<string, unknown>; let members: unknown;
      try { members = JSON.parse(layer.content as string); } catch { throw new Error(`Group ${layer.id} không có members hợp lệ.`); }
      if (!Array.isArray(members) || members.length < 2 || new Set(members).size !== members.length || members.some((id) => typeof id !== 'string' || !ids.has(id) || id === layer.id || (candidate.layers as Record<string, unknown>[]).find((other) => other.id === id)?.type === 'group')) throw new Error(`Group ${layer.id} chứa reference không hợp lệ.`);
    });
    return { ...clone(design), name: candidate.name, preset: typeof candidate.preset === 'string' ? candidate.preset : design.preset, width: nextWidth, height: nextHeight, background: clone(candidate.background as AdminDesignProject['background']), layers: clone(candidate.layers as Layer[]) };
  };
  const importJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    const revision = ++importRevisionRef.current;
    setImportError(''); setPendingImport(null);
    if (file.size > 1024 * 1024) { setImportError('JSON import tối đa 1 MB.'); return; }
    let parsed: unknown;
    try { parsed = JSON.parse(await file.text()); } catch { if (revision === importRevisionRef.current) setImportError('Không thể đọc JSON import.'); return; }
    if (revision !== importRevisionRef.current) return;
    try {
      const candidate = prepareImport(parsed);
      const { name, preset, width, height, background, layers } = candidate;
      await adminAiApi.validateDesign({ name, preset, width, height, background, layers });
      if (revision === importRevisionRef.current) setPendingImport(candidate);
    } catch (error) { if (revision === importRevisionRef.current) setImportError(error instanceof Error ? error.message : 'JSON import không hợp lệ.'); }
  };

  return (
    <div className="h-full flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
      {/* 1. Editor Top Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs shadow-xs">
        <input
          value={design.name}
          onChange={(event) => commit({ ...design, name: event.target.value })}
          className="min-w-44 flex-1 bg-transparent font-semibold outline-none text-[var(--text)]"
          aria-label="Tên thiết kế"
        />
        <span className="text-[var(--text-muted)] font-mono text-[11px]">{width} × {height}</span>
        <div className="h-4 w-px bg-[var(--border)] mx-1" />
        <button onClick={undo} disabled={!history.length} title="Undo (Ctrl+Z)" className="studio-button"><Undo2 size={14} /></button>
        <button onClick={redo} disabled={!future.length} title="Redo (Ctrl+Shift+Z)" className="studio-button"><Redo2 size={14} /></button>
        <div className="h-4 w-px bg-[var(--border)] mx-1" />
        <button onClick={handleFit} className="studio-button" title="Fit màn hình">Fit</button>
        <select value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="studio-select text-xs">
          <option value={0.25}>25%</option>
          <option value={0.32}>32%</option>
          <option value={0.38}>38%</option>
          <option value={0.48}>48%</option>
          <option value={0.65}>65%</option>
          <option value={0.82}>82%</option>
          <option value={1}>100%</option>
        </select>
        <div className="h-4 w-px bg-[var(--border)] mx-1" />
        <button
          onClick={async () => { setIsSaving(true); try { await persist(design); } catch { /* Error is shown inline. */ } finally { setIsSaving(false); } }}
          className="studio-button bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[#9E7B15] font-semibold"
        >
          <Save size={14} />{isSaving ? 'Đang lưu' : 'Lưu'}
        </button>
        <button onClick={() => exportImage('png')} className="studio-button"><Download size={14} />PNG</button>
        <button onClick={() => exportImage('jpeg')} className="studio-button">JPG</button>
        <button onClick={() => exportImage('webp')} className="studio-button">WebP</button>
        <button onClick={exportSvg} className="studio-button">SVG</button>
        <button onClick={exportJson} className="studio-button">JSON</button>
        <input ref={importInputRef} type="file" accept="application/json,.json" onChange={importJson} className="hidden" aria-label="Chọn JSON để nhập" />
        <button onClick={() => importInputRef.current?.click()} className="studio-button">Nhập JSON</button>
      </div>

      {exportError && (
        <p className="shrink-0 text-xs text-amber-600 dark:text-amber-300 px-1">{exportError}</p>
      )}
      {saveError && <p role="alert" className="shrink-0 text-xs text-amber-600 dark:text-amber-300 px-1">{saveError}</p>}
      {importError && <p role="alert" className="shrink-0 text-xs text-amber-600 dark:text-amber-300 px-1">{importError}</p>}
      {pendingImport && <div role="status" className="shrink-0 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2 text-xs"><span>Sẵn sàng nhập “{pendingImport.name}” · {pendingImport.width} × {pendingImport.height} · {pendingImport.layers.length} layer. Thiết kế hiện tại chưa thay đổi.</span><button onClick={() => { commit(pendingImport); setPendingImport(null); }} className="studio-button">Áp dụng JSON</button><button onClick={() => setPendingImport(null)} className="studio-button">Hủy</button></div>}

      {/* 2. 3-Column Workspace Grid */}
      <div className="flex-1 min-h-0 grid gap-2.5 grid-cols-1 lg:grid-cols-[190px_minmax(0,1fr)_310px] xl:grid-cols-[210px_minmax(0,1fr)_330px] overflow-hidden">
        {/* Left Aside: Toolbox */}
        <aside className="h-full min-h-0 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 space-y-2 text-xs overflow-y-auto admin-content-scrollbar flex flex-col justify-start">
          <p className="studio-label">Thêm vào thiết kế</p>
          <button onClick={() => addLayer('text')} className="studio-tool"><Type size={14} />Văn bản</button>
          <button onClick={() => addLayer('shape')} className="studio-tool"><Plus size={14} />Hình khối</button>
          <button onClick={() => addLayer('badge')} className="studio-tool"><Plus size={14} />Badge</button>
          <button onClick={() => addLayer('button')} className="studio-tool"><Plus size={14} />CTA</button>
          <button onClick={() => addLayer('image')} className="studio-tool"><ImageIcon size={14} />Ảnh / asset</button>
          <input ref={uploadInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadAsset} className="hidden" aria-label="Chọn ảnh để tải lên" />
          <button onClick={() => uploadInputRef.current?.click()} disabled={uploadingAsset} className="studio-tool" aria-label="Tải ảnh lên"><ImageIcon size={14} />{uploadingAsset ? 'Đang tải ảnh...' : 'Tải ảnh lên'}</button>
          {uploadError && <p role="alert" className="text-[10px] leading-4 text-amber-600 dark:text-amber-300">{uploadError}</p>}

          {/* Product Assets */}
          <div className="pt-3 border-t border-[var(--border)] space-y-2">
            <p className="studio-label">Product Assets</p>
            <input
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') void loadProducts(); }}
              placeholder="Tìm sản phẩm..."
              className="studio-input"
              aria-label="Tìm sản phẩm"
            />
            <select aria-label="Danh mục sản phẩm" value={categoryId} onFocus={() => { if (!categories.length) void loadCategories(); }} onChange={(event) => setCategoryId(event.target.value)} className="studio-select w-full"><option value="">Tất cả danh mục</option>{categories.map((category) => <option key={category._id || category.id} value={category._id || category.id}>{category.name}</option>)}</select>
            <button onClick={() => void loadProducts()} className="studio-tool" aria-label="Tải Product Assets">
              {productsLoading ? 'Đang tải...' : 'Tìm Product Assets'}
            </button>
            {selectedProductIds.length > 0 && <button onClick={addSelectedProducts} className="studio-tool" aria-label="Thêm sản phẩm đã chọn">Thêm {selectedProductIds.length} sản phẩm đã chọn</button>}
            {products.map((product) => {
              const productId = String(product._id || product.id);
              const variants = Array.isArray(product.variants) ? product.variants.filter((item: any) => item?.is_active !== false) : [];
              const selectedVariant = variantByProduct[productId] || String(variants[0]?._id || variants[0]?.id || '');
              const preview = variants.find((item: any) => String(item?._id || item?.id) === selectedVariant)?.image_url || product.displayProduct?.[0] || product.image_url;
              return <div key={productId} className="rounded-lg border border-[var(--border)] p-2 space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]"><input type="checkbox" checked={selectedProductIds.includes(productId)} onChange={() => toggleProduct(productId)} />Chọn sản phẩm</label>
                {preview && <img src={preview} alt={`Xem trước ${product.name}`} className="h-20 w-full rounded object-cover bg-[var(--surface)]" />}
                <p className="truncate font-medium" title={product.name}>{product.name}</p>
                {variants.length > 0 && <select aria-label={`Biến thể ${product.name}`} value={selectedVariant} onChange={(event) => setVariantByProduct((value) => ({ ...value, [productId]: event.target.value }))} className="studio-select w-full"><option value="">Mặc định</option>{variants.map((variant: any) => <option key={variant._id || variant.id} value={variant._id || variant.id}>{variant.color}{variant.size ? ` · ${variant.size}` : ''}</option>)}</select>}
                <button onClick={() => addProductAsset(product, selectedVariant)} className="studio-tool w-full justify-center" aria-label={`Thêm ${product.name}`}>Thêm ảnh, tên & giá</button>
              </div>;
            })}
          </div>

          {/* Asset Library: only API-backed assets the authenticated admin may read. */}
          <div className="pt-3 border-t border-[var(--border)] space-y-2">
            <p className="studio-label">Asset Library</p>
            <p className="text-[10px] leading-4 text-[var(--text-muted)]">Banner và thumbnail Design Project theo quyền admin hiện tại.</p>
            <input value={libraryQuery} onChange={(event) => setLibraryQuery(event.target.value)} placeholder="Tìm tài nguyên..." className="studio-input" aria-label="Tìm asset" />
            <select aria-label="Loại asset" value={librarySource} onChange={(event) => setLibrarySource(event.target.value as 'all' | LibrarySource)} className="studio-select w-full">
              <option value="all">Tất cả nguồn</option><option value="banner">Banner</option><option value="design">Design Project</option>
            </select>
            <button onClick={() => void loadAssetLibrary()} className="studio-tool" aria-label="Tải Asset Library">{libraryLoading ? 'Đang tải...' : 'Tải Asset Library'}</button>
            {libraryError && <p role="alert" className="text-[10px] leading-4 text-amber-600 dark:text-amber-300">{libraryError}</p>}
            {brandKitLoaded && <p className="text-[10px] leading-4 text-[var(--text-muted)]">Brand Kit đã tải (màu/chữ). API chưa có logo hoặc ảnh để thêm vào canvas.</p>}
            {!libraryLoading && libraryAssets.length > 0 && filteredLibraryAssets.length === 0 && <p className="text-[10px] text-[var(--text-muted)]">Không có tài nguyên khớp bộ lọc.</p>}
            {!libraryLoading && libraryAssets.length === 0 && !libraryError && <p className="text-[10px] leading-4 text-[var(--text-muted)]">Chưa có banner hoặc thumbnail Design Project khả dụng. Uploaded và AI-generated assets chưa có API catalog nên không được hiển thị giả.</p>}
            {filteredLibraryAssets.map((asset) => <div key={asset.id} className="rounded-lg border border-[var(--border)] p-2 space-y-1.5">
              <img src={asset.url} alt={`Xem trước ${asset.name}`} className="h-20 w-full rounded object-cover bg-[var(--surface)]" />
              <p className="truncate font-medium" title={asset.name}>{asset.name}</p>
              <p className="truncate text-[10px] text-[var(--text-muted)]">{asset.source === 'banner' ? 'Banner' : 'Design Project'}{asset.description ? ` · ${asset.description}` : ''}</p>
              <button onClick={() => addLibraryAsset(asset)} className="studio-tool w-full justify-center" aria-label={`Thêm asset ${asset.name}`}>Thêm vào canvas</button>
              {selected && isImage(selected) && !selected.locked && <button onClick={() => addLibraryAsset(asset, true)} className="studio-tool w-full justify-center" aria-label={`Thay thế ảnh bằng ${asset.name}`}>Thay thế ảnh đang chọn</button>}
            </div>)}
          </div>

          {/* Background */}
          <div className="pt-3 border-t border-[var(--border)] space-y-2">
            <p className="studio-label">Nền Poster</p>
            <label className="studio-field">
              <span>Màu nền HEX</span>
              <input
                value={design.background?.value || '#FFFFFF'}
                onChange={(event) => commit({ ...design, background: { ...design.background, type: 'color', value: event.target.value } })}
                className="studio-input"
                aria-label="Màu nền"
              />
            </label>
            <button
              onClick={() => commit({ ...design, background: { ...design.background, type: 'gradient', value: design.background?.value || '#1a1918', secondaryValue: '#0d0d0c' } })}
              className="studio-tool"
            >
              Gradient Sang Trọng
            </button>
          </div>
        </aside>

        {/* Center Section: Canvas Viewport */}
        <section
          className="h-full min-h-0 min-w-0 rounded-xl border border-[var(--border)] bg-[#e8e6e1] dark:bg-[#242522] overflow-auto p-4 flex items-center justify-center relative admin-content-scrollbar"
          style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,.12) 1px, transparent 1px)', backgroundSize: '16px 16px' }}
        >
          <div className="shadow-2xl my-auto transition-transform duration-150" style={{ width: width * zoom, maxWidth: '100%' }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              width="100%"
              style={{ display: 'block', aspectRatio: `${width}/${height}`, background: backgroundStyle }}
              onPointerMove={pointerMove}
              onPointerUp={pointerUp}
              onPointerLeave={pointerUp}
              onPointerDown={() => { setSelectedId(null); setSelectedIds([]); }}
            >
              <defs>
                {design.background?.type === 'gradient' && (
                  <linearGradient id="studioBackground" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={design.background.value} />
                    <stop offset="100%" stopColor={design.background.secondaryValue || '#111111'} />
                  </linearGradient>
                )}
              </defs>
              <rect
                width={width}
                height={height}
                fill={design.background?.type === 'gradient' ? 'url(#studioBackground)' : (String(design.background?.value || '#FFFFFF').startsWith('#') ? design.background.value : '#FFFFFF')}
              />
              {design.background?.type === 'image' && design.background.value && (
                <image href={design.background.value} width={width} height={height} preserveAspectRatio="xMidYMid slice" />
              )}
              {sorted(design.layers).map(renderLayer)}
              {selectionBounds && <rect data-multi-selection="true" x={selectionBounds.left - 10} y={selectionBounds.top - 10} width={selectionBounds.width + 20} height={selectionBounds.height + 20} fill="none" stroke="#7C5C14" strokeDasharray="12 8" strokeWidth={4} pointerEvents="none" />}
            </svg>
          </div>
        </section>

        {/* Right Aside: Layers & Inspector & AI */}
        <aside className="h-full min-h-0 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] flex flex-col overflow-hidden shadow-xs">
          {/* Layers Header */}
          <div className="shrink-0 p-2.5 px-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]/40">
            <p className="studio-label flex items-center gap-1.5"><Layers size={14} />Layers ({design.layers.length})</p>
          </div>
          {(design.versionHistory?.length || 0) > 0 && <div className="shrink-0 border-b border-[var(--border)] p-2 space-y-1 max-h-32 overflow-y-auto admin-content-scrollbar">
            <p className="studio-label">Version History ({design.versionHistory?.length})</p>
            {[...(design.versionHistory || [])].reverse().map((version, index) => <div key={`${version.version}-${version.savedAt || ''}-${index}`} className="flex items-center gap-1 text-[10px]"><span className="min-w-0 flex-1 truncate">V{version.version} · {version.name}{version.savedAt ? ` · ${new Date(version.savedAt).toLocaleString('vi-VN')}` : ''}</span><button onClick={() => setPreviewVersion(version.version)} className="studio-icon" title="Preview version" aria-label={`Preview V${version.version} ${version.name}`}>Xem</button><button onClick={() => restoreVersion(version)} className="studio-icon" title="Restore version" aria-label={`Khôi phục V${version.version} ${version.name}`}>Khôi phục</button></div>)}
            {previewSnapshot && <p role="status" className="text-[10px] text-[var(--text-muted)]">Preview V{previewSnapshot.version}: {previewSnapshot.name} · {previewSnapshot.canvas.width} × {previewSnapshot.canvas.height} · {previewSnapshot.layers.length} layer. Chọn “Khôi phục” để áp dụng; canvas hiện tại chưa bị thay đổi.</p>}
          </div>}

          {/* Scrollable Middle: Layers list + Selected Properties */}
          <div className="flex-1 min-h-0 overflow-y-auto admin-content-scrollbar divide-y divide-[var(--border)] pb-24">
            {selectedIds.length > 1 && <div className="p-2 space-y-1.5 bg-[var(--accent)]/10 border-b border-[var(--border)]" aria-label="Multi-selection controls">
              <p className="studio-label">Đã chọn {selectedIds.length} layer</p>
              <div className="grid grid-cols-3 gap-1"><button onClick={group} className="studio-button">Group</button><button onClick={ungroup} className="studio-button">Ungroup</button><button onClick={duplicate} className="studio-button">Nhân bản</button></div>
              <div className="grid grid-cols-3 gap-1"><button onClick={() => align('left')} className="studio-button">Trái</button><button onClick={() => align('center')} className="studio-button">Giữa</button><button onClick={() => align('right')} className="studio-button">Phải</button><button onClick={() => align('top')} className="studio-button">Trên</button><button onClick={() => align('middle')} className="studio-button">Giữa dọc</button><button onClick={() => align('bottom')} className="studio-button">Dưới</button><button onClick={() => align('distributeH')} className="studio-button">Dàn ngang</button><button onClick={() => align('distributeV')} className="studio-button">Dàn dọc</button><button onClick={() => align('canvasCenter')} className="studio-button">Tâm canvas</button></div>
            </div>}
            {/* Layers List */}
            <div className="p-2 space-y-1">
              {[...sorted(design.layers)].reverse().map((layer) => (
                <div
                  key={layer.id}
                  className={`flex items-center gap-1 rounded-lg p-1.5 transition-colors ${
                    selectedId === layer.id
                      ? 'bg-[var(--accent)]/15 ring-1 ring-[var(--accent)] font-medium text-[var(--text)]'
                      : 'hover:bg-[var(--surface)] text-[var(--text-muted)]'
                  }`}
                >
                  <button
                    onClick={(event) => selectLayers(layer.id, event.ctrlKey || event.metaKey || event.shiftKey)}
                    className="min-w-0 flex-1 text-left text-xs truncate"
                  >
                    <GripVertical size={13} className="inline mr-1 text-[var(--text-muted)]" />
                    {layer.name}
                  </button>
                  <input type="checkbox" aria-label={`Chọn layer ${layer.name}`} checked={selectedIds.includes(layer.id)} onChange={() => selectLayers(layer.id, true)} />
                  <button
                    onClick={() => patchLayer(layer.id, { visible: !layer.visible })}
                    className="studio-icon"
                    title={layer.visible ? 'Ẩn lớp' : 'Hiện lớp'}
                  >
                    {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button
                    onClick={() => patchLayer(layer.id, { locked: !layer.locked })}
                    className="studio-icon"
                    title={layer.locked ? 'Mở khóa' : 'Khóa lớp'}
                  >
                    {layer.locked ? <Lock size={13} /> : <LockKeyholeOpen size={13} />}
                  </button>
                </div>
              ))}
            </div>

            {/* Properties Panel (if a layer is selected) */}
            {selected && (
              <div className="p-3 space-y-2 text-xs bg-[var(--surface)]/10">
                <p className="studio-label">Thuộc tính · {selected.type}</p>
                <label className="studio-field">
                  Tên
                  <input
                    value={selected.name}
                    onChange={(e) => patchLayer(selected.id, { name: e.target.value })}
                    className="studio-input"
                  />
                </label>
                {TEXT_TYPES.has(selected.type) && (
                  <label className="studio-field">
                    Nội dung
                    <textarea
                      value={selected.content}
                      onChange={(e) => patchLayer(selected.id, { content: e.target.value })}
                      className="studio-input min-h-14"
                    />
                  </label>
                )}
                {isImage(selected) && (
                  <>
                    <label className="studio-field">
                      URL ảnh
                      <input
                        value={selected.content}
                        onChange={(e) => patchLayer(selected.id, { content: e.target.value })}
                        className="studio-input"
                      />
                    </label>
                    <div className="rounded-lg border border-[var(--border)] p-2 space-y-2">
                      <p className="studio-label">Crop không phá hủy</p>
                      <label className="studio-field">Phóng to {Number(selected.styles?.cropZoom || 1).toFixed(1)}×<input aria-label="Phóng to crop" type="range" min="1" max="3" step="0.1" value={Number(selected.styles?.cropZoom || 1)} onChange={(event) => patchStyles(selected.id, { cropZoom: Number(event.target.value) })} /></label>
                      <label className="studio-field">Vị trí ngang<input aria-label="Vị trí crop ngang" type="range" min="0" max="100" value={Number(selected.styles?.cropX ?? 50)} onChange={(event) => patchStyles(selected.id, { cropX: Number(event.target.value) })} /></label>
                      <label className="studio-field">Vị trí dọc<input aria-label="Vị trí crop dọc" type="range" min="0" max="100" value={Number(selected.styles?.cropY ?? 50)} onChange={(event) => patchStyles(selected.id, { cropY: Number(event.target.value) })} /></label>
                      <button onClick={() => patchStyles(selected.id, { cropX: 50, cropY: 50, cropZoom: 1 })} className="studio-tool w-full justify-center">Đặt lại crop</button>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {(['x', 'y', 'width', 'height', 'rotation', 'opacity'] as const).map((key) => (
                    <label key={key} className="studio-field">
                      {key}
                      <input
                        type="number"
                        aria-label={`${key} layer`}
                        step={key === 'opacity' ? 0.1 : 1}
                        value={selected[key] ?? 0}
                        onChange={(e) => patchLayer(selected.id, { [key]: Number(e.target.value) })}
                        className="studio-input"
                      />
                    </label>
                  ))}
                </div>
                {TEXT_TYPES.has(selected.type) && (
                  <>
                    <label className="studio-field">
                      Font chữ
                      <select aria-label="Font chữ" value={String(selected.styles?.fontFamily || 'Inter')} onChange={(event) => patchStyles(selected.id, { fontFamily: event.target.value })} className="studio-input">
                        {!['Arial', 'Georgia', 'Times New Roman', 'Verdana'].includes(String(selected.styles?.fontFamily || 'Inter')) && <option value={String(selected.styles?.fontFamily || 'Inter')}>{String(selected.styles?.fontFamily || 'Inter')} (font hiện tại)</option>}
                        {['Arial', 'Georgia', 'Times New Roman', 'Verdana'].map((font) => <option key={font} value={font}>{font}</option>)}
                      </select>
                    </label>
                    <label className="studio-field">
                      Màu chữ
                      <input
                        value={String(selected.styles?.color || '#111111')}
                        onChange={(e) => patchStyles(selected.id, { color: e.target.value })}
                        className="studio-input"
                      />
                    </label>
                    <label className="studio-field">
                      Cỡ chữ
                      <input
                        type="number"
                        value={Number(selected.styles?.fontSize || 24)}
                        onChange={(e) => patchStyles(selected.id, { fontSize: Number(e.target.value) })}
                        className="studio-input"
                      />
                    </label>
                  </>
                )}
                <div className="flex gap-1 pt-2">
                  <button onClick={duplicate} className="studio-button"><Copy size={13} />Nhân bản</button>
                  {selected.type === 'group' && <button onClick={ungroup} className="studio-button">Ungroup</button>}
                  <button onClick={() => reorder(selected.id, 1)} className="studio-icon" title="Lên trên"><ChevronUp size={14} /></button>
                  <button onClick={() => reorder(selected.id, -1)} className="studio-icon" title="Xuống dưới"><ChevronDown size={14} /></button>
                  <button onClick={remove} disabled={selected.locked} className="studio-icon text-red-500" title="Xóa"><Trash2 size={14} /></button>
                </div>
              </div>
            )}
          </div>

          {/* AI Designer Quick Edit */}
          <div className="shrink-0 border-t border-[var(--border)] p-2.5 bg-[var(--bg-card)] space-y-1.5">
            <p className="studio-label">AI Designer Quick Edit</p>
            <div className="flex gap-1">
              <input
                value={aiRequest}
                onChange={(event) => setAiRequest(event.target.value)}
                placeholder="VD: đổi title thành Winter Collection"
                className="studio-input text-xs"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && aiRequest.trim()) {
                    e.preventDefault();
                    await onAiEdit(aiRequest, selectedId || undefined);
                    setAiRequest('');
                  }
                }}
              />
              <button
                onClick={async () => {
                  if (!aiRequest.trim()) return;
                  await onAiEdit(aiRequest, selectedId || undefined);
                  setAiRequest('');
                }}
                className="studio-icon bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[#9E7B15]"
                title="Gửi lệnh AI"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CreativeStudioEditor;
