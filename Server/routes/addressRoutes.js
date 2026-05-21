const express = require("express");
const router  = express.Router();
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/addressController");

// Every address route requires a valid JWT — the token tells the backend


// GET    /api/address              → all addresses for the logged-in user
router.get("/",                getAddresses);

// POST   /api/address              → create a new address
router.post("/",               addAddress);

// PUT    /api/address/:id          → update an address (ownership verified in controller)
router.put("/:id",             updateAddress);

// DELETE /api/address/:id          → delete an address (ownership verified in controller)
router.delete("/:id",          deleteAddress);

// PATCH  /api/address/:id/default  → set as default (clears all others atomically)
router.patch("/:id/default",   setDefaultAddress);

module.exports = router;