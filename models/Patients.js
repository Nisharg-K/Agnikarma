const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  registerNo: String,
  srNo: String,
  patientName: String,
  age: Number,
  gender: String,
  opdNo: String,
  address: String,
  date: Date,
  maritalStatus: String,
  occupation: String,
  socioEcoStatus: [String], // e.g. ["Poor", "Middle Class"]

  diagnosisGroup: String, // "Group A" or "Group B"
  sittingDates: {
    first: Date,
    second: Date
  },
  followUpDates: {
    first: Date,
    second: Date
  },
  completionDate: Date,
  dropOut: String,

  chiefComplaints: [{
    symptom: String,
    present: Boolean,
    duration: String
  }],

  visitSchedule: [{
    day: String,
    date: Date
  }],

  history: {
    presentIllness: String,
    pastHistory: String,
    medicationSurgeryHistory: String,
    similarComplaints: String,
    familyHistory: {
      musculoSkeletal: Boolean,
      otherComplaints: Boolean
    }
  },

  personalHistory: {
    ahara: String,
    vihara: String,
    bowel: String,
    sleep: String,
    micturition: String,
    habitat: String,
    education: String,
    appetite: String,
    natureOfWork: String,
    workingHours: String,
    allergy: Boolean,
    mentalStatus: String
  },

  generalExamination: {
    built: String,
    nutrition: String,
    clubbing: String,
    pallor: String,
    tongue: String,
    pulse: String,
    bloodPressure: String,
    temperature: String,
    height: String,
    weight: String,
    bmi: String
  },

  systemicExamination: {
    cardiovascular: String,
    respiratory: String,
    cns: String,
    gis: String
  },

  ashtavidhaPariksha: {
    nadi: String,
    mala: String,
    mutra: String,
    jihva: String,
    shabda: String,
    sparsha: String,
    drika: String,
    akriti: String
  },

  localExamination: {
    inspection: String,
    palpation: {
      tenderness: Boolean,
      raisedTemp: Boolean,
      crepitus: Boolean,
      spasm: Boolean,
      swelling: Boolean
    },
    rangeOfMovement: String
  },

  investigations: {
    cbc: String,
    rbs: String,
    hivHbsagVdrl: String,
    xray: String
  },

  agnikarma: {
    adverseEffects: String,
    rescueMedicine: String
  },

  score: [{
    label: String,
    vasScore: Number,
    neckDisabilityIndex: Number
  }],

  assessmentCriteria: {
    vasScoreBefore: Number,
    vasScoreAfter: Number,
    vasRemarks: String,
    ndiBefore: Number,
    ndiAfter: Number,
    ndiRemarks: String
  },

  result: {
    status: {
      type: String,
      enum: ['Relieved', 'Marked Improvement', 'Moderate Improvement', 'Mild Improvement', 'Unchanged']
    },
    guideSignature: String,
    scholarSignature: String
  },

  doctorAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', patientSchema);
