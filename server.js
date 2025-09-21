require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const path = require("path");
const cors = require("cors");
//const helmet = require("helmet");
const fs = require("fs");
const https = require("https");
const http = require("http");
const mongoose = require("mongoose");

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
const careerRoutes = require("./routes/careers");
const leadRoutes = require('./routes/sales/leads');
const salesRoutes = require('./routes/sales/sales');
const activityRoutes = require('./routes/sales/activities');
const reportsReports = require('./routes/sales/reports');
const analyticsRoutes = require('./routes/sales/analyticsRoutes');
const documentRoutes = require('./routes/sales/documents');

const app = express();

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in the environment variables");
    }

    await connectDB();
    console.log("✅ Connected to MongoDB");

    // Enable CORS for all origins
    app.use(cors({
      origin: '*', // أي دومين
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Security & Middleware
  //  app.use(helmet());
    app.use(express.json());
    app.use(morgan("dev"));
    app.set("views", path.join(__dirname, "views"));
    app.set("view engine", "ejs");
    app.use(express.static(path.join(__dirname, "public")));

    // API Routes
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
    app.use("/api/v1/lead", leadRoutes);
    app.use("/api/v1/activity", activityRoutes);
    app.use("/api/v1/reports", reportsReports);
    app.use("/api/v1/document", documentRoutes);
    app.use("/api/v1/sales", salesRoutes);
    app.use("/api/v1/analytics", analyticsRoutes);
    app.use("/api/v1/privacy-policy", require("./routes/privacyPolicy"));
    app.use("/api/v1/terms-conditions", require("./routes/TermsAndConditions"));
    app.use("/api/v1/career", careerRoutes);

    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    // Handle 404 Errors
    app.all("*", (req, res, next) => {
      next(new ApiError(`Can't find ${req.originalUrl} on this server`, 404));
    });

    // Global Error Handler
    app.use(globalError);

    // Load SSL Certificate
    const options = {
      key: fs.readFileSync("/etc/letsencrypt/live/backend.abwabdigital.com/privkey.pem"),
      cert: fs.readFileSync("/etc/letsencrypt/live/backend.abwabdigital.com/fullchain.pem"),
    };

    // HTTPS Server
    https.createServer(options, app).listen(4000, () => {
      console.log("🚀 HTTPS server is running on port 4000");
    });

    // HTTP to HTTPS Redirection
    http.createServer((req, res) => {
      res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
      res.end();
    }).listen(8080, () => {
      console.log("🌐 HTTP server is redirecting to HTTPS on port 8080");
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
}

startServer();
// Run newsletter cron jobs
require('./newsletterCron');
