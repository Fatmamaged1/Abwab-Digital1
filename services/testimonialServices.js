const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const { uploadSingleImage } = require("../middleware/uploadImageMiddleware.js");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError.js");
const factory = require("./handlerFactory.js");
const TestimonialModel = require("../models/testimonialModel.js");
//const blogModel = require("../models/blogModel.js"); // This line is unnecessary if not used

// Assume you have a 'ServicesModel' imported from somewhere
 // Replace with the correct path and file name

// Middleware to upload blog image
exports.uploadTestimonialImage = uploadSingleImage("image");

// Middleware to resize the uploaded image
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filename = `testimon-${uuidv4()}-${Date.now()}.jpeg`;

  // Resize and save the image
  await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat("jpeg")
    .jpeg({ quality: 95 })
    .toFile(`uploads/blogs/${filename}`);

  // Save the filename in the request body for storage in the database
  req.body.image = filename;

  next();
});

// CRUD operations using factory pattern
exports.getTestimonials= factory.getAll(TestimonialModel,"Testimonial");
 exports.getTestimonials = async (req, res) => {
  try {
      const testimonials = await TestimonialModel.find();

      // Append full URL to icon field
      const updatedTestimonials = testimonials.map(testimonial => ({
          ...testimonial._doc,
          icon: testimonial.icon 
              ? `https://Backend.abwabdigital.com/uploads/testimonials/${testimonial.icon}`
              : null,
      }));

      res.status(200).json({
          status: "success",
          data: updatedTestimonials,
      });
  } catch (error) {
      res.status(500).json({
          status: "error",
          errors: [{ field: "general", message: error.message }],
      });
  }
};

 exports.createTestimonial = async (req, res) => {
  try {
      const { clien, name, content, rating } = req.body;
      
      // Construct full image URL
      const icon = req.file
          ? `https://Backend.abwabdigital.com/uploads/testimonials/${req.file.filename}`
          : null; // Use `null` if no image was uploaded

      const newTestimonial = new TestimonialModel({
          clien,
          name,
          content,
          rating,
          icon: icon, // Store full URL instead of just filename
      });

      const savedTestimonial = await newTestimonial.save();

      res.status(201).json({
          status: "success",
          message: "Testimonial created successfully",
          data: savedTestimonial,
      });
  } catch (error) {
      console.error("Error creating testimonial:", error);
      res.status(500).json({
          status: "error",
          message: "Failed to create testimonial",
          error: error.message,
      });
  }
};
// Update a Testimonial
exports.updateTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { client, name, content, rating } = req.body;

  console.log("Incoming body:", req.body);
  console.log("Incoming file:", req.file);

  const testimonial = await TestimonialModel.findById(id);
  if (!testimonial) {
    return res.status(404).json({ status: "error", message: "Testimonial not found" });
  }

  // حذف الصورة القديمة إن وجدت
  if (req.file && testimonial.icon) {
    const oldImagePath = path.join(
      __dirname,
      `../uploads/testimonials/${path.basename(testimonial.icon)}`
    );
    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }
  }

  const updateFields = {};
  if (client !== undefined) updateFields.client = client;
  if (name !== undefined) updateFields.name = name;
  if (content !== undefined) updateFields.content = content;
  if (rating !== undefined) updateFields.rating = rating;
  if (req.file) {
    updateFields.icon = `https://Backend.abwabdigital.com/uploads/testimonials/${req.file.filename}`;
  }

  const updatedTestimonial = await TestimonialModel.findByIdAndUpdate(id, updateFields, {
    new: true,
  });

  res.status(200).json({
    status: "success",
    message: "Testimonial updated successfully",
    data: updatedTestimonial,
  });
});


  
  // Delete a Testimonial
  exports.deleteTestimonial = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    const testimonial = await TestimonialModel.findById(id);
    if (!testimonial) {
      return res.status(404).json({ status: "error", message: "Testimonial not found" });
    }
  
    
  
    await TestimonialModel.findByIdAndDelete(id);
  
    res.status(200).json({
      status: "success",
      message: "Testimonial deleted successfully",
    });
  });