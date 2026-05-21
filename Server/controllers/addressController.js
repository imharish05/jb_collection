const sequelize = require("../config/database");
const Address   = require("../models/Address");

// ── GET /api/address ───────────────────────────────────────────────────────────
// Returns all addresses that belong to the authenticated user (req.user.id).
// The WHERE clause ensures a user can never see another user's addresses.
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where:  { userId: req.user.id },
      order:  [["createdAt", "DESC"]],
    });
    res.json(addresses);
  } catch (err) {
    console.error("getAddresses:", err);
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
};

// ── POST /api/address ──────────────────────────────────────────────────────────
// Creates a new address for the current user.
// If isDefault is true, all other addresses for this user are unset first
// (done inside a transaction so it's atomic).
exports.addAddress = async (req, res) => {
  const {
    addressType, fullName, phone, pincode,
    street, apartment, city, state, country, isDefault,
  } = req.body;

  // ── Validation ─────────────────────────────────────────────────────────────
  const required = { fullName, phone, pincode, street, city, state };
  for (const [field, val] of Object.entries(required)) {
    if (!String(val ?? "").trim()) {
      return res.status(400).json({ message: `${field} is required` });
    }
  }
  if (String(phone).replace(/\D/g, "").length < 10)
    return res.status(400).json({ message: "Enter a valid 10-digit phone number" });
  if (String(pincode).replace(/\D/g, "").length < 6)
    return res.status(400).json({ message: "Enter a valid 6-digit pincode" });

  const t = await sequelize.transaction();
  try {
    // If this is the user's first address, force it as default
    const count = await Address.count({ where: { userId: req.user.id }, transaction: t });
    const makeDefault = count === 0 ? true : !!isDefault;

    // Clear existing default before setting a new one
    if (makeDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id }, transaction: t }
      );
    }

    const address = await Address.create(
      {
        userId:      req.user.id,
        addressType: addressType || "Home",
        fullName:    fullName.trim(),
        phone:       String(phone).trim(),
        pincode:     String(pincode).trim(),
        street:      street.trim(),
        apartment:   apartment?.trim() || "",
        city:        city.trim(),
        state:       state.trim(),
        country:     country?.trim() || "India",
        isDefault:   makeDefault,
      },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json(address);
  } catch (err) {
    await t.rollback();
    console.error("addAddress:", err);
    res.status(500).json({ message: "Failed to save address" });
  }
};

// ── PUT /api/address/:id ───────────────────────────────────────────────────────
// Updates an existing address. The userId check prevents a user from editing
// another user's address even if they know the UUID.
exports.updateAddress = async (req, res) => {
  const {
    addressType, fullName, phone, pincode,
    street, apartment, city, state, country, isDefault,
  } = req.body;

  // ── Validation ─────────────────────────────────────────────────────────────
  const required = { fullName, phone, pincode, street, city, state };
  for (const [field, val] of Object.entries(required)) {
    if (!String(val ?? "").trim()) {
      return res.status(400).json({ message: `${field} is required` });
    }
  }
  if (String(phone).replace(/\D/g, "").length < 10)
    return res.status(400).json({ message: "Enter a valid 10-digit phone number" });
  if (String(pincode).replace(/\D/g, "").length < 6)
    return res.status(400).json({ message: "Enter a valid 6-digit pincode" });

  const t = await sequelize.transaction();
  try {
    // Ownership check — userId must match the logged-in user
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.id },
      transaction: t,
    });
    if (!address) {
      await t.rollback();
      return res.status(404).json({ message: "Address not found" });
    }

    // If promoting to default, strip default from all other addresses first
    if (isDefault && !address.isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id }, transaction: t }
      );
    }

    await address.update(
      {
        addressType: addressType || address.addressType,
        fullName:    fullName.trim(),
        phone:       String(phone).trim(),
        pincode:     String(pincode).trim(),
        street:      street.trim(),
        apartment:   apartment?.trim() || "",
        city:        city.trim(),
        state:       state.trim(),
        country:     country?.trim() || "India",
        isDefault:   !!isDefault,
      },
      { transaction: t }
    );

    await t.commit();
    res.json(address);
  } catch (err) {
    await t.rollback();
    console.error("updateAddress:", err);
    res.status(500).json({ message: "Failed to update address" });
  }
};

// ── DELETE /api/address/:id ────────────────────────────────────────────────────
// Deletes the address. If it was the default, auto-promotes the most recent
// remaining address to default so the user always has a default.
exports.deleteAddress = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.id },
      transaction: t,
    });
    if (!address) {
      await t.rollback();
      return res.status(404).json({ message: "Address not found" });
    }

    const wasDefault = address.isDefault;
    await address.destroy({ transaction: t });

    // Promote next address to default if the deleted one was the default
    if (wasDefault) {
      const next = await Address.findOne({
        where: { userId: req.user.id },
        order: [["createdAt", "DESC"]],
        transaction: t,
      });
      if (next) await next.update({ isDefault: true }, { transaction: t });
    }

    await t.commit();
    res.json({ message: "Address removed successfully" });
  } catch (err) {
    await t.rollback();
    console.error("deleteAddress:", err);
    res.status(500).json({ message: "Failed to remove address" });
  }
};

// ── PATCH /api/address/:id/default ────────────────────────────────────────────
// Atomically sets one address as default and clears isDefault on all others
// for this user. Uses a transaction to guarantee consistency.
exports.setDefaultAddress = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, userId: req.user.id },
      transaction: t,
    });
    if (!address) {
      await t.rollback();
      return res.status(404).json({ message: "Address not found" });
    }

    // Clear default on ALL of this user's addresses first
    await Address.update(
      { isDefault: false },
      { where: { userId: req.user.id }, transaction: t }
    );

    // Then set the requested one as default
    await address.update({ isDefault: true }, { transaction: t });

    await t.commit();
    res.json(address);
  } catch (err) {
    await t.rollback();
    console.error("setDefaultAddress:", err);
    res.status(500).json({ message: "Failed to set default address" });
  }
};