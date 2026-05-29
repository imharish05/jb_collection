const { ShippingSetting, DeliveryZone, DeliveryZonePincode } = require("../models");
const { normalizePin, matchZoneByPincode } = require("../utils/shippingEngine");

const pickPublicSettings = (s) => ({
  provider: s.provider,
  autoCreateShipment: s.autoCreateShipment,
  autoAssignCourier: s.autoAssignCourier,
  autoGenerateAwb: s.autoGenerateAwb,
  defaultWeight: s.defaultWeight,
  defaultDimensions: s.defaultDimensions,
  defaultPickupLocation: s.defaultPickupLocation,
  shiprocketEmail: s.shiprocketEmail || null,
  hasShiprocketToken: Boolean(s.shiprocketToken),
});

// ── Settings ────────────────────────────────────────────────────────────────
const getSettings = async (req, res, next) => {
  try {
    const [s] = await ShippingSetting.findOrCreate({ where: { id: 1 }, defaults: { id: 1 } });
    return res.json(pickPublicSettings(s));
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const [s] = await ShippingSetting.findOrCreate({ where: { id: 1 }, defaults: { id: 1 } });
    const body = req.body || {};

    // Only admin can set secrets; never echo the raw token back.
    s.provider = "shiprocket";
    if (body.shiprocketEmail !== undefined) s.shiprocketEmail = String(body.shiprocketEmail || "").trim() || null;
    if (body.shiprocketToken !== undefined) s.shiprocketToken = String(body.shiprocketToken || "").trim() || null;
    if (body.autoCreateShipment !== undefined) s.autoCreateShipment = Boolean(body.autoCreateShipment);
    if (body.autoAssignCourier !== undefined) s.autoAssignCourier = Boolean(body.autoAssignCourier);
    if (body.autoGenerateAwb !== undefined) s.autoGenerateAwb = Boolean(body.autoGenerateAwb);
    if (body.defaultWeight !== undefined) s.defaultWeight = Number(body.defaultWeight) || 0.5;
    if (body.defaultDimensions !== undefined) s.defaultDimensions = body.defaultDimensions;
    if (body.defaultPickupLocation !== undefined) s.defaultPickupLocation = body.defaultPickupLocation || null;

    await s.save();
    return res.json(pickPublicSettings(s));
  } catch (err) {
    next(err);
  }
};

// ── Zones ───────────────────────────────────────────────────────────────────
const listZones = async (req, res, next) => {
  try {
    const zones = await DeliveryZone.findAll({
      order: [["priority", "ASC"], ["createdAt", "DESC"]],
      include: [{ model: DeliveryZonePincode, as: "pincodes" }],
    });
    return res.json(zones);
  } catch (err) {
    next(err);
  }
};

const createZone = async (req, res, next) => {
  try {
    const b = req.body || {};
    const zone = await DeliveryZone.create({
      name: b.name,
      enabled: b.enabled !== undefined ? Boolean(b.enabled) : true,
      priority: Number.isFinite(Number(b.priority)) ? Number(b.priority) : 100,
      countries: Array.isArray(b.countries) ? b.countries : ["India"],
      states: Array.isArray(b.states) ? b.states : [],
      cities: Array.isArray(b.cities) ? b.cities : [],
      shippingCharge: Number(b.shippingCharge || 0),
      freeShippingAbove: b.freeShippingAbove != null ? Number(b.freeShippingAbove) : null,
      codAvailable: b.codAvailable !== undefined ? Boolean(b.codAvailable) : true,
      estimatedDays: b.estimatedDays || null,
      remoteSurcharge: b.remoteSurcharge != null ? Number(b.remoteSurcharge) : null,
      notes: b.notes || null,
    });
    return res.status(201).json(zone);
  } catch (err) {
    next(err);
  }
};

const updateZone = async (req, res, next) => {
  try {
    const zone = await DeliveryZone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ message: "Zone not found" });
    const b = req.body || {};
    const assign = (k, v) => { if (v !== undefined) zone[k] = v; };
    assign("name", b.name);
    assign("enabled", b.enabled !== undefined ? Boolean(b.enabled) : undefined);
    assign("priority", b.priority !== undefined ? Number(b.priority) : undefined);
    assign("countries", Array.isArray(b.countries) ? b.countries : undefined);
    assign("states", Array.isArray(b.states) ? b.states : undefined);
    assign("cities", Array.isArray(b.cities) ? b.cities : undefined);
    assign("shippingCharge", b.shippingCharge !== undefined ? Number(b.shippingCharge) : undefined);
    assign("freeShippingAbove", b.freeShippingAbove !== undefined ? (b.freeShippingAbove == null ? null : Number(b.freeShippingAbove)) : undefined);
    assign("codAvailable", b.codAvailable !== undefined ? Boolean(b.codAvailable) : undefined);
    assign("estimatedDays", b.estimatedDays !== undefined ? (b.estimatedDays || null) : undefined);
    assign("remoteSurcharge", b.remoteSurcharge !== undefined ? (b.remoteSurcharge == null ? null : Number(b.remoteSurcharge)) : undefined);
    assign("notes", b.notes !== undefined ? (b.notes || null) : undefined);
    await zone.save();
    return res.json(zone);
  } catch (err) {
    next(err);
  }
};

const deleteZone = async (req, res, next) => {
  try {
    const zone = await DeliveryZone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ message: "Zone not found" });
    await zone.destroy();
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// Bulk import pincodes: accepts { pincodes: ["625001", ...] } or newline/CSV string
const importZonePincodes = async (req, res, next) => {
  try {
    const zone = await DeliveryZone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ message: "Zone not found" });

    const raw = req.body?.pincodes;
    let list = [];
    if (Array.isArray(raw)) list = raw;
    else if (typeof raw === "string") list = raw.split(/[\s,]+/g);

    const cleaned = [...new Set(list.map(normalizePin).filter((p) => p.length === 6))];
    if (!cleaned.length) return res.status(400).json({ message: "No valid pincodes found" });

    const rows = cleaned.map((p) => ({ zoneId: zone.id, pincode: p, enabled: true }));
    await DeliveryZonePincode.bulkCreate(rows, { ignoreDuplicates: true });
    const count = await DeliveryZonePincode.count({ where: { zoneId: zone.id } });
    return res.json({ ok: true, imported: cleaned.length, total: count });
  } catch (err) {
    next(err);
  }
};

// ── Serviceability API (used by checkout + admin test) ──────────────────────
const checkServiceability = async (req, res, next) => {
  try {
    const pincode = normalizePin(req.query.pincode);
    const orderValue = Number(req.query.orderValue || 0);
    const weight = Number(req.query.weight || 0);
    const cod = String(req.query.cod || "false") === "true";

    if (pincode.length !== 6) {
      return res.status(400).json({ serviceable: false, message: "Invalid pincode" });
    }

    const zone = await matchZoneByPincode({ pincode });
    if (!zone) {
      return res.json({ serviceable: false, message: "Not serviceable to this pincode" });
    }

    const freeAbove = zone.freeShippingAbove != null ? Number(zone.freeShippingAbove) : null;
    const baseCharge = Number(zone.shippingCharge || 0) + Number(zone.remoteSurcharge || 0);
    const shippingCharge = freeAbove != null && orderValue >= freeAbove ? 0 : baseCharge;

    const codAvailable = Boolean(zone.codAvailable) && (!cod ? true : Boolean(zone.codAvailable));

    // Shiprocket realtime estimation will be plugged in next (token + rate API).
    return res.json({
      serviceable: true,
      zone: { id: zone.id, name: zone.name, priority: zone.priority },
      estimatedDays: zone.estimatedDays || null,
      courier: null,
      shippingCharge,
      codAvailable,
      weight: Number.isFinite(weight) ? weight : null,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  listZones,
  createZone,
  updateZone,
  deleteZone,
  importZonePincodes,
  checkServiceability,
};

