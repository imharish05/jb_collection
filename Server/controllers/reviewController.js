const { Review, User, Product, Order, OrderItem } = require("../models");

const DELIVERED_STATUS = "delivered";
const DELIVERED_ONLY_MESSAGE = "You can review this product only after it has been delivered.";
const NOT_ELIGIBLE_MESSAGE = "You are not eligible to review this product.";
const DUPLICATE_REVIEW_MESSAGE = "You have already reviewed this product.";

const normalizeStatus = (status) =>
  String(status || "").trim().toLowerCase().replace(/\s+/g, "_");

const getEffectiveItemStatus = (item) =>
  normalizeStatus(item.status) || normalizeStatus(item.Order?.status);

const findExistingProductReview = (customerId, productId) =>
  Review.findOne({ where: { customerId, productId } });

const checkReviewEligibility = async ({ userId, productId }) => {
  const product = await Product.findByPk(productId, { attributes: ["id"] });
  if (!product) {
    return { eligible: false, message: NOT_ELIGIBLE_MESSAGE };
  }

  const orderItems = await OrderItem.findAll({
    where: { productId },
    include: [
      {
        model: Order,
        required: true,
        where: { userId },
        attributes: ["id", "userId", "status"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  if (!orderItems.length) {
    return { eligible: false, message: NOT_ELIGIBLE_MESSAGE };
  }

  const deliveredItem = orderItems.find(
    (item) => getEffectiveItemStatus(item) === DELIVERED_STATUS
  );

  if (!deliveredItem) {
    return { eligible: false, message: DELIVERED_ONLY_MESSAGE };
  }

  return {
    eligible: true,
    message: "Eligible to review.",
    orderId: deliveredItem.Order?.id,
    orderItemId: deliveredItem.id,
    status: getEffectiveItemStatus(deliveredItem),
  };
};

// GET /reviews - admin: all reviews
const getAll = async (req, res) => {
  try {
    const data = await Review.findAll({
      include: [{ model: User, as: "Customer", attributes: ["id", "name", "email"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /reviews/product/:productId - client: approved reviews for a product
const getByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const data = await Review.findAll({
      where: { productId, status: "Approved" },
      include: [{ model: User, as: "Customer", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /reviews/eligibility/:productId - client: can current user review this product?
const getEligibility = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const existingReview = await findExistingProductReview(req.user.id, productId);
    if (existingReview) {
      return res.json({
        eligible: false,
        hasReviewed: true,
        message: DUPLICATE_REVIEW_MESSAGE,
      });
    }

    const eligibility = await checkReviewEligibility({
      userId: req.user.id,
      productId,
    });

    return res.json({ ...eligibility, hasReviewed: false });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// POST /reviews - client: submit a review for a delivered purchased item
const create = async (req, res) => {
  try {
    const { productId, feedback, rating } = req.body;

    if (!productId || !feedback || !rating) {
      return res.status(400).json({ message: "productId, feedback and rating are required" });
    }

    const ratingValue = Number(rating);
    if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }

    const customerId = req.user.id;

    const existingReview = await findExistingProductReview(customerId, productId);
    if (existingReview) {
      return res.status(409).json({ message: DUPLICATE_REVIEW_MESSAGE });
    }

    const eligibility = await checkReviewEligibility({
      userId: customerId,
      productId,
    });

    if (!eligibility.eligible) {
      return res.status(403).json({ message: eligibility.message });
    }

    const review = await Review.create({
      productId,
      customerId,
      guestName: null,
      feedback: String(feedback).trim(),
      rating: ratingValue,
      status: "Pending",
    });

    res.status(201).json(review);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PUT /reviews/update/:id - admin: approve / reject
const update = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: "Not found" });
    await review.update(req.body);
    res.json(review);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// DELETE /reviews/:id - admin
const remove = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: "Not found" });
    await review.destroy();
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { getAll, getByProduct, getEligibility, create, update, remove };
