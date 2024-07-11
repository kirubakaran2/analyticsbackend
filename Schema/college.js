const mongoose = require("mongoose");

const Schema = new mongoose.Schema({
    
    college: { type: String },
    place: { type: String },
});

const College = mongoose.model("colleges", Schema);

module.exports = College;
