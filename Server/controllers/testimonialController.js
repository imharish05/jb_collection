const Testimonial = require("../models/Testimonial");
const path = require("path");
const fs = require("fs");

// Get all testimonials (for client - active only by default, for admin all with ?all=true)
exports.getTestimonials = async (req, res) => {
  try {
    const isAdmin = req.query.all === "true";
    const where = isAdmin ? {} : { isActive: true };
    const order = [["sortOrder", "ASC"]];

    const testimonials = await Testimonial.findAll({ where, order });
    return res.status(200).json(testimonials);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get single testimonial
exports.getTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findByPk(id);

    if (!testimonial) {
      return res.status(404).json({ success: false, message: "Testimonial not found" });
    }

    return res.status(200).json(testimonial);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Create testimonial
exports.createTestimonial = async (req, res) => {
  try {
    const { name, designation, text, sortOrder, isActive } = req.body;

    // Validate required fields
    if (!name || !designation || !text) {
      return res.status(400).json({
        success: false,
        message: "name, designation, and text are required",
      });
    }

    let imagePath = null;
    if (req.file) {
      imagePath = `uploads/testimonials/${req.file.filename}`;
    }

    if (!imagePath) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const testimonial = await Testimonial.create({
      name,
      designation,
      text,
      image: imagePath,
      sortOrder: sortOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    return res.status(201).json(testimonial);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update testimonial
exports.updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, designation, text, sortOrder, isActive } = req.body;

    const testimonial = await Testimonial.findByPk(id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: "Testimonial not found" });
    }

    // Handle image update
    let imagePath = testimonial.image;
    if (req.file) {
      // Delete old image
      if (testimonial.image) {
        const oldImagePath = path.join(__dirname, "../", testimonial.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imagePath = `uploads/testimonials/${req.file.filename}`;
    }

    // Update fields
    if (name) testimonial.name = name;
    if (designation) testimonial.designation = designation;
    if (text) testimonial.text = text;
    if (imagePath) testimonial.image = imagePath;
    if (sortOrder !== undefined) testimonial.sortOrder = sortOrder;
    if (isActive !== undefined) testimonial.isActive = isActive;

    await testimonial.save();

    return res.status(200).json(testimonial);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Delete testimonial
exports.deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findByPk(id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: "Testimonial not found" });
    }

    // Delete image file
    if (testimonial.image) {
      const imagePath = path.join(__dirname, "../", testimonial.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await testimonial.destroy();

    return res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
