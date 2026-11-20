import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "@jest/globals";
import Product, { ProductVariant } from "../product.model.js";
import { buildVariantSku, createAdminFormProduct, slugifyProductName, updateAdminFormProduct } from "../productAdminForm.service.js";

const configuredTestDb = process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/atelier_verite_product_slug_test";
const testDb = configuredTestDb.replace(/([?&])retryWrites=[^&]*/i, "$1");
const categoryId = new mongoose.Types.ObjectId();
const productPayload = (name) => ({
  name,
  category_id: categoryId,
  old_price: 200000,
  new_price: 150000,
  weight: 0.5,
  displayProduct: ["https://example.test/product.jpg"],
  variants: [{ color: "Đen", size: "M", stock: 2, image_url: "https://example.test/product.jpg" }],
});

describe("admin product form automatic slug", () => {
  const clearTestProducts = async () => {
    const ids = (await Product.find({ name: { $regex: /^__slug-test__/ } }).select("_id").lean()).map((product) => product._id);
    if (ids.length) await ProductVariant.deleteMany({ product_id: { $in: ids } });
    await Product.deleteMany({ _id: { $in: ids } });
  };

  beforeAll(async () => {
    await mongoose.connect(testDb, { retryWrites: false, dbName: "atelier_verite_product_slug_test" });
    await Product.collection.createIndex({ slug: 1 }, { unique: true, name: "slug_1" });
  });

  beforeEach(async () => {
    await clearTestProducts();
  });

  afterAll(async () => {
    await clearTestProducts();
  });

  test("normalizes Vietnamese, Đ, whitespace and special characters", () => {
    expect(slugifyProductName("Áo Khoác Dạ Len Biella")).toBe("ao-khoac-da-len-biella");
    expect(buildVariantSku({ slug: "quan-jeans-straight-fit-urban" }, "Xanh Đậm", "XS")).toBe("QJSFU-XDAM-XS");
    expect(slugifyProductName("  __slug-test__ Đầm Dạ! ✨  Len  ")).toBe("slug-test-dam-da-len");
    expect(slugifyProductName("!!!")).toMatch(/^san-pham-[a-f0-9]{8}$/);
  });

  test("creates deterministic suffixes for duplicate names", async () => {
    const name = "__slug-test__ Áo Khoác Dạ Len Biella";
    await expect(createAdminFormProduct(productPayload(name))).resolves.toMatchObject({ slug: "slug-test-ao-khoac-da-len-biella" });
    await expect(createAdminFormProduct(productPayload(name))).resolves.toMatchObject({ slug: "slug-test-ao-khoac-da-len-biella-2" });
    await expect(createAdminFormProduct(productPayload(name))).resolves.toMatchObject({ slug: "slug-test-ao-khoac-da-len-biella-3" });
  });

  test("resolves concurrent creates through the unique index", async () => {
    const name = "__slug-test__ Đồng Thời";
    const created = await Promise.all([createAdminFormProduct(productPayload(name)), createAdminFormProduct(productPayload(name))]);
    expect(new Set(created.map((product) => product.slug)).size).toBe(2);
    expect(created.map((product) => product.slug).sort()).toEqual(["slug-test-dong-thoi", "slug-test-dong-thoi-2"]);
  });

  test("keeps the existing slug when the name is edited", async () => {
    const created = await createAdminFormProduct(productPayload("__slug-test__ Tên Cũ"));
    const updated = await updateAdminFormProduct(String(created._id), productPayload("__slug-test__ Tên Mới"));
    expect(updated.slug).toBe(created.slug);
  });
});
