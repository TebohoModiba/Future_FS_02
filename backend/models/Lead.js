const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  message: String,
  source: { type: String, default: "Website Contact Form" },
  status: { 
    type: String, 
    enum: ["new", "contacted", "converted"], 
    default: "new" 
  },
  notes: [{
    text: String,
    date: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', leadSchema);