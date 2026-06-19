require("dotenv").config();
const { Role, User } = require("../models");

async function run() {
  try {
    const superAdminRole = await Role.findOne({ where: { name: "Super Admin" } });
    if (!superAdminRole) {
      console.error("Super Admin role not found!");
      process.exit(1);
    }
    console.log("Found Super Admin role ID:", superAdminRole.id);

    // Simulate createUser controller call
    const email = "test_super_admin@gmail.com";
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log("Test user already exists. Deleting it first...");
      await existing.destroy();
    }

    const user = await User.create({
      name: "Test Super Admin",
      email,
      password: "password123",
      role: "admin",
      roleId: superAdminRole.id,
      status: "active",
    });

    console.log("Successfully created User:");
    console.log(`- ID: ${user.id}, Name: ${user.name}, RoleId: ${user.roleId}`);

    const createdUser = await User.findByPk(user.id, {
      include: [{ model: Role, as: "roleRecord" }]
    });

    console.log("Retrieved User with Role association:");
    console.log(`- ID: ${createdUser.id}, RoleRecord Name: ${createdUser.roleRecord?.name}`);

    // Cleanup
    await createdUser.destroy();
    console.log("Test completed successfully with no errors!");
  } catch (err) {
    console.error("Test failed with error:", err);
  } finally {
    process.exit(0);
  }
}

run();
