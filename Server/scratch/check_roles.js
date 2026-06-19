require("dotenv").config();
const { Role, User } = require("../models");

async function check() {
  try {
    const roles = await Role.findAll();
    console.log("ROLES IN DATABASE:");
    roles.forEach(r => {
      console.log(`- ID: ${r.id}, Name: ${r.name}, Perms: ${JSON.stringify(r.permissions)}`);
    });

    const users = await User.findAll();
    console.log("\nADMIN/STAFF USERS IN DATABASE:");
    users.filter(u => u.role !== "user").forEach(u => {
      console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, RoleId: ${u.roleId}, Role: ${u.role}, Status: ${u.status}`);
    });
  } catch (err) {
    console.error("DB Query error:", err);
  } finally {
    process.exit(0);
  }
}

check();
