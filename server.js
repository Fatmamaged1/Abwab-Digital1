const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");
const cors = require("cors");
const helmet = require('helmet');
const corsConfig = {
  origin: "*",
  Credential: true,
  methods: ["GET", "POST", "DELETE", "PUT"],
};

dotenv.config(); // Correct usage

const globalError = require("./middleware/errorMiddleware");
const connectDB = require("./config/database");
const ApiError = require("./utils/ApiError");
const setupAdminJS = require("./admin");

// Import routes
const aboutRoutes = require('./routes/aboutRoutes');
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
const portfolioRoutes = require('./routes/PortfolioRoutes');


const mailingListRoutes = require("./routes/mailingListRoutes");
const { config } = require("process");

// Connect to database
connectDB();

const app = express();

// Middleware
app.options("", cors(corsConfig));
app.use(express.json());
app.use(morgan("dev"));
app.use(cors(corsConfig));
app.use(helmet());
// Set the views directory and view engine
app.set('views', path.join(__dirname, 'views'));

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Define static files folder for assets like images, CSS, and JS
app.use(express.static(path.join(__dirname, 'public')));

// Set up routes
app.use('/api/v1/about', aboutRoutes);
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

// Static file serving
app.use(
  "/uploads/blogs",
  express.static(path.join(__dirname, "uploads/blogs"))
);
app.use(
  "/uploads/employee",
  express.static(path.join(__dirname, "uploads/employee"))
);app.use(
  "/uploads/about",
  express.static(path.join(__dirname, "uploads/about"))
);
app.use(
  "/uploads/services",
  express.static(path.join(__dirname, "uploads/services"))
);
app.use(
  "/uploads/technology",
  express.static(path.join(__dirname, "uploads/technology"))
);
app.use(
  "/uploads/testimonial",
  express.static(path.join(__dirname, "uploads/testimonial"))
);
app.use(
  "/uploads/client",
  express.static(path.join(__dirname, "uploads/client"))
);
app.use(
  "/uploads/contact",
  express.static(path.join(__dirname, "uploads/contact"))
);
app.use(
  "/uploads/project",
  express.static(path.join(__dirname, "uploads/project"))
);app.use(
  "/uploads/services",
  express.static(path.join(__dirname, "uploads/services"))

);
app.use("/uploads/user", express.static(path.join(__dirname, "uploads/user")));
app.use("/uploads/auth", express.static(path.join(__dirname, "uploads/auth")));
app.use(
  "/uploads/portfolio",
  express.static(path.join(__dirname, "uploads/portfolio"))
);
app.use("/public", express.static("public"));
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
  
);

// Setup AdminJS
setupAdminJS()
  .then(({ adminJs, router }) => {
    app.use(adminJs.options.rootPath, router);

    // Handling unhandled routes
    app.all("*", (req, res, next) => {
      console.log("req.body", req.body);
      console.log("req.originalUrl", req.originalUrl);
      next(new ApiError(`Can't find ${req.originalUrl} on this server`, 404));
    });

    // Error handling middleware
    app.use(globalError);

    // Start server
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error setting up AdminJS:", err);
  });
