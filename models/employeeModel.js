const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, required: true },
  skills: { type: [String] },
  profileImage: { type: String },
  hireDate: { type: Date },
  department: { type: String },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
});

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
