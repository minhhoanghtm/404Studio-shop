import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

let api; let uri; let redis;
try { api = new URL(process.env.QA_API_URL || ''); uri = new URL(process.env.LOCAL_DEV_MONGO_URI || process.env.MONGO_CONNECTIONSTRING || ''); redis = process.env.REDIS_URL ? new URL(process.env.REDIS_URL) : { hostname: process.env.REDIS_HOST || '', port: process.env.REDIS_PORT || '' }; } catch { throw new Error('QA fixture guard refused configuration.'); }
if (process.env.APP_ENV !== 'qa' || process.env.QA_E2E_ENABLED !== 'true' || api.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(api.hostname) || api.port !== '5002' || api.pathname !== '/api' || !['127.0.0.1', 'localhost'].includes(uri.hostname) || uri.port !== '27018' || uri.pathname !== '/atelier_verite_qa' || !['127.0.0.1', 'localhost'].includes(redis.hostname) || redis.port !== '6381' || !process.env.QA_SEED_PASSWORD) throw new Error('QA fixture guard refused target.');
const login = async (email) => { const result = await fetch(`${api.origin}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, passWord: process.env.QA_SEED_PASSWORD }) }); if (!result.ok) throw new Error('QA login failed.'); return (await result.json()).data.accessToken; };
const admin = await login('qa.superadmin@atelier.local'); const customer = await login('qa.customer.b@atelier.local'); const otherCustomer = await login('qa.customer.a@atelier.local');
const check = await fetch(`${api.origin}/api/admin/ai/qa-context`, { headers: { Authorization: `Bearer ${admin}` } }); const context = (await check.json()).data;
if (!check.ok || context?.environment !== 'qa' || context.database !== 'atelier_verite_qa' || context.databasePort !== 27018 || !context.redisQa) throw new Error('QA runtime verification failed.');
const userId = jwt.verify(customer, process.env.ACCESS_TOKEN_SECRET).userId;
const otherUserId = jwt.verify(otherCustomer, process.env.ACCESS_TOKEN_SECRET).userId;
const [{ Product, ProductVariant }, { Cart, CartItem }] = await Promise.all([import('../modules/products/product.model.js'), import('../modules/carts/cart.model.js')]);
await mongoose.connect(uri.toString());
try {
  if (mongoose.connection.name !== 'atelier_verite_qa' || mongoose.connection.port !== 27018) throw new Error('QA database verification failed.');
  if (process.argv[2] === 'create') {
    const source = await Product.findOne({ slug: /^qa-product-image-/ }).lean();
    if (!source?.displayProduct?.[0]) throw new Error('QA image fixture missing.');
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; const slug = `qa-browser-cart-${suffix}`; const name = `QA Browser Cart ${suffix}`;
    const existingCart = await Cart.findOne({ user_id: userId }).lean();
    const product = await Product.create({ name, slug, category_id: source.category_id, displayProduct: source.displayProduct, old_price: 120000, new_price: 100000, stock: 5, is_active: true });
    let variant; let variant2;
    try {
      variant = await ProductVariant.create({ product_id: product._id, color: 'QA', size: 'M', stock: 5, image_url: source.displayProduct[0], sku: `QAB-${suffix}-M` });
      variant2 = await ProductVariant.create({ product_id: product._id, color: 'QA', size: 'L', stock: 5, image_url: source.displayProduct[0], sku: `QAB-${suffix}-L` });
    } catch (error) { if (variant) await ProductVariant.deleteOne({ _id: variant._id, product_id: product._id }); await Product.deleteOne({ _id: product._id, slug }); throw error; }
    console.log(JSON.stringify({ slug, name, productId: String(product._id), variantId: String(variant._id), variant2Id: String(variant2._id), cartId: existingCart ? String(existingCart._id) : null, totals: existingCart ? { total_items: existingCart.total_items, total_price: existingCart.total_price } : null }));
  } else if (process.argv[2] === 'cleanup') {
    const fixture = JSON.parse(process.argv[3] || '{}');
    if (!/^qa-browser-cart-\d{13}-[a-z0-9]{6}$/.test(fixture.slug) || !mongoose.isValidObjectId(fixture.productId) || !mongoose.isValidObjectId(fixture.variantId) || !mongoose.isValidObjectId(fixture.variant2Id) || (fixture.reservationId && !/^res_\d+_[a-f0-9]{8}$/.test(fixture.reservationId))) throw new Error('QA fixture cleanup refused identifiers.');
    if (!await Product.exists({ _id: fixture.productId, slug: fixture.slug })) throw new Error('QA fixture cleanup refused unmatched product.');
    const { default: Favorite } = await import('../modules/favorites/favorite.model.js');
    await Favorite.deleteMany({ product_id: fixture.productId, user_id: { $in: [userId, otherUserId] } });
    if (fixture.reservationId) {
      const [{ Order, OrderItem }, { default: Reservation }, { default: reservations }, { closeRedisConnection }] = await Promise.all([import('../modules/orders/order.model.js'), import('../modules/inventory/inventoryReservation.model.js'), import('../modules/inventory/inventoryReservation.service.js'), import('../configs/redis.js')]);
      const ownedOrder = await Order.findOne({ user_id: userId, reservation_id: fixture.reservationId }).lean();
      if (ownedOrder) {
        const orderItems = await OrderItem.find({ order_id: ownedOrder._id }).lean();
        if (!orderItems.length || orderItems.some((item) => String(item.product_id) !== fixture.productId)) throw new Error('QA fixture cleanup refused an unrelated order.');
        await OrderItem.deleteMany({ order_id: ownedOrder._id, product_id: fixture.productId });
        await Order.deleteOne({ _id: ownedOrder._id, user_id: userId, reservation_id: fixture.reservationId });
      }
      const held = await Reservation.findOne({ reservationId: fixture.reservationId, userId }).lean();
      if (held?.status === 'ACTIVE') await reservations.releaseReservation(fixture.reservationId, 'USER_CANCELLED');
      if (held) await Reservation.deleteOne({ reservationId: fixture.reservationId, userId });
      await closeRedisConnection();
    }
    const cart = await Cart.findOne({ user_id: userId });
    if (cart) {
      await CartItem.deleteMany({ cart_id: cart._id, product_id: fixture.productId });
      if (fixture.cartId && String(cart._id) === fixture.cartId && fixture.totals) await Cart.updateOne({ _id: cart._id, user_id: userId }, { $set: { total_items: fixture.totals.total_items, total_price: fixture.totals.total_price } });
      else if (!fixture.cartId && !await CartItem.exists({ cart_id: cart._id })) await Cart.deleteOne({ _id: cart._id, user_id: userId });
    }
    await ProductVariant.deleteOne({ _id: fixture.variantId, product_id: fixture.productId });
    await ProductVariant.deleteOne({ _id: fixture.variant2Id, product_id: fixture.productId });
    await Product.deleteOne({ _id: fixture.productId, slug: fixture.slug });
    console.log(JSON.stringify({ cleaned: true }));
  } else throw new Error('Unknown QA fixture command.');
} finally { await mongoose.disconnect(); }
