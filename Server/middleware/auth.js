const jwt = require("jsonwebtoken");
const { User } = require("../models");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

const adminOnly = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const user = await require("../models").User.findByPk(req.user.id, {
      include: [{ model: require("../models").Role, as: "roleRecord" }]
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.status === "inactive") {
      return res.status(403).json({ message: "Your account is inactive. Access denied." });
    }

    // Super admin bypasses all checks
    if ((user.role === "admin" && !user.roleId) || user.roleRecord?.name === "Super Admin") {
      return next();
    }

    if (user.roleId && user.roleRecord) {
      let perms = [];
      const pr = user.roleRecord.permissions;
      if (Array.isArray(pr)) {
        perms = pr;
      } else if (typeof pr === "string") {
        try { perms = JSON.parse(pr); } catch { perms = []; }
      }

      if (perms.includes("*") || perms.includes("super_admin")) {
        return next();
      }

      const method = req.method.toLowerCase();
      const url = (req.baseUrl || "") + (req.path || "");
      let reqPerm = null;

      if (url.includes("/api/products")) {
        if (method === "get") reqPerm = "products_view";
        else if (method === "post") reqPerm = "products_create";
        else if (method === "put" || method === "patch") reqPerm = "products_edit";
        else if (method === "delete") reqPerm = "products_delete";
      } else if (url.includes("/api/combos")) {
        if (method === "get") reqPerm = "combos_view";
        else if (method === "post") reqPerm = "combos_create";
        else if (method === "put" || method === "patch") reqPerm = "combos_edit";
        else if (method === "delete") reqPerm = "combos_delete";
      } else if (url.includes("/api/variants")) {
        if (method === "get") reqPerm = "variants_view";
        else if (method === "post") reqPerm = "variants_create";
        else if (method === "put" || method === "patch") reqPerm = "variants_edit";
        else if (method === "delete") reqPerm = "variants_delete";
      } else if (url.includes("/api/inventory-settings") || url.includes("/api/stock") || url.includes("/api/products/stock")) {
        if (method === "get") reqPerm = "stock_view";
        else reqPerm = "stock_edit";
      } else if (url.includes("/api/categories")) {
        if (method === "get") reqPerm = "categories_view";
        else if (method === "post") reqPerm = "categories_create";
        else if (method === "put" || method === "patch") reqPerm = "categories_edit";
        else if (method === "delete") reqPerm = "categories_delete";
      } else if (url.includes("/api/subcategories") || url.includes("/api/sub_categories")) {
        if (method === "get") reqPerm = "subcategories_view";
        else if (method === "post") reqPerm = "subcategories_create";
        else if (method === "put" || method === "patch") reqPerm = "subcategories_edit";
        else if (method === "delete") reqPerm = "subcategories_delete";
      } else if (url.includes("/api/brands")) {
        if (method === "get") reqPerm = "brands_view";
        else if (method === "post") reqPerm = "brands_create";
        else if (method === "put" || method === "patch") reqPerm = "brands_edit";
        else if (method === "delete") reqPerm = "brands_delete";
      } else if (url.includes("/api/coupons")) {
        if (method === "get") reqPerm = "coupons_view";
        else if (method === "post") reqPerm = "coupons_create";
        else if (method === "put" || method === "patch") reqPerm = "coupons_edit";
        else if (method === "delete") reqPerm = "coupons_delete";
      } else if (url.includes("/api/marketing") || url.includes("/api/nav") || url.includes("/api/testimonials") || url.includes("/api/blogs")) {
        let moduleName = "marquee";
        if (url.includes("/api/blogs")) moduleName = "timeless";
        if (url.includes("/testimonials")) moduleName = "testimonials";
        if (url.includes("/banners") || url.includes("/hero")) moduleName = "banners";
        
        if (method === "get") reqPerm = `${moduleName}_view`;
        else if (method === "post") reqPerm = `${moduleName}_create`;
        else if (method === "put" || method === "patch") reqPerm = `${moduleName}_edit`;
        else if (method === "delete") reqPerm = `${moduleName}_delete`;
      } else if (url.includes("/api/orders")) {
        if (method === "get") reqPerm = "orders_view";
        else reqPerm = "orders_edit";
      } else if (url.includes("/api/returns")) {
        if (method === "get") reqPerm = "returns_view";
        else reqPerm = "returns_edit";
      } else if (url.includes("/api/reviews")) {
        if (method === "get") reqPerm = "reviews_view";
        else if (method === "delete") reqPerm = "reviews_delete";
        else reqPerm = "reviews_edit";
      } else if (url.includes("/api/contact")) {
        if (method === "get") reqPerm = "contacts_view";
        else reqPerm = "contacts_delete";
      } else if (url.includes("/api/customers")) {
        reqPerm = "customers_view";
      } else if (url.includes("/api/dashboard/reports") || url.includes("/api/reports")) {
        if (method === "get") {
          if (perms.includes("reports_view") || perms.includes("reports_export")) {
            return next();
          }
          reqPerm = "reports_view";
        } else {
          reqPerm = "reports_export";
        }
      } else if (url.includes("/api/roles")) {
        if (method === "get") reqPerm = "roles_view";
        else if (method === "post") reqPerm = "roles_create";
        else if (method === "put" || method === "patch") reqPerm = "roles_edit";
        else if (method === "delete") reqPerm = "roles_delete";
      } else if (url.includes("/api/users")) {
        if (method === "get") reqPerm = "users_view";
        else if (method === "post") reqPerm = "users_create";
        else if (method === "put" || method === "patch") reqPerm = "users_edit";
        else if (method === "delete") reqPerm = "users_delete";
      }

      if (reqPerm && perms.includes(reqPerm)) {
        return next();
      }
    }
  } catch (err) {
    console.error("Middleware adminOnly error:", err);
  }

  return res.status(403).json({ message: "Admin access / proper permission required" });
};

module.exports = { protect, adminOnly };
