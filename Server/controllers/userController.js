const { User, Role } = require("../models");
const { Op } = require("sequelize");

// GET /api/users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: {
        role: {
          [Op.ne]: "user"
        }
      },
      attributes: { exclude: ["password"] },
      include: [{ model: Role, as: "roleRecord", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]]
    });
    return res.json(users);
  } catch (err) {
    next(err);
  }
};

// POST /api/users
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, roleId, status, phone } = req.body;

    if (!name || !email || !password || !roleId) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    // Set role attribute to "admin" so legacy middlewares recognize them as staff
    const user = await User.create({
      name,
      email,
      password,
      role: "admin",
      roleId,
      status: status || "active",
      phone: phone || null
    });

    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ["password"] },
      include: [{ model: Role, as: "roleRecord", attributes: ["id", "name"] }]
    });

    return res.status(201).json(createdUser);
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, roleId, status, phone } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(409).json({ message: "Email is already registered" });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (roleId) user.roleId = roleId;
    if (status) user.status = status;
    if (phone !== undefined) user.phone = phone;

    // Only update password if provided
    if (password && password.trim()) {
      user.password = password;
    }

    await user.save();

    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ["password"] },
      include: [{ model: Role, as: "roleRecord", attributes: ["id", "name"] }]
    });

    return res.json(updatedUser);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.destroy();
    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};
