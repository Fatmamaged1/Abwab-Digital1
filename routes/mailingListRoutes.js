// routes/mailingListRoutes.js
const express = require('express');
const router = express.Router();
const MailingList = require('../models/MailingListModel');
const ApiError = require('../utils/ApiError');

// Add a new email to the mailing list
router.post('/subscribe', async (req, res, next) => {
    try {
      const { email } = req.body;
      const newSubscriber = await MailingList.create({ email });
      res.status(201).json({
        status: 'success',
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
router.delete('/unsubscribe', async (req, res, next) => {
  try {
    const { email } = req.body;
    await MailingList.findOneAndDelete({ email });
    res.status(200).json({ message: 'Unsubscribed successfully!' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
