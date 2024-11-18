const mongoose = require("mongoose");
const sharp = require("sharp");
const User = require("./models/userModel"); // Adjust the path to your User model
sharp("./public/images/Abwab.jpg")

  .resize({ width: 40 }) // Resize width to 300px (adjust if needed)
  .jpeg({ quality: 80 }) // Compress JPEG quality to 80%
  .toFile("./public/images/Abwab-min.jpg") // Save minimized image
  .then(() => console.log("Logo optimized successfully!"))
  .catch((err) => console.error("Error optimizing logo:", err));
const Blog = require("./models/blogModel");
const Employee = require("./models/employeeModel");
const Service = require("./models/servicesModel");
const Technology = require("./models/technologiesModel");
const Testimonial = require("./models/testimonialModel");
const Client = require("./models/clientModel");
const Contact = require("./models/contactModel");
const Project = require("./models/projectModel");
const MailingList = require("./models/MailingListModel");
const About =require ("./models/aboutModel")
const express = require("express");
// Initialize the express application
const app = express();

async function setupAdminJS() {
  const { AdminJS } = await import("adminjs");
  const AdminJSExpress = await import("@adminjs/express");
  const AdminJSMongoose = await import("@adminjs/mongoose");

  // Register the adapter
  AdminJS.registerAdapter(AdminJSMongoose);

  // Create an instance of AdminJS
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
    ],
    branding: {
      companyName: "AbwabDigital",
      logo: "/public/images/Abwab-min.jpg",
      softwareBrothers: false,
    },
    rootPath: "/admin",
  });

  // Set up the router with authentication
  const router = AdminJSExpress.buildAuthenticatedRouter(
    adminJs,
    {
      authenticate: async (email, password) => {
        const user = await User.findOne({ email });
        if (user && user.isAdmin && (await user.comparePassword(password))) {
          return user;
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

module.exports = setupAdminJS;
