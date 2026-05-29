const { DeliveryZone, DeliveryZonePincode } = require("../models");

const normalizePin = (p) => String(p || "").replace(/\D/g, "").slice(0, 6);

async function matchZoneByPincode({ pincode, country = "India", state = null, city = null }) {
  const pin = normalizePin(pincode);
  if (pin.length !== 6) return null;

  // Prefer explicit pincode mappings first (fast + deterministic)
  const pinMatches = await DeliveryZonePincode.findAll({
    where: { pincode: pin, enabled: true },
    include: [{ model: DeliveryZone, as: "zone" }],
  });

  const zones = pinMatches
    .map((m) => m.zone)
    .filter((z) => z && z.enabled)
    .filter((z) => Array.isArray(z.countries) ? z.countries.includes(country) : true)
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));

  if (zones.length) return zones[0];

  // Fallback: match by state/city lists (for zones without bulk pincodes)
  const all = await DeliveryZone.findAll({ where: { enabled: true } });
  const candidates = all
    .filter((z) => Array.isArray(z.countries) ? z.countries.includes(country) : true)
    .filter((z) => {
      const states = Array.isArray(z.states) ? z.states : [];
      const cities = Array.isArray(z.cities) ? z.cities : [];
      const stateOk = !states.length || (state && states.includes(state));
      const cityOk = !cities.length || (city && cities.includes(city));
      return stateOk && cityOk;
    })
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));

  return candidates[0] || null;
}

module.exports = {
  normalizePin,
  matchZoneByPincode,
};

