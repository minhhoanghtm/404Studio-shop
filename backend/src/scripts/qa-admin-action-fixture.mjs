import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

let api; let uri; let redis;
try { api = new URL(process.env.QA_API_URL || ''); uri = new URL(process.env.LOCAL_DEV_MONGO_URI || process.env.MONGO_CONNECTIONSTRING || ''); redis = process.env.REDIS_URL ? new URL(process.env.REDIS_URL) : { hostname: process.env.REDIS_HOST || '', port: process.env.REDIS_PORT || '' }; } catch { throw new Error('QA fixture guard refused configuration.'); }
if (process.env.APP_ENV !== 'qa' || process.env.QA_E2E_ENABLED !== 'true' || api.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(api.hostname) || api.port !== '5002' || api.pathname !== '/api' || !['127.0.0.1', 'localhost'].includes(uri.hostname) || uri.port !== '27018' || uri.pathname !== '/atelier_verite_qa' || !['127.0.0.1', 'localhost'].includes(redis.hostname) || redis.port !== '6381' || !process.env.QA_SEED_PASSWORD) throw new Error('QA fixture guard refused target.');
const login = await fetch(`${api.origin}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'qa.superadmin@atelier.local', passWord: process.env.QA_SEED_PASSWORD }) });
if (!login.ok) throw new Error('QA login failed.');
const token = (await login.json()).data.accessToken;
const response = await fetch(`${api.origin}/api/admin/ai/qa-context`, { headers: { Authorization: `Bearer ${token}` } });
const context = (await response.json()).data;
if (!response.ok || context?.environment !== 'qa' || context.database !== 'atelier_verite_qa' || context.databasePort !== 27018 || !context.redisQa) throw new Error('QA runtime verification failed.');
const adminId = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET).userId;
const [{ default: agent }, { default: Conversation }, { default: Audit }, { default: Voucher }, { default: History }, { closeRedisConnection }] = await Promise.all([import('../modules/ai/services/adminAiAgent.service.js'), import('../modules/ai/models/adminAiConversation.model.js'), import('../modules/ai/models/adminAiAuditLog.model.js'), import('../modules/vouchers/voucher.model.js'), import('../modules/vouchers/voucherHistory.model.js'), import('../configs/redis.js')]);
await mongoose.connect(uri.toString());
try {
  if (mongoose.connection.name !== 'atelier_verite_qa' || mongoose.connection.port !== 27018) throw new Error('QA database verification failed.');
  if (['create', 'create-campaign', 'create-promotion', 'create-description', 'create-banner'].includes(process.argv[2])) {
    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
    const promotion = process.argv[2] === 'create-promotion';
    const campaign = process.argv[2] === 'create-campaign' || promotion;
    const isDescription = process.argv[2] === 'create-description';
    const isBanner = process.argv[2] === 'create-banner';
    const code = campaign ? `qa-campaign-${suffix.toLowerCase()}` : isDescription ? `qa-desc-${suffix.toLowerCase()}` : isBanner ? `qa-banner-${suffix.toLowerCase()}` : `QAV${suffix}`;
    const title = `QA Action ${suffix}`;
    let proposal;
    let productId;
    if (isDescription) {
      const { Product } = await import('../modules/products/product.model.js');
      const source = await Product.findOne({ slug: /^qa-product-image-/ }).lean();
      if (!source) throw new Error('QA catalog fixture missing.');
      const prod = await Product.create({ name: title, slug: code, category_id: source.category_id, displayProduct: source.displayProduct, old_price: 100000, new_price: 90000, stock: 5, description: 'Mô tả ban đầu', is_active: true });
      productId = String(prod._id);
      proposal = await agent.executeTool('prepare_product_description', { productId, description: `Mô tả mới ${suffix}` }, { userId: adminId, role: 'admin', email: 'qa-fixture@atelier.local' });
    } else if (isBanner) {
      const { default: Banner } = await import('../modules/banners/banner.model.js');
      const sourceBanner = await Banner.findOne({ title: 'QA Winter Asset Banner' }).lean();
      if (!sourceBanner?.imageUrl) throw new Error('QA banner fixture missing.');
      proposal = await agent.executeTool('prepare_banner_publication', { title, imageUrl: sourceBanner.imageUrl }, { userId: adminId, role: 'admin', email: 'qa-fixture@atelier.local' });
    } else {
      proposal = await agent.executeTool(promotion ? 'prepare_promotion' : campaign ? 'prepare_campaign' : 'prepare_voucher', campaign ? { name: title, slug: code, type: promotion ? 'seasonal' : 'flash_sale', startAt: new Date(Date.now() + 86400000).toISOString(), endAt: new Date(Date.now() + 172800000).toISOString(), ...(promotion ? { discountRule: { scope: 'all', discountType: 'percentage', discountValue: 12 } } : {}) } : { code, discountValue: 10 }, { userId: adminId, role: 'admin', email: 'qa-fixture@atelier.local' });
    }
    const conv = await Conversation.create({ adminId, title, mode: 'auto', messages: [{ role: 'assistant', content: 'Bản nháp đang chờ xác nhận.', cardType: 'confirmation_required', cardData: proposal, actionProposal: proposal }] });
    console.log(JSON.stringify({ code, title, actionId: proposal.actionId, conversationId: String(conv._id), campaign, isDescription, isBanner, ...(productId ? { productId } : {}) }));
  } else if (process.argv[2] === 'cleanup') {
    const fixture = JSON.parse(process.argv[3] || '{}');
    const validCode = fixture.campaign ? /^qa-campaign-[a-z0-9]{8,30}$/.test(fixture.code) : fixture.isDescription ? /^qa-desc-[a-z0-9]{8,30}$/.test(fixture.code) : fixture.isBanner ? /^qa-banner-[a-z0-9]{8,30}$/.test(fixture.code) : /^QAV[A-Z0-9]{8,30}$/.test(fixture.code);
    if (!validCode || !/^ACT_\d+_[a-f0-9]{8}$/.test(fixture.actionId) || !mongoose.isValidObjectId(fixture.conversationId) || !/^QA Action [A-Z0-9]{8,30}$/.test(fixture.title)) throw new Error('QA fixture cleanup refused identifiers.');
    if (fixture.campaign) { const { default: Campaign } = await import('../modules/campaigns/campaign.model.js'); await Campaign.deleteOne({ slug: fixture.code, name: fixture.title, createdBy: adminId, status: 'draft' }); }
    else if (fixture.isDescription && fixture.productId) { const { Product } = await import('../modules/products/product.model.js'); await Product.deleteOne({ _id: fixture.productId, slug: fixture.code }); }
    else if (fixture.isBanner) { const { default: Banner } = await import('../modules/banners/banner.model.js'); await Banner.deleteOne({ title: fixture.title, isActive: false }); }
    else { const voucherIds = (await Voucher.find({ code: fixture.code }).select('_id').lean()).map((item) => item._id); if (voucherIds.length) { await History.deleteMany({ voucherId: { $in: voucherIds } }); await Voucher.deleteMany({ _id: { $in: voucherIds }, code: fixture.code }); } }
    await Audit.deleteMany({ actionId: fixture.actionId, adminId });
    await Conversation.deleteOne({ _id: fixture.conversationId, adminId, title: fixture.title });
    console.log(JSON.stringify({ cleaned: true }));
  } else throw new Error('Unknown QA fixture command.');
} finally { await mongoose.disconnect(); await closeRedisConnection(); }
