# Backend Product & Variant Schema Capability Gap Analysis

## 1. Executive Summary
This document analyzes the current database schema, controller contracts, and validation rules in `backend/src/modules/products/` regarding multi-variant inventory management for Atelier Vérité. In strict adherence to project ground rules (*Do not modify source backend at `D:\Project\REACT-WebFashion`* and *Do not alter copied backend business logic without explicit authorization*), this analysis identifies active capabilities (`WORKING`) and backend structural boundaries (`BLOCKED_BY_BACKEND` / `PARTIAL`).

---

## 2. Capability Matrix

| Feature / Attribute | Backend Status | Schema / Route Details | Frontend Handling & Remediation |
|---|:---:|---|---|
| **Multi-Variant Creation** | **WORKING** | `POST /api/products` accepts `variants: [{ color, size, stock, image_url }]`. Inserts into `product_variants` collection. | Admin Product Create form sends array of variants with required fields. |
| **Multi-Variant Update** | **WORKING** | `PUT /api/products/:id` replaces variants in `product_variants` and recalculates total stock. | Admin Product Edit form allows adding, modifying, or removing variants. |
| **Individual Variant CRUD** | **WORKING** | `POST /api/product_variants`, `PUT /api/product_variants/:id`, `DELETE /api/product_variants/:id`. | Supported via variant sub-controllers. |
| **Automatic Total Stock Aggregation** | **WORKING** | `createProduct.command.js` and `updateProduct.command.js` execute `finalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0)`. | Frontend displays read-only `TotalStock` computed in real-time as `SUM(VariantStock)`, matching backend calculation. |
| **Compound Uniqueness (Color + Size)** | **WORKING** | `productVariantSchema.index({ product_id: 1, color: 1, size: 1 }, { unique: true })`. | Client-side validation blocks duplicate Color + Size combinations before submission. |
| **Variant-Specific Price Column** | **BLOCKED_BY_BACKEND** | `productVariantSchema` in MongoDB has no `price` field. Prices (`old_price`, `new_price`) are stored exclusively on the parent `Product` document. | Form displays price field with architectural notice that variant-level price overrides inherit product base price until schema migration. |
| **Variant-Specific SKU Column** | **BLOCKED_BY_BACKEND** | `productVariantSchema` does not store a discrete `sku` string. `inventoryReservation.service.js` dynamically derives SKU via `getSku(productId, variantId) => "variant_" + variantId`. | Frontend displays auto-generated SKU preview `[SLUG]-[COLOR]-[SIZE]` and clearly badges database storage status. |
| **Variant-Specific Status Toggle** | **PARTIAL** | `is_active` flag exists only at the `Product` level, not individually on `ProductVariant`. | Inactive status managed via zero stock or parent product deactivation. |

---

## 3. Detailed Schema Audit

### Current `ProductVariant` Schema (`backend/src/modules/products/product.model.js`)
```javascript
const productVariantSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    size: {
      type: String,
    },
    stock: {
      type: Number,
      min: 0,
      default: 0,
    },
    image_url: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
```

### Key Findings
1. **Stock Management**:
   - Each variant holds its own `stock` integer (default: 0, min: 0).
   - Parent product `stock` is automatically updated to the sum of all variant stocks on create and update.
   - Inventory reservation system (`inventoryReservation.service.js`) atomically reserves stock against `webfashion:stock:reserved:variant_<id>` in Redis 7.0 and decrements `dbStock` accordingly.
2. **Mandatory Image Constraint**:
   - In `createProduct.command.js`, line 31:
     `variantDocs = variants.filter((variant) => variant?.color && variant?.image_url)`.
   - If `image_url` is absent, the backend silently drops the variant!
   - **Resolution**: Frontend guarantees that every variant includes an `image_url` (defaulting to the product's primary featured image if no distinct variant photo is provided).

---

## 4. Recommendations for Future Backend Schema Migration
When backend updates are authorized:
1. Add `price: { type: Number, min: 0 }` to `productVariantSchema` to support independent variant pricing.
2. Add `sku: { type: String, unique: true, sparse: true }` to `productVariantSchema` for standardized warehouse barcoding.
3. Add `is_active: { type: Boolean, default: true }` to `productVariantSchema` for independent variant discontinuation.
