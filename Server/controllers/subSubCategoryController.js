const { SubSubCategory, SubCategory, Category } = require("../models/Category");

const pick = (obj, keys) =>
  keys.reduce((acc, k) => (obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});

// GET /api/categories/subsubcategories
const getAllSubSubCategories = async (req, res) => {
  try {
    const { active, subCategoryId } = req.query;
    const where = {};
    if (active !== undefined) where.isActive = active === "true";
    if (subCategoryId) where.subCategoryId = subCategoryId;

    const subsubcategories = await SubSubCategory.findAll({
      where,
      include: [{
        model: SubCategory,
        as: "subcategory",
        attributes: ["id", "label", "value", "categoryId"],
        include: [{
          model: Category,
          as: "category",
          attributes: ["id", "label", "value"]
        }]
      }],
      order: [["sortOrder", "ASC"]],
    });

    return res.status(200).json({ success: true, data: subsubcategories });
  } catch (error) {
    console.error("getAllSubSubCategories error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getSubSubCategoryById = async (req, res) => {
  try {
    const subsub = await SubSubCategory.findByPk(req.params.id, {
      include: [{
        model: SubCategory,
        as: "subcategory",
        attributes: ["id", "label", "value", "categoryId"],
        include: [{
          model: Category,
          as: "category",
          attributes: ["id", "label", "value"]
        }]
      }]
    });
    if (!subsub) return res.status(404).json({ success: false, message: "SubSubCategory not found" });
    return res.status(200).json({ success: true, data: subsub });
  } catch (error) {
    console.error("getSubSubCategoryById error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const createSubSubCategory = async (req, res) => {
  try {
    const allowed = pick(req.body, ["subCategoryId", "label", "value", "isActive"]);
    if (!allowed.label)
      return res.status(400).json({ success: false, message: "label is required" });
    if (!allowed.subCategoryId)
      return res.status(400).json({ success: false, message: "subCategoryId is required" });

    // Verify parent subcategory exists
    const parent = await SubCategory.findByPk(allowed.subCategoryId);
    if (!parent)
      return res.status(404).json({ success: false, message: "Parent Sub-Category not found" });

    const count = await SubSubCategory.count({ where: { subCategoryId: allowed.subCategoryId } });
    allowed.sortOrder = count + 1;

    const subsub = await SubSubCategory.create(allowed);
    return res.status(201).json({ success: true, data: subsub });
  } catch (error) {
    console.error("createSubSubCategory error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateSubSubCategory = async (req, res) => {
  try {
    const subsub = await SubSubCategory.findByPk(req.params.id);
    if (!subsub) return res.status(404).json({ success: false, message: "SubSubCategory not found" });

    const allowed = pick(req.body, ["subCategoryId", "label", "value", "sortOrder", "isActive"]);

    if (allowed.subCategoryId && allowed.subCategoryId !== subsub.subCategoryId) {
      const parent = await SubCategory.findByPk(allowed.subCategoryId);
      if (!parent)
        return res.status(404).json({ success: false, message: "Parent Sub-Category not found" });
    }

    await subsub.update(allowed);
    return res.status(200).json({ success: true, data: subsub });
  } catch (error) {
    console.error("updateSubSubCategory error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteSubSubCategory = async (req, res) => {
  try {
    const subsub = await SubSubCategory.findByPk(req.params.id);
    if (!subsub) return res.status(404).json({ success: false, message: "SubSubCategory not found" });
    await subsub.destroy();
    return res.status(200).json({ success: true, message: "SubSubCategory deleted successfully" });
  } catch (error) {
    console.error("deleteSubSubCategory error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getAllSubSubCategories,
  getSubSubCategoryById,
  createSubSubCategory,
  updateSubSubCategory,
  deleteSubSubCategory,
};
