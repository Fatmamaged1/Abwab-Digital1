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
  (req, res, next) => {
    console.log("Request Body:", req.body);
    next();
  },
  upload.single("projectImage"),
  createProjectValidator,
  handleValidationErrors,
  async (req, res) => {
    try {
      const projectImage = req.file ? req.file.filename : undefined;

      const newProject = await createProject({
        ...req.body,
        projectImage,
      });

      res.status(201).json({
        status: "success",
        data: {
          project: newProject,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  }
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

router.get("/:id", getProject, async (req, res) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) {
      res.status(404).json({ status: "error", message: "Project not found" });
      return;
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({
      status: "error",
      errors: [{ field: "general", message: error.message }],
    });
  }
});

router.put(
  "/:id",
  updateProjectValidator,
  handleValidationErrors,
  async (req, res) => {
    try {
      const updatedProject = await updateProject(req.params.id, req.body);
      if (!updatedProject) {
        res.status(404).json({ status: "error", message: "Project not found" });
        return;
      }
      res.json(updatedProject);
    } catch (error) {
      res
        .status(400)
        .json({
          status: "error",
          error: { statusCode: 400, message: error.message },
        });
    }
  }
);

router.delete(
  "/:id",
  deleteProjectValidator,
  handleValidationErrors,
  async (req, res) => {
    try {
      const deletedProject = await deleteProject(req.params.id);
      if (!deletedProject) {
        res.status(404).json({ status: "error", message: "Project not found" });
        return;
      }
      res.json({ status: "success", message: "Project deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({
          status: "error",
          error: { statusCode: 500, message: error.message },
        });
    }
  }
);

module.exports = router;
