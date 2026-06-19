const { Role } = require("../models");
const { Op } = require("sequelize");

// GET /api/roles
const getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.findAll({ order: [["name", "ASC"]] });
    return res.json(roles);
  } catch (err) {
    next(err);
  }
};

// POST /api/roles
const createRole = async (req, res, next) => {
  try {
    const { name, permissions } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Role name is required" });
    }

    // Unique role name check (case-insensitive)
    const existing = await Role.findOne({
      where: {
        name: {
          [Op.like]: name.trim()
        }
      }
    });

    if (existing) {
      return res.status(400).json({ message: "Role with this name already exists" });
    }

    const role = await Role.create({
      name: name.trim(),
      permissions: permissions || []
    });

    return res.status(201).json(role);
  } catch (err) {
    next(err);
  }
};

// PUT /api/roles/:id
const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    if (role.name === "Super Admin") {
      return res.status(400).json({ message: "Super Admin role cannot be modified" });
    }

    if (name && name.trim()) {
      // Check for duplicates excluding self
      const existing = await Role.findOne({
        where: {
          name: {
            [Op.like]: name.trim()
          },
          id: {
            [Op.ne]: id
          }
        }
      });

      if (existing) {
        return res.status(400).json({ message: "Role with this name already exists" });
      }

      role.name = name.trim();
    }

    if (permissions) {
      role.permissions = permissions;
    }

    await role.save();
    return res.json(role);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/roles/:id
const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    if (role.name === "Super Admin") {
      return res.status(400).json({ message: "Super Admin role cannot be deleted" });
    }

    await role.destroy();
    return res.json({ message: "Role deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole
};
