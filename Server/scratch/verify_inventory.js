/**
 * verify_inventory.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Automated integration test for the inventory & payment management system.
 *
 * Usage:
 *   node Server/scratch/verify_inventory.js
 *
 * Requires the server to be running and accessible on the configured BASE_URL.
 * Set TEST_USER_TOKEN to a valid JWT for an existing test user account.
 * ─────────────────────────────────────────────────────────────────────────────
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const axios = require("axios");
const { sequelize, Order, OrderItem, Product, Variant, InventoryLog, CartItem } = require("../models");

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL   = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}/api`;
const AUTH_TOKEN = process.env.TEST_USER_TOKEN || "";
const TEST_USER_ID = process.env.TEST_USER_ID || null;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
  validateStatus: () => true, // never throw on HTTP errors — we handle them manually
});

// ── Test state ────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const results = [];

function assert(name, condition, detail = "") {
  const status = condition ? "✅ PASS" : "❌ FAIL";
  results.push({ name, status, detail });
  if (condition) passed++;
  else failed++;
  console.log(`  ${status} — ${name}${detail ? ` (${detail})` : ""}`);
}

// ── Helper: get fresh DB values ───────────────────────────────────────────────
async function getProductStock(productId, variantId = null) {
  if (variantId) {
    const v = await Variant.findByPk(variantId);
    return v ? Number(v.stock) : null;
  }
  const p = await Product.findByPk(productId);
  return p ? Number(p.stock) : null;
}

async function getOrder(orderId) {
  return Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: "items" }],
  });
}

async function getInventoryLogs(orderId) {
  return InventoryLog.findAll({ where: { orderId } });
}

// ── Test Suites ───────────────────────────────────────────────────────────────

/**
 * SUITE 1: Verify that stock is NOT deducted when a Razorpay order is created
 * but payment is not verified (simulates abandoned checkout).
 */
async function suite1_StockNotDeductedOnOrderCreate() {
  console.log("\n━━━ Suite 1: Stock NOT deducted on order creation (online payment) ━━━");

  // Find a simple product with stock > 0
  const product = await Product.findOne({ where: { isActive: true }, order: [["id", "ASC"]] });
  if (!product || Number(product.stock) <= 0) {
    console.log("  ⚠️  No active product with stock available — skipping Suite 1");
    return;
  }

  const stockBefore = Number(product.stock);
  console.log(`  Product: "${product.name}" (id=${product.id}), stock before: ${stockBefore}`);

  // Create an order with online payment method (does NOT deduct stock)
  const orderRes = await api.post("/orders", {
    items: [{ productId: product.id, quantity: 1, price: product.price, isCombo: false }],
    totalAmount: product.price,
    shippingAddressId: null,
    billingAddressId: null,
    paymentMethod: "upi",
    couponCode: null,
    couponDiscount: 0,
    shippingCharge: 0,
  });

  if (orderRes.status !== 201 && orderRes.status !== 200) {
    assert("Order creation returns 200/201", false, `Got ${orderRes.status}: ${JSON.stringify(orderRes.data)}`);
    return;
  }

  const orderId = orderRes.data?.id || orderRes.data?.orderId;
  assert("Order creation returns 200/201", !!orderId, `orderId=${orderId}`);

  // Check stock after order creation — must be unchanged
  const stockAfterCreate = await getProductStock(product.id);
  assert(
    "Stock unchanged after order creation (before payment)",
    stockAfterCreate === stockBefore,
    `before=${stockBefore}, after=${stockAfterCreate}`
  );

  // Check inventoryProcessed flag
  const order = await getOrder(orderId);
  assert("order.inventoryProcessed is false before payment", order?.inventoryProcessed === false);
  assert("order.status is pending_payment", order?.status === "pending_payment" || order?.paymentStatus === "pending");

  // Check no inventory logs created
  const logs = await getInventoryLogs(orderId);
  assert("No InventoryLog entries before payment", logs.length === 0, `Found ${logs.length} log(s)`);

  console.log(`  → Suite 1 complete (orderId=${orderId})`);
  return { orderId, productId: product.id, stockBefore };
}

/**
 * SUITE 2: Verify that stock IS deducted after processSuccessfulPayment is
 * called. We simulate this by calling the internal service directly.
 */
async function suite2_StockDeductedAfterPayment(ctx) {
  console.log("\n━━━ Suite 2: Stock deducted after successful payment (direct service call) ━━━");

  if (!ctx?.orderId) {
    console.log("  ⚠️  No orderId from Suite 1 — skipping Suite 2");
    return;
  }

  const { orderId, productId, stockBefore } = ctx;

  // Directly invoke processSuccessfulPayment (bypasses Razorpay, tests the core logic)
  const { processSuccessfulPayment } = require("../controllers/paymentController");
  const result = await processSuccessfulPayment(orderId, `test_pay_${Date.now()}`, "test_suite", false);

  assert("processSuccessfulPayment returns success=true", result.success === true, result.message);

  const stockAfterPayment = await getProductStock(productId);
  assert(
    "Stock decremented by 1 after payment",
    stockAfterPayment === stockBefore - 1,
    `before=${stockBefore}, after=${stockAfterPayment}`
  );

  // Check inventoryProcessed flag is now true
  const order = await getOrder(orderId);
  assert("order.inventoryProcessed is true after payment", order?.inventoryProcessed === true);
  assert("order.status is confirmed after payment", order?.status === "confirmed");

  // Check inventory log was created
  const logs = await getInventoryLogs(orderId);
  assert("InventoryLog entry created after payment", logs.length >= 1, `Found ${logs.length} log(s)`);
  if (logs.length > 0) {
    assert("Log quantityChanged is -1", Number(logs[0].quantityChanged) === -1);
    assert("Log paymentSource is test_suite", logs[0].paymentSource === "test_suite");
  }

  return { orderId, productId, stockBefore };
}

/**
 * SUITE 3: Idempotency — calling processSuccessfulPayment twice must NOT
 * deduct stock a second time.
 */
async function suite3_IdempotencyCheck(ctx) {
  console.log("\n━━━ Suite 3: Idempotency — double payment call does NOT double-deduct ━━━");

  if (!ctx?.orderId) {
    console.log("  ⚠️  No orderId from Suite 2 — skipping Suite 3");
    return;
  }

  const { orderId, productId, stockBefore } = ctx;

  const stockBeforeSecondCall = await getProductStock(productId);
  const logsBefore = await getInventoryLogs(orderId);

  // Call processSuccessfulPayment a second time — should be a no-op
  const { processSuccessfulPayment } = require("../controllers/paymentController");
  const result2 = await processSuccessfulPayment(orderId, `test_pay_dupe_${Date.now()}`, "test_suite_dupe", false);

  assert("Second call returns success=true (idempotent)", result2.success === true, result2.message);
  assert("Second call message indicates already processed", result2.message?.toLowerCase().includes("already"), result2.message);

  const stockAfterSecondCall = await getProductStock(productId);
  const logsAfter = await getInventoryLogs(orderId);

  assert(
    "Stock unchanged after duplicate payment call",
    stockAfterSecondCall === stockBeforeSecondCall,
    `before second call=${stockBeforeSecondCall}, after=${stockAfterSecondCall}`
  );
  assert(
    "No new InventoryLog entries on duplicate call",
    logsAfter.length === logsBefore.length,
    `before=${logsBefore.length}, after=${logsAfter.length}`
  );
}

/**
 * SUITE 4: Cancellation restores stock once, and is idempotent on repeat.
 */
async function suite4_CancellationRestoresStock(ctx) {
  console.log("\n━━━ Suite 4: Cancellation restores stock (idempotent) ━━━");

  if (!ctx?.orderId) {
    console.log("  ⚠️  No orderId from Suite 3 — skipping Suite 4");
    return;
  }

  const { orderId, productId, stockBefore } = ctx;
  const stockBeforeCancel = await getProductStock(productId);

  // Cancel the order via the API
  const cancelRes = await api.put(`/orders/${orderId}/status`, { status: "cancelled" });
  assert(
    "Cancel API returns 200",
    cancelRes.status === 200,
    `Got ${cancelRes.status}: ${JSON.stringify(cancelRes.data)}`
  );

  const stockAfterCancel = await getProductStock(productId);
  assert(
    "Stock restored to pre-payment level after cancellation",
    stockAfterCancel === stockBeforeCancel + 1,
    `before cancel=${stockBeforeCancel}, after=${stockAfterCancel}, expected=${stockBeforeCancel + 1}`
  );

  const order = await getOrder(orderId);
  assert("order.inventoryRestored is true after cancellation", order?.inventoryRestored === true);
  assert("order.status is cancelled", order?.status === "cancelled");

  // Cancel again — must be idempotent
  const cancelRes2 = await api.put(`/orders/${orderId}/status`, { status: "cancelled" });
  const stockAfterDoubleCancel = await getProductStock(productId);
  assert(
    "Double cancellation does NOT restore stock again",
    stockAfterDoubleCancel === stockAfterCancel,
    `after first cancel=${stockAfterCancel}, after second cancel=${stockAfterDoubleCancel}`
  );
}

/**
 * SUITE 5: COD order — stock deducted immediately at order creation.
 */
async function suite5_CodOrderDeductsImmediately() {
  console.log("\n━━━ Suite 5: COD order deducts stock immediately at creation ━━━");

  const product = await Product.findOne({ where: { isActive: true }, order: [["id", "DESC"]] });
  if (!product || Number(product.stock) <= 0) {
    console.log("  ⚠️  No active product with stock — skipping Suite 5");
    return;
  }

  const stockBefore = Number(product.stock);
  console.log(`  Product: "${product.name}" (id=${product.id}), stock before: ${stockBefore}`);

  const orderRes = await api.post("/orders", {
    items: [{ productId: product.id, quantity: 1, price: product.price, isCombo: false }],
    totalAmount: product.price,
    shippingAddressId: null,
    billingAddressId: null,
    paymentMethod: "cod",
    couponCode: null,
    couponDiscount: 0,
    shippingCharge: 0,
  });

  if (orderRes.status !== 201 && orderRes.status !== 200) {
    assert("COD order creation returns 200/201", false, `Got ${orderRes.status}: ${JSON.stringify(orderRes.data)}`);
    return;
  }

  const orderId = orderRes.data?.id || orderRes.data?.orderId;
  assert("COD order creation returns 200/201", !!orderId, `orderId=${orderId}`);

  const stockAfterCreate = await getProductStock(product.id);
  assert(
    "Stock decremented immediately for COD order",
    stockAfterCreate === stockBefore - 1,
    `before=${stockBefore}, after=${stockAfterCreate}`
  );

  const order = await getOrder(orderId);
  assert("order.inventoryProcessed is true for COD", order?.inventoryProcessed === true);
  assert("order.status is confirmed/processing for COD", ["confirmed", "processing"].includes(order?.status));

  const logs = await getInventoryLogs(orderId);
  assert("InventoryLog entry created for COD order at creation", logs.length >= 1);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Kamali Gifts — Inventory & Payment Verification Suite");
  console.log(`  API: ${BASE_URL}`);
  console.log("═══════════════════════════════════════════════════════════════");

  if (!AUTH_TOKEN) {
    console.warn("\n⚠️  TEST_USER_TOKEN is not set in environment. Auth-protected tests will fail.");
    console.warn("   Set it in .env as TEST_USER_TOKEN=<your_jwt_token>\n");
  }

  try {
    await sequelize.authenticate();
    console.log("\n✅ Database connection OK\n");

    const ctx1 = await suite1_StockNotDeductedOnOrderCreate();
    const ctx2 = await suite2_StockDeductedAfterPayment(ctx1);
    await suite3_IdempotencyCheck(ctx2);
    await suite4_CancellationRestoresStock(ctx2);
    await suite5_CodOrderDeductsImmediately();
  } catch (err) {
    console.error("\n❌ Fatal error during test execution:", err.message);
    if (process.env.NODE_ENV !== "production") console.error(err.stack);
  } finally {
    await sequelize.close();
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  RESULTS SUMMARY");
  console.log("═══════════════════════════════════════════════════════════════");
  results.forEach((r) => console.log(`  ${r.status} — ${r.name}`));
  console.log("───────────────────────────────────────────────────────────────");
  console.log(`  Total: ${passed + failed}  |  Passed: ${passed}  |  Failed: ${failed}`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

main();
