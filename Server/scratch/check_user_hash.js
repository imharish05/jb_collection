const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

async function run() {
  try {
    const [users] = await sequelize.query("SELECT id, email, name, role, password FROM users");
    console.log("Users in DB:");
    for (const u of users) {
      console.log(`Email: ${u.email}, Name: ${u.name}, Role: ${u.role}, Hash: ${u.password}`);
      if (u.password === '$2a$10$mW5EWmZ6xDvP1vdjIsJMSOc4HIZGIo/tSfj0oa2C/iBWi5qFpE5xe') {
        console.log("Found matching user for target hash!");
      }
    }
    process.exit(0);
  } catch (err) {
    console.error("Database query failed:", err);
    process.exit(1);
  }
}

run();
