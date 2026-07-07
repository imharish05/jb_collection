const { DataTypes, Op } = require("sequelize");
const ReferenceSequence = require("../models/ReferenceSequence");

const PREFIX = "JBH";
const WIDTH = 6;
const REFERENCE_SLUG_FIELD = "referenceSlug";

const formatReferenceSlug = (num) => `${PREFIX}${String(num).padStart(WIDTH, "0")}`;

const normalizeReferenceSlug = (value) => {
  if (!value) return value;
  const text = String(value).trim().toUpperCase();
  const match = text.match(/^(?:KGF|JBH)-?(\d+)$/);
  if (!match) return text;
  return formatReferenceSlug(parseInt(match[1], 10));
};

const getReferenceNumber = (value) => {
  const normalized = normalizeReferenceSlug(value);
  const match = String(normalized || "").match(/^(?:KGF|JBH)(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
};

const createSequenceRows = async (count, transaction) => {
  for (let i = 0; i < count; i += 1) {
    await ReferenceSequence.create({}, { transaction });
  }
};

const nextReferenceSlug = async (transaction) => {
  const seq = await ReferenceSequence.create({}, { transaction });
  return formatReferenceSlug(seq.id);
};

const referenceWhere = (identifier) => {
  const raw = String(identifier || "").trim();
  const normalized = normalizeReferenceSlug(raw);
  const refs = Array.from(new Set([raw, normalized].filter(Boolean)));
  return {
    [Op.or]: [
      { id: raw },
      ...(refs.length ? [{ referenceSlug: { [Op.in]: refs } }] : []),
    ],
  };
};

const getDisplayReference = (record, fallback = "") => {
  const data = record && typeof record.get === "function" ? record.get({ plain: true }) : (record || {});
  return (
    normalizeReferenceSlug(data.referenceSlug || data.reference_slug || data.orderNumber || data.order_number || data.displayId) ||
    fallback
  );
};

const addDisplayAliases = (values, modelName) => {
  const ref = getDisplayReference(values);
  if (!ref) return values;

  values.referenceSlug = ref;
  values.displayId = ref;

  if (modelName === "Order") values.orderNumber = ref;
  if (modelName === "Return") values.returnNumber = ref;

  return values;
};

const attachReferenceSlug = (model) => {
  if (!model || model.rawAttributes[REFERENCE_SLUG_FIELD]) return;

  model.rawAttributes[REFERENCE_SLUG_FIELD] = {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    field: "reference_slug",
  };
  model.refreshAttributes();

  const assignSlug = async (instance, options = {}) => {
    if (!instance || instance.getDataValue(REFERENCE_SLUG_FIELD)) return;
    instance.setDataValue(REFERENCE_SLUG_FIELD, await nextReferenceSlug(options.transaction));
  };

  model.addHook("beforeCreate", "assignReferenceSlug", assignSlug);
  model.addHook("beforeBulkCreate", "assignBulkReferenceSlugs", async (instances, options = {}) => {
    for (const instance of instances || []) {
      await assignSlug(instance, options);
    }
  });

  const originalToJSON = model.prototype.toJSON;
  model.prototype.toJSON = function toJSONWithReferenceSlug() {
    const values = originalToJSON
      ? originalToJSON.call(this)
      : { ...this.get({ plain: true }) };
    return addDisplayAliases(values, model.name);
  };
};

const attachReferenceSlugs = (models) => {
  // Only transactional models that actually have a reference_slug column
  // in the database should receive this attribute. All config/lookup tables
  // must be listed here to prevent Sequelize from querying non-existent columns.
  const excluded = new Set([
    "sequelize",
    "Sequelize",
    "ReferenceSequence",
    // Config / lookup tables — no reference_slug column in DB
    "DeliveryZone",
    "Role",
    "Font",
    "SiteSetting",
    "InventorySettings",
    "Brand",
    "Category",
    "SubCategory",
    "SubSubCategory",
    "Event",
    "Combo",
    "OfferBanner",
    "MarqueeMessage",
    "HeroSlide",
    "Testimonial",
    "Blog",
    "Contact",
    "Coupon",
    "Notification",
    "StockHistory",
    "InventoryLog",
    "CartItem",
    "WishlistItem",
    "Address",
    "Review",
    "OrderStatusEmailAudit",
    "PasswordResetOtp",
    "TimelineMilestone",
    "ReturnMedia",
    "OrderItem",
  ]);
  Object.entries(models || {}).forEach(([name, model]) => {
    if (excluded.has(name)) return;
    if (!model || typeof model.refreshAttributes !== "function") return;
    attachReferenceSlug(model);
  });
};

const getModelOrder = (model) => {
  if (model.rawAttributes.createdAt) return [["createdAt", "ASC"]];
  const pk = model.primaryKeyAttribute || "id";
  return [[pk, "ASC"]];
};

const getHighestExistingReference = async (models) => {
  let max = 0;
  const withSlug = Object.values(models || {}).filter(
    (model) => model && model.rawAttributes && model.rawAttributes[REFERENCE_SLUG_FIELD]
  );

  for (const model of withSlug) {
    const rows = await model.findAll({
      attributes: [REFERENCE_SLUG_FIELD],
      where: { [REFERENCE_SLUG_FIELD]: { [Op.ne]: null } },
      raw: true,
    });
    rows.forEach((row) => {
      max = Math.max(max, getReferenceNumber(row[REFERENCE_SLUG_FIELD]));
    });
  }

  return max;
};

const ensureSequenceFloor = async (models, transaction) => {
  const highestExisting = await getHighestExistingReference(models);
  const currentSequence = await ReferenceSequence.max("id", { transaction });
  const current = parseInt(currentSequence || 0, 10);
  if (highestExisting > current) {
    await createSequenceRows(highestExisting - current, transaction);
  }
};

const backfillReferenceSlugs = async (models) => {
  await ensureSequenceFloor(models);

  const withSlug = Object.values(models || {}).filter(
    (model) => model && model.rawAttributes && model.rawAttributes[REFERENCE_SLUG_FIELD]
  );

  for (const model of withSlug) {
    const pk = model.primaryKeyAttribute || "id";
    const missing = await model.findAll({
      attributes: [pk],
      where: {
        [Op.or]: [
          { [REFERENCE_SLUG_FIELD]: null },
          { [REFERENCE_SLUG_FIELD]: "" },
        ],
      },
      order: getModelOrder(model),
      raw: true,
    });

    for (const row of missing) {
      const slug = await nextReferenceSlug();
      await model.update(
        { [REFERENCE_SLUG_FIELD]: slug },
        {
          where: { [pk]: row[pk] },
          hooks: false,
          individualHooks: false,
        }
      );
    }
  }
};

module.exports = {
  PREFIX,
  WIDTH,
  formatReferenceSlug,
  normalizeReferenceSlug,
  nextReferenceSlug,
  referenceWhere,
  getDisplayReference,
  attachReferenceSlugs,
  backfillReferenceSlugs,
};
