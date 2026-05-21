const express = require("express");
const router = express.Router();
const { getAll } = require("../controllers/customerController");

router.get("/", getAll);

module.exports = router;
