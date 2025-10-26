// models/FormTemplate.js
const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  fieldType: { 
    type: String, 
    required: true, 
    enum: ['text', 'textarea', 'date', 'select', 'checkbox'] 
  },
  options: [String],
  required: { type: Boolean, default: false }
});

const formTemplateSchema = new mongoose.Schema({
  // UPDATED: 'name' is now required and unique to identify each form
  name: { type: String, required: true, unique: true },
  fields: [fieldSchema]
});

module.exports = mongoose.model('FormTemplate', formTemplateSchema);