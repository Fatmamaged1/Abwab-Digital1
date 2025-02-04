require("dotenv").config();
const mongoose = require("mongoose");
const sharp = require("sharp");
const express = require("express");

const User = require("./models/userModel");
const Blog = require("./models/blogModel");
const Employee = require("./models/employeeModel");
const Service = require("./models/servicesModel");
const Technology = require("./models/technologiesModel");
const Testimonial = require("./models/testimonialModel");
const Client = require("./models/clientModel");
const Contact = require("./models/contactModel");
const Project = require("./models/projectModel");
const MailingList = require("./models/MailingListModel");
const About = require("./models/aboutModel");
const Portfolio = require("./models/PortfolioModel"); // Added Portfolio Model

const app = express();

// Function to optimize logo image
async function optimizeLogo() {
  try {
    await sharp("./public/images/Abwab.jpg")
      .resize({ width: 40 }) // Resize width
      .jpeg({ quality: 80 }) // Compress JPEG quality
      .toFile("./public/images/Abwab-min.jpg"); // Save optimized image
    console.log("Logo optimized successfully!");
  } catch (err) {
    console.error("Error optimizing logo:", err);
  }
}

// Initialize AdminJS
async function setupAdminJS() {
  const { AdminJS } = await import("adminjs");
  const AdminJSExpress = await import("@adminjs/express");
  const AdminJSMongoose = await import("@adminjs/mongoose");

  AdminJS.registerAdapter(AdminJSMongoose);

  const adminJs = new AdminJS({
    databases: [mongoose],
    rootPath: "/admin",
    resources: [
      { resource: User, options: {} },
      { resource: Blog, options: {} },
      { resource: Employee, options: {} },
      { resource: Service, options: {} },
      { resource: Technology, options: {} },
      { resource: Testimonial, options: {} },
      { resource: Client, options: {} },
      { resource: Contact, options: {} },
      { resource: Project, options: {} },
      { resource: MailingList, options: {} },
      { resource: About, options: {} },
      { resource: Portfolio, options: {} }, // Added Portfolio
    ],
    branding: {
      companyName: "AbwabDigital",
      logo: "/public/images/Abwab-min.jpg",
      softwareBrothers: false,
    },
  });

  const router = AdminJSExpress.buildAuthenticatedRouter(
    adminJs,
    {
      authenticate: async (email, password) => {
        try {
          const user = await User.findOne({ email });
          if (user && user.isAdmin && (await user.comparePassword(password))) {
            return user;
          }
        } catch (err) {
          console.error("Authentication error:", err);
        }
        return null;
      },
      cookiePassword: process.env.SESSION_SECRET || "some-secret",
    },
    null,
    {
      resave: false,
      saveUninitialized: true,
    }
  );

  return { adminJs, router };
}

// Optimize logo when the server starts
optimizeLogo();

module.exports = setupAdminJS;
