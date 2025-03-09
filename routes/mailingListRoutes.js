const express = require('express');
const multer = require('multer');
const router = express.Router();
const MailingList = require('../models/MailingListModel');
const ApiError = require('../utils/ApiError');

// Multer setup for parsing form-data
const upload = multer();

// Add a new email to the mailing list
router.post('/subscribe', upload.none(), async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }
        const newSubscriber = await MailingList.create({ email });
        res.status(201).json({
            success: true,
            data: newSubscriber,
        });
    } catch (err) {
        next(err);
    }
});

// Get all mailing list entries
router.get('/', async (req, res, next) => {
    try {
        const entries = await MailingList.find();
        res.status(200).json(entries);
    } catch (error) {
        next(error);
    }
});

// Unsubscribe an email
router.delete('/unsubscribe', upload.none(), async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }
        await MailingList.findOneAndDelete({ email });
        res.status(200).json({ success: true, message: 'Unsubscribed successfully!' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
