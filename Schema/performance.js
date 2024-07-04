const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    studentid: {type: mongoose.Schema.Types.ObjectId},
    examid: {type: mongoose.Schema.Types.ObjectId},
    section: {type: mongoose.Schema.Types.ObjectId},
    category: {type: String},
    score: {type: [Object]},
    points: {type: Number},
    obtainpoint: {type: Number}
})

const Performance = new mongoose.model("Performance",Schema)

module.exports = Performance