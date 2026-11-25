import mongoose from 'mongoose';
import { mock } from 'node:test';
import { verifyQaSuiteTarget } from '../modules/ai/__tests__/qaSuiteGuard.mjs';

const uri = await verifyQaSuiteTarget();
const [{ default: service }, { default: router }, { default: Design }, { default: User }, { closeRedisConnection }] = await Promise.all([
  import('../modules/ai/services/adminImageGeneration.service.js'), import('../modules/ai/services/aiRouter.service.js'), import('../modules/ai/models/adminDesignProject.model.js'), import('../modules/users/user.model.js'), import('../configs/redis.js'),
]);
await mongoose.connect(uri);
try {
  if (mongoose.connection.name !== 'atelier_verite_qa' || mongoose.connection.port !== 27018) throw new Error('QA database verification failed.');
  const admin = await User.findOne({ email: 'qa.superadmin@atelier.local' }).lean();
  if (!admin) throw new Error('QA admin missing.');
  if (process.argv[2] === 'create') {
    const title = `QA Layout ${Date.now()} ${Math.random().toString(36).slice(2, 8)}`;
    const provider = mock.method(router, 'executeImageGenerationWithFallback', async () => { throw new Error('QA isolated unavailable provider'); });
    try {
      const layout = await service.generatePosterPipeline({ title, authContext: { userId: admin._id } });
      if (layout.generationType !== 'AI_ASSISTED_LAYOUT') throw new Error('Unexpected generation type.');
      console.log(JSON.stringify({ id: String(layout.designId), name: layout.name, title }));
    } finally { provider.mock.restore(); }
  } else if (process.argv[2] === 'cleanup') {
    const fixture = JSON.parse(process.argv[3] || '{}');
    if (!mongoose.isValidObjectId(fixture.id) || !/^QA Layout \d{10,} [a-z0-9]{6}$/.test(fixture.title) || !fixture.name?.startsWith(`Poster — ${fixture.title} (`)) throw new Error('QA fixture cleanup refused identifiers.');
    await Design.deleteOne({ _id: fixture.id, adminId: admin._id, name: fixture.name });
    console.log(JSON.stringify({ cleaned: true }));
  } else throw new Error('Unknown fixture command.');
} finally { await mongoose.disconnect(); await closeRedisConnection(); }
