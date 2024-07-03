const mongoose = require("mongoose");
const User = require("./models/userModel"); // Adjust the path to your User model

const Blog = require("./models/blogModel");
const Employee = require("./models/employeeModel");
const Service = require("./models/servicesModel");
const Technology = require("./models/technologiesModel");
const Testimonial = require("./models/testimonialModel");
const Client = require("./models/clientModel");
const Contact = require("./models/contactModel");
const Project = require("./models/projectModel");
const MailingList = require("./models/MailingListModel");
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
    ],
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
