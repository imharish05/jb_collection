const Contact = require("../models/Contact");

// GET /contact/all
const getAll = async (req, res) => {
  try {
    const data = await Contact.findAll({ order: [["createdAt", "DESC"]] });
    res.json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /contact  (customer submits contact form)
const create = async (req, res) => {
  try {
    const contact = await Contact.create(req.body);
    res.status(201).json(contact);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// DELETE /contact/:id
const remove = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ message: "Not found" });
    await contact.destroy();
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { getAll, create, remove };
