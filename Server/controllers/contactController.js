const Contact = require("../models/Contact");

// GET /contact/all (admin only)
const getAll = async (req, res) => {
  try {
    const data = await Contact.findAll({ order: [["createdAt", "DESC"]] });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// POST /contact (customer submits contact form)
const create = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Full name is required" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }
    if (message.trim().length < 10) {
      return res.status(400).json({ message: "Message must be at least 10 characters long" });
    }

    // Create contact
    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : null,
      message: message.trim(),
      status: "new",
    });

    res.status(201).json({
      message: "Your message has been received. We will get back to you soon!",
      data: contact,
    });
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to submit contact form" });
  }
};

// DELETE /contact/:id (admin only)
const remove = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    await contact.destroy();
    res.json({ message: "Contact deleted successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PUT /contact/:id/status (admin only - update status)
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["new", "read", "replied"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    await contact.update({ status });
    res.json({ message: "Status updated successfully", data: contact });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { getAll, create, remove, updateStatus };
