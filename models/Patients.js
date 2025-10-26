// models/Patients.js
const mongoose = require('mongoose');

// NEW: Sub-schema for daily notes
const dailyNoteSchema = new mongoose.Schema({
  noteDate: { type: Date, default: Date.now },
  noteText: { type: String, required: true },
  gDriveLink: { type: String } // Will store the Google Drive URL
});

// NEW: Sub-schema for attached forms
const attachedFormSchema = new mongoose.Schema({
    formName: { type: String, required: true },
    formData: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
});

const patientSchema = new mongoose.Schema({
  // --- Original Static CRF Fields ---
  patientName: String,
  // ... (keep all your other original fields like registerNo, srNo, etc.)
  consultantSignature: String,

  // --- UPDATED: from customFields to attachedForms ---
  attachedForms: [attachedFormSchema],

  // --- NEW: Daily Notes Section ---
  dailyNotes: [dailyNoteSchema],

  // --- Internal Fields ---
  createdAt: { type: Date, default: Date.now },
  doctorAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Patient', patientSchema);