import test from "node:test";
import assert from "node:assert/strict";
import { Order } from "../../orders/order.model.js";
import { getRevenueSummary, parsePeriodDates } from "../services/adminAiTools.service.js";

test("revenue summary does not subtract a discount twice from final order totals", async () => {
  const originalAggregate = Order.aggregate;
  // A 100,000 subtotal plus 30,000 shipping less 20,000 discount is 110,000.
  Order.aggregate = async () => [{ totalRevenue: 110000, paidRevenue: 110000, totalOrders: 1, paidOrders: 1, recognizedOrders: 1, totalDiscounts: 20000 }];
  try {
    const result = await getRevenueSummary({ startDate: "2026-01-01T00:00:00.000Z", endDate: "2026-01-02T00:00:00.000Z" });
    assert.equal(result.totalRevenue, 110000);
    assert.equal(result.netRevenue, 110000);
    assert.equal(result.totalDiscounts, 20000);
  } finally {
    Order.aggregate = originalAggregate;
  }
});

test("date-only revenue range covers the complete Vietnam business day", () => {
  const range = parsePeriodDates("custom", "2026-02-03", "2026-02-03");
  assert.equal(range.startDate.toISOString(), "2026-02-02T17:00:00.000Z");
  assert.equal(range.endDate.toISOString(), "2026-02-03T16:59:59.999Z");
  assert.throws(() => parsePeriodDates("custom", "2026-02-31", "2026-03-01"));
  assert.throws(() => parsePeriodDates("custom", "2026-03-02", "2026-03-01"));
});

test("today uses Vietnam midnight independently of host timezone", () => {
  const originalTimezone = process.env.TZ;
  process.env.TZ = "UTC";
  try {
  const vietnam = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const start = new Date(Date.UTC(vietnam.getUTCFullYear(), vietnam.getUTCMonth(), vietnam.getUTCDate()) - 7 * 60 * 60 * 1000);
  assert.equal(parsePeriodDates("today").startDate.toISOString(), start.toISOString());
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ; else process.env.TZ = originalTimezone;
  }
});
