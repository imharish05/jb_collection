const { SubCategory, Category } = require("../models/Category");

const pick = (obj, keys) =>
  keys.reduce((acc, k) => (obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});

// GET /api/nav/subcategories  — all active subcategories grouped by category
const getAllSubCategories = async (req, res) => {
  try {
    const { active, categoryId } = req.query;
    const where = {};
    if (active !== undefined) where.isActive = active === "true";
    if (categoryId) where.categoryId = categoryId;

    const subcategories = await SubCategory.findAll({
      where,
      include: [{ model: Category, as: "category", attributes: ["id", "label", "value"] }],
      order: [["sortOrder", "ASC"]],
    });

    return res.status(200).json({ success: true, data: subcategories });
  } catch (error) {
    console.error("getAllSubCategories error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getSubCategoryById = async (req, res) => {
  try {
    const sub = await SubCategory.findByPk(req.params.id, {
      include: [{ model: Category, as: "category", attributes: ["id", "label", "value"] }],
    });
    if (!sub) return res.status(404).json({ success: false, message: "SubCategory not found" });
    return res.status(200).json({ success: true, data: sub });
  } catch (error) {
    console.error("getSubCategoryById error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const createSubCategory = async (req, res) => {
  try {
    const allowed = pick(req.body, ["categoryId", "label", "value", "isActive"]);
    if (!allowed.label)
      return res.status(400).json({ success: false, message: "label is required" });
    if (!allowed.categoryId)
      return res.status(400).json({ success: false, message: "categoryId is required" });

    // Verify parent category exists
    const parent = await Category.findByPk(allowed.categoryId);
    if (!parent)
      return res.status(404).json({ success: false, message: "Parent category not found" });

    const count = await SubCategory.count({ where: { categoryId: allowed.categoryId } });
    allowed.sortOrder = count + 1;

    const sub = await SubCategory.create(allowed);
    return res.status(201).json({ success: true, data: sub });
  } catch (error) {
    console.error("createSubCategory error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateSubCategory = async (req, res) => {
  try {
    const sub = await SubCategory.findByPk(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: "SubCategory not found" });

    const allowed = pick(req.body, ["categoryId", "label", "value", "sortOrder", "isActive"]);

    if (allowed.categoryId && allowed.categoryId !== sub.categoryId) {
      const parent = await Category.findByPk(allowed.categoryId);
      if (!parent)
        return res.status(404).json({ success: false, message: "Parent category not found" });
    }

    await sub.update(allowed);
    return res.status(200).json({ success: true, data: sub });
  } catch (error) {
    console.error("updateSubCategory error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteSubCategory = async (req, res) => {
  try {
    const sub = await SubCategory.findByPk(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: "SubCategory not found" });
    await sub.destroy();
    return res.status(200).json({ success: true, message: "SubCategory deleted successfully" });
  } catch (error) {
    console.error("deleteSubCategory error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getAllSubCategories,
  getSubCategoryById,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
};
