// models/Patients.js
const mongoose = require('mongoose');

// Sub-schema for daily notes
const dailyNoteSchema = new mongoose.Schema({
  noteDate: { type: Date, default: Date.now },
  noteText: { type: String, required: true },
  gDriveLink: { type: String } 
});

// Sub-schema for attached forms
const attachedFormSchema = new mongoose.Schema({
    formName: { type: String, required: true },
    formData: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
});

const patientSchema = new mongoose.Schema({
  // --- THIS IS THE FIX ---
  registerNo: { 
    type: String, 
    unique: true, 
    required: [true, 'A unique Register No. is required.'] 
  },
  
  // --- Original Static CRF Fields ---
  srNo: String,
  patientName: String,
  ageGender: String,
  opdNo: String,
  // ... (keep all your other fields: address, phoneNo, etc.) ...
  // ...
  consultantSignature: String,

  // --- Dynamic Sections ---
  attachedForms: [attachedFormSchema],
  dailyNotes: [dailyNoteSchema],

  // --- Internal Fields ---
  createdAt: { type: Date, default: Date.now },
  doctorAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Patient', patientSchema);
