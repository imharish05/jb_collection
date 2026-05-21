const User = require("../models/User");

// GET /customers
const getAll = async (req, res) => {
  try {
    const data = await User.findAll({
       where: { role: 'user' },
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { getAll };
