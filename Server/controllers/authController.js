const jwt = require("jsonwebtoken");
const { User } = require("../models");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, email, password, phone });

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone:user.phone,
      role: 'user',
      token: generateToken(user.id),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status === "inactive") {
      return res.status(403).json({ message: "Your account is inactive. Please contact support." });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone : user.phone,
      token: generateToken(user.id),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: require("../models").Role, as: "roleRecord" }]
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.status === "inactive") {
      return res.status(403).json({ message: "Your account is inactive." });
    }

    let permissions = [];
    if ((user.role === "admin" && !user.roleId) || user.roleRecord?.name === "Super Admin") {
      permissions = ["*"];
    } else if (user.roleRecord) {
      const pr = user.roleRecord.permissions;
      if (Array.isArray(pr)) {
        permissions = pr;
      } else if (typeof pr === "string") {
        try { permissions = JSON.parse(pr); } catch { permissions = []; }
      }
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.roleRecord?.name || user.role,
      status: user.status,
      permissions
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// PUT /api/auth/me
const updateMe = async (req, res, next) => {
  try {
    const { name, phone, password } = req.body;
    const user = await User.findByPk(req.user.id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (password) user.password = password;

    await user.save();
    return res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/update-password
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    // 1. Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // 2. Set new password (model hooks should handle hashing)
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};


// POST /api/auth/admin/login
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ 
      where: { email },
      include: [{ model: require("../models").Role, as: "roleRecord" }]
    });

    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });

    if (user.status === "inactive") {
      return res.status(403).json({ message: "Your account is inactive. Please contact the administrator." });
    }

    if (user.role !== "admin" && !user.roleId)
      return res.status(403).json({ message: "Not an admin account" });

    let permissions = [];
    if ((user.role === "admin" && !user.roleId) || user.roleRecord?.name === "Super Admin") {
      permissions = ["*"];
    } else if (user.roleRecord) {
      const pr = user.roleRecord.permissions;
      if (Array.isArray(pr)) {
        permissions = pr;
      } else if (typeof pr === "string") {
        try { permissions = JSON.parse(pr); } catch { permissions = []; }
      }
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.roleRecord?.name || user.role,
      permissions,
      token: generateToken(user.id),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateMe, updatePassword, adminLogin };
