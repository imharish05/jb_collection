const { getPickupLocations, getShippingRates } = require("../utils/shiprocket");

// Helper: find pincode from location name
async function getPickupPincode() {
  const locations = await getPickupLocations();
  const targetName = (process.env.SHIPROCKET_PICKUP_LOCATION || "").toLowerCase();

  const match = locations.find(
    (loc) => (loc.pickup_location || "").toLowerCase() === targetName
  );

  if (!match) {
    const available = locations.map((l) => l.pickup_location).join(", ");
    throw new Error(
      `Pickup location "${process.env.SHIPROCKET_PICKUP_LOCATION}" not found. Available: ${available}`
    );
  }

  return match.pin_code;
}

// GET /api/shipping/rates?pincode=641104&weight=0.5&cod=true
const getRates = async (req, res) => {
  try {
    const { pincode, weight = 0.5, cod = "false" } = req.query;

    if (!pincode || String(pincode).length !== 6) {
      return res.status(400).json({ message: "Valid 6-digit pincode required" });
    }

    const pickupPincode = await getPickupPincode();

    const couriers = await getShippingRates({
      pickupPincode,
      deliveryPincode: pincode,
      weight: Number(weight),
      cod: cod === "true",
    });

    if (!couriers.length) {
      return res.json({
        serviceable: false,
        message: "No couriers available for this pincode",
        charge: 0,
      });
    }

    // Pick cheapest courier
    const cheapest = couriers.sort(
      (a, b) => a.rate - b.rate
    )[0];

    return res.json({
      serviceable: true,
      charge: cheapest.rate,
      courier: cheapest.courier_name,
      estimatedDays: cheapest.estimated_delivery_days,
      allCouriers: couriers.map((c) => ({
        name: c.courier_name,
        charge: c.rate,
        days: c.estimated_delivery_days,
      })),
    });
  } catch (err) {
    console.error("[Shipping] getRates error:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { getRates };