const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  registerNo: String,
  srNo: String,
  patientName: String,
  ageGender: String,
  opdNo: String,
  address: String,
  regDate: Date,
  maritalStatus: String,
  occupation: String,

  socioStatus: [String], // Can be ['Poor', 'Middle Class', 'Rich']

  group: { type: String, enum: ['Group A', 'Group B'] },
  sitting1: Date,
  sitting2: Date,
  followUp1: Date,
  followUp2: Date,
  completionDate: Date,
  dropout: String,

  // Chief Complaints
  cc_pain: { type: String, enum: ['Present', 'Absent'] },
  cc_stiffness: { type: String, enum: ['Present', 'Absent'] },
  cc_movement: { type: String, enum: ['Present', 'Absent'] },
  cc_headache: { type: String, enum: ['Present', 'Absent'] },
  cc_numbness: { type: String, enum: ['Present', 'Absent'] },

  // Visit Schedule
  visit1: Date,
  visit15: Date,
  visit22: Date,
  visit29: Date,

  // History
  presentIllness: String,
  pastHistory: String,
  similarComplaints: String,
  fh_msk: { type: String, enum: ['Yes', 'No'] },
  fh_other: { type: String, enum: ['Yes', 'No'] },

  // Result
  result: {
    type: String,
    enum: ['Relieved', 'Marked Improvement', 'Moderate Improvement', 'Mild Improvement', 'Unchanged']
  },

  // Signatures
  guideSignature: String,
  scholarSignature: String,

  // Internal (optional)
  createdAt: { type: Date, default: Date.now },
  doctorAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Patient', patientSchema);
