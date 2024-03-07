const express = require("express");
const path = require("path");
const multer = require("multer");

const {
  createServicesValidator,

  getServicesValidator,
  updateServicesValidator,
  deleteServicesValidator,
} = require("../validator/servicesValidator");

const {
  getServices,
  getService,
  createServices,
  updateServices,
  deleteServices,
} = require("../services/servicesServices");

const router = express.Router();

// Set up multer to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/blogs/"); // specify the folder where the uploaded files will be stored
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + fileExtension);
  },
});

const upload = multer({ storage });

// Middleware functions
router
  .route("/")
  .get(async (req, res, next) => {
    try {
      const services = getServices();
      res.json(services);
    } catch (error) {
      next(error); // Pass the error to the global error handler
    }
  }) 
  
  router.post(
    "/",
    upload.single("icon"),
    async (req, res, next) => {
      try {
        // Extract profile image filename from the multer upload
        req.body.icon = req.file ? req.file.filename : undefined;
        console.log("req.body", req.body);
        next();
      } catch (error) {
        res.status(500).json({
          status: "error",
          message: "Internal Server Error",
        });
      }
    },
    createServicesValidator,
    createServices
  )

router
  .route("/:id")
  .get(async (req, res, next) => {
    try {
      await getServicesValidator(req);
      const service = await getService(req.params.id);
      res.json(service);
    } catch (error) {
      next(error); // Pass the error to the global error handler
    }
  })
  .put(async (req, res, next) => {
    try {
      await updateServicesValidator(req);
      updateServices(req.params.id, req.body);
      res.send("Service updated successfully");
    } catch (error) {
      next(error); // Pass the error to the global error handler
    }
  })
  .delete(async (req, res, next) => {
    try {
      await deleteServicesValidator(req);
      deleteServices(req.params.id);
      res.send("Service deleted successfully");
    } catch (error) {
      next(error); // Pass the error to the global error handler
    }
  });

module.exports = router;
