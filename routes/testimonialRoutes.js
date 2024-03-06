const express = require('express');
const {
  createTestimonialValidator,
  updateTestimonialValidator,
  deleteTestimonialValidator,
} = require('../validator/testimonialValidator'); // Import testimonial validators
const {
  getTestimonials,
  getTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require('../services/testimonialServices'); // Import testimonial services

const router = express.Router();

// Error handling middleware
router.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    status: 'error',
    errors: [{ field: 'general', message: error.message }],
  });
});

// Create a testimonial
router.post('/', createTestimonialValidator, async (req, res) => {
  try {
    const newTestimonial = await createTestimonial(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        testimonial: newTestimonial,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
});

// Get all testimonials
router.get('/', async (req, res) => {
  try {
    const testimonials = await getTestimonials();
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      errors: [{ field: 'general', message: error.message }],
    });
  }
});

// Get a specific testimonial by ID
router.get('/:id', getTestimonial, async (req, res) => {
  try {
    const testimonial = await getTestimonial(req.params.id);
    if (!testimonial) {
      res.status(404).json({ status: 'error', message: 'Testimonial not found' });
      return;
    }
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      errors: [{ field: 'general', message: error.message }],
    });
  }
});

// Update a testimonial by ID
router.put('/:id', updateTestimonialValidator, async (req, res) => {
  try {
    const updatedTestimonial = await updateTestimonial(req.params.id, req.body);
    if (!updatedTestimonial) {
      res.status(404).json({ status: 'error', message: 'Testimonial not found' });
      return;
    }
    res.json(updatedTestimonial);
  } catch (error) {
    res.status(400).json({ status: 'error', error: { statusCode: 400, message: error.message } });
  }
});

// Delete a testimonial by ID
router.delete('/:id', deleteTestimonialValidator, async (req, res) => {
  try {
    const deletedTestimonial = await deleteTestimonial(req.params.id);
    if (!deletedTestimonial) {
      res.status(404).json({ status: 'error', message: 'Testimonial not found' });
      return;
    }
    res.json({ status: 'success', message: 'Testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', error: { statusCode: 500, message: error.message } });
  }
});

module.exports = router;
