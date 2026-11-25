import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RS_URI = 'mongodb://127.0.0.1:27019/atelier_verite_qa_rs?replicaSet=rs0';

function assertQaEnv() {
  if (process.env.APP_ENV !== 'qa' || process.env.QA_E2E_ENABLED !== 'true') {
    throw new Error('QA guard refused checkout atomicity suite.');
  }
  const redisUrl = process.env.REDIS_URL ? new URL(process.env.REDIS_URL) : null;
  if (!redisUrl || !['127.0.0.1', 'localhost'].includes(redisUrl.hostname) || redisUrl.port !== '6381') {
    throw new Error('QA guard refused non-QA Redis target.');
  }
}

test('P0 Checkout Atomicity on MongoDB Replica Set + Redis QA', async () => {
  assertQaEnv();

  const [
    { createOrder },
    orderRepoModule,
    { Order, OrderItem },
    { Product, ProductVariant },
    { Cart, CartItem },
    { default: Voucher },
    { default: UserVoucher },
    { default: VoucherUsage },
    { default: Campaign },
    { default: CampaignProduct },
    { default: CampaignPurchase },
    { default: pricingService },
    { default: reservations },
    { default: InventoryReservation },
    { default: User },
    { closeRedisConnection },
  ] = await Promise.all([
    import('./commands/createOrder.command.js'),
    import('./order.repository.js'),
    import('./order.model.js'),
    import('../products/product.model.js'),
    import('../carts/cart.model.js'),
    import('../vouchers/voucher.model.js'),
    import('../vouchers/userVoucher.model.js'),
    import('../vouchers/voucherUsage.model.js'),
    import('../campaigns/campaign.model.js'),
    import('../campaigns/campaignProduct.model.js'),
    import('../campaigns/campaignPurchase.model.js'),
    import('../campaigns/pricing.service.js'),
    import('../inventory/inventoryReservation.service.js'),
    import('../inventory/inventoryReservation.model.js'),
    import('../users/user.model.js'),
    import('../../configs/redis.js'),
  ]);

  const orderRepository = orderRepoModule.default;
  const conn = await mongoose.connect(RS_URI);
  assert.equal(mongoose.connection.name, 'atelier_verite_qa_rs');
  assert.equal(mongoose.connection.port, 27019);

  // Ensure collections & unique indexes exist before multi-document transactions
  await Promise.all([
    Order.init(),
    OrderItem.init(),
    Product.init(),
    ProductVariant.init(),
    Cart.init(),
    CartItem.init(),
    Voucher.init(),
    UserVoucher.init(),
    VoucherUsage.init(),
    Campaign.init(),
    CampaignProduct.init(),
    CampaignPurchase.init(),
    InventoryReservation.init(),
    User.init(),
  ]);

  const unique = `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const validAddr = {
    full_name: 'QA Atomicity',
    phone: '0901234567',
    city: 'Ho Chi Minh',
    district: 'District 1',
    ward: 'Ben Nghe',
    address_detail: '123 Dong Khoi',
  };

  let user;
  let categoryId = new mongoose.Types.ObjectId();
  let prod1;
  let prod2;
  let var2;
  let unpurchasedProd;
  let cart;
  let voucher;
  let userVoucher;
  let campaign;
  let campaignProd;
  const createdOrderIds = [];
  const createdReservationIds = [];
  // Keep Node 22 event loop alive across .unref()'d driver/Redis I/O turns until finally cleanup
  const keepAlive = setInterval(() => {}, 5000);

  try {
    user = await User.create({
      userName: `qa_atom_${unique}`,
      fullName: 'QA Atomicity Customer',
      email: `qa.atom.${unique}@atelier.local`,
      passWord: 'QaTestPassword!123',
      role: 'customer',
      isActive: true,
    });

    prod1 = await Product.create({
      name: `QA Atom Prod 1 ${unique}`,
      slug: `qa-atom-prod-1-${unique}`,
      category_id: categoryId,
      displayProduct: ['https://example.test/p1.jpg'],
      old_price: 600000,
      new_price: 500000,
      stock: 10,
      sold: 0,
      is_active: true,
    });

    prod2 = await Product.create({
      name: `QA Atom Prod 2 ${unique}`,
      slug: `qa-atom-prod-2-${unique}`,
      category_id: categoryId,
      displayProduct: ['https://example.test/p2.jpg'],
      old_price: 400000,
      new_price: 300000,
      stock: 5,
      sold: 0,
      is_active: true,
    });

    var2 = await ProductVariant.create({
      product_id: prod2._id,
      color: 'Noir',
      size: 'M',
      stock: 5,
      image_url: 'https://example.test/p2.jpg',
      sku: `QA-ATOM-V2-${unique}`,
    });

    unpurchasedProd = await Product.create({
      name: `QA Atom Keep ${unique}`,
      slug: `qa-atom-keep-${unique}`,
      category_id: categoryId,
      displayProduct: ['https://example.test/p3.jpg'],
      old_price: 200000,
      new_price: 200000,
      stock: 4,
      sold: 0,
      is_active: true,
    });

    cart = await Cart.create({ user_id: user._id, total_items: 3, total_price: 1000000 });
    await CartItem.insertMany([
      { cart_id: cart._id, product_id: prod1._id, variant_id: null, quantity: 1, price: 500000 },
      { cart_id: cart._id, product_id: prod2._id, variant_id: var2._id, quantity: 1, price: 300000 },
      { cart_id: cart._id, product_id: unpurchasedProd._id, variant_id: null, quantity: 1, price: 200000 },
    ]);

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 86400000);
    voucher = await Voucher.create({
      code: `QAATOM${unique.slice(-6).toUpperCase()}`,
      name: 'QA Atomicity Voucher',
      discountType: 'fixed',
      discountValue: 50000,
      minOrderValue: 100000,
      totalQuantity: 10,
      remainingQuantity: 10,
      usedQuantity: 0,
      startDate: new Date(now.getTime() - 60000),
      endDate: nextWeek,
      status: 'ACTIVE',
      voucherType: 'order',
    });
    userVoucher = await UserVoucher.create({
      userId: user._id,
      voucherId: voucher._id,
      status: 'CLAIMED',
      claimedAt: now,
    });

    campaign = await Campaign.create({
      name: `QA Flash ${unique}`,
      type: 'flash_sale',
      status: 'active',
      startAt: new Date(now.getTime() - 60000),
      endAt: nextWeek,
    });
    campaignProd = await CampaignProduct.create({
      campaign_id: campaign._id,
      product_id: prod1._id,
      sale_price: 450000,
      quota: 5,
      sold: 0,
      per_user_limit: 5,
    });
    await pricingService.invalidateActiveCampaignsCache();

    // 1. Invalid order does not decrement stock
    await assert.rejects(
      createOrder(user._id, {
        items: [{ product_id: String(prod1._id), quantity: 1 }],
        shipping_address: 'incomplete string address',
        payment_method: 'cod',
      }),
      (err) => err.statusCode === 400
    );
    assert.equal((await Product.findById(prod1._id).lean()).stock, 10);

    // 2. Multi-item order failure leaves zero partial stock/campaign/voucher changes
    await assert.rejects(
      createOrder(user._id, {
        items: [
          { product_id: String(prod1._id), quantity: 2 },
          { product_id: String(prod2._id), variant_id: String(var2._id), quantity: 99 },
        ],
        voucher_code: voucher.code,
        shipping_address: validAddr,
        payment_method: 'cod',
      }),
      (err) => err.statusCode === 400
    );
    assert.equal((await Product.findById(prod1._id).lean()).stock, 10);
    assert.equal((await ProductVariant.findById(var2._id).lean()).stock, 5);
    assert.equal((await CampaignProduct.findById(campaignProd._id).lean()).sold, 0);
    assert.equal((await Voucher.findById(voucher._id).lean()).usedQuantity, 0);
    assert.equal((await UserVoucher.findById(userVoucher._id).lean()).status, 'CLAIMED');

    // 3. Transaction failure rollback (inject failure after stock + voucher + campaign writes)
    const origInsertMany = orderRepository.insertManyItems.bind(orderRepository);
    orderRepository.insertManyItems = async () => {
      throw new Error('Injected post-deduction failure for transaction rollback');
    };
    try {
      await assert.rejects(
        createOrder(user._id, {
          items: [
            { product_id: String(prod1._id), quantity: 1 },
            { product_id: String(prod2._id), variant_id: String(var2._id), quantity: 1 },
          ],
          voucher_code: voucher.code,
          shipping_address: validAddr,
          payment_method: 'cod',
        }),
        /Injected post-deduction failure/
      );
    } finally {
      orderRepository.insertManyItems = origInsertMany;
    }
    assert.equal(await Order.countDocuments({ user_id: user._id }), 0);
    assert.equal((await Product.findById(prod1._id).lean()).stock, 10);
    assert.equal((await Product.findById(prod1._id).lean()).sold, 0);
    assert.equal((await ProductVariant.findById(var2._id).lean()).stock, 5);
    assert.equal((await Product.findById(prod2._id).lean()).stock, 5);
    assert.equal((await CampaignProduct.findById(campaignProd._id).lean()).sold, 0);
    assert.equal((await Voucher.findById(voucher._id).lean()).usedQuantity, 0);
    assert.equal((await UserVoucher.findById(userVoucher._id).lean()).status, 'CLAIMED');
    assert.equal(await VoucherUsage.countDocuments({ userId: user._id }), 0);

    // 4. Redis failure fails closed (when reservation_id or idempotency_key is supplied)
    const origGetRedis = reservations.getRedis.bind(reservations);
    reservations.getRedis = () => ({
      set: async () => { throw new Error('Redis connection lost'); },
      get: async () => { throw new Error('Redis connection lost'); },
      eval: async () => { throw new Error('Redis connection lost'); },
    });
    try {
      await assert.rejects(
        createOrder(user._id, {
          items: [{ product_id: String(prod1._id), quantity: 1 }],
          idempotency_key: `idemp-redis-down-${unique}`,
          shipping_address: validAddr,
          payment_method: 'cod',
        }),
        (err) => err.statusCode === 503
      );
    } finally {
      reservations.getRedis = origGetRedis;
    }
    assert.equal(await Order.countDocuments({ user_id: user._id }), 0);
    assert.equal((await Product.findById(prod1._id).lean()).stock, 10);

    // 5. Concurrent checkout + reservation replay + successful checkout + cart/inventory/reservation reconciliation
    const res1 = await reservations.createReservation({
      userId: user._id,
      items: [
        { productId: String(prod1._id), quantity: 2 },
        { productId: String(prod2._id), variantId: String(var2._id), quantity: 1 },
      ],
    });
    createdReservationIds.push(res1.reservationId);

    const payload1 = {
      reservation_id: res1.reservationId,
      idempotency_key: `idemp-ok-${unique}`,
      items: [
        { product_id: String(prod1._id), quantity: 2 },
        { product_id: String(prod2._id), variant_id: String(var2._id), quantity: 1 },
      ],
      voucher_code: voucher.code,
      shipping_address: validAddr,
      payment_method: 'cod',
    };

    const concurrentResults = await Promise.allSettled([
      createOrder(user._id, payload1),
      createOrder(user._id, payload1),
    ]);
    const fulfilled = concurrentResults.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const rejected = concurrentResults.filter((r) => r.status === 'rejected').map((r) => r.reason);
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.ok([400, 409].includes(rejected[0].statusCode));

    const order1 = fulfilled[0];
    createdOrderIds.push(order1._id);

    // Duplicate request handling with idempotency_key (non-reservation request)
    const idempKey2 = `idemp-dup-${unique}`;
    const dupPayload = {
      idempotency_key: idempKey2,
      items: [{ product_id: String(prod1._id), quantity: 1 }],
      shipping_address: validAddr,
      payment_method: 'cod',
    };
    const dupFirst = await createOrder(user._id, dupPayload);
    createdOrderIds.push(dupFirst._id);
    const dupSecond = await createOrder(user._id, dupPayload);
    assert.equal(String(dupSecond._id), String(dupFirst._id));
    await assert.rejects(
      createOrder(user._id, { ...dupPayload, items: [{ product_id: String(prod1._id), quantity: 2 }] }),
      (err) => err.statusCode === 409 && err.code === 'IDEMPOTENCY_CONFLICT'
    );

    // Reservation replay rejected
    await assert.rejects(
      createOrder(user._id, {
        reservation_id: res1.reservationId,
        items: payload1.items,
        shipping_address: validAddr,
        payment_method: 'cod',
      }),
      (err) => [400, 409].includes(err.statusCode)
    );

    // Inventory, reservation, voucher, campaign & cart reconciliation
    const p1After = await Product.findById(prod1._id).lean();
    const p2After = await Product.findById(prod2._id).lean();
    const v2After = await ProductVariant.findById(var2._id).lean();
    assert.equal(p1After.stock, 7); // 10 - 2 - 1
    assert.equal(p1After.sold, 3);
    assert.equal(v2After.stock, 4); // 5 - 1
    assert.equal(p2After.stock, 4);
    assert.equal(p2After.sold, 1);
    assert.equal((await CampaignProduct.findById(campaignProd._id).lean()).sold, 3);
    assert.equal((await Voucher.findById(voucher._id).lean()).usedQuantity, 1);
    assert.equal((await UserVoucher.findById(userVoucher._id).lean()).status, 'USED');
    const usageDoc = await VoucherUsage.findOne({ userId: user._id, voucherId: voucher._id }).lean();
    assert.equal(String(usageDoc.orderId), String(order1._id));

    const resDoc = await InventoryReservation.findOne({ reservationId: res1.reservationId }).lean();
    assert.equal(resDoc.status, 'COMPLETED');
    assert.equal(String(resDoc.orderId), String(order1._id));
    assert.equal(await reservations.getReservedStock(`product_${prod1._id}`), 0);
    assert.equal(await reservations.getReservedStock(`variant_${var2._id}`), 0);

    const remainingCartItems = await CartItem.find({ cart_id: cart._id }).lean();
    assert.equal(remainingCartItems.length, 1);
    assert.equal(String(remainingCartItems[0].product_id), String(unpurchasedProd._id));

    // 6. Process interruption recovery (isolated child process creates Order in RS transaction
    // without calling Redis finalize, then recovery reconciles Redis + reservation cleanly and idempotently)
    const crashRes = await reservations.createReservation({
      userId: user._id,
      items: [{ productId: String(prod1._id), quantity: 1 }],
    });
    createdReservationIds.push(crashRes.reservationId);
    assert.equal(await reservations.getReservedStock(`product_${prod1._id}`), 1);

    const childScript = `
      import mongoose from 'mongoose';
      import { Order } from './src/modules/orders/order.model.js';
      import InventoryReservation from './src/modules/inventory/inventoryReservation.model.js';
      await mongoose.connect('${RS_URI}');
      const session = await mongoose.startSession();
      let created;
      await session.withTransaction(async () => {
        const [doc] = await Order.create([{
          user_id: '${user._id}',
          total_price: 450000,
          reservation_id: '${crashRes.reservationId}',
          status: 'pending',
          payment_method: 'cod',
          shipping_address: ${JSON.stringify(validAddr)},
          stock_deducted: true,
        }], { session });
        created = doc;
        await InventoryReservation.updateOne(
          { reservationId: '${crashRes.reservationId}', status: 'ACTIVE' },
          { $set: { status: 'COMPLETED', orderId: doc._id, completedAt: new Date() } },
          { session }
        );
      });
      session.endSession();
      console.log(String(created._id));
      process.exit(0);
    `;
    const childResult = spawnSync(process.execPath, ['--input-type=module', '-e', childScript], {
      cwd: path.resolve(__dirname, '../../..'),
      encoding: 'utf8',
    });
    assert.equal(childResult.status, 0, childResult.stderr);
    const crashedOrderId = childResult.stdout.trim().split(/\r?\n/).pop();
    createdOrderIds.push(new mongoose.Types.ObjectId(crashedOrderId));

    // Redis STILL has the hold because child exited before Redis finalize!
    assert.equal(await reservations.getReservedStock(`product_${prod1._id}`), 1);

    // Run startup reconciliation TWICE to prove idempotent recovery (no double counting)
    await reservations.reconcileReservationsFromDB();
    await reservations.reconcileReservationsFromDB();

    assert.equal(await reservations.getReservedStock(`product_${prod1._id}`), 0);
    const reconciledCrashRes = await reservations.getReservation(crashRes.reservationId);
    assert.equal(reconciledCrashRes.status, 'COMPLETED');

    await assert.rejects(
      createOrder(user._id, {
        reservation_id: crashRes.reservationId,
        items: [{ product_id: String(prod1._id), quantity: 1 }],
        shipping_address: validAddr,
        payment_method: 'cod',
      }),
      (err) => [400, 409].includes(err.statusCode)
    );
  } finally {
    try {
      if (createdOrderIds.length) {
        await OrderItem.deleteMany({ order_id: { $in: createdOrderIds } });
        await CampaignPurchase.deleteMany({ order_id: { $in: createdOrderIds } });
        await VoucherUsage.deleteMany({ orderId: { $in: createdOrderIds } });
        await Order.deleteMany({ _id: { $in: createdOrderIds } });
      }
      for (const resId of createdReservationIds) {
        await reservations.releaseReservation(resId, 'QA_CLEANUP').catch(() => {});
        await InventoryReservation.deleteOne({ reservationId: resId });
      }
      if (cart) {
        await CartItem.deleteMany({ cart_id: cart._id });
        await Cart.deleteOne({ _id: cart._id });
      }
      if (userVoucher) await UserVoucher.deleteOne({ _id: userVoucher._id });
      if (voucher) await Voucher.deleteOne({ _id: voucher._id });
      if (campaignProd) await CampaignProduct.deleteOne({ _id: campaignProd._id });
      if (campaign) await Campaign.deleteOne({ _id: campaign._id });
      await pricingService.invalidateActiveCampaignsCache().catch(() => {});
      if (var2) await ProductVariant.deleteOne({ _id: var2._id });
      if (prod1) await Product.deleteOne({ _id: prod1._id });
      if (prod2) await Product.deleteOne({ _id: prod2._id });
      if (unpurchasedProd) await Product.deleteOne({ _id: unpurchasedProd._id });
      if (user) await User.deleteOne({ _id: user._id });
    } finally {
      clearInterval(keepAlive);
      await mongoose.disconnect().catch(() => {});
      await closeRedisConnection().catch(() => {});
    }
  }
});

test('P0 Checkout fails closed on standalone MongoDB when transactions are required', async () => {
  assertQaEnv();
  const prevRequire = process.env.REQUIRE_MONGO_TRANSACTIONS;
  process.env.REQUIRE_MONGO_TRANSACTIONS = 'true';
  const standaloneUri = process.env.LOCAL_DEV_MONGO_URI || process.env.MONGO_CONNECTIONSTRING;
  const parsed = new URL(standaloneUri);
  assert.equal(parsed.port, '27018');
  assert.equal(parsed.pathname, '/atelier_verite_qa');

  const [{ createOrder }, { Product }, { Order }] = await Promise.all([
    import('./commands/createOrder.command.js'),
    import('../products/product.model.js'),
    import('./order.model.js'),
  ]);
  await mongoose.connect(standaloneUri);
  let isolatedProd;
  const keepAlive = setInterval(() => {}, 5000);
  try {
    const unique = `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const source = await Product.findOne({ slug: /^qa-product-image-/ }).lean();
    isolatedProd = await Product.create({
      name: `QA FailClosed ${unique}`,
      slug: `qa-failclosed-${unique}`,
      category_id: source?.category_id || new mongoose.Types.ObjectId(),
      displayProduct: source?.displayProduct || [],
      old_price: 200000,
      new_price: 150000,
      stock: 5,
      sold: 0,
      is_active: true,
    });

    const userId = new mongoose.Types.ObjectId();
    await assert.rejects(
      createOrder(userId, {
        items: [{ product_id: String(isolatedProd._id), quantity: 1 }],
        shipping_address: {
          full_name: 'QA FailClosed',
          phone: '0901234567',
          city: 'HCM',
          district: 'D1',
          ward: 'BN',
          address_detail: '123 Street',
        },
        payment_method: 'cod',
      }),
      (err) => err.statusCode === 503 && err.code === 'TRANSACTION_REQUIRED'
    );
    assert.equal((await Product.findById(isolatedProd._id).lean()).stock, 5);
    assert.equal(await Order.countDocuments({ user_id: userId }), 0);
  } finally {
    clearInterval(keepAlive);
    if (isolatedProd) await Product.deleteOne({ _id: isolatedProd._id });
    if (prevRequire === undefined) delete process.env.REQUIRE_MONGO_TRANSACTIONS;
    else process.env.REQUIRE_MONGO_TRANSACTIONS = prevRequire;
    await mongoose.disconnect();
  }
});
