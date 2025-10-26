const mongoose = require('mongoose');

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

module.exports = mongoose.model('User', userSchema);
