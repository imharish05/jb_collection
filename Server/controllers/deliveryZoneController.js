const DeliveryZone = require("../models/DeliveryZone");
const { Op } = require("sequelize");

// GET all (admin)
exports.getAll = async (req, res) => {
  try {
    const zones = await DeliveryZone.findAll({ order: [["state", "ASC"]] });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET all active (public — used by client at checkout)
exports.getActive = async (req, res) => {
  try {
    const zones = await DeliveryZone.findAll({
      where: { status: "Active" },
      order: [["state", "ASC"]],
    });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET charge for a specific state (public)
exports.getCharge = async (req, res) => {
  try {
    const { state } = req.params;
    const zone = await DeliveryZone.findOne({
      where: { state: { [Op.like]: state }, status: "Active" },
    });
    res.json({ charge: zone ? parseFloat(zone.deliveryCharge) : 0, zone });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST create
exports.create = async (req, res) => {
  try {
    const { state, deliveryCharge, status } = req.body;
    if (!state || deliveryCharge === undefined) {
      return res.status(400).json({ message: "State and delivery charge are required" });
    }
    const zone = await DeliveryZone.create({ state, deliveryCharge, status: status || "Active" });
    res.status(201).json(zone);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT update
exports.update = async (req, res) => {
  try {
    const zone = await DeliveryZone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ message: "Zone not found" });
    const { state, deliveryCharge, status } = req.body;
    await zone.update({ state, deliveryCharge, status });
    res.json(zone);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE
exports.remove = async (req, res) => {
  try {
    const zone = await DeliveryZone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ message: "Zone not found" });
    await zone.destroy();
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
