const { Role, User } = require("./models");
const sequelize = require("./config/database");

async function checkRoles() {
  try {
    const roles = await Role.findAll({ raw: true });
    console.log("Roles in DB:");
    console.log(JSON.stringify(roles, null, 2));

    const admins = await User.findAll({ where: { role: "admin" }, raw: true });
    console.log("Admins in DB:");
    console.log(JSON.stringify(admins.map(a => ({ email: a.email, role: a.role, roleId: a.roleId })), null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sequelize.close();
  }
}

checkRoles();
