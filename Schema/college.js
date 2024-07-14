const mongoose = require("mongoose");

const Schema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true }, 
    college: { type: String },
    place: { type: String },
});

const College = mongoose.model("colleges", Schema);

module.exports = College;
