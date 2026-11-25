import crypto from "crypto";

const LAYER_TYPES = new Set(["text", "image", "background", "shape", "icon", "logo", "badge", "button", "group", "product", "gradient"]);
const STYLE_KEYS = new Set(["fontFamily", "fontSize", "fontWeight", "fontStyle", "color", "backgroundColor", "borderColor", "borderWidth", "borderRadius", "textAlign", "letterSpacing", "lineHeight", "textTransform", "padding", "shadowColor", "shadowBlur", "shadowOffsetX", "shadowOffsetY", "objectFit", "cropX", "cropY", "cropZoom", "flipX", "flipY", "brightness", "contrast", "saturation"]);
const EDITABLE_KEYS = new Set(["name", "content", "x", "y", "width", "height", "rotation", "opacity", "visible", "locked"]);
const MAX_LAYERS = 100;

const number = (value, fallback, min, max) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;
const id = () => `layer_${crypto.randomUUID()}`;

export function designSummary(design) {
  return {
    id: String(design._id),
    canvas: { width: design.width, height: design.height, background: design.background },
    layers: (design.layers || []).map((layer) => ({
      id: layer.id, type: layer.type, name: layer.name, content: String(layer.content || "").slice(0, 160),
      x: layer.x, y: layer.y, width: layer.width, height: layer.height, visible: layer.visible, locked: layer.locked,
    })),
  };
}

function sanitizeLayer(raw = {}, source = {}) {
  const layer = { ...source };
  for (const key of EDITABLE_KEYS) {
    if (!(key in raw)) continue;
    if (["x", "y"].includes(key)) layer[key] = number(raw[key], layer[key] || 0, -10000, 10000);
    else if (["width", "height"].includes(key)) layer[key] = number(raw[key], layer[key] || 1, 1, 10000);
    else if (key === "rotation") layer[key] = number(raw[key], layer[key] || 0, -360, 360);
    else if (key === "opacity") layer[key] = number(raw[key], layer[key] ?? 1, 0, 1);
    else if (["visible", "locked"].includes(key)) layer[key] = Boolean(raw[key]);
    else layer[key] = String(raw[key] ?? "").slice(0, 2000);
  }
  if (raw.styles && typeof raw.styles === "object") {
    layer.styles = { ...(layer.styles || {}) };
    for (const [key, value] of Object.entries(raw.styles)) {
      if (!STYLE_KEYS.has(key)) continue;
      layer.styles[key] = typeof value === "string" ? value.slice(0, 200) : number(value, 0, -10000, 10000);
    }
  }
  return layer;
}

/** Applies only allow-listed, data-only operations. It never evaluates model output as code. */
export function applyDesignOperations(design, operations = []) {
  const document = typeof design.toObject === "function" ? design.toObject() : structuredClone(design);
  document.layers = Array.isArray(document.layers) ? document.layers : [];
  const applied = [];

  for (const operation of Array.isArray(operations) ? operations.slice(0, 20) : []) {
    const type = String(operation?.operation || "");
    const layerIndex = document.layers.findIndex((layer) => layer.id === operation.layerId);
    if (type === "ADD_LAYER" && document.layers.length < MAX_LAYERS) {
      const proposed = operation.layer || {};
      if (!LAYER_TYPES.has(proposed.type)) continue;
      document.layers.push(sanitizeLayer({ ...proposed, id: id(), visible: proposed.visible ?? true, locked: false, opacity: proposed.opacity ?? 1 }, {
        id: id(), type: proposed.type, name: "Lớp mới", x: 80, y: 80, width: 240, height: 80, rotation: 0, opacity: 1, visible: true, locked: false, content: "", styles: {}, zIndex: document.layers.length + 1,
      }));
      applied.push(type);
    } else if (type === "UPDATE_LAYER" && layerIndex >= 0 && !document.layers[layerIndex].locked) {
      document.layers[layerIndex] = sanitizeLayer(operation.changes || {}, document.layers[layerIndex]);
      applied.push(type);
    } else if (type === "REMOVE_LAYER" && layerIndex >= 0 && !document.layers[layerIndex].locked) {
      document.layers.splice(layerIndex, 1);
      applied.push(type);
    } else if (type === "DUPLICATE_LAYER" && layerIndex >= 0 && document.layers.length < MAX_LAYERS) {
      const original = document.layers[layerIndex];
      document.layers.push({ ...structuredClone(original), id: id(), name: `${original.name} (bản sao)`, x: Number(original.x || 0) + 24, y: Number(original.y || 0) + 24, zIndex: document.layers.length + 1 });
      applied.push(type);
    } else if (type === "REORDER_LAYER" && layerIndex >= 0 && !document.layers[layerIndex].locked) {
      const target = number(operation.toIndex, layerIndex, 0, document.layers.length - 1);
      const [layer] = document.layers.splice(layerIndex, 1);
      document.layers.splice(target, 0, layer);
      document.layers.forEach((item, index) => { item.zIndex = index + 1; });
      applied.push(type);
    } else if (type === "CHANGE_BACKGROUND" && operation.background && typeof operation.background === "object") {
      const background = operation.background;
      const allowedType = ["color", "gradient", "image", "texture"].includes(background.type) ? background.type : document.background?.type || "color";
      document.background = { ...document.background, type: allowedType, value: String(background.value || document.background?.value || "#FFFFFF").slice(0, 200), secondaryValue: String(background.secondaryValue || document.background?.secondaryValue || "").slice(0, 200) };
      applied.push(type);
    }
  }
  return { document, applied };
}

export function parseOperations(raw) {
  const match = String(raw || "").match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI_DESIGN_INVALID_OPERATION");
  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed.operations)) throw new Error("AI_DESIGN_INVALID_OPERATION");
  return parsed.operations;
}

export function applyDesignOperationsAtomically(design, operations) {
  const validPatch = (patch) => {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return false;
    for (const [key, min, max] of [['x', -10000, 10000], ['y', -10000, 10000], ['width', 1, 10000], ['height', 1, 10000], ['rotation', -360, 360], ['opacity', 0, 1]]) {
      if (patch[key] !== undefined && (typeof patch[key] !== 'number' || !Number.isFinite(patch[key]) || patch[key] < min || patch[key] > max)) return false;
    }
    if (patch.styles !== undefined) {
      if (!patch.styles || typeof patch.styles !== 'object' || Array.isArray(patch.styles)) return false;
      for (const [key, min, max] of [['cropX', 0, 100], ['cropY', 0, 100], ['cropZoom', 1, 3]]) if (patch.styles[key] !== undefined && (typeof patch.styles[key] !== 'number' || !Number.isFinite(patch.styles[key]) || patch.styles[key] < min || patch.styles[key] > max)) return false;
    }
    return true;
  };
  if (!Array.isArray(operations) || !operations.length || operations.length > 20 || operations.some((op) => !op || typeof op !== 'object' || ((op.operation === 'ADD_LAYER' || op.operation === 'UPDATE_LAYER') && !validPatch(op.operation === 'ADD_LAYER' ? op.layer : op.changes)))) return null;
  const result = applyDesignOperations(design, operations);
  if (result.applied.length !== operations.length) return null;
  return result;
}
