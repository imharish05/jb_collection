// controllers/shippingController.js

// GET /api/shipping/rates?pincode=641104&weight=0.5&cod=true
const getRates = async (req, res) => {
  try {
    const { pincode } = req.query;

    if (!pincode || String(pincode).length !== 6) {
      return res.status(400).json({ message: "Valid 6-digit pincode required" });
    }

    // Since Shiprocket is removed, all pincodes are serviceable with a flat/free shipping rate
    return res.json({
      serviceable: true,
      charge: 0,
      courier: "Standard Shipping",
      estimatedDays: 5,
      allCouriers: [
        {
          name: "Standard Shipping",
          charge: 0,
          days: 5,
        }
      ],
    });
  } catch (err) {
    console.error("[Shipping] getRates error:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { getRates };