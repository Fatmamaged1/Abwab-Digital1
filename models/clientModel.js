const mongoose = require('mongoose');


// Sub-schema for representing clients
const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    profileImage: { type: String },
    industry: { type: String },
    contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;