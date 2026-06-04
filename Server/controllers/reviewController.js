const { Review, User, Product, ChildCombo, Order, OrderItem } = require("../models");

const DELIVERED_STATUS = "delivered";
const DELIVERED_ONLY_MESSAGE = "You can review this product only after it has been delivered.";
const NOT_ELIGIBLE_MESSAGE = "You are not eligible to review this product.";
const DUPLICATE_REVIEW_MESSAGE = "You have already reviewed this product.";
const COMBO_DELIVERED_ONLY_MESSAGE = "You can review this combo only after it has been delivered.";
const COMBO_NOT_ELIGIBLE_MESSAGE = "You are not eligible to review this combo.";
const COMBO_DUPLICATE_REVIEW_MESSAGE = "You have already reviewed this combo.";

const normalizeStatus = (status) =>
  String(status || "").trim().toLowerCase().replace(/\s+/g, "_");

const getEffectiveItemStatus = (item) =>
  normalizeStatus(item.status) || normalizeStatus(item.Order?.status);

const findExistingProductReview = (customerId, productId) =>
  Review.findOne({ where: { customerId, productId } });

const findExistingComboReview = (customerId, childComboId) =>
  Review.findOne({ where: { customerId, childComboId } });

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

const checkComboReviewEligibility = async ({ userId, childComboId }) => {
  const childCombo = await ChildCombo.findByPk(childComboId, { attributes: ["id"] });
  if (!childCombo) {
    return { eligible: false, message: COMBO_NOT_ELIGIBLE_MESSAGE };
  }

  const orderItems = await OrderItem.findAll({
    where: { childComboId, isCombo: true },
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
    return { eligible: false, message: COMBO_NOT_ELIGIBLE_MESSAGE };
  }

  const deliveredItem = orderItems.find(
    (item) => getEffectiveItemStatus(item) === DELIVERED_STATUS
  );

  if (!deliveredItem) {
    return { eligible: false, message: COMBO_DELIVERED_ONLY_MESSAGE };
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
      include: [
        { model: User, as: "Customer", attributes: ["id", "name", "email"] },
        { model: Product, as: "product", attributes: ["id", "name"] },
        { model: ChildCombo, as: "childCombo", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /reviews/combo/:childComboId - client: approved reviews for a child combo
const getByCombo = async (req, res) => {
  try {
    const { childComboId } = req.params;
    const data = await Review.findAll({
      where: { childComboId, status: "Approved" },
      include: [{ model: User, as: "Customer", attributes: ["id", "name"] }],
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

// GET /reviews/combo/eligibility/:childComboId - client: can current user review this combo?
const getComboEligibility = async (req, res) => {
  try {
    const { childComboId } = req.params;

    if (!childComboId) {
      return res.status(400).json({ message: "childComboId is required" });
    }

    const existingReview = await findExistingComboReview(req.user.id, childComboId);
    if (existingReview) {
      return res.json({
        eligible: false,
        hasReviewed: true,
        message: COMBO_DUPLICATE_REVIEW_MESSAGE,
      });
    }

    const eligibility = await checkComboReviewEligibility({
      userId: req.user.id,
      childComboId,
    });

    return res.json({ ...eligibility, hasReviewed: false });
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
    const { productId, childComboId, feedback, rating } = req.body;

    if ((!productId && !childComboId) || !feedback || !rating) {
      return res.status(400).json({ message: "productId or childComboId, feedback and rating are required" });
    }

    if (productId && childComboId) {
      return res.status(400).json({ message: "Review either a product or a combo, not both" });
    }

    const ratingValue = Number(rating);
    if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }

    const customerId = req.user.id;

    const existingReview = childComboId
      ? await findExistingComboReview(customerId, childComboId)
      : await findExistingProductReview(customerId, productId);

    if (existingReview) {
      return res.status(409).json({ message: childComboId ? COMBO_DUPLICATE_REVIEW_MESSAGE : DUPLICATE_REVIEW_MESSAGE });
    }

    const eligibility = childComboId
      ? await checkComboReviewEligibility({ userId: customerId, childComboId })
      : await checkReviewEligibility({ userId: customerId, productId });

    if (!eligibility.eligible) {
      return res.status(403).json({ message: eligibility.message });
    }

    const review = await Review.create({
      productId: productId || null,
      childComboId: childComboId || null,
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

module.exports = { getAll, getByProduct, getByCombo, getEligibility, getComboEligibility, create, update, remove };
