if (typeof db === "undefined" || db.getName() !== "atelier_verite_qa") {
  throw new Error("QA_SEED_REFUSED: mongosh seed script requires atelier_verite_qa.");
}

const voucherResult = db.vouchers.insertOne({
  code: "WELCOMETO404",
  name: "Welcome to 404 Studio",
  description: "Chào mừng bạn đến với 404 Studio",
  discountType: "fixed",
  discountValue: 100000,
  minOrderValue: 500000,
  maxUses: 100,
  usedCount: 0,
  isActive: true,
  startDate: new Date(),
  endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  createdAt: new Date(),
  updatedAt: new Date(),
});

console.log(
  "Voucher WELCOMETO404 đã được thêm vào cơ sở dữ liệu:",
  voucherResult,
);