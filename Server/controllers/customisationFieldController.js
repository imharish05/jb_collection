const { CustomisationField } = require("../models");

// safely parse a value that might be a JSON string or already an array/object
function safeParse(val, fallback = null) {
  if (val === null || val === undefined) return fallback;
  if (Array.isArray(val) || (typeof val === 'object')) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return fallback;
}

// GET /api/customisation-fields
// Public — for product pages to fetch the available fields
const getAllFields = async (req, res, next) => {
  try {
    const activeOnly = req.query.active !== "false";
    const where = activeOnly ? { isActive: true } : {};
    const fields = await CustomisationField.findAll({
      where,
      order: [
        ["sortOrder", "ASC"],
        ["id", "ASC"],
      ],
    });
    
    const parsed = fields.map(f => {
      const row = f.toJSON();
      row.options = safeParse(row.options, null);
      return row;
    });

    return res.json(parsed);
  } catch (err) {
    next(err);
  }
};

// POST /api/customisation-fields — admin
const createField = async (req, res, next) => {
  try {
    const { key, label, placeholder, icon, inputType, options, isRequired, sortOrder } = req.body;
    if (!key || !key.trim()) return res.status(400).json({ message: "Field key is required" });
    if (!label || !label.trim()) return res.status(400).json({ message: "Field label is required" });

    const existing = await CustomisationField.findOne({ where: { key: key.trim().toLowerCase() } });
    if (existing) return res.status(400).json({ message: "A field with this key already exists" });

    const field = await CustomisationField.create({
      key: key.trim().toLowerCase(),
      label: label.trim(),
      placeholder: placeholder?.trim() || null,
      icon: icon?.trim() || null,
      inputType: inputType || "text",
      options: Array.isArray(options) ? options : null,
      isRequired: !!isRequired,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      isActive: true,
    });

    const row = field.toJSON();
    row.options = safeParse(row.options, null);
    return res.status(201).json(row);
  } catch (err) {
    next(err);
  }
};

// PUT /api/customisation-fields/:id — admin
const updateField = async (req, res, next) => {
  try {
    const field = await CustomisationField.findByPk(req.params.id);
    if (!field) return res.status(404).json({ message: "Field not found" });

    const { key, label, placeholder, icon, inputType, options, isActive, isRequired, sortOrder } = req.body;

    // Unique key check
    if (key && key.trim().toLowerCase() !== field.key) {
      const dup = await CustomisationField.findOne({ where: { key: key.trim().toLowerCase() } });
      if (dup && dup.id !== field.id) {
        return res.status(400).json({ message: "A field with this key already exists" });
      }
    }

    await field.update({
      key: key !== undefined ? key.trim().toLowerCase() : field.key,
      label: label !== undefined ? label.trim() : field.label,
      placeholder: placeholder !== undefined ? placeholder?.trim() || null : field.placeholder,
      icon: icon !== undefined ? icon?.trim() || null : field.icon,
      inputType: inputType !== undefined ? inputType : field.inputType,
      options: options !== undefined ? (Array.isArray(options) ? options : null) : field.options,
      isActive: isActive !== undefined ? !!isActive : field.isActive,
      isRequired: isRequired !== undefined ? !!isRequired : field.isRequired,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : field.sortOrder,
    });

    const row = field.toJSON();
    row.options = safeParse(row.options, null);
    return res.json(row);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/customisation-fields/:id — admin
const deleteField = async (req, res, next) => {
  try {
    const field = await CustomisationField.findByPk(req.params.id);
    if (!field) return res.status(404).json({ message: "Field not found" });
    await field.destroy();
    return res.json({ message: "Field deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllFields, createField, updateField, deleteField };
