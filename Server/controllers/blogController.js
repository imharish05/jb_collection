const { Blog } = require("../models");
const { Op } = require("sequelize");

// GET /api/blogs
const getAllBlogs = async (req, res, next) => {
  try {
    const { tag, search, limit } = req.query;
    const where = { isPublished: true };

    // MySQL: use Op.like instead of Op.iLike
    if (search) {
      where[Op.or] = [
        { title:   { [Op.like]: `%${search}%` } },
        { excerpt: { [Op.like]: `%${search}%` } },
      ];
    }

    // MySQL: use JSON_CONTAINS for tag array filtering
    if (tag) {
      const sequelize = require("../config/database");
      where[Op.and] = [
        ...(where[Op.and] || []),
        sequelize.literal(`JSON_CONTAINS(tags, '"${tag}"')`),
      ];
    }

    const blogs = await Blog.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: limit ? parseInt(limit) : undefined,
    });
    return res.json(blogs);
  } catch (err) {
    next(err);
  }
};

// GET /api/blogs/:slug
const getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({
      where: { slug: req.params.slug, isPublished: true },
    });
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    return res.json(blog);
  } catch (err) {
    next(err);
  }
};

// POST /api/blogs  [admin]
const createBlog = async (req, res, next) => {
  try {
    const blog = await Blog.create(req.body);
    return res.status(201).json(blog);
  } catch (err) {
    next(err);
  }
};

// PUT /api/blogs/:id  [admin]
const updateBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    await blog.update(req.body);
    return res.json(blog);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/blogs/:id  [admin]
const deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    await blog.destroy();
    return res.json({ message: "Blog deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog };
