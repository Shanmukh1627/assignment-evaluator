// server/models/Submission.js
const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  studentName: String,
  assignmentTitle: String,
  content: String,
  score: Number,
  plagiarismRisk: Number, 
  aiFeedback: String,
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', SubmissionSchema);