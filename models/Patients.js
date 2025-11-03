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
  // --- Core / Demographics ---
  registerNo: { 
    type: String, 
    unique: true, 
    required: [true, 'A unique Register No. is required.'] 
  },
  patientName: String,
  opdNo: String,
  ipdNo: String,
  address: String,
  phoneNo: String,
  religion: String,
  age: String,
  sex: String,
  maritalStatus: String,
  occupation: String,
  relativeNameAddress: String,
  
  // --- History ---
  chiefComplaints: String,
  presentIllness: String,
  pastHistory: String,
  familyHistory: String,

  // --- Personal History ---
  personalAhara: String,
  personalAddiction: String,
  personalBowelHabit: String,
  personalUrineFreq: String,

  // --- General Examination ---
  genPulse: String,
  genRR: String,
  genHR: String,
  genBP: String,
  genTemp: String,
  genGait: String,
  genIcterus: String,
  genEdema: String,

  // --- Systemic Examination ---
  sysLocomotor: String,
  sysRespiratory: String,
  sysCardiovascular: String,
  sysGastro: String,
  sysCNS: String,
  sysGenitoUrinary: String,

  // --- Investigations (These will now be saved) ---
  pathologicalInvestigation: String,
  radiologicalFindings: String,

  // --- Diagnosis & Treatment (These will also be saved) ---
  diagnosis: String,
  treatmentPrinciple: String,
  treatment: String,
  dietRegimen: String,
  
  // --- Signatures ---
  department: String,
  consultantSignature: String,

  // --- Dynamic Sections (Already Correct) ---
  attachedForms: [attachedFormSchema],
  dailyNotes: [dailyNoteSchema],

  // --- Internal Fields ---
  createdAt: { type: Date, default: Date.now },
  doctorAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Patient', patientSchema);
