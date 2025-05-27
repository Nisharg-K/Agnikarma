// server.js - Main server file for Hospital Management Portal

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hospital_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Define Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'doctor'], required: true },
  email: { type: String, required: true },
  phone: { type: String },
  specialization: { type: String }, // For doctors
  approved: { type: Boolean, default: false } // For account approval
});

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  contactInfo: { type: String, required: true },
  diagnosis: { type: String },
  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  medicalHistory: { type: String },
  admissionDate: { type: Date, default: Date.now }
});

const accountRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
});

// Create models
const User = mongoose.model('User', userSchema);
const Patient = mongoose.model('Patient', patientSchema);
const AccountRequest = mongoose.model('AccountRequest', accountRequestSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'hospital-management-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 } // 1 hour
}));

// Helper function to serve HTML files
function serveHtmlFile(filePath, res) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.send(data);
  });
}

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
};

const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).send('Access Denied: Admin privileges required');
};

// Routes

// Home route
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Login route
app.get('/login', (req, res) => {
  serveHtmlFile(path.join(__dirname, 'public','views', 'login.html'), res);
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.json({ success: false, error: 'Invalid username or password' });
    }
    
    // Check if user is approved
    if (!user.approved) {
      return res.json({ success: false, error: 'Your account is pending approval' });
    }
    
    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, error: 'Invalid username or password' });
    }
    
    // Set session
    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role,
      fullName: user.fullName
    };
    
    // Redirect based on role
    if (user.role === 'admin') {
      return res.json({ success: true, redirect: '/dashboard/admin' });
    } else {
      return res.json({ success: true, redirect: '/dashboard/doctor' });
    }
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Create account route
app.get('/create-account', (req, res) => {
  serveHtmlFile(path.join(__dirname, 'public','views', 'create-account.html'), res);
});

app.post('/create-account', async (req, res) => {
  try {
    const { username, password, fullName, email, phone, specialization } = req.body;
    
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({ success: false, error: 'Username already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user (not approved yet)
    const newUser = new User({
      username,
      password: hashedPassword,
      fullName,
      email,
      phone,
      specialization,
      role: 'doctor', // All new accounts are doctors
      approved: false
    });
    
    await newUser.save();
    
    // Create account request
    const newRequest = new AccountRequest({
      userId: newUser._id
    });
    
    await newRequest.save();
    
    res.json({ success: true, message: 'Account request submitted successfully. Please wait for admin approval.' });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Dashboard routes
app.get('/dashboard', isAuthenticated, (req, res) => {
  if (req.session.user.role === 'admin') {
    res.redirect('/dashboard/admin');
  } else {
    res.redirect('/dashboard/doctor');
  }
});

// Admin dashboard
app.get('/dashboard/admin', isAuthenticated, isAdmin, (req, res) => {
  serveHtmlFile(path.join(__dirname, 'public','views', 'admin-dashboard.html'), res);
});

// Get admin dashboard data
app.get('/api/admin-dashboard-data', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get counts
    const doctorCount = await User.countDocuments({ role: 'doctor', approved: true });
    const patientCount = await Patient.countDocuments();
    const pendingRequests = await AccountRequest.countDocuments({ status: 'pending' });
    
    // Get doctors
    const doctors = await User.find({ role: 'doctor', approved: true }).select('fullName specialization');
    
    // Get recent patients
    const recentPatients = await Patient.find().sort({ admissionDate: -1 }).limit(5).populate('assignedDoctor', 'fullName');
    
    res.json({
      user: req.session.user,
      stats: {
        doctorCount,
        patientCount,
        pendingRequests
      },
      doctors,
      recentPatients
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Doctor dashboard
app.get('/dashboard/doctor', isAuthenticated, (req, res) => {
  serveHtmlFile(path.join(__dirname, 'public','views', 'doctor-dashboard.html'), res);
});

// Get doctor dashboard data
app.get('/api/doctor-dashboard-data', isAuthenticated, async (req, res) => {
  try {
    // Get doctor's patients
    const patients = await Patient.find({ assignedDoctor: req.session.user.id });
    
    // Get doctor profile
    const doctor = await User.findById(req.session.user.id).select('-password');
    
    res.json({
      user: req.session.user,
      doctor,
      patients,
      patientCount: patients.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// API routes for admin functions

// Get pending account requests
// Get pending account requests
app.get('/api/admin/pending-requests', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const pendingRequests = await AccountRequest.find({ status: 'pending' })
      .populate('userId', 'username fullName email phone specialization');
    
    // Map to format that matches our frontend expectations
    const formattedRequests = pendingRequests.map(request => {
      return {
        _id: request._id,
        username: request.userId.username,
        fullName: request.userId.fullName,
        email: request.userId.email,
        phone: request.userId.phone,
        specialization: request.userId.specialization,
        requestDate: request.requestDate
      };
    });
    
    res.json(formattedRequests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Approve account request
app.post('/api/approve-account/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const request = await AccountRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // Update account request status
    request.status = 'approved';
    await request.save();
    
    // Update user approved status
    await User.findByIdAndUpdate(request.userId, { approved: true });
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject account request
app.post('/api/reject-account/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const request = await AccountRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // Update account request status
    request.status = 'rejected';
    await request.save();
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add patient
app.post('/api/patients', isAuthenticated, async (req, res) => {
  try {
    const { name, age, gender, contactInfo, diagnosis, medicalHistory, doctorId } = req.body;
    
    const newPatient = new Patient({
      name,
      age,
      gender,
      contactInfo,
      diagnosis,
      medicalHistory,
      assignedDoctor: doctorId || (req.session.user.role === 'doctor' ? req.session.user.id : null)
    });
    
    await newPatient.save();
    
    res.json({ success: true, patient: newPatient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all doctors (for admin patient assignment)
app.get('/api/doctors', isAuthenticated, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', approved: true }).select('_id fullName specialization');
    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
app.get('/api/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Initialize admin account if none exists
const initAdminAccount = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const admin = new User({
        username: 'admin',
        password: hashedPassword,
        fullName: 'System Administrator',
        role: 'admin',
        email: 'admin@hospital.com',
        approved: true
      });
      
      await admin.save();
      console.log('Admin account created: username: admin, password: admin123');
    }
  } catch (err) {
    console.error('Error creating admin account:', err);
  }
};

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initAdminAccount();
});