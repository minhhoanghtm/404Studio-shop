import { describe, expect, it } from "@jest/globals";
import { applyDesignOperations } from "../designOperations.service.js";

const design = {
  _id: "507f1f77bcf86cd799439011",
  width: 1080,
  height: 1350,
  background: { type: "color", value: "#FFFFFF" },
  layers: [{ id: "headline-01", type: "text", name: "Tiêu đề", x: 80, y: 120, width: 800, height: 120, visible: true, locked: false, opacity: 1, content: "SALE", styles: { color: "#111111", fontSize: 64 } }],
};

describe("design operation allow-list", () => {
  it("updates only permitted layer data and leaves arbitrary code out", () => {
    const { document, applied } = applyDesignOperations(design, [{ operation: "UPDATE_LAYER", layerId: "headline-01", changes: { content: "WINTER COLLECTION", x: 100, javascript: "alert(1)", styles: { color: "#D4AF37", onload: "bad" } } }]);
    expect(applied).toEqual(["UPDATE_LAYER"]);
    expect(document.layers[0].content).toBe("WINTER COLLECTION");
    expect(document.layers[0].x).toBe(100);
    expect(document.layers[0]).not.toHaveProperty("javascript");
    expect(document.layers[0].styles).not.toHaveProperty("onload");
  });

  it("does not alter a locked layer and supports an independent background change", () => {
    const locked = { ...design, layers: [{ ...design.layers[0], locked: true }] };
    const { document, applied } = applyDesignOperations(locked, [
      { operation: "UPDATE_LAYER", layerId: "headline-01", changes: { content: "Không đổi" } },
      { operation: "CHANGE_BACKGROUND", background: { type: "color", value: "#153B75" } },
    ]);
    expect(applied).toEqual(["CHANGE_BACKGROUND"]);
    expect(document.layers[0].content).toBe("SALE");
    expect(document.background.value).toBe("#153B75");
  });
});
