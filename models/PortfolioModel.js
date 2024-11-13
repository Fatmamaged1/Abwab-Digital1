const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    images: [{ 
        url: { type: String, required: true },
        altText: { type: String, default: 'Portfolio Image' },
        caption: { type: String },
    }],
    category: {
        type: String,
        enum: ['Mobile App', 'Website', 'Other'],
        required: true,
    },
    client: { type: String }, // Optional client field
    startDate: { type: Date },
    endDate: { type: Date },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Optional virtual field for portfolio duration if start and end dates are present
PortfolioSchema.virtual('duration').get(function () {
    if (!this.endDate || !this.startDate) return 'Ongoing';
    const diffInDays = (this.endDate - this.startDate) / (1000 * 60 * 60 * 24);
    return `${Math.floor(diffInDays)} days`;
});

// Enable virtuals for JSON output
PortfolioSchema.set('toJSON', { virtuals: true });
PortfolioSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Portfolio', PortfolioSchema);
