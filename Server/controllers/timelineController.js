const TimelineMilestone = require("../models/TimelineMilestone");
const path = require("path");
const fs = require("fs");

// Get all milestones (Client: active only, Admin: all via ?all=true)
exports.getMilestones = async (req, res) => {
  try {
    const isAdmin = req.query.all === "true";
    const where = isAdmin ? {} : { isActive: true };
    const order = [
      ["sortOrder", "ASC"],
      ["year", "ASC"]
    ];

    const milestones = await TimelineMilestone.findAll({ where, order });
    return res.status(200).json(milestones);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get single milestone
exports.getMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const milestone = await TimelineMilestone.findByPk(id);

    if (!milestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    return res.status(200).json(milestone);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Create milestone
exports.createMilestone = async (req, res) => {
  try {
    const { year, title, description, sortOrder, isActive } = req.body;

    if (!year || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "year, title, and description are required",
      });
    }

    let imagePath = null;
    if (req.file) {
      imagePath = `uploads/timeline/${req.file.filename}`;
    }

    if (!imagePath) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const milestone = await TimelineMilestone.create({
      year,
      title,
      description,
      image: imagePath,
      sortOrder: sortOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    return res.status(201).json(milestone);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update milestone
exports.updateMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { year, title, description, sortOrder, isActive } = req.body;

    const milestone = await TimelineMilestone.findByPk(id);
    if (!milestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    let imagePath = milestone.image;
    if (req.file) {
      // Delete old image
      if (milestone.image) {
        const oldImagePath = path.join(__dirname, "../", milestone.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imagePath = `uploads/timeline/${req.file.filename}`;
    }

    if (year) milestone.year = year;
    if (title) milestone.title = title;
    if (description) milestone.description = description;
    if (imagePath) milestone.image = imagePath;
    if (sortOrder !== undefined) milestone.sortOrder = sortOrder;
    if (isActive !== undefined) milestone.isActive = isActive;

    await milestone.save();

    return res.status(200).json(milestone);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Delete milestone
exports.deleteMilestone = async (req, res) => {
  try {
    const { id } = req.params;

    const milestone = await TimelineMilestone.findByPk(id);
    if (!milestone) {
      return res.status(404).json({ success: false, message: "Milestone not found" });
    }

    // Delete image file
    if (milestone.image) {
      const imagePath = path.join(__dirname, "../", milestone.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await milestone.destroy();

    return res.status(200).json({
      success: true,
      message: "Milestone deleted successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
