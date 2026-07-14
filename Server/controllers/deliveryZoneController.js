const DeliveryZone = require("../models/DeliveryZone");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// Helper: match pincode against comma-separated list, ranges, or wildcards
const matchPincode = (pincodeToMatch, zonePincodeString) => {
  if (!zonePincodeString) return false;
  const cleanPinToMatch = String(pincodeToMatch).trim().replace(/\D/g, "");
  if (cleanPinToMatch.length !== 6) return false;

  const parts = zonePincodeString.split(",");
  for (let part of parts) {
    part = part.trim();
    if (!part) continue;

    // Wildcard (e.g. 641*)
    if (part.includes("*")) {
      const prefix = part.replace("*", "").trim();
      if (cleanPinToMatch.startsWith(prefix)) {
        return true;
      }
    }
    // Range (e.g. 641001-641010)
    else if (part.includes("-")) {
      const rangeParts = part.split("-");
      if (rangeParts.length === 2) {
        const start = parseInt(rangeParts[0].trim().replace(/\D/g, ""), 10);
        const end = parseInt(rangeParts[1].trim().replace(/\D/g, ""), 10);
        const current = parseInt(cleanPinToMatch, 10);
        if (!isNaN(start) && !isNaN(end) && current >= start && current <= end) {
          return true;
        }
      }
    }
    // Exact match
    else {
      const cleanPart = part.replace(/\D/g, "");
      if (cleanPinToMatch === cleanPart) {
        return true;
      }
    }
  }
  return false;
};

// GET all (admin)
exports.getAll = async (req, res) => {
  try {
    const zones = await DeliveryZone.findAll({ order: [["id", "DESC"]] });
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
      order: [["id", "DESC"]],
    });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET charge for a specific pincode or state (public)
exports.getCharge = async (req, res) => {
  try {
    const { state: paramVal } = req.params; // Keep parameter name state for route compatibility

    // Fetch all active delivery zones
    const zones = await DeliveryZone.findAll({
      where: { status: "Active" },
    });

    // 1. Try to match as pincode
    const cleanPin = String(paramVal).trim().replace(/\D/g, "");
    let matchedZone = null;
    if (cleanPin.length === 6) {
      matchedZone = zones.find(z => matchPincode(cleanPin, z.pincode));
    }

    // 2. Try to match as state (fallback for backward compatibility)
    if (!matchedZone) {
      matchedZone = zones.find(z => z.state && z.state.toLowerCase() === paramVal.toLowerCase());
    }

    if (matchedZone) {
      return res.json({
        charge: parseFloat(matchedZone.deliveryCharge),
        zone: matchedZone,
        serviceable: true
      });
    } else {
      return res.status(404).json({
        message: "This location is not serviceable for delivery",
        serviceable: false
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST create
exports.create = async (req, res) => {
  try {
    const { state, pincode, deliveryCharge, status } = req.body;
    if (!pincode || deliveryCharge === undefined) {
      return res.status(400).json({ message: "Pincode and delivery charge are required" });
    }
    const zone = await DeliveryZone.create({
      state: state || null,
      pincode: pincode,
      deliveryCharge,
      status: status || "Active"
    });
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
    const { state, pincode, deliveryCharge, status } = req.body;
    await zone.update({
      state: state || null,
      pincode,
      deliveryCharge,
      status
    });
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

// POST bulk create (admin)
exports.bulkCreate = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { zones, overwrite } = req.body;
    if (!Array.isArray(zones)) {
      return res.status(400).json({ message: "Invalid payload: zones must be an array" });
    }

    if (overwrite) {
      // Clear all existing zones
      await DeliveryZone.destroy({ where: {}, transaction });
    }

    const processedZones = [];
    for (const item of zones) {
      const { pincode, deliveryCharge, status, state } = item;
      if (!pincode || deliveryCharge === undefined) {
        throw new Error(`Pincode and delivery charge are required for item: ${JSON.stringify(item)}`);
      }

      if (!overwrite) {
        // If not overwriting, look for existing pincode config to update
        const existing = await DeliveryZone.findOne({
          where: { pincode },
          transaction
        });
        if (existing) {
          await existing.update({
            deliveryCharge: parseFloat(deliveryCharge),
            status: status || "Active",
            state: state || null
          }, { transaction });
          processedZones.push(existing);
          continue;
        }
      }

      const zone = await DeliveryZone.create({
        pincode,
        state: state || null,
        deliveryCharge: parseFloat(deliveryCharge),
        status: status || "Active"
      }, { transaction });
      processedZones.push(zone);
    }

    await transaction.commit();
    res.status(201).json({
      message: `Successfully processed ${processedZones.length} zones`,
      count: processedZones.length
    });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ message: err.message });
  }
};
