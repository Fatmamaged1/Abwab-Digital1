const mongoose = require("mongoose");

const SalesSchema = new mongoose.Schema({
  lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },
  documents: [{ name: String, url: String, uploadedAt: { type: Date, default: Date.now } }],
  
  reminders: [{
    type: { type: String, enum: ["Email", "Call", "Meeting"], required: true },
    date: { type: Date, required: true },
    isSent: { type: Boolean, default: false }
  }],

  secondSteps: [{ description: String, date: { type: Date, default: Date.now } }],

  emails: [{
    subject: String,
    content: String,
    recipient: String,
    sentAt: { type: Date, default: Date.now }
  }],

  geminiSuggestions: [{
    content: String,
    generatedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["Pending", "Reviewed", "Sent"], default: "Pending" }
  }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Sales", SalesSchema);
