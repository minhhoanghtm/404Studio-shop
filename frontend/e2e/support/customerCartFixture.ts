import { execFileSync } from 'node:child_process';
import path from 'node:path';

export type CustomerCartFixture = { slug: string; name: string; productId: string; variantId: string; variant2Id: string; reservationId?: string; cartId: string | null; totals: { total_items: number; total_price: number } | null };

export const customerCartFixture = (mode: 'create' | 'cleanup', fixture?: CustomerCartFixture): any => {
  const args = ['--env-file=.env.qa', 'src/scripts/qa-customer-cart-fixture.mjs', mode];
  if (fixture) args.push(JSON.stringify(fixture));
  const output = execFileSync(process.execPath, args, { cwd: path.resolve(process.cwd(), '../backend'), env: process.env, encoding: 'utf8', timeout: 30000 });
  const line = output.split(/\r?\n/).findLast((item) => item.startsWith('{'));
  if (!line) throw new Error('QA fixture did not return its identifiers.');
  return JSON.parse(line);
};
