const Review = require("../models/Review");
const User = require("../models/User");

// GET /reviews
const getAll = async (req, res) => {
  try {
    const data = await Review.findAll({
      include: [{ model: User, as: "Customer", attributes: ["id", "name", "email"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PUT /reviews/update/:id  (approve / reject)
const update = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: "Not found" });
    await review.update(req.body);
    res.json(review);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// DELETE /reviews/:id
const remove = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: "Not found" });
    await review.destroy();
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { getAll, update, remove };
