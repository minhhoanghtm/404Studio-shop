import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateQaTargetConfig, verifyQaSuiteTarget } from './qaSuiteGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '../../../..');

function withEnv(overrides, fn) {
  const saved = {};
  for (const [key, val] of Object.entries(overrides)) {
    saved[key] = process.env[key];
    if (val === undefined) delete process.env[key];
    else process.env[key] = val;
  }
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const [key, val] of Object.entries(saved)) {
        if (val === undefined) delete process.env[key];
        else process.env[key] = val;
      }
    });
}

test('QA suite guard rejects wrong API, MongoDB, Redis, env, and unapproved live providers without leaking secrets', async () => {
  const configuredBackendPort = Number(process.env.BACKEND_PORT || process.env.PORT);
  const wrongBackendPort = configuredBackendPort + 1;
  const configuredMongoPort = Number(process.env.MONGO_PORT);
  const wrongMongoPort = configuredMongoPort + 1;
  const configuredRedisPort = Number(process.env.REDIS_PORT);
  const wrongRedisPort = configuredRedisPort + 1;

  await withEnv({ QA_API_URL: `http://127.0.0.1:${wrongBackendPort}/api` }, async () => {
    await assert.rejects(verifyQaSuiteTarget(), /refused target/);
  });

  await withEnv({ QA_API_URL: undefined }, async () => {
    await assert.rejects(verifyQaSuiteTarget(), /refused target/);
  });

  await withEnv({ APP_ENV: 'development' }, async () => {
    await assert.rejects(verifyQaSuiteTarget(), /refused target/);
  });

  await withEnv({ QA_E2E_ENABLED: undefined }, async () => {
    await assert.rejects(verifyQaSuiteTarget(), /refused target/);
  });

  await withEnv(
    {
      LOCAL_DEV_MONGO_URI: `mongodb://127.0.0.1:${wrongMongoPort}/atelier_verite_test`,
      MONGO_CONNECTIONSTRING: `mongodb://127.0.0.1:${wrongMongoPort}/atelier_verite_test`,
      MONGO_URI: undefined,
    },
    async () => {
      await assert.rejects(verifyQaSuiteTarget(), /refused target/);
    }
  );

  await withEnv(
    {
      MONGO_DATABASE: 'webfashion_prod',
    },
    async () => {
      await assert.rejects(verifyQaSuiteTarget(), /refused target/);
    }
  );

  await withEnv(
    {
      LOCAL_DEV_MONGO_URI: undefined,
      MONGO_CONNECTIONSTRING: undefined,
      MONGO_URI: undefined,
    },
    async () => {
      await assert.rejects(verifyQaSuiteTarget(), /refused target/);
    }
  );

  await withEnv(
    {
      REDIS_URL: `redis://127.0.0.1:${wrongRedisPort}`,
      REDIS_HOST: '127.0.0.1',
    },
    async () => {
      await assert.rejects(verifyQaSuiteTarget(), /refused target/);
    }
  );

  await withEnv(
    {
      REDIS_URL: undefined,
      REDIS_HOST: undefined,
      REDIS_PORT: undefined,
    },
    async () => {
      await assert.rejects(verifyQaSuiteTarget(), /refused target/);
    }
  );

  const secretProbe = 'SuperSecretQaProbeValue999!';
  await withEnv(
    {
      QA_SEED_PASSWORD: secretProbe,
      QA_ALLOW_LIVE_PROVIDER_TESTS: undefined,
    },
    async () => {
      let thrown;
      try {
        await verifyQaSuiteTarget({ liveProviders: true });
      } catch (err) {
        thrown = err;
      }
      assert.ok(thrown);
      assert.match(thrown.message, /budget authorization/);
      assert.equal(thrown.message.includes(secretProbe), false);
    }
  );

  const cfg = validateQaTargetConfig();
  assert.equal(cfg.mongoUri.pathname, `/${process.env.MONGO_DATABASE}`);
  assert.equal(cfg.redis.port, String(configuredRedisPort));
  assert.equal(cfg.api.port, String(configuredBackendPort));

  const uri = await verifyQaSuiteTarget();
  assert.equal(new URL(uri).pathname, `/${process.env.MONGO_DATABASE}`);
});

test('guarded seed, mutation, AI provider scripts, and runner fail closed when target is non-QA or unconfigured', () => {
  const nonQaEnv = {
    ...process.env,
    APP_ENV: 'development',
    QA_E2E_ENABLED: 'false',
    LOCAL_DEV_MONGO_URI: 'mongodb://127.0.0.1/webfashion_dev',
    MONGO_CONNECTIONSTRING: 'mongodb://127.0.0.1/webfashion_dev',
    MONGO_URI: 'mongodb://127.0.0.1/webfashion_dev',
    QA_API_URL: 'http://127.0.0.1/api',
    REDIS_URL: 'redis://127.0.0.1',
  };
  delete nonQaEnv.QA_ALLOW_LIVE_PROVIDER_TESTS;

  const scriptsToTest = [
    'src/scripts/seed-roles-and-admin.js',
    'seed/seed-demo-catalog.js',
    'src/scripts/sync-vectors.js',
    'src/modules/ai/__tests__/test_providers_live.mjs',
    'src/scripts/qa-node-test-runner.mjs',
  ];

  for (const rel of scriptsToTest) {
    const res = spawnSync(process.execPath, [rel], {
      cwd: backendRoot,
      env: nonQaEnv,
      encoding: 'utf8',
    });
    assert.notEqual(res.status, 0, `${rel} must fail closed on non-QA target`);
    assert.match(`${res.stdout}\n${res.stderr}`, /refused|budget authorization|QA/i);
  }
});
