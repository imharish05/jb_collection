const jwt = require("jsonwebtoken");
const axios = require("axios");
const { User, Role } = require("./models");
const sequelize = require("./config/database");

async function run() {
  try {
    // Find a user with role = 'admin' or associated with Super Admin role
    const admin = await User.findOne({
      where: { role: "admin" },
    });
    if (!admin) {
      console.error("No user with role 'admin' found!");
      // Let's print some users to see what exists
      const users = await User.findAll({ limit: 5 });
      console.log("Users in DB:", users.map(u => ({ email: u.email, role: u.role, roleId: u.roleId })));
      return;
    }
    console.log("Found admin user:", admin.email, "role:", admin.role, "roleId:", admin.roleId);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || "your_super_secret_jwt_key_here",
      { expiresIn: "1h" }
    );

    // Call the endpoint
    console.log("Making request to /api/dashboard/reports/product-sales...");
    const url = "http://localhost:5000/api/dashboard/reports/product-sales";
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        format: "xlsx",
        dateRange: "all",
      },
      responseType: "arraybuffer",
    });

    console.log("Success! Status:", res.status);
    console.log("Response headers:", res.headers);
    console.log("Response data length:", res.data.length);
  } catch (err) {
    console.error("Request failed!");
    if (err.response) {
      console.error("Status:", err.response.status);
      try {
        const bodyStr = Buffer.from(err.response.data).toString("utf8");
        console.error("Response body:", bodyStr);
      } catch (parseErr) {
        console.error("Failed to parse body as text:", parseErr);
      }
    } else {
      console.error("Error message:", err.message);
    }
  } finally {
    await sequelize.close();
  }
}

run();
