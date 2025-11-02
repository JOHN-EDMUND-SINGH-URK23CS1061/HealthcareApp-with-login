// Import Modules
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Use environment variable for MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

// 1. Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// 2. Define Schema and Model for Employees
const employeeSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  position: { type: String, required: true },
  basePay: { type: Number, default: 0, required: true },
  allowances: [{ name: String, amount: Number, _id: false }],
  deductions: [{ name: String, amount: Number, _id: false }],
  leaveBalances: [{ leaveType: String, balance: Number, _id: false }]
});

// 'Employee' is the model name, 'employees' is the collection name
const Employee = mongoose.model("Employee", employeeSchema, 'employees');

// --- Leave Schema and Model ---
const leaveSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employees', required: true },
  leaveType: { type: String, required: true },
  reason: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  appliedOn: { type: Date, default: Date.now }
});
const Leave = mongoose.model('Leave', leaveSchema, 'leaves');

// --- Attendance Schema and Model ---
const attendanceSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'employees', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD format
    status: { type: String, enum: ['Present', 'Absent', 'Half-day', 'Leave'], required: true }
});
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
const Attendance = mongoose.model('Attendance', attendanceSchema, 'attendances');

// 3. Define Schema and Model for Users
const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['employee', 'hr'], default: 'employee' },
  created_at: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema, 'users');

// --- Employee CRUD APIs ---

// API to view all employees (Read)
app.get("/api/employees", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.send(employees);
  } catch (err) {
    res.status(500).json({ status: "Error fetching employees", error: err.message });
  }
});

// API to add a new employee (Create)
app.post("/api/employees/new", async (req, res) => {
  try {
    const { employeeName, employeeId, department, position, basePay } = req.body;
    // Initialize with default leave balances
    const newEmployee = new Employee({
      employeeName, employeeId, department, position, basePay,
      leaveBalances: [
        { leaveType: 'Casual', balance: 12 },
        { leaveType: 'Sick', balance: 6 }
      ]
    });
    await newEmployee.save();
    res.json({ status: "Employee Added Successfully" });
  } catch (err) {
    res.status(500).json({ status: err.message });
  }
});

// API to delete an employee (Delete)
app.post("/api/employees/delete", async (req, res) => {
  const { id } = req.body;
  try {
    await Employee.findByIdAndDelete(id);
    res.json({ status: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: "Error deleting employee" });
  }
});

// API to update an employee (Update)
app.post("/api/employees/update", async (req, res) => {
    try {
        const { id, basePay, ...updateData } = req.body;
        if (basePay !== undefined) {
          updateData.basePay = basePay;
        }
        await Employee.findByIdAndUpdate(id, { $set: updateData });
        res.json({ status: "Employee Updated Successfully" });
    } catch (err) {
        res.status(500).json({ status: "Error updating employee", error: err.message });
    }
});

// --- APIs for Employees (Self-service) ---

// Get details for the logged-in employee
app.get('/api/me/details', async (req, res) => {
  try {
    // This is a placeholder for authentication. In a real app, you'd get the user from a token.
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ status: 'Username is required' });
    }
    const employee = await Employee.findOne({ employeeId: username });
    if (!employee) {
      return res.status(404).json({ status: 'Employee not found' });
    }
    res.send(employee);
  } catch (err) {
    res.status(500).json({ status: 'Error fetching employee details', error: err.message });
  }
});

// Apply for leave
app.post('/api/leaves/apply', async (req, res) => {
  try {
    const { employeeId, leaveType, reason, startDate, endDate } = req.body;
    const newLeave = new Leave({ employee: employeeId, leaveType, reason, startDate, endDate });
    await newLeave.save();
    res.status(201).json({ status: 'Leave application submitted successfully.' });
  } catch (err) {
    res.status(500).json({ status: 'Error submitting leave application.', error: err.message });
  }
});

// Get my leave applications
app.get('/api/leaves/my-leaves', async (req, res) => {
  try {
    const { employeeId } = req.query; // In a real app, get this from auth
    const leaves = await Leave.find({ employee: employeeId }).sort({ appliedOn: -1 });
    res.send(leaves);
  } catch (err) {
    res.status(500).json({ status: 'Error fetching leave applications.', error: err.message });
  }
});

// --- User Authentication APIs ---

// API to handle User Registration
app.post("/api/register", async (req, res) => {
    try {
        const { full_name, email, username, password, role } = req.body;
        const existingUser = await User.findOne({ $or: [{ email: email }, { username: username }] });
        if (existingUser) {
            return res.status(400).json({ status: "User already exists. Check username or email." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ full_name, email, username, password: hashedPassword, role: role || 'employee' });
        await newUser.save();
        res.status(201).json({ status: "Registration successful!" });
    } catch (err) {
        res.status(500).json({ status: "Server error during registration.", error: err.message });
    }
});

// API to handle User Login
app.post("/api/login", async (req, res) => {
    try {
        const { identifier, password, role } = req.body;
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
        if (!user) {
            return res.status(401).json({ status: "Invalid Credentials: User not found." });
        }
        if (user.role !== role) {
            return res.status(401).json({ status: `Access Denied: You are not registered as ${role}.` });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: "Invalid Credentials: Password incorrect." });
        }
        res.json({ 
            status: "Login successful!", 
            user: { username: user.username, full_name: user.full_name, role: user.role } 
        });
    } catch (err) {
        res.status(500).json({ status: "Server error during login.", error: err.message });
    }
});

// --- Start the server ---

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));


module.exports = app;
