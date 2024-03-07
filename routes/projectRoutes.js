const express = require("express");
const path = require("path");
const multer = require("multer");
const {
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

router.get("/", async (req, res) => {
  try {
    const projects = await getProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({
      status: "error",
      errors: [{ field: "general", message: error.message }],
    });
  }
});

router.get("/:id", (req, res,next) =>{
  console.log(req.params)
  next();
});

router.put("/:id", async (req, res, next) => {
  try {
    const updatedProject = await updateProject(req.params.id, req.body);
    
    if (!updatedProject) {
      const notFoundError = new Error("Project not found");
      notFoundError.status = 404;
      throw notFoundError;
    }

    res.json(updatedProject);
  } catch (error) {
    next(error); // Pass the error to the global error handler
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deletedProject = await deleteProject(req.params.id);

    if (!deletedProject) {
      const notFoundError = new Error("Project not found");
      notFoundError.status = 404;
      throw notFoundError;
    }

    res.json({ status: "success", message: "Project deleted successfully" });
  } catch (error) {
    next(error); // Pass the error to the global error handler
  }
});

module.exports = router;