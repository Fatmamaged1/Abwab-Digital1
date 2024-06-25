const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const ApiError = require("./utils/ApiError");
const mongoose = require("mongoose");
const validator = require("validator");
const multer = require("multer");
const path = require("path");
dotenv.config("./config.env");
const swagger = require("./swagger");

const globalError = require("./middleware/errorMiddleware");
const connectDB = require("./config/database");
const employeeRouts = require("./routes/employeeRoutes");
const blogRouts = require("./routes/blogRoutes");
const servicesRouts = require("./routes/servicesRoutes");
const technologyRouts = require("./routes/technologiesRoutes");
const testimonialRouts = require("./routes/testimonialRoutes");
const clientRouts = require("./routes/clientRoutes");
const contactRouts = require("./routes/contactRoutes");
const projectRouts = require("./routes/projectRoutes");
const userRouts = require("./routes/userRoutes");
const authRouts = require("./routes/authRoutes");

connectDB();
const app = express();
// Add Swagger middleware
swagger(app);

// middleware
app.use(express.json());
app.use(morgan("dev"));

if (process.env.NODE_ENV === "development") {
  console.log(`mode:${process.env.NODE_ENV}`);
}

// router
app.use("/api/v1/blogs", blogRouts);

app.use(
  "/uploads/blogs",
  express.static(path.join(__dirname, "uploads/blogs"))
);
app.use("/api/v1/employee", employeeRouts);

app.use(
  "/uploads/employee",
  express.static(path.join(__dirname, "uploads/employee"))
);
app.use("/api/v1/services", servicesRouts);

app.use(
  "/uploads/services",
  express.static(path.join(__dirname, "uploads/services"))
);
app.use("/api/v1/technologies", technologyRouts);

app.use(
  "/uploads/technology",
  express.static(path.join(__dirname, "uploads/technology"))
);

app.use("/api/v1/testimonial", testimonialRouts);

app.use(
  "/uploads/testimonial",
  express.static(path.join(__dirname, "uploads/testimonial"))
);
app.use("/api/v1/client", clientRouts);

app.use(
  "/uploads/client",
  express.static(path.join(__dirname, "uploads/client"))
);
app.use("/api/v1/contact", contactRouts);

app.use(
  "/uploads/contact",
  express.static(path.join(__dirname, "uploads/contact"))
);
app.use("/api/v1/project", projectRouts);

app.use(
  "/uploads/project",
  express.static(path.join(__dirname, "uploads/project"))
);
app.use("/api/v1/user", userRouts);

app.use("/uploads/user", express.static(path.join(__dirname, "uploads/user")));

app.use("/api/v1/auth", authRouts);

app.use("/uploads/auth", express.static(path.join(__dirname, "uploads/auth")));

// Handling unhandled routes
app.all("*", (req, res, next) => {
  console.log("req.body", req.body);
  console.log("req.originalUrl", req.originalUrl);
  next(new ApiError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Error handling middleware
app.use(globalError);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
