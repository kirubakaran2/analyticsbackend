const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentScoresSchema = new Schema({
  exams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam'
  }],
  overallObtainPoint: {
    type: Number,
    required: true
  },
  overallPoint: {
    type: Number,
    required: true
  },
  studentid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('StudentScores', studentScoresSchema);
