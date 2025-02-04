const mongoose = require("mongoose");

// Sub-schema for representing contacts
const contactSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  message: { type: String },
});

const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;
