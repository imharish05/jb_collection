const Review = require("../models/Review");
const User = require("../models/User");

// GET /reviews  — admin: all reviews
const getAll = async (req, res) => {
  try {
    const data = await Review.findAll({
      include: [{ model: User, as: "Customer", attributes: ["id", "name", "email"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /reviews/product/:productId  — client: approved reviews for a product
const getByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const data = await Review.findAll({
      where: { productId, status: "Approved" },
      include: [{ model: User, as: "Customer", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /reviews  — client: submit a review (logged-in or guest)
const create = async (req, res) => {
  try {
    const { productId, feedback, rating, guestName } = req.body;
    if (!productId || !feedback || !rating) {
      return res.status(400).json({ message: "productId, feedback and rating are required" });
    }

    const customerId = req.user?.id || null; // set by protect middleware if logged in

    const review = await Review.create({
      productId,
      customerId,
      guestName: customerId ? null : (guestName || "Guest"),
      feedback,
      rating: parseFloat(rating),
      status: "Pending",   // admin must approve before showing
    });

    res.status(201).json(review);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PUT /reviews/update/:id  — admin: approve / reject
const update = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: "Not found" });
    await review.update(req.body);
    res.json(review);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// DELETE /reviews/:id  — admin
const remove = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: "Not found" });
    await review.destroy();
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { getAll, getByProduct, create, update, remove };