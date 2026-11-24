const MAX_CANVAS_DIMENSION = 10_000;
const MAX_LAYERS = 200;
const MAX_TEXT_LENGTH = 20_000;
const SAFE_LAYER_TYPES = new Set(["text", "image", "background", "shape", "icon", "logo", "badge", "button", "group", "product", "gradient", "qr"]);
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const validationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.status = "fail";
  error.isOperational = true;
  return error;
};

const isPlainObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);
const isSafeKey = (key) => typeof key === "string" && !UNSAFE_KEYS.has(key);

const validateImageSource = (content) => {
  if (!content) return;
  if (typeof content !== "string" || content.length > MAX_TEXT_LENGTH) throw validationError("Nguồn ảnh không hợp lệ.");
  if (/^data:image\/(png|jpeg|webp|gif);base64,/i.test(content)) return;
  let url;
  try { url = new URL(content); } catch { throw validationError("URL asset phải là http(s) hoặc data:image hợp lệ."); }
  if (!/^https?:$/.test(url.protocol)) throw validationError("Giao thức asset không được hỗ trợ.");
};

const validateStyles = (styles) => {
  if (styles === undefined) return;
  if (!isPlainObject(styles)) throw validationError("Styles của layer phải là object an toàn.");
  for (const [key, value] of Object.entries(styles)) {
    if (!isSafeKey(key) || (value !== null && typeof value === "object")) throw validationError("Styles chứa thuộc tính không an toàn.");
  }
};

const validateLayer = (layer) => {
  if (!isPlainObject(layer)) throw validationError("Layer phải là object.");
  if (typeof layer.id !== "string" || !/^[a-zA-Z0-9_-]{1,120}$/.test(layer.id)) throw validationError("Layer ID không hợp lệ.");
  if (!SAFE_LAYER_TYPES.has(layer.type)) throw validationError("Layer type không được hỗ trợ.");
  for (const field of ["x", "y", "width", "height", "rotation", "opacity", "zIndex"]) {
    if (!isFiniteNumber(layer[field])) throw validationError(`Layer ${layer.id} có geometry không hữu hạn.`);
  }
  if (layer.width < 1 || layer.height < 1 || layer.width > MAX_CANVAS_DIMENSION || layer.height > MAX_CANVAS_DIMENSION) throw validationError("Kích thước layer nằm ngoài giới hạn.");
  if (layer.opacity < 0 || layer.opacity > 1) throw validationError("Opacity layer không hợp lệ.");
  if (typeof layer.name !== "string" || layer.name.length > 500 || typeof layer.content !== "string" || layer.content.length > MAX_TEXT_LENGTH) throw validationError("Nội dung layer không hợp lệ.");
  if (typeof layer.visible !== "boolean" || typeof layer.locked !== "boolean") throw validationError("Trạng thái layer không hợp lệ.");
  validateStyles(layer.styles);
  if (["image", "product", "logo"].includes(layer.type)) validateImageSource(layer.content);
};

export const validateDesignPayload = (payload) => {
  if (!isPlainObject(payload)) throw validationError("Payload thiết kế không hợp lệ.");
  const { name, preset, width, height, background, layers } = payload;
  if (name !== undefined && (typeof name !== "string" || !name.trim() || name.length > 300)) throw validationError("Tên thiết kế không hợp lệ.");
  if (preset !== undefined && (typeof preset !== "string" || preset.length > 100)) throw validationError("Preset không hợp lệ.");
  for (const [field, value] of [["width", width], ["height", height]]) {
    if (value !== undefined && (!isFiniteNumber(value) || value < 32 || value > MAX_CANVAS_DIMENSION)) throw validationError(`${field} canvas không hợp lệ.`);
  }
  if (background !== undefined) {
    if (!isPlainObject(background) || !["color", "gradient", "image", "texture"].includes(background.type) || typeof background.value !== "string" || background.value.length > MAX_TEXT_LENGTH) throw validationError("Background không hợp lệ.");
    if (background.type === "image") validateImageSource(background.value);
  }
  if (layers === undefined) return;
  if (!Array.isArray(layers) || layers.length > MAX_LAYERS) throw validationError("Số lượng layer vượt giới hạn.");
  layers.forEach(validateLayer);
  const ids = new Set(layers.map((layer) => layer.id));
  if (ids.size !== layers.length) throw validationError("Layer IDs phải là duy nhất.");
  for (const group of layers.filter((layer) => layer.type === "group")) {
    let members;
    try { members = JSON.parse(group.content || "[]"); } catch { throw validationError("Group members phải là JSON hợp lệ."); }
    if (!Array.isArray(members) || members.length < 2 || members.some((id) => typeof id !== "string" || !ids.has(id) || id === group.id)) throw validationError("Group chứa member không hợp lệ.");
    if (new Set(members).size !== members.length || members.some((id) => layers.find((layer) => layer.id === id)?.type === "group")) throw validationError("Group references không hợp lệ hoặc tạo cycle.");
  }
};

