const { Op } = require("sequelize");
const Coupon = require("../models/Coupon");

// GET /coupons/admin/all
const getAll = async (req, res) => {
  try {
    const data = await Coupon.findAll({ order: [["createdAt", "DESC"]] });
    res.json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /coupons/active  — public, for cart page display
const getActive = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { expires_at: null },
          { expires_at: { [Op.gt]: now } },
        ],
      },
      attributes: ["id", "code", "type", "value", "min_order", "max_discount", "expires_at"],
      order: [["value", "DESC"]],
    });
    res.json(coupons);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// POST /coupons/admin/create
const create = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PUT /coupons/admin/update/:id
const update = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Not found" });
    await coupon.update(req.body);
    res.json(coupon);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// DELETE /coupons/admin/delete/:id
const remove = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Not found" });
    await coupon.destroy();
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /coupons/validate  (for customer checkout)
const validate = async (req, res) => {
  try {
    const { code, order_total } = req.body;
    const coupon = await Coupon.findOne({ where: { code, is_active: true } });
    if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
      return res.status(400).json({ message: "Coupon has expired" });
    if (order_total < coupon.min_order)
      return res.status(400).json({ message: `Minimum order of ₹${coupon.min_order} required` });

    let discount = coupon.type === "percent"
      ? (order_total * coupon.value) / 100
      : parseFloat(coupon.value);

    if (coupon.max_discount) discount = Math.min(discount, parseFloat(coupon.max_discount));
    res.json({ valid: true, discount: parseFloat(discount.toFixed(2)), coupon_code: coupon.code, type: coupon.type, value: parseFloat(coupon.value) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// Seed real coupons if none exist
const seedCoupons = async () => {
  try {
    const count = await Coupon.count();
    if (count > 0) return;

    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    const oneYear = new Date();
    oneYear.setFullYear(oneYear.getFullYear() + 1);

    await Coupon.bulkCreate([
      {
        code: "WELCOME10",
        type: "percent",
        value: 10,
        min_order: 0,
        max_discount: 200,
        expires_at: oneYear,
        is_active: true,
      },
      {
        code: "KAMALI15",
        type: "percent",
        value: 15,
        min_order: 500,
        max_discount: 300,
        expires_at: sixMonths,
        is_active: true,
      },
      {
        code: "SAVE50",
        type: "flat",
        value: 50,
        min_order: 300,
        max_discount: null,
        expires_at: sixMonths,
        is_active: true,
      },
      {
        code: "FLAT100",
        type: "flat",
        value: 100,
        min_order: 599,
        max_discount: null,
        expires_at: oneYear,
        is_active: true,
      },
      {
        code: "FESTIVAL20",
        type: "percent",
        value: 20,
        min_order: 800,
        max_discount: 500,
        expires_at: sixMonths,
        is_active: true,
      },
      {
        code: "GIFT5",
        type: "percent",
        value: 5,
        min_order: 0,
        max_discount: 100,
        expires_at: oneYear,
        is_active: true,
      },
    ]);
    console.log("✅ Coupons seeded successfully");
  } catch (e) {
    console.error("❌ Coupon seed failed:", e.message);
  }
};

module.exports = { getAll, getActive, create, update, remove, validate, seedCoupons };
