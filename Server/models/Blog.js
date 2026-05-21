const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Blog = sequelize.define(
  "Blog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    excerpt: {
      type: DataTypes.TEXT,
    },
    content: {
      type: DataTypes.TEXT,
    },
    image: {
      type: DataTypes.STRING,
    },
    author: {
      type: DataTypes.STRING,
      defaultValue: "Kamali Gifts",
    },
    // MySQL uses JSON (not JSONB)
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_published",
    },
  },
  {
    tableName: "blogs",
  }
);

module.exports = Blog;
