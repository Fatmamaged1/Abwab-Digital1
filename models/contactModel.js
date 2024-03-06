const mongoose = require("mongoose");

// Sub-schema for representing contacts
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
  });
  

const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;
