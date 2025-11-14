require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
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
const opportunityRoutes = require('./routes/sales/opportunities');
const handbookRoutes = require('./routes/sales/handbook');
const campaignRoutes = require('./routes/sales/campaigns');

// Import Agile routes
const agileProjectRoutes = require('./routes/agile/projects');
const agileSprintRoutes = require('./routes/agile/sprints');
const agileStoryRoutes = require('./routes/agile/stories');
const agileEpicRoutes = require('./routes/agile/epics');
const agileTaskRoutes = require('./routes/agile/tasks');

// Import HR routes
const hrEmployeeRoutes = require('./routes/hr/employees');
const hrAttendanceRoutes = require('./routes/hr/attendance');
const hrLeaveRoutes = require('./routes/hr/leaves');
const hrTimeLogRoutes = require('./routes/hr/timelogs');
const hrDepartmentRoutes = require('./routes/hr/departments');

const app = express();

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in the environment variables");
    }

    await connectDB();
    console.log("✅ Connected to MongoDB");

    // Enable CORS for specific origins
    const allowedOrigins = [];

    // Add development origins in development mode
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
    }

    // Add production/custom frontend URL if specified
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }

    // Add additional allowed origins from environment (comma-separated)
    if (process.env.ALLOWED_ORIGINS) {
      const customOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
      allowedOrigins.push(...customOrigins);
    }

    app.use(cors({
      origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1 && process.env.NODE_ENV === 'production') {
          const msg = 'The CORS policy does not allow access from the specified Origin.';
          return callback(new Error(msg), false);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      optionsSuccessStatus: 200
    }));

    // Security & Middleware
    app.use(helmet({
      contentSecurityPolicy: false, // Disable CSP for now, configure as needed
      crossOriginEmbedderPolicy: false,
    }));
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
    app.use("/api/v1/opportunities", opportunityRoutes);
    app.use("/api/v1/handbook", handbookRoutes);
    app.use("/api/v1/campaigns", campaignRoutes);

    // Agile routes
    app.use("/api/v1/agile/projects", agileProjectRoutes);
    app.use("/api/v1/agile/sprints", agileSprintRoutes);
    app.use("/api/v1/agile/stories", agileStoryRoutes);
    app.use("/api/v1/agile/epics", agileEpicRoutes);
    app.use("/api/v1/agile/tasks", agileTaskRoutes);

    // HR routes
    app.use("/api/v1/hr/employees", hrEmployeeRoutes);
    app.use("/api/v1/hr/attendance", hrAttendanceRoutes);
    app.use("/api/v1/hr/leaves", hrLeaveRoutes);
    app.use("/api/v1/hr/timelogs", hrTimeLogRoutes);
    app.use("/api/v1/hr/departments", hrDepartmentRoutes);

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

    // SSL Configuration - Only use HTTPS if certs are provided
    const useHTTPS = process.env.SSL_CERT_PATH && process.env.SSL_KEY_PATH;

    if (useHTTPS) {
      try {
        const options = {
          key: fs.readFileSync(process.env.SSL_KEY_PATH),
          cert: fs.readFileSync(process.env.SSL_CERT_PATH),
        };

        // HTTPS Server
        https.createServer(options, app).listen(process.env.PORT || 4000, () => {
          console.log(`🚀 HTTPS server is running on port ${process.env.PORT || 4000}`);
        });

        // HTTP to HTTPS Redirection
        http.createServer((req, res) => {
          res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
          res.end();
        }).listen(process.env.HTTP_PORT || 8080, () => {
          console.log(`🌐 HTTP server is redirecting to HTTPS on port ${process.env.HTTP_PORT || 8080}`);
        });
      } catch (sslError) {
        console.error("❌ SSL Error:", sslError.message);
        console.error("Could not load SSL certificates. Make sure SSL_CERT_PATH and SSL_KEY_PATH are correct.");
        process.exit(1);
      }
    } else {
      // No SSL - Run HTTP only (development mode)
      console.log("⚠️  Running in HTTP mode (no SSL certificates configured)");
      app.listen(process.env.PORT || 4000, () => {
        console.log(`🚀 HTTP server is running on port ${process.env.PORT || 4000}`);
        console.log("💡 For production, configure SSL_CERT_PATH and SSL_KEY_PATH in .env");
      });
    }

    // Setup AdminJS
    const { adminJs, router } = await setupAdminJS();
    app.use(adminJs.options.rootPath, router);
    console.log(`✅ AdminJS is available at http://localhost:${process.env.PORT || 4000}${adminJs.options.rootPath}`);

  } catch (err) {
    console.error("❌ Server startup failed:", err.message);
    process.exit(1);
  }
}

startServer();
// Run newsletter cron jobs
require('./newsletterCron');
