import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../modules/users/user.model.js";
import Category from "../modules/categories/category.model.js";
import Product, { ProductVariant } from "../modules/products/product.model.js";
import { Cart, CartItem } from "../modules/carts/cart.model.js";
import Order, { OrderItem } from "../modules/orders/order.model.js";
import Campaign from "../modules/campaigns/campaign.model.js";
import Banner from "../modules/banners/banner.model.js";
import AdminDesignProject from "../modules/ai/models/adminDesignProject.model.js";

dotenv.config({ path: process.env.QA_ENV_FILE || ".env.qa" });
const uri = process.env.MONGO_URI || process.env.MONGO_CONNECTIONSTRING || "";
const database = (() => { try { return new URL(uri).pathname.replace(/^\//, ""); } catch { return ""; } })();
const localMongo = /^mongodb:\/\/(127\.0\.0\.1|localhost)(?::\d+)?\//.test(uri);
if (process.env.APP_ENV !== "qa" || !localMongo || !/(^|_)qa$/i.test(database)) throw new Error("QA_SEED_REFUSED: requires APP_ENV=qa, localhost MongoDB, and a database ending in _qa.");
if (!process.env.QA_SEED_PASSWORD || process.env.QA_SEED_PASSWORD.length < 12) throw new Error("QA_SEED_REFUSED: QA_SEED_PASSWORD must be a disposable value of at least 12 characters.");

const hash = await bcrypt.hash(process.env.QA_SEED_PASSWORD, 10);
const users = [["qa.superadmin@atelier.local", "admin", "QA Super Admin"], ["qa.admin@atelier.local", "admin", "QA Admin"], ["qa.customer.a@atelier.local", "user", "QA Customer A"], ["qa.customer.b@atelier.local", "user", "QA Customer B"]];
await mongoose.connect(uri);
for (const [email, role, fullName] of users) await User.updateOne({ email }, { $set: { email, role, fullName, passWord: hash, status: "active", isActive: true, legal_consents: { terms_accepted: true, privacy_accepted: true, marketing_accepted: false, policy_version: "qa", recorded_at: new Date() } } }, { upsert: true });
const [admin, customerA, customerB] = await Promise.all([
  User.findOne({ email: "qa.superadmin@atelier.local" }),
  User.findOne({ email: "qa.customer.a@atelier.local" }),
  User.findOne({ email: "qa.customer.b@atelier.local" }),
]);

const category = await Category.findOneAndUpdate(
  { slug: "qa-tailoring" },
  { $set: { name: "QA Tailoring", slug: "qa-tailoring", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80" } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
const product = await Product.findOneAndUpdate(
  { slug: "qa-silk-blazer" },
  { $set: { name: "QA Silk Blazer", name_no_accents: "qa silk blazer", category_id: category._id, slug: "qa-silk-blazer", description: "QA-only product fixture", old_price: 4200000, new_price: 3500000, stock: 24, sold: 3, rating: 4.8, is_active: true, is_featured: true } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
const variant = await ProductVariant.findOneAndUpdate(
  { sku: "QA-SILK-BLAZER-IVORY-S" },
  { $set: { product_id: product._id, color: "Ivory", color_code: "#F5F1E8", color_key: "ivory", size: "S", stock: 12, image_url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80", sku: "QA-SILK-BLAZER-IVORY-S", price: 3500000, is_active: true } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
const secondProduct = await Product.findOneAndUpdate(
  { slug: "qa-cashmere-coat" },
  { $set: { name: "QA Cashmere Coat", name_no_accents: "qa cashmere coat", category_id: category._id, slug: "qa-cashmere-coat", description: "Second QA-only product fixture", old_price: 6900000, new_price: 5900000, stock: 16, sold: 1, rating: 4.6, is_active: true, is_featured: false } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
await ProductVariant.findOneAndUpdate(
  { sku: "QA-CASHMERE-COAT-CAMEL-M" },
  { $set: { product_id: secondProduct._id, color: "Camel", color_code: "#B98B5D", color_key: "camel", size: "M", stock: 8, image_url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80", sku: "QA-CASHMERE-COAT-CAMEL-M", price: 5900000, is_active: true } },
  { upsert: true, setDefaultsOnInsert: true }
);
const cart = await Cart.findOneAndUpdate(
  { user_id: customerA._id },
  { $set: { user_id: customerA._id, total_items: 1, total_price: 3500000 } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
await CartItem.findOneAndUpdate(
  { cart_id: cart._id, product_id: product._id, variant_id: variant._id },
  { $set: { cart_id: cart._id, product_id: product._id, variant_id: variant._id, quantity: 1, price: 3500000 } },
  { upsert: true, setDefaultsOnInsert: true }
);
const campaign = await Campaign.findOneAndUpdate(
  { slug: "qa-winter-edit" },
  { $set: { name: "QA Winter Edit", slug: "qa-winter-edit", description: "QA-only active campaign", type: "seasonal", status: "active", startAt: new Date(Date.now() - 86400000), endAt: new Date(Date.now() + 14 * 86400000), priority: 1, applicableProducts: [product._id], discountRule: { scope: "products", discountType: "percentage", discountValue: 10 }, createdBy: admin._id, updatedBy: admin._id } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
await Banner.findOneAndUpdate(
  { title: "QA Winter Asset Banner" },
  { $set: { title: "QA Winter Asset Banner", subtitle: "QA-only reusable library asset", imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1600&q=80", mobileImageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80", linkUrl: "/collections/qa", buttonText: "QA Explore", position: "popup", targetType: "external", startDate: new Date(Date.now() - 86400000), endDate: new Date(Date.now() + 14 * 86400000), isActive: true, isDeleted: false, createdBy: admin._id, updatedBy: admin._id } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
await Banner.findOneAndUpdate(
  { title: "QA Atelier Asset Banner" },
  { $set: { title: "QA Atelier Asset Banner", subtitle: "Second QA-only reusable library asset", imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80", mobileImageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80", linkUrl: "/collections/qa", buttonText: "QA Atelier", position: "homepage", targetType: "external", startDate: new Date(Date.now() - 86400000), endDate: new Date(Date.now() + 14 * 86400000), isActive: true, isDeleted: false, createdBy: admin._id, updatedBy: admin._id } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
const order = await Order.findOneAndUpdate(
  { transaction_id: "qa-order-0001" },
  { $set: { user_id: customerB._id, total_price: 3150000, original_price: 3500000, discount_amount: 350000, status: "delivered", payment_method: "cod", payment_status: "paid", paid_at: new Date(), transaction_id: "qa-order-0001", shipping_address: { full_name: "QA Customer B", phone: "0900000001", city: "Ho Chi Minh", district: "District 1", ward: "Ben Nghe", address_detail: "QA fixture only" } } },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
await OrderItem.findOneAndUpdate(
  { order_id: order._id, product_id: product._id },
  { $set: { order_id: order._id, product_id: product._id, variant_id: variant._id, quantity: 1, price: 3150000, original_price: 3500000, product_name: product.name, product_image: variant.image_url, product_slug: product.slug, campaign_id: campaign._id, campaign_name: campaign.name } },
  { upsert: true, setDefaultsOnInsert: true }
);
await AdminDesignProject.findOneAndUpdate(
  { adminId: admin._id, name: "QA Winter Creative Studio" },
  { $set: { adminId: admin._id, name: "QA Winter Creative Studio", preset: "instagram_portrait", width: 1080, height: 1350, background: { type: "gradient", value: "#F7F3EC", secondaryValue: "#A8814A" }, status: "draft", tags: ["qa", "creative-studio"], linkedCampaignId: campaign._id, metadata: { fixture: "qa-only" }, layers: [
    { id: "qa-title", type: "text", name: "QA Headline", x: 90, y: 180, width: 900, height: 140, zIndex: 2, visible: true, locked: false, content: "QA WINTER EDIT", styles: { fontFamily: "Inter", fontSize: 82, fontWeight: "700", color: "#1A1A1A", textAlign: "center" } },
    { id: "qa-cta", type: "button", name: "QA CTA", x: 340, y: 1040, width: 400, height: 96, zIndex: 3, visible: true, locked: false, content: "", styles: { backgroundColor: "#1A1A1A", borderRadius: 48 } },
    { id: "qa-caption", type: "text", name: "QA Caption", x: 340, y: 1060, width: 400, height: 50, zIndex: 4, visible: true, locked: false, content: "DISCOVER NOW", styles: { fontFamily: "Inter", fontSize: 28, fontWeight: "700", color: "#FFFFFF", textAlign: "center" } }
  ] } },
  { upsert: true, setDefaultsOnInsert: true }
);
await mongoose.disconnect();
console.log("QA fixtures seeded in the isolated QA database; passwords and tokens are not printed.");
