require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");

const globalError = require("./middleware/errorMiddleware");
const connectDB = require("./config/database");
const ApiError = require("./utils/ApiError");
const setupAdminJS = require("./admin");

// Import API routes
const aboutRoutes = require("./routes/aboutRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const blogRoutes = require("./routes/blogRoutes");
const servicesRoutes = require("./routes/servicesRoutes");
const technologyRoutes = require("./routes/technologiesRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const clientRoutes = require("./routes/clientRoutes");
const contactRoutes = require("./routes/contactRoutes");
const projectRoutes = require("./routes/projectRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const homeRoutes = require("./routes/homeRoutes");
const portfolioRoutes = require("./routes/PortfolioRoutes");
const mailingListRoutes = require("./routes/mailingListRoutes");

// ✅ Configure CORS
const corsConfig = {
  origin: "*",
  credentials: true, // ✅ Fix: Correct key
  methods: ["GET", "POST", "DELETE", "PUT"],
};

// ✅ Initialize Express
const app = express();

// ✅ Connect to database with error handling
async function startServer() {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");

    // ✅ Middleware Setup
    app.use(cors(corsConfig)); // CORS for all routes
    app.use(helmet()); // Security headers
    app.use(express.json()); // Parse JSON requests
    app.use(morgan("dev")); // Logging
    app.set("views", path.join(__dirname, "views")); // Set views directory
    app.set("view engine", "ejs"); // View engine
    app.use(express.static(path.join(__dirname, "public"))); // Static assets

    // ✅ API Routes
    app.use("/api/v1/about", aboutRoutes);
    app.use("/api/v1/blogs", blogRoutes);
    app.use("/api/v1/employee", employeeRoutes);
    app.use("/api/v1/services", servicesRoutes);
    app.use("/api/v1/technologies", technologyRoutes);
    app.use("/api/v1/testimonial", testimonialRoutes);
    app.use("/api/v1/client", clientRoutes);
    app.use("/api/v1/contact", contactRoutes);
    app.use("/api/v1/project", projectRoutes);
    app.use("/api/v1/user", userRoutes);
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/mailing-list", mailingListRoutes);
    app.use("/api/v1/home", homeRoutes);
    app.use("/api/v1/portfolio", portfolioRoutes);

    // ✅ Static file serving (Uploads)
    const uploadDirs = [
      "blogs",
      "employee",
      "about",
      "services",
      "technology",
      "testimonial",
      "client",
      "contact",
      "project",
      "user",
      "auth",
      "portfolio",
    ];

    uploadDirs.forEach((dir) => {
      app.use(`/uploads/${dir}`, express.static(path.join(__dirname, `uploads/${dir}`)));
    });

    app.use("/public", express.static("public"));
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    // ✅ Setup AdminJS
    const { adminJs, router } = await setupAdminJS();
    app.use(adminJs.options.rootPath, router);

    // ✅ Handle 404 Errors
    app.all("*", (req, res, next) => {
      console.log("req.body:", req.body);
      console.log("req.originalUrl:", req.originalUrl);
      next(new ApiError(`Can't find ${req.originalUrl} on this server`, 404));
    });

    // ✅ Error Handling Middleware
    app.use(globalError);

    // ✅ Start Server
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1); // Exit process if connection fails
  }
}

// ✅ Start the server
startServer();
