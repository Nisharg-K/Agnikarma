// server.js - Hospital Management Portal

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const Blog = require('./models/BLogs');


const app = express();
const PORT = process.env.PORT || 3000;


// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'doctor'], required: true },
  email: { type: String, required: true },
  phone: String,
  specialization: String,
  approved: { type: Boolean, default: false }
});


const accountRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
});

// Models
const User = mongoose.model('User', userSchema);
const Patient = require(path.join(__dirname, 'models/Patients.js'));
const AccountRequest = mongoose.model('AccountRequest', accountRequestSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'hospital-management-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 }
}));

// Helper: Serve HTML files
function serveHtmlFile(filePath, res) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Internal Server Error');
    res.send(data);
  });
}

// Auth Middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect('/login');
};

const isAdmin = (req, res, next) => {
  if (req.session.user?.role === 'admin') return next();
  res.status(403).send('Access Denied');
};

// Routes
app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) =>
  serveHtmlFile(path.join(__dirname, 'public/views/login.html'), res)
);

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !user.approved || !(await bcrypt.compare(password, user.password))) {
      return res.json({ success: false, error: 'Invalid credentials or approval pending' });
    }

    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role,
      fullName: user.fullName
    };

    res.json({ success: true, redirect: `/dashboard/${user.role}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Public: Serve the blog HTML page
app.get('/blogs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/views/blogs.html'));
});

// Public: Fetch all blogs
app.get('/api/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Only: Create a blog
app.post('/api/blogs', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { title, content } = req.body;
    const blog = new Blog({
      title,
      content,
      author: req.session.user.fullName
    });
    await blog.save();
    res.json({ success: true, blog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.get('/create-account', (req, res) =>
  serveHtmlFile(path.join(__dirname, 'public/views/create-account.html'), res)
);

app.post('/create-account', async (req, res) => {
  try {
    const { username, password, fullName, email, phone, specialization } = req.body;

    if (await User.findOne({ username })) {
      return res.json({ success: false, error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await new User({
      username,
      password: hashedPassword,
      fullName,
      email,
      phone,
      specialization,
      role: 'doctor',
      approved: false
    }).save();

    await new AccountRequest({ userId: newUser._id }).save();

    res.json({ success: true, message: 'Account request submitted. Await approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update a blog (admin only)
app.put('/api/blogs/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const updated = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, blog: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});


// Dashboard
app.get('/dashboard', isAuthenticated, (req, res) =>
  res.redirect(`/dashboard/${req.session.user.role}`)
);

app.get('/dashboard/admin', isAuthenticated, isAdmin, (req, res) =>
  serveHtmlFile(path.join(__dirname, 'public/views/admin-dashboard.html'), res)
);

app.get('/dashboard/doctor', isAuthenticated, (req, res) =>
  serveHtmlFile(path.join(__dirname, 'public/views/doctor-dashboard.html'), res)
);

// Dashboard Data APIs
app.get('/api/admin-dashboard-data', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [doctorCount, patientCount, pendingRequests, doctors, recentPatients] = await Promise.all([
      User.countDocuments({ role: 'doctor', approved: true }),
      Patient.countDocuments(),
      AccountRequest.countDocuments({ status: 'pending' }),
      User.find({ role: 'doctor', approved: true }).select('fullName specialization'),
      Patient.find().sort({ visitDate: -1 }).limit(5)
    ]);

    res.json({ user: req.session.user, stats: { doctorCount, patientCount, pendingRequests }, doctors, recentPatients });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/doctor-dashboard-data', isAuthenticated, async (req, res) => {
  try {
    const [doctor, patients] = await Promise.all([
      User.findById(req.session.user.id).select('-password'),
      Patient.find({ doctorAssigned: req.session.user.id })
    ]);

    res.json({ user: req.session.user, doctor, patients, patientCount: patients.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin account management
app.get('/api/admin/pending-requests', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const pending = await AccountRequest.find({ status: 'pending' })
      .populate('userId', 'username fullName email phone specialization');

    const formatted = pending.map(r => ({
      _id: r._id,
      username: r.userId.username,
      fullName: r.userId.fullName,
      email: r.userId.email,
      phone: r.userId.phone,
      specialization: r.userId.specialization,
      requestDate: r.requestDate
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/patients', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const patients = await Patient.find().populate('doctorAssigned', 'fullName');
    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/api/approve-account/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const request = await AccountRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );

    if (!request) return res.status(404).json({ error: 'Request not found' });

    await User.findByIdAndUpdate(request.userId, { approved: true });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/reject-account/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const request = await AccountRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );

    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Patient Form Route
app.get('/add-patient', (req, res) =>
  res.sendFile(path.join(__dirname, 'public/views/add-patient.html'))
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/add-patient', async (req, res) => {
  try {
    console.log("✅ Form submission received.");

    const newPatient = new Patient(req.body);
    await newPatient.save();

    res.send("Form Submitted & Patient Saved Successfully!");
  } catch (err) {
    console.error("❌ Error saving patient:", err);
    res.status(500).send("Error saving patient");
  }
});



// Doctor adds patient (API)
app.post('/api/patients', isAuthenticated, async (req, res) => {
  try {
    const { fullName, age, gender, diagnosis, treatment } = req.body;

    const patient = new Patient({
      fullName,
      age,
      gender,
      diagnosis,
      treatment,
      doctorAssigned: req.session.user.id
    });

    await patient.save();
    res.json({ success: true, patient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get doctor list
app.get('/api/admin/patients', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const patients = await Patient.find().populate('doctorAssigned', 'fullName');
    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/view-patient/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'views', 'view-patient.html'));
});

// Provide patient data as JSON
app.get('/api/view-patient/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    res.json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Profile
app.get('/api/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Initialize admin
const initAdminAccount = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await new User({
        username: 'admin',
        password: hashedPassword,
        fullName: 'System Administrator',
        role: 'admin',
        email: 'admin@hospital.com',
        approved: true
      }).save();
      console.log('Admin account created: admin / admin123');
    }
  } catch (err) {
    console.error('Admin init error:', err);
  }
};

mongoose.connect('mongodb+srv://Agnikarma:fRiOcgj1aMbVqRG9@agnikarma.n2fcm3b.mongodb.net/?retryWrites=true&w=majority&appName=Agnikarma', {

})
.then(async () => {
  console.log('MongoDB Connected');
  await initAdminAccount(); // ✅ Init admin only after DB connection
})
.catch(err => console.error('MongoDB Connection Error:', err));

module.exports = app;
