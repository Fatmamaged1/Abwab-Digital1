const express = require("express");
const path = require("path");
const multer = require("multer");
const projectModel = require("../models/projectModel");
const {
  getProjectValidator,
  createProjectValidator,
  updateProjectValidator,
  deleteProjectValidator,
  handleValidationErrors,
} = require("../validator/projectValidator");
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require("../services/projectServices");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/project/"));
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "projectImage-" + uniqueSuffix + fileExtension);
  },
});

const upload = multer({ storage });

router.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    status: "error",
    errors: [{ field: "general", message: error.message }],
  });
});

router.post(
  "/",
  upload.array("images[0]", 10),

  async (req, res, next) => {
    try {

      req.body.images = req.files.map(file => file.filename);
      next();
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
        error: error.message,
        stack: error.stack,
        body: req.body,
      });
    }
  },
  createProjectValidator,
  createProject
);



  // Example route that expects a project ID parameter
  router.route("/:id").get(async (req, res, next) => {
    const projectId = req.params.id;
  
    // Validate the project ID format
    if (!/^[0-9a-fA-F]{24}$/.test(projectId)) {
      return res.status(400).json({
        status: "error",
        errors: [{
          type: 'field',
          value: projectId,
          msg: 'Invalid project ID format',
          path: 'id',
          location: 'params'
        }],
      });
    }
  
    try {
      // Fetch the project based on the ID
      const project = await projectModel.findById(projectId);
  
      if (!project) {
        return res.status(404).json({
          status: "error",
          errors: [{
            type: 'field',
            value: projectId,
            msg: 'Project not found',
            path: 'id',
            location: 'params'
          }],
        });
      }
  
      res.status(200).json({
        status: "success",
        data: project,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        errors: [{
          type: 'field',
          value: projectId,
          msg: `Error fetching project: ${error.message}`,
          path: 'id',
          location: 'params'
        }],
      });
    }
  })
  


// Get All Projects
router.route("/").get(async (req, res, next) => {
  try {
    const projects = await projectModel.find();
    res.status(200).json({
      status: "success",
      data: projects,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      errors: [{ field: "general", message: error.message }],
    });
  }
});
// Update a project by ID
// Update a project by ID
router.put('/:id', updateProjectValidator, async (req, res) => {
  const projectId = req.params.id;

  try {
    // Check if the project ID is in a valid format
    if (!/^[0-9a-fA-F]{24}$/.test(projectId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid project ID format',
      });
    }

    // Update the project
    const updatedProject = await updateProject(projectId, req.body);

    // Check if the project was not found
    if (!updatedProject) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found',
      });
    }

    // Send the updated project as a response
    res.json({
      status: 'success',
      data: updatedProject,
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(422).json({
        status: 'error',
        message: 'Validation error',
        errors: error.errors,
      });
    }

    // Handle other errors
    res.status(500).json({
      status: 'error',
      error: {
        statusCode: 500,
        message: error.message,
      },
    });
  }
});

// Delete a project by ID
router.delete('/:id', deleteProjectValidator, deleteProject);




module.exports = router;