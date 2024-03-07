const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String },
  skills: { type: [String] },
  profileImage: { type: String },
  hireDate: { type: Date },
  department: { type: String , enum: ["Front-End", "Back-End", "Mobile", "Cloud" ,"HR", "IT", "Finance", "Marketing", "Operations", "Sales", "Other"]},
  manager: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
});

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
