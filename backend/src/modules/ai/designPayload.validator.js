import Color from "color";

const MAX_CANVAS_DIMENSION = 10_000;
const MAX_LAYERS = 200;
const MAX_TEXT_LENGTH = 20_000;
const SAFE_LAYER_TYPES = new Set(["text", "image", "background", "shape", "icon", "logo", "badge", "button", "group", "product", "gradient", "qr"]);
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const LAYER_KEYS = new Set(["id", "type", "name", "x", "y", "width", "height", "rotation", "opacity", "zIndex", "visible", "locked", "content", "styles"]);
const STYLE_KEYS = new Set(["fontFamily", "fontSize", "fontWeight", "fontStyle", "color", "backgroundColor", "borderColor", "borderWidth", "borderRadius", "textAlign", "letterSpacing", "lineHeight", "textTransform", "padding", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "objectFit", "cropX", "cropY", "cropZoom", "flipX", "flipY", "brightness", "contrast", "saturation"]);
const DOCUMENT_KEYS = new Set(["_id", "__v", "adminId", "schemaVersion", "editability", "name", "preset", "width", "height", "background", "layers", "thumbnailUrl", "status", "linkedCampaignId", "linkedBannerId", "tags", "promptHistory", "versionHistory", "metadata", "createdAt", "updatedAt"]);
const BACKGROUND_KEYS = new Set(["type", "value", "secondaryValue", "textureName"]);

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
const validateColor = (value) => {
  if (typeof value !== "string" || value.length > 100) throw validationError("Giá trị màu không hợp lệ.");
  if (["none", "currentcolor"].includes(value.toLowerCase())) return;
  try { Color(value); } catch { throw validationError("Giá trị màu không hợp lệ."); }
};

const validateImageSource = (content) => {
  if (!content) return;
  if (typeof content !== "string" || content.length > MAX_TEXT_LENGTH) throw validationError("Nguồn ảnh không hợp lệ.");
  const embedded = /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(content);
  if (embedded) {
    const [, declared, encoded] = embedded;
    if (encoded.length % 4 !== 0) throw validationError("Dữ liệu ảnh Base64 không hợp lệ.");
    const bytes = Buffer.from(encoded, "base64");
    const mime = declared.toLowerCase();
    const valid = mime === "png" ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : mime === "jpeg" ? bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : mime === "gif" ? ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii")) : bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
    if (!valid) throw validationError("Chữ ký dữ liệu ảnh không hợp lệ.");
    return;
  }
  let url;
  try { url = new URL(content); } catch { throw validationError("URL asset phải là http(s) hoặc data:image hợp lệ."); }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw validationError("Giao thức hoặc thông tin xác thực trong URL asset không được hỗ trợ.");
};

const validateStyles = (styles) => {
  if (styles === undefined) return;
  if (!isPlainObject(styles)) throw validationError("Styles của layer phải là object an toàn.");
  for (const [key, value] of Object.entries(styles)) {
    if (!isSafeKey(key) || (value !== null && typeof value === "object")) throw validationError("Styles chứa thuộc tính không an toàn.");
    if (["scale", "scaleX", "scaleY"].includes(key)) throw validationError("Scale không được hỗ trợ; sử dụng kích thước layer.");
    if (!STYLE_KEYS.has(key)) throw validationError(`Style ${key} không được hỗ trợ.`);
    if (typeof value === "string" && /(?:url\s*\(|expression\s*\(|javascript\s*:|[<>])/i.test(value)) throw validationError("Styles chứa nội dung không an toàn.");
  }
  for (const [key, min, max] of [["cropX", 0, 100], ["cropY", 0, 100], ["cropZoom", 1, 3]]) {
    if (styles[key] !== undefined && (!isFiniteNumber(styles[key]) || styles[key] < min || styles[key] > max)) throw validationError(`Giá trị ${key} không hợp lệ.`);
  }
  if (styles.fontSize !== undefined && (!isFiniteNumber(styles.fontSize) || styles.fontSize < 1 || styles.fontSize > 10000)) throw validationError("Cỡ chữ không hợp lệ.");
  for (const key of ["color", "backgroundColor", "borderColor", "shadowColor"]) if (styles[key] !== undefined) validateColor(styles[key]);
};

const validateLayer = (layer) => {
  if (!isPlainObject(layer)) throw validationError("Layer phải là object.");
  if (["scale", "scaleX", "scaleY"].some((key) => Object.hasOwn(layer, key))) throw validationError("Scale không được hỗ trợ; sử dụng kích thước layer.");
  if (Object.keys(layer).some((key) => !LAYER_KEYS.has(key))) throw validationError("Layer chứa thuộc tính không được hỗ trợ.");
  if (typeof layer.id !== "string" || !/^[a-zA-Z0-9_-]{1,120}$/.test(layer.id)) throw validationError("Layer ID không hợp lệ.");
  if (!SAFE_LAYER_TYPES.has(layer.type)) throw validationError("Layer type không được hỗ trợ.");
  for (const field of ["x", "y", "width", "height", "rotation", "opacity", "zIndex"]) {
    if (!isFiniteNumber(layer[field])) throw validationError(`Layer ${layer.id} có geometry không hữu hạn.`);
  }
  if (layer.width < 1 || layer.height < 1 || layer.width > MAX_CANVAS_DIMENSION || layer.height > MAX_CANVAS_DIMENSION) throw validationError("Kích thước layer nằm ngoài giới hạn.");
  if (layer.opacity < 0 || layer.opacity > 1) throw validationError("Opacity layer không hợp lệ.");
  if (typeof layer.name !== "string" || layer.name.length > 500 || typeof layer.content !== "string" || layer.content.length > MAX_TEXT_LENGTH) throw validationError("Nội dung layer không hợp lệ.");
  if (["text", "badge", "button", "logo"].includes(layer.type) && /<\s*\/?\s*(?:script|iframe|object|embed|svg|math|img|style|link|meta)\b/i.test(layer.content)) throw validationError("Nội dung layer chứa HTML không an toàn.");
  if (typeof layer.visible !== "boolean" || typeof layer.locked !== "boolean") throw validationError("Trạng thái layer không hợp lệ.");
  validateStyles(layer.styles);
  if (["image", "product", "logo", "background"].includes(layer.type)) validateImageSource(layer.content);
};

export const validateDesignPayload = (payload) => {
  if (!isPlainObject(payload)) throw validationError("Payload thiết kế không hợp lệ.");
  if (Object.keys(payload).some((key) => !DOCUMENT_KEYS.has(key))) throw validationError("Thiết kế chứa thuộc tính không được hỗ trợ.");
  // Version 1 remains readable for existing flattened records; version 2 is
  // the editable format. Reject unknown versions rather than silently saving.
  if (payload.schemaVersion !== undefined && ![1, 2].includes(payload.schemaVersion)) throw validationError("Phiên bản schema không được hỗ trợ.");
  const { name, preset, width, height, background, layers } = payload;
  if (name !== undefined && (typeof name !== "string" || !name.trim() || name.length > 300)) throw validationError("Tên thiết kế không hợp lệ.");
  if (preset !== undefined && (typeof preset !== "string" || preset.length > 100)) throw validationError("Preset không hợp lệ.");
  for (const [field, value] of [["width", width], ["height", height]]) {
    if (value !== undefined && (!isFiniteNumber(value) || value < 32 || value > MAX_CANVAS_DIMENSION)) throw validationError(`${field} canvas không hợp lệ.`);
  }
  if (background !== undefined) {
    if (!isPlainObject(background) || !["color", "gradient", "image", "texture"].includes(background.type) || typeof background.value !== "string" || background.value.length > MAX_TEXT_LENGTH) throw validationError("Background không hợp lệ.");
    if (Object.keys(background).some((key) => !BACKGROUND_KEYS.has(key))) throw validationError("Background chứa thuộc tính không được hỗ trợ.");
    if (["color", "gradient"].includes(background.type)) validateColor(background.value);
    if (background.secondaryValue !== undefined && background.secondaryValue !== "") validateColor(background.secondaryValue);
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

